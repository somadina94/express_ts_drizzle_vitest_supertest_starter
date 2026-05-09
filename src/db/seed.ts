import "dotenv/config";
import { closeDb } from "../lib/db.js";

async function main(): Promise<void> {
  // Add seed data here, e.g. await db.insert(examples).values({ id: "example" });
}

void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
