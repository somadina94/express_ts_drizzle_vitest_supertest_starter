import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../config/env.js";
import * as schema from "../db/schema.js";

let dbConnected = false;

export function setDbConnected(value: boolean): void {
  dbConnected = value;
}

export function getDbConnected(): boolean {
  return dbConnected;
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export const db = drizzle(pool, { schema });

export const connectDb = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

export const closeDb = async (): Promise<void> => {
  setDbConnected(false);
  await pool.end();
};
