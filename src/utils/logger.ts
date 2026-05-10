import pino from "pino";
import { env } from "../config/env.js";

const baseOptions = {
  level: env.nodeEnv === "test" ? ("silent" as const) : env.logLevel,
  base: {
    service: "express-ts-drizzle-base",
    environment: env.nodeEnv,
  },
} satisfies pino.LoggerOptions;

export const logger = pino({
  ...baseOptions,
  ...(env.logPretty
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        },
      }
    : {}),
});
