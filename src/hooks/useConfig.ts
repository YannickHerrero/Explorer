import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ThemeKey, DensityKey } from "@/types";

export interface PinnedFolder {
  name: string;
  path: string;
}

export interface TagDef {
  id: string;
  name: string;
  color: string;
}

export interface FileTag {
  file_path: string;
  tag_id: string;
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
  tags: TagDef[];
  file_tags: FileTag[];
}

const DEFAULT_TAGS: TagDef[] = [
  { id: "t-red", name: "Urgent", color: "#C44536" },
  { id: "t-org", name: "Review", color: "#D97706" },
  { id: "t-grn", name: "Done", color: "#3F6B3A" },
  { id: "t-blu", name: "Reference", color: "#4A6B8A" },
];

const DEFAULT_CONFIG: AppConfig = {
  theme: "sage",
  density: "comfortable",
  sidebar_open: true,
  show_hidden: false,
  vim_navigation: true,
  hide_titlebar: true,
  last_path: null,
  pinned_folders: [],
  tags: DEFAULT_TAGS,
  file_tags: [],
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
        // Ensure arrays always exist (old configs may lack them)
        setConfig({
          ...DEFAULT_CONFIG,
          ...c,
          pinned_folders: c.pinned_folders || [],
          tags: c.tags || DEFAULT_TAGS,
          file_tags: c.file_tags || [],
        });
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

  const addTag = useCallback(
    (tag: TagDef) => {
      if (config.tags.some((t) => t.id === tag.id)) return;
      updateConfig({ tags: [...config.tags, tag] });
    },
    [config, updateConfig],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      updateConfig({
        tags: config.tags.filter((t) => t.id !== tagId),
        file_tags: config.file_tags.filter((ft) => ft.tag_id !== tagId),
      });
    },
    [config, updateConfig],
  );

  const updateTag = useCallback(
    (tagId: string, updates: Partial<TagDef>) => {
      updateConfig({
        tags: config.tags.map((t) => (t.id === tagId ? { ...t, ...updates } : t)),
      });
    },
    [config, updateConfig],
  );

  const tagFile = useCallback(
    (filePath: string, tagId: string) => {
      if (config.file_tags.some((ft) => ft.file_path === filePath && ft.tag_id === tagId)) return;
      updateConfig({ file_tags: [...config.file_tags, { file_path: filePath, tag_id: tagId }] });
    },
    [config, updateConfig],
  );

  const untagFile = useCallback(
    (filePath: string, tagId: string) => {
      updateConfig({
        file_tags: config.file_tags.filter(
          (ft) => !(ft.file_path === filePath && ft.tag_id === tagId),
        ),
      });
    },
    [config, updateConfig],
  );

  const getFileTags = useCallback(
    (filePath: string): TagDef[] => {
      const tagIds = config.file_tags
        .filter((ft) => ft.file_path === filePath)
        .map((ft) => ft.tag_id);
      return config.tags.filter((t) => tagIds.includes(t.id));
    },
    [config],
  );

  return {
    config, updateConfig, loaded,
    pinFolder, unpinFolder, isPinned,
    addTag, removeTag, updateTag,
    tagFile, untagFile, getFileTags,
  };
}
