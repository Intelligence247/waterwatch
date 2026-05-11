import { Router } from "express";
import {
  createWaterpoint,
  deleteWaterpoint,
  getWaterpointById,
  getWaterpointDedupeAudit,
  listDuplicateReviewQueue,
  listWaterpoints,
  resolveDuplicateReview,
  updateWaterpoint,
} from "../controllers/waterpoint.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createWaterpointSchema,
  deleteWaterpointSchema,
  getWaterpointByIdSchema,
  listDuplicateAuditSchema,
  listDuplicateReviewQueueSchema,
  listWaterpointsSchema,
  resolveDuplicateReviewSchema,
  updateWaterpointSchema,
} from "../validators/waterpoint.validators.js";

export const waterpointRouter = Router();

// Public/Citizen/Admin read endpoints
waterpointRouter.get("/", validate(listWaterpointsSchema), listWaterpoints);
waterpointRouter.get(
  "/dedupe-audit",
  requireAuth,
  requireRole("admin"),
  validate(listDuplicateAuditSchema),
  getWaterpointDedupeAudit,
);
waterpointRouter.get(
  "/review-queue",
  requireAuth,
  requireRole("admin"),
  validate(listDuplicateReviewQueueSchema),
  listDuplicateReviewQueue,
);
waterpointRouter.get("/:id", validate(getWaterpointByIdSchema), getWaterpointById);

// Admin-only write endpoints
waterpointRouter.post("/", requireAuth, requireRole("admin"), validate(createWaterpointSchema), createWaterpoint);
waterpointRouter.patch(
  "/:id/review",
  requireAuth,
  requireRole("admin"),
  validate(resolveDuplicateReviewSchema),
  resolveDuplicateReview,
);
waterpointRouter.patch("/:id", requireAuth, requireRole("admin"), validate(updateWaterpointSchema), updateWaterpoint);
waterpointRouter.delete("/:id", requireAuth, requireRole("admin"), validate(deleteWaterpointSchema), deleteWaterpoint);
