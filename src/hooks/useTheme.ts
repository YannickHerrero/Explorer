import { useState, useEffect } from "react";
import type { ThemeKey, DensityKey } from "@/types";
import { THEMES } from "@/themes";

export function useTheme(initialTheme: ThemeKey = "sage") {
  const [themeKey, setThemeKey] = useState<ThemeKey>(initialTheme);
  const theme = THEMES[themeKey];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--paper", theme.paper);
    root.style.setProperty("--paper-alt", theme.paperAlt);
    root.style.setProperty("--paper-deep", theme.paperDeep);
    root.style.setProperty("--ink", theme.ink);
    root.style.setProperty("--ink-soft", theme.inkSoft);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--line", theme.line);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", theme.accentSoft);
    root.style.setProperty("--shadow", theme.shadow);
    root.style.setProperty("--font-serif", "'Newsreader', 'Georgia', serif");
    root.style.setProperty("--font-sans", "'IBM Plex Sans', -apple-system, sans-serif");
    root.style.setProperty("--font-mono", "'JetBrains Mono', ui-monospace, monospace");
  }, [theme]);

  return { themeKey, setThemeKey, theme };
}

export function useDensity(initialDensity: DensityKey = "comfortable") {
  const [densityKey, setDensityKey] = useState<DensityKey>(initialDensity);
  return { densityKey, setDensityKey };
}
