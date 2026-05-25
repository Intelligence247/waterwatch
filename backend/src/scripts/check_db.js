import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";

async function run() {
  const env = loadEnv();
  console.log("Connecting to:", env.MONGODB_URI);
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected!");

  const db = mongoose.connection.db;
  const collections = await db.listCollections({ name: "waterpoints" }).toArray();
  console.log("Collections matching waterpoints:", collections.length);

  if (collections.length > 0) {
    const indexes = await db.collection("waterpoints").indexes();
    console.log("Current indexes on waterpoints:", JSON.stringify(indexes, null, 2));
  } else {
    console.log("Collection waterpoints not found.");
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
