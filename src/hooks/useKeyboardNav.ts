import { useEffect, useCallback } from "react";
import { buildColumnsFromSelection } from "@/components/Columns";

interface KeyboardNavOptions {
  selection: string[];
  focusedCol: number;
  setFocusedCol: (col: number) => void;
  navigateTo: (sel: string[], focused?: number) => void;
  goBack: () => void;
  goFwd: () => void;
  overlaysOpen: boolean;
  onTogglePalette: () => void;
  onToggleSearch: () => void;
  onToggleSettings: () => void;
  onToggleCheatsheet: () => void;
  onToast: (msg: string) => void;
  onDismissOverlays: () => void;
}

export function useKeyboardNav({
  selection,
  focusedCol,
  setFocusedCol,
  navigateTo,
  goBack,
  goFwd,
  overlaysOpen,
  onTogglePalette,
  onToggleSearch,
  onToggleSettings,
  onToggleCheatsheet,
  onToast,
  onDismissOverlays,
}: KeyboardNavOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (e.key === "Escape") (target as HTMLInputElement).blur();
        return;
      }

      const meta = e.metaKey || e.ctrlKey;

      // Global shortcuts (work even with overlays)
      if (meta && e.key === "k") { e.preventDefault(); onTogglePalette(); return; }
      if (meta && e.key === "f") { e.preventDefault(); onToggleSearch(); return; }
      if (meta && e.key === ",") { e.preventDefault(); onToggleSettings(); return; }
      if (meta && e.key === "/") { e.preventDefault(); onToggleCheatsheet(); return; }

      if (e.key === "Escape") {
        onDismissOverlays();
        return;
      }

      // Don't navigate if overlay is open
      if (overlaysOpen) return;

      // History navigation
      if (meta && e.key === "[") { e.preventDefault(); goBack(); return; }
      if (meta && e.key === "]") { e.preventDefault(); goFwd(); return; }

      const columns = buildColumnsFromSelection(selection);
      const currentItems = columns[focusedCol]?.items || [];
      const currentSelectedId = selection[focusedCol + 1];
      const currentIdx = currentItems.findIndex((it) => it.id === currentSelectedId);

      // Arrow / hjkl navigation
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        const nextIdx = Math.min(currentItems.length - 1, currentIdx + 1);
        const nextItem = currentItems[nextIdx];
        if (nextItem) {
          navigateTo([...selection.slice(0, focusedCol + 1), nextItem.id], focusedCol);
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (currentItems.length === 0) return;
        const prevIdx = Math.max(0, currentIdx - 1);
        const prevItem = currentItems[prevIdx];
        if (prevItem) {
          navigateTo([...selection.slice(0, focusedCol + 1), prevItem.id], focusedCol);
        }
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
        }
      } else if (e.key === " ") {
        e.preventDefault();
        onToast("Quick Look");
      } else if (meta && e.key === "Backspace") {
        e.preventDefault();
        onToast("Moved to Trash");
      }
    },
    [
      selection,
      focusedCol,
      navigateTo,
      goBack,
      goFwd,
      overlaysOpen,
      onTogglePalette,
      onToggleSearch,
      onToggleSettings,
      onToggleCheatsheet,
      onToast,
      onDismissOverlays,
      setFocusedCol,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
