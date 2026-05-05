import { createApp } from "../src/app.js";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase } from "../src/db/connection.js";

let app;
let dbConnectionPromise;

export default async function handler(req, res) {
  if (!app) {
    const env = loadEnv();
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDatabase(env.MONGODB_URI);
    }
    await dbConnectionPromise;
    app = createApp(env);
  }

  return app(req, res);
}
