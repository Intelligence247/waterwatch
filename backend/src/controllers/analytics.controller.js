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
