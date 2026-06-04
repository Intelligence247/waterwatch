import { z } from "zod";

const objectIdLike = /^[a-fA-F0-9]{24}$/;
const userStatus = z.enum(["active", "suspended", "blocked"]);

const baseEnvelope = {
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
};

export const listUsersSchema = z.object({
  ...baseEnvelope,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().trim().max(100).optional(),
    role: z.enum(["admin", "citizen"]).optional(),
    status: userStatus.optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "fullName", "email"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const updateUserStatusSchema = z.object({
  ...baseEnvelope,
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid user id"),
  }),
  body: z.object({
    status: userStatus,
    reason: z.string().trim().max(500).optional().nullable(),
  }),
});
