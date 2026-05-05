import { z } from "zod";

const objectIdLike = /^[a-fA-F0-9]{24}$/;

const waterpointType = z.enum(["borehole", "well", "tap"]);
const waterpointStatus = z.enum(["functional", "faulty", "under_repair"]);

const stringTrimmed = z.string().trim();

const createBody = z.object({
  name: stringTrimmed.min(2).max(160),
  type: waterpointType,
  status: waterpointStatus.default("functional"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  community: stringTrimmed.min(2).max(120),
  lga: stringTrimmed.min(2).max(120),
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
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().trim().max(100).optional(),
    type: waterpointType.optional(),
    status: waterpointStatus.optional(),
    community: stringTrimmed.max(120).optional(),
    lga: stringTrimmed.max(120).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "name", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});
