use std::collections::BTreeMap;

use serde_json::json;

use crate::usage::{ProviderError, ProviderUsage, UsageLimit, UsageSource};

use super::protocol::{GetCurrentPeriodUsageResponse, GetPlanInfoResponse};

pub(super) fn normalize(
    plan: GetPlanInfoResponse,
    period: GetCurrentPeriodUsageResponse,
) -> Result<ProviderUsage, ProviderError> {
    let account_label = Some(plan.plan_info.plan_name);
    let plan_price = plan.plan_info.price.clone();
    let billing_cycle_end = parse_epoch_ms(&plan.plan_info.billing_cycle_end);
    let billing_cycle_start = parse_epoch_ms(&period.billing_cycle_start);

    let price_metadata = plan_price
        .map(|price| BTreeMap::from([("price".to_string(), json!(price))]))
        .unwrap_or_default();

    let mut limits = Vec::new();

    // Individual usage (priority surface): the seat's default included
    // allowance plus its on-demand (extended) spend.
    let default_limit = period
        .plan_usage
        .as_ref()
        .and_then(|plan_usage| plan_usage.limit);
    let default_used = period
        .plan_usage
        .as_ref()
        .and_then(|plan_usage| plan_usage.included_spend);
    let on_demand_limit = period
        .spend_limit_usage
        .as_ref()
        .and_then(|spend| spend.individual_limit);
    let on_demand_used = period
        .spend_limit_usage
        .as_ref()
        .and_then(|spend| spend.individual_used);

    let combined_limit = default_limit
        .unwrap_or(0)
        .saturating_add(on_demand_limit.unwrap_or(0));
    let combined_used = default_used
        .unwrap_or(0)
        .saturating_add(on_demand_used.unwrap_or(0));

    if let Some(plan_usage) = period.plan_usage.as_ref() {
        let default_limit_value = default_limit.unwrap_or(0);
        let default_used_value = default_used.unwrap_or(0);
        let on_demand_limit_value = on_demand_limit.unwrap_or(0);
        let on_demand_used_value = on_demand_used.unwrap_or(0);
        let combined_percent = percent_of(combined_used, combined_limit);
        let default_percent = percent_of(default_used_value, default_limit_value);
        let on_demand_percent = percent_of(on_demand_used_value, on_demand_limit_value);

        if combined_limit > 0 {
            limits.push(normalize_usage_limit(
                "cursor.individual",
                Some(combined_limit),
                Some(combined_used),
                combined_percent,
                "Individual usage",
                billing_cycle_end,
                billing_cycle_start,
                &BTreeMap::from([
                    ("defaultLimitCents".to_string(), json!(default_limit_value)),
                    ("defaultUsedCents".to_string(), json!(default_used_value)),
                    (
                        "onDemandLimitCents".to_string(),
                        json!(on_demand_limit_value),
                    ),
                    ("onDemandUsedCents".to_string(), json!(on_demand_used_value)),
                ])
                .into_iter()
                .chain(price_metadata.clone())
                .collect(),
            ));
        }

        limits.push(normalize_usage_limit(
            "cursor.individual_default",
            plan_usage.limit,
            plan_usage.included_spend,
            default_percent,
            "Default",
            billing_cycle_end,
            billing_cycle_start,
            &BTreeMap::new(),
        ));

        if on_demand_limit_value > 0 {
            limits.push(normalize_usage_limit(
                "cursor.individual_on_demand",
                Some(on_demand_limit_value),
                Some(on_demand_used_value),
                on_demand_percent,
                "On-demand",
                billing_cycle_end,
                billing_cycle_start,
                &BTreeMap::new(),
            ));
        }

        if let Some(auto_percent) = plan_usage.auto_percent_used {
            limits.push(normalize_usage_limit(
                "cursor.auto",
                plan_usage.limit,
                plan_usage.included_spend,
                auto_percent,
                "Cursor models",
                billing_cycle_end,
                billing_cycle_start,
                &BTreeMap::new(),
            ));
        }
        if let Some(api_percent) = plan_usage.api_percent_used {
            limits.push(normalize_usage_limit(
                "cursor.api",
                plan_usage.limit,
                plan_usage.included_spend,
                api_percent,
                "Other models (API)",
                billing_cycle_end,
                billing_cycle_start,
                &BTreeMap::new(),
            ));
        }
    }

    // Team usage (secondary surface): collective pool and per-member on-demand.
    if let Some(spend) = period.spend_limit_usage.as_ref() {
        if let Some(limit) = spend.pooled_limit {
            let used = spend.pooled_used.unwrap_or(0);
            let percent = percent_of(used, limit);
            limits.push(normalize_usage_limit(
                "cursor.team_pool",
                Some(limit),
                Some(used),
                percent,
                "Team usage pool",
                billing_cycle_end,
                billing_cycle_start,
                &BTreeMap::from([
                    (
                        "limitType".to_string(),
                        json!(spend.limit_type.as_deref().unwrap_or("")),
                    ),
                    (
                        "pooledRemainingCents".to_string(),
                        json!(spend.pooled_remaining.unwrap_or(0)),
                    ),
                ]),
            ));
        }
    }

    if limits.is_empty() {
        return Err(ProviderError::new(
            "Cursor returned a usage response without any usage windows.",
        ));
    }

    limits.sort_by_key(|limit| {
        (
            !limit.id.starts_with("cursor."),
            limit.window_duration_minutes.unwrap_or(u64::MAX),
            limit.id.clone(),
        )
    });

    let observed_at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|error| ProviderError::new(error.to_string()))?
        .as_secs() as i64;

    Ok(ProviderUsage {
        provider: "cursor".to_string(),
        account_label,
        observed_at,
        source: UsageSource::CursorDashboardApi,
        limits,
    })
}

