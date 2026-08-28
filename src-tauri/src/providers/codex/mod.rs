mod app_server;
mod protocol;

use std::{
    collections::BTreeMap,
    env, fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

use serde_json::json;

use crate::usage::{ProviderError, ProviderUsage, UsageLimit, UsageProvider, UsageSource};
use app_server::AppServerSession;
use protocol::{GetAccountRateLimitsResponse, RateLimitSnapshot, RateLimitWindow};

const CODEX_BINARY_ENV: &str = "USAGENT_CODEX_BIN";
const LEGACY_CODEX_BINARY_ENV: &str = "AGENTMON_CODEX_BIN";

pub struct CodexProvider {
    binary: PathBuf,
}

impl CodexProvider {
    pub fn discover() -> Result<Self, ProviderError> {
        discover_codex_binary()
            .map(|binary| Self { binary })
            .ok_or_else(|| {
                ProviderError::new(
                    "Could not find the Codex CLI. Set USAGENT_CODEX_BIN to its absolute path.",
                )
            })
    }

    #[cfg(test)]
    fn with_binary(binary: PathBuf) -> Self {
        Self { binary }
    }
}

impl UsageProvider for CodexProvider {
    fn fetch_usage(&self) -> Result<ProviderUsage, ProviderError> {
        let mut session = AppServerSession::start(&self.binary)?;
        session.initialize()?;
        let response = session.read_rate_limits()?;
        normalize(response)
    }
}

fn discover_codex_binary() -> Option<PathBuf> {
    if let Some(path) = env::var_os(CODEX_BINARY_ENV)
        .or_else(|| env::var_os(LEGACY_CODEX_BINARY_ENV))
        .map(PathBuf::from)
    {
        if is_executable_file(&path) {
            return Some(path);
        }
    }

    if let Some(path) = env::var_os("PATH").and_then(|path| {
        env::split_paths(&path)
            .map(|directory| directory.join("codex"))
            .find(|candidate| is_executable_file(candidate))
    }) {
        return Some(path);
    }

    let mut candidates = Vec::new();
    if let Some(home) = env::var_os("HOME").map(PathBuf::from) {
        candidates.push(home.join(".vite-plus/bin/codex"));
        candidates.push(home.join(".local/bin/codex"));
    }
    candidates.push(PathBuf::from("/opt/homebrew/bin/codex"));
    candidates.push(PathBuf::from("/usr/local/bin/codex"));

    candidates
        .into_iter()
        .find(|candidate| is_executable_file(candidate))
}

fn is_executable_file(path: &Path) -> bool {
    let Ok(metadata) = fs::metadata(path) else {
        return false;
    };

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        metadata.is_file() && metadata.permissions().mode() & 0o111 != 0
    }

    #[cfg(not(unix))]
    metadata.is_file()
}

fn normalize(response: GetAccountRateLimitsResponse) -> Result<ProviderUsage, ProviderError> {
    let snapshots = response
        .rate_limits_by_limit_id
        .filter(|snapshots| !snapshots.is_empty())
        .unwrap_or_else(|| {
            let id = response
                .rate_limits
                .limit_id
                .clone()
                .unwrap_or_else(|| "codex".to_string());
            BTreeMap::from([(id, response.rate_limits)])
        });

    let account_label = snapshots
        .get("codex")
        .or_else(|| snapshots.values().next())
        .and_then(|snapshot| snapshot.plan_type.as_deref())
        .map(format_plan_label);

    let mut limits = Vec::new();
    for (bucket_id, snapshot) in snapshots {
        if let Some(window) = snapshot.primary.as_ref() {
            limits.push(normalize_window(&bucket_id, &snapshot, "primary", window));
        }
        if let Some(window) = snapshot.secondary.as_ref() {
            limits.push(normalize_window(&bucket_id, &snapshot, "secondary", window));
        }
    }

    if limits.is_empty() {
        return Err(ProviderError::new(
            "Codex returned a rate-limit response without any usage windows.",
        ));
    }

    limits.sort_by_key(|limit| {
        (
            !limit.id.starts_with("codex."),
            limit.window_duration_minutes.unwrap_or(u64::MAX),
            limit.id.clone(),
        )
    });

    let observed_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| ProviderError::new(error.to_string()))?
        .as_secs() as i64;

    Ok(ProviderUsage {
        provider: "codex".to_string(),
        account_label,
        observed_at,
        source: UsageSource::CodexAppServer,
        limits,
    })
}

