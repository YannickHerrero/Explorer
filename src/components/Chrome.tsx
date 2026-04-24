import { Icon, Kbd } from "@/icons/Icon";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

interface ChromeProps {
  path: string[];
  onBack: () => void;
  onFwd: () => void;
  onPalette: () => void;
  onFolderPalette: () => void;
  onSearch: () => void;
  onToggleSidebar: () => void;
  onToggleCheatsheet: () => void;
  canBack: boolean;
  canFwd: boolean;
  searchOpen: boolean;
  sidebarOpen: boolean;
  hideTitlebar: boolean;
}

async function windowAction(action: "close" | "minimize" | "toggleMaximize") {
  if (!IS_TAURI) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  const win = getCurrentWindow();
  if (action === "close") win.close();
  else if (action === "minimize") win.minimize();
  else win.toggleMaximize();
}

async function startDrag() {
  if (!IS_TAURI) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  getCurrentWindow().startDragging();
}

export function Chrome({
  path,
  onBack,
  onFwd,
  onPalette,
  onFolderPalette,
  onSearch,
  onToggleSidebar,
  onToggleCheatsheet,
  canBack,
  canFwd,
  searchOpen,
  sidebarOpen,
  hideTitlebar,
}: ChromeProps) {
  // Show custom window controls when titlebar is hidden (Tauri) or in browser mode


  return (
    <div
      onMouseDown={(e) => {
        // Allow dragging from the chrome bar when titlebar is hidden
        if (hideTitlebar && IS_TAURI && e.target === e.currentTarget) {
          startDrag();
        }
      }}
      onDoubleClick={(e) => {
        // Double-click to maximize/restore when titlebar is hidden
        if (hideTitlebar && IS_TAURI && e.target === e.currentTarget) {
          windowAction("toggleMaximize");
        }
      }}
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        borderBottom: "1px solid var(--line)",
        background: "var(--paper-alt)",
        gap: 10,
        flexShrink: 0,
      }}
    >
      {/* Nav */}
      <div style={{ display: "flex", gap: 2 }}>
        <IconBtn name="chevron-left" onClick={onBack} disabled={!canBack} title="Back  Ctrl+[" />
        <IconBtn name="chevron-right" onClick={onFwd} disabled={!canFwd} title="Forward  Ctrl+]" />
      </div>

      <IconBtn name="sidebar" onClick={onToggleSidebar} active={sidebarOpen} title="Toggle Sidebar" />

      {/* Breadcrumbs — draggable region when titlebar is hidden */}
      <div
        onMouseDown={(e) => {
          if (hideTitlebar && IS_TAURI) {
            e.preventDefault();
            startDrag();
          }
        }}
        onDoubleClick={() => {
          if (hideTitlebar && IS_TAURI) {
            windowAction("toggleMaximize");
          }
        }}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: -0.1,
          overflow: "hidden",
          cursor: hideTitlebar ? "default" : undefined,
        }}
      >
        <Breadcrumbs path={path} />
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <PaletteButton onClick={onFolderPalette} />
        <IconBtn name="search" onClick={onSearch} active={searchOpen} title="Search  Ctrl+F" />
        <IconBtn name="keyboard" onClick={onToggleCheatsheet} title="Shortcuts  Ctrl+/" />
      </div>
    </div>
  );
}

function IconBtn({
  name,
  onClick,
  disabled,
  active,
  title,
  size = 14,
}: {
  name: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="icon-btn"
      style={{
        width: 26,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        border: "none",
        background: active ? "var(--paper-deep)" : "transparent",
        color: disabled ? "var(--muted)" : "var(--ink-soft)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "background 120ms",
      }}
    >
      <Icon name={name} size={size} />
    </button>
  );
}

function PaletteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 6px 0 8px",
        borderRadius: 5,
        border: "1px solid var(--line)",
        background: "var(--paper-deep)",
        color: "var(--ink-soft)",
        fontFamily: "var(--font-sans)",
        fontSize: 11.5,
        cursor: "pointer",
      }}
    >
      <Icon name="search" size={11} />
      <span style={{ color: "var(--muted)" }}>Go to...</span>
      <span style={{ display: "inline-flex", gap: 1 }}>
        <Kbd k="Ctrl" /><Kbd k="P" />
      </span>
    </button>
  );
}

function Breadcrumbs({ path }: { path: string[] }) {
  const segments = path.slice(1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, maxWidth: "60%", overflow: "hidden" }}>
      <Icon name="folder" size={13} style={{ color: "var(--muted)" }} />
      <span style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 400 }}>~</span>
      {segments.map((s, i) => (
        <span key={i} style={{ display: "contents" }}>
          <Icon name="chevron-right" size={10} style={{ color: "var(--muted)", opacity: 0.6 }} />
          <span
            style={{
              color: i === segments.length - 1 ? "var(--ink)" : "var(--muted)",
              fontFamily: i === segments.length - 1 ? "var(--font-serif)" : "var(--font-sans)",
              fontSize: i === segments.length - 1 ? 14 : 12.5,
              fontWeight: i === segments.length - 1 ? 500 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {s}
          </span>
        </span>
      ))}
    </div>
  );
}

export { IconBtn };
