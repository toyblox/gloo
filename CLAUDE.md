# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run in dev mode (compiles Rust + serves frontend with hot reload)
source $HOME/.cargo/env && npm run tauri dev

# Build for production
source $HOME/.cargo/env && npm run tauri build

# Run tests (pure logic only — no Tauri runtime needed)
npm test

# Run tests in watch mode
npm run test:watch

# Add a Tauri plugin (run from repo root)
source $HOME/.cargo/env && npm run tauri add <plugin-name>
```

Rust is not on PATH by default — always `source $HOME/.cargo/env` before any `cargo` or `npm run tauri` command.

## Architecture

This is a Tauri v2 app. The two halves communicate via a message-passing bridge:

- **`src/`** — vanilla JS frontend. No bundler. Files are served directly from disk in dev and embedded in the binary in production. `src/index.html` is the entry point.
- **`src-tauri/src/lib.rs`** — all Rust backend logic lives here. `main.rs` just calls `lib.rs::run()`.
- **`src-tauri/tauri.conf.json`** — controls window config, app identity, bundle targets, and which Tauri plugins are active.
- **`src-tauri/capabilities/default.json`** — permission allowlist. Every Tauri plugin capability must be listed here before it can be called from the frontend.

### JS ↔ Rust bridge

**JS calling Rust:**
```js
const { invoke } = window.__TAURI__.core;
const result = await invoke("command_name", { argName: value });
```

**Rust commands** are functions in `lib.rs` decorated with `#[tauri::command]` and registered in `invoke_handler`:
```rust
#[tauri::command]
fn my_command(arg: &str) -> String { ... }

// registered in run():
.invoke_handler(tauri::generate_handler![my_command])
```

**Rust emitting events to JS:**
```rust
app_handle.emit("event-name", payload).unwrap();
```
```js
const { listen } = window.__TAURI__.event;
await listen("event-name", (event) => { ... });
```

### Adding plugins

Plugins provide OS-level capabilities (clipboard, global shortcuts, SQL, tray). After `npm run tauri add <plugin>`:
1. The plugin is added to `Cargo.toml` and initialized in `lib.rs`
2. Add the plugin's permission identifier to `src-tauri/capabilities/default.json`
3. Install the JS bindings if the plugin has them: `npm install @tauri-apps/plugin-<name>`

### Renaming the app

Update `productName`/`identifier` in `tauri.conf.json`, `name` in `src-tauri/Cargo.toml`, and `name` in `package.json`. Replace placeholder icons in `src-tauri/icons/` with your own (need `.icns`, `.ico`, and multiple `.png` sizes).

### Planned plugins

- `clipboard-manager` — clipboard read/write and change monitoring
- `sql` — SQLite persistence for clipboard history and snippets
- `global-shortcut` — system-wide hotkey to toggle the popup
- `tray-icon` — menu bar presence (no Dock icon)
