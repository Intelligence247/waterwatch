import mongoose from "mongoose";

const faultReportSchema = new mongoose.Schema(
  {
    waterpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Waterpoint",
      default: null,
      index: true,
    },
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    reporterPhone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 30,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    photoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    latitude: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },
    community: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "dismissed", "resolved"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

faultReportSchema.index({ createdAt: -1 });
faultReportSchema.index({ status: 1, createdAt: -1 });
faultReportSchema.index({ reporterUserId: 1, createdAt: -1 });

export const FaultReport = mongoose.model("FaultReport", faultReportSchema);
