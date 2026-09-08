import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon, Kbd } from "@/icons/Icon";
import { fuzzyFilter } from "@/utils/fuzzy";

interface OpenWithHandler {
  id: string;
  name: string;
  command: string;
  icon_path: string | null;
  icon_index: number;
  is_recommended: boolean;
}

interface OpenWithPaletteProps {
  open: boolean;
  path: string | null;
  onClose: () => void;
  onError: (message: string) => void;
}

// The native dialog row sits outside the fuzzy filter so it stays reachable no matter
// what the user typed.
type Row = { kind: "handler"; handler: OpenWithHandler } | { kind: "dialog" };

export function OpenWithPalette({ open, path, onClose, onError }: OpenWithPaletteProps) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [handlers, setHandlers] = useState<OpenWithHandler[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !path) return;
    setQ("");
    setSel(0);
    setHandlers([]);
    setLoading(true);
    setTimeout(() => inputRef.current?.focus(), 20);

    let cancelled = false;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const found = await invoke<OpenWithHandler[]>("list_open_with_handlers", { path });
        if (!cancelled) setHandlers(found);
      } catch (err) {
        if (!cancelled) onError(`Failed to list applications: ${err}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, path, onError]);

  const rows = useMemo<Row[]>(() => {
    const matching = fuzzyFilter(handlers, q, (h) => h.name);
    const handlerRows: Row[] = matching.map((handler) => ({ kind: "handler", handler }));
    return [...handlerRows, { kind: "dialog" }];
  }, [handlers, q]);

  const selectedRef = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const run = useCallback(async (row: Row) => {
    if (!path) return;
    onClose();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      if (row.kind === "dialog") {
        await invoke<boolean>("open_with_dialog", { path });
      } else {
        await invoke<null>("open_with_handler", { path, handlerId: row.handler.id });
      }
    } catch (err) {
      onError(`${err}`);
    }
  }, [path, onClose, onError]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(rows.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[sel]) run(rows[sel]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open || !path) return null;

  const fileName = path.split(/[\\/]/).pop() || path;
  const appCount = rows.length - 1;

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
          <Icon name="share" size={15} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            onKeyDown={handleKey}
            placeholder={`Open "${fileName}" with...`}
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
          {loading && (
            <div style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>
              Looking up applications...
            </div>
          )}
          {!loading && appCount === 0 && (
            <div style={{ padding: "20px 30px 6px", textAlign: "center", color: "var(--muted)", fontSize: 12.5 }}>
              {q ? "No matching applications" : "No application is registered for this file"}
            </div>
          )}
          {rows.map((row, idx) => {
            const isSel = idx === sel;
            const isDialog = row.kind === "dialog";
            return (
              <div
                key={isDialog ? "__dialog__" : row.handler.id}
                ref={isSel ? selectedRef : undefined}
                onMouseEnter={() => setSel(idx)}
                onClick={() => run(row)}
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
                  borderTop: isDialog && appCount > 0 ? "1px solid var(--line)" : undefined,
                  marginTop: isDialog && appCount > 0 ? 5 : undefined,
                  paddingTop: isDialog && appCount > 0 ? 9 : undefined,
                }}
              >
                <span style={{ color: isSel ? "var(--paper)" : "var(--muted)", display: "inline-flex" }}>
                  <Icon name={isDialog ? "search" : "file"} size={14} />
                </span>
                <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13 }}>
                  {isDialog ? "Other application..." : row.handler.name}
                </span>
                {!isDialog && (
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
                    {row.handler.command}
                  </span>
                )}
              </div>
            );
          })}
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
          <span>{appCount} {appCount === 1 ? "app" : "apps"}</span>
        </div>
      </div>
    </div>
  );
}
