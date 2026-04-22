# Gloo

A lightweight macOS clipboard manager with a snippets library. Lives in your menu bar, stays out of your way.

## Features

- **Clipboard history** — automatically captures everything you copy, up to 50 items
- **Snippets manager** — save frequently used text with names and folders
- **Search** — filter across history and snippets instantly
- **Menu bar only** — no Dock icon, always available from the tray

## Stack

Built with [Tauri v2](https://tauri.app) (Rust + vanilla JS/CSS), [Vite](https://vitejs.dev), and SQLite for snippet persistence.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs)

### Setup

```bash
git clone https://github.com/toyblox/gloo
cd gloo
npm install
```

### Run

```bash
npm run tauri dev
```

### Test

```bash
npm test
```

### Build

```bash
npm run tauri build
```

## Roadmap

- [x] Global hotkey to open popup from anywhere (`Cmd+Shift+V`)
- [x] Click-to-paste (auto-pastes into active app)
- [x] Custom app icon
- [ ] Keyboard navigation
- [ ] Configurable history limit and hotkey
