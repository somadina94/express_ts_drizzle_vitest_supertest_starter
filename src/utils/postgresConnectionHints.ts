import fs from "fs";
import { logger } from "./logger.js";

/** Extra context when the app cannot reach PostgreSQL from inside Docker. */
export function logPostgresConnectionHints(err: unknown, databaseUrl: string): void {
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
  const isConn =
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    (err instanceof Error && /connect/i.test(err.message));

  if (!isConn) return;
  if (!fs.existsSync("/.dockerenv")) return;

  const urlLower = databaseUrl.toLowerCase();
  const targetsDockerHostAlias = urlLower.includes("host.docker.internal");

  logger.fatal(
    [
      "PostgreSQL connection failed inside Docker.",
      "",
      "Development — use the bundled Postgres service and volume:",
      "  npm run docker:dev",
      "",
      "Production — set DATABASE_URL to your real instance (.env or secrets).",
      "",
      targetsDockerHostAlias
        ? "`host.docker.internal` only works when Postgres is running on your machine and accepting connections on that port. For Docker-only Postgres, use npm run docker:dev."
        : "",
    ]
      .filter((line) => line !== "")
      .join("\n"),
  );
}
