import { HttpError } from "../middleware/errorHandler.js";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { normalizeText, Waterpoint } from "../models/waterpoint.model.js";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPublicWaterpoint(doc) {
  const photoUrls = Array.isArray(doc.photoUrls) ? doc.photoUrls : [];
  const duplicateReview = {
    status: doc.duplicateReviewStatus ?? "clear",
    candidateWaterpointId: doc.duplicateReviewCandidateId ? String(doc.duplicateReviewCandidateId) : null,
    distanceMeters:
      typeof doc.duplicateReviewDistanceMeters === "number" ? doc.duplicateReviewDistanceMeters : null,
    flaggedAt: doc.duplicateReviewFlaggedAt ?? null,
    reviewedAt: doc.duplicateReviewReviewedAt ?? null,
    reviewedBy: doc.duplicateReviewReviewedBy ? String(doc.duplicateReviewReviewedBy) : null,
    resolutionNote: doc.duplicateReviewResolutionNote ?? "",
  };
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
    duplicateReview,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toReviewQueueItem(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    type: doc.type,
    community: doc.community,
    lga: doc.lga,
    latitude: doc.latitude,
    longitude: doc.longitude,
    duplicateReview: {
      status: doc.duplicateReviewStatus ?? "clear",
      candidateWaterpointId: doc.duplicateReviewCandidateId ? String(doc.duplicateReviewCandidateId) : null,
      distanceMeters:
        typeof doc.duplicateReviewDistanceMeters === "number" ? doc.duplicateReviewDistanceMeters : null,
      flaggedAt: doc.duplicateReviewFlaggedAt ?? null,
      reviewedAt: doc.duplicateReviewReviewedAt ?? null,
      reviewedBy: doc.duplicateReviewReviewedBy ? String(doc.duplicateReviewReviewedBy) : null,
      resolutionNote: doc.duplicateReviewResolutionNote ?? "",
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(a, b) {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMeters * c;
}

function nameSimilarityScore(left, right) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return union ? intersection / union : 0;
}

function dedupeRecommendation({ distanceMeters, minDistanceMeters, reviewDistanceMeters, nameScore }) {
  if (distanceMeters <= minDistanceMeters) return "hard_duplicate";
  if (distanceMeters <= reviewDistanceMeters && nameScore >= 0.8) return "merge_candidate";
  if (distanceMeters <= reviewDistanceMeters) return "review_candidate";
  return "no_action";
}

async function evaluateNearbyPolicy({ latitude, longitude, type, community, excludeId }) {
  const env = loadEnv();
  const minDistanceMeters = env.WATERPOINT_MIN_DISTANCE_METERS;
  const reviewDistanceMeters = Math.max(minDistanceMeters, env.WATERPOINT_REVIEW_DISTANCE_METERS);
  const normalizedCommunity = normalizeText(community);

  const query = {
    type,
    normalizedCommunity,
  };

  if (excludeId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  const [nearby] = await Waterpoint.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "distanceMeters",
        spherical: true,
        maxDistance: reviewDistanceMeters,
        query,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        community: 1,
        type: 1,
        latitude: 1,
        longitude: 1,
        distanceMeters: 1,
      },
    },
    { $limit: 1 },
  ]);

  if (!nearby) {
    return { status: "clear" };
  }

  if (nearby.distanceMeters <= minDistanceMeters) {
    throw new HttpError(
      409,
      `A similar waterpoint already exists within ${minDistanceMeters}m in this community`,
      {
        policy: {
          minDistanceMeters,
          reviewDistanceMeters,
          typeScope: type,
          communityScope: community,
        },
        conflict: {
          id: String(nearby._id),
          name: nearby.name,
          community: nearby.community,
          type: nearby.type,
          latitude: nearby.latitude,
          longitude: nearby.longitude,
          distanceMeters: nearby.distanceMeters,
        },
      },
    );
  }

  return {
    status: "pending_review",
    candidateWaterpointId: nearby._id,
    distanceMeters: nearby.distanceMeters,
    flaggedAt: new Date(),
    policy: {
      minDistanceMeters,
      reviewDistanceMeters,
      typeScope: type,
      communityScope: community,
    },
    conflict: {
      id: String(nearby._id),
      name: nearby.name,
      community: nearby.community,
      type: nearby.type,
      latitude: nearby.latitude,
      longitude: nearby.longitude,
      distanceMeters: nearby.distanceMeters,
    },
  };
}

