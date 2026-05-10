import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

/** Always load the project `.env` regardless of process cwd. */
const envDir = path.dirname(fileURLToPath(import.meta.url));
const dotenvResult = dotenv.config({
  path: path.resolve(envDir, "../../.env"),
  quiet: true,
});

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().trim().optional());

const numberFromEnv = (fallback: number) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? fallback : Number(value)),
    z.number().int().positive(),
  );

const booleanFromEnv = (fallback: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return value;
  }, z.boolean());

const optionalPostgresUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().url().optional(),
);

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  PORT: numberFromEnv(3000),
  DATABASE_URL: optionalPostgresUrl,
  /** Direct URL for Drizzle CLI when DATABASE_URL uses a pooler. */
  DIRECT_URL: optionalPostgresUrl,
  JWT_SECRET: optionalString,
  JWT_EXPIRES_IN: z.string().trim().default("90d"),
  JWT_COOKIE_EXPIRES_IN: numberFromEnv(90),
  API_URL: z.string().trim().url().default("http://localhost:3000"),
  FRONTEND_URL: z.string().trim().url().default("http://localhost:3000"),
  CORS_ORIGINS: optionalString,
  TRUST_PROXY: booleanFromEnv(false),
  RATE_LIMIT_WINDOW_MS: numberFromEnv(60 * 60 * 1000),
  RATE_LIMIT_MAX: numberFromEnv(1000),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  /** Requires devDependency `pino-pretty`; keep false in production Docker images. */
  LOG_PRETTY: booleanFromEnv(false),
  COMPANY_NAME: z.string().trim().default("Express TS Drizzle Base"),
  EMAIL_HOST: optionalString,
  EMAIL_PORT: numberFromEnv(587),
  EMAIL_SECURE: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  EMAIL_REQUIRE_TLS: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  EMAIL_TLS_REJECT_UNAUTHORIZED: z.preprocess(
    emptyToUndefined,
    z.string().trim().optional(),
  ),
  EMAIL_ADDRESS: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: optionalString,
});

const rawEnv = rawEnvSchema.safeParse(process.env);

if (!rawEnv.success) {
  console.error("Invalid environment configuration");
  console.error(z.prettifyError(rawEnv.error));
  process.exit(1);
}

const parsed = rawEnv.data;
const isProductionLike =
  parsed.NODE_ENV === "production" || parsed.NODE_ENV === "staging";
const productionErrors: string[] = [];
const trackedEnvKeys = Object.keys(rawEnvSchema.shape);

if (parsed.NODE_ENV !== "production") {
  const configuredEnvCount = trackedEnvKeys.filter((key) => {
    const value = process.env[key];
    return value !== undefined && value.trim() !== "";
  }).length;
  const parsedFileCount = dotenvResult.parsed
    ? Object.keys(dotenvResult.parsed).length
    : 0;

  console.log(
    `Loaded ${configuredEnvCount} configured env vars (${parsedFileCount} from .env file)`,
  );
}

if (isProductionLike && !parsed.DATABASE_URL) {
  productionErrors.push("DATABASE_URL is required in production/staging.");
}

if (isProductionLike && (!parsed.JWT_SECRET || parsed.JWT_SECRET.length < 32)) {
  productionErrors.push(
    "JWT_SECRET must be at least 32 characters in production/staging.",
  );
}

if (isProductionLike && parsed.FRONTEND_URL.includes("localhost")) {
  productionErrors.push(
    "FRONTEND_URL must not point at localhost in production/staging.",
  );
}

if (productionErrors.length > 0) {
  console.error("Invalid production environment configuration");
  for (const error of productionErrors) console.error(`- ${error}`);
  process.exit(1);
}

const parseOptionalBoolean = (value: string | undefined, fallback?: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const corsOrigins = (parsed.CORS_ORIGINS ?? parsed.FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultDevDatabaseUrl = "postgresql://postgres:secret@localhost:5432/postgres";

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,

  databaseUrl: parsed.DATABASE_URL ?? defaultDevDatabaseUrl,
  directUrl: parsed.DIRECT_URL,

  jwtSecret: parsed.JWT_SECRET ?? "development-jwt-secret-change-me",
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  jwtCookieExpiresIn: parsed.JWT_COOKIE_EXPIRES_IN,

  apiUrl: parsed.API_URL,
  frontendUrl: parsed.FRONTEND_URL,
  corsOrigins,
  trustProxy: parsed.TRUST_PROXY,
  rateLimitWindowMs: parsed.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: parsed.RATE_LIMIT_MAX,
  logLevel: parsed.LOG_LEVEL,
  logPretty: parsed.LOG_PRETTY,
  companyName: parsed.COMPANY_NAME,

  emailHost: parsed.EMAIL_HOST ?? "",
  emailPort: parsed.EMAIL_PORT,
  emailSecure: parseOptionalBoolean(parsed.EMAIL_SECURE),
  emailRequireTls: parseOptionalBoolean(parsed.EMAIL_REQUIRE_TLS, false),
  emailTlsRejectUnauthorized: parseOptionalBoolean(
    parsed.EMAIL_TLS_REJECT_UNAUTHORIZED,
    true,
  ),
  emailAddress: parsed.EMAIL_ADDRESS ?? "",
  emailPassword: parsed.EMAIL_PASSWORD ?? "",
  emailFrom: parsed.EMAIL_FROM,
} as const;
