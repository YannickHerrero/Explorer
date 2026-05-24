import { useState, useEffect, useRef, useMemo } from "react";
import { Icon, kindIcon, Kbd } from "@/icons/Icon";

interface SearchHit {
  id: string;
  name: string;
  kind: string;
  path: string;
  parent_dir: string;
  modified: string | null;
  is_dir: boolean;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  currentDir: string | null;
  homeDir: string | null;
  showHidden: boolean;
  onOpen?: (path: string) => void;
  onReveal?: (path: string, parentDir: string) => void;
}

const RESULT_LIMIT = 200;

export function SearchOverlay({
  open,
  onClose,
  currentDir,
  homeDir,
  showHidden,
  onOpen,
  onReveal,
}: SearchOverlayProps) {
  const [q, setQ] = useState("");
  const [rawHits, setRawHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState({
    kind: "all",
    where: "current" as "current" | "home",
  });

  useEffect(() => {
    if (open) {
      setQ("");
      setRawHits([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Debounced search
  const searchSeq = useRef(0);
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (!trimmed) {
      setRawHits([]);
      setLoading(false);
      return;
    }
    const root = filters.where === "home" ? homeDir : currentDir;
    if (!root) {
      setRawHits([]);
      return;
    }
    setLoading(true);
    const seq = ++searchSeq.current;
    const handle = setTimeout(async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const hits = await invoke<SearchHit[]>("search_dir", {
          root,
          query: trimmed,
          showHidden,
          limit: RESULT_LIMIT,
        });
        if (seq !== searchSeq.current) return;
        setRawHits(hits);
        setActiveIdx(0);
      } catch (err) {
        if (seq !== searchSeq.current) return;
        console.error("search_dir failed:", err);
        setRawHits([]);
      } finally {
        if (seq === searchSeq.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [q, filters.where, open, currentDir, homeDir, showHidden]);

  const results = useMemo(() => {
    if (filters.kind === "all") return rawHits;
    return rawHits.filter((h) => h.kind === filters.kind);
  }, [rawHits, filters.kind]);

  const open_ = (hit: SearchHit) => {
    if (onOpen) onOpen(hit.path);
    onClose();
  };
  const reveal = (hit: SearchHit) => {
    if (onReveal) onReveal(hit.path, hit.parent_dir);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(var(--shadow), 0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 720,
          maxWidth: "92%",
          maxHeight: 540,
          background: "var(--paper-alt)",
          borderRadius: 10,
          border: "1px solid var(--line)",
          boxShadow: "0 30px 80px rgba(var(--shadow), 0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Icon name="search" size={18} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(results.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = results[activeIdx];
                if (!hit) return;
                if (e.ctrlKey || e.metaKey) reveal(hit);
                else open_(hit);
              }
            }}
            placeholder={filters.where === "home" ? "Search home..." : "Search current folder..."}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              color: "var(--ink)",
              letterSpacing: -0.2,
            }}
          />
          <Kbd k="esc" />
        </div>

        <div
          style={{
            padding: "10px 16px",
            display: "flex",
            gap: 6,
            borderBottom: "1px solid var(--line)",
            flexWrap: "wrap",
          }}
        >
          <FilterChip
            label="Kind"
            value={filters.kind}
            options={[
              { v: "all", l: "Any" },
              { v: "image", l: "Images" },
              { v: "pdf", l: "PDFs" },
              { v: "text", l: "Text" },
              { v: "code", l: "Code" },
              { v: "audio", l: "Audio" },
              { v: "video", l: "Video" },
              { v: "folder", l: "Folders" },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, kind: v }))}
          />
          <FilterChip
            label="Where"
            value={filters.where}
            options={[
              { v: "current", l: "Current folder" },
              { v: "home", l: "Home" },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, where: v as "current" | "home" }))}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading && q.trim() ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
              {q.trim() ? "No results" : "Type to search"}
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={r.id + r.path}
                onClick={() => open_(r)}
                onMouseEnter={() => setActiveIdx(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 18px",
                  background: i === activeIdx ? "var(--paper-deep)" : "transparent",
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <Icon name={kindIcon(r.kind)} size={18} style={{ color: "var(--muted)" }} />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      color: "var(--ink)",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Highlight text={r.name} q={q} />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      color: "var(--muted)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.parent_dir}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--muted)" }}>
                  {r.modified}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--line)",
            background: "var(--paper-deep)",
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontSize: 10.5,
            color: "var(--muted)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Enter" />open</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Ctrl" /><Kbd k="Enter" />reveal</span>
          <span style={{ flex: 1 }} />
          <span>{results.length}{rawHits.length >= RESULT_LIMIT ? "+" : ""} {results.length === 1 ? "match" : "matches"}</span>
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const tl = text.toLowerCase();
  const ql = q.toLowerCase();
  const idx = tl.indexOf(ql);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "var(--accent-soft)",
          color: "var(--paper)",
          padding: "0 1px",
          borderRadius: 2,
        }}
      >
        {text.slice(idx, idx + ql.length)}
      </mark>
      {text.slice(idx + ql.length)}
    </>
  );
}

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.v === value)?.l || value;
  const isActive = value !== options[0].v;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 26,
          padding: "0 10px",
          borderRadius: 13,
          border: "1px solid var(--line)",
          background: isActive ? "var(--accent)" : "var(--paper)",
          color: isActive ? "var(--paper)" : "var(--ink-soft)",
          fontFamily: "var(--font-sans)",
          fontSize: 11.5,
          cursor: "pointer",
        }}
      >
        <span style={{ color: isActive ? "var(--paper)" : "var(--muted)", opacity: 0.9 }}>
          {label}:
        </span>
        <span>{current}</span>
        <Icon name="chevron-down" size={10} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 0,
            minWidth: 160,
            background: "var(--paper-alt)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            boxShadow: "0 10px 30px rgba(var(--shadow), 0.2)",
            padding: 4,
            zIndex: 10,
          }}
        >
          {options.map((o) => (
            <div
              key={o.v}
              onClick={() => { onChange(o.v); setOpen(false); }}
              style={{
                padding: "6px 10px",
                borderRadius: 4,
                background: o.v === value ? "var(--paper-deep)" : "transparent",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {o.v === value && <Icon name="check" size={10} />}
              <span style={{ marginLeft: o.v === value ? 0 : 16 }}>{o.l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
