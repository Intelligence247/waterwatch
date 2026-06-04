import { loadEnv } from "../config/env.js";
import { HttpError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/user.model.js";

function parseBearer(authorizationHeader) {
  if (!authorizationHeader) return null;
  const [type, token] = authorizationHeader.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

export async function requireAuth(req, _res, next) {
  const token = parseBearer(req.headers.authorization);
  if (!token) throw new HttpError(401, "Missing or invalid authorization token");

  try {
    const env = loadEnv();
    const payload = verifyAccessToken(token, env);
    const user = await User.findById(payload.sub).lean();
    if (!user) throw new HttpError(401, "User no longer exists");

    if (user.status === "blocked") {
      throw new HttpError(403, "Your account has been blocked. Please contact support.");
    }
    if (user.status === "suspended") {
      throw new HttpError(403, `Your account is temporarily suspended${user.statusReason ? `: ${user.statusReason}` : "."}`);
    }

    req.authUser = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired authorization token");
  }
}

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.authUser) throw new HttpError(401, "Unauthorized");
    if (!allowedRoles.includes(req.authUser.role)) {
      throw new HttpError(403, "Forbidden");
    }
    next();
  };
}
