import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { FaultReport } from "../models/fault-report.model.js";
import { User } from "../models/user.model.js";
import { Waterpoint } from "../models/waterpoint.model.js";

async function seed() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);

  const reset = process.env.SEED_RESET === "true";
  const demoAdminEmail = "admin@waterwatch.ng";
  const demoCitizenEmail = "citizen@waterwatch.ng";
  const passwordHash = await bcrypt.hash("Password123!", 12);

  if (reset) {
    await FaultReport.deleteMany({});
    await Waterpoint.deleteMany({});
    await User.deleteMany({ email: { $in: [demoAdminEmail, demoCitizenEmail] } });
  }

  const admin = await User.findOneAndUpdate(
    { email: demoAdminEmail },
    {
      fullName: "WaterWatch Admin",
      passwordHash,
      role: "admin",
      emailVerified: true,
      phone: "08030000001",
      community: "Ilorin West",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const citizen = await User.findOneAndUpdate(
    { email: demoCitizenEmail },
    {
      fullName: "Amina Yusuf",
      passwordHash,
      role: "citizen",
      emailVerified: true,
      phone: "08030000002",
      community: "Ilorin South",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  let waterpoints = await Waterpoint.find({}).limit(1).lean();
  if (waterpoints.length === 0) {
    await Waterpoint.insertMany([
      {
        name: "Adewole Borehole",
        type: "borehole",
        status: "functional",
        latitude: 8.5002,
        longitude: 4.5486,
        community: "Adewole",
        lga: "Ilorin West",
        description: "Primary neighborhood borehole near market road.",
        createdBy: admin._id,
        updatedBy: admin._id,
      },
      {
        name: "Tanke Public Tap",
        type: "tap",
        status: "faulty",
        latitude: 8.4786,
        longitude: 4.5752,
        community: "Tanke",
        lga: "Ilorin South",
        description: "Public tap with intermittent flow and valve leak.",
        createdBy: admin._id,
        updatedBy: admin._id,
      },
      {
        name: "Oja-Oba Community Well",
        type: "well",
        status: "under_repair",
        latitude: 8.4921,
        longitude: 4.5561,
        community: "Oja-Oba",
        lga: "Ilorin East",
        description: "Community well under rehabilitation.",
        createdBy: admin._id,
        updatedBy: admin._id,
      },
    ]);
  }

  waterpoints = await Waterpoint.find({}).sort({ createdAt: 1 }).lean();
  const targetWaterpoint = waterpoints[1] ?? waterpoints[0];

  const existingReports = await FaultReport.countDocuments({});
  if (existingReports === 0 && targetWaterpoint) {
    await FaultReport.insertMany([
      {
        waterpointId: targetWaterpoint._id,
        reporterUserId: citizen._id,
        reporterName: citizen.fullName,
        reporterPhone: citizen.phone,
        description: "Water pressure is very low in the morning hours.",
        community: citizen.community,
        latitude: targetWaterpoint.latitude,
        longitude: targetWaterpoint.longitude,
        status: "pending",
      },
      {
        waterpointId: targetWaterpoint._id,
        reporterUserId: citizen._id,
        reporterName: citizen.fullName,
        reporterPhone: citizen.phone,
        description: "Leak fixed but site remains slippery and unsafe.",
        community: citizen.community,
        latitude: targetWaterpoint.latitude,
        longitude: targetWaterpoint.longitude,
        status: "verified",
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
    ]);
  }

  console.info("Seed complete");
  console.info(`Admin login: ${demoAdminEmail} / Password123!`);
  console.info(`Citizen login: ${demoCitizenEmail} / Password123!`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on failure path
  }
  process.exit(1);
});
