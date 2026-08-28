use tauri::AppHandle;

use crate::{
    providers::codex::CodexProvider,
    usage::{ProviderUsage, UsageProvider},
};

#[tauri::command]
pub async fn get_codex_usage(app: AppHandle) -> Result<ProviderUsage, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let provider = CodexProvider::discover()?;
        provider.fetch_usage()
    })
    .await
    .map_err(|error| format!("Codex usage task failed: {error}"))?
    .map_err(|error| error.to_string())
    .inspect(|usage| {
        update_tray_title(&app, usage);
    })
}

fn update_tray_title(app: &AppHandle, usage: &ProviderUsage) {
    let title = usage
        .limits
        .iter()
        .find(|limit| limit.id == "codex.primary")
        .map(|limit| format!("Cx {}", limit.remaining_percent))
        .unwrap_or_else(|| "Cx --".to_string());

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(Some(title));
        let _ = tray.set_tooltip(Some("Codex usage"));
    }
}
