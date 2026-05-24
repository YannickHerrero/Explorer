import { useState, useCallback, useMemo, useEffect } from "react";
import { Chrome } from "@/components/Chrome";
import { Sidebar } from "@/components/Sidebar";
import { Columns } from "@/components/Columns";
import { StatusBar } from "@/components/StatusBar";
import { CommandPalette } from "@/overlays/CommandPalette";
import { SearchOverlay } from "@/overlays/SearchOverlay";
import { Settings } from "@/overlays/Settings";
import { Cheatsheet } from "@/overlays/Cheatsheet";
import { ContextMenu } from "@/overlays/ContextMenu";
import { FolderPalette } from "@/overlays/FolderPalette";
import { TagPicker } from "@/overlays/TagPicker";
import { PromptModal } from "@/overlays/PromptModal";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useRealFileTree } from "@/hooks/useRealFileTree";
import { useInit } from "@/hooks/useInit";
import { useConfig } from "@/hooks/useConfig";
import { DENSITY } from "@/themes/tokens";
import { resolveSelection, buildPathNames } from "@/data";
import { THEMES } from "@/themes";
import type { DensityKey, SidebarItem, SidebarSection, FileNode, ThemeKey, Command } from "@/types";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

type PromptState =
  | { kind: "rename"; sourcePath: string; initialName: string }
  | { kind: "new-folder"; parentDir: string }
  | { kind: "new-file"; parentDir: string };

// Build sidebar sections from init data
function buildSidebarSections(
  userDirs: { home: string; desktop: string | null; documents: string | null; downloads: string | null; pictures: string | null; music: string | null; videos: string | null },
  wslDistros: { name: string; path: string }[],
  drives: { letter: string; path: string; label: string | null }[],
  pinnedFolders: { name: string; path: string }[],
  tags?: { id: string; name: string; color: string }[],
): SidebarSection[] {
  const pathBasename = (p: string) => p.split(/[/\\]/).filter(Boolean).pop() || p;

  const favorites: SidebarSection = {
    label: "Favorites",
    items: [
      { id: "home", name: pathBasename(userDirs.home), icon: "home", diskPath: userDirs.home },
    ],
  };
  if (userDirs.desktop) favorites.items.push({ id: "desktop", name: "Desktop", icon: "desktop", diskPath: userDirs.desktop });
  if (userDirs.documents) favorites.items.push({ id: "documents", name: "Documents", icon: "folder", diskPath: userDirs.documents });
  if (userDirs.downloads) favorites.items.push({ id: "downloads", name: "Downloads", icon: "folder", diskPath: userDirs.downloads });
  if (userDirs.pictures) favorites.items.push({ id: "pictures", name: "Pictures", icon: "folder", diskPath: userDirs.pictures });
  if (userDirs.music) favorites.items.push({ id: "music", name: "Music", icon: "folder", diskPath: userDirs.music });
  if (userDirs.videos) favorites.items.push({ id: "videos", name: "Videos", icon: "folder", diskPath: userDirs.videos });

  // Pinned folders
  const systemPaths = new Set(favorites.items.map((i) => i.diskPath));
  for (const pin of pinnedFolders) {
    if (!systemPaths.has(pin.path)) {
      favorites.items.push({ id: `pin-${pin.path}`, name: pin.name, icon: "star", diskPath: pin.path });
    }
  }

  const result: SidebarSection[] = [favorites];

  if (wslDistros.length > 0) {
    result.push({
      label: "WSL",
      items: wslDistros.map((d) => ({ id: `wsl-${d.name}`, name: d.name, icon: "terminal", diskPath: d.path })),
    });
  }

  if (drives.length > 0) {
    result.push({
      label: "Drives",
      items: drives.map((d) => ({ id: `drive-${d.letter}`, name: d.label || d.letter, icon: "drive", diskPath: d.path })),
    });
  }

  const tagItems = (tags || []).map((t) => ({
    id: t.id,
    name: t.name,
    icon: "tag",
    color: t.color,
  }));
  if (tagItems.length > 0) {
    result.push({ label: "Tags", items: tagItems });
  }

  result.push({ label: "", items: [{ id: "trash", name: "Trash", icon: "trash" }] });

  return result;
}

