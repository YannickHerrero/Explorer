import { Icon, kindIcon } from "@/icons/Icon";
import type { FileNode } from "@/types";

interface StatusBarProps {
  node: FileNode | null;
  onSettings: () => void;
}

export function StatusBar({ node, onSettings }: StatusBarProps) {
  const isFolder = !node || node.kind === "folder";
  const summary = isFolder
    ? `${(node?.children || []).length} items`
    : `${node?.size || ""} · ${node?.modified || ""}`;

  return (
    <div
      style={{
        height: 26,
        borderTop: "1px solid var(--line)",
        background: "var(--paper-alt)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontFamily: "var(--font-sans)",
        fontSize: 10.5,
        color: "var(--muted)",
        flexShrink: 0,
        gap: 12,
      }}
    >
      <Icon name={isFolder ? "folder" : kindIcon(node?.kind || "file")} size={11} />
      <span>{summary}</span>
      <span style={{ flex: 1 }} />
      <button
        onClick={onSettings}
        style={{
          background: "none",
          border: "none",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 10.5,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "var(--font-sans)",
        }}
      >
        <Icon name="settings" size={10} /> <span>Ctrl+,</span>
      </button>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <Icon name="keyboard" size={10} /> <span>Ctrl+/</span>
      </span>
    </div>
  );
}
