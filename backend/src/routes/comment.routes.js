import { Router } from "express";
import { createComment, deleteComment, listComments } from "../controllers/comment.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCommentSchema, deleteCommentSchema, listCommentsSchema } from "../validators/comment.validators.js";

export const commentRouter = Router();

commentRouter.get("/", requireAuth, requireRole("citizen", "admin"), validate(listCommentsSchema), listComments);
commentRouter.post("/", requireAuth, requireRole("citizen", "admin"), validate(createCommentSchema), createComment);
commentRouter.delete("/:id", requireAuth, requireRole("citizen", "admin"), validate(deleteCommentSchema), deleteComment);
