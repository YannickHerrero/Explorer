import { useEffect, useRef, useCallback, useState, memo } from "react";
import { Icon, kindIcon } from "@/icons/Icon";
import { PreviewPane } from "@/components/PreviewPane";
import { resolveSelection } from "@/data";
import type { FileNode, DensityTokens } from "@/types";

interface ColumnsProps {
  tree: FileNode;
  selection: string[];
  onSelect: (colIdx: number, id: string) => void;
  onNavigate: (colIdx: number, item: FileNode) => void;
  density: DensityTokens;
  focusedCol: number;
  setFocusedCol: (col: number) => void;
  selectedDiskPath?: string;
  onOpenFile?: () => void;
  fileTags?: { name: string; color: string }[];
  previewOpen?: boolean;
  shouldShowRow?: (nodeId: string, kind: string) => boolean;
  getSourcePath?: (nodeId: string) => string | null;
  onDropOnFolder?: (sourcePath: string, destFolderId: string, mode: "move" | "copy") => void;
}

export const EXPLORER_DRAG_MIME = "application/x-explorer-source-path";

interface ColumnData {
  items: FileNode[];
}

export function buildColumnsFromSelection(selection: string[], tree: FileNode): ColumnData[] {
  const cols: ColumnData[] = [];
  let node = tree;
  cols.push({ items: node.children || [] });
  for (let i = 1; i < selection.length; i++) {
    const childId = selection[i];
    const child = (node.children || []).find((c) => c.id === childId);
    if (!child) break;
    node = child;
    if (child.kind === "folder" && child.children) {
      cols.push({ items: child.children });
    } else {
      break;
    }
  }
  return cols;
}

export function Columns({ tree, selection, onSelect, onNavigate, density, focusedCol, setFocusedCol, selectedDiskPath, onOpenFile, fileTags, previewOpen = true, shouldShowRow, getSourcePath, onDropOnFolder }: ColumnsProps) {
  const rawColumns = buildColumnsFromSelection(selection, tree);
  const columns = shouldShowRow
    ? rawColumns.map((c) => ({ items: c.items.filter((it) => shouldShowRow(it.id, it.kind)) }))
    : rawColumns;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [selection.length]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        overflowX: "auto",
        overflowY: "hidden",
        background: "var(--paper)",
        scrollBehavior: "smooth",
      }}
    >
      {columns.map((col, idx) => (
        <MemoColumn
          key={selection[idx] || `col-${idx}`}
          items={col.items}
          selectedId={selection[idx + 1]}
          onSelect={(id) => onSelect(idx, id)}
          onOpen={(item) => onNavigate(idx, item)}
          density={density}
          focused={focusedCol === idx}
          onFocus={() => setFocusedCol(idx)}
          width={density.colW}
          getSourcePath={getSourcePath}
          onDropOnFolder={onDropOnFolder}
        />
      ))}
      {previewOpen && (
        <PreviewPane
          node={resolveSelection(tree, selection)}
          density={density}
          width={Math.max(360, density.colW + 80)}
          diskPath={selectedDiskPath}
          onOpen={onOpenFile}
          fileTags={fileTags}
        />
      )}
    </div>
  );
}

const MemoColumn = memo(Column);

function Column({
  items,
  selectedId,
  onSelect,
  onOpen,
  density,
  focused,
  onFocus,
  width,
  getSourcePath,
  onDropOnFolder,
}: {
  items: FileNode[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onOpen: (item: FileNode) => void;
  density: DensityTokens;
  focused: boolean;
  onFocus: () => void;
  width: number;
  getSourcePath?: (id: string) => string | null;
  onDropOnFolder?: (sourcePath: string, destFolderId: string, mode: "move" | "copy") => void;
}) {
  const selectedRef = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return (
    <div
      onClick={onFocus}
      style={{
        width,
        flexShrink: 0,
        borderRight: "1px solid var(--line)",
        background: "var(--paper)",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "6px 0",
      }}
    >
      {items.length === 0 ? (
        <div
          style={{
            padding: 20,
            fontFamily: "var(--font-sans)",
            fontSize: 11.5,
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          Empty folder
        </div>
      ) : (
        items.map((item) => (
          <MemoFileRow
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            columnFocused={focused}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => onOpen(item)}
            density={density}
            scrollRef={item.id === selectedId ? selectedRef : undefined}
            getSourcePath={getSourcePath}
            onDropOnFolder={onDropOnFolder}
          />
        ))
      )}
    </div>
  );
}

const MemoFileRow = memo(FileRow);

function FileRow({
  item,
  selected,
  columnFocused,
  onClick,
  onDoubleClick,
  density,
  scrollRef,
  getSourcePath,
  onDropOnFolder,
}: {
  item: FileNode;
  selected: boolean;
  columnFocused: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  density: DensityTokens;
  scrollRef?: (node: HTMLDivElement | null) => void;
  getSourcePath?: (id: string) => string | null;
  onDropOnFolder?: (sourcePath: string, destFolderId: string, mode: "move" | "copy") => void;
}) {
  const isFolder = item.kind === "folder";
  const [dropActive, setDropActive] = useState(false);
  const selBg = dropActive
    ? "var(--paper-deep)"
    : selected ? (columnFocused ? "var(--accent)" : "var(--paper-deep)") : "transparent";
  const selFg = selected ? (columnFocused ? "var(--paper)" : "var(--ink)") : "var(--ink)";
  const iconColor = selected && columnFocused ? "var(--paper)" : "var(--muted)";
  const borderStyle = dropActive ? "1px dashed var(--accent)" : "1px solid transparent";

  return (
    <div
      ref={scrollRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="file-row"
      data-node-id={item.id}
      draggable={!!getSourcePath}
      onDragStart={(e) => {
        if (!getSourcePath) return;
        const src = getSourcePath(item.id);
        if (!src) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData(EXPLORER_DRAG_MIME, src);
        e.dataTransfer.effectAllowed = "copyMove";
      }}
      onDragOver={(e) => {
        if (!isFolder || !onDropOnFolder) return;
        if (!e.dataTransfer.types.includes(EXPLORER_DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey || e.metaKey ? "copy" : "move";
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => {
        if (!isFolder || !onDropOnFolder) return;
        const src = e.dataTransfer.getData(EXPLORER_DRAG_MIME);
        setDropActive(false);
        if (!src) return;
        e.preventDefault();
        onDropOnFolder(src, item.id, e.ctrlKey || e.metaKey ? "copy" : "move");
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: density.rowH,
        padding: `0 ${density.rowPad}px`,
        margin: `0 ${density.rowPad / 2}px`,
        borderRadius: 4,
        background: selBg,
        color: selFg,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: density.fontBody,
        userSelect: "none",
        border: borderStyle,
        boxSizing: "border-box",
      }}
    >
      <span style={{ color: iconColor, display: "inline-flex" }}>
        <Icon name={kindIcon(item.kind)} size={15} />
      </span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </span>
      {item.badge && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            color: selected && columnFocused ? "var(--paper)" : "var(--muted)",
            letterSpacing: 0.5,
            opacity: 0.8,
            border: `1px solid ${selected && columnFocused ? "var(--paper)" : "var(--line)"}`,
            padding: "1px 4px",
            borderRadius: 3,
          }}
        >
          {item.badge}
        </span>
      )}
      {isFolder && (
        <Icon
          name="chevron-right"
          size={11}
          style={{
            color: selected && columnFocused ? "var(--paper)" : "var(--muted)",
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}
