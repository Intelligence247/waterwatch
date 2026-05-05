import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { createServer } from "node:http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from backend/ regardless of cwd (e.g. `node src/server.js` from src/ vs backend/)
dotenv.config({ path: path.join(__dirname, "..", ".env") });
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./db/connection.js";

async function shutdown(signal, server) {
  console.info(`${signal} received, closing server...`);

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });

  await disconnectDatabase();
  process.exit(0);
}

async function bootstrap() {
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);

  const app = createApp(env);
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.info(`API listening on http://localhost:${env.PORT}`);
  });

  process.once("SIGINT", () => {
    void shutdown("SIGINT", server);
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM", server);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
