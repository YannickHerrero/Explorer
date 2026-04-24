# Explorer

A modern, keyboard-driven file explorer built with Tauri v2, React, and TypeScript. Designed for speed, simplicity, and cross-platform use.

![Explorer Demo](explorer-demo.png)

## Features

- **Column view** - macOS Finder-style column navigation
- **Keyboard-first** - Full keyboard navigation with arrow keys and vim bindings (`hjkl`, `y`/`x`/`p` for copy/cut/paste)
- **Command palette** - `Ctrl+K` for quick access to all actions
- **Folder palette** - `Ctrl+P` for instant folder navigation
- **Search** - `Ctrl+F` to search the current directory with filters
- **Tag system** - Color-coded tags with custom tag creation
- **5 themes** - Sage, Paper, Stone, Clay, and Ink (dark mode)
- **3 density levels** - Compact, Comfortable, and Spacious
- **Preview pane** - Image previews, file metadata, and quick actions
- **Cross-platform** - Windows, Linux, and macOS

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
# Install dependencies
bun install

# Run in development mode
bun tauri dev
```

### Building

```bash
# Build for production
bun tauri build
```

## Keyboard Shortcuts

### Navigation

| Key | Action |
|-----|--------|
| `←` `→` | Navigate between columns |
| `↑` `↓` | Move selection within column |
| `h` `j` `k` `l` | Vim-style navigation |
| `Ctrl+[` | Back |
| `Ctrl+]` | Forward |
| `Tab` | Cycle focus: sidebar, columns, preview |

### Actions

| Key | Action |
|-----|--------|
| `Space` | Quick Look (open file) |
| `Ctrl+Enter` | Open file |
| `Ctrl+C` / `y` | Copy |
| `Ctrl+X` / `x` | Cut |
| `Ctrl+V` / `p` | Paste |
| `Ctrl+Backspace` | Move to Trash |
| `Ctrl+T` | Add tag |
| `Ctrl+D` | Duplicate |
| `Enter` | Rename |

### Palettes & Overlays

| Key | Action |
|-----|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+P` | Go to folder |
| `Ctrl+F` | Search |
| `Ctrl+,` | Settings |
| `Ctrl+/` | Keyboard shortcuts |
| `Esc` | Dismiss |

## Project Structure

```
src/
  components/     UI components (Chrome, Columns, Sidebar, PreviewPane)
  overlays/       Modal overlays (CommandPalette, Settings, TagPicker, etc.)
  hooks/          React hooks (useKeyboardNav, useRealFileTree, useConfig)
  data/           Command definitions and mock data
  themes/         Theme and density token definitions
  icons/          SVG icon library
src-tauri/
  src/commands/   Rust backend commands (filesystem, config, init)
```

## License

MIT
