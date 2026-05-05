import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    waterpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Waterpoint",
      default: null,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

commentSchema.index({ createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
