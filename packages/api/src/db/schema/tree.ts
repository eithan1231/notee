import { pgTable, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./user.js";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const TreeIcon = z.object({
  icon: z.enum(["default", "page"]),
  color: z.string().optional(),
  transition: z.enum(["none", "rotate"]).optional(),
  animation: z.enum(["none", "bounce", "pulse"]).optional(),
});

export const TreeNodeNote = z.object({
  type: z.literal("note"),
  id: z.uuid(),
  icon: TreeIcon.optional(),
});

export const TreeNodeFolder: z.ZodType<{
  type: "folder";
  id: string;
  title: string;
  icon?: z.infer<typeof TreeIcon>;
  iconChildren?: z.infer<typeof TreeIcon>;
  expanded: boolean;
  children?: TreeNodeType[];
}> = z.object({
  type: z.literal("folder"),
  id: z.uuid(),
  title: z.string(),
  icon: TreeIcon.optional(),
  iconChildren: TreeIcon.optional(),
  expanded: z.boolean(),
  children: z.lazy(() => z.array(TreeNode)).optional(),
});

export const TreeNode = z.union([TreeNodeNote, TreeNodeFolder]);

export type TreeNodeType = z.infer<typeof TreeNode>;

export const TreeStructureSchema = z.array(TreeNode);

export type TreeStructureSchemaType = z.infer<typeof TreeStructureSchema>;

export const treeTable = pgTable("tree", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  userId: uuid()
    .notNull()
    .unique()
    .references(() => userTable.id),

  revision: integer().notNull().default(0),

  structure: jsonb().$type<TreeStructureSchemaType>().notNull().default([]),

  created: timestamp()
    .notNull()
    .default(sql`NOW()`),
  modified: timestamp()
    .notNull()
    .default(sql`NOW()`),
});

export type TreeTableType = typeof treeTable.$inferSelect;
