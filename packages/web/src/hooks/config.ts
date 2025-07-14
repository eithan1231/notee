import { useEffect, useState } from "react";
import { ApiConfig, apiConfigFetch } from "../api/config";

export const useConfig = () => {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const handleUpdate = () => {
    apiConfigFetch().then((res) => {
      if (!res.success) {
        setError("Failed to fetch latest action");
        return;
      }

      setConfig(res.data);
    });
  };

  const reload = () => {
    setTick((prev) => prev + 1);
  };

  useEffect(() => {
    handleUpdate();
  }, [tick]);

  return { config, configError: error, reloadConfig: reload };
};
