import { FaultReport } from "../models/fault-report.model.js";
import mongoose from "mongoose";
import { Waterpoint } from "../models/waterpoint.model.js";

function getCountByStatus(items, status) {
  const found = items.find((entry) => entry._id === status);
  return found?.count ?? 0;
}

export async function getAdminOverview(_req, res) {
  const [waterpointStatus, reportStatus, recentWaterpoints] = await Promise.all([
    Waterpoint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    FaultReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Waterpoint.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name type status community lga updatedAt")
      .lean(),
  ]);

  const totalWaterpoints = waterpointStatus.reduce((sum, item) => sum + item.count, 0);
  const totalReports = reportStatus.reduce((sum, item) => sum + item.count, 0);

  res.json({
    stats: {
      totalWaterpoints,
      functional: getCountByStatus(waterpointStatus, "functional"),
      faulty: getCountByStatus(waterpointStatus, "faulty"),
      underRepair: getCountByStatus(waterpointStatus, "under_repair"),
      totalReports,
      pendingReports: getCountByStatus(reportStatus, "pending"),
      verifiedReports: getCountByStatus(reportStatus, "verified"),
      resolvedReports: getCountByStatus(reportStatus, "resolved"),
      dismissedReports: getCountByStatus(reportStatus, "dismissed"),
    },
    recentWaterpoints: recentWaterpoints.map((wp) => ({
      id: String(wp._id),
      name: wp.name,
      type: wp.type,
      status: wp.status,
      community: wp.community,
      lga: wp.lga,
      updatedAt: wp.updatedAt,
    })),
  });
}

export async function getCitizenOverview(req, res) {
  const userId = req.authUser.id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [waterpointStatus, myReportStatus, nearbyWaterpoints] = await Promise.all([
    Waterpoint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    FaultReport.aggregate([
      { $match: { reporterUserId: userObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Waterpoint.find({}).sort({ name: 1 }).limit(6).select("name type status community").lean(),
  ]);

  const totalWaterpoints = waterpointStatus.reduce((sum, item) => sum + item.count, 0);
  const myReports = myReportStatus.reduce((sum, item) => sum + item.count, 0);

  res.json({
    userId,
    stats: {
      totalWaterpoints,
      functional: getCountByStatus(waterpointStatus, "functional"),
      faulty: getCountByStatus(waterpointStatus, "faulty"),
      underRepair: getCountByStatus(waterpointStatus, "under_repair"),
      myReports,
      pendingReports: getCountByStatus(myReportStatus, "pending"),
      resolvedReports:
        getCountByStatus(myReportStatus, "resolved") + getCountByStatus(myReportStatus, "verified"),
      dismissedReports: getCountByStatus(myReportStatus, "dismissed"),
    },
    nearbyWaterpoints: nearbyWaterpoints.map((wp) => ({
      id: String(wp._id),
      name: wp.name,
      type: wp.type,
      status: wp.status,
      community: wp.community,
    })),
  });
}

export async function getDuplicateReviewInsights(req, res) {
  const { days } = req.validated.query;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [statusAgg, pendingAgingAgg, reviewedAgg] = await Promise.all([
    Waterpoint.aggregate([
      {
        $group: {
          _id: "$duplicateReviewStatus",
          count: { $sum: 1 },
        },
      },
    ]),
    Waterpoint.aggregate([
      {
        $match: {
          duplicateReviewStatus: "pending_review",
        },
      },
      {
        $project: {
          duplicateReviewFlaggedAt: 1,
        },
      },
      {
        $group: {
          _id: null,
          pendingCount: { $sum: 1 },
          oldestFlaggedAt: { $min: "$duplicateReviewFlaggedAt" },
        },
      },
    ]),
    Waterpoint.aggregate([
      {
        $match: {
          duplicateReviewReviewedAt: { $gte: startDate },
          duplicateReviewStatus: { $in: ["resolved_keep", "resolved_merged"] },
        },
      },
      {
        $group: {
          _id: "$duplicateReviewStatus",
          count: { $sum: 1 },
          avgDistanceMeters: { $avg: "$duplicateReviewDistanceMeters" },
        },
      },
    ]),
  ]);

  const statusCount = (status) => statusAgg.find((item) => item._id === status)?.count ?? 0;
  const reviewedCount = (status) => reviewedAgg.find((item) => item._id === status)?.count ?? 0;
  const reviewedAvgDistance = (status) =>
    Number((reviewedAgg.find((item) => item._id === status)?.avgDistanceMeters ?? 0).toFixed(2));

  const pendingMeta = pendingAgingAgg[0] ?? { pendingCount: 0, oldestFlaggedAt: null };
  const pendingOldestAgeDays = pendingMeta.oldestFlaggedAt
    ? Math.floor((Date.now() - new Date(pendingMeta.oldestFlaggedAt).getTime()) / (24 * 60 * 60 * 1000))
    : 0;

  res.json({
    windowDays: days,
    stats: {
      pendingReview: statusCount("pending_review"),
      resolvedKeep: statusCount("resolved_keep"),
      resolvedMerged: statusCount("resolved_merged"),
      clear: statusCount("clear"),
      totalReviewedInWindow: reviewedCount("resolved_keep") + reviewedCount("resolved_merged"),
      reviewedKeepInWindow: reviewedCount("resolved_keep"),
      reviewedMergedInWindow: reviewedCount("resolved_merged"),
      avgReviewedKeepDistanceMeters: reviewedAvgDistance("resolved_keep"),
      avgReviewedMergedDistanceMeters: reviewedAvgDistance("resolved_merged"),
      pendingOldestAgeDays,
      pendingCount: pendingMeta.pendingCount ?? 0,
    },
  });
}
