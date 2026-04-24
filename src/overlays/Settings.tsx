import { useState } from "react";
import { Icon } from "@/icons/Icon";
import { THEMES } from "@/themes";
import type { ThemeKey, DensityKey, ThemeColors } from "@/types";

interface TagDef {
  id: string;
  name: string;
  color: string;
}

interface SettingsProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  density: DensityKey;
  setDensity: (d: DensityKey) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  hideTitlebar: boolean;
  setHideTitlebar: (v: boolean) => void;
  tags?: TagDef[];
  onAddTag?: (tag: TagDef) => void;
  onRemoveTag?: (tagId: string) => void;
  onUpdateTag?: (tagId: string, updates: Partial<TagDef>) => void;
}

export function Settings({
  open,
  onClose,
  theme,
  setTheme,
  density,
  setDensity,
  sidebarOpen,
  setSidebarOpen,
  hideTitlebar,
  setHideTitlebar,
  tags,
  onAddTag,
  onRemoveTag,
  onUpdateTag,
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState("General");
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(var(--shadow), 0.35)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 780,
          maxWidth: "94%",
          height: 560,
          maxHeight: "90%",
          background: "var(--paper)",
          borderRadius: 10,
          border: "1px solid var(--line)",
          boxShadow: "0 30px 80px rgba(var(--shadow), 0.3)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Settings sidebar */}
        <div
          style={{
            width: 180,
            background: "var(--paper-alt)",
            borderRight: "1px solid var(--line)",
            padding: "18px 10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              color: "var(--ink)",
              fontWeight: 500,
              padding: "0 10px 14px",
              letterSpacing: -0.2,
            }}
          >
            Settings
          </div>
          {(
            [
              ["General", "settings"],
              ["Tags", "tag"],
            ] as [string, string][]
          ).map(([label, icon]) => {
            const active = activeTab === label;
            return (
              <div
                key={label}
                onClick={() => setActiveTab(label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 5,
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--paper)" : "var(--ink-soft)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12.5,
                  cursor: "pointer",
                  marginBottom: 1,
                }}
              >
                <Icon name={icon} size={13} />
                <span>{label}</span>
              </div>
            );
          })}
          <div style={{ flex: 1 }} />
          <div
            style={{
              padding: "10px 10px 0",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--muted)",
            }}
          >
            v0.1.0
          </div>
        </div>

        {/* Settings content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 30px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
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
                {activeTab}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {activeTab === "General" ? "Appearance, density, and keyboard behaviour" : "Manage file tags and colors"}
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

          {activeTab === "General" ? (
            <>
              <Section title="Theme" subtitle="Five quiet palettes for day and night work.">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  {(Object.entries(THEMES) as [ThemeKey, ThemeColors][]).map(([key, t]) => (
                    <ThemeCard key={key} theme={t} active={theme === key} onClick={() => setTheme(key)} />
                  ))}
                </div>
              </Section>

              <Section title="Density" subtitle="How much breathing room each row gets.">
                <SegmentedRow
                  value={density}
                  onChange={(v) => setDensity(v as DensityKey)}
                  options={[
                    { v: "compact", l: "Compact" },
                    { v: "comfortable", l: "Comfortable" },
                    { v: "spacious", l: "Spacious" },
                  ]}
                />
              </Section>

              <Section title="Sidebar" subtitle="Devices, favorites, cloud drives, and trash.">
                <Toggle value={sidebarOpen} onChange={setSidebarOpen} label={sidebarOpen ? "Visible" : "Hidden"} />
              </Section>

              <Section title="Window" subtitle="Control the native window appearance.">
                <Toggle value={hideTitlebar} onChange={setHideTitlebar} label="Hide native title bar" />
              </Section>

              <Section title="Keyboard" subtitle="Explorer is keyboard-first. Press Ctrl+/ anywhere for the full map.">
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <SettingsRow label="Show shortcut hints on hover" value={true} />
                  <SettingsRow label="Use Vim-style navigation (hjkl)" value={false} />
                  <SettingsRow label="Quick-find on any keystroke" value={true} />
                </div>
              </Section>
            </>
          ) : activeTab === "Tags" ? (
            <TagsTab tags={tags || []} onAddTag={onAddTag} onRemoveTag={onRemoveTag} onUpdateTag={onUpdateTag} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--ink)", fontWeight: 600, letterSpacing: -0.1 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--muted)", marginTop: 2, marginBottom: 10 }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

function ThemeCard({ theme, active, onClick }: { theme: ThemeColors; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: 0,
        border: active ? `2px solid ${theme.accent}` : `1px solid var(--line)`,
        borderRadius: 7,
        background: theme.paper,
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ height: 60, background: theme.paper, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 4, width: "60%", background: theme.ink, borderRadius: 1, opacity: 0.9 }} />
        <div style={{ height: 3, width: "80%", background: theme.inkSoft, borderRadius: 1, opacity: 0.5 }} />
        <div style={{ height: 3, width: "50%", background: theme.inkSoft, borderRadius: 1, opacity: 0.5 }} />
        <div style={{ marginTop: "auto", display: "flex", gap: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.accent }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.paperDeep, border: `1px solid ${theme.line}` }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.muted }} />
        </div>
      </div>
      <div
        style={{
          padding: "6px 8px 7px",
          background: theme.paperAlt,
          borderTop: `1px solid ${theme.line}`,
          fontFamily: "var(--font-serif)",
          fontSize: 12,
          color: theme.ink,
          fontWeight: 500,
          letterSpacing: -0.1,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {active && <span style={{ width: 5, height: 5, borderRadius: "50%", background: theme.accent }} />}
        {theme.name}
      </div>
    </button>
  );
}

function SegmentedRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 6, background: "var(--paper-alt)", padding: 2 }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "6px 14px",
            border: "none",
            borderRadius: 4,
            background: value === o.v ? "var(--accent)" : "transparent",
            color: value === o.v ? "var(--paper)" : "var(--ink-soft)",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: value === o.v ? 500 : 400,
            cursor: "pointer",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 38,
          height: 22,
          borderRadius: 11,
          border: "1px solid var(--line)",
          background: value ? "var(--accent)" : "var(--paper-deep)",
          position: "relative",
          cursor: "pointer",
          transition: "background 160ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: value ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--paper)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transition: "left 160ms",
          }}
        />
      </button>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-soft)" }}>{label}</span>
    </div>
  );
}

function SettingsRow({ label, value }: { label: string; value: boolean }) {
  const [v, setV] = useState(value);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-soft)" }}>{label}</span>
      <Toggle value={v} onChange={setV} label="" />
    </div>
  );
}

const TAG_COLORS = [
  "#C44536", "#D97706", "#3F6B3A", "#4A6B8A",
  "#7C3AED", "#DB2777", "#059669", "#6366F1",
  "#B45309", "#64748B",
];

function TagsTab({
  tags,
  onAddTag,
  onRemoveTag,
  onUpdateTag,
}: {
  tags: TagDef[];
  onAddTag?: (tag: TagDef) => void;
  onRemoveTag?: (tagId: string) => void;
  onUpdateTag?: (tagId: string, updates: Partial<TagDef>) => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name || !onAddTag) return;
    const id = `t-${Date.now()}`;
    onAddTag({ id, name, color: newColor });
    setNewName("");
  };

  return (
    <div>
      <Section title="Your Tags" subtitle="Tags help you organize and find files quickly.">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: tag.color,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (!onUpdateTag) return;
                  const idx = TAG_COLORS.indexOf(tag.color);
                  const next = TAG_COLORS[(idx + 1) % TAG_COLORS.length];
                  onUpdateTag(tag.id, { color: next });
                }}
              />
              {editingId === tag.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    if (editName.trim() && onUpdateTag) {
                      onUpdateTag(tag.id, { name: editName.trim() });
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (editName.trim() && onUpdateTag) {
                        onUpdateTag(tag.id, { name: editName.trim() });
                      }
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    border: "1px solid var(--accent)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontFamily: "var(--font-sans)",
                    fontSize: 12.5,
                    color: "var(--ink)",
                    background: "var(--paper)",
                    outline: "none",
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: 12.5,
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setEditingId(tag.id);
                    setEditName(tag.name);
                  }}
                >
                  {tag.name}
                </span>
              )}
              <button
                onClick={() => onRemoveTag?.(tag.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--muted)",
                  cursor: "pointer",
                  padding: 4,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Icon name="x" size={11} />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Add New Tag">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c,
                  border: newColor === c ? "2px solid var(--ink)" : "2px solid transparent",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Tag name..."
            style={{
              flex: 1,
              border: "1px solid var(--line)",
              borderRadius: 5,
              padding: "6px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--ink)",
              background: "var(--paper)",
              outline: "none",
            }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 5,
              background: newName.trim() ? "var(--accent)" : "var(--paper-deep)",
              color: newName.trim() ? "var(--paper)" : "var(--muted)",
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 500,
              cursor: newName.trim() ? "pointer" : "default",
            }}
          >
            Add
          </button>
        </div>
      </Section>
    </div>
  );
}
