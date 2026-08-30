use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use tauri::AppHandle;

use crate::{
    providers::{codex::CodexProvider, cursor::CursorProvider},
    usage::{ProviderUsage, UsageProvider},
};

#[derive(Default)]
pub struct UsageCache {
    inner: Mutex<HashMap<String, ProviderUsage>>,
}

impl UsageCache {
    pub fn store(&self, provider: &str, usage: ProviderUsage) {
        let mut cache = self
            .inner
            .lock()
            .expect("usage cache lock should not be poisoned");
        cache.insert(provider.to_string(), usage);
    }

    pub fn get(&self, provider: &str) -> Option<ProviderUsage> {
        self.inner
            .lock()
            .expect("usage cache lock should not be poisoned")
            .get(provider)
            .cloned()
    }
}

#[tauri::command]
pub async fn get_codex_usage(
    app: AppHandle,
    state: tauri::State<'_, Arc<UsageCache>>,
) -> Result<ProviderUsage, String> {
    let usage = tauri::async_runtime::spawn_blocking(|| {
        let provider = CodexProvider::discover()?;
        provider.fetch_usage()
    })
    .await
    .map_err(|error| format!("Codex usage task failed: {error}"))?
    .map_err(|error| error.to_string())?;

    state.store("codex", usage.clone());
    refresh_tray_title(&app, &state);
    Ok(usage)
}

#[tauri::command]
pub async fn get_cursor_usage(
    app: AppHandle,
    state: tauri::State<'_, Arc<UsageCache>>,
) -> Result<ProviderUsage, String> {
    let usage = tauri::async_runtime::spawn_blocking(|| {
        let provider = CursorProvider::discover()?;
        provider.fetch_usage()
    })
    .await
    .map_err(|error| format!("Cursor usage task failed: {error}"))?
    .map_err(|error| error.to_string())?;

    state.store("cursor", usage.clone());
    refresh_tray_title(&app, &state);
    Ok(usage)
}

#[tauri::command]
pub fn quit(app: AppHandle) {
    app.exit(0);
}

fn refresh_tray_title(app: &AppHandle, cache: &UsageCache) {
    let mut title_parts = Vec::new();
    let mut tooltip_parts = Vec::new();

    if let Some(usage) = cache.get("codex") {
        if let Some(limit) = usage
            .limits
            .iter()
            .find(|limit| limit.id == "codex.primary")
        {
            title_parts.push(format!("Cx {}", limit.remaining_percent));
        }
        tooltip_parts.push("Codex usage".to_string());
    }

    if let Some(usage) = cache.get("cursor") {
        if let Some(limit) = usage
            .limits
            .iter()
            .find(|limit| limit.id == "cursor.individual")
        {
            title_parts.push(format!("Cu {}", limit.remaining_percent));
        }
        tooltip_parts.push("Cursor usage".to_string());
    }

    let title = if title_parts.is_empty() {
        "Cx --".to_string()
    } else {
        title_parts.join(" · ")
    };

    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_title(Some(title));
        let _ = tray.set_tooltip(Some(tooltip_parts.join(" · ")));
    }
}
