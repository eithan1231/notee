import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod/v4";
import { getDrizzle } from "~/db/index.js";
import { UserEncryptionSchema, userTable } from "~/db/schema/user.js";
import { HonoApp } from "~/app.js";
import { genSalt, hash, compare } from "bcryptjs";
import assert from "assert";
import { createSessionExpiry, sessionTable } from "~/db/schema/session.js";
import { setCookie } from "hono/cookie";
import { getConfigOption } from "~/config.js";
import { createMiddlewareAuth } from "~/middleware/auth.js";
import { createMiddlewareResponseTime } from "~/middleware/response-time.js";
import { withLock } from "~/lock.js";
import { treeTable } from "~/db/schema/tree.js";
import { sessionTabTable } from "~/db/schema/session-tab.js";
import { createMiddlewareCsrf } from "~/middleware/csrf.js";

const isEmailTaken = async (email: string) => {
  const result = await getDrizzle()
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  return result.length > 0;
};

export const honoAuth = new Hono<HonoApp>().basePath("/auth");

const responseTimeMiddleware = createMiddlewareResponseTime(1000);

honoAuth.post(
  "/login",
  responseTimeMiddleware,
  createMiddlewareCsrf(),
  async (c) => {
    if (!getConfigOption("FEATURE_AUTH_LOGIN_ENABLED")) {
      return c.json(
        {
          success: false,
          message: "Login is not enabled",
        },
        403
      );
    }

    const schema = z.object({
      email: z.email().max(256),
      password: z.string().min(32).max(1024),
      sessionDuration: z.enum(["short", "medium", "long"]).default("medium"),
    });

    const body = await schema.parseAsync(await c.req.json());

    const user = await getDrizzle()
      .select()
      .from(userTable)
      .where(eq(userTable.email, body.email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user || !user.password) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        401
      );
    }

    const isPasswordValid = await compare(body.password, user.password);

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        401
      );
    }

    const resultSession = await getDrizzle()
      .insert(sessionTable)
      .values({
        userId: user.id,
        expiry: createSessionExpiry(body.sessionDuration),
      })
      .returning();

    const session = resultSession.at(0);
    assert(session);

    setCookie(c, getConfigOption("SESSION_COOKIE_NAME"), session.token, {
      expires: session.expiry,
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    return c.json({
      success: true,
    });
  }
);

honoAuth.post(
  "/register",
  responseTimeMiddleware,
  createMiddlewareCsrf(),
  async (c) => {
    if (!getConfigOption("FEATURE_AUTH_REGISTER_ENABLED")) {
      return c.json(
        {
          success: false,
          message: "Registration is not enabled",
        },
        403
      );
    }

    const schema = z.object({
      email: z.email().max(256),
      password: z.string().min(32).max(1024),
      encryption: z.lazy(() => UserEncryptionSchema),
      sessionDuration: z.enum(["short", "medium", "long"]).default("medium"),
    });

    const body = await schema.parseAsync(await c.req.json());

    if (await isEmailTaken(body.email)) {
      return c.json({
        success: false,
        message: "Email address has been taken",
      });
    }

    const passwordSalt = await genSalt();
    const passwordHashed = await hash(body.password, passwordSalt);

    const resultUser = await getDrizzle()
      .insert(userTable)
      .values({
        email: body.email,
        password: passwordHashed,
        encryption: body.encryption,
      })
      .returning();

    const user = resultUser.at(0);

    assert(user);

    // Create initial tree for user
    await getDrizzle().insert(treeTable).values({
      userId: user.id,
    });

    const resultSession = await getDrizzle()
      .insert(sessionTable)
      .values({
        userId: user.id,
        expiry: createSessionExpiry(body.sessionDuration),
      })
      .returning();

    const session = resultSession.at(0);

    assert(session);

    setCookie(c, getConfigOption("SESSION_COOKIE_NAME"), session.token, {
      httpOnly: true,
      expires: session.expiry,
      sameSite: "Strict",
    });

    return c.json({
      success: true,
    });
  }
);

