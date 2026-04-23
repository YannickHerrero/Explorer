export interface FileNode {
  id: string;
  name: string;
  kind: FileKind;
  size?: string;
  modified?: string;
  children?: FileNode[];
  badge?: string;
  dims?: string;
  duration?: string;
  preview?: string;
}

export type FileKind =
  | "folder"
  | "image"
  | "doc"
  | "text"
  | "pdf"
  | "code"
  | "audio"
  | "video"
  | "archive"
  | "sheet";

export interface ThemeColors {
  name: string;
  paper: string;
  paperAlt: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  accent: string;
  accentSoft: string;
  shadow: string;
}

export type ThemeKey = "sage" | "paper" | "stone" | "clay" | "ink";

export interface DensityTokens {
  rowH: number;
  rowPad: number;
  colW: number;
  sidebarW: number;
  fontBody: number;
  fontMeta: number;
  gap: number;
}

export type DensityKey = "compact" | "comfortable" | "spacious";

export interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  targetPath?: string[];
  badge?: string;
  color?: string;
}

export interface Command {
  id: string;
  name: string;
  group: string;
  shortcut?: string[];
  icon: string;
}

export interface ShortcutGroup {
  group: string;
  items: { keys: string[]; desc: string }[];
}
