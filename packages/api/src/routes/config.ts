import { Hono } from "hono";
import { getConfigOption } from "~/config.js";
import { HonoApp } from "~/app.js";

export const honoConfig = new Hono<HonoApp>().basePath("/config");

honoConfig.get("/fetch", async (c) => {
  return c.json({
    success: true,
    data: {
      passwordPreServerSalt: getConfigOption("PASSWORD_PRE_SERVER_SALT"),
      feature: {
        authRegisterEnabled: getConfigOption("FEATURE_AUTH_REGISTER_ENABLED"),
        authLoginEnabled: getConfigOption("FEATURE_AUTH_LOGIN_ENABLED"),
      },
      dev: {
        flag: getConfigOption("DEV_FLAG"),
        autofillEmail: getConfigOption("DEV_AUTOFILL_EMAIL"),
        autofillPassword: getConfigOption("DEV_AUTOFILL_PASSWORD"),
      },
    },
  });
});
