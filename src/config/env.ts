import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

/** Always load `server/.env` regardless of process cwd (e.g. monorepo root). */
const envDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(envDir, "../../.env") });

const str = (v: string | undefined, fallback?: string) => v ?? fallback ?? "";

export const env = {
  nodeEnv: str(process.env.NODE_ENV, "development"),
  port: Number(process.env.PORT) || 3000,

  databaseUrl: str(process.env.DATABASE_URL),

  jwtSecret: str(process.env.JWT_SECRET),
  jwtExpiresIn: str(process.env.JWT_EXPIRES_IN, "90d"),
  jwtCookieExpiresIn: Number(process.env.JWT_COOKIE_EXPIRES_IN) || 90,

  emailHost: str(process.env.EMAIL_HOST),
  emailPort: str(process.env.EMAIL_PORT),
  emailAddress: str(process.env.EMAIL_ADDRESS),
  emailPassword: str(process.env.EMAIL_PASSWORD),
  emailFrom: str(process.env.EMAIL_FROM),
  /** Raw env so `undefined` means “use default” in `email.ts`. */
  emailSecure: process.env.EMAIL_SECURE,
  emailRequireTls: str(process.env.EMAIL_REQUIRE_TLS),
  emailTlsRejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED,
  companyName: str(process.env.COMPANY_NAME, "App"),
} as const;

export function assertJwtSecret(): void {
  if (env.nodeEnv === "production" && !env.jwtSecret) {
    throw new Error("JWT_SECRET is required in production");
  }
}
