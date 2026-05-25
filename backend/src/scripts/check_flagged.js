import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { Waterpoint } from "../models/waterpoint.model.js";
import { createWaterpoint } from "../controllers/waterpoint.controller.js";

async function test() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to DB");

  // Clean up
  await Waterpoint.deleteMany({ community: "AdewoleTest" });

  const mockReq1 = {
    validated: {
      body: {
        name: "Borehole A",
        type: "borehole",
        status: "functional",
        latitude: 8.5002,
        longitude: 4.5486,
        community: "AdewoleTest",
        lga: "Ilorin West",
      },
    },
    authUser: { id: new mongoose.Types.ObjectId() },
  };

  const mockRes1 = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };

  console.log("Creating first waterpoint...");
  await createWaterpoint(mockReq1, mockRes1);
  console.log("First result:", mockRes1.statusCode, JSON.stringify(mockRes1.data.waterpoint.duplicateReview));

  // 5 meters difference:
  // 1 degree latitude is approx 111,000 meters.
  // 5 meters is approx 0.000045 degrees.
  const mockReq2 = {
    validated: {
      body: {
        name: "Borehole B",
        type: "borehole",
        status: "functional",
        latitude: 8.5002 + 0.000045, // ~5 meters away
        longitude: 4.5486,
        community: "AdewoleTest",
        lga: "Ilorin West",
      },
    },
    authUser: { id: mockReq1.authUser.id },
  };

  const mockRes2 = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    },
  };

  console.log("Creating second waterpoint ~5m away...");
  await createWaterpoint(mockReq2, mockRes2);
  console.log("Second result:", mockRes2.statusCode, JSON.stringify(mockRes2.data.waterpoint.duplicateReview));
  if (mockRes2.data.duplicateReviewWarning) {
    console.log("Warning Details:", JSON.stringify(mockRes2.data.duplicateReviewWarning, null, 2));
  }

  // Clean up
  await Waterpoint.deleteMany({ community: "AdewoleTest" });
  await mongoose.disconnect();
}

test().catch(console.error);
