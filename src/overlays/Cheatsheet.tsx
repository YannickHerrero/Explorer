import { Icon, KbdRow } from "@/icons/Icon";
import { SHORTCUTS } from "@/data/commands";

interface CheatsheetProps {
  open: boolean;
  onClose: () => void;
}

export function Cheatsheet({ open, onClose }: CheatsheetProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(var(--shadow), 0.35)",
        zIndex: 85,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 820,
          maxWidth: "95%",
          maxHeight: "90%",
          background: "var(--paper)",
          borderRadius: 10,
          border: "1px solid var(--line)",
          boxShadow: "0 30px 80px rgba(var(--shadow), 0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
                color: "var(--ink)",
                fontWeight: 500,
                letterSpacing: -0.3,
              }}
            >
              Keyboard Shortcuts
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              Explorer is built for the keyboard first.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              border: "none",
              borderRadius: 5,
              background: "var(--paper-deep)",
              color: "var(--ink-soft)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Icon name="x" size={12} />
          </button>
        </div>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 24px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 32,
            rowGap: 18,
          }}
        >
          {SHORTCUTS.map((group, gi) => (
            <div key={gi}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 6,
                  paddingBottom: 4,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                {group.group}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {group.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "3px 0" }}>
                    <KbdRow keys={item.keys} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-soft)" }}>
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
