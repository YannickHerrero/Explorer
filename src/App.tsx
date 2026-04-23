import { useState } from "react";
import { Chrome } from "@/components/Chrome";
import { StatusBar } from "@/components/StatusBar";
import { useTheme } from "@/hooks/useTheme";

function App() {
  const { themeKey } = useTheme("sage");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Overlay state
  const [, setPaletteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setSettingsOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);

  const pathNames = ["maya", "Projects", "explorer-app", "src"];

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
          onBack={() => {}}
          onFwd={() => {}}
          canBack={false}
          canFwd={false}
          onPalette={() => setPaletteOpen(true)}
          onSearch={() => setSearchOpen(!searchOpen)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCheatsheet={() => setCheatsheetOpen(!cheatsheetOpen)}
          sidebarOpen={sidebarOpen}
          searchOpen={searchOpen}
        />

        {/* Main content area - placeholder */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {sidebarOpen && (
            <div
              style={{
                width: 230,
                flexShrink: 0,
                background: "var(--paper-alt)",
                borderRight: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
              }}
            >
              Sidebar
            </div>
          )}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--paper)",
              color: "var(--muted)",
              fontFamily: "var(--font-serif)",
              fontSize: 18,
            }}
          >
            Column View
          </div>
        </div>

        <StatusBar node={null} onSettings={() => setSettingsOpen(true)} />
      </div>
    </div>
  );
}

export default App;
