# Agentmon

Monorepo for the Usagent menu-bar app and its related web properties, managed with [Turborepo](https://turbo.build) and [pnpm workspaces](https://pnpm.io/workspaces).

## Repository layout

```
apps/
  usagent/   # Usagent - macOS menu-bar AI usage monitor (Tauri + React)
  landing/   # (coming soon) landing page
```

## Apps

### Usagent

A lightweight macOS menu-bar utility for keeping an eye on your local AI coding-agent usage limits.

It surfaces your usage from the agents you actually write code with. It reads data from each provider, normalizes it into a single model, and renders a compact per-provider quota view in a menu-bar popover - so you always know how much headroom you have left without opening a dashboard. See [`apps/usagent/README.md`](apps/usagent/README.md).

## Getting started

Requirements:

- macOS
- Node.js and pnpm
- Rust 1.85 or newer (for the Tauri app)

Install all workspace dependencies and build every app:

```sh
pnpm install
pnpm build
```

Target a single app with Turbo filters, e.g. `pnpm --filter @agentmon/usagent build` or, from the repo root, `pnpm build:app`.

## Development

Run the deterministic Rust tests for the Tauri app:

```sh
cd apps/usagent/src-tauri
cargo test
```

Run the opt-in live Codex retrieval test:

```sh
cd apps/usagent/src-tauri
cargo test retrieves_live_codex_usage -- --ignored --nocapture
```

If `codex` is not discoverable from the GUI environment, set `USAGENT_CODEX_BIN` to its absolute path. The legacy `AGENTMON_CODEX_BIN` variable is also supported.
