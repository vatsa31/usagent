# Agentmon

Monorepo for the Usagent menu-bar app and its related web properties, managed with [Turborepo](https://turbo.build) and [pnpm workspaces](https://pnpm.io/workspaces).

## Repository layout

```
apps/
  usagent/      # Usagent - macOS menu-bar AI usage monitor (Tauri + React)
  usagent-land/ # useagent landing page (TanStack Start + React)
```

## Apps

### Usagent

A lightweight macOS menu-bar utility for keeping an eye on your local AI coding-agent usage limits.

It surfaces your usage from the agents you actually write code with. It reads data from each provider, normalizes it into a single model, and renders a compact per-provider quota view in a menu-bar popover - so you always know how much headroom you have left without opening a dashboard. See [`apps/usagent/README.md`](apps/usagent/README.md).

## Run from source

Usagent is a local-only menu-bar app: it reads usage from the Codex and Cursor installations on your own Mac, so there is no account, server, or installer to deal with. Clone the repo, install the prerequisites, and run it.

Requirements:

- macOS (Apple Silicon or Intel)
- [Node.js](https://nodejs.org) 20 or newer and [pnpm](https://pnpm.io/installation)
- [Rust](https://rustup.rs) 1.85 or newer
- Xcode Command Line Tools: `xcode-select --install`

Then:

```sh
git clone https://github.com/vatsa31/usagent.git
cd usagent
pnpm install
pnpm tauri dev
```

The first run compiles the Rust backend, which takes a few minutes. Afterwards a tray title like `Cx 64 · Cu 38` appears in the menu bar — click it to open the usage popover.

If `codex` is not discoverable from your GUI environment, set `USAGENT_CODEX_BIN` to its absolute path. The legacy `AGENTMON_CODEX_BIN` variable is also supported.

## Development

Build every app in the workspace from the repo root:

```sh
pnpm build
```

Target a single app with Turbo filters, e.g. `pnpm --filter @agentmon/usagent build` or, from the repo root, `pnpm build:app`.

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
