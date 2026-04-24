import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { FileNode } from "@/types";

interface RawFileEntry {
  id: string;
  name: string;
  kind: string;
  size: string | null;
  modified: string | null;
  is_dir: boolean;
  path: string;
  children: null;
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

// Check if we're running inside Tauri
function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function useFileSystem() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readDir = useCallback(async (path: string, showHidden = false): Promise<FileNode[]> => {
    if (!isTauri()) {
      throw new Error("Not running in Tauri");
    }
    setLoading(true);
    setError(null);
    try {
      const entries = await invoke<RawFileEntry[]>("read_dir", {
        path,
        showHidden,
      });
      return entries.map(rawToFileNode);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHomeDir = useCallback(async (): Promise<string> => {
    if (!isTauri()) {
      throw new Error("Not running in Tauri");
    }
    return invoke<string>("get_home_dir");
  }, []);

  const getFileMeta = useCallback(async (path: string): Promise<FileNode> => {
    if (!isTauri()) {
      throw new Error("Not running in Tauri");
    }
    const entry = await invoke<RawFileEntry>("get_file_meta", { path });
    return rawToFileNode(entry);
  }, []);

  return {
    readDir,
    getHomeDir,
    getFileMeta,
    loading,
    error,
    isTauri: isTauri(),
  };
}
