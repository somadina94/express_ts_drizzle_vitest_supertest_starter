import type { Server } from "http";
import { env } from "./config/env.js";
import { assertPostgresReachableInDocker } from "./utils/assertPostgresReachableInDocker.js";
import { logPostgresConnectionHints } from "./utils/postgresConnectionHints.js";
import { logger } from "./utils/logger.js";
import app from "./app.js";
import { closeDb, connectDb, setDbConnected } from "./lib/db.js";

const port = env.port;
const databaseUrl = env.databaseUrl;

assertPostgresReachableInDocker(databaseUrl);

let server: Server | undefined;

const connectDatabase = async () => {
  await connectDb();
  setDbConnected(true);
  logger.info("PostgreSQL connected");
};

const closeServer = async (signal: string, exitCode = 0) => {
  logger.info({ signal }, "Shutting down gracefully");

  await new Promise<void>((resolve) => {
    if (!server) {
      resolve();
      return;
    }

    server.close(() => resolve());
  });

  await closeDb();
  process.exit(exitCode);
};

const startServer = async () => {
  try {
    await connectDatabase();
    server = app.listen(port, () => {
      logger.info({ port }, "Express TS Drizzle Base API listening");
    });
  } catch (err) {
    logPostgresConnectionHints(err, databaseUrl);
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
};

void startServer();

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "UNHANDLED REJECTION");
  void closeServer("unhandledRejection", 1);
});

process.on("SIGTERM", () => {
  void closeServer("SIGTERM");
});

process.on("SIGINT", () => {
  void closeServer("SIGINT");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "UNCAUGHT EXCEPTION");
  void closeServer("uncaughtException", 1);
});
