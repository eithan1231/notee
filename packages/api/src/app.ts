import { Hono } from "hono";

import { honoAuth } from "./routes/auth.js";
import { honoConfig } from "./routes/config.js";
import { honoMetrics } from "./routes/get-metrics.js";
import { honoNote } from "./routes/note.js";
import { honoTree } from "./routes/tree.js";
import { createMiddlewareLogging } from "./middleware/logging.js";
import { UserTableType } from "./db/schema/user.js";
import { SessionTabTableType } from "./db/schema/session-tab.js";
import { SessionTableType } from "./db/schema/session.js";
import { serveStatic } from "@hono/node-server/serve-static";

export type HonoApp = {
  Variables: {
    auth?: {
      user: UserTableType;
      session: SessionTableType;
      sessionTab: SessionTabTableType | null;
      other: {
        hasEditPermission: boolean;
      };
    };
  };
};

export async function createApp() {
  const app = new Hono<HonoApp>();

  app.use("*", createMiddlewareLogging());

  app.onError(async (err, c) => {
    console.error(err);

    return c.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      500
    );
  });

  app.notFound(async (c) => {
    return c.json(
      {
        success: false,
        message: "Not Found",
      },
      404
    );
  });

  app.route("/api/", honoAuth);
  app.route("/api/", honoConfig);
  app.route("/api/", honoMetrics);
  app.route("/api/", honoNote);
  app.route("/api/", honoTree);

  app.get("/", async (c) => c.redirect("/notee/"));

  app.use(
    "/*",
    serveStatic({
      root: "./public",
    })
  );

  app.use(
    "*",
    serveStatic({
      path: "index.html",
      root: "./public/",
    })
  );

  return app;
}
