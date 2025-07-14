export type UserEncryptionData = {
  encryptedKey: string;
  encryptedKeyIv: string;
  encryptedKeySalt: string;

  genericEncryptionIv: string;
  genericEncryptionSalt: string;
};

const ENCRYPTION_METHOD = "AES-GCM" as const;

const deriveKey = async (password: string, salt: string) => {
  const passKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    passKey,
    { name: ENCRYPTION_METHOD, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const createUserEncryption = async (
  password: string
): Promise<UserEncryptionData> => {
  // The users encryption key, which can only be decrypted with their password.
  const encryptionKey = String.fromCharCode(
    ...crypto.getRandomValues(new Uint8Array(256))
  );

  const encryptedKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeySalt = crypto.getRandomValues(new Uint8Array(16));

  const encryptedKey = await encrypt(
    {
      iv: btoa(String.fromCharCode(...encryptedKeyIv)),
      salt: btoa(String.fromCharCode(...encryptedKeySalt)),
      password,
    },
    encryptionKey
  );

  const genericEncryptionIv = crypto.getRandomValues(new Uint8Array(12));
  const genericEncryptionSalt = crypto.getRandomValues(new Uint8Array(16));

  return {
    encryptedKey: encryptedKey,
    encryptedKeyIv: btoa(String.fromCharCode(...encryptedKeyIv)),
    encryptedKeySalt: btoa(String.fromCharCode(...encryptedKeySalt)),
    genericEncryptionIv: btoa(String.fromCharCode(...genericEncryptionIv)),
    genericEncryptionSalt: btoa(String.fromCharCode(...genericEncryptionSalt)),
  };
};

export const updateUserEncryption = async (
  encryptionData: UserEncryptionData,
  password: string,
  newPassword: string
): Promise<UserEncryptionData> => {
  const key = await extractUserEncryption(encryptionData, password);

  const encryptedKey = await encrypt(
    {
      iv: encryptionData.encryptedKeyIv,
      salt: encryptionData.encryptedKeySalt,
      password: newPassword,
    },
    key.password
  );

  return {
    encryptedKey,
    encryptedKeyIv: encryptionData.encryptedKeyIv,
    encryptedKeySalt: encryptionData.encryptedKeySalt,
    genericEncryptionIv: encryptionData.genericEncryptionIv,
    genericEncryptionSalt: encryptionData.genericEncryptionSalt,
  };
};

export const extractUserEncryption = async (
  encryptionData: UserEncryptionData,
  password: string
) => {
  const decryptedKey = await decrypt(
    {
      iv: encryptionData.encryptedKeyIv,
      salt: encryptionData.encryptedKeySalt,
      password,
    },
    encryptionData.encryptedKey
  );

  return {
    iv: encryptionData.genericEncryptionIv,
    salt: encryptionData.genericEncryptionSalt,
    password: decryptedKey,
  } as EncryptionKey;
};

export type EncryptionKey = {
  iv: string;
  salt: string;
  password: string;
};

export const encrypt = async (key: EncryptionKey, data: string) => {
  const derivedKey = await deriveKey(key.password, atob(key.salt));
  const iv = new TextEncoder().encode(atob(key.iv));

  const encryptedData = await crypto.subtle.encrypt(
    { name: ENCRYPTION_METHOD, iv },
    derivedKey,
    new TextEncoder().encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
};

export const decrypt = async (key: EncryptionKey, data: string) => {
  const derivedKey = await deriveKey(key.password, atob(key.salt));
  const iv = new TextEncoder().encode(atob(key.iv));

  const decryptedData = await crypto.subtle.decrypt(
    { name: ENCRYPTION_METHOD, iv },
    derivedKey,
    Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
  );

  return new TextDecoder().decode(decryptedData);
};

export const passwordPreServer = async (
  password: string,
  passwordPreServerSalt: string
) => {
  const subjectFormatted = `${password}${passwordPreServerSalt}`;

  const hashed = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(subjectFormatted)
    )
  );

  return btoa(String.fromCharCode(...hashed));
};
