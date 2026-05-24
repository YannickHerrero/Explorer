import { useEffect, useRef } from "react";
import { buildColumnsFromSelection } from "@/components/Columns";
import type { FileNode } from "@/types";

interface KeyboardNavOptions {
  tree: FileNode;
  selection: string[];
  focusedCol: number;
  setFocusedCol: (col: number) => void;
  navigateTo: (sel: string[], focused?: number) => void;
  goBack: () => void;
  goFwd: () => void;
  overlaysOpen: boolean;
  onTogglePalette: () => void;
  onToggleFolderPalette: () => void;
  onToggleSearch: () => void;
  onToggleSettings: () => void;
  onToggleCheatsheet: () => void;
  onToggleSidebar: () => void;
  onDismissOverlays: () => void;
  onOpen: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onTrash: () => void;
  onToggleTagPicker: () => void;
  onToggleHidden: () => void;
  onTogglePreview: () => void;
  onRename: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onDuplicate: () => void;
  onOpenInEditor: () => void;
  onOpenInTerminal: () => void;
  vimNavigation: boolean;
  sidebarOpen: boolean;
  sidebarFocused: boolean;
  onEnterSidebar: () => void;
  onExitSidebar: () => void;
  onSidebarNav: (dir: "up" | "down") => void;
  onSidebarActivate: () => void;
}

export function useKeyboardNav(opts: KeyboardNavOptions) {
  // Store all options in a ref so the event handler is stable (never recreated)
  const ref = useRef(opts);
  ref.current = opts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const {
        tree,
        selection,
        focusedCol,
        setFocusedCol,
        navigateTo,
        goBack,
        goFwd,
        overlaysOpen,
        onTogglePalette,
        onToggleFolderPalette,
        onToggleSearch,
        onToggleSettings,
        onToggleCheatsheet,
        onToggleSidebar,
        onDismissOverlays,
        onOpen,
        onCopy,
        onCut,
        onPaste,
        onTrash,
        onToggleTagPicker,
        onToggleHidden,
        onTogglePreview,
        onRename,
        onNewFolder,
        onNewFile,
        onDuplicate,
        onOpenInEditor,
        onOpenInTerminal,
        vimNavigation,
        sidebarOpen,
        sidebarFocused,
        onEnterSidebar,
        onExitSidebar,
        onSidebarNav,
        onSidebarActivate,
      } = ref.current;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); onTogglePalette(); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); onTogglePreview(); return; }
      if (meta && !e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); onToggleFolderPalette(); return; }
      if (meta && e.key.toLowerCase() === "f") { e.preventDefault(); onToggleSearch(); return; }
      if (meta && e.key === ",") { e.preventDefault(); onToggleSettings(); return; }
      if (meta && e.key === "/") { e.preventDefault(); onToggleCheatsheet(); return; }
      if (meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") { e.preventDefault(); onToggleSidebar(); return; }

      if (e.key === "Escape") {
        if (overlaysOpen) onDismissOverlays();
        else if (sidebarFocused) onExitSidebar();
        return;
      }

      if (meta && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        onToggleHidden();
        return;
      }

      // Tab cycles sidebar ↔ columns.
      if (e.key === "Tab" && !e.shiftKey && !meta && !e.altKey) {
        e.preventDefault();
        if (sidebarFocused) onExitSidebar();
        else if (sidebarOpen) onEnterSidebar();
        return;
      }

      if (overlaysOpen) return;

      // Sidebar-focused mode: ignore column nav, route arrows/letters to sidebar handlers.
      if (sidebarFocused) {
        if (e.key === "ArrowDown" || e.key === "j") {
          e.preventDefault();
          onSidebarNav("down");
          return;
        }
        if (e.key === "ArrowUp" || e.key === "k") {
          e.preventDefault();
          onSidebarNav("up");
          return;
        }
        if (e.key === "Enter" || e.key === "ArrowRight" || e.key === "l") {
          e.preventDefault();
          onSidebarActivate();
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "h") {
          e.preventDefault();
          onExitSidebar();
          return;
        }
        // Swallow any other non-meta keys so they don't reach column nav.
        return;
      }

      if (meta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewFolder();
        return;
      }
      if (meta && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewFile();
        return;
      }

      if (meta && e.key === "[") { e.preventDefault(); goBack(); return; }
      if (meta && e.key === "]") { e.preventDefault(); goFwd(); return; }
      if (meta && e.key.toLowerCase() === "t") { e.preventDefault(); onToggleTagPicker(); return; }
      if (meta && e.key.toLowerCase() === "c") { e.preventDefault(); onCopy(); return; }
      if (meta && e.key.toLowerCase() === "x") { e.preventDefault(); onCut(); return; }
      if (meta && e.key.toLowerCase() === "v") { e.preventDefault(); onPaste(); return; }
      if (meta && e.key.toLowerCase() === "d") { e.preventDefault(); onDuplicate(); return; }
      if (meta && e.key.toLowerCase() === "e") { e.preventDefault(); onOpenInEditor(); return; }
      if (meta && e.key === "`") { e.preventDefault(); onOpenInTerminal(); return; }

      const columns = buildColumnsFromSelection(selection, tree);
      const currentItems = columns[focusedCol]?.items || [];
      const currentSelectedId = selection[focusedCol + 1];
      const currentIdx = currentItems.findIndex((it) => it.id === currentSelectedId);

      // R = rename works regardless of vim mode (it's the one bare-letter
      // shortcut we expose for non-vim users). All other bare letters are
      // gated behind vim mode.
      if (!meta && !e.altKey && !e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        onRename();
        return;
      }

      const isVimChar = (ch: string) => "hjklyxp".includes(ch);
      if (!vimNavigation && e.key.length === 1 && isVimChar(e.key)) return;

      const jumpTo = (idx: number) => {
        const target = currentItems[idx];
        if (!target) return;
        navigateTo([...selection.slice(0, focusedCol + 1), target.id], focusedCol);
      };

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(Math.min(currentItems.length - 1, currentIdx + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(Math.max(0, currentIdx - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(currentItems.length - 1);
      } else if (e.key === "PageDown") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(Math.min(currentItems.length - 1, currentIdx + 10));
      } else if (e.key === "PageUp") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        jumpTo(Math.max(0, currentIdx - 10));
      } else if (e.key === "ArrowRight" || e.key === "l") {
        e.preventDefault();
        const item = currentItems[currentIdx];
        if (item?.kind === "folder" && item.children) {
          const first = item.children[0];
          const newSel = [...selection.slice(0, focusedCol + 1), item.id];
          if (first) newSel.push(first.id);
          navigateTo(newSel, first ? focusedCol + 1 : focusedCol);
        }
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        e.preventDefault();
        if (focusedCol > 0) {
          setFocusedCol(focusedCol - 1);
          navigateTo(selection.slice(0, focusedCol + 1), focusedCol - 1);
        } else if (sidebarOpen) {
          onEnterSidebar();
        }
      } else if (e.key === " ") {
        e.preventDefault();
        onOpen();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onOpen();
      } else if (e.key === "y") {
        e.preventDefault();
        onCopy();
      } else if (e.key === "x") {
        e.preventDefault();
        onCut();
      } else if (e.key === "p") {
        e.preventDefault();
        onPaste();
      } else if (meta && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
        onTrash();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // Empty deps — handler is stable, reads from ref
}
