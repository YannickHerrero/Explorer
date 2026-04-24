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
  { id: "c-hidden", name: "Show Hidden Files", group: "View", shortcut: ["Shift", "Ctrl", "."], icon: "eye" },
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
      { keys: ["Ctrl", "↑"], desc: "Go to parent folder" },
      { keys: ["Ctrl", "↓"], desc: "Open selected item" },
      { keys: ["Ctrl", "["], desc: "Back" },
      { keys: ["Ctrl", "]"], desc: "Forward" },
      { keys: ["Tab"], desc: "Cycle focus: sidebar → columns → preview" },
    ],
  },
  {
    group: "Selection",
    items: [
      { keys: ["Ctrl", "A"], desc: "Select all" },
      { keys: ["Shift", "↑↓"], desc: "Extend selection" },
      { keys: ["Ctrl", "Click"], desc: "Multi-select" },
      { keys: ["Space"], desc: "Quick Look" },
    ],
  },
  {
    group: "Actions",
    items: [
      { keys: ["Enter"], desc: "Rename" },
      { keys: ["Ctrl", "Enter"], desc: "Open" },
      { keys: ["Ctrl", "Del"], desc: "Move to Trash" },
      { keys: ["Ctrl", "C"], desc: "Copy" },
      { keys: ["Ctrl", "V"], desc: "Paste" },
      { keys: ["Ctrl", "Alt", "V"], desc: "Move here" },
      { keys: ["Ctrl", "D"], desc: "Duplicate" },
      { keys: ["Ctrl", "T"], desc: "Add tag" },
    ],
  },
  {
    group: "Search & Palette",
    items: [
      { keys: ["Ctrl", "K"], desc: "Command palette" },
      { keys: ["Ctrl", "F"], desc: "Search current folder" },
      { keys: ["Ctrl", "Shift", "F"], desc: "Search everywhere" },
      { keys: ["/"], desc: "Quick find" },
      { keys: ["Esc"], desc: "Dismiss" },
    ],
  },
  {
    group: "View",
    items: [
      { keys: ["Ctrl", "1"], desc: "Icon view" },
      { keys: ["Ctrl", "2"], desc: "List view" },
      { keys: ["Ctrl", "3"], desc: "Column view" },
      { keys: ["Ctrl", "4"], desc: "Gallery view" },
      { keys: ["Alt", "Ctrl", "S"], desc: "Toggle sidebar" },
      { keys: ["Shift", "Ctrl", "P"], desc: "Toggle preview" },
      { keys: ["Shift", "Ctrl", "."], desc: "Show hidden" },
    ],
  },
  {
    group: "App",
    items: [
      { keys: ["Ctrl", ","], desc: "Settings" },
      { keys: ["Ctrl", "/"], desc: "This cheatsheet" },
      { keys: ["Ctrl", "N"], desc: "New window" },
      { keys: ["Ctrl", "W"], desc: "Close window" },
    ],
  },
];
