process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(err);
  console.error(err instanceof Error ? err.stack : "Not an Error");
  process.exit(1);
});

import { env, assertJwtSecret } from "./config/env.js";
import app from "./app.js";
import { closeDb, connectDb } from "./lib/db.js";

assertJwtSecret();

const port = env.port;

const server = app.listen(port, () => {
  console.log(`API listening on port ${port}`);
  void connectPostgres();
});

const connectPostgres = async () => {
  try {
    await connectDb();
    console.log("PostgreSQL connected");
  } catch (e) {
    console.error("Failed to connect to PostgreSQL", e);
    server.close(() => {
      process.exit(1);
    });
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION");
  console.error(reason);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  server.close(() => {
    void closeDb().finally(() => {
      process.exit(0);
    });
  });
});
