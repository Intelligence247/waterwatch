import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  createAdminInvite,
  forgotPassword,
  getMe,
  login,
  listAdminInvites,
  logout,
  registerAdminWithInvite,
  refreshToken,
  register,
  revokeAdminInvite,
  resetPassword,
  resendVerification,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  changePasswordSchema,
  createAdminInviteSchema,
  forgotPasswordSchema,
  loginSchema,
  listAdminInvitesSchema,
  refreshTokenSchema,
  registerSchema,
  registerAdminWithInviteSchema,
  revokeAdminInviteSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../validators/auth.validators.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/register-admin-with-invite", validate(registerAdminWithInviteSchema), registerAdminWithInvite);
authRouter.get("/verify-email", validate(verifyEmailSchema), verifyEmail);
authRouter.post("/resend-verification", validate(resendVerificationSchema), resendVerification);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", validate(refreshTokenSchema), refreshToken);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getMe);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);
authRouter.post("/admin-invites", requireAuth, requireRole("admin"), validate(createAdminInviteSchema), createAdminInvite);
authRouter.get("/admin-invites", requireAuth, requireRole("admin"), validate(listAdminInvitesSchema), listAdminInvites);
authRouter.delete(
  "/admin-invites/:id",
  requireAuth,
  requireRole("admin"),
  validate(revokeAdminInviteSchema),
  revokeAdminInvite,
);
