# Usagent

A lightweight macOS menu-bar utility for keeping an eye on your local AI coding-agent usage limits.

Usagent reads data from each provider, normalizes it into a single model, and renders a compact per-provider quota view in a menu-bar popover — so you always know how much headroom you have left without opening a dashboard.

This is one app within the `agentmon` monorepo. See the [repo root README](../README.md) for workspace-level setup and commands.

## Providers

- **Codex (OpenAI)** — reads structured rate-limit data from your local Codex installation. Reads are cheap and local, so it's polled in the background.
- **Cursor** — the menu bar also shows your Cursor plan usage.
- More providers can be added behind the same normalized interface. Currently supports an individual usage view plus a collective-only team pool figure (never per-member).

> **Cursor provider disclosure.** Cursor plan usage is read from an **unofficial, internal endpoint** (`api2.cursor.sh`) using the session token stored locally by the Cursor app. This is an undocumented, unsupported interface — it is not part of Cursor's public API, may change or break without notice, and is provided for your own convenience only. It is not affiliated with, endorsed by, or warranted by Cursor. Please review Cursor's terms of service before using it.

## Behavior

The app runs as a macOS menu-bar accessory.

- Click the tray title to toggle the usage popover. **Refresh** and **Quit** are buttons inside the popover.
- The popover has a tab per provider and hides when it loses focus.
- Usage is refreshed on launch, when the popover opens, and on demand via the Refresh button.
- Codex usage re-polls every three minutes in the background since it reads local data.
- Cursor usage is fetched on demand (popover open / manual refresh) and is throttled, since fetching it hits Cursor's remote API. Manual refresh always fetches fresh data.
- Failed background refreshes use exponential backoff up to 30 minutes; overlapping refreshes are skipped.

## Security

- Provider credentials are read in the Rust (native) side and never stored in the app's config.
- Only normalized usage numbers cross the IPC boundary to the UI — raw responses and tokens never reach the renderer.

## Development

From the monorepo root, work with this app via its package scope:

```sh
pnpm --filter @agentmon/usagent dev     # Vite dev server (frontend)
pnpm --filter @agentmon/usagent build   # typecheck + build frontend
pnpm --filter @agentmon/usagent tauri   # run the Tauri CLI
```

Run the deterministic Rust tests:

```sh
cd src-tauri
cargo test
```

Run the opt-in live Codex retrieval test:

```sh
cd src-tauri
cargo test retrieves_live_codex_usage -- --ignored --nocapture
```

The app bar shows the `Cx`/`Cu` combined usage (e.g. `Cx 64 · Cu 38`) as the tray title. If `codex` is not discoverable from the GUI environment, set `USAGENT_CODEX_BIN` to its absolute path. The legacy `AGENTMON_CODEX_BIN` variable is also supported.
