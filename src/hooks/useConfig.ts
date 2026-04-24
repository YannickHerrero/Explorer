import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ThemeKey, DensityKey } from "@/types";

interface AppConfig {
  theme: ThemeKey;
  density: DensityKey;
  sidebar_open: boolean;
  show_hidden: boolean;
  vim_navigation: boolean;
  last_path: string | null;
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "sage",
  density: "comfortable",
  sidebar_open: true,
  show_hidden: false,
  vim_navigation: true,
  last_path: null,
};

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  // Load config on mount
  useEffect(() => {
    if (!isTauri()) {
      setLoaded(true);
      return;
    }
    invoke<AppConfig>("load_config")
      .then((c) => {
        setConfig(c);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<AppConfig>) => {
      const next = { ...config, ...partial };
      setConfig(next);
      if (isTauri()) {
        invoke("save_config", { config: next }).catch(console.error);
      }
    },
    [config],
  );

  return { config, updateConfig, loaded };
}
