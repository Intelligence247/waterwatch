import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { commentRouter } from "./comment.routes.js";
import { faultReportRouter } from "./fault-report.routes.js";
import { healthRouter } from "./health.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { waterpointRouter } from "./waterpoint.routes.js";
import { settingRouter } from "./setting.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/uploads", uploadRouter);
apiRouter.use("/waterpoints", waterpointRouter);
apiRouter.use("/fault-reports", faultReportRouter);
apiRouter.use("/comments", commentRouter);
apiRouter.use("/settings", settingRouter);
apiRouter.use("/users", userRouter);

