import type { Request, Response } from "express";
import { sql } from "drizzle-orm";
import { db, getDbConnected } from "../lib/db.js";
import catchAsync from "../utils/catchAsync.js";

export const liveCheck = catchAsync(async (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    checks: {
      process: "up",
    },
  });
});

export const readyCheck = catchAsync(async (_req: Request, res: Response) => {
  const isPostgresReady = getDbConnected();

  if (!isPostgresReady) {
    res.status(503).json({
      status: "unavailable",
      checks: {
        postgres: "down",
      },
    });
    return;
  }

  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json({
      status: "ok",
      checks: {
        postgres: "up",
      },
    });
  } catch {
    res.status(503).json({
      status: "unavailable",
      checks: {
        postgres: "down",
      },
    });
  }
});
