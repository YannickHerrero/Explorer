import { useState, useCallback, useMemo } from "react";
import { Chrome } from "@/components/Chrome";
import { Sidebar, SIDEBAR_DATA } from "@/components/Sidebar";
import { Columns } from "@/components/Columns";
import { StatusBar } from "@/components/StatusBar";
import { CommandPalette } from "@/overlays/CommandPalette";
import { SearchOverlay } from "@/overlays/SearchOverlay";
import { Settings } from "@/overlays/Settings";
import { Cheatsheet } from "@/overlays/Cheatsheet";
import { ContextMenu } from "@/overlays/ContextMenu";
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
  const { themeKey, setThemeKey } = useTheme("sage");
  const [densityKey, setDensityKey] = useState<DensityKey>("comfortable");
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showHidden] = useState(false);

  // Config (persisted preferences + pinned folders)
  const { config, pinFolder, unpinFolder, isPinned } = useConfig();

  // Navigation: pick real or mock based on runtime
  const realNav = useRealFileTree(showHidden);
  const mockNav = useMockNav();

  const isTauriReady = IS_TAURI && realNav.state !== null;
  const nav = isTauriReady ? realNav : mockNav;
  const tree: FileNode = isTauriReady ? realNav.state!.rootNode : TREE;

  // Sidebar: real user dirs (with pinned folders) or mock
  const realSidebar = useSidebarDirs(config.pinned_folders);

  // Overlay state
  const [paletteOpen, setPaletteOpen] = useState(false);
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
      setThemeKey(t);
      showToast(`Theme: ${THEMES[t].name}`);
    } else if (cmd.id === "c-settings") {
      setSettingsOpen(true);
    } else if (cmd.id === "c-shortcuts") {
      setCheatsheetOpen(true);
    } else if (cmd.id === "c-toggle-sidebar") {
      setSidebarOpen((v) => !v);
    } else {
      showToast(cmd.name);
    }
  };

  const overlaysOpen = paletteOpen || searchOpen || settingsOpen || cheatsheetOpen;

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
    onToggleSearch: () => setSearchOpen((v) => !v),
    onToggleSettings: () => setSettingsOpen((v) => !v),
    onToggleCheatsheet: () => setCheatsheetOpen((v) => !v),
    onToast: showToast,
    onDismissOverlays: () => {
      setPaletteOpen(false);
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

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: themeKey === "ink" ? "#0a0a0a" : "#1a1915",
        padding: 24,
        fontFamily: "var(--font-sans)",
      }}
      onContextMenu={(e) => {
        const row = (e.target as HTMLElement).closest(".file-row");
        if (row) {
          e.preventDefault();
          // Find which node was right-clicked by walking up to find the selection
          const nodeId = row.getAttribute("data-node-id");
          if (nodeId) {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
          } else {
            setContextMenu({ x: e.clientX, y: e.clientY, nodeId: "" });
          }
        }
      }}
    >
      <div
        style={{
          width: "min(1320px, 100%)",
          height: "min(840px, 100%)",
          background: "var(--paper)",
          borderRadius: 10,
          boxShadow: "0 30px 90px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
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
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCheatsheet={() => setCheatsheetOpen(!cheatsheetOpen)}
          sidebarOpen={sidebarOpen}
          searchOpen={searchOpen}
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
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Settings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={themeKey}
          setTheme={setThemeKey}
          density={densityKey}
          setDensity={setDensityKey}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
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
    </div>
  );
}

export default App;
