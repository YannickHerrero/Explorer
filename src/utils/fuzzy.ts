/**
 * Fuzzy match: checks if all characters in `query` appear in order in `text`.
 * Returns a score (lower = better match) or null if no match.
 * Scoring favors consecutive matches and matches at word boundaries.
 */
export function fuzzyMatch(text: string, query: string): number | null {
  const tl = text.toLowerCase();
  const ql = query.toLowerCase();

  if (ql.length === 0) return 0;
  if (ql.length > tl.length) return null;

  let qi = 0;
  let score = 0;
  let lastMatchIdx = -1;

  for (let ti = 0; ti < tl.length && qi < ql.length; ti++) {
    if (tl[ti] === ql[qi]) {
      // Bonus for consecutive matches
      const gap = lastMatchIdx === -1 ? 0 : ti - lastMatchIdx - 1;
      score += gap;

      // Bonus for matching at start or after a word boundary
      if (ti === 0 || /[\s\-_/\\.]/.test(tl[ti - 1])) {
        score -= 2;
      }

      lastMatchIdx = ti;
      qi++;
    }
  }

  // All query chars matched?
  if (qi < ql.length) return null;

  return score;
}

/**
 * Filter and sort items by fuzzy match score.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
): T[] {
  if (!query.trim()) return items;

  const scored: { item: T; score: number }[] = [];
  for (const item of items) {
    const score = fuzzyMatch(getText(item), query);
    if (score !== null) {
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  return scored.map((s) => s.item);
}
