import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase } from "../src/db/connection.js";

let app;
let bootstrapPromise;

async function bootstrap() {
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);
  app = createApp(env);
}

export default async function handler(req, res) {
  try {
    if (!app) {
      if (!bootstrapPromise) {
        bootstrapPromise = bootstrap();
      }
      await bootstrapPromise;
    }

    return app(req, res);
  } catch (error) {
    // Ensure next invocation can retry bootstrap if startup failed.
    app = undefined;
    bootstrapPromise = undefined;

    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error("Vercel function bootstrap failed:", error);

    return res.status(500).json({
      error: "Backend startup failed",
      message: process.env.NODE_ENV === "production" ? "Check server logs for details" : message,
    });
  }
}
