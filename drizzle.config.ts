import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const cliDatabaseUrl =
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:secret@localhost:5432/postgres";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cliDatabaseUrl,
  },
  verbose: true,
  strict: true,
});
