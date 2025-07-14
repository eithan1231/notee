import { Context, Next } from "hono";
import { getConfigOption } from "~/config.js";
import { HonoApp } from "~/app.js";

/**
 * Strict or Relaxed mode.
 * - Strict mode: Only allows requests from the same origin.
 * - Relaxed mode: Only allows requests from the same origin. If header is not present, it will not block the request.
 */
export function createMiddlewareCsrf() {
  return async (c: Context<HonoApp>, next: Next) => {
    const headerOrigin = c.req.header("origin");

    if (!headerOrigin) {
      return await next();
    }

    if (!getConfigOption("ALLOWED_ORIGINS").includes(headerOrigin)) {
      return c.json(
        {
          success: false,
          message: "Forbidden",
        },
        403
      );
    }

    return await next();
  };
}
