import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SidebarSection } from "@/types";

interface UserDirs {
  home: string;
  desktop: string | null;
  documents: string | null;
  downloads: string | null;
  pictures: string | null;
  music: string | null;
  videos: string | null;
}

function pathBasename(p: string): string {
  return p.split(/[/\\]/).filter(Boolean).pop() || p;
}

export function useSidebarDirs(): SidebarSection[] | null {
  const [sections, setSections] = useState<SidebarSection[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dirs = await invoke<UserDirs>("get_user_dirs");
        if (cancelled) return;

        const favorites: SidebarSection = {
          label: "Favorites",
          items: [
            { id: "home", name: pathBasename(dirs.home), icon: "home", diskPath: dirs.home },
          ],
        };
        if (dirs.desktop) {
          favorites.items.push({ id: "desktop", name: "Desktop", icon: "desktop", diskPath: dirs.desktop });
        }
        if (dirs.documents) {
          favorites.items.push({ id: "documents", name: "Documents", icon: "folder", diskPath: dirs.documents });
        }
        if (dirs.downloads) {
          favorites.items.push({ id: "downloads", name: "Downloads", icon: "folder", diskPath: dirs.downloads });
        }
        if (dirs.pictures) {
          favorites.items.push({ id: "pictures", name: "Pictures", icon: "folder", diskPath: dirs.pictures });
        }
        if (dirs.music) {
          favorites.items.push({ id: "music", name: "Music", icon: "folder", diskPath: dirs.music });
        }
        if (dirs.videos) {
          favorites.items.push({ id: "videos", name: "Videos", icon: "folder", diskPath: dirs.videos });
        }

        const tags: SidebarSection = {
          label: "Tags",
          items: [
            { id: "t-red", name: "Urgent", icon: "tag", color: "#C44536" },
            { id: "t-org", name: "Review", icon: "tag", color: "#D97706" },
            { id: "t-grn", name: "Done", icon: "tag", color: "#3F6B3A" },
            { id: "t-blu", name: "Reference", icon: "tag", color: "#4A6B8A" },
          ],
        };

        const trash: SidebarSection = {
          label: "",
          items: [
            { id: "trash", name: "Trash", icon: "trash" },
          ],
        };

        setSections([favorites, tags, trash]);
      } catch (e) {
        console.error("Failed to load user directories:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return sections;
}
