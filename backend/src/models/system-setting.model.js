import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    waterpointMinDistanceMeters: {
      type: Number,
      required: true,
      default: 10,
    },
    waterpointReviewDistanceMeters: {
      type: Number,
      required: true,
      default: 30,
    },
    waterpointAuditDistanceMeters: {
      type: Number,
      required: true,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);
