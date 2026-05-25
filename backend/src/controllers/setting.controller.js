import { getSystemSettings, clearSettingsCache } from "../config/settings.js";
import { SystemSetting } from "../models/system-setting.model.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function getSettings(req, res) {
  const settings = await getSystemSettings();
  res.json({ settings });
}

export async function updateSettings(req, res) {
  const payload = req.validated.body;
  let settings = await SystemSetting.findOne();
  if (!settings) {
    settings = new SystemSetting();
  }

  if (payload.waterpointMinDistanceMeters !== undefined) {
    settings.waterpointMinDistanceMeters = payload.waterpointMinDistanceMeters;
  }
  if (payload.waterpointReviewDistanceMeters !== undefined) {
    settings.waterpointReviewDistanceMeters = payload.waterpointReviewDistanceMeters;
  }
  if (payload.waterpointAuditDistanceMeters !== undefined) {
    settings.waterpointAuditDistanceMeters = payload.waterpointAuditDistanceMeters;
  }

  if (settings.waterpointMinDistanceMeters > settings.waterpointReviewDistanceMeters) {
    throw new HttpError(400, "Auto-flagging threshold cannot be larger than the review threshold.");
  }

  await settings.save();
  clearSettingsCache();

  res.json({
    message: "Settings updated successfully",
    settings: settings.toObject(),
  });
}
