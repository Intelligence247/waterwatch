import "express-async-errors";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRouter } from "./routes/index.js";

function parseAllowedOrigins(clientOriginEnv) {
  return clientOriginEnv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createApp(env) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());

  const allowedOrigins = parseAllowedOrigins(env.CLIENT_ORIGIN);
  const isProduction = env.NODE_ENV === "production";
  const corsOrigin = !isProduction
    ? true
    : (origin, callback) => {
        // Allow direct non-browser/server-to-server calls with no Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      };

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
