import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    waterpointMinDistanceMeters: z.number().int().min(1).max(500).optional(),
    waterpointReviewDistanceMeters: z.number().int().min(1).max(2000).optional(),
    waterpointAuditDistanceMeters: z.number().int().min(1).max(2000).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
