import { z } from "zod";
import { KWARA_LGAS } from "../config/constants.js";

const objectIdLike = /^[a-fA-F0-9]{24}$/;

const waterpointType = z.enum(["borehole", "well", "tap"]);
const waterpointStatus = z.enum(["functional", "faulty", "under_repair"]);
const duplicateReviewStatus = z.enum(["pending_review", "resolved_keep", "resolved_merged", "clear", "all"]);

const stringTrimmed = z.string().trim();

const createBody = z.object({
  name: stringTrimmed.min(2).max(160),
  type: waterpointType,
  status: waterpointStatus.default("functional"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  community: stringTrimmed.min(2).max(120),
  lga: z.enum(KWARA_LGAS, { errorMap: () => ({ message: "Invalid Local Government Area (LGA)" }) }),
  description: stringTrimmed.max(1000).optional().default(""),
  photoUrls: z.array(z.string().url()).max(5).optional().default([]),
  // Backward-compatibility for existing clients sending single image
  photoUrl: z.string().url().optional().or(z.literal("")),
});

const updateBody = createBody.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required for update",
);

export const createWaterpointSchema = z.object({
  body: createBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateWaterpointSchema = z.object({
  body: updateBody,
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid waterpoint id"),
  }),
});

export const getWaterpointByIdSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid waterpoint id"),
  }),
});

export const deleteWaterpointSchema = getWaterpointByIdSchema;

export const listWaterpointsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(1000).default(20),
    q: z.string().trim().max(100).optional(),
    type: waterpointType.optional(),
    status: waterpointStatus.optional(),
    community: stringTrimmed.max(120).optional(),
    lga: stringTrimmed.max(120).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "name", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const listDuplicateReviewQueueSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    status: duplicateReviewStatus.default("pending_review"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const listDuplicateAuditSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    distanceMeters: z.coerce.number().int().min(1).max(2000).optional(),
    maxItems: z.coerce.number().int().min(10).max(2000).default(400),
    type: waterpointType.optional(),
    community: stringTrimmed.max(120).optional(),
    includeResolved: z.coerce.boolean().default(false),
  }),
});

const updateWaterpointFields = createBody.partial();

export const resolveDuplicateReviewSchema = z
  .object({
    body: z
      .object({
        action: z.enum(["keep", "merge"]),
        mergeIntoWaterpointId: z.string().regex(objectIdLike, "Invalid mergeIntoWaterpointId").optional(),
        resolutionNote: z.string().trim().max(500).optional().default(""),
        leftUpdates: updateWaterpointFields.optional(),
        rightUpdates: updateWaterpointFields.optional(),
      })
      .refine(
        (body) => (body.action === "merge" ? Boolean(body.mergeIntoWaterpointId) : true),
        "mergeIntoWaterpointId is required when action is merge",
      ),
    query: z.object({}).optional(),
    params: z.object({
      id: z.string().regex(objectIdLike, "Invalid waterpoint id"),
    }),
  });

