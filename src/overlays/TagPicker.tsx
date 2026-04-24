import { useEffect } from "react";
import { Icon } from "@/icons/Icon";

interface TagDef {
  id: string;
  name: string;
  color: string;
}

interface TagPickerProps {
  open: boolean;
  onClose: () => void;
  tags: TagDef[];
  activeTags: TagDef[];
  onToggle: (tagId: string) => void;
}

export function TagPicker({ open, onClose, tags, activeTags, onToggle }: TagPickerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const activeIds = new Set(activeTags.map((t) => t.id));

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(var(--shadow), 0.18)",
        backdropFilter: "blur(2px)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 90,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          maxWidth: "90%",
          background: "var(--paper-alt)",
          borderRadius: 8,
          border: "1px solid var(--line)",
          boxShadow: "0 20px 60px rgba(var(--shadow), 0.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid var(--line)",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--ink)",
          }}
        >
          Add Tag
        </div>
        <div style={{ padding: "6px 0" }}>
          {tags.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 12.5, fontFamily: "var(--font-sans)" }}>
              No tags defined
            </div>
          ) : (
            tags.map((tag) => {
              const active = activeIds.has(tag.id);
              return (
                <div
                  key={tag.id}
                  onClick={() => onToggle(tag.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: "1px 8px",
                    padding: "7px 10px",
                    borderRadius: 5,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: tag.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{tag.name}</span>
                  {active && (
                    <Icon name="check" size={14} style={{ color: "var(--accent)" }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
