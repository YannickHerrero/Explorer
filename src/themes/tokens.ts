import type { DensityTokens, DensityKey } from "@/types";

export const DENSITY: Record<DensityKey, DensityTokens> = {
  compact: {
    rowH: 26,
    rowPad: 8,
    colW: 240,
    sidebarW: 200,
    fontBody: 12.5,
    fontMeta: 10.5,
    gap: 4,
  },
  comfortable: {
    rowH: 34,
    rowPad: 12,
    colW: 280,
    sidebarW: 230,
    fontBody: 13.5,
    fontMeta: 11,
    gap: 6,
  },
  spacious: {
    rowH: 44,
    rowPad: 16,
    colW: 320,
    sidebarW: 260,
    fontBody: 14.5,
    fontMeta: 11.5,
    gap: 8,
  },
};