fn percent_of(used: u64, total: u64) -> u64 {
    if total == 0 {
        0
    } else {
        (used as f64 / total as f64 * 100.0).round().min(100.0) as u64
    }
}

#[allow(clippy::too_many_arguments)]
fn normalize_usage_limit(
    id: &str,
    limit_cents: Option<u64>,
    used_cents: Option<u64>,
    used_percent: u64,
    name: &str,
    reset_at: Option<i64>,
    window_start: Option<i64>,
    extra_metadata: &BTreeMap<String, serde_json::Value>,
) -> UsageLimit {
    let used_percent = used_percent.min(100) as u8;
    let limit_cents = limit_cents.unwrap_or(0);
    let used_cents = used_cents.unwrap_or(0);
    let remaining_cents = limit_cents.saturating_sub(used_cents);

    let window_duration_minutes = window_start
        .zip(reset_at)
        .map(|(start, end)| ((end - start) / 60).max(0) as u64);

    let mut metadata = BTreeMap::new();
    metadata.insert(
        "windowRole".to_string(),
        json!(id.split('.').next_back().unwrap_or(id)),
    );
    metadata.insert("limitCents".to_string(), json!(limit_cents));
    metadata.insert("usedCents".to_string(), json!(used_cents));
    metadata.insert("remainingCents".to_string(), json!(remaining_cents));
    metadata.extend(extra_metadata.clone());

    UsageLimit {
        id: id.to_string(),
        name: name.to_string(),
        used_percent,
        remaining_percent: 100_u8.saturating_sub(used_percent),
        reset_at,
        window_duration_minutes,
        metadata,
    }
}

