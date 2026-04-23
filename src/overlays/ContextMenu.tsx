import { useEffect } from "react";
import { Icon } from "@/icons/Icon";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRun: (item: { name: string }) => void;
}

const SECTIONS = [
  [
    { id: "open", name: "Open", kbd: ["Ctrl", "\u21B5"], icon: "folder-open" },
    { id: "ql", name: "Quick Look", kbd: ["\u2423"], icon: "eye" },
    { id: "term", name: "Open in Terminal", kbd: ["Ctrl", "'"], icon: "terminal" },
  ],
  [
    { id: "mv", name: "Move to\u2026", kbd: ["Alt+Ctrl", "M"], icon: "move" },
    { id: "dup", name: "Duplicate", kbd: ["Ctrl", "D"], icon: "copy" },
    { id: "ren", name: "Rename", kbd: ["\u21B5"], icon: "edit" },
    { id: "tag", name: "Add Tag", kbd: ["Ctrl", "T"], icon: "tag" },
  ],
  [
    { id: "cpy", name: "Copy", kbd: ["Ctrl", "C"], icon: "copy" },
    { id: "share", name: "Share", icon: "share" },
  ],
  [
    { id: "trash", name: "Move to Trash", kbd: ["Ctrl", "\u232B"], icon: "trash", danger: true },
  ],
];

export function ContextMenu({ x, y, onClose, onRun }: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      className="ctx-menu"
      style={{
        position: "fixed",
        top: y,
        left: x,
        minWidth: 240,
        background: "var(--paper-alt)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        boxShadow: "0 20px 50px rgba(var(--shadow), 0.28)",
        padding: 4,
        zIndex: 70,
      }}
    >
      {SECTIONS.map((sec, si) => (
        <div key={si}>
          {sec.map((item) => (
            <div
              key={item.id}
              onClick={() => { onRun(item); onClose(); }}
              className="ctx-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 10px",
                borderRadius: 5,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "danger" in item && item.danger ? "#C44536" : "var(--ink)",
              }}
            >
              <Icon
                name={item.icon}
                size={13}
                style={{ color: "danger" in item && item.danger ? "#C44536" : "var(--muted)" }}
              />
              <span style={{ flex: 1 }}>{item.name}</span>
              {"kbd" in item && item.kbd && (
                <span style={{ display: "inline-flex", gap: 2 }}>
                  {item.kbd.map((k, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--muted)",
                        minWidth: 14,
                        textAlign: "center",
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ))}
          {si < SECTIONS.length - 1 && (
            <div style={{ height: 1, background: "var(--line)", margin: "4px 6px" }} />
          )}
        </div>
      ))}
    </div>
  );
}