export async function createWaterpoint(req, res) {
  const payload = { ...req.validated.body };
  if ((!payload.photoUrls || payload.photoUrls.length === 0) && payload.photoUrl) {
    payload.photoUrls = [payload.photoUrl];
  }
  delete payload.photoUrl;

  const proximity = await evaluateNearbyPolicy({
    latitude: payload.latitude,
    longitude: payload.longitude,
    type: payload.type,
    community: payload.community,
  });

  const waterpoint = await Waterpoint.create({
    ...payload,
    duplicateReviewStatus: proximity.status,
    duplicateReviewCandidateId: proximity.status === "pending_review" ? proximity.candidateWaterpointId : null,
    duplicateReviewDistanceMeters: proximity.status === "pending_review" ? proximity.distanceMeters : null,
    duplicateReviewFlaggedAt: proximity.status === "pending_review" ? proximity.flaggedAt : null,
    createdBy: req.authUser.id,
    updatedBy: req.authUser.id,
  });

  res.status(201).json({
    message:
      proximity.status === "pending_review"
        ? "Waterpoint created and flagged for duplicate review"
        : "Waterpoint created successfully",
    ...(proximity.status === "pending_review"
      ? {
          duplicateReviewWarning: {
            message: "Potential nearby duplicate found and flagged for admin review",
            policy: proximity.policy,
            conflict: proximity.conflict,
          },
        }
      : {}),
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

  const nextLatitude = payload.latitude ?? waterpoint.latitude;
  const nextLongitude = payload.longitude ?? waterpoint.longitude;
  const nextType = payload.type ?? waterpoint.type;
  const nextCommunity = payload.community ?? waterpoint.community;

  const proximity = await evaluateNearbyPolicy({
    latitude: nextLatitude,
    longitude: nextLongitude,
    type: nextType,
    community: nextCommunity,
    excludeId: id,
  });

  Object.assign(waterpoint, payload, {
    duplicateReviewStatus: proximity.status,
    duplicateReviewCandidateId: proximity.status === "pending_review" ? proximity.candidateWaterpointId : null,
    duplicateReviewDistanceMeters: proximity.status === "pending_review" ? proximity.distanceMeters : null,
    duplicateReviewFlaggedAt: proximity.status === "pending_review" ? proximity.flaggedAt : null,
    updatedBy: req.authUser.id,
  });
  await waterpoint.save();

  res.json({
    message:
      proximity.status === "pending_review"
        ? "Waterpoint updated and flagged for duplicate review"
        : "Waterpoint updated successfully",
    ...(proximity.status === "pending_review"
      ? {
          duplicateReviewWarning: {
            message: "Potential nearby duplicate found and flagged for admin review",
            policy: proximity.policy,
            conflict: proximity.conflict,
          },
        }
      : {}),
    waterpoint: toPublicWaterpoint(waterpoint),
  });
}

export async function deleteWaterpoint(req, res) {
  const { id } = req.validated.params;
  const deleted = await Waterpoint.findByIdAndDelete(id).lean();
  if (!deleted) throw new HttpError(404, "Waterpoint not found");
  res.json({ message: "Waterpoint deleted successfully" });
}

export async function listDuplicateReviewQueue(req, res) {
  const { status, page, limit, sortOrder } = req.validated.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (status !== "all") {
    filter.duplicateReviewStatus = status;
  }

  const sort = {
    duplicateReviewFlaggedAt: sortOrder === "asc" ? 1 : -1,
    createdAt: sortOrder === "asc" ? 1 : -1,
  };

  const [items, total] = await Promise.all([
    Waterpoint.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Waterpoint.countDocuments(filter),
  ]);

  res.json({
    items: items.map(toReviewQueueItem),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function resolveDuplicateReview(req, res) {
  const { id } = req.validated.params;
  const { action, resolutionNote, mergeIntoWaterpointId } = req.validated.body;

  const waterpoint = await Waterpoint.findById(id);
  if (!waterpoint) throw new HttpError(404, "Waterpoint not found");

  if (waterpoint.duplicateReviewStatus !== "pending_review") {
    throw new HttpError(400, "This waterpoint is not pending duplicate review");
  }

  let mergeTargetId = null;
  if (action === "merge") {
    const target = await Waterpoint.findById(mergeIntoWaterpointId).lean();
    if (!target) {
      throw new HttpError(404, "Merge target waterpoint not found");
    }
    if (String(target._id) === id) {
      throw new HttpError(400, "Merge target cannot be the same waterpoint");
    }
    mergeTargetId = target._id;
  }

  waterpoint.duplicateReviewStatus = action === "keep" ? "resolved_keep" : "resolved_merged";
  waterpoint.duplicateReviewCandidateId = mergeTargetId;
  waterpoint.duplicateReviewReviewedAt = new Date();
  waterpoint.duplicateReviewReviewedBy = req.authUser.id;
  waterpoint.duplicateReviewResolutionNote = resolutionNote ?? "";
  waterpoint.updatedBy = req.authUser.id;

  await waterpoint.save();

  res.json({
    message: "Duplicate review resolved successfully",
    waterpoint: toPublicWaterpoint(waterpoint),
  });
}

export async function getWaterpointDedupeAudit(req, res) {
  const env = loadEnv();
  const { distanceMeters, maxItems, type, community, includeResolved } = req.validated.query;
  const minDistanceMeters = env.WATERPOINT_MIN_DISTANCE_METERS;
  const reviewDistanceMeters = env.WATERPOINT_REVIEW_DISTANCE_METERS;
  const thresholdMeters = distanceMeters ?? env.WATERPOINT_AUDIT_DISTANCE_METERS;

  const filter = {};
  if (type) filter.type = type;
  if (community) filter.normalizedCommunity = normalizeText(community);
  if (!includeResolved) {
    filter.duplicateReviewStatus = { $nin: ["resolved_keep", "resolved_merged"] };
  }

  const waterpoints = await Waterpoint.find(
    filter,
    {
      _id: 1,
      name: 1,
      type: 1,
      community: 1,
      normalizedCommunity: 1,
      latitude: 1,
      longitude: 1,
      duplicateKey: 1,
      duplicateReviewStatus: 1,
      duplicateReviewFlaggedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  )
    .sort({ createdAt: -1 })
    .limit(maxItems)
    .lean();

  const exactKeyBuckets = new Map();
  for (const wp of waterpoints) {
    const key = wp.duplicateKey || "__missing_duplicate_key__";
    const list = exactKeyBuckets.get(key) ?? [];
    list.push(wp);
    exactKeyBuckets.set(key, list);
  }

  const exactDuplicateGroups = [...exactKeyBuckets.entries()]
    .filter(([, items]) => items.length > 1)
    .map(([key, items]) => ({
      duplicateKey: key,
      count: items.length,
      waterpointIds: items.map((entry) => String(entry._id)),
      sample: {
        type: items[0].type,
        community: items[0].community,
        latitude: items[0].latitude,
        longitude: items[0].longitude,
      },
    }));

  const proximityCandidates = [];
  for (let i = 0; i < waterpoints.length; i += 1) {
    for (let j = i + 1; j < waterpoints.length; j += 1) {
      const left = waterpoints[i];
      const right = waterpoints[j];

      if (left.type !== right.type) continue;
      if (left.normalizedCommunity !== right.normalizedCommunity) continue;

      const distance = calculateDistanceMeters(left, right);
      if (distance > thresholdMeters) continue;

      const score = Number(nameSimilarityScore(left.name, right.name).toFixed(2));
      const recommendation = dedupeRecommendation({
        distanceMeters: distance,
        minDistanceMeters,
        reviewDistanceMeters,
        nameScore: score,
      });
      const roundedDistance = Number(distance.toFixed(2));

      if (recommendation === "no_action") continue;

      proximityCandidates.push({
        left: {
          id: String(left._id),
          name: left.name,
          type: left.type,
          community: left.community,
          latitude: left.latitude,
          longitude: left.longitude,
          reviewStatus: left.duplicateReviewStatus,
        },
        right: {
          id: String(right._id),
          name: right.name,
          type: right.type,
          community: right.community,
          latitude: right.latitude,
          longitude: right.longitude,
          reviewStatus: right.duplicateReviewStatus,
        },
        distanceMeters: roundedDistance,
        nameSimilarityScore: score,
        recommendation,
      });
    }
  }

  proximityCandidates.sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({
    policy: {
      minDistanceMeters,
      reviewDistanceMeters,
      auditDistanceMeters: thresholdMeters,
      includeResolved,
    },
    scanned: {
      considered: waterpoints.length,
      maxItems,
      truncated: waterpoints.length >= maxItems,
    },
    summary: {
      exactDuplicateGroups: exactDuplicateGroups.length,
      exactDuplicateRecords: exactDuplicateGroups.reduce((sum, group) => sum + group.count, 0),
      proximityCandidates: proximityCandidates.length,
      hardDuplicates: proximityCandidates.filter((item) => item.recommendation === "hard_duplicate").length,
      mergeCandidates: proximityCandidates.filter((item) => item.recommendation === "merge_candidate").length,
      reviewCandidates: proximityCandidates.filter((item) => item.recommendation === "review_candidate").length,
    },
    exactDuplicateGroups,
    proximityCandidates,
  });
}