// ── App ─────────────────────────────────────────────────────────────
function App() {
  // Single batched init call for Tauri mode
  const { data: initData, error: initError } = useInit();

  // Config (for saving changes — init provides the initial read)
  const { config, updateConfig, pinFolder, unpinFolder, isPinned, addTag, removeTag, updateTag, tagFile, untagFile, getFileTags } = useConfig();

  // Theme — config provides the initial value; init data syncs it once loaded
  const initialTheme = config.theme as ThemeKey;
  const { themeKey, setThemeKey } = useTheme(initialTheme);
  const [densityKey, setDensityKey] = useState<DensityKey>("comfortable");
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [hideTitlebar, setHideTitlebar] = useState(true);
  const [vimNavigation, setVimNavigation] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);

  // Apply init data once it arrives
  const [initApplied, setInitApplied] = useState(false);
  useEffect(() => {
    if (!initData || initApplied) return;
    setThemeKey(initData.config.theme);
    setDensityKey(initData.config.density);
    setSidebarOpen(initData.config.sidebar_open);
    setHideTitlebar(initData.config.hide_titlebar);
    setShowHidden(initData.config.show_hidden);
    setVimNavigation(initData.config.vim_navigation);
    setPreviewOpen(initData.config.show_preview);
    setInitApplied(true);
  }, [initData, initApplied, setThemeKey]);

  // Sync config changes (non-init)
  useEffect(() => {
    if (!initApplied) return;
    setThemeKey(config.theme);
    setDensityKey(config.density);
    setSidebarOpen(config.sidebar_open);
    setHideTitlebar(config.hide_titlebar);
    setShowHidden(config.show_hidden);
    setVimNavigation(config.vim_navigation);
    setPreviewOpen(config.show_preview);
  }, [config.theme, config.density, config.sidebar_open, config.hide_titlebar, config.show_hidden, config.vim_navigation, config.show_preview, setThemeKey, initApplied]);

  // Apply decorations
  useEffect(() => {
    if (!IS_TAURI) return;
    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      getCurrentWindow().setDecorations(!hideTitlebar);
    })();
  }, [hideTitlebar]);

  const handleSetTheme = useCallback((t: ThemeKey) => {
    setThemeKey(t);
    updateConfig({ theme: t });
  }, [setThemeKey, updateConfig]);

  const handleSetDensity = useCallback((d: DensityKey) => {
    setDensityKey(d);
    updateConfig({ density: d });
  }, [updateConfig]);

  const handleSetSidebarOpen = useCallback((v: boolean) => {
    setSidebarOpen(v);
    updateConfig({ sidebar_open: v });
  }, [updateConfig]);

  const handleSetHideTitlebar = useCallback((v: boolean) => {
    setHideTitlebar(v);
    updateConfig({ hide_titlebar: v });
  }, [updateConfig]);

  const handleSetShowHidden = useCallback((v: boolean) => {
    setShowHidden(v);
    updateConfig({ show_hidden: v });
  }, [updateConfig]);

  const handleSetVimNavigation = useCallback((v: boolean) => {
    setVimNavigation(v);
    updateConfig({ vim_navigation: v });
  }, [updateConfig]);

  const handleSetPreviewOpen = useCallback((v: boolean) => {
    setPreviewOpen(v);
    updateConfig({ show_preview: v });
  }, [updateConfig]);

  // Navigation
  const realNav = useRealFileTree(showHidden);
  const nav = realNav;
  const isTauriReady = realNav.state !== null;
  // Placeholder used only during the brief moment before realNav.state loads;
  // the early-return below replaces the whole render with LoadingSkeleton or ErrorScreen.
  const tree: FileNode = realNav.state?.rootNode ?? { id: "root", name: "", kind: "folder", children: [] };

  // Sidebar from init data (synchronous — no extra async call)
  const realSidebar = useMemo(() => {
    if (!initData) return null;
    return buildSidebarSections(
      initData.userDirs,
      initData.wslDistros,
      initData.drives,
      config.pinned_folders,
      config.tags,
    );
  }, [initData, config.pinned_folders, config.tags]);

  // Overlay state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [folderPaletteOpen, setFolderPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; isSidebar?: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; name: string; mode: "copy" | "cut" } | null>(null);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<{ version: string; body?: string } | null>(null);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);

  // Update check is manual-only — triggered from Settings

  const handleUpdate = useCallback(async () => {
    try {
      setUpdateProgress("Checking...");
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        setUpdateProgress(null);
        setUpdateAvailable(null);
        return;
      }
      setUpdateProgress("Downloading...");
      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          setUpdateProgress(`Downloading... 0%`);
        } else if (event.event === "Progress") {
          setUpdateProgress(`Downloading...`);
        } else if (event.event === "Finished") {
          setUpdateProgress("Installing...");
        }
      });
      // Relaunch after install
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (err) {
      setUpdateProgress(null);
      setUpdateAvailable(null);
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const handleSelect = (colIdx: number, id: string) => {
    const newSel = [...nav.selection.slice(0, colIdx + 1), id];
    nav.navigateTo(newSel, colIdx);
  };

  const handleNavigate = (colIdx: number, item: FileNode) => {
    if (item.kind === "folder") {
      const first = item.children?.[0];
      const newSel = [...nav.selection.slice(0, colIdx + 1), item.id];
      if (first) newSel.push(first.id);
      nav.navigateTo(newSel, first ? colIdx + 1 : colIdx);
    }
  };

  const handleSidebarNav = (item: SidebarItem) => {
    if (item.diskPath) {
      realNav.navigateToPath(item.diskPath);
    }
  };

  const runCommand = (cmd: Command) => {
    if (cmd.id.startsWith("c-theme-")) {
      const t = cmd.id.replace("c-theme-", "") as ThemeKey;
      handleSetTheme(t);
      showToast(`Theme: ${THEMES[t].name}`);
    } else if (cmd.id === "c-settings") {
      setSettingsOpen(true);
    } else if (cmd.id === "c-shortcuts") {
      setCheatsheetOpen(true);
    } else if (cmd.id === "c-toggle-sidebar") {
      handleSetSidebarOpen(!sidebarOpen);
    } else if (cmd.id === "c-toggle-preview") {
      handleSetPreviewOpen(!previewOpen);
    } else if (cmd.id === "c-hidden") {
      handleSetShowHidden(!showHidden);
      showToast(showHidden ? "Hidden files: off" : "Hidden files: on");
    } else if (cmd.id === "c-copy") {
      handleCopy();
    } else if (cmd.id === "c-cut") {
      handleCut();
    } else if (cmd.id === "c-paste") {
      handlePaste();
    } else if (cmd.id === "c-tag") {
      setTagPickerOpen(true);
    } else if (cmd.id === "c-trash") {
      handleTrash();
    } else if (cmd.id === "c-quick-look") {
      handleOpenFile();
    } else if (cmd.id === "c-rename") {
      handleRenameOpen();
    } else if (cmd.id === "c-new-folder") {
      handleNewFolderOpen();
    } else if (cmd.id === "c-new-file") {
      handleNewFileOpen();
    } else if (cmd.id === "c-duplicate") {
      handleDuplicate();
    } else {
      showToast(cmd.name);
    }
  };

  const handleOpenFile = useCallback(async () => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    if (diskPath) {
      try {
        const { openPath } = await import("@tauri-apps/plugin-opener");
        await openPath(diskPath);
      } catch (err) {
        showToast(`Failed to open: ${err}`);
      }
    }
  }, [isTauriReady, nav.selection, realNav.state]);

  const handleCopy = useCallback(async () => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    const node = resolveSelection(tree, nav.selection);
    if (diskPath && node) {
      setClipboard({ path: diskPath, name: node.name, mode: "copy" });
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const result = await invoke<string>("copy_to_clipboard", { path: diskPath, kind: node.kind });
        showToast(result === "image" ? `Copied "${node.name}" as image` : `Copied "${node.name}"`);
      } catch {
        showToast(`Copied "${node.name}"`);
      }
    }
  }, [isTauriReady, nav.selection, realNav.state, tree]);

  const handleCut = useCallback(() => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    const node = resolveSelection(tree, nav.selection);
    if (diskPath && node) {
      setClipboard({ path: diskPath, name: node.name, mode: "cut" });
      showToast(`Cut "${node.name}"`);
    }
  }, [isTauriReady, nav.selection, realNav.state, tree]);

  const handlePaste = useCallback(async () => {
    if (!isTauriReady || !clipboard) return;
    // Paste into the current directory (parent of the last selected item, or the selected folder)
    const currentNode = resolveSelection(tree, nav.selection);
    let destDir: string | undefined;
    if (currentNode?.kind === "folder") {
      destDir = realNav.state?.pathMap.get(nav.selection[nav.selection.length - 1]);
    } else {
      // Use the parent directory
      const parentId = nav.selection[nav.selection.length - 2];
      destDir = parentId ? realNav.state?.pathMap.get(parentId) : realNav.state?.rootPath;
    }
    if (!destDir) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      if (clipboard.mode === "copy") {
        await invoke("copy_path", { source: clipboard.path, destDir });
      } else {
        await invoke("move_path", { source: clipboard.path, destDir });
        setClipboard(null);
      }
      showToast(`Pasted "${clipboard.name}"`);
      // Refresh the current directory
      if (realNav.refreshCurrentDir) realNav.refreshCurrentDir();
    } catch (err) {
      showToast(`Paste failed: ${err}`);
    }
  }, [isTauriReady, clipboard, tree, nav.selection, realNav.state]);

  const currentParentDir = useCallback((): string | null => {
    if (!realNav.state) return null;
    const node = resolveSelection(tree, nav.selection);
    const lastId = nav.selection[nav.selection.length - 1];
    if (node?.kind === "folder" && lastId) {
      return realNav.state.pathMap.get(lastId) ?? realNav.state.rootPath;
    }
    // Selected item is a file — use its parent
    const parentId = nav.selection[nav.selection.length - 2];
    if (parentId) return realNav.state.pathMap.get(parentId) ?? realNav.state.rootPath;
    return realNav.state.rootPath;
  }, [tree, nav.selection, realNav.state]);

  const handleRenameOpen = useCallback(() => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    const node = resolveSelection(tree, nav.selection);
    if (!diskPath || !node || lastId === "root") return;
    setPrompt({ kind: "rename", sourcePath: diskPath, initialName: node.name });
  }, [isTauriReady, nav.selection, realNav.state, tree]);

  const handleNewFolderOpen = useCallback(() => {
    if (!isTauriReady) return;
    const parent = currentParentDir();
    if (!parent) return;
    setPrompt({ kind: "new-folder", parentDir: parent });
  }, [isTauriReady, currentParentDir]);

  const handleNewFileOpen = useCallback(() => {
    if (!isTauriReady) return;
    const parent = currentParentDir();
    if (!parent) return;
    setPrompt({ kind: "new-file", parentDir: parent });
  }, [isTauriReady, currentParentDir]);

  const handleDuplicate = useCallback(async () => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    const node = resolveSelection(tree, nav.selection);
    if (!diskPath || !node || lastId === "root") return;
    const parentId = nav.selection[nav.selection.length - 2];
    const destDir = parentId ? realNav.state?.pathMap.get(parentId) : realNav.state?.rootPath;
    if (!destDir) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("copy_path", { source: diskPath, destDir });
      showToast(`Duplicated "${node.name}"`);
      if (realNav.refreshCurrentDir) realNav.refreshCurrentDir();
    } catch (err) {
      showToast(`Duplicate failed: ${err}`);
    }
  }, [isTauriReady, nav.selection, realNav, tree]);

  const handlePromptSubmit = useCallback(async (value: string) => {
    if (!prompt) return;
    setPrompt(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      if (prompt.kind === "rename") {
        await invoke("rename_path", { path: prompt.sourcePath, newName: value });
        showToast(`Renamed to "${value}"`);
      } else if (prompt.kind === "new-folder") {
        await invoke("create_dir", { parent: prompt.parentDir, name: value });
        showToast(`Created "${value}"`);
      } else if (prompt.kind === "new-file") {
        await invoke("create_file", { parent: prompt.parentDir, name: value });
        showToast(`Created "${value}"`);
      }
      if (realNav.refreshCurrentDir) realNav.refreshCurrentDir();
    } catch (err) {
      showToast(String(err));
    }
  }, [prompt, realNav]);

  const handleTrash = useCallback(async () => {
    if (!isTauriReady) return;
    const lastId = nav.selection[nav.selection.length - 1];
    const diskPath = realNav.state?.pathMap.get(lastId);
    const node = resolveSelection(tree, nav.selection);
    if (diskPath && node) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("trash_path", { path: diskPath });
        showToast(`Moved "${node.name}" to Trash`);
        if (realNav.refreshCurrentDir) realNav.refreshCurrentDir();
      } catch (err) {
        showToast(`Trash failed: ${err}`);
      }
    }
  }, [isTauriReady, nav.selection, realNav.state, tree]);

  const overlaysOpen = paletteOpen || folderPaletteOpen || searchOpen || settingsOpen || cheatsheetOpen || tagPickerOpen || prompt !== null;

  useKeyboardNav({
    tree,
    selection: nav.selection,
    focusedCol: nav.focusedCol,
    setFocusedCol: nav.setFocusedCol,
    navigateTo: nav.navigateTo,
    goBack: nav.goBack,
    goFwd: nav.goFwd,
    overlaysOpen,
    onTogglePalette: () => setPaletteOpen((v) => !v),
    onToggleFolderPalette: () => setFolderPaletteOpen((v) => !v),
    onToggleSearch: () => setSearchOpen((v) => !v),
    onToggleSettings: () => setSettingsOpen((v) => !v),
    onToggleCheatsheet: () => setCheatsheetOpen((v) => !v),
    onDismissOverlays: () => {
      setPaletteOpen(false);
      setFolderPaletteOpen(false);
      setSearchOpen(false);
      setSettingsOpen(false);
      setCheatsheetOpen(false);
      setTagPickerOpen(false);
      setContextMenu(null);
      setPrompt(null);
    },
    onOpen: handleOpenFile,
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onTrash: handleTrash,
    onToggleTagPicker: () => setTagPickerOpen((v) => !v),
    onToggleHidden: () => {
      handleSetShowHidden(!showHidden);
      showToast(showHidden ? "Hidden files: off" : "Hidden files: on");
    },
    onTogglePreview: () => handleSetPreviewOpen(!previewOpen),
    onRename: handleRenameOpen,
    onNewFolder: handleNewFolderOpen,
    onNewFile: handleNewFileOpen,
    onDuplicate: handleDuplicate,
    vimNavigation,
  });

  const pathNames = useMemo(() => buildPathNames(tree, nav.selection), [tree, nav.selection]);
  const currentNode = useMemo(() => resolveSelection(tree, nav.selection), [tree, nav.selection]);

  const activeSidebarId = useMemo(() => {
    if (!realSidebar || !realNav.state) return "home";
    const rootPath = realNav.state.rootPath;
    const match = realSidebar
      .flatMap((s) => s.items)
      .find((i) => i.diskPath === rootPath);
    return match?.id ?? "home";
  }, [realSidebar, realNav.state]);

  const contextNode = useMemo(() => {
    if (!contextMenu) return null;
    return resolveSelection(tree, [...nav.selection.slice(0, -1), contextMenu.nodeId]) || null;
  }, [contextMenu, tree, nav.selection]);

  const contextDiskPath = useMemo(() => {
    if (!contextMenu || !isTauriReady) return null;
    return realNav.state?.pathMap.get(contextMenu.nodeId) ?? null;
  }, [contextMenu, isTauriReady, realNav.state]);

  const selectedDiskPath = useMemo(() => {
    if (!isTauriReady || nav.selection.length === 0) return undefined;
    const lastId = nav.selection[nav.selection.length - 1];
    return realNav.state?.pathMap.get(lastId) ?? undefined;
  }, [isTauriReady, nav.selection, realNav.state]);

  const selectedFileTags = useMemo(() => {
    if (!selectedDiskPath) return undefined;
    return getFileTags(selectedDiskPath);
  }, [selectedDiskPath, getFileTags]);

  // Hard-fail if we're not running inside Tauri or if init failed.
  if (!IS_TAURI) {
    return <ErrorScreen title="This app must run inside Tauri" detail="The web preview is not supported; open the desktop app." />;
  }
  if (initError) {
    return <ErrorScreen title="Failed to start" detail={initError} />;
  }
  // Show skeleton while loading
  if (!isTauriReady) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: "var(--font-sans)",
        background: "var(--paper)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      onContextMenu={(e) => {
        const row = (e.target as HTMLElement).closest(".file-row");
        if (row) {
          e.preventDefault();
          const nodeId = row.getAttribute("data-node-id");
          if (nodeId) {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
          } else {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: "" });
          }
          return;
        }
        const sidebarItem = (e.target as HTMLElement).closest(".sidebar-item");
        if (sidebarItem) {
          e.preventDefault();
          const sidebarId = sidebarItem.getAttribute("data-sidebar-id") || "";
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: sidebarId, isSidebar: true });
        }
      }}
    >
        <Chrome
          path={pathNames}
          onBack={nav.goBack}
          onFwd={nav.goFwd}
          canBack={nav.histIdx > 0}
          canFwd={nav.histIdx < nav.historyLength - 1}
          onFolderPalette={() => setFolderPaletteOpen(true)}
          onSearch={() => setSearchOpen(!searchOpen)}
          onToggleSidebar={() => handleSetSidebarOpen(!sidebarOpen)}
          onToggleCheatsheet={() => setCheatsheetOpen(!cheatsheetOpen)}
          sidebarOpen={sidebarOpen}
          searchOpen={searchOpen}
          hideTitlebar={hideTitlebar}
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {sidebarOpen && (
            <Sidebar
              width={density.sidebarW}
              activeId={activeSidebarId}
              onNavigate={handleSidebarNav}
              density={density}
              sections={realSidebar ?? []}
            />
          )}
          <Columns
            tree={tree}
            selection={nav.selection}
            onSelect={handleSelect}
            onNavigate={handleNavigate}
            density={density}
            focusedCol={nav.focusedCol}
            setFocusedCol={nav.setFocusedCol}
            selectedDiskPath={selectedDiskPath}
            onOpenFile={handleOpenFile}
            fileTags={selectedFileTags}
            previewOpen={previewOpen}
          />
        </div>

        <StatusBar node={currentNode} onSettings={() => setSettingsOpen(true)} />

        {/* Overlays */}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={runCommand} />
        <FolderPalette
          open={folderPaletteOpen}
          onClose={() => setFolderPaletteOpen(false)}
          onNavigate={handleSidebarNav}
          sections={realSidebar ?? []}
        />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <TagPicker
          open={tagPickerOpen}
          onClose={() => setTagPickerOpen(false)}
          tags={config.tags}
          activeTags={selectedFileTags || []}
          onToggle={(tagId) => {
            if (!selectedDiskPath) return;
            const isActive = selectedFileTags?.some((t) => t.id === tagId);
            if (isActive) {
              untagFile(selectedDiskPath, tagId);
            } else {
              tagFile(selectedDiskPath, tagId);
            }
          }}
        />
        <Settings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={themeKey}
          setTheme={handleSetTheme}
          density={densityKey}
          setDensity={handleSetDensity}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleSetSidebarOpen}
          hideTitlebar={hideTitlebar}
          setHideTitlebar={handleSetHideTitlebar}
          showHidden={showHidden}
          setShowHidden={handleSetShowHidden}
          vimNavigation={vimNavigation}
          setVimNavigation={handleSetVimNavigation}
          tags={config.tags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onUpdateTag={updateTag}
          updateAvailable={updateAvailable}
          updateProgress={updateProgress}
          onUpdate={handleUpdate}
        />
        <Cheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />

        <PromptModal
          open={prompt !== null}
          title={
            prompt?.kind === "rename"
              ? "Rename"
              : prompt?.kind === "new-folder"
                ? "New Folder"
                : prompt?.kind === "new-file"
                  ? "New File"
                  : ""
          }
          submitLabel={prompt?.kind === "rename" ? "Rename" : "Create"}
          initialValue={prompt?.kind === "rename" ? prompt.initialName : ""}
          selectRange={prompt?.kind === "rename" ? "basename" : "all"}
          placeholder={prompt?.kind === "rename" ? undefined : "Name..."}
          onSubmit={handlePromptSubmit}
          onClose={() => setPrompt(null)}
        />

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onRun={(item) => {
              if (item.id === "trash") handleTrash();
              else if (item.id === "open" || item.id === "ql") handleOpenFile();
              else if (item.id === "ren") handleRenameOpen();
              else if (item.id === "dup") handleDuplicate();
              else showToast(item.name);
            }}
            isFolder={contextNode?.kind === "folder"}
            isSidebar={contextMenu.isSidebar}
            isPinned={contextDiskPath ? isPinned(contextDiskPath) : false}
            onTogglePin={
              contextDiskPath && contextNode?.kind === "folder"
                ? () => {
                    if (isPinned(contextDiskPath)) {
                      unpinFolder(contextDiskPath);
                      showToast(`Removed "${contextNode.name}" from Favorites`);
                    } else {
                      pinFolder(contextNode.name, contextDiskPath);
                      showToast(`Added "${contextNode.name}" to Favorites`);
                    }
                  }
                : undefined
            }
          />
        )}

        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--ink)",
              color: "var(--paper)",
              padding: "8px 16px",
              borderRadius: 6,
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
              zIndex: 100,
              animation: "toast-in 200ms ease",
            }}
          >
            {toast}
          </div>
        )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ height: 44, borderBottom: "1px solid var(--line)", background: "var(--paper-alt)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
        <SkeletonBar w={60} h={8} />
        <SkeletonBar w={120} h={8} />
        <div style={{ flex: 1 }} />
        <SkeletonBar w={100} h={8} />
      </div>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 230, background: "var(--paper-alt)", borderRight: "1px solid var(--line)", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBar w={40} h={6} />
          {[110, 80, 95, 70, 85, 100].map((w, i) => <SkeletonBar key={i} w={w} h={10} />)}
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          {[0, 1, 2].map((col) => (
            <div key={col} style={{ width: 280, borderRight: "1px solid var(--line)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: 8 - col * 2 }).map((_, i) => <SkeletonBar key={i} w={100 + (i * 17) % 80} h={10} />)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 26, borderTop: "1px solid var(--line)", background: "var(--paper-alt)", display: "flex", alignItems: "center", padding: "0 12px" }}>
        <SkeletonBar w={80} h={6} />
      </div>
    </div>
  );
}

function SkeletonBar({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: h / 2, background: "var(--paper-deep)", opacity: 0.6 }} />
  );
}

function ErrorScreen({ title, detail }: { title: string; detail?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)", fontWeight: 500, marginBottom: 8 }}>
          {title}
        </div>
        {detail && (
          <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
