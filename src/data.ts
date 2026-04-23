import type { FileNode } from "@/types";

export const TREE: FileNode = {
  id: "root",
  name: "maya",
  kind: "folder",
  children: [
    {
      id: "documents",
      name: "Documents",
      kind: "folder",
      children: [
        {
          id: "writing",
          name: "Writing",
          kind: "folder",
          children: [
            { id: "w1", name: "Field Notes — April.md", kind: "text", size: "12 KB", modified: "Apr 18, 2026" },
            { id: "w2", name: "On Slow Software.md", kind: "text", size: "8 KB", modified: "Apr 02, 2026" },
            { id: "w3", name: "Essays in Progress.md", kind: "text", size: "24 KB", modified: "Mar 28, 2026" },
            { id: "w4", name: "Quotes.txt", kind: "text", size: "3 KB", modified: "Feb 11, 2026" },
          ],
        },
        {
          id: "research",
          name: "Research",
          kind: "folder",
          children: [
            { id: "r1", name: "Taxonomy of Interfaces.pdf", kind: "pdf", size: "2.4 MB", modified: "Apr 14, 2026" },
            { id: "r2", name: "Bret Victor — Magic Ink.pdf", kind: "pdf", size: "4.1 MB", modified: "Mar 22, 2026" },
            { id: "r3", name: "citations.bib", kind: "code", size: "18 KB", modified: "Mar 22, 2026" },
            {
              id: "r4",
              name: "interview-transcripts",
              kind: "folder",
              children: [
                { id: "rt1", name: "session-01.txt", kind: "text", size: "44 KB", modified: "Feb 08, 2026" },
                { id: "rt2", name: "session-02.txt", kind: "text", size: "38 KB", modified: "Feb 09, 2026" },
              ],
            },
          ],
        },
        { id: "tax", name: "Tax Returns 2025.pdf", kind: "pdf", size: "1.2 MB", modified: "Jan 30, 2026" },
        { id: "lease", name: "Apartment Lease.pdf", kind: "pdf", size: "820 KB", modified: "Aug 15, 2025" },
        { id: "budget", name: "Budget 2026.numbers", kind: "sheet", size: "340 KB", modified: "Apr 01, 2026" },
      ],
    },
    {
      id: "projects",
      name: "Projects",
      kind: "folder",
      children: [
        {
          id: "explorer",
          name: "explorer-app",
          kind: "folder",
          badge: "git",
          children: [
            { id: "rdme", name: "README.md", kind: "text", size: "4 KB", modified: "Apr 22, 2026" },
            { id: "pkg", name: "package.json", kind: "code", size: "1 KB", modified: "Apr 22, 2026" },
            {
              id: "src",
              name: "src",
              kind: "folder",
              children: [
                { id: "s1", name: "App.tsx", kind: "code", size: "12 KB", modified: "Apr 22, 2026" },
                { id: "s2", name: "Column.tsx", kind: "code", size: "8 KB", modified: "Apr 21, 2026" },
                { id: "s3", name: "commands.ts", kind: "code", size: "3 KB", modified: "Apr 20, 2026" },
              ],
            },
            { id: "lic", name: "LICENSE", kind: "text", size: "1 KB", modified: "Apr 15, 2026" },
          ],
        },
        {
          id: "garden",
          name: "digital-garden",
          kind: "folder",
          children: [
            { id: "g1", name: "index.md", kind: "text", size: "2 KB", modified: "Apr 19, 2026" },
            {
              id: "g2",
              name: "notes",
              kind: "folder",
              children: [
                { id: "gn1", name: "attention.md", kind: "text", size: "6 KB", modified: "Apr 10, 2026" },
                { id: "gn2", name: "craft.md", kind: "text", size: "4 KB", modified: "Apr 07, 2026" },
              ],
            },
          ],
        },
        { id: "old", name: "archived-2024", kind: "archive", size: "142 MB", modified: "Dec 31, 2024" },
      ],
    },
    {
      id: "pictures",
      name: "Pictures",
      kind: "folder",
      children: [
        {
          id: "2026",
          name: "2026",
          kind: "folder",
          children: [
            {
              id: "april",
              name: "April",
              kind: "folder",
              children: [
                { id: "p1", name: "morning-fog.jpg", kind: "image", size: "3.2 MB", modified: "Apr 20, 2026", dims: "4032 × 3024", preview: "fog" },
                { id: "p2", name: "studio-desk.jpg", kind: "image", size: "2.8 MB", modified: "Apr 18, 2026", dims: "4032 × 3024", preview: "desk" },
                { id: "p3", name: "wildflowers.jpg", kind: "image", size: "4.1 MB", modified: "Apr 12, 2026", dims: "4032 × 3024", preview: "flora" },
                { id: "p4", name: "sketch-01.png", kind: "image", size: "1.2 MB", modified: "Apr 08, 2026", dims: "2048 × 2048", preview: "sketch" },
              ],
            },
            {
              id: "mar",
              name: "March",
              kind: "folder",
              children: [
                { id: "p5", name: "hillside.jpg", kind: "image", size: "3.8 MB", modified: "Mar 28, 2026", dims: "4032 × 3024", preview: "hill" },
              ],
            },
          ],
        },
        {
          id: "screenshots",
          name: "Screenshots",
          kind: "folder",
          children: [
            { id: "ss1", name: "CleanShot 2026-04-22 at 14.22.png", kind: "image", size: "480 KB", modified: "Apr 22, 2026", dims: "2880 × 1800", preview: "screen" },
            { id: "ss2", name: "CleanShot 2026-04-21 at 09.10.png", kind: "image", size: "520 KB", modified: "Apr 21, 2026", dims: "2880 × 1800", preview: "screen" },
          ],
        },
      ],
    },
    {
      id: "music",
      name: "Music",
      kind: "folder",
      children: [
        { id: "m1", name: "field-recording-forest.wav", kind: "audio", size: "48 MB", modified: "Apr 05, 2026", duration: "4:12" },
        { id: "m2", name: "practice-session.m4a", kind: "audio", size: "22 MB", modified: "Mar 30, 2026", duration: "18:44" },
      ],
    },
    {
      id: "downloads",
      name: "Downloads",
      kind: "folder",
      children: [
        { id: "d1", name: "invoice-0412.pdf", kind: "pdf", size: "240 KB", modified: "Apr 12, 2026" },
        { id: "d2", name: "receipt.pdf", kind: "pdf", size: "180 KB", modified: "Apr 10, 2026" },
        { id: "d3", name: "type-specimen.pdf", kind: "pdf", size: "6.2 MB", modified: "Apr 03, 2026" },
        { id: "d4", name: "IMG_8821.HEIC", kind: "image", size: "2.1 MB", modified: "Apr 02, 2026", preview: "heic" },
      ],
    },
    { id: "readme", name: "readme.txt", kind: "text", size: "1 KB", modified: "Jan 12, 2026" },
  ],
};

export function findNode(tree: FileNode, id: string): FileNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children || []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function resolveSelection(tree: FileNode, selection: string[]): FileNode {
  let node = tree;
  for (let i = 1; i < selection.length; i++) {
    const child = (node.children || []).find((c) => c.id === selection[i]);
    if (!child) break;
    node = child;
  }
  return node;
}

export function buildPathNames(tree: FileNode, selection: string[]): string[] {
  const out: string[] = [];
  let node = tree;
  out.push(node.name);
  for (let i = 1; i < selection.length; i++) {
    const child = (node.children || []).find((c) => c.id === selection[i]);
    if (!child) break;
    out.push(child.name);
    node = child;
  }
  return out;
}
