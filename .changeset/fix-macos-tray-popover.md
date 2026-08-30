---
"@agentmon/usagent": patch
---

Fix the macOS menu-bar popover so it actually opens: the tray is built without an attached menu (AppKit swallows all status-item mouse events when a menu is attached, so the left-click popover never fired), and the popover now switches the app to a focusable activation policy while open so it does not close instantly. Refresh/Quit move into the popover UI.