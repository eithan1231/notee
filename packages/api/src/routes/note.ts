import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import assert from "node:assert";
import { z } from "zod/v4";
import { getDrizzle } from "~/db/index.js";
import { noteTable } from "~/db/schema/note.js";
import { HonoApp } from "~/app.js";
import { withLock } from "~/lock.js";
import { createMiddlewareAuth } from "~/middleware/auth.js";

export const honoNote = new Hono<HonoApp>().basePath("/note");

honoNote.get("/", createMiddlewareAuth(), async (c) => {
  const auth = c.get("auth")!;

  const result = await getDrizzle()
    .select({
      id: noteTable.id,
      title: noteTable.title,
      revision: noteTable.revision,
      created: noteTable.created,
      modified: noteTable.modified,
    })
    .from(noteTable)
    .where(eq(noteTable.userId, auth.user.id));

  return c.json({
    success: true,
    data: {
      notes: result,
    },
  });
});

honoNote.get("/:noteId", createMiddlewareAuth(), async (c, next) => {
  const noteId = c.req.param("noteId");
  const auth = c.get("auth")!;

  const note = (
    await getDrizzle()
      .select({
        id: noteTable.id,
        title: noteTable.title,
        revision: noteTable.revision,
        notices: noteTable.notices,
        content: noteTable.content,
        created: noteTable.created,
        modified: noteTable.modified,
      })
      .from(noteTable)
      .where(and(eq(noteTable.userId, auth.user.id), eq(noteTable.id, noteId)))
      .limit(1)
  ).at(0);

  if (!note) {
    return await next();
  }

  return c.json({
    success: true,
    data: {
      note: note,
    },
  });
});

honoNote.post(
  "/",
  createMiddlewareAuth({
    validateHasEditPermission: true,
  }),
  async (c) => {
    const auth = c.get("auth")!;

    const schema = z.object({
      title: z.string(),
      content: z.string(),
    });

    const body = await schema.parseAsync(await c.req.json());

    const note = await getDrizzle()
      .insert(noteTable)
      .values({
        userId: auth.user.id,
        title: body.title,
        content: body.content,
      })
      .returning()
      .then((rows) => rows[0]);

    assert(note);

    return c.json({
      success: true,
      data: {
        note: {
          id: note.id,
          title: note.title,
          revision: note.revision,
          notices: note.notices,
          content: note.content,
          created: note.created,
          modified: note.modified,
        },
      },
    });
  }
);

honoNote.patch(
  "/:noteId",
  createMiddlewareAuth({
    validateHasEditPermission: true,
  }),
  async (c, next) => {
    const noteId = c.req.param("noteId");
    const auth = c.get("auth")!;

    const schema = z.object({
      title: z.string().optional(),
      content: z.string().optional(),
      revision: z.number(),
    });

    const body = await schema.parseAsync(await c.req.json());

    const note = (
      await getDrizzle()
        .select({
          id: noteTable.id,
          title: noteTable.title,
          revision: noteTable.revision,
          notices: noteTable.notices,
          content: noteTable.content,
          created: noteTable.created,
          modified: noteTable.modified,
        })
        .from(noteTable)
        .where(
          and(eq(noteTable.userId, auth.user.id), eq(noteTable.id, noteId))
        )
        .limit(1)
    ).at(0);

    if (!note) {
      return await next();
    }

    return withLock("note", note.id, async () => {
      if (body.revision !== note.revision + 1) {
        return c.json(
          {
            success: false,
            message: "Revision must be an increment of 1",
          },
          409
        );
      }

      const noteUpdated = (
        await getDrizzle()
          .update(noteTable)
          .set({
            title: body.title ?? note.title,
            content: body.content ?? note.content,
            revision: body.revision,
            modified: new Date(),
          })
          .where(
            and(eq(noteTable.userId, auth.user.id), eq(noteTable.id, noteId))
          )
          .returning()
      ).at(0);

      assert(noteUpdated);

      return c.json({
        success: true,
        data: {
          note: noteUpdated,
        },
      });
    });
  }
);

honoNote.delete(
  "/:noteId",
  createMiddlewareAuth({
    validateHasEditPermission: true,
  }),
  async (c) => {
    const auth = c.get("auth")!;

    return c.json({
      success: false,
      message: "Not implemented yet",
    });
  }
);
