# Explorer

A keyboard-driven file explorer for Windows, built with Tauri v2, React, and TypeScript.

![Explorer Demo](explorer-demo.png)

## Installation

Download the latest Windows installer from the [Releases](https://github.com/YannickHerrero/Explorer/releases/latest) page and run `Explorer_x64-setup.exe`.

## Features

- **Column view** — macOS Finder-style hierarchical columns
- **Keyboard-first** — Full keyboard navigation; optional Vim bindings (`hjkl` + `y`/`x`/`p`)
- **File operations** — Rename, new file/folder, duplicate, move to trash, copy / cut / paste
- **Drag and drop** — Move files between columns or onto pinned sidebar folders
- **Search** — Recursive `walkdir`-based search across the current folder or home
- **Preview pane** — Real text, code, image, audio, video, and PDF preview
- **Tag system** — Color-coded tags; click a tag in the sidebar to filter
- **Quick open** — Open files in Notepad (`Ctrl+E`) or the current folder in Windows Terminal (`` Ctrl+` ``)
- **Pinned folders** — Right-click any folder in the sidebar to pin it to Favorites
- **WSL & drives** — All mounted drives and WSL distros surface automatically in the sidebar
- **Themes & density** — 5 themes (Sage, Paper, Stone, Clay, Ink dark) × 3 densities (Compact / Comfortable / Spacious)
- **Toggleable preview** — `Ctrl+Shift+P`
- **Show hidden files** — `Ctrl+H`
- **Auto-update** — Manual check from Settings; updates fetched from GitHub releases

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop framework | [Tauri v2](https://v2.tauri.app) |
| Frontend | [React 19](https://react.dev) + TypeScript |
| Build tool | [Vite 7](https://vite.dev) |
| Backend | Rust |
| Fonts | IBM Plex Sans, Newsreader, JetBrains Mono |

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs) (stable)
- [Bun](https://bun.sh) or Node.js 18+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
bun install
bun tauri dev
```

### Building a Windows release from WSL

```bash
make install   # cross-compile to x86_64-pc-windows-gnu and install the .exe
```

See `Makefile` for the individual targets.

## Keyboard Shortcuts

### Navigation

| Key | Action |
|-----|--------|
| `←` `→` | Navigate between columns |
| `↑` `↓` | Move selection within column |
| `Home` `End` | First / last item in column |
| `PgUp` `PgDn` | Jump 10 items at a time |
| `Ctrl+[` | Back |
| `Ctrl+]` | Forward |

### File operations

| Key | Action |
|-----|--------|
| `Enter` | Open |
| `Space` | Quick Look |
| `R` | Rename |
| `Ctrl+N` | New file |
| `Ctrl+Shift+N` | New folder |
| `Ctrl+D` | Duplicate |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | Copy / Cut / Paste |
| `Ctrl+Del` or `Ctrl+Backspace` | Move to Trash |
| `Ctrl+T` | Add tag |

### Open in…

| Key | Action |
|-----|--------|
| `Ctrl+E` | Open file in Notepad |
| `` Ctrl+` `` | Open folder in Windows Terminal |

### Palettes & overlays

| Key | Action |
|-----|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+P` | Go to folder |
| `Ctrl+F` | Search |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+Shift+P` | Toggle preview pane |
| `Ctrl+H` | Toggle hidden files |
| `Ctrl+,` | Settings |
| `Ctrl+/` | Keyboard shortcuts |
| `Esc` | Dismiss |

### Vim mode (Settings → Keyboard)

When enabled, the following bare-letter shortcuts are active:

| Key | Action |
|-----|--------|
| `h` `j` `k` `l` | Left / down / up / right |
| `y` | Yank (copy) |
| `x` | Cut |
| `p` | Paste |

## Project Structure

```
src/
  components/     UI components (Chrome, Columns, Sidebar, PreviewPane, StatusBar)
  overlays/       Modal overlays (CommandPalette, SearchOverlay, Settings, TagPicker, PromptModal, Cheatsheet, ContextMenu, FolderPalette)
  hooks/          React hooks (useKeyboardNav, useRealFileTree, useConfig, useInit, useTheme, useSidebarDirs)
  data/           Command and shortcut catalog
  themes/         Theme and density token definitions
  icons/          SVG icon library
src-tauri/
  src/commands/   Rust backend (fs operations, search, config, init)
```

## License

MIT
