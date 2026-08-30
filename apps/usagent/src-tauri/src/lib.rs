mod commands;
mod providers;
mod usage;

use std::sync::Arc;

use commands::UsageCache;
use tauri::{
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_positioner::{Position, WindowExt};

fn show_popover(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // An accessory (menu-bar-only) app cannot hold application focus, so
        // macOS immediately resigns focus from any window we show — which the
        // blur-to-hide handler would then dismiss instantly. Switch to the
        // Regular policy while the popover is open so it can stay frontmost.
        #[cfg(target_os = "macos")]
        let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

        let _ = window.move_window_constrained(Position::TrayBottomCenter);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("popover-opened", ());
    }
}

fn hide_popover(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
        #[cfg(target_os = "macos")]
        let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
    }
}

fn toggle_popover(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            hide_popover(app);
        } else {
            show_popover(app);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .manage(Arc::new(UsageCache::default()))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory)?;
                app.handle().set_dock_visibility(false)?;
            }

            // Note: the tray is intentionally built without an attached menu.
            // On macOS an attached menu makes AppKit intercept every mouse
            // event on the status item, so `on_tray_icon_event` never fires
            // and the left-click popover stops working. Refresh/Quit live in
            // the popover UI instead.
            TrayIconBuilder::with_id("main")
                .icon(Image::from_bytes(include_bytes!(
                    "../icons/usagent-tray-template.png"
                ))?)
                // Render the status item as a monochrome template image on macOS so it
                // remains visible in both light and dark menu bars.
                .icon_as_template(true)
                .title("Cx --")
                .tooltip("Codex usage")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_popover(tray.app_handle());
                    }
                })
                .build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
                let window_for_listener = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::Focused(false) = event {
                        hide_popover(&window_for_listener.app_handle());
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_codex_usage,
            commands::get_cursor_usage,
            commands::quit
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}