import { serve } from "@hono/node-server";

import { getPool, runDrizzleMigration } from "./db/index.js";
import { cleanupLocks } from "./lock.js";
import { validateConfig } from "./config.js";
import { createApp } from "./app.js";

async function main() {
  console.log("[main] Welcome to Notee API!");
  console.log(
    "[main] We are still in early development. Expect bugs and issues. Its always good practice to store frequent backups of your data."
  );

  console.log("[main] Validating configuration...");
  validateConfig();
  console.log("[main] done.");

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

  console.log(`[main] Initialising locks cleanup routine...`);
  const lockCleanupInterval = setInterval(async () => {
    try {
      await cleanupLocks();
    } catch (err) {
      console.error(err);
    }
  }, 5000);
  console.log(`[main] done.`);

  console.log(`[main] Cleaning up old locks...`);
  await cleanupLocks();
  console.log(`[main] done.`);

  console.log(`[main] Initialising API...`);
  const app = await createApp();

  const server = serve({
    port: 3000,
    fetch: app.fetch,
  });

  server.once("listening", () => {
    console.log("[main] API Internal now listening");
  });

  console.log(`[main] Application startup routine has completed.`);

  const signalRoutine = async () => {
    console.log(`[signalRoutine] Received shutdown signal.`);

    console.log(`[signalRoutine] Closing API Internal...`);
    server.close();
    console.log(`[signalRoutine] done.`);

    console.log(`[signalRoutine] Clearing lock cleanup interval...`);
    clearInterval(lockCleanupInterval);
    console.log(`[signalRoutine] done.`);

    console.log(`[signalRoutine] Ending Database connection...`);
    const dbPool = getPool();
    /*await*/ dbPool.end(); // TODO: Look into why this hangs.
    console.log(`[signalRoutine] done.`);

    console.log(`[signalRoutine] Routine complete... Goodbye!`);

    process.exit(0);
  };

  process.once("SIGTERM", async () => {
    await signalRoutine();
  });

  process.once("SIGINT", async () => {
    await signalRoutine();
  });
}

void main();
