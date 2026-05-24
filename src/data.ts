import type { FileNode } from "@/types";

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
