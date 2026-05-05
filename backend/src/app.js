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

export function createApp(env) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());

  const corsOrigin = env.NODE_ENV === "production" ? (env.CLIENT_ORIGIN ?? false) : true;

  app.use(
    cors({
      origin: corsOrigin,
      credentials: corsOrigin !== false,
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
