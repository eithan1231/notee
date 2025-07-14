import { Context, Next } from "hono";
import { HonoApp } from "~/app.js";

export function createMiddlewareLogging() {
  return async (c: Context<HonoApp>, next: Next) => {
    const start = performance.now();

    await next();

    const duration = performance.now() - start;

    console.log(
      `${c.res.status} ${duration.toFixed(2)}ms ${c.req.method} ${c.req.path}`
    );
  };
}
