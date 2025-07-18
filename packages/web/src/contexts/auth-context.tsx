import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  apiAuthLogin,
  apiAuthLogout,
  apiAuthMe,
  apiAuthPassword,
  apiAuthRegister,
  apiAuthRemoveActiveEditor,
  ApiAuthResponse,
  apiAuthSetActiveEditor,
} from "../api/auth";
import { EncryptionKey, extractUserEncryption } from "../util/encryption";
import { ApiContext, ApiGenericResponse } from "../api";
import { StorageContext } from "./storage-context";
import { apiConfigFetch } from "../api/config";

export type AuthContextType = {
  apiContext: ApiContext;
  auth: null | ApiAuthResponse;
  key: null | EncryptionKey;
  authInitialised: boolean;
  setActiveEditor: () => Promise<void>;
  removeActiveEditor: () => Promise<void>;
  login: (email: string, password: string) => Promise<ApiGenericResponse>;
  register: (email: string, password: string) => Promise<ApiGenericResponse>;
  passwordUpdate: (
    currentPassword: string,
    newPassword: string
  ) => Promise<ApiGenericResponse>;
  logout: () => Promise<ApiGenericResponse>;
  lock: () => Promise<void>;
  decryptEncryptionKey: (password: string) => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType>({
  apiContext: {},
  auth: null,
  key: null,
  authInitialised: false,
  setActiveEditor: async () => {
    throw new Error("Not implemented");
  },
  removeActiveEditor: async () => {
    throw new Error("Not implemented");
  },
  login: async () => {
    throw new Error("Not implemented");
  },
  register: async () => {
    throw new Error("Not implemented");
  },
  passwordUpdate: async () => {
    throw new Error("Not implemented");
  },
  logout: async () => {
    throw new Error("Not implemented");
  },
  lock: async () => {
    throw new Error("Not implemented");
  },
  decryptEncryptionKey: async () => {
    throw new Error("Not implemented");
  },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { storageLoaded, storageData, setStorageData } =
    useContext(StorageContext);

  const [auth, setAuth] = useState<AuthContextType["auth"]>(null);
  const [key, setKey] = useState<EncryptionKey | null>(null);
  const [apiContext, setApiContext] = useState<ApiContext>({});
  const [initialised, setInitialised] = useState<boolean>(false);

  useEffect(() => {
    const fetchAuth = async () => {
      apiAuthMe(apiContext).then((result) => {
        setAuth(result.success ? result.data : null);

        setInitialised(true);
      });
    };

    fetchAuth();

    const interval = setInterval(() => fetchAuth(), 10000);
    return () => clearInterval(interval);
  }, [apiContext]);

  useEffect(() => {
    try {
      if (
        !storageLoaded ||
        !storageData.shouldStoreKey ||
        storageData.key === null ||
        key !== null
      ) {
        return;
      }

      setKey(storageData.key);
    } catch (error) {
      console.error("Failed to parse stored decryption key", error);
    }
  }, [storageLoaded, storageData, key]);

  const setActiveEditor = useCallback(async () => {
    if (!auth) {
      console.warn("setActiveEditor called without auth");
      return;
    }

    const result = await apiAuthSetActiveEditor(apiContext);
    const resultUser = await apiAuthMe(apiContext);

    if (!result.success) {
      console.error("Failed to set active editor", result.message);
      return;
    }

    setApiContext((prev) => {
      return {
        ...prev,
        sessionTabToken: result.data.sessionTab.token,
      };
    });

    if (resultUser.success) {
      setAuth(resultUser.data);
    }
  }, [auth, apiContext]);

  const removeActiveEditor = useCallback(async () => {
    if (!auth) {
      console.warn("removeActiveEditor called without auth");
      return;
    }

    const result = await apiAuthRemoveActiveEditor(apiContext);
    const resultUser = await apiAuthMe(apiContext);

    if (!result.success) {
      console.error("Failed to set remove editor", result.message);
      return;
    }

    if (resultUser.success) {
      setAuth(resultUser.data);
    }
  }, [auth, apiContext]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiAuthLogin(apiContext, email, password);

      if (!result.success) {
        return result;
      }

      const me = await apiAuthMe(apiContext);
      if (!me.success) {
        throw new Error("Failed to fetch user info after login");
      }

      const decryptedKey = await extractUserEncryption(
        me.data.user.encryption,
        password
      );

      setAuth(me.data);
      setKey(decryptedKey);

      if (storageLoaded && storageData.shouldStoreKey) {
        setStorageData("key", decryptedKey);
      }

      return result;
    },
    [storageLoaded, storageData, apiContext]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<ApiGenericResponse> => {
      const config = await apiConfigFetch();

      if (!config.success) {
        return { success: false, message: "Failed to fetch configuration" };
      }

      if (!new RegExp(config.data.passwordRegex).test(password)) {
        return {
          success: false,
          message:
            config.data.passwordRegexMessage || "Invalid password format",
        };
      }

      const result = await apiAuthRegister(apiContext, email, password);

      if (!result.success) {
        return result;
      }

      const me = await apiAuthMe(apiContext);
      if (!me.success) {
        throw new Error("Failed to fetch user info after login");
      }

      const decryptedKey = await extractUserEncryption(
        me.data.user.encryption,
        password
      );

      setAuth(me.data);
      setKey(decryptedKey);

      if (storageLoaded && storageData.shouldStoreKey) {
        setStorageData("key", decryptedKey);
      }

      return result;
    },
    [storageLoaded, storageData, apiContext]
  );

  const passwordUpdate = useCallback(
    async (
      currentPassword: string,
      password: string
    ): Promise<ApiGenericResponse> => {
      const config = await apiConfigFetch();

      if (!config.success) {
        return { success: false, message: "Failed to fetch configuration" };
      }

      if (!new RegExp(config.data.passwordRegex).test(password)) {
        return {
          success: false,
          message:
            config.data.passwordRegexMessage || "Invalid password format",
        };
      }

      if (!auth) {
        console.warn("passwordUpdate called without auth");
        return { success: false, message: "Not authenticated" };
      }

      const result = await apiAuthPassword(
        apiContext,
        currentPassword,
        auth.user.encryption,
        password
      );

      if (!result.success) {
        return result;
      }

      const me = await apiAuthMe(apiContext);
      if (!me.success) {
        throw new Error("Failed to fetch user info after password update");
      }

      try {
        const decryptedKey = await extractUserEncryption(
          me.data.user.encryption,
          password
        );

        setAuth(me.data);
        setKey(decryptedKey);

        if (storageLoaded && storageData.shouldStoreKey) {
          setStorageData("key", decryptedKey);
        }

        return result;
      } catch (error) {
        console.error("Failed to decrypt new encryption key", error);
        return {
          success: false,
          message: "Failed to decrypt new encryption key",
        };
      }
    },
    [auth, storageData, apiContext]
  );

  const logout = useCallback(async (): Promise<ApiGenericResponse> => {
    if (!auth) {
      console.warn("logout called without auth");
      return { success: false, message: "Not authenticated" };
    }

    const result = await apiAuthLogout(apiContext);

    if (result.success) {
      setAuth(null);
      setKey(null);
      setApiContext({});
      if (storageLoaded) {
        setStorageData("key", null);
      }
    }

    return result;
  }, [auth, apiContext, storageLoaded]);

  const lock = useCallback(async () => {
    if (!auth) {
      console.warn("lock called without auth");
      return;
    }

    if (auth.other.isActiveEditor) {
      const editorResult = await apiAuthRemoveActiveEditor(apiContext);
      const resultUser = await apiAuthMe(apiContext);

      if (!editorResult.success) {
        console.error("Failed to set remove editor", editorResult.message);
        return;
      }

      if (resultUser.success) {
        setAuth(resultUser.data);
      }
    }

    setKey(null);
    if (storageLoaded) {
      setStorageData("key", null);
    }
  }, [auth, storageLoaded, setStorageData]);

  const decryptEncryptionKey = useCallback(
    async (password: string) => {
      if (!auth) {
        console.warn("decryptEncryptionKey called without auth");
        return false;
      }

      try {
        const decryptedKey = await extractUserEncryption(
          auth.user.encryption,
          password
        );

        setKey(decryptedKey);

        if (storageLoaded && storageData.shouldStoreKey) {
          setStorageData("key", decryptedKey);
        }

        return true;
      } catch (error) {
        console.error("Failed to decrypt encryption key", error);
        return false;
      }
    },
    [auth, storageLoaded, storageData]
  );

  const contextValue = useMemo(() => {
    return {
      apiContext,
      auth,
      key,
      authInitialised: initialised,
      setActiveEditor,
      removeActiveEditor,
      login,
      register,
      passwordUpdate,
      logout,
      lock,
      decryptEncryptionKey,
    };
  }, [
    apiContext,
    auth,
    key,
    initialised,
    setActiveEditor,
    removeActiveEditor,
    login,
    register,
    passwordUpdate,
    logout,
    lock,
    decryptEncryptionKey,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
