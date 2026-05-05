import { Router } from "express";
import {
  createWaterpoint,
  deleteWaterpoint,
  getWaterpointById,
  listWaterpoints,
  updateWaterpoint,
} from "../controllers/waterpoint.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createWaterpointSchema,
  deleteWaterpointSchema,
  getWaterpointByIdSchema,
  listWaterpointsSchema,
  updateWaterpointSchema,
} from "../validators/waterpoint.validators.js";

export const waterpointRouter = Router();

// Public/Citizen/Admin read endpoints
waterpointRouter.get("/", validate(listWaterpointsSchema), listWaterpoints);
waterpointRouter.get("/:id", validate(getWaterpointByIdSchema), getWaterpointById);

// Admin-only write endpoints
waterpointRouter.post("/", requireAuth, requireRole("admin"), validate(createWaterpointSchema), createWaterpoint);
waterpointRouter.patch("/:id", requireAuth, requireRole("admin"), validate(updateWaterpointSchema), updateWaterpoint);
waterpointRouter.delete("/:id", requireAuth, requireRole("admin"), validate(deleteWaterpointSchema), deleteWaterpoint);
