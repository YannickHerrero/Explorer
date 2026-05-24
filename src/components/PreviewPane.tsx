import { useState, useEffect } from "react";
import { Icon, kindIcon, Kbd } from "@/icons/Icon";
import type { FileNode, DensityTokens } from "@/types";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

function useAssetUrl(diskPath?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    if (!diskPath || !IS_TAURI) { setUrl(diskPath); return; }
    import("@tauri-apps/api/core").then(({ convertFileSrc }) => {
      setUrl(convertFileSrc(diskPath));
    });
  }, [diskPath]);
  return url;
}

interface PreviewPaneProps {
  node: FileNode;
  density: DensityTokens;
  width: number;
  diskPath?: string;
  onOpen?: () => void;
  fileTags?: { name: string; color: string }[];
}

export function PreviewPane({ node, width, diskPath, onOpen, fileTags }: PreviewPaneProps) {
  if (node.kind === "folder") {
    return (
      <div
        style={{
          width,
          flexShrink: 0,
          background: "var(--paper-alt)",
          padding: "24px 22px",
          overflowY: "auto",
        }}
      >
        <FolderPreview node={node} />
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        background: "var(--paper-alt)",
        padding: "22px 22px 26px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <FilePreview node={node} diskPath={diskPath} onOpen={onOpen} fileTags={fileTags} />
    </div>
  );
}

function FolderPreview({ node }: { node: FileNode }) {
  const children = node.children || [];
  const folders = children.filter((c) => c.kind === "folder").length;
  const files = children.length - folders;

  return (
    <div>
      <div
        style={{
          width: "100%",
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--paper-deep)",
          borderRadius: 4,
          marginBottom: 14,
          color: "var(--muted)",
        }}
      >
        <Icon name="folder-open" size={64} strokeWidth={1} />
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 20,
          fontWeight: 500,
          color: "var(--ink)",
          marginBottom: 2,
          letterSpacing: -0.3,
        }}
      >
        {node.name}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 16,
        }}
      >
        Folder
      </div>
      <MetaList
        items={[
          ["Contents", `${folders} folders · ${files} files`],
          ["Size", "\u2014"],
          ["Created", "Jan 12, 2026"],
          ["Modified", "Apr 22, 2026"],
          ["Kind", "Folder"],
        ]}
      />
    </div>
  );
}

function FilePreview({ node, diskPath, onOpen, fileTags }: { node: FileNode; diskPath?: string; onOpen?: () => void; fileTags?: { name: string; color: string }[] }) {
  const isImage = node.kind === "image";
  const assetUrl = useAssetUrl(isImage ? diskPath : undefined);

  return (
    <>
      <div style={{ marginBottom: 2 }}>
        {isImage && assetUrl ? (
          <img
            src={assetUrl}
            alt={node.name}
            style={{
              width: "100%",
              maxHeight: 220,
              objectFit: "contain",
              borderRadius: 3,
              border: "1px solid var(--line)",
              background: "var(--paper-deep)",
            }}
          />
        ) : isImage ? (
          <Thumb label={`image \u2014 ${node.dims || "preview"}`} h={220} tone={node.preview} />
        ) : node.kind === "pdf" ? (
          <PdfPreview diskPath={diskPath} />
        ) : node.kind === "text" || node.kind === "code" ? (
          <TextPreview node={node} diskPath={diskPath} />
        ) : node.kind === "audio" ? (
          <AudioPreview diskPath={diskPath} />
        ) : node.kind === "video" ? (
          <VideoPreview diskPath={diskPath} />
        ) : (
          <div
            style={{
              height: 200,
              background: "var(--paper-deep)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
            }}
          >
            <Icon name={kindIcon(node.kind)} size={56} strokeWidth={1} />
          </div>
        )}
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 19,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: -0.3,
            lineHeight: 1.25,
            marginBottom: 2,
            wordBreak: "break-word",
          }}
        >
          {node.name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {kindLabel(node.kind)} · {node.size || "\u2014"}
        </div>
      </div>

      <MetaList items={buildMeta(node)} />

      {fileTags && fileTags.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {fileTags.map((tag) => (
            <span
              key={tag.name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px 3px 6px",
                borderRadius: 4,
                border: "1px solid var(--line)",
                background: "var(--paper-deep)",
                fontFamily: "var(--font-sans)",
                fontSize: 11,
                color: "var(--ink-soft)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: tag.color,
                  flexShrink: 0,
                }}
              />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <PreviewBtn icon="eye" label="Quick Look" kbd={["Space"]} onClick={onOpen} />
        <PreviewBtn icon="folder-open" label="Open" kbd={["Ctrl", "Enter"]} onClick={onOpen} />
      </div>
    </>
  );
}

function kindLabel(k: string): string {
  const map: Record<string, string> = {
    image: "Image",
    pdf: "PDF Document",
    text: "Plain Text",
    doc: "Document",
    code: "Source Code",
    audio: "Audio",
    video: "Video",
    archive: "Archive",
    sheet: "Spreadsheet",
    folder: "Folder",
  };
  return map[k] || "File";
}

function buildMeta(node: FileNode): [string, string][] {
  const base: [string, string][] = [
    ["Kind", kindLabel(node.kind)],
    ["Size", node.size || "\u2014"],
    ["Modified", node.modified || "\u2014"],
  ];
  if (node.dims) base.splice(2, 0, ["Dimensions", node.dims]);
  if (node.duration) base.splice(2, 0, ["Duration", node.duration]);
  base.push(["Where", "~/projects/..."]);
  return base;
}

function MetaList({ items }: { items: [string, string][] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr",
        columnGap: 10,
        rowGap: 4,
        paddingTop: 12,
        borderTop: "1px solid var(--line)",
      }}
    >
      {items.map(([k, v], i) => (
        <div key={i} style={{ display: "contents" }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 11,
              color: "var(--muted)",
              textAlign: "right",
              paddingTop: 1,
            }}
          >
            {k}
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-soft)" }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewBtn({ icon, label, kbd, onClick }: { icon: string; label: string; kbd?: string[]; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px 5px 8px",
        height: 26,
        borderRadius: 5,
        border: "1px solid var(--line)",
        background: "var(--paper)",
        color: "var(--ink-soft)",
        fontFamily: "var(--font-sans)",
        fontSize: 11.5,
        cursor: "pointer",
      }}
    >
      <Icon name={icon} size={12} />
      <span>{label}</span>
      {kbd && (
        <span style={{ display: "inline-flex", gap: 1, marginLeft: 2 }}>
          {kbd.map((k, i) => (
            <Kbd key={i} k={k} muted />
          ))}
        </span>
      )}
    </button>
  );
}

