import { Router } from "express";
import {
  getAdminOverview,
  getCitizenOverview,
  getDuplicateReviewInsights,
} from "../controllers/analytics.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { duplicateReviewInsightsSchema } from "../validators/analytics.validators.js";

export const analyticsRouter = Router();

analyticsRouter.get("/admin-overview", requireAuth, requireRole("admin"), getAdminOverview);
analyticsRouter.get("/citizen-overview", requireAuth, requireRole("citizen", "admin"), getCitizenOverview);
analyticsRouter.get(
  "/duplicate-review-insights",
  requireAuth,
  requireRole("admin"),
  validate(duplicateReviewInsightsSchema),
  getDuplicateReviewInsights,
);
