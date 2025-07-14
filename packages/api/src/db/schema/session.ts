import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  PgColumn,
} from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { getUnixTimestamp } from "~/util.js";
import { randomBytes } from "crypto";
import { getConfigOption } from "~/config.js";
import { sql } from "drizzle-orm";
import { sessionTabTable } from "./session-tab.js";

export const sessionTable = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),

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

  activeSessionTabId: uuid().references((): PgColumn => sessionTabTable.id, {
    onDelete: "set null",
  }),

  userId: uuid()
    .notNull()
    .references((): PgColumn => userTable.id),

  disabled: boolean().default(false),

  expiry: timestamp().notNull(),

  created: timestamp()
    .notNull()
    .default(sql`NOW()`),
  modified: timestamp()
    .notNull()
    .default(sql`NOW()`),
});

export type SessionTableType = typeof sessionTable.$inferSelect;

export function createSessionExpiry(term: "short" | "medium" | "long") {
  if (term === "short") {
    return new Date(
      (getUnixTimestamp() + getConfigOption("SESSION_DURATION_SHORT")) * 1000
    );
  }

  if (term === "medium") {
    return new Date(
      (getUnixTimestamp() + getConfigOption("SESSION_DURATION_MEDIUM")) * 1000
    );
  }

  if (term === "long") {
    return new Date(
      (getUnixTimestamp() + getConfigOption("SESSION_DURATION_LONG")) * 1000
    );
  }

  throw new Error(`[createSessionExpiry] Unexpected term "${term}"`);
}
