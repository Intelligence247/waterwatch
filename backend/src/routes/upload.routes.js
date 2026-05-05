import { Router } from "express";
import multer from "multer";
import { uploadImage } from "../controllers/upload.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/image",
  requireAuth,
  requireRole("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  uploadImage,
);
