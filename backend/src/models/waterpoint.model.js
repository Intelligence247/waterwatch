import mongoose from "mongoose";

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
  }
  next();
});

export const Waterpoint = mongoose.model("Waterpoint", waterpointSchema);
