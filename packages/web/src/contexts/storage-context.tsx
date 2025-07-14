import React, { createContext, useEffect, useMemo, useState } from "react";
import { EncryptionKey } from "../util/encryption";

const STORAGE_CONTEXT_KEY = "notee-storage-context";

const defaultData: StorageContextType["storageData"] = {
  shouldStoreKey: true,
  key: null,
  treeInitialExpanded: {},

  sidebarWidth: null,
};

export type StorageContextType = {
  storageData: {
    shouldStoreKey: boolean;
    key: EncryptionKey | null;

    treeInitialExpanded: Record<string, boolean>;

    sidebarWidth: number | null;
  };
  storageLoaded: boolean;
  setStorageData: <K extends keyof StorageContextType["storageData"]>(
    key: K,
    value: StorageContextType["storageData"][K]
  ) => void;
};

export const StorageContext = createContext<StorageContextType>({
  storageData: structuredClone(defaultData),
  storageLoaded: false,
  setStorageData: () => {
    console.error("StorageContext setData called without provider");
  },
});

export const StorageProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<StorageContextType["storageData"]>(
    structuredClone(defaultData)
  );
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_CONTEXT_KEY);
      if (!storedData) {
        return;
      }

      const parsedData = JSON.parse(storedData);
      setState(parsedData);
    } catch (err) {
      console.error(err);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  const contextValue = useMemo<StorageContextType>(() => {
    return {
      storageData: state,
      storageLoaded: hasLoaded,
      setStorageData: (key, value) => {
        setState((prev) => {
          const result = {
            ...prev,
            [key]: value,
          };

          // TODO: Should this be done here? Probably not. But she'll work for now.
          localStorage.setItem(STORAGE_CONTEXT_KEY, JSON.stringify(result));

          return result;
        });
      },
    };
  }, [state, hasLoaded]);

  return (
    <StorageContext.Provider value={contextValue}>
      {children}
    </StorageContext.Provider>
  );
};
