use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProviderUsage {
    pub provider: String,
    pub account_label: Option<String>,
    pub observed_at: i64,
    pub source: UsageSource,
    pub limits: Vec<UsageLimit>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UsageSource {
    CodexAppServer,
    CursorDashboardApi,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UsageLimit {
    pub id: String,
    pub name: String,
    pub used_percent: u8,
    pub remaining_percent: u8,
    pub reset_at: Option<i64>,
    pub window_duration_minutes: Option<u64>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub metadata: BTreeMap<String, Value>,
}
