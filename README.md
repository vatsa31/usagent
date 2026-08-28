# AI Agent Usage Monitor

A lightweight macOS menu-bar utility for checking local AI coding-agent usage limits.

The first implemented provider is OpenAI Codex. Its Rust adapter starts the locally installed Codex app-server, reads structured rate-limit data, and returns only a normalized usage model across the Tauri IPC boundary.

## Development

Requirements:

- macOS
- Node.js and pnpm
- Rust 1.85 or newer
- an authenticated Codex CLI installation

Run deterministic tests:

```sh
cd src-tauri
cargo test
```

Run the opt-in live Codex retrieval test:

```sh
cd src-tauri
cargo test retrieves_live_codex_usage -- --ignored --nocapture
```

If `codex` is not discoverable from the GUI environment, set `AGENTMON_CODEX_BIN` to its absolute path.
