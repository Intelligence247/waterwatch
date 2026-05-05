import { z } from "zod";

const objectIdLike = /^[a-fA-F0-9]{24}$/;

export const createCommentSchema = z.object({
  body: z.object({
    waterpointId: z.string().regex(objectIdLike, "Invalid waterpoint id").optional(),
    content: z.string().trim().min(2).max(1000),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listCommentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    waterpointId: z.string().regex(objectIdLike, "Invalid waterpoint id").optional(),
  }),
});

export const deleteCommentSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().regex(objectIdLike, "Invalid comment id"),
  }),
});
