import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon, Kbd } from "@/icons/Icon";
import { fuzzyFilter } from "@/utils/fuzzy";
import type { SidebarSection, SidebarItem } from "@/types";

interface FolderPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (item: SidebarItem) => void;
  sections: SidebarSection[];
}

export function FolderPalette({ open, onClose, onNavigate, sections }: FolderPaletteProps) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Flatten all navigable items (those with diskPath or targetPath)
  const allItems = useMemo(() => {
    return sections
      .flatMap((s) => s.items)
      .filter((item) => item.diskPath || item.targetPath);
  }, [sections]);

  const filtered = useMemo(() => {
    return fuzzyFilter(allItems, q, (item) => item.name);
  }, [q, allItems]);

  const selectedRef = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(filtered.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[sel]) {
        onNavigate(filtered[sel]);
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

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
          width: 480,
          maxWidth: "90%",
          background: "var(--paper-alt)",
          borderRadius: 8,
          border: "1px solid var(--line)",
          boxShadow: "0 20px 60px rgba(var(--shadow), 0.25), 0 0 0 0.5px rgba(var(--shadow), 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: 420,
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 14px",
            gap: 10,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <Icon name="folder" size={15} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={handleKey}
            placeholder="Go to folder..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              color: "var(--ink)",
            }}
          />
          <Kbd k="Esc" />
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", padding: "6px 0" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>
              No matching folders
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSel = idx === sel;
              return (
                <div
                  key={item.id}
                  ref={isSel ? selectedRef : undefined}
                  onMouseEnter={() => setSel(idx)}
                  onClick={() => { onNavigate(item); onClose(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    margin: "1px 8px",
                    padding: "8px 10px",
                    borderRadius: 5,
                    background: isSel ? "var(--accent)" : "transparent",
                    color: isSel ? "var(--paper)" : "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: isSel ? "var(--paper)" : "var(--muted)", display: "inline-flex" }}>
                    {item.icon === "tag" ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: item.color,
                          display: "inline-block",
                          marginLeft: 3,
                          marginRight: 3,
                        }}
                      />
                    ) : (
                      <Icon name={item.icon} size={14} />
                    )}
                  </span>
                  <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13 }}>
                    {item.name}
                  </span>
                  {item.diskPath && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: isSel ? "rgba(255,255,255,0.6)" : "var(--muted)",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        direction: "rtl",
                        textAlign: "left",
                      }}
                    >
                      {item.diskPath}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "var(--font-sans)",
            fontSize: 10.5,
            color: "var(--muted)",
            background: "var(--paper-deep)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Enter" />open</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="↑" /><Kbd k="↓" />navigate</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Esc" />dismiss</span>
          <span style={{ flex: 1 }} />
          <span>{filtered.length} {filtered.length === 1 ? "folder" : "folders"}</span>
        </div>
      </div>
    </div>
  );
}
