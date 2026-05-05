import { HttpError } from "../middleware/errorHandler.js";
import { FaultReport } from "../models/fault-report.model.js";
import { Waterpoint } from "../models/waterpoint.model.js";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPublicFaultReport(doc) {
  const waterpoint = doc.waterpointId && typeof doc.waterpointId === "object"
    ? { id: String(doc.waterpointId._id), name: doc.waterpointId.name }
    : null;

  return {
    id: String(doc._id),
    waterpointId: waterpoint?.id ?? (doc.waterpointId ? String(doc.waterpointId) : null),
    waterpoint,
    reporterName: doc.reporterName,
    reporterPhone: doc.reporterPhone,
    description: doc.description,
    photoUrl: doc.photoUrl,
    latitude: doc.latitude,
    longitude: doc.longitude,
    community: doc.community,
    status: doc.status,
    reviewedBy: doc.reviewedBy ? String(doc.reviewedBy) : null,
    reviewedAt: doc.reviewedAt,
    resolutionNote: doc.resolutionNote,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createFaultReport(req, res) {
  const payload = req.validated.body;

  if (payload.waterpointId) {
    const exists = await Waterpoint.exists({ _id: payload.waterpointId });
    if (!exists) throw new HttpError(400, "Referenced waterpoint does not exist");
  }

  const report = await FaultReport.create({
    waterpointId: payload.waterpointId ?? null,
    reporterUserId: req.authUser.id,
    reporterName: payload.reporterName,
    reporterPhone: payload.reporterPhone ?? "",
    description: payload.description,
    photoUrl: payload.photoUrl ?? "",
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    community: payload.community,
    status: "pending",
  });

  res.status(201).json({
    message: "Fault report submitted successfully",
    report: toPublicFaultReport(report),
  });
}

export async function listFaultReports(req, res) {
  const { page, limit, q, status, community, waterpointId, reporterPhone, sortBy, sortOrder } = req.validated.query;
  const filter = {};

  if (req.authUser.role === "citizen") {
    filter.reporterUserId = req.authUser.id;
  }
  if (status) filter.status = status;
  if (community) filter.community = community;
  if (waterpointId) filter.waterpointId = waterpointId;
  if (reporterPhone) filter.reporterPhone = reporterPhone;
  if (q) {
    const safe = escapeRegex(q);
    filter.$or = [
      { reporterName: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { community: { $regex: safe, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    FaultReport.find(filter)
      .populate("waterpointId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    FaultReport.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toPublicFaultReport),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function getFaultReportById(req, res) {
  const { id } = req.validated.params;
  const report = await FaultReport.findById(id).populate("waterpointId", "name").lean();
  if (!report) throw new HttpError(404, "Fault report not found");

  if (req.authUser.role !== "admin" && String(report.reporterUserId) !== req.authUser.id) {
    throw new HttpError(403, "Forbidden");
  }

  res.json({ report: toPublicFaultReport(report) });
}

export async function updateFaultReportStatus(req, res) {
  const { id } = req.validated.params;
  const { status, resolutionNote } = req.validated.body;

  const report = await FaultReport.findById(id);
  if (!report) throw new HttpError(404, "Fault report not found");

  report.status = status;
  report.reviewedBy = req.authUser.id;
  report.reviewedAt = new Date();
  if (resolutionNote !== undefined) {
    report.resolutionNote = resolutionNote;
  }
  await report.save();

  res.json({
    message: "Fault report status updated successfully",
    report: toPublicFaultReport(report),
  });
}
