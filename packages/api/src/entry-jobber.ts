import { getPool, runDrizzleMigration } from "./db/index.js";
import { cleanupLocks } from "./lock.js";
import { validateConfig } from "./config.js";
import { createApp } from "./app.js";

// I hate top level bootstrapping but fuck it, jobber does not have a startup hook or shutdown hook.
// Side note. Shit will be forcefully shutdown by jobber when shutdown is requested :)
console.log("[main] Initialising Database connection...");
const dbPool = getPool();
await dbPool.connect();
console.log(`[main] done.`);

console.log("[main] Applying database migrations...");
if (!process.argv.includes("--skip-migrations")) {
  await runDrizzleMigration();
  console.log(`[main] done.`);
} else {
  console.log(`[main] skipped.`);
}

const app = await createApp();

export const handler = async (
  request: JobberHandlerRequest,
  response: JobberHandlerResponse,
  _context: JobberHandlerContext
) => {
  validateConfig();

  if (request.type() === "http") {
    const res = await app.fetch(request.getHttpRequest());

    response.status(res.status);

    res.headers.forEach((value, key) => {
      response.header(key, value);
    });

    // When jobber supports streaming responses, do that.
    response.chunk(Buffer.from(await res.arrayBuffer()));

    return;
  }

  if (request.type() === "schedule" && request.name() === "locks-cleanup") {
    console.log("[jobber] Running locks cleanup job...");

    await cleanupLocks();

    return;
  }

  console.warn(
    "[jobber] Received unknown request type or name. Ignoring.",
    request.type()
  );
};
