use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct GetPlanInfoResponse {
    pub plan_info: PlanInfo,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct PlanInfo {
    pub plan_name: String,
    pub price: Option<String>,
    pub billing_cycle_end: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct GetCurrentPeriodUsageResponse {
    pub billing_cycle_start: Option<String>,
    pub plan_usage: Option<PlanUsage>,
    pub spend_limit_usage: Option<SpendLimitUsage>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct PlanUsage {
    pub included_spend: Option<u64>,
    pub limit: Option<u64>,
    pub auto_percent_used: Option<u64>,
    pub api_percent_used: Option<u64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct SpendLimitUsage {
    pub pooled_used: Option<u64>,
    pub pooled_remaining: Option<u64>,
    pub pooled_limit: Option<u64>,
    pub individual_used: Option<u64>,
    pub individual_limit: Option<u64>,
    pub limit_type: Option<String>,
}
