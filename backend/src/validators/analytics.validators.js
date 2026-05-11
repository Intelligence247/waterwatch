import { z } from "zod";

export const duplicateReviewInsightsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    days: z.coerce.number().int().min(1).max(365).default(30),
  }),
});
