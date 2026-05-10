import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { closeDb } from "../src/lib/db.js";

afterAll(async () => {
  await closeDb().catch(() => undefined);
});

describe("health routes", () => {
  it("reports process liveness", async () => {
    const res = await request(app).get("/api/v1/health/live");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      checks: {
        process: "up",
      },
    });
  });

  it("reports not ready when PostgreSQL is disconnected", async () => {
    const res = await request(app).get("/api/v1/health/ready");

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: "unavailable",
      checks: {
        postgres: "down",
      },
    });
  });
});

describe("fallback route", () => {
  it("returns a 404 application error", async () => {
    const res = await request(app).get("/api/v1/missing-route");

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("Can't find /api/v1/missing-route");
  });
});
