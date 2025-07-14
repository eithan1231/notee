import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  PgColumn,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { sessionTable } from "./session.js";
import { sessionTabTable } from "./session-tab.js";

export const UserEncryptionSchema = z.object({
  // The users encryption key for decrypting their data. This is encrypted so we can store it temporarily
  // on the client side without exposing their actual password.
  encryptedKey: z.string(),
  encryptedKeyIv: z.string(), // The IV used to encrypt the encryption key.
  encryptedKeySalt: z.string(), //  The salt used to encrypt the encryption key.

  genericEncryptionIv: z.string(), // The IV used to encrypt the user's data.
  genericEncryptionSalt: z.string(), // The salt used to encrypt the user's data.

  // Decrypting a note example:
  //
  // decrypt(data, password, iv, salt)
  //
  // var decryptionKey = decrypt(encryptedKey password, encryptedKeyIv, encryptedKeySalt);
  // print("secret decryption key: " + decryptionKey)
  //
  // var decryptedNote = decrypt(note, decryptionKey, genericEncryptionIv, genericEncryptionSalt);
  // print("decrypted note: " + decryptedNote)
});

export type UserEncryptionType = z.infer<typeof UserEncryptionSchema>;

export const userTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar({ length: 256 }).notNull().unique(),
  password: text().notNull(),

  // The current user session tab which has access to WRITE actions.
  activeEditSessionTabId: uuid().references(
    (): PgColumn => sessionTabTable.id,
    {
      onDelete: "set null",
    }
  ),

  // The users encryption key, encrypted using their password on client-side.
  encryption: jsonb().$type<UserEncryptionType>().notNull(),

  created: timestamp()
    .notNull()
    .default(sql`NOW()`),
  modified: timestamp()
    .notNull()
    .default(sql`NOW()`),
});

export type UserTableType = typeof userTable.$inferSelect;
