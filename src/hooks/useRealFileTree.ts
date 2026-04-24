import { useState, useCallback, useEffect, useRef } from "react";
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
}

function rawToFileNode(entry: RawFileEntry): FileNode {
  return {
    id: entry.id,
    name: entry.name,
    kind: entry.kind as FileNode["kind"],
    size: entry.size ?? undefined,
    modified: entry.modified ?? undefined,
    // Mark folders as having children (to be loaded lazily)
    children: entry.is_dir ? [] : undefined,
  };
}

export interface RealTreeState {
  /** The root path on disk (e.g. "C:\Users\maya" or "/home/maya") */
  rootPath: string;
  /** The root node (name = folder name of rootPath) */
  rootNode: FileNode;
  /** Maps node id -> absolute path on disk */
  pathMap: Map<string, string>;
  /** Maps node id -> loaded children (so we don't re-fetch) */
  loadedDirs: Map<string, FileNode[]>;
}

export function useRealFileTree(showHidden: boolean) {
  const [state, setState] = useState<RealTreeState | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [focusedCol, setFocusedCol] = useState(0);
  const loadingRef = useRef<Set<string>>(new Set());

  // Initialize: load home directory
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const homePath = await invoke<string>("get_home_dir");
        const entries = await invoke<RawFileEntry[]>("read_dir", {
          path: homePath,
          showHidden,
        });

        if (cancelled) return;

        const folderName = homePath.split(/[/\\]/).filter(Boolean).pop() || "Home";
        const children = entries.map(rawToFileNode);
        const rootNode: FileNode = {
          id: "root",
          name: folderName,
          kind: "folder",
          children,
        };

        const pathMap = new Map<string, string>();
        pathMap.set("root", homePath);
        for (const entry of entries) {
          const node = rawToFileNode(entry);
          pathMap.set(node.id, entry.path);
        }

        const loadedDirs = new Map<string, FileNode[]>();
        loadedDirs.set("root", children);

        setState({ rootPath: homePath, rootNode, pathMap, loadedDirs });

        // Auto-select first child
        if (children.length > 0) {
          setSelection(["root", children[0].id]);
          setFocusedCol(0);
        } else {
          setSelection(["root"]);
        }
      } catch (e) {
        console.error("Failed to load home directory:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [showHidden]);

  // Load a directory's children by node id
  const loadDir = useCallback(
    async (nodeId: string) => {
      if (!state) return;
      if (state.loadedDirs.has(nodeId)) return;
      if (loadingRef.current.has(nodeId)) return;

      const diskPath = state.pathMap.get(nodeId);
      if (!diskPath) return;

      loadingRef.current.add(nodeId);
      try {
        const entries = await invoke<RawFileEntry[]>("read_dir", {
          path: diskPath,
          showHidden,
        });
        const children = entries.map(rawToFileNode);

        setState((prev) => {
          if (!prev) return prev;
          const newPathMap = new Map(prev.pathMap);
          for (const entry of entries) {
            newPathMap.set(rawToFileNode(entry).id, entry.path);
          }

          const newLoadedDirs = new Map(prev.loadedDirs);
          newLoadedDirs.set(nodeId, children);

          // Update the tree: find and update the node's children
          const newRoot = updateNodeChildren(prev.rootNode, nodeId, children);

          return {
            ...prev,
            rootNode: newRoot,
            pathMap: newPathMap,
            loadedDirs: newLoadedDirs,
          };
        });
      } catch (e) {
        console.error(`Failed to load directory ${diskPath}:`, e);
      } finally {
        loadingRef.current.delete(nodeId);
      }
    },
    [state, showHidden],
  );

  // When selection changes and points to a folder, load it
  useEffect(() => {
    if (!state) return;
    for (const id of selection) {
      if (id === "root") continue;
      const node = findNode(state.rootNode, id);
      if (node && node.kind === "folder" && !state.loadedDirs.has(id)) {
        loadDir(id);
      }
    }
  }, [selection, state, loadDir]);

  const navigateTo = useCallback(
    (newSel: string[], focused?: number) => {
      setSelection(newSel);
      if (focused !== undefined) setFocusedCol(focused);
    },
    [],
  );

  // Navigate to an absolute path (e.g. from sidebar)
  const navigateToPath = useCallback(
    async (absolutePath: string) => {
      if (!state) return;

      try {
        const entries = await invoke<RawFileEntry[]>("read_dir", {
          path: absolutePath,
          showHidden,
        });
        const children = entries.map(rawToFileNode);
        const folderName = absolutePath.split(/[/\\]/).filter(Boolean).pop() || "Root";

        // We create a fresh root at this path
        const rootNode: FileNode = {
          id: "root",
          name: folderName,
          kind: "folder",
          children,
        };

        const pathMap = new Map<string, string>();
        pathMap.set("root", absolutePath);
        for (const entry of entries) {
          pathMap.set(rawToFileNode(entry).id, entry.path);
        }

        const loadedDirs = new Map<string, FileNode[]>();
        loadedDirs.set("root", children);

        setState({ rootPath: absolutePath, rootNode, pathMap, loadedDirs });
        if (children.length > 0) {
          setSelection(["root", children[0].id]);
          setFocusedCol(0);
        } else {
          setSelection(["root"]);
        }
      } catch (e) {
        console.error("Failed to navigate to path:", e);
      }
    },
    [state, showHidden],
  );

  return {
    state,
    selection,
    setSelection,
    focusedCol,
    setFocusedCol,
    navigateTo,
    navigateToPath,
    loadDir,
  };
}

// Recursively update a node's children in an immutable tree
function updateNodeChildren(node: FileNode, targetId: string, children: FileNode[]): FileNode {
  if (node.id === targetId) {
    return { ...node, children };
  }
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.map((child) => updateNodeChildren(child, targetId, children)),
  };
}

function findNode(node: FileNode, id: string): FileNode | null {
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