honoAuth.post(
  "/password",
  createMiddlewareAuth(),
  createMiddlewareCsrf(),
  async (c) => {
    const auth = c.get("auth")!;

    const schema = z.object({
      currentPassword: z.string().min(32).max(1024),
      password: z.string().min(32).max(1024),
      encryption: z.lazy(() => UserEncryptionSchema),
    });

    const body = await schema.parseAsync(await c.req.json());

    return await withLock("user", auth.user.id, async () => {
      const isPasswordValid = await compare(
        body.currentPassword,
        auth.user.password
      );

      if (!isPasswordValid) {
        return c.json(
          {
            success: false,
            message: "Invalid current password",
          },
          401
        );
      }

      const passwordSalt = await genSalt();
      const passwordHashed = await hash(body.password, passwordSalt);

      await getDrizzle()
        .update(userTable)
        .set({
          password: passwordHashed,
          encryption: body.encryption,
          modified: new Date(),
        })
        .where(eq(userTable.id, auth.user.id));
      //

      return c.json({
        success: true,
      });
    });
  }
);

honoAuth.post(
  "/logout",
  createMiddlewareAuth(),
  createMiddlewareCsrf(),
  async (c) => {
    const auth = c.get("auth")!;

    await getDrizzle()
      .delete(sessionTable)
      .where(eq(sessionTable.id, auth.session.id));
    //

    setCookie(c, getConfigOption("SESSION_COOKIE_NAME"), "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    return c.json({
      success: true,
    });
  }
);

honoAuth.post(
  "/session-extend",
  createMiddlewareAuth(),
  createMiddlewareCsrf(),
  async (c) => {
    const auth = c.get("auth")!;

    const schema = z.object({
      sessionDuration: z.enum(["short", "medium", "long"]).default("medium"),
    });

    const body = await schema.parseAsync(await c.req.json());

    return await withLock("session", auth.session.id, async () => {
      await getDrizzle()
        .update(sessionTable)
        .set({
          expiry: createSessionExpiry(body.sessionDuration),
        })
        .where(eq(sessionTable.id, auth.session.id));

      setCookie(c, getConfigOption("SESSION_COOKIE_NAME"), auth.session.token, {
        expires: auth.session.expiry,
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
      });

      return c.json({
        success: true,
      });
    });
  }
);

honoAuth.get("/", createMiddlewareAuth(), createMiddlewareCsrf(), async (c) => {
  const auth = c.get("auth")!;

  const user = await getDrizzle()
    .select()
    .from(userTable)
    .where(eq(userTable.id, auth.user.id))
    .limit(1)
    .then((rows) => rows[0]);
  //

  assert(user);

  return c.json({
    success: true,
    data: {
      other: {
        isActiveEditor: auth.other.hasEditPermission,
        doesUserHaveActiveEditor: user.activeEditSessionTabId !== null,
      },
      session: {
        expiry: auth.session.expiry,
      },
      user: {
        id: user.id,
        email: user.email,
        encryption: user.encryption,
      },
    },
  });
});

honoAuth.post(
  "/active-editor",
  createMiddlewareAuth(),
  createMiddlewareCsrf(),
  async (c) => {
    const auth = c.get("auth")!;

    return await withLock("user", auth.user.id, async () => {
      const sessionTab =
        auth.sessionTab ??
        (
          await getDrizzle()
            .insert(sessionTabTable)
            .values({
              sessionId: auth.session.id,
            })
            .returning()
        ).at(0);

      assert(sessionTab);

      await getDrizzle()
        .update(userTable)
        .set({
          activeEditSessionTabId: sessionTab.id,
          modified: new Date(),
        })
        .where(eq(userTable.id, auth.user.id));

      return c.json({
        success: true,
        data: {
          sessionTab: {
            token: sessionTab.token,
          },
        },
      });
    });
  }
);

honoAuth.delete(
  "/active-editor",
  createMiddlewareAuth(),
  createMiddlewareCsrf(),
  async (c) => {
    const auth = c.get("auth")!;

    return await withLock("user", auth.user.id, async () => {
      await getDrizzle()
        .update(userTable)
        .set({
          activeEditSessionTabId: null,
          modified: new Date(),
        })
        .where(and(eq(userTable.id, auth.user.id)));

      return c.json({
        success: true,
      });
    });
  }
);
