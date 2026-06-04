import { Router } from "express";
import { listUsers, updateUserStatus } from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listUsersSchema, updateUserStatusSchema } from "../validators/user.validators.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.use(requireRole("admin"));

userRouter.get("/", validate(listUsersSchema), listUsers);
userRouter.put("/:id/status", validate(updateUserStatusSchema), updateUserStatus);