fn normalize_window(
    bucket_id: &str,
    snapshot: &RateLimitSnapshot,
    role: &str,
    window: &RateLimitWindow,
) -> UsageLimit {
    let used_percent = window.used_percent.min(100) as u8;
    let mut metadata = BTreeMap::from([
        ("bucketId".to_string(), json!(bucket_id)),
        ("windowRole".to_string(), json!(role)),
    ]);

    if let Some(name) = snapshot.limit_name.as_ref() {
        metadata.insert("bucketName".to_string(), json!(name));
    }
    if let Some(plan_type) = snapshot.plan_type.as_ref() {
        metadata.insert("planType".to_string(), json!(plan_type));
    }

    UsageLimit {
        id: format!("{bucket_id}.{role}"),
        name: window_label(window.window_duration_mins, role),
        used_percent,
        remaining_percent: 100_u8.saturating_sub(used_percent),
        reset_at: window.resets_at,
        window_duration_minutes: window.window_duration_mins,
        metadata,
    }
}

fn window_label(duration_minutes: Option<u64>, role: &str) -> String {
    match duration_minutes {
        Some(300) => "5-hour window".to_string(),
        Some(10_080) => "Weekly".to_string(),
        Some(minutes) if minutes % 1_440 == 0 => {
            format!("{}-day window", minutes / 1_440)
        }
        Some(minutes) if minutes % 60 == 0 => format!("{}-hour window", minutes / 60),
        Some(minutes) => format!("{minutes}-minute window"),
        None => match role {
            "primary" => "Primary window".to_string(),
            "secondary" => "Secondary window".to_string(),
            _ => "Usage window".to_string(),
        },
    }
}

fn format_plan_label(plan: &str) -> String {
    let words = plan.split('_').map(|word| {
        let mut characters = word.chars();
        match characters.next() {
            Some(first) => first.to_uppercase().collect::<String>() + characters.as_str(),
            None => String::new(),
        }
    });
    format!("Codex {}", words.collect::<Vec<_>>().join(" "))
}

#[cfg(test)]
mod tests {
    use super::*;

    const RATE_LIMIT_RESPONSE: &str =
        include_str!("../../../tests/fixtures/codex_rate_limits.json");

    #[test]
    fn normalizes_codex_windows_and_additional_buckets() {
        let response =
            serde_json::from_str(RATE_LIMIT_RESPONSE).expect("fixture should deserialize");
        let usage = normalize(response).expect("fixture should normalize");

        assert_eq!(usage.provider, "codex");
        assert_eq!(usage.account_label.as_deref(), Some("Codex Plus"));
        assert_eq!(usage.limits.len(), 3);

        assert_eq!(usage.limits[0].id, "codex.primary");
        assert_eq!(usage.limits[0].name, "5-hour window");
        assert_eq!(usage.limits[0].used_percent, 17);
        assert_eq!(usage.limits[0].remaining_percent, 83);

        assert_eq!(usage.limits[1].id, "codex.secondary");
        assert_eq!(usage.limits[1].name, "Weekly");
        assert_eq!(usage.limits[1].remaining_percent, 97);

        assert_eq!(usage.limits[2].id, "base_model_inference.primary");
    }

    #[test]
    #[ignore = "requires an authenticated local Codex CLI"]
    fn retrieves_live_codex_usage() {
        let provider = CodexProvider::discover().expect("Codex CLI should be installed");
        let usage = provider
            .fetch_usage()
            .expect("live usage retrieval should succeed");

        assert!(!usage.limits.is_empty());
        assert!(usage
            .limits
            .iter()
            .all(|limit| limit.used_percent <= 100 && limit.remaining_percent <= 100));

        println!(
            "{}",
            serde_json::to_string_pretty(&usage).expect("usage should serialize")
        );
    }

    #[test]
    fn explicit_binary_path_is_preserved() {
        let path = PathBuf::from("/example/codex");
        let provider = CodexProvider::with_binary(path.clone());
        assert_eq!(provider.binary, path);
    }
}
