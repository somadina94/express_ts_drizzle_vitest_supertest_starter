import type { Request, Response, NextFunction } from "express";
import { appError as AppError } from "../utils/index.js";
import { env } from "../config/env.js";

type JwtNamedError = {
  name?: string;
};

type PostgresError = Error & {
  code?: string;
  column?: string;
  constraint?: string;
};

const isPostgresError = (err: unknown): err is PostgresError =>
  err instanceof Error && typeof (err as { code?: unknown }).code === "string";

const handlePostgresError = (err: PostgresError): AppError => {
  if (err.code === "23505") {
    const field = err.column ?? err.constraint ?? "field";
    return new AppError(`Duplicate value for ${field}. Please use another value!`, 400);
  }
  if (err.code === "23503") {
    return new AppError("Related record not found.", 400);
  }
  if (err.code === "23502") {
    const field = err.column ?? "field";
    return new AppError(`Missing required value for ${field}.`, 400);
  }
  return new AppError("Database request failed.", 500);
};

const handleJsonWebTokenError = () =>
  new AppError("Invalid token! Please log in again.", 401);

const handleJwtTokenExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

const sendErrorDev = (err: AppError & { stack?: string }, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

function normalizeToAppError(err: unknown): AppError {
  if (err instanceof AppError) {
    return err as AppError;
  }
  if (isPostgresError(err)) {
    return handlePostgresError(err);
  }
  const e = err as JwtNamedError;
  if (e.name === "JsonWebTokenError") return handleJsonWebTokenError();
  if (e.name === "TokenExpiredError") return handleJwtTokenExpiredError();

  const msg =
    err instanceof Error ? err.message : String(err ?? "Something went wrong!");
  return new AppError(msg, 500);
}

export default (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const isDev = env.nodeEnv === "development";
  const error = normalizeToAppError(err);

  if (isDev) {
    sendErrorDev(
      {
        ...error,
        stack: err instanceof Error ? err.stack : error.stack,
      } as AppError & { stack?: string },
      res,
    );
    return;
  }

  sendErrorProd(error, res);
};
