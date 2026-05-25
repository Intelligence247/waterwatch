import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/setting.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateSettingsSchema } from "../validators/setting.validators.js";

export const settingRouter = Router();

settingRouter.get("/", requireAuth, requireRole("admin"), getSettings);
settingRouter.patch("/", requireAuth, requireRole("admin"), validate(updateSettingsSchema), updateSettings);
