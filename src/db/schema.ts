import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const examples = pgTable("Example", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 })
    .notNull()
    .defaultNow(),
});
