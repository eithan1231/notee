import { z } from "zod/v4";

export const ConfigurationOptionsSchema = z.object({
  DATABASE_URL: z.string(),

  // Allowed origins for CSRF related requests. CSV support.
  // eg: https://localhost,https://example.com
  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(",").map((v) => v.trim()))
    .pipe(z.string().array()),

  SESSION_DURATION_SHORT: z.coerce.number().default(60 * 60),
  SESSION_DURATION_MEDIUM: z.coerce.number().default(60 * 60 * 24 * 16),
  SESSION_DURATION_LONG: z.coerce.number().default(60 * 60 * 24 * 365),
  SESSION_COOKIE_NAME: z.string().default("notee-session"),

  // No raw passwords should ever touch the server, as otherwise the server could decrypt the users
  // password and access their data. If this value ever changes, all user passwords will no longer work.
  PASSWORD_PRE_SERVER_SALT: z.string().min(12).max(128),

  // See this page for some further examples:
  // https://stackoverflow.com/a/21456918
  PASSWORD_REGEX: z
    .string()
    .default("^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$"),
  PASSWORD_REGEX_MESSAGE: z
    .string()
    .default(
      "Password must be at least 8 characters long and contain at least one letter and one number."
    ),

  METRICS_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .pipe(z.boolean())
    .default(false),
  METRICS_TOKEN: z.string().optional(),

  FEATURE_AUTH_REGISTER_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .pipe(z.boolean())
    .default(true),
  FEATURE_AUTH_LOGIN_ENABLED: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .pipe(z.boolean())
    .default(true),

  DEV_FLAG: z
    .string()
    .transform((val) => val.toLowerCase() === "true")
    .pipe(z.boolean())
    .default(false),
  DEV_AUTOFILL_EMAIL: z.string().nullable().default(null),
  DEV_AUTOFILL_PASSWORD: z.string().nullable().default(null),
});

export type ConfigurationOptionsSchemaType = z.output<
  typeof ConfigurationOptionsSchema
>;

export type ConfigurationOptions = keyof ConfigurationOptionsSchemaType;

export const getConfigOption = <T extends ConfigurationOptions>(
  option: T
): ConfigurationOptionsSchemaType[T] => {
  const schema = ConfigurationOptionsSchema.shape[option];

  return schema.parse(process.env[option]) as ConfigurationOptionsSchemaType[T];
};

export const validateConfig = () => {
  const result = ConfigurationOptionsSchema.safeParse(process.env);

  if (!result.success) {
    for (const issue of result.error.issues) {
      console.error(
        `Configuration error (${issue.path.join(".")}): ${issue.message}`
      );
    }

    throw new Error("Invalid configuration");
  }

  return result.data;
};
