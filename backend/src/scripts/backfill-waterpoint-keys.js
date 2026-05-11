import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { Waterpoint, buildDuplicateKey, buildLocationHash, normalizeText } from "../models/waterpoint.model.js";

async function backfillWaterpointKeys() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);

  const waterpoints = await Waterpoint.find(
    {},
    { _id: 1, name: 1, community: 1, latitude: 1, longitude: 1, type: 1 },
  ).lean();

  if (waterpoints.length === 0) {
    console.info("No waterpoints found.");
    await mongoose.disconnect();
    return;
  }

  const ops = [];
  const duplicateMap = new Map();

  for (const wp of waterpoints) {
    const locationHash = buildLocationHash(wp.latitude, wp.longitude);
    const normalizedName = normalizeText(wp.name);
    const normalizedCommunity = normalizeText(wp.community);
    const duplicateKey = buildDuplicateKey({
      latitude: wp.latitude,
      longitude: wp.longitude,
      type: wp.type,
      community: wp.community,
    });

    ops.push({
      updateOne: {
        filter: { _id: wp._id },
        update: {
          $set: { locationHash, normalizedName, normalizedCommunity, duplicateKey },
        },
      },
    });

    const list = duplicateMap.get(duplicateKey) ?? [];
    list.push(String(wp._id));
    duplicateMap.set(duplicateKey, list);
  }

  await Waterpoint.bulkWrite(ops, { ordered: false });

  const collisions = [...duplicateMap.entries()].filter(([, ids]) => ids.length > 1);

  console.info(`Backfilled waterpoints: ${waterpoints.length}`);
  if (collisions.length > 0) {
    console.warn(`Found ${collisions.length} duplicate-key collision group(s):`);
    for (const [key, ids] of collisions) {
      console.warn(`- ${key} => ${ids.join(", ")}`);
    }
    console.warn("Resolve collisions before enforcing unique duplicateKey index in production.");
  } else {
    console.info("No duplicate-key collisions found.");
  }

  await mongoose.disconnect();
}

backfillWaterpointKeys().catch(async (err) => {
  console.error("Waterpoint key backfill failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect failure
  }
  process.exit(1);
});
