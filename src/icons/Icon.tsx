import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, strokeWidth = 1.5, style }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { flexShrink: 0, ...style },
  };

  switch (name) {
    case "folder":
      return <svg {...common}><path d="M1.5 4.5 A1 1 0 0 1 2.5 3.5 H6 L7.5 5 H13.5 A1 1 0 0 1 14.5 6 V12 A1 1 0 0 1 13.5 13 H2.5 A1 1 0 0 1 1.5 12 Z"/></svg>;
    case "folder-open":
      return <svg {...common}><path d="M1.5 5 H6 L7.5 3.5 H13.5 A1 1 0 0 1 14.5 4.5 V6 M1.5 5 V12 A1 1 0 0 0 2.5 13 H12 L14.5 7 H3.5 Z"/></svg>;
    case "folder-plus":
      return <svg {...common}><path d="M1.5 4.5 A1 1 0 0 1 2.5 3.5 H6 L7.5 5 H13.5 A1 1 0 0 1 14.5 6 V12 A1 1 0 0 1 13.5 13 H2.5 A1 1 0 0 1 1.5 12 Z"/><path d="M8 7.5 V10.5 M6.5 9 H9.5"/></svg>;
    case "file":
      return <svg {...common}><path d="M3.5 1.5 H9 L12.5 5 V13.5 A1 1 0 0 1 11.5 14.5 H3.5 A1 1 0 0 1 2.5 13.5 V2.5 A1 1 0 0 1 3.5 1.5 Z"/><path d="M9 1.5 V5 H12.5"/></svg>;
    case "file-plus":
      return <svg {...common}><path d="M3.5 1.5 H9 L12.5 5 V13.5 A1 1 0 0 1 11.5 14.5 H3.5 A1 1 0 0 1 2.5 13.5 V2.5 A1 1 0 0 1 3.5 1.5 Z"/><path d="M9 1.5 V5 H12.5"/><path d="M7.5 8.5 V12 M5.75 10.25 H9.25"/></svg>;
    case "doc":
    case "text":
      return <svg {...common}><path d="M3.5 1.5 H9 L12.5 5 V13.5 A1 1 0 0 1 11.5 14.5 H3.5 A1 1 0 0 1 2.5 13.5 V2.5 A1 1 0 0 1 3.5 1.5 Z"/><path d="M9 1.5 V5 H12.5"/><path d="M5 7.5 H10 M5 9.5 H10 M5 11.5 H8"/></svg>;
    case "pdf":
      return <svg {...common}><path d="M3.5 1.5 H9 L12.5 5 V13.5 A1 1 0 0 1 11.5 14.5 H3.5 A1 1 0 0 1 2.5 13.5 V2.5 A1 1 0 0 1 3.5 1.5 Z"/><path d="M9 1.5 V5 H12.5"/><text x="4.5" y="12" fontSize="3.6" fontFamily="ui-monospace,monospace" stroke="none" fill="currentColor" fontWeight="600">PDF</text></svg>;
    case "image":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><circle cx="5.5" cy="6.5" r="1.25"/><path d="M1.5 11.5 L5.5 8 L9 11 L11 9.5 L14.5 12.5"/></svg>;
    case "code":
      return <svg {...common}><path d="M3.5 1.5 H9 L12.5 5 V13.5 A1 1 0 0 1 11.5 14.5 H3.5 A1 1 0 0 1 2.5 13.5 V2.5 A1 1 0 0 1 3.5 1.5 Z"/><path d="M9 1.5 V5 H12.5"/><path d="M6.5 8 L5 9.5 L6.5 11 M9.5 8 L11 9.5 L9.5 11"/></svg>;
    case "audio":
      return <svg {...common}><path d="M3.5 10.5 V6.5 L9 5 V11" /><circle cx="2.25" cy="10.5" r="1.5"/><circle cx="7.75" cy="11" r="1.5"/><path d="M11 4 Q13 5.5 13 8 Q13 10.5 11 12"/></svg>;
    case "video":
      return <svg {...common}><rect x="1.5" y="3.5" width="10" height="9" rx="1"/><path d="M11.5 6.5 L14.5 4.5 V11.5 L11.5 9.5 Z"/></svg>;
    case "archive":
      return <svg {...common}><rect x="2" y="2.5" width="12" height="3" rx="0.5"/><rect x="2.5" y="5.5" width="11" height="8" rx="0.5"/><path d="M7 5.5 V8 H9 V5.5 M7 8 H9 V10 H7 Z"/></svg>;
    case "sheet":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M1.5 6 H14.5 M1.5 9.5 H14.5 M5.5 2.5 V13.5 M10 2.5 V13.5"/></svg>;
    case "home":
      return <svg {...common}><path d="M2 7 L8 2 L14 7 V13 A1 1 0 0 1 13 14 H3 A1 1 0 0 1 2 13 Z"/><path d="M6.5 14 V10 H9.5 V14"/></svg>;
    case "desktop":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="8.5" rx="0.5"/><path d="M5.5 14 H10.5 M8 11 V14"/></svg>;
    case "cloud":
      return <svg {...common}><path d="M4 12 A3 3 0 0 1 4 6 A4 4 0 0 1 11.5 6.5 A2.5 2.5 0 0 1 12 11.5 Z"/></svg>;
    case "dropbox":
      return <svg {...common}><path d="M4 3 L1.5 5 L4 7 L8 4.5 Z M12 3 L14.5 5 L12 7 L8 4.5 Z M4 7 L1.5 9 L4 11 L8 8.5 Z M12 7 L14.5 9 L12 11 L8 8.5 Z M5 12 L8 13.5 L11 12 L8 10 Z"/></svg>;
    case "gdrive":
      return <svg {...common}><path d="M5.5 2 H10.5 L14.5 9 L12 13.5 H4 L1.5 9 Z M5.5 2 L1.5 9 M10.5 2 L14.5 9 M4 13.5 L8 6.5 L12 13.5"/></svg>;
    case "share":
      return <svg {...common}><circle cx="12" cy="4" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="12" r="1.5"/><path d="M5.5 7 L10.5 4.5 M5.5 9 L10.5 11.5"/></svg>;
    case "laptop":
      return <svg {...common}><rect x="2.5" y="3" width="11" height="7" rx="0.5"/><path d="M1 11.5 H15 L14 13 H2 Z"/></svg>;
    case "drive":
      return <svg {...common}><rect x="1.5" y="3.5" width="13" height="9" rx="1"/><circle cx="12" cy="8" r="0.75" fill="currentColor"/><path d="M1.5 6.5 H14.5"/></svg>;
    case "usb":
      return <svg {...common}><rect x="3.5" y="2.5" width="9" height="6" rx="0.5"/><path d="M5 8.5 V11 A1 1 0 0 0 6 12 H10 A1 1 0 0 0 11 11 V8.5"/><path d="M8 12 V14.5"/><path d="M6 4.5 H7 M9 4.5 H10"/></svg>;
    case "trash":
      return <svg {...common}><path d="M2.5 4 H13.5 M6 4 V2.5 H10 V4 M3.5 4 V13 A1 1 0 0 0 4.5 14 H11.5 A1 1 0 0 0 12.5 13 V4"/><path d="M6.5 7 V11 M9.5 7 V11"/></svg>;
    case "tag":
      return <svg {...common}><path d="M2 2 H7 L14 9 L9 14 L2 7 Z"/><circle cx="5" cy="5" r="0.75" fill="currentColor"/></svg>;
    case "chevron-right":
      return <svg {...common}><path d="M6 4 L10 8 L6 12"/></svg>;
    case "chevron-down":
      return <svg {...common}><path d="M4 6 L8 10 L12 6"/></svg>;
    case "chevron-left":
      return <svg {...common}><path d="M10 4 L6 8 L10 12"/></svg>;
    case "chevron-up":
      return <svg {...common}><path d="M4 10 L8 6 L12 10"/></svg>;
    case "search":
      return <svg {...common}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 L14 14"/></svg>;
    case "settings":
      return <svg {...common}><circle cx="8" cy="8" r="2"/><path d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.2 3.2 L4.3 4.3 M11.7 11.7 L12.8 12.8 M3.2 12.8 L4.3 11.7 M11.7 4.3 L12.8 3.2"/></svg>;
    case "keyboard":
      return <svg {...common}><rect x="1.5" y="3.5" width="13" height="9" rx="1"/><path d="M3.5 6 H4 M5.5 6 H6 M7.5 6 H8 M9.5 6 H10 M11.5 6 H12 M3.5 8.5 H4 M5.5 8.5 H6 M7.5 8.5 H8 M9.5 8.5 H10 M11.5 8.5 H12 M5 10.5 H11"/></svg>;
    case "eye":
      return <svg {...common}><path d="M1.5 8 Q4.5 3.5 8 3.5 Q11.5 3.5 14.5 8 Q11.5 12.5 8 12.5 Q4.5 12.5 1.5 8 Z"/><circle cx="8" cy="8" r="2"/></svg>;
    case "sidebar":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M6 2.5 V13.5"/></svg>;
    case "panel":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M10 2.5 V13.5"/></svg>;
    case "terminal":
      return <svg {...common}><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M4 6 L6 8 L4 10 M7.5 10.5 H11"/></svg>;
    case "target":
      return <svg {...common}><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/><path d="M8 0.5 V2.5 M8 13.5 V15.5 M0.5 8 H2.5 M13.5 8 H15.5"/></svg>;
    case "copy":
      return <svg {...common}><rect x="4" y="4" width="9.5" height="9.5" rx="1"/><path d="M4 9 H2.5 A1 1 0 0 1 1.5 8 V2.5 A1 1 0 0 1 2.5 1.5 H8 A1 1 0 0 1 9 2.5 V4"/></svg>;
    case "edit":
      return <svg {...common}><path d="M2 14 L2 11.5 L10.5 3 L13 5.5 L4.5 14 Z M9 4.5 L11.5 7"/></svg>;
    case "move":
      return <svg {...common}><path d="M8 1.5 V14.5 M1.5 8 H14.5 M5 4.5 L8 1.5 L11 4.5 M5 11.5 L8 14.5 L11 11.5 M4.5 5 L1.5 8 L4.5 11 M11.5 5 L14.5 8 L11.5 11"/></svg>;
    case "swatch":
      return <svg {...common}><path d="M3 2.5 H6 V11 A1.5 1.5 0 1 1 3 11 Z M6 6.5 L9 3.5 L11 5.5 L8 8.5 M6 10.5 H13 A1.5 1.5 0 0 1 13 13.5 H6"/></svg>;
    case "plus":
      return <svg {...common}><path d="M8 3 V13 M3 8 H13"/></svg>;
    case "minus":
      return <svg {...common}><path d="M3 8 H13"/></svg>;
    case "close":
    case "x":
      return <svg {...common}><path d="M4 4 L12 12 M12 4 L4 12"/></svg>;
    case "check":
      return <svg {...common}><path d="M3 8.5 L6.5 12 L13 4"/></svg>;
    case "info":
      return <svg {...common}><circle cx="8" cy="8" r="6.5"/><path d="M8 7 V11.5 M8 4.5 V5"/></svg>;
    case "sort":
      return <svg {...common}><path d="M4 3 V13 M2 11 L4 13 L6 11 M12 3 V13 M10 5 L12 3 L14 5"/></svg>;
    case "filter":
      return <svg {...common}><path d="M2 3 H14 L10 8 V13 L6 11 V8 Z"/></svg>;
    case "star":
      return <svg {...common}><path d="M8 1.5 L10 5.5 L14.5 6.2 L11.25 9.4 L12 13.8 L8 11.75 L4 13.8 L4.75 9.4 L1.5 6.2 L6 5.5 Z"/></svg>;
    default:
      return <svg {...common}><rect x="2" y="2" width="12" height="12" rx="1"/></svg>;
  }
}

export function kindIcon(kind: string): string {
  const map: Record<string, string> = {
    folder: "folder",
    image: "image",
    doc: "doc",
    text: "text",
    pdf: "pdf",
    code: "code",
    audio: "audio",
    video: "video",
    archive: "archive",
    sheet: "sheet",
  };
  return map[kind] || "file";
}

interface KbdProps {
  k: string;
  muted?: boolean;
}

export function Kbd({ k, muted }: KbdProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 18,
        height: 18,
        padding: "0 4px",
        borderRadius: 4,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        fontWeight: 500,
        color: muted ? "var(--muted)" : "var(--ink-soft)",
        background: "var(--paper-deep)",
        border: "1px solid var(--line)",
        letterSpacing: 0,
        lineHeight: 1,
      }}
    >
      {k}
    </span>
  );
}

export function KbdRow({ keys, muted }: { keys: string[]; muted?: boolean }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {keys.map((k, i) => <Kbd key={i} k={k} muted={muted} />)}
    </span>
  );
}
