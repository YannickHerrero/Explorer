import { useState, useCallback, useMemo } from "react";
import { Chrome } from "@/components/Chrome";
import { Sidebar, SIDEBAR_DATA } from "@/components/Sidebar";
import { Columns } from "@/components/Columns";
import { StatusBar } from "@/components/StatusBar";
import { useTheme } from "@/hooks/useTheme";
import { DENSITY } from "@/themes/tokens";
import { TREE, resolveSelection, buildPathNames } from "@/data";
import type { DensityKey, SidebarItem, FileNode } from "@/types";

function App() {
  const { themeKey } = useTheme("sage");
  const [densityKey] = useState<DensityKey>("comfortable");
  const density = DENSITY[densityKey];
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Navigation state
  const [selection, setSelection] = useState(["root", "projects", "explorer", "src", "s1"]);
  const [focusedCol, setFocusedCol] = useState(3);
  const [history, setHistory] = useState([["root", "projects", "explorer", "src", "s1"]]);
  const [histIdx, setHistIdx] = useState(0);

  // Overlay state
  const [, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

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

  const goBack = () => {
    if (histIdx > 0) {
      setHistIdx((i) => i - 1);
      setSelection(history[histIdx - 1]);
    }
  };

  const goFwd = () => {
    if (histIdx < history.length - 1) {
      setHistIdx((i) => i + 1);
      setSelection(history[histIdx + 1]);
    }
  };

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
      </div>
    </div>
  );
}

export default App;
