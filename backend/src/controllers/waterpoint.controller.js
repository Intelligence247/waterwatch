import { HttpError } from "../middleware/errorHandler.js";
import { Waterpoint } from "../models/waterpoint.model.js";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPublicWaterpoint(doc) {
  const photoUrls = Array.isArray(doc.photoUrls) ? doc.photoUrls : [];
  return {
    id: String(doc._id),
    name: doc.name,
    type: doc.type,
    status: doc.status,
    latitude: doc.latitude,
    longitude: doc.longitude,
    community: doc.community,
    lga: doc.lga,
    description: doc.description,
    photoUrls,
    photoUrl: photoUrls[0] ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createWaterpoint(req, res) {
  const payload = { ...req.validated.body };
  if ((!payload.photoUrls || payload.photoUrls.length === 0) && payload.photoUrl) {
    payload.photoUrls = [payload.photoUrl];
  }
  delete payload.photoUrl;
  const waterpoint = await Waterpoint.create({
    ...payload,
    createdBy: req.authUser.id,
    updatedBy: req.authUser.id,
  });

  res.status(201).json({
    message: "Waterpoint created successfully",
    waterpoint: toPublicWaterpoint(waterpoint),
  });
}

export async function listWaterpoints(req, res) {
  const { page, limit, q, type, status, community, lga, sortBy, sortOrder } = req.validated.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (community) filter.community = community;
  if (lga) filter.lga = lga;
  if (q) {
    const safe = escapeRegex(q);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { community: { $regex: safe, $options: "i" } },
      { lga: { $regex: safe, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Waterpoint.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Waterpoint.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toPublicWaterpoint),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function getWaterpointById(req, res) {
  const { id } = req.validated.params;
  const waterpoint = await Waterpoint.findById(id).lean();
  if (!waterpoint) throw new HttpError(404, "Waterpoint not found");
  res.json({ waterpoint: toPublicWaterpoint(waterpoint) });
}

export async function updateWaterpoint(req, res) {
  const { id } = req.validated.params;
  const payload = { ...req.validated.body };
  if ((!payload.photoUrls || payload.photoUrls.length === 0) && payload.photoUrl) {
    payload.photoUrls = [payload.photoUrl];
  }
  delete payload.photoUrl;

  const waterpoint = await Waterpoint.findById(id);
  if (!waterpoint) throw new HttpError(404, "Waterpoint not found");

  Object.assign(waterpoint, payload, { updatedBy: req.authUser.id });
  await waterpoint.save();

  res.json({
    message: "Waterpoint updated successfully",
    waterpoint: toPublicWaterpoint(waterpoint),
  });
}

export async function deleteWaterpoint(req, res) {
  const { id } = req.validated.params;
  const deleted = await Waterpoint.findByIdAndDelete(id).lean();
  if (!deleted) throw new HttpError(404, "Waterpoint not found");
  res.json({ message: "Waterpoint deleted successfully" });
}
