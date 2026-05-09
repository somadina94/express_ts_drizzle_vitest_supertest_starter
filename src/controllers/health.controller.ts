import type { Request, Response, NextFunction } from "express";
import { sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import { catchAsync } from "../utils/index.js";

export const healthCheck = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    await db.execute(sql`SELECT 1`);

    res.status(200).json({ status: "ok", database: "ok" });
  },
);
