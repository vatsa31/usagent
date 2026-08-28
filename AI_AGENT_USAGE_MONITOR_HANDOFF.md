# AI Agent Usage Monitor — Project Handoff

## Goal

Build a lightweight macOS menu-bar utility that shows usage / quota information for local AI coding agents and harnesses.

Initial providers:
- OpenAI Codex — personal subscription
- Cursor — company subscription

Primary motivation:
Avoid repeatedly typing `/usage` or `/status` in agent CLIs just to check remaining limits.

The app should eventually be provider-agnostic so additional agents such as Claude Code, Gemini CLI, Copilot, etc. can be added through adapters.

---

## Product Direction

### Primary surface

Start with a macOS menu-bar utility, not a notch UI.

Example menu-bar text:

`Cx 64 · Cu 38`

Where the values represent **percentage remaining** by default.

Clicking the menu-bar item should open a small popover with provider details, for example:

- Codex Personal
  - 5-hour window: 64% remaining
  - Weekly: 81% remaining
  - reset times

- Cursor Work
  - Cursor Models: 38% remaining
  - Other Models: 74% remaining
  - billing/reset information

Also show:
- last updated time
- stale-data indicator
- manual refresh
- settings

The app should have no Dock icon by default and should be able to launch at login.

---

## Technology Choice

Use **Tauri 2**.

Why:
- React + TypeScript for UI and application-facing logic
- Rust/Tauri core for native macOS / process / filesystem integration
- much lighter than Electron for an always-running menu-bar utility
- better fit for local CLI integration than a browser-only architecture
- keeps open the possibility of cross-platform support later

Do NOT rewrite the UI in Swift for v1.

---

## High-Level Architecture

macOS Menu Bar
    ↓
Tauri UI
React / TypeScript
    ↓
Normalized Usage Store
    ↓
Tauri IPC
    ↓
Rust Provider Registry
    ├── CodexProvider
    ├── CursorProvider
    ├── ClaudeProvider (later)
    └── GeminiProvider (later)
    ↓
Local CLI / files / first-party provider endpoints

The frontend should never need to know how a provider is authenticated or where its local credentials are stored.

---

## Responsibility Split

### Rust / Tauri Core

Own anything that requires local-system access:

- spawning local CLI processes
- communicating with Codex app-server
- reading provider-local files
- reading Cursor local application state if necessary
- local SQLite access
- filesystem watching
- native notifications
- macOS tray/menu-bar integration
- launch-at-login
- sleep/wake handling
- refresh scheduling
- credential/keychain interaction if ever required

Expose narrow, provider-oriented Tauri commands/events.

Good conceptual API:

- get_codex_usage
- get_cursor_usage
- refresh_all_usage

Avoid exposing generic commands such as:
- execute arbitrary shell command
- read arbitrary filesystem path

This keeps the IPC/security boundary intentional.

### React / TypeScript

Own:

- UI
- settings/preferences
- presentation logic
- usage normalization if convenient
- remaining percentage display
- reset countdowns
- quota pacing calculations
- stale/fresh status presentation
- menu-bar display preferences

Provider secrets or raw auth material must never be passed to the renderer.

---

## Provider Model

Providers should implement a common abstraction.

Conceptually:

UsageProvider
- CodexProvider
- CursorProvider
- ClaudeProvider
- GeminiProvider

Each provider produces a normalized usage snapshot.

Suggested conceptual model:

ProviderUsage
- provider
- account label
- observedAt
- source
- limits[]

UsageLimit
- id / name
- usedPercent
- remainingPercent
- resetAt
- windowDuration
- optional metadata

The UI should only consume this normalized representation.

---

## Codex Integration

Preferred direction:

Use the local Codex app-server / structured rate-limit mechanism rather than automating the interactive `/status` command.

Potential primary source:
- Codex app-server rate-limit API

Potential fallback:
- latest local Codex session / rollout JSONL containing rate-limit snapshots

Do not scrape terminal rendering unless there is no structured alternative.

The Codex adapter should be isolated so implementation can change if Codex changes its local protocol.

---

## Cursor Integration

Cursor exposes usage in its product/CLI, but its programmatic path may be less stable.

Likely approaches, in preference order:

1. supported structured Cursor CLI/API mechanism if available
2. Cursor's own authenticated usage endpoint using the already-existing local Cursor session
3. PTY/CLI automation of `/usage` only as a fallback

Important constraint:
The Cursor account is a **company account**.

Security rules:
- never copy/store the Cursor session token in this app's config
- never send credentials anywhere except Cursor itself
- read auth only when required
- keep credentials in the native/Rust side
- pass only normalized usage data to React
- make credential-access behavior obvious in documentation/settings

It may be useful later to support:

- Safe mode: no direct credential reading; use supported CLI integration only
- Direct mode: read local Cursor authentication and query first-party usage endpoint

---

## Refresh Model

The Rust/Tauri application core should own refresh scheduling.

Do not make React responsible for polling.

Suggested initial behavior:

- automatic refresh every 5 minutes
- refresh when menu/popover opens
- refresh after Mac wakes
- manual refresh button

The monitor should keep updating even when the popover UI is closed.

If a refresh fails:
- retain the last valid snapshot
- mark it as stale
- show how old it is
- do not replace valid data with empty values

---

## Menu-Bar Behavior

Default representation:

`Cx 64 · Cu 38`

Possible future display modes:

- remaining %
- used %
- lowest provider limit only
- icon-only above a configured threshold
- warning when a provider drops under 20% / 10%

Remaining percentage should be the initial default because the practical question is:
"How much usable quota do I have left?"

---

## Useful Future Feature: Quota Pacing

Do more than show a raw percentage.

Compare:

- quota remaining
- time remaining in the rate-limit window

Example:

Weekly usage:
- 61% quota remaining
- only 43% of the reset window remains
- user is therefore ahead of sustainable pace

Potential output:

`✓ 18% ahead of pace`

or:

`⚠ Usage is 1.7× sustainable pace`

Eventually estimate likely exhaustion time if usage continues at recent velocity.

This is a future feature, not part of the initial milestone.

---

## V1 Scope

Build only:

1. Tauri 2 macOS application
2. menu-bar/tray item
3. small popover
4. Codex provider
5. Cursor provider
6. normalized usage model
7. auto refresh
8. manual refresh
9. stale-data handling
10. launch-at-login eventually

Do NOT build yet:

- historical usage database
- charts
- notch UI
- cloud sync
- analytics
- accounts system
- backend/server
- many providers
- complicated settings

---

## First Milestone

The first useful end-to-end milestone is:

**Launch app → menu-bar item appears → Codex usage loads → Cursor usage loads → values refresh automatically → clicking the menu item shows detailed limits.**

Prioritize proving provider data acquisition before polishing the UI.

Recommended implementation order:

1. scaffold Tauri + React app
2. create a working macOS tray/menu-bar item
3. define normalized ProviderUsage types
4. implement CodexProvider
5. display Codex usage in the menu
6. implement CursorProvider
7. add refresh scheduler
8. add stale/error state handling
9. only then improve the UI

---

## Current Decision

Proceed with **Tauri**, not Electron and not Swift.

The next step is to inspect the current Tauri 2 APIs and the locally installed Codex/Cursor environment, scaffold the project, and prove the Codex usage integration first.

When making implementation decisions, preserve the provider abstraction and the narrow Rust ↔ frontend security boundary described above.
