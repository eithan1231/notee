import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  PgColumn,
} from "drizzle-orm/pg-core";
import { randomBytes } from "crypto";
import { sql } from "drizzle-orm";
import { sessionTable } from "./session.js";

// These are individual sessions which belong to a parent session, that are assigned to
// each tab in a browser.
export const sessionTabTable = pgTable("sessionTab", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),

  sessionId: uuid()
    .notNull()
    .references((): PgColumn => sessionTable.id, {
      onDelete: "cascade",
    }),

  token: varchar({ length: 128 })
    .unique()
    .notNull()
    .$defaultFn(() =>
      randomBytes(128)
        .toString("base64")
        .replaceAll("=", "")
        .replaceAll("/", "")
        .substring(0, 128)
    ),

  created: timestamp()
    .notNull()
    .default(sql`NOW()`),
  modified: timestamp()
    .notNull()
    .default(sql`NOW()`),
});

export type SessionTabTableType = typeof sessionTabTable.$inferSelect;
