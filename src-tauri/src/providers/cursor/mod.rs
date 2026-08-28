mod client;
mod normalize;
mod protocol;

use std::process::Command;

use crate::usage::{ProviderError, ProviderUsage, UsageProvider};

use client::CursorClient;

const CURSOR_TOKEN_SERVICE: &str = "cursor-access-token";

pub struct CursorProvider {
    token: String,
}

impl CursorProvider {
    pub fn discover() -> Result<Self, ProviderError> {
        let token = read_token()?;
        Ok(Self { token })
    }
}

impl UsageProvider for CursorProvider {
    fn fetch_usage(&self) -> Result<ProviderUsage, ProviderError> {
        let client = CursorClient::new(self.token.clone());
        let plan = client.plan_info()?;
        let period = client.current_period_usage()?;
        normalize::normalize(plan, period)
    }
}

fn read_token() -> Result<String, ProviderError> {
    let output = Command::new("security")
        .args(["find-generic-password", "-s", CURSOR_TOKEN_SERVICE, "-w"])
        .output()
        .map_err(|error| {
            ProviderError::new(format!(
                "Failed to read Cursor session token from Keychain: {error}"
            ))
        })?;

    if !output.status.success() {
        return Err(ProviderError::new(
            "Could not read the Cursor session token from the macOS Keychain. \
             Sign in to Cursor and try again.",
        ));
    }

    let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if token.is_empty() {
        return Err(ProviderError::new(
            "Cursor session token from the Keychain is empty.",
        ));
    }

    Ok(token)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore = "requires an authenticated local Cursor account"]
    fn retrieves_live_cursor_usage() {
        let provider = CursorProvider::discover().expect("Cursor token should be available");
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
}
