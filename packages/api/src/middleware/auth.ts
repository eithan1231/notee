import { and, eq } from "drizzle-orm";
import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { getConfigOption } from "~/config.js";
import { getDrizzle } from "~/db/index.js";
import { sessionTabTable } from "~/db/schema/session-tab.js";
import { sessionTable } from "~/db/schema/session.js";
import { userTable } from "~/db/schema/user.js";
import { HonoApp } from "~/app.js";

export function createMiddlewareAuth(
  options: {
    validateHasEditPermission?: boolean;
  } = {}
) {
  return async (c: Context<HonoApp>, next: Next) => {
    const sessionTabToken = c.req.header("x-session-tab-token");
    const sessionToken = getCookie(c, getConfigOption("SESSION_COOKIE_NAME"));

    if (!sessionToken) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    if (sessionToken.length !== 128) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    const result = await getDrizzle()
      .select()
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .leftJoin(
        sessionTabTable,
        and(
          eq(sessionTabTable.token, sessionTabToken ?? ""),
          eq(sessionTabTable.sessionId, sessionTable.id)
        )
      )
      .where(eq(sessionTable.token, sessionToken))
      .limit(1);

    if (result.length <= 0) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    const { session, user, sessionTab } = result.at(0)!;

    if (session.disabled) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    if (session.expiry < new Date()) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    if (
      options.validateHasEditPermission &&
      (!sessionTab ||
        user.activeEditSessionTabId !== sessionTab.id ||
        sessionTabToken !== sessionTab.token)
    ) {
      return c.json(
        {
          success: false,
          message: "Forbidden: You do not have active edit permissions",
        },
        403
      );
    }

    c.set("auth", {
      user: user,
      session: session,
      sessionTab: sessionTab,
      other: {
        hasEditPermission: sessionTab
          ? user.activeEditSessionTabId === sessionTab.id
          : false,
      },
    });

    return await next();
  };
}
