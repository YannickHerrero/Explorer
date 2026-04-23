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
import { DENSITY } from "@/themes/tokens";
import { TREE, resolveSelection, buildPathNames } from "@/data";
import { THEMES } from "@/themes";
import type { DensityKey, SidebarItem, FileNode, ThemeKey, Command } from "@/types";

function App() {
  const { themeKey, setThemeKey } = useTheme("sage");
  const [densityKey, setDensityKey] = useState<DensityKey>("comfortable");
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Navigation state
  const [selection, setSelection] = useState(["root", "projects", "explorer", "src", "s1"]);
  const [focusedCol, setFocusedCol] = useState(3);
  const [history, setHistory] = useState([["root", "projects", "explorer", "src", "s1"]]);
  const [histIdx, setHistIdx] = useState(0);

  // Overlay state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const navigateTo = useCallback((newSel: string[], focused?: number) => {
    setSelection(newSel);
    if (focused !== undefined) setFocusedCol(focused);
    setHistory((h) => [...h.slice(0, histIdx + 1), newSel]);
    setHistIdx((i) => i + 1);
  }, [histIdx]);

  const handleSelect = (colIdx: number, id: string) => {
    const newSel = [...selection.slice(0, colIdx + 1), id];
    navigateTo(newSel, colIdx);
  };

  const handleNavigate = (colIdx: number, item: FileNode) => {
    if (item.kind === "folder") {
      const first = item.children?.[0];
      const newSel = [...selection.slice(0, colIdx + 1), item.id];
      if (first) newSel.push(first.id);
      navigateTo(newSel, first ? colIdx + 1 : colIdx);
    }
  };

  const handleSidebarNav = (item: SidebarItem) => {
    if (item.targetPath) {
      const ids = ["root"];
      let node = TREE;
      for (let i = 1; i < item.targetPath.length; i++) {
        const name = item.targetPath[i];
        const child = (node.children || []).find((c) => c.name === name);
        if (!child) break;
        ids.push(child.id);
        node = child;
      }
      const first = node.children?.[0];
      if (first) ids.push(first.id);
      navigateTo(ids, ids.length - 2);
    }
  };

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
    selection,
    focusedCol,
    setFocusedCol,
    navigateTo,
    goBack,
    goFwd,
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

  const pathNames = useMemo(() => buildPathNames(TREE, selection), [selection]);
  const currentNode = useMemo(() => resolveSelection(TREE, selection), [selection]);

  const activeSidebarId = useMemo(() => {
    if (selection[1]) {
      const match = SIDEBAR_DATA.flatMap((s) => s.items).find((i) => i.id === selection[1]);
      if (match) return match.id;
    }
    return "home";
  }, [selection]);

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
        if ((e.target as HTMLElement).closest(".file-row")) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
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
          onBack={goBack}
          onFwd={goFwd}
          canBack={histIdx > 0}
          canFwd={histIdx < history.length - 1}
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
            />
          )}
          <Columns
            selection={selection}
            onSelect={handleSelect}
            onNavigate={handleNavigate}
            density={density}
            focusedCol={focusedCol}
            setFocusedCol={setFocusedCol}
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
