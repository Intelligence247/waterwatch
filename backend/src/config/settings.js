import { SystemSetting } from "../models/system-setting.model.js";
import { loadEnv } from "./env.js";

let cachedSettings = null;

export async function getSystemSettings() {
  if (cachedSettings) {
    return cachedSettings;
  }

  let settings = await SystemSetting.findOne();
  if (!settings) {
    let env = {};
    try {
      env = loadEnv();
    } catch (err) {
      console.warn("Could not load env config, falling back to defaults", err);
    }
    
    settings = await SystemSetting.create({
      waterpointMinDistanceMeters: env.WATERPOINT_MIN_DISTANCE_METERS ?? 10,
      waterpointReviewDistanceMeters: env.WATERPOINT_REVIEW_DISTANCE_METERS ?? 30,
      waterpointAuditDistanceMeters: env.WATERPOINT_AUDIT_DISTANCE_METERS ?? 50,
    });
  }

  cachedSettings = settings.toObject();
  return cachedSettings;
}

export function clearSettingsCache() {
  cachedSettings = null;
}
