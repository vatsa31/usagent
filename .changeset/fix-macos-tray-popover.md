---
"@agentmon/usagent": patch
---

Fix the macOS menu-bar popover not opening when clicking the tray icon.

On macOS 27 AppKit stopped delivering mouse events to the tray's click view
when a menu is attached: clicks open the menu and `on_tray_icon_event`
never fires, so the left-click popover can't open (the behavior differs on
macOS 26, where an attached menu still works alongside the popover). For a
single code path that behaves reliably on both, the tray is now built
without a native menu and Refresh/Quit move into the popover UI.

While the popover is open the app also switches to a focusable activation
policy so macOS does not immediately resign focus and blur-to-hide closes
it instantly.