fn parse_epoch_ms(value: &Option<String>) -> Option<i64> {
    value
        .as_ref()
        .and_then(|raw| raw.parse::<i64>().ok())
        .map(|ms| ms / 1000)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::providers::cursor::protocol::{
        GetCurrentPeriodUsageResponse, GetPlanInfoResponse, PlanInfo, PlanUsage, SpendLimitUsage,
    };

    const PLAN_INFO_FIXTURE: &str = include_str!("../../../tests/fixtures/cursor_plan_info.json");
    const PERIOD_USAGE_FIXTURE: &str =
        include_str!("../../../tests/fixtures/cursor_current_period_usage.json");

    fn sample_plan() -> GetPlanInfoResponse {
        GetPlanInfoResponse {
            plan_info: PlanInfo {
                plan_name: "Team".to_string(),
                price: Some("$40/mo".to_string()),
                billing_cycle_end: Some("1789159429000".to_string()),
            },
        }
    }

    fn sample_period() -> GetCurrentPeriodUsageResponse {
        GetCurrentPeriodUsageResponse {
            billing_cycle_start: Some("1786481029000".to_string()),
            plan_usage: Some(PlanUsage {
                included_spend: Some(2000),
                limit: Some(2000),
                auto_percent_used: Some(57),
                api_percent_used: Some(100),
            }),
            spend_limit_usage: Some(SpendLimitUsage {
                pooled_used: Some(800467),
                pooled_remaining: Some(1011533),
                pooled_limit: Some(1812000),
                individual_used: Some(20869),
                individual_limit: Some(38000),
                limit_type: Some("team".to_string()),
            }),
        }
    }

    #[test]
    fn deserializes_plan_info_fixture() {
        let plan: GetPlanInfoResponse =
            serde_json::from_str(PLAN_INFO_FIXTURE).expect("fixture should deserialize");
        assert_eq!(plan.plan_info.plan_name, "Team");
    }

    #[test]
    fn deserializes_period_usage_fixture() {
        let period: GetCurrentPeriodUsageResponse =
            serde_json::from_str(PERIOD_USAGE_FIXTURE).expect("fixture should deserialize");
        assert_eq!(period.plan_usage.as_ref().unwrap().limit, Some(2000));
    }

    #[test]
    fn normalizes_cursor_usage() {
        let usage = normalize(sample_plan(), sample_period()).expect("should normalize");

        assert_eq!(usage.provider, "cursor");
        assert_eq!(usage.account_label.as_deref(), Some("Team"));

        assert!(usage.limits.iter().any(|l| l.id == "cursor.individual"));
        assert!(usage
            .limits
            .iter()
            .any(|l| l.id == "cursor.individual_default"));
        assert!(usage
            .limits
            .iter()
            .any(|l| l.id == "cursor.individual_on_demand"));
        assert!(usage.limits.iter().any(|l| l.id == "cursor.auto"));
        assert!(usage.limits.iter().any(|l| l.id == "cursor.api"));
        assert!(usage.limits.iter().any(|l| l.id == "cursor.team_pool"));
        assert!(!usage
            .limits
            .iter()
            .any(|l| l.id == "cursor.team_individual"));

        let individual = usage
            .limits
            .iter()
            .find(|l| l.id == "cursor.individual")
            .unwrap();
        assert_eq!(individual.used_percent, 57);
        assert_eq!(individual.remaining_percent, 43);
        assert_eq!(individual.window_duration_minutes, Some(44640));
        assert_eq!(
            individual
                .metadata
                .get("defaultLimitCents")
                .and_then(serde_json::Value::as_u64),
            Some(2000)
        );
        assert_eq!(
            individual
                .metadata
                .get("defaultUsedCents")
                .and_then(serde_json::Value::as_u64),
            Some(2000)
        );
        assert_eq!(
            individual
                .metadata
                .get("onDemandLimitCents")
                .and_then(serde_json::Value::as_u64),
            Some(38000)
        );
        assert_eq!(
            individual
                .metadata
                .get("onDemandUsedCents")
                .and_then(serde_json::Value::as_u64),
            Some(20869)
        );

        let default_limit = usage
            .limits
            .iter()
            .find(|l| l.id == "cursor.individual_default")
            .unwrap();
        assert_eq!(default_limit.used_percent, 100);
        assert_eq!(default_limit.remaining_percent, 0);

        let on_demand = usage
            .limits
            .iter()
            .find(|l| l.id == "cursor.individual_on_demand")
            .unwrap();
        assert_eq!(on_demand.used_percent, 55);
        assert_eq!(on_demand.remaining_percent, 45);
    }

    #[test]
    fn fixture_deserializes_to_normalized_usage() {
        let plan: GetPlanInfoResponse =
            serde_json::from_str(PLAN_INFO_FIXTURE).expect("plan fixture should deserialize");
        let period: GetCurrentPeriodUsageResponse =
            serde_json::from_str(PERIOD_USAGE_FIXTURE).expect("period fixture should deserialize");

        let usage = normalize(plan, period).expect("should normalize");
        assert_eq!(usage.provider, "cursor");
        assert!(!usage.limits.is_empty());
    }
}
