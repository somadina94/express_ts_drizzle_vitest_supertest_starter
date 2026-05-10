import fs from "fs";
import { logger } from "./logger.js";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Inside Docker, `localhost` in DATABASE_URL points at the container, not the host.
 * Fail fast with an actionable message instead of repeated connection errors.
 */
export function assertPostgresReachableInDocker(databaseUrl: string): void {
  if (!fs.existsSync("/.dockerenv")) return;

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    return;
  }

  if (!LOOPBACK_HOSTS.has(hostname)) return;

  logger.fatal(
    [
      `DATABASE_URL host "${hostname}" is loopback, but this process runs inside Docker.`,
      "localhost inside a container is not PostgreSQL on your machine.",
      "",
      "Use one of:",
      "  • Postgres on host (Docker Desktop): postgresql://USER:PASS@host.docker.internal:5432/DB",
      "  • Postgres in Compose: postgresql://USER:PASS@postgres:5432/DB  → npm run docker:dev",
      "  • Managed Postgres: full URL from your provider",
      "",
      "Quick test after building the image:",
      "  npm run docker:run:host-postgres",
    ].join("\n"),
  );
  process.exit(1);
}
