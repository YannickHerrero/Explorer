import { useEffect } from "react";
import { Icon } from "@/icons/Icon";

interface MenuItem {
  id: string;
  name: string;
  kbd?: string[];
  icon: string;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRun: (item: MenuItem) => void;
  isFolder?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export function ContextMenu({ x, y, onClose, onRun, isFolder, isPinned, onTogglePin }: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onClose]);

  const sections: MenuItem[][] = [
    [
      { id: "open", name: "Open", kbd: ["Ctrl", "Enter"], icon: "folder-open" },
      { id: "ql", name: "Quick Look", kbd: ["Space"], icon: "eye" },
      { id: "term", name: "Open in Terminal", kbd: ["Ctrl", "'"], icon: "terminal" },
    ],
  ];

  // Pin/unpin for folders
  if (isFolder && onTogglePin) {
    sections.push([
      {
        id: "toggle-pin",
        name: isPinned ? "Remove from Favorites" : "Add to Favorites",
        icon: isPinned ? "minus" : "star",
      },
    ]);
  }

  sections.push([
    { id: "mv", name: "Move to...", kbd: ["Alt+Ctrl", "M"], icon: "move" },
    { id: "dup", name: "Duplicate", kbd: ["Ctrl", "D"], icon: "copy" },
    { id: "ren", name: "Rename", kbd: ["Enter"], icon: "edit" },
    { id: "tag", name: "Add Tag", kbd: ["Ctrl", "T"], icon: "tag" },
  ]);

  sections.push([
    { id: "cpy", name: "Copy", kbd: ["Ctrl", "C"], icon: "copy" },
    { id: "share", name: "Share", icon: "share" },
  ]);

  sections.push([
    { id: "trash", name: "Move to Trash", kbd: ["Ctrl", "Del"], icon: "trash", danger: true },
  ]);

  const handleClick = (item: MenuItem) => {
    if (item.id === "toggle-pin" && onTogglePin) {
      onTogglePin();
      onClose();
    } else {
      onRun(item);
      onClose();
    }
  };

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
      {sections.map((sec, si) => (
        <div key={si}>
          {sec.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
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
                color: item.danger ? "#C44536" : "var(--ink)",
              }}
            >
              <Icon
                name={item.icon}
                size={13}
                style={{ color: item.danger ? "#C44536" : "var(--muted)" }}
              />
              <span style={{ flex: 1 }}>{item.name}</span>
              {item.kbd && (
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
          {si < sections.length - 1 && (
            <div style={{ height: 1, background: "var(--line)", margin: "4px 6px" }} />
          )}
        </div>
      ))}
    </div>
  );
}
