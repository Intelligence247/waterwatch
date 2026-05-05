import { Router } from "express";
import { getAdminOverview, getCitizenOverview } from "../controllers/analytics.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const analyticsRouter = Router();

analyticsRouter.get("/admin-overview", requireAuth, requireRole("admin"), getAdminOverview);
analyticsRouter.get("/citizen-overview", requireAuth, requireRole("citizen", "admin"), getCitizenOverview);
