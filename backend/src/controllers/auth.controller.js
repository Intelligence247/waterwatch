import bcrypt from "bcryptjs";
import { loadEnv } from "../config/env.js";
import { HttpError } from "../middleware/errorHandler.js";
import { AdminInvite } from "../models/admin-invite.model.js";
import { User } from "../models/user.model.js";
import { sendAdminInviteEmail, sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service.js";
import {
  createRandomToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const REFRESH_COOKIE_NAME = "refreshToken";

function getBackendPublicUrl(env) {
  if (!env.BACKEND_PUBLIC_URL) {
    throw new HttpError(500, "Email links are not configured on this server");
  }

  return env.BACKEND_PUBLIC_URL;
}

function toPublicUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone,
    community: user.community,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function setRefreshCookie(res, token, isProduction) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

async function issueAndPersistTokens(user, env) {
  const payload = { sub: String(user._id), role: user.role };
  const accessToken = signAccessToken(payload, env);
  const refreshToken = signRefreshToken(payload, env);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
}

async function createAndSendVerification(user, env) {
  const rawToken = createRandomToken();
  user.emailVerificationTokenHash = hashToken(rawToken);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await user.save();

  const verificationUrl = `${getBackendPublicUrl(env)}/api/auth/verify-email?token=${rawToken}`;
  await sendVerificationEmail({
    to: user.email,
    fullName: user.fullName,
    verificationUrl,
  });
}

async function createAndSendPasswordReset(user, env) {
  const rawToken = createRandomToken();
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  await user.save();

  const resetUrl = `${getBackendPublicUrl(env)}/api/auth/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.fullName,
    resetUrl,
  });
}

export async function register(req, res) {
  const env = loadEnv();
  const { fullName, email, password, role, phone, community } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();
  const requestedRole = role ?? "citizen";

  if (requestedRole !== "citizen") {
    throw new HttpError(403, "Public registration is limited to citizen accounts");
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new HttpError(409, "User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash,
    role: "citizen",
    phone: phone ?? null,
    community: community ?? null,
    emailVerified: false,
  });

  await createAndSendVerification(user, env);

  res.status(201).json({
    message: "Registration successful. Please verify your email.",
    user: toPublicUser(user),
  });
}

export async function verifyEmail(req, res) {
  const { token } = req.validated.query;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new HttpError(400, "Verification link is invalid or expired");
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  res.json({ message: "Email verified successfully. You can now log in." });
}

export async function resendVerification(req, res) {
  const env = loadEnv();
  const { email } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  if (user.emailVerified) {
    throw new HttpError(400, "Email is already verified");
  }

  await createAndSendVerification(user, env);
  res.json({ message: "Verification email sent" });
}

export async function login(req, res) {
  const env = loadEnv();
  const { email, password } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) throw new HttpError(401, "Invalid email or password");

  if (!user.emailVerified) {
    throw new HttpError(403, "Please verify your email before login");
  }

  const tokens = await issueAndPersistTokens(user, env);
  setRefreshCookie(res, tokens.refreshToken, env.NODE_ENV === "production");

  res.json({
    message: "Login successful",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: toPublicUser(user),
  });
}

export async function refreshToken(req, res) {
  const env = loadEnv();
  const bodyToken = req.validated.body.refreshToken;
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const incomingRefreshToken = bodyToken || cookieToken;
  if (!incomingRefreshToken) throw new HttpError(401, "Refresh token is required");

  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken, env);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.refreshTokenHash) {
    throw new HttpError(401, "Invalid refresh session");
  }

  const incomingHash = hashToken(incomingRefreshToken);
  if (incomingHash !== user.refreshTokenHash) {
    throw new HttpError(401, "Refresh token mismatch");
  }

  const tokens = await issueAndPersistTokens(user, env);
  setRefreshCookie(res, tokens.refreshToken, env.NODE_ENV === "production");

  res.json({
    message: "Token refreshed",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function logout(req, res) {
  const bodyToken = req.body?.refreshToken;
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const incomingRefreshToken = bodyToken || cookieToken;

  if (incomingRefreshToken) {
    const tokenHash = hashToken(incomingRefreshToken);
    const user = await User.findOne({ refreshTokenHash: tokenHash });
    if (user) {
      user.refreshTokenHash = null;
      await user.save();
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME);
  res.json({ message: "Logout successful" });
}

export async function getMe(req, res) {
  const user = await User.findById(req.authUser.id).lean();
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: toPublicUser(user) });
}

export async function forgotPassword(req, res) {
  const env = loadEnv();
  const { email } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (user) {
    await createAndSendPasswordReset(user, env);
  }

  // Generic response to avoid account enumeration
  res.json({
    message: "If that email exists, a password reset link has been sent.",
  });
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.validated.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new HttpError(400, "Reset token is invalid or expired");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.refreshTokenHash = null;
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME);
  res.json({ message: "Password reset successful. Please log in again." });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.validated.body;

  const user = await User.findById(req.authUser.id);
  if (!user) throw new HttpError(404, "User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new HttpError(401, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.refreshTokenHash = null;
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME);
  res.json({ message: "Password changed successfully. Please log in again." });
}

export async function createAdminInvite(req, res) {
  const env = loadEnv();
  const { email, expiresInHours } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existingAdmin = await User.findOne({ email: normalizedEmail, role: "admin" }).lean();
  if (existingAdmin) {
    throw new HttpError(409, "An admin account with this email already exists");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);
  const inviteToken = createRandomToken();
  const tokenHash = hashToken(inviteToken);

  const invite = await AdminInvite.create({
    tokenHash,
    email: normalizedEmail,
    invitedBy: req.authUser.id,
    expiresAt,
  });

  const registerUrl = `${env.CLIENT_ORIGIN}/register`;
  const loginUrl = `${env.CLIENT_ORIGIN}/login`;
  let emailSent = false;
  try {
    await sendAdminInviteEmail({
      to: invite.email,
      inviteToken,
      registerUrl,
      loginUrl,
      expiresAt: invite.expiresAt,
    });
    emailSent = true;
  } catch (err) {
    // Invite is still created even if email delivery fails.
    // The UI can show the token as a fallback.
    // eslint-disable-next-line no-console
    console.error("Failed to send admin invite email:", err);
  }

  res.status(201).json({
    message: "Admin invite created",
    emailSent,
    invite: {
      id: String(invite._id),
      email: invite.email,
      expiresAt: invite.expiresAt,
      invitedBy: String(invite.invitedBy),
      createdAt: invite.createdAt,
      // Returned once so caller can send/store securely.
      inviteToken,
    },
  });
}

export async function listAdminInvites(req, res) {
  const { status, page, limit } = req.validated.query;
  const now = new Date();
  const filter = {};

  if (status === "active") {
    filter.usedAt = null;
    filter.revokedAt = null;
    filter.expiresAt = { $gt: now };
  } else if (status === "used") {
    filter.usedAt = { $ne: null };
  } else if (status === "revoked") {
    filter.revokedAt = { $ne: null };
  } else if (status === "expired") {
    filter.usedAt = null;
    filter.revokedAt = null;
    filter.expiresAt = { $lte: now };
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AdminInvite.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminInvite.countDocuments(filter),
  ]);

  res.json({
    items: items.map((inv) => ({
      id: String(inv._id),
      email: inv.email,
      invitedBy: String(inv.invitedBy),
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy ? String(inv.usedBy) : null,
      revokedAt: inv.revokedAt,
      createdAt: inv.createdAt,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function revokeAdminInvite(req, res) {
  const { id } = req.validated.params;
  const invite = await AdminInvite.findById(id);
  if (!invite) throw new HttpError(404, "Invite not found");

  if (invite.usedAt) throw new HttpError(400, "Invite already used");
  if (invite.revokedAt) throw new HttpError(400, "Invite already revoked");

  invite.revokedAt = new Date();
  await invite.save();
  res.json({ message: "Invite revoked successfully" });
}

export async function registerAdminWithInvite(req, res) {
  const env = loadEnv();
  const { fullName, email, password, inviteToken } = req.validated.body;
  const normalizedEmail = email.trim().toLowerCase();
  const tokenHash = hashToken(inviteToken);
  const now = new Date();

  const invite = await AdminInvite.findOne({
    tokenHash,
    email: normalizedEmail,
    usedAt: null,
    revokedAt: null,
    expiresAt: { $gt: now },
  });
  if (!invite) {
    throw new HttpError(400, "Invite is invalid, expired, revoked, or already used");
  }

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    throw new HttpError(409, "User already exists with this email");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName,
    email: normalizedEmail,
    passwordHash,
    role: "admin",
    emailVerified: false,
    phone: null,
    community: null,
  });

  invite.usedAt = new Date();
  invite.usedBy = user._id;
  await invite.save();

  await createAndSendVerification(user, env);

  res.status(201).json({
    message: "Admin registration successful. Please verify your email.",
    user: toPublicUser(user),
  });
}
