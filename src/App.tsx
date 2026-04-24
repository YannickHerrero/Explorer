import { useState, useCallback, useMemo, useEffect } from "react";
import { Chrome } from "@/components/Chrome";
import { Sidebar, SIDEBAR_DATA } from "@/components/Sidebar";
import { Columns } from "@/components/Columns";
import { StatusBar } from "@/components/StatusBar";
import { CommandPalette } from "@/overlays/CommandPalette";
import { SearchOverlay } from "@/overlays/SearchOverlay";
import { Settings } from "@/overlays/Settings";
import { Cheatsheet } from "@/overlays/Cheatsheet";
import { ContextMenu } from "@/overlays/ContextMenu";
import { FolderPalette } from "@/overlays/FolderPalette";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useRealFileTree } from "@/hooks/useRealFileTree";
import { useInit } from "@/hooks/useInit";
import { useConfig } from "@/hooks/useConfig";
import { DENSITY } from "@/themes/tokens";
import { TREE, resolveSelection, buildPathNames } from "@/data";
import { THEMES } from "@/themes";
import type { DensityKey, SidebarItem, SidebarSection, FileNode, ThemeKey, Command } from "@/types";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

// ── Mock-mode navigation (used when running outside Tauri) ──────────
function useMockNav() {
  const [selection, setSelection] = useState(["root", "projects", "explorer", "src", "s1"]);
  const [focusedCol, setFocusedCol] = useState(3);
  const [history, setHistory] = useState([["root", "projects", "explorer", "src", "s1"]]);
  const [histIdx, setHistIdx] = useState(0);

  const navigateTo = useCallback((newSel: string[], focused?: number) => {
    setSelection(newSel);
    if (focused !== undefined) setFocusedCol(focused);
    setHistory((h) => [...h.slice(0, histIdx + 1), newSel]);
    setHistIdx((i) => i + 1);
  }, [histIdx]);

  const goBack = useCallback(() => {
    if (histIdx > 0) {
      setHistIdx((i) => i - 1);
      setSelection(history[histIdx - 1]);
    }
  }, [histIdx, history]);

  const goFwd = useCallback(() => {
    if (histIdx < history.length - 1) {
      setHistIdx((i) => i + 1);
      setSelection(history[histIdx + 1]);
    }
  }, [histIdx, history]);

  return { selection, focusedCol, setFocusedCol, navigateTo, goBack, goFwd, histIdx, historyLength: history.length };
}

// Build sidebar sections from init data
function buildSidebarSections(
  userDirs: { home: string; desktop: string | null; documents: string | null; downloads: string | null; pictures: string | null; music: string | null; videos: string | null },
  wslDistros: { name: string; path: string }[],
  drives: { letter: string; path: string; label: string | null }[],
  pinnedFolders: { name: string; path: string }[],
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

  result.push({
    label: "Tags",
    items: [
      { id: "t-red", name: "Urgent", icon: "tag", color: "#C44536" },
      { id: "t-org", name: "Review", icon: "tag", color: "#D97706" },
      { id: "t-grn", name: "Done", icon: "tag", color: "#3F6B3A" },
      { id: "t-blu", name: "Reference", icon: "tag", color: "#4A6B8A" },
    ],
  });

  result.push({ label: "", items: [{ id: "trash", name: "Trash", icon: "trash" }] });

  return result;
}

