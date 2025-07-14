import {
  pgTable,
  uuid,
  integer,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const NoteNoticesSchema = z.array(
  z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    content: z.string(),
    created: z.iso.datetime().default(() => new Date().toISOString()),
  })
);

export type NoteNoticesType = z.infer<typeof NoteNoticesSchema>;

export const noteTable = pgTable("note", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),

  title: text().notNull(),
  revision: integer().notNull().default(0),

  notices: jsonb().$type<NoteNoticesType>().notNull().default([]),
  content: text(),

  created: timestamp()
    .notNull()
    .default(sql`NOW()`),
  modified: timestamp()
    .notNull()
    .default(sql`NOW()`),
});

export type NoteTableType = typeof noteTable.$inferSelect;
