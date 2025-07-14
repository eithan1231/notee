import { Hono } from "hono";
import { register } from "prom-client";
import { getConfigOption } from "~/config.js";

export const honoMetrics = new Hono();

honoMetrics.get("/metrics", async (c, next) => {
  if (!getConfigOption("METRICS_ENABLED")) {
    return await next();
  }

  const token = getConfigOption("METRICS_TOKEN");

  if (token) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!authHeader.toLowerCase().startsWith("bearer")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const authHeaderToken = authHeader.split(" ", 2).at(1);

    if (authHeaderToken !== token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  c.header("Content-Type", register.contentType);

  return c.text(await register.metrics(), 200);
});
