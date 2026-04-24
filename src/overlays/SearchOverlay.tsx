import { useState, useEffect, useRef, useMemo } from "react";
import { Icon, kindIcon, Kbd } from "@/icons/Icon";
import { fuzzyFilter } from "@/utils/fuzzy";
import { TREE } from "@/data";
import type { FileNode } from "@/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface FlatFile extends FileNode {
  path: string;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const [filters, setFilters] = useState({
    kind: "all",
    where: "current",
    modified: "any",
  });

  const allFiles = useMemo(() => {
    if (!open) return [];
    const out: FlatFile[] = [];
    const walk = (node: FileNode, path: string[]) => {
      const p = [...path, node.name];
      if (node.kind !== "folder") {
        out.push({ ...node, path: p.slice(1, -1).join(" / ") || "~" });
      }
      (node.children || []).forEach((c) => walk(c, p));
    };
    walk(TREE, []);
    return out;
  }, [open]);

  const results = useMemo(() => {
    if (!open) return [];
    let r = allFiles;
    if (filters.kind !== "all") r = r.filter((f) => f.kind === filters.kind);
    r = fuzzyFilter(r, q, (f) => f.name);
    return r.slice(0, 40);
  }, [q, filters, allFiles]);

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
        {/* Search input */}
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
            placeholder="Search everywhere\u2026"
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

        {/* Filters */}
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
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, kind: v }))}
          />
          <FilterChip
            label="Where"
            value={filters.where}
            options={[
              { v: "current", l: "Current folder" },
              { v: "home", l: "Home" },
              { v: "all", l: "This Machine" },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, where: v }))}
          />
          <FilterChip
            label="Modified"
            value={filters.modified}
            options={[
              { v: "any", l: "Any time" },
              { v: "today", l: "Today" },
              { v: "week", l: "Past week" },
              { v: "month", l: "Past month" },
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, modified: v }))}
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {results.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>No results</div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 18px",
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
                    }}
                  >
                    ~/{r.path}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--muted)" }}>
                  {r.modified}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Kbd k="Tab" />filters</span>
          <span style={{ flex: 1 }} />
          <span>{results.length} {results.length === 1 ? "match" : "matches"}</span>
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const tl = text.toLowerCase();
  const ql = q.toLowerCase();

  // Find fuzzy-matched character positions
  const matched: number[] = [];
  let qi = 0;
  for (let ti = 0; ti < tl.length && qi < ql.length; ti++) {
    if (tl[ti] === ql[qi]) {
      matched.push(ti);
      qi++;
    }
  }
  if (matched.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const idx of matched) {
    if (idx > last) parts.push(text.slice(last, idx));
    parts.push(
      <mark
        key={idx}
        style={{
          background: "var(--accent-soft)",
          color: "var(--paper)",
          padding: "0 1px",
          borderRadius: 2,
        }}
      >
        {text[idx]}
      </mark>,
    );
    last = idx + 1;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
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
