import { z } from "zod";
import { KWARA_LGAS } from "../config/constants.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: passwordSchema,
    role: z.enum(["admin", "citizen"]).optional(),
    phone: z.string().trim().min(5).max(30).optional(),
    community: z.string().trim().min(2).max(120).optional(),
    lga: z.enum(KWARA_LGAS, { required_error: "Local Government Area (LGA) is required" }),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const verifyEmailSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    token: z.string().min(1),
  }),
  params: z.object({}).optional(),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    newPassword: passwordSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const createAdminInviteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    expiresInHours: z.coerce.number().int().min(1).max(168).default(72),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listAdminInvitesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: z.enum(["active", "used", "revoked", "expired", "all"]).default("active"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  params: z.object({}).optional(),
});

export const revokeAdminInviteSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid invite id"),
  }),
});

export const registerAdminWithInviteSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: passwordSchema,
    inviteToken: z.string().min(1),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().min(5).max(30).nullable().optional(),
    community: z.string().trim().min(2).max(120).nullable().optional(),
    lga: z.enum(KWARA_LGAS).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

