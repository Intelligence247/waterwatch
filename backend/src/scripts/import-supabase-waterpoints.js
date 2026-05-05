import "dotenv/config";
import mongoose from "mongoose";
import { loadEnv } from "../config/env.js";
import { Waterpoint } from "../models/waterpoint.model.js";

function ensureNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeType(raw) {
  if (raw === "borehole" || raw === "well" || raw === "tap") return raw;
  return "borehole";
}

function normalizeStatus(raw) {
  if (raw === "functional" || raw === "faulty" || raw === "under_repair") return raw;
  return "functional";
}

function normalizeRow(row) {
  const latitude = ensureNumber(row.latitude);
  const longitude = ensureNumber(row.longitude);
  if (latitude === null || longitude === null) return null;

  return {
    name: String(row.name ?? "").trim(),
    type: normalizeType(row.type),
    status: normalizeStatus(row.status),
    latitude,
    longitude,
    location: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
    community: String(row.community ?? "").trim() || "Unknown",
    lga: String(row.lga ?? "").trim() || "Unknown",
    description: String(row.description ?? "").trim(),
    photoUrls: String(row.photo_url ?? row.photoUrl ?? "").trim()
      ? [String(row.photo_url ?? row.photoUrl ?? "").trim()]
      : [],
  };
}

async function importWaterpointsFromSupabase() {
  const mongoEnv = loadEnv();
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_URL/SUPABASE_ANON_KEY (or VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) in environment.",
    );
  }

  await mongoose.connect(mongoEnv.MONGODB_URI);

  const endpoint =
    `${supabaseUrl}/rest/v1/waterpoints` +
    "?select=id,name,type,status,latitude,longitude,community,lga,description,photo_url";

  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase fetch failed (${response.status}): ${body}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error("Unexpected Supabase response format");
  }

  const normalized = rows.map(normalizeRow).filter(Boolean);
  if (normalized.length === 0) {
    console.info("No valid waterpoints found from Supabase.");
    await mongoose.disconnect();
    return;
  }

  const operations = normalized.map((item) => ({
    updateOne: {
      // Upsert by natural key; keeps script idempotent.
      filter: { name: item.name, latitude: item.latitude, longitude: item.longitude },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await Waterpoint.bulkWrite(operations, { ordered: false });
  const finalCount = await Waterpoint.countDocuments();

  console.info(`Supabase rows fetched: ${rows.length}`);
  console.info(`Normalized rows imported: ${normalized.length}`);
  console.info(`Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`);
  console.info(`Total MongoDB waterpoints now: ${finalCount}`);

  await mongoose.disconnect();
}

importWaterpointsFromSupabase().catch(async (err) => {
  console.error("Supabase waterpoint import failed:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on failure path
  }
  process.exit(1);
});
