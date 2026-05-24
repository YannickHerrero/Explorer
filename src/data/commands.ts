import type { Command, ShortcutGroup } from "@/types";

export const COMMANDS: Command[] = [
  { id: "c-new-folder", name: "New Folder", group: "File", shortcut: ["Shift", "Ctrl", "N"], icon: "folder-plus" },
  { id: "c-new-file", name: "New File", group: "File", shortcut: ["Ctrl", "N"], icon: "file-plus" },
  { id: "c-duplicate", name: "Duplicate", group: "File", shortcut: ["Ctrl", "D"], icon: "copy" },
  { id: "c-rename", name: "Rename", group: "File", shortcut: ["Enter"], icon: "edit" },
  { id: "c-move", name: "Move to...", group: "File", shortcut: ["Alt", "Ctrl", "M"], icon: "move" },
  { id: "c-trash", name: "Move to Trash", group: "File", shortcut: ["Ctrl", "Del"], icon: "trash" },
  { id: "c-tag", name: "Add Tag...", group: "File", shortcut: ["Ctrl", "T"], icon: "tag" },
  { id: "c-copy", name: "Copy", group: "File", shortcut: ["Ctrl", "C"], icon: "copy" },
  { id: "c-cut", name: "Cut", group: "File", shortcut: ["Ctrl", "X"], icon: "move" },
  { id: "c-paste", name: "Paste", group: "File", shortcut: ["Ctrl", "V"], icon: "copy" },
  { id: "c-open-terminal", name: "Open in Terminal", group: "Open", shortcut: ["Ctrl", "'"], icon: "terminal" },
  { id: "c-open-editor", name: "Open in Editor", group: "Open", shortcut: ["Ctrl", "E"], icon: "code" },
  { id: "c-reveal", name: "Reveal in Enclosing Folder", group: "Open", shortcut: ["Ctrl", "R"], icon: "target" },
  { id: "c-quick-look", name: "Quick Look", group: "View", shortcut: ["Space"], icon: "eye" },
  { id: "c-toggle-sidebar", name: "Toggle Sidebar", group: "View", shortcut: ["Alt", "Ctrl", "S"], icon: "sidebar" },
  { id: "c-toggle-preview", name: "Toggle Preview", group: "View", shortcut: ["Shift", "Ctrl", "P"], icon: "panel" },
  { id: "c-hidden", name: "Show Hidden Files", group: "View", shortcut: ["Shift", "L"], icon: "eye" },
  { id: "c-settings", name: "Open Settings", group: "App", shortcut: ["Ctrl", ","], icon: "settings" },
  { id: "c-shortcuts", name: "Keyboard Shortcuts", group: "App", shortcut: ["Ctrl", "/"], icon: "keyboard" },
  { id: "c-theme-sage", name: "Theme: Sage", group: "Theme", icon: "swatch" },
  { id: "c-theme-paper", name: "Theme: Paper", group: "Theme", icon: "swatch" },
  { id: "c-theme-stone", name: "Theme: Stone", group: "Theme", icon: "swatch" },
  { id: "c-theme-clay", name: "Theme: Clay", group: "Theme", icon: "swatch" },
  { id: "c-theme-ink", name: "Theme: Ink", group: "Theme", icon: "swatch" },
];

export const SHORTCUTS: ShortcutGroup[] = [
  {
    group: "Navigation",
    items: [
      { keys: ["←", "→"], desc: "Navigate between columns" },
      { keys: ["↑", "↓"], desc: "Move selection within column" },
      { keys: ["h", "j", "k", "l"], desc: "Vim-style navigation" },
      { keys: ["Ctrl", "["], desc: "Back" },
      { keys: ["Ctrl", "]"], desc: "Forward" },
    ],
  },
  {
    group: "File",
    items: [
      { keys: ["Enter"], desc: "Rename" },
      { keys: ["Ctrl", "N"], desc: "New file" },
      { keys: ["Shift", "Ctrl", "N"], desc: "New folder" },
      { keys: ["Ctrl", "D"], desc: "Duplicate" },
      { keys: ["Ctrl", "Del"], desc: "Move to Trash" },
      { keys: ["Ctrl", "C"], desc: "Copy" },
      { keys: ["Ctrl", "V"], desc: "Paste" },
      { keys: ["Ctrl", "T"], desc: "Add tag" },
    ],
  },
  {
    group: "Open",
    items: [
      { keys: ["Ctrl", "Enter"], desc: "Open" },
      { keys: ["Space"], desc: "Quick Look" },
      { keys: ["Ctrl", "E"], desc: "Open in editor (notepad)" },
      { keys: ["Ctrl", "'"], desc: "Open in terminal (wt)" },
      { keys: ["Ctrl", "R"], desc: "Reveal in enclosing folder" },
    ],
  },
  {
    group: "Search & Palette",
    items: [
      { keys: ["Ctrl", "K"], desc: "Command palette" },
      { keys: ["Ctrl", "P"], desc: "Go to folder..." },
      { keys: ["Ctrl", "F"], desc: "Search current folder" },
      { keys: ["Esc"], desc: "Dismiss" },
    ],
  },
  {
    group: "View",
    items: [
      { keys: ["Alt", "Ctrl", "S"], desc: "Toggle sidebar" },
      { keys: ["Shift", "Ctrl", "P"], desc: "Toggle preview" },
      { keys: ["Shift", "L"], desc: "Show hidden" },
    ],
  },
  {
    group: "App",
    items: [
      { keys: ["Ctrl", ","], desc: "Settings" },
      { keys: ["Ctrl", "/"], desc: "This cheatsheet" },
    ],
  },
];
