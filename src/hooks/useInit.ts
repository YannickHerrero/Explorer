import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileNode, ThemeKey, DensityKey } from "@/types";

interface RawFileEntry {
  id: string;
  name: string;
  kind: string;
  size: string | null;
  modified: string | null;
  is_dir: boolean;
  path: string;
}

interface RawInitData {
  config: {
    theme: string;
    density: string;
    sidebar_open: boolean;
    show_hidden: boolean;
    vim_navigation: boolean;
    hide_titlebar: boolean;
    last_path: string | null;
    pinned_folders: { name: string; path: string }[];
  };
  home_path: string;
  home_entries: RawFileEntry[];
  user_dirs: {
    home: string;
    desktop: string | null;
    documents: string | null;
    downloads: string | null;
    pictures: string | null;
    music: string | null;
    videos: string | null;
  };
  wsl_distros: { name: string; path: string }[];
  drives: { letter: string; path: string; label: string | null }[];
}

function rawToFileNode(entry: RawFileEntry): FileNode {
  return {
    id: entry.id,
    name: entry.name,
    kind: entry.kind as FileNode["kind"],
    size: entry.size ?? undefined,
    modified: entry.modified ?? undefined,
    children: entry.is_dir ? [] : undefined,
  };
}

export interface InitData {
  config: {
    theme: ThemeKey;
    density: DensityKey;
    sidebar_open: boolean;
    show_hidden: boolean;
    vim_navigation: boolean;
    hide_titlebar: boolean;
    last_path: string | null;
    pinned_folders: { name: string; path: string }[];
  };
  homePath: string;
  homeChildren: FileNode[];
  homePathMap: Map<string, string>;
  userDirs: RawInitData["user_dirs"];
  wslDistros: RawInitData["wsl_distros"];
  drives: RawInitData["drives"];
}

export function useInit(): InitData | null {
  const [data, setData] = useState<InitData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await invoke<RawInitData>("get_init_data");
        if (cancelled) return;

        const homeChildren = raw.home_entries.map(rawToFileNode);
        const homePathMap = new Map<string, string>();
        homePathMap.set("root", raw.home_path);
        for (const entry of raw.home_entries) {
          homePathMap.set(rawToFileNode(entry).id, entry.path);
        }

        setData({
          config: {
            theme: raw.config.theme as ThemeKey,
            density: raw.config.density as DensityKey,
            sidebar_open: raw.config.sidebar_open,
            show_hidden: raw.config.show_hidden,
            vim_navigation: raw.config.vim_navigation,
            hide_titlebar: raw.config.hide_titlebar,
            last_path: raw.config.last_path,
            pinned_folders: raw.config.pinned_folders || [],
          },
          homePath: raw.home_path,
          homeChildren,
          homePathMap,
          userDirs: raw.user_dirs,
          wslDistros: raw.wsl_distros,
          drives: raw.drives,
        });
      } catch (e) {
        console.error("Failed to load init data:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return data;
}
