import { Router } from "express";
import {
  createFaultReport,
  getFaultReportById,
  listFaultReports,
  updateFaultReportStatus,
} from "../controllers/fault-report.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createFaultReportSchema,
  getFaultReportByIdSchema,
  listFaultReportsSchema,
  updateFaultReportStatusSchema,
} from "../validators/fault-report.validators.js";

export const faultReportRouter = Router();

faultReportRouter.post("/", requireAuth, requireRole("citizen", "admin"), validate(createFaultReportSchema), createFaultReport);
faultReportRouter.get("/", requireAuth, requireRole("citizen", "admin"), validate(listFaultReportsSchema), listFaultReports);
faultReportRouter.get("/:id", requireAuth, requireRole("citizen", "admin"), validate(getFaultReportByIdSchema), getFaultReportById);
faultReportRouter.patch("/:id/status", requireAuth, requireRole("admin"), validate(updateFaultReportStatusSchema), updateFaultReportStatus);
