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
import { useSidebarDirs } from "@/hooks/useSidebarDirs";
import { useConfig } from "@/hooks/useConfig";
import { DENSITY } from "@/themes/tokens";
import { TREE, resolveSelection, buildPathNames } from "@/data";
import { THEMES } from "@/themes";
import type { DensityKey, SidebarItem, FileNode, ThemeKey, Command } from "@/types";

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

// ── App ─────────────────────────────────────────────────────────────
function App() {
  // Config (persisted preferences + pinned folders)
  const { config, updateConfig, loaded: configLoaded, pinFolder, unpinFolder, isPinned } = useConfig();

  const { themeKey, setThemeKey } = useTheme(config.theme);
  const [densityKey, setDensityKey] = useState<DensityKey>(config.density);
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(config.sidebar_open);
  const [showHidden] = useState(config.show_hidden);
  const [hideTitlebar, setHideTitlebar] = useState(config.hide_titlebar);
  const [windowShown, setWindowShown] = useState(!IS_TAURI);

  // Sync local state from config when it loads from disk
  useEffect(() => {
    setThemeKey(config.theme);
    setDensityKey(config.density);
    setSidebarOpen(config.sidebar_open);
    setHideTitlebar(config.hide_titlebar);
  }, [config.theme, config.density, config.sidebar_open, config.hide_titlebar, setThemeKey]);

  // Apply/remove window decorations when toggled
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

  // Navigation: pick real or mock based on runtime
  const realNav = useRealFileTree(showHidden);
  const mockNav = useMockNav();

  const isTauriReady = IS_TAURI && realNav.state !== null;
  const nav = isTauriReady ? realNav : mockNav;
  const tree: FileNode = isTauriReady ? realNav.state!.rootNode : TREE;

  // Sidebar: real user dirs (with pinned folders) or mock
  const realSidebar = useSidebarDirs(config.pinned_folders);

  // Show the window once config is loaded and real tree is ready (or not in Tauri)
  useEffect(() => {
    if (windowShown) return;
    if (!IS_TAURI) { setWindowShown(true); return; }
    if (!configLoaded || !realNav.state) return;
    (async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setDecorations(!config.hide_titlebar);
      await getCurrentWindow().show();
      setWindowShown(true);
    })();
  }, [configLoaded, realNav.state, windowShown, config.hide_titlebar]);

  // Overlay state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [folderPaletteOpen, setFolderPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
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

  // Context menu: resolve the right-clicked node and its disk path
  const contextNode = useMemo(() => {
    if (!contextMenu) return null;
    return resolveSelection(tree, [...nav.selection.slice(0, -1), contextMenu.nodeId]) || null;
  }, [contextMenu, tree, nav.selection]);

  const contextDiskPath = useMemo(() => {
    if (!contextMenu || !isTauriReady) return null;
    return realNav.state?.pathMap.get(contextMenu.nodeId) ?? null;
  }, [contextMenu, isTauriReady, realNav.state]);

  // In Tauri mode, show skeleton while loading
  if (IS_TAURI && !windowShown) {
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
      {/* Chrome skeleton */}
      <div
        style={{
          height: 44,
          borderBottom: "1px solid var(--line)",
          background: "var(--paper-alt)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
        }}
      >
        <SkeletonBar w={60} h={8} />
        <SkeletonBar w={120} h={8} />
        <div style={{ flex: 1 }} />
        <SkeletonBar w={100} h={8} />
      </div>

      {/* Body skeleton */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar skeleton */}
        <div
          style={{
            width: 230,
            background: "var(--paper-alt)",
            borderRight: "1px solid var(--line)",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <SkeletonBar w={40} h={6} />
          {[110, 80, 95, 70, 85, 100].map((w, i) => (
            <SkeletonBar key={i} w={w} h={10} />
          ))}
          <div style={{ height: 16 }} />
          <SkeletonBar w={40} h={6} />
          {[90, 75].map((w, i) => (
            <SkeletonBar key={`b${i}`} w={w} h={10} />
          ))}
        </div>

        {/* Columns skeleton */}
        <div style={{ flex: 1, display: "flex" }}>
          {[0, 1, 2].map((col) => (
            <div
              key={col}
              style={{
                width: 280,
                borderRight: "1px solid var(--line)",
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {Array.from({ length: 8 - col * 2 }).map((_, i) => (
                <SkeletonBar key={i} w={80 + Math.random() * 120} h={10} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Status bar skeleton */}
      <div
        style={{
          height: 26,
          borderTop: "1px solid var(--line)",
          background: "var(--paper-alt)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
        }}
      >
        <SkeletonBar w={80} h={6} />
      </div>
    </div>
  );
}

function SkeletonBar({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: "var(--paper-deep)",
        opacity: 0.6,
      }}
    />
  );
}

export default App;
