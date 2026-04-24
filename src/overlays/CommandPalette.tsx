import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon, Kbd } from "@/icons/Icon";
import { COMMANDS } from "@/data/commands";
import type { Command } from "@/types";

interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onRun: (cmd: Command) => void;
}

export function CommandPalette({ open, onClose, onRun }: PaletteProps) {
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

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return COMMANDS;
    return COMMANDS.filter(
      (c) => c.name.toLowerCase().includes(ql) || c.group.toLowerCase().includes(ql),
    );
  }, [q]);

  const grouped = useMemo(() => {
    const map: Record<string, Command[]> = {};
    filtered.forEach((c) => {
      if (!map[c.group]) map[c.group] = [];
      map[c.group].push(c);
    });
    return map;
  }, [filtered]);

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
        onRun(filtered[sel]);
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
          width: 560,
          maxWidth: "90%",
          background: "var(--paper-alt)",
          borderRadius: 8,
          border: "1px solid var(--line)",
          boxShadow: "0 20px 60px rgba(var(--shadow), 0.25), 0 0 0 0.5px rgba(var(--shadow), 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: 460,
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
          <Icon name="search" size={15} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={handleKey}
            placeholder="Type a command or search files\u2026"
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
          <Kbd k="esc" />
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", padding: "6px 0" }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>
              No matches
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div
                  style={{
                    padding: "6px 16px 2px",
                    fontFamily: "var(--font-sans)",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  {group}
                </div>
                {items.map((cmd) => {
                  const flatIdx = filtered.indexOf(cmd);
                  const isSel = flatIdx === sel;
                  return (
                    <div
                      key={cmd.id}
                      ref={isSel ? selectedRef : undefined}
                      onMouseEnter={() => setSel(flatIdx)}
                      onClick={() => { onRun(cmd); onClose(); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        margin: "1px 8px",
                        padding: "7px 10px",
                        borderRadius: 5,
                        background: isSel ? "var(--accent)" : "transparent",
                        color: isSel ? "var(--paper)" : "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name={cmd.icon} size={14} style={{ color: isSel ? "var(--paper)" : "var(--muted)" }} />
                      <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13 }}>{cmd.name}</span>
                      {cmd.shortcut && (
                        <span style={{ display: "inline-flex", gap: 2 }}>
                          {cmd.shortcut.map((k, i) => (
                            <span
                              key={i}
                              style={{
                                minWidth: 18,
                                height: 18,
                                padding: "0 4px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 4,
                                fontFamily: "var(--font-mono)",
                                fontSize: 10,
                                color: isSel ? "var(--paper)" : "var(--ink-soft)",
                                background: isSel ? "rgba(255,255,255,0.15)" : "var(--paper-deep)",
                                border: `1px solid ${isSel ? "rgba(255,255,255,0.2)" : "var(--line)"}`,
                              }}
                            >
                              {k}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Enter" />run</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="↑" /><Kbd k="↓" />navigate</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Esc" />dismiss</span>
          <span style={{ flex: 1 }} />
          <span>{filtered.length} {filtered.length === 1 ? "result" : "results"}</span>
        </div>
      </div>
    </div>
  );
}
