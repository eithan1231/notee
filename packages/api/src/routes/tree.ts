import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import assert from "node:assert";
import { z } from "zod/v4";
import { getDrizzle } from "~/db/index.js";
import { noteTable, NoteTableType } from "~/db/schema/note.js";
import {
  TreeStructureSchema,
  TreeStructureSchemaType,
  treeTable,
} from "~/db/schema/tree.js";
import { HonoApp } from "~/app.js";
import { withLock } from "~/lock.js";
import { createMiddlewareAuth } from "~/middleware/auth.js";

export const honoTree = new Hono<HonoApp>().basePath("/tree");

honoTree.get("/", createMiddlewareAuth(), async (c) => {
  const auth = c.get("auth");

  assert(auth);

  const trees = await getDrizzle()
    .select({
      id: treeTable.id,
      userId: treeTable.userId,
      revision: treeTable.revision,
      structure: treeTable.structure,
      created: treeTable.created,
      modified: treeTable.modified,
    })
    .from(treeTable)
    .where(and(eq(treeTable.userId, auth.user.id)));

  const tree = trees.at(0);

  if (!tree) {
    return c.json(
      {
        success: false,
        error: "Tree not found",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: {
      structure: tree.structure,
      revision: tree.revision,
      modified: tree.modified,
      created: tree.created,
    },
  });
});

honoTree.post(
  "/",
  createMiddlewareAuth({
    validateHasEditPermission: true,
  }),
  async (c) => {
    const auth = c.get("auth");

    assert(auth);

    const schema = z
      .object({
        structure: TreeStructureSchema,

        // The current revision of the tree. Should be a +1 increment of the last revision.
        // If its not, the request should fail. Client will need to resynchronise.
        revision: z.number(),
      })
      .strict();

    const body = await schema.parseAsync(await c.req.json());

    const existingTree = (
      await getDrizzle()
        .select({
          id: treeTable.id,
          userId: treeTable.userId,
          revision: treeTable.revision,
          structure: treeTable.structure,
          created: treeTable.created,
          modified: treeTable.modified,
        })
        .from(treeTable)
        .where(and(eq(treeTable.userId, auth.user.id)))
    ).at(0);

    assert(existingTree);

    if (body.revision !== existingTree.revision + 1) {
      console.warn(
        `Tree revision ${body.revision} is not the next revision after existing tree revision ${existingTree.revision}`
      );

      return c.json(
        {
          success: false,
          error:
            "Revision is not the next revision after existing tree revision",
        },
        400
      );
    }

    return await withLock("tree", existingTree.id, async () => {
      const notes = await getDrizzle()
        .select({
          id: noteTable.id,
          userId: noteTable.userId,
          created: noteTable.created,
          modified: noteTable.modified,
        })
        .from(noteTable)
        .where(eq(noteTable.userId, auth.user.id));
      //

      const missingNotes = await findMissingNotes(body.structure, notes);

      if (!missingNotes.success) {
        return c.json(
          {
            success: false,
            message: "Tree structure contains notes that are missing",
          },
          400
        );
      }

      const danglingNotes = await findDanglingNotes(body.structure, notes);

      if (!danglingNotes.success) {
        return c.json(
          {
            success: false,
            message: "Tree structure contains dangling notes",
            errorNoteIds: danglingNotes.errorNoteIds,
          },
          400
        );
      }

      const result = (
        await getDrizzle()
          .update(treeTable)
          .set({
            revision: body.revision,
            structure: body.structure,
            modified: new Date(),
          })
          .where(eq(treeTable.userId, auth.user.id))
          .returning()
      ).at(0);

      if (!result) {
        return c.json(
          {
            success: false,
            error: "Failed to update tree",
          },
          500
        );
      }

      return c.json({
        success: true,
        data: {
          structure: result.structure,
          revision: result.revision,
          created: result.created,
          modified: result.modified,
        },
      });
    });
  }
);

/**
 * Checks that all notes on the tree are present in the notes array.
 */
const findDanglingNotes = async (
  tree: TreeStructureSchemaType,
  notes: Pick<NoteTableType, "id" | "userId" | "created" | "modified">[]
) => {
  const errorNoteIds: string[] = [];
  for (const node of tree) {
    if (node.type === "folder" && node.children) {
      const result = await findDanglingNotes(node.children, notes);
      if (!result.success) {
        errorNoteIds.push(...result.errorNoteIds);
      }
    }

    if (
      node.type === "note" &&
      !notes.find((note) => {
        return note.id === node.id;
      })
    ) {
      errorNoteIds.push(node.id);
    }
  }

  if (errorNoteIds.length) {
    return {
      success: false,
      errorNoteIds,
    } as const;
  }

  return {
    success: true,
  } as const;
};

const findNoteInTree = async (
  tree: TreeStructureSchemaType,
  noteId: string
): Promise<boolean> => {
  for (const node of tree) {
    if (node.type === "note" && node.id === noteId) {
      return true;
    }

    if (node.type === "folder" && node.children) {
      const foundNode = await findNoteInTree(node.children, noteId);
      if (foundNode) {
        return foundNode;
      }
    }
  }

  return false;
};

/**
 * Checks that no notes are missing from the tree
 */
const findMissingNotes = async (
  tree: TreeStructureSchemaType,
  notes: Pick<NoteTableType, "id" | "userId" | "created" | "modified">[]
) => {
  const errorNoteIds: string[] = [];

  for (const note of notes) {
    const noteInTree = await findNoteInTree(tree, note.id);
    if (!noteInTree) {
      errorNoteIds.push(note.id);
    }
  }

  if (errorNoteIds.length) {
    return {
      success: false,
      errorNoteIds,
    } as const;
  }

  return {
    success: true,
  } as const;
};
