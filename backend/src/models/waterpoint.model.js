import mongoose from "mongoose";

const COORDINATE_PRECISION = 6;

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function roundCoordinate(value) {
  return Number(Number(value).toFixed(COORDINATE_PRECISION));
}

function buildLocationHash(latitude, longitude) {
  return `${roundCoordinate(latitude)}:${roundCoordinate(longitude)}`;
}

function buildDuplicateKey({ latitude, longitude, type, community }) {
  const locationHash = buildLocationHash(latitude, longitude);
  const normalizedCommunity = normalizeText(community);
  return `${type}|${normalizedCommunity}|${locationHash}`;
}

const waterpointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
      index: true,
    },
    type: {
      type: String,
      enum: ["borehole", "well", "tap"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["functional", "faulty", "under_repair"],
      required: true,
      default: "functional",
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    community: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    lga: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    normalizedName: {
      type: String,
      default: "",
      index: true,
    },
    normalizedCommunity: {
      type: String,
      default: "",
      index: true,
    },
    locationHash: {
      type: String,
      default: "",
      index: true,
    },
    duplicateKey: {
      type: String,
      default: "",
      unique: true,
      index: true,
    },
    duplicateReviewStatus: {
      type: String,
      enum: ["clear", "pending_review", "resolved_keep", "resolved_merged"],
      default: "clear",
      index: true,
    },
    duplicateReviewCandidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Waterpoint",
      default: null,
      index: true,
    },
    duplicateReviewDistanceMeters: {
      type: Number,
      default: null,
      min: 0,
    },
    duplicateReviewFlaggedAt: {
      type: Date,
      default: null,
    },
    duplicateReviewReviewedAt: {
      type: Date,
      default: null,
    },
    duplicateReviewReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    duplicateReviewResolutionNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    photoUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 5,
        message: "photoUrls can contain at most 5 images",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

waterpointSchema.index({ location: "2dsphere" });
waterpointSchema.index({ name: "text", community: "text", lga: "text" });

waterpointSchema.pre("validate", function syncLocation(next) {
  if (typeof this.latitude === "number" && typeof this.longitude === "number") {
    this.location = {
      type: "Point",
      coordinates: [this.longitude, this.latitude],
    };

    this.locationHash = buildLocationHash(this.latitude, this.longitude);
  }

  this.normalizedName = normalizeText(this.name);
  this.normalizedCommunity = normalizeText(this.community);

  if (typeof this.latitude === "number" && typeof this.longitude === "number" && this.type && this.community) {
    this.duplicateKey = buildDuplicateKey({
      latitude: this.latitude,
      longitude: this.longitude,
      type: this.type,
      community: this.community,
    });
  }

  next();
});

export const Waterpoint = mongoose.model("Waterpoint", waterpointSchema);
export { buildDuplicateKey, buildLocationHash, normalizeText, roundCoordinate };
