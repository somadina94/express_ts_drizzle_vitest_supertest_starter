import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import globalErrorHandler from "./controllers/error.controller.js";
import AppError from "./utils/appError.js";

import type { Request, Response, NextFunction } from "express";
import { healthRoute } from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.use(helmet());
const corsOptions = { origin: true, credentials: true } as const;
app.use(cors(corsOptions));

const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(hpp());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(compression());

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/api/v1/health", healthRoute);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
