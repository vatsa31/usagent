use crate::{
    providers::codex::CodexProvider,
    usage::{ProviderUsage, UsageProvider},
};

#[tauri::command]
pub async fn get_codex_usage() -> Result<ProviderUsage, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let provider = CodexProvider::discover()?;
        provider.fetch_usage()
    })
    .await
    .map_err(|error| format!("Codex usage task failed: {error}"))?
    .map_err(|error| error.to_string())
}