function Thumb({ label, h, tone }: { label: string; h: number; tone?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: h,
        background: "var(--paper-deep)",
        borderRadius: 3,
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.25 }}
      >
        <defs>
          <pattern
            id={`stripe-${tone}`}
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#stripe-${tone})`} />
      </svg>
      <div
        style={{
          position: "relative",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--muted)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function PdfPreview({ diskPath }: { diskPath?: string }) {
  const url = useAssetUrl(diskPath);
  if (!url) {
    return (
      <div
        style={{
          height: 320,
          background: "var(--paper-deep)",
          border: "1px solid var(--line)",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
        }}
      >
        <Icon name="file" size={56} strokeWidth={1} />
      </div>
    );
  }
  return (
    <iframe
      src={url}
      title="PDF preview"
      style={{
        width: "100%",
        height: 360,
        border: "1px solid var(--line)",
        borderRadius: 4,
        background: "var(--paper)",
      }}
    />
  );
}

function TextPreview({ node, diskPath }: { node: FileNode; diskPath?: string }) {
  const isCode = node.kind === "code";
  const [content, setContent] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!diskPath || !IS_TAURI) {
      setContent(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setContent(null);
    setError(null);
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const head = await invoke<{ content: string; truncated: boolean }>("read_file_head", {
          path: diskPath,
          maxBytes: 64 * 1024,
        });
        if (cancelled) return;
        setContent(head.content);
        setTruncated(head.truncated);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [diskPath]);

  return (
    <div
      style={{
        height: 260,
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <pre
        style={{
          flex: 1,
          margin: 0,
          padding: "12px 14px",
          fontFamily: isCode ? "var(--font-mono)" : "var(--font-serif)",
          fontSize: isCode ? 11 : 12.5,
          lineHeight: 1.55,
          color: "var(--ink)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {error ? `(${error})` : content ?? "Loading\u2026"}
      </pre>
      {truncated && (
        <div
          style={{
            padding: "4px 10px",
            borderTop: "1px solid var(--line)",
            background: "var(--paper-deep)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted)",
          }}
        >
          Truncated \u00b7 showing first 64 KB
        </div>
      )}
    </div>
  );
}

function VideoPreview({ diskPath }: { diskPath?: string }) {
  const url = useAssetUrl(diskPath);
  return (
    <div
      style={{
        background: "var(--paper-deep)",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid var(--line)",
      }}
    >
      {url ? (
        <video
          controls
          preload="metadata"
          src={url}
          style={{ width: "100%", maxHeight: 260, display: "block" }}
        />
      ) : (
        <div
          style={{
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)",
          }}
        >
          <Icon name="video" size={56} strokeWidth={1} />
        </div>
      )}
    </div>
  );
}

function AudioPreview({ diskPath }: { diskPath?: string }) {
  const url = useAssetUrl(diskPath);
  return (
    <div
      style={{
        height: 220,
        background: "var(--paper-deep)",
        borderRadius: 4,
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {url ? (
        <audio
          controls
          src={url}
          style={{ width: "100%" }}
        />
      ) : (
        <Icon name="music" size={56} strokeWidth={1} style={{ color: "var(--muted)" }} />
      )}
    </div>
  );
}
