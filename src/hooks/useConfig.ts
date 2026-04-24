import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ThemeKey, DensityKey } from "@/types";

export interface PinnedFolder {
  name: string;
  path: string;
}

interface AppConfig {
  theme: ThemeKey;
  density: DensityKey;
  sidebar_open: boolean;
  show_hidden: boolean;
  vim_navigation: boolean;
  hide_titlebar: boolean;
  last_path: string | null;
  pinned_folders: PinnedFolder[];
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "sage",
  density: "comfortable",
  sidebar_open: true,
  show_hidden: false,
  vim_navigation: true,
  hide_titlebar: true,
  last_path: null,
  pinned_folders: [],
};

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isTauri()) {
      setLoaded(true);
      return;
    }
    invoke<AppConfig>("load_config")
      .then((c) => {
        // Ensure pinned_folders always exists (old configs may lack it)
        setConfig({ ...DEFAULT_CONFIG, ...c, pinned_folders: c.pinned_folders || [] });
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

  const pinFolder = useCallback(
    (name: string, path: string) => {
      if (config.pinned_folders.some((p) => p.path === path)) return;
      updateConfig({
        pinned_folders: [...config.pinned_folders, { name, path }],
      });
    },
    [config, updateConfig],
  );

  const unpinFolder = useCallback(
    (path: string) => {
      updateConfig({
        pinned_folders: config.pinned_folders.filter((p) => p.path !== path),
      });
    },
    [config, updateConfig],
  );

  const isPinned = useCallback(
    (path: string) => config.pinned_folders.some((p) => p.path === path),
    [config],
  );

  return { config, updateConfig, loaded, pinFolder, unpinFolder, isPinned };
}