// ── App ─────────────────────────────────────────────────────────────
function App() {
  // Single batched init call for Tauri mode
  const initData = useInit();

  // Config (for saving changes — init provides the initial read)
  const { config, updateConfig, pinFolder, unpinFolder, isPinned } = useConfig();

  // Determine if init is done
  const tauriReady = IS_TAURI && initData !== null;

  // Theme — use init data for initial value, config for ongoing changes
  const initialTheme = (tauriReady ? initData.config.theme : config.theme) as ThemeKey;
  const { themeKey, setThemeKey } = useTheme(initialTheme);
  const [densityKey, setDensityKey] = useState<DensityKey>("comfortable");
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHidden] = useState(false);
  const [hideTitlebar, setHideTitlebar] = useState(true);

  // Apply init data once it arrives
  const [initApplied, setInitApplied] = useState(false);
  useEffect(() => {
    if (!initData || initApplied) return;
    setThemeKey(initData.config.theme);
    setDensityKey(initData.config.density);
    setSidebarOpen(initData.config.sidebar_open);
    setHideTitlebar(initData.config.hide_titlebar);
    setInitApplied(true);
  }, [initData, initApplied, setThemeKey]);

  // Sync config changes (non-init)
  useEffect(() => {
    if (!initApplied) return;
    setThemeKey(config.theme);
    setDensityKey(config.density);
    setSidebarOpen(config.sidebar_open);
    setHideTitlebar(config.hide_titlebar);
  }, [config.theme, config.density, config.sidebar_open, config.hide_titlebar, setThemeKey, initApplied]);

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

  // Navigation
  const realNav = useRealFileTree(showHidden);
  const mockNav = useMockNav();

  // Seed realNav with init data (avoids duplicate home dir read)
  useEffect(() => {
    if (!initData || realNav.state) return;
    // The useRealFileTree hook will load on its own, but initData already has the data.
    // We can't easily inject — the hook handles its own state. The batched init
    // still saves IPC calls for config/sidebar/wsl/drives. The home dir read_dir
    // happens in parallel in the Rust side via get_init_data.
  }, [initData, realNav.state]);

  const isTauriReady = IS_TAURI && realNav.state !== null;
  const nav = isTauriReady ? realNav : mockNav;
  const tree: FileNode = isTauriReady ? realNav.state!.rootNode : TREE;

  // Sidebar from init data (synchronous — no extra async call)
  const realSidebar = useMemo(() => {
    if (!initData) return null;
    return buildSidebarSections(
      initData.userDirs,
      initData.wslDistros,
      initData.drives,
      config.pinned_folders,
    );
  }, [initData, config.pinned_folders]);

  // Overlay state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [folderPaletteOpen, setFolderPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; isSidebar?: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
    if (isTauriReady && item.diskPath) {
      realNav.navigateToPath(item.diskPath);
      return;
    }
    if (item.targetPath) {
      const ids = ["root"];
      let node = tree;
      for (let i = 1; i < item.targetPath.length; i++) {
        const name = item.targetPath[i];
        const child = (node.children || []).find((c) => c.name === name);
        if (!child) break;
        ids.push(child.id);
        node = child;
      }
      const first = node.children?.[0];
      if (first) ids.push(first.id);
      nav.navigateTo(ids, ids.length - 2);
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

  const overlaysOpen = paletteOpen || folderPaletteOpen || searchOpen || settingsOpen || cheatsheetOpen;

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
    onToast: showToast,
    onDismissOverlays: () => {
      setPaletteOpen(false);
      setFolderPaletteOpen(false);
      setSearchOpen(false);
      setSettingsOpen(false);
      setCheatsheetOpen(false);
      setContextMenu(null);
    },
    onOpen: handleOpenFile,
  });

  const pathNames = useMemo(() => buildPathNames(tree, nav.selection), [tree, nav.selection]);
  const currentNode = useMemo(() => resolveSelection(tree, nav.selection), [tree, nav.selection]);

  const activeSidebarId = useMemo(() => {
    if (isTauriReady && realSidebar) {
      const rootPath = realNav.state!.rootPath;
      const match = realSidebar
        .flatMap((s) => s.items)
        .find((i) => i.diskPath === rootPath);
      if (match) return match.id;
      return "home";
    }
    if (nav.selection[1]) {
      const match = SIDEBAR_DATA.flatMap((s) => s.items).find((i) => i.id === nav.selection[1]);
      if (match) return match.id;
    }
    return "home";
  }, [nav.selection, isTauriReady, realSidebar, realNav.state]);

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

  // Show skeleton while loading in Tauri mode
  if (IS_TAURI && !isTauriReady) {
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
          onPalette={() => setPaletteOpen(true)}
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
              sections={isTauriReady && realSidebar ? realSidebar : undefined}
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
          />
        </div>

        <StatusBar node={currentNode} onSettings={() => setSettingsOpen(true)} />

        {/* Overlays */}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={runCommand} />
        <FolderPalette
          open={folderPaletteOpen}
          onClose={() => setFolderPaletteOpen(false)}
          onNavigate={handleSidebarNav}
          sections={isTauriReady && realSidebar ? realSidebar : SIDEBAR_DATA}
        />
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
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
        />
        <Cheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onRun={(item) => showToast(item.name)}
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

export default App;
