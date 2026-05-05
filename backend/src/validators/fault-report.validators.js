import { z } from "zod";

const objectIdLike = /^[a-fA-F0-9]{24}$/;
const reportStatus = z.enum(["pending", "verified", "dismissed", "resolved"]);

const baseEnvelope = {
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
};

export const createFaultReportSchema = z.object({
  ...baseEnvelope,
  body: z.object({
    waterpointId: z.string().regex(objectIdLike).optional().nullable(),
    reporterName: z.string().trim().min(2).max(120),
    reporterPhone: z.string().trim().max(30).optional(),
    description: z.string().trim().min(10).max(2000),
    photoUrl: z.string().url().optional().or(z.literal("")),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    community: z.string().trim().min(2).max(120),
  }),
});

export const listFaultReportsSchema = z.object({
  ...baseEnvelope,
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().trim().max(100).optional(),
    status: reportStatus.optional(),
    community: z.string().trim().max(120).optional(),
    waterpointId: z.string().regex(objectIdLike).optional(),
    reporterPhone: z.string().trim().max(30).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const getFaultReportByIdSchema = z.object({
  ...baseEnvelope,
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid report id"),
  }),
});

export const updateFaultReportStatusSchema = z.object({
  ...baseEnvelope,
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid report id"),
  }),
  body: z.object({
    status: reportStatus,
    resolutionNote: z.string().trim().max(1000).optional(),
  }),
});
