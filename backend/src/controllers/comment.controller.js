import { HttpError } from "../middleware/errorHandler.js";
import { Comment } from "../models/comment.model.js";
import { Waterpoint } from "../models/waterpoint.model.js";
import { User } from "../models/user.model.js";

function toPublicComment(doc) {
  const author = doc.authorId && typeof doc.authorId === "object"
    ? {
      id: String(doc.authorId._id),
      fullName: doc.authorId.fullName,
      community: doc.authorId.community ?? "",
    }
    : null;
  const waterpoint = doc.waterpointId && typeof doc.waterpointId === "object"
    ? { id: String(doc.waterpointId._id), name: doc.waterpointId.name }
    : null;

  return {
    id: String(doc._id),
    waterpointId: waterpoint?.id ?? (doc.waterpointId ? String(doc.waterpointId) : null),
    waterpoint,
    authorId: author?.id ?? (doc.authorId ? String(doc.authorId) : null),
    author: author
      ? { fullName: author.fullName, community: author.community }
      : null,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createComment(req, res) {
  const payload = req.validated.body;
  let lga = null;

  if (payload.waterpointId) {
    const wp = await Waterpoint.findById(payload.waterpointId).select("lga").lean();
    if (!wp) throw new HttpError(400, "Referenced waterpoint does not exist");
    lga = wp.lga;
  } else {
    const user = await User.findById(req.authUser.id).select("lga").lean();
    lga = user?.lga ?? null;
  }

  const comment = await Comment.create({
    waterpointId: payload.waterpointId ?? null,
    authorId: req.authUser.id,
    lga,
    content: payload.content,
  });

  const hydrated = await Comment.findById(comment._id)
    .populate("authorId", "fullName community")
    .populate("waterpointId", "name")
    .lean();

  res.status(201).json({
    message: "Comment posted successfully",
    comment: toPublicComment(hydrated),
  });
}

export async function listComments(req, res) {
  const { page, limit, waterpointId } = req.validated.query;
  const skip = (page - 1) * limit;
  const filter = waterpointId ? { waterpointId } : {};

  if (req.authUser.role === "citizen") {
    filter.lga = req.authUser.lga;
  }

  const [items, total] = await Promise.all([
    Comment.find(filter)
      .populate("authorId", "fullName community")
      .populate("waterpointId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toPublicComment),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function deleteComment(req, res) {
  const { id } = req.validated.params;
  const comment = await Comment.findById(id).lean();
  if (!comment) throw new HttpError(404, "Comment not found");

  const isOwner = String(comment.authorId) === req.authUser.id;
  if (!isOwner && req.authUser.role !== "admin") {
    throw new HttpError(403, "Forbidden");
  }

  await Comment.deleteOne({ _id: id });
  res.json({ message: "Comment deleted successfully" });
}
