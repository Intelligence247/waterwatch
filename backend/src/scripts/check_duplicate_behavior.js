import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { Waterpoint } from "../models/waterpoint.model.js";

async function test() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to DB");

  const testPayload = {
    name: "Test Duplicate A",
    type: "borehole",
    status: "functional",
    latitude: 8.5,
    longitude: 4.5,
    community: "TestCommunity",
    lga: "TestLGA",
    description: "Test description",
  };

  // Clean up existing test ones
  await Waterpoint.deleteMany({ community: "TestCommunity" });

  try {
    console.log("Creating first waterpoint...");
    const w1 = await Waterpoint.create(testPayload);
    console.log("First created successfully:", w1._id);

    console.log("Creating second waterpoint with identical values...");
    const w2 = await Waterpoint.create({
      ...testPayload,
      name: "Test Duplicate B",
    });
    console.log("Second created successfully:", w2._id);
  } catch (err) {
    console.error("Error creating duplicate:");
    console.error("Name:", err.name);
    console.error("Code:", err.code);
    console.error("Message:", err.message);
    console.error("Full Error:", err);
  }

  await Waterpoint.deleteMany({ community: "TestCommunity" });
  await mongoose.disconnect();
}

test();
