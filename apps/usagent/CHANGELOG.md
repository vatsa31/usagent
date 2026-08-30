# @agentmon/usagent

## 0.2.3

### Patch Changes

- 630e782: docs: refresh behavior notes in app README (popover buttons, not tray menu)

## 0.2.2

### Patch Changes

- 15cc145: Fix the macOS menu-bar popover not opening when clicking the tray icon.

  On macOS 27 AppKit stopped delivering mouse events to the tray's click view
  when a menu is attached: clicks open the menu and `on_tray_icon_event`
  never fires, so the left-click popover can't open (the behavior differs on
  macOS 26, where an attached menu still works alongside the popover). For a
  single code path that behaves reliably on both, the tray is now built
  without a native menu and Refresh/Quit move into the popover UI.

  While the popover is open the app also switches to a focusable activation
  policy so macOS does not immediately resign focus and blur-to-hide closes
  it instantly.

## 0.2.1

### Patch Changes

- 01606c8: Fix the source label shown on capacity sections so it reflects the actual provider instead of always reading "cursor dashboard api" even when Codex usage is being viewed.
