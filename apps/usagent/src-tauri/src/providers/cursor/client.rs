use std::time::Duration;

use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::usage::ProviderError;

use super::protocol::{GetCurrentPeriodUsageResponse, GetPlanInfoResponse};

const DASHBOARD_ENDPOINT: &str = "https://api2.cursor.sh/aiserver.v1.DashboardService";
const CONNECT_PROTOCOL_VERSION: &str = "1";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);

pub(super) struct CursorClient {
    token: String,
}

impl CursorClient {
    pub(super) fn new(token: String) -> Self {
        Self { token }
    }

    pub(super) fn plan_info(&self) -> Result<GetPlanInfoResponse, ProviderError> {
        self.request("GetPlanInfo", Value::Null)
    }

    pub(super) fn current_period_usage(
        &self,
    ) -> Result<GetCurrentPeriodUsageResponse, ProviderError> {
        self.request("GetCurrentPeriodUsage", Value::Null)
    }

    fn request<T: DeserializeOwned>(
        &self,
        method: &str,
        params: Value,
    ) -> Result<T, ProviderError> {
        let client = reqwest::blocking::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .build()
            .map_err(|error| ProviderError::new(error.to_string()))?;

        let body = if params.is_null() {
            Value::Object(Default::default())
        } else {
            params
        };

        let response = client
            .post(format!("{DASHBOARD_ENDPOINT}/{method}"))
            .header("Authorization", format!("Bearer {}", self.token))
            .header("Content-Type", "application/json")
            .header("Connect-Protocol-Version", CONNECT_PROTOCOL_VERSION)
            .json(&body)
            .send()
            .map_err(|error| {
                ProviderError::new(format!("Failed to reach Cursor dashboard API: {error}"))
            })?;

        let status = response.status();
        if !status.is_success() {
            return Err(ProviderError::new(format!(
                "Cursor dashboard API method {method} failed with status {}",
                status
            )));
        }

        let body = response.text().map_err(|error| {
            ProviderError::new(format!("Failed to read Cursor dashboard response: {error}"))
        })?;

        let json: Value = serde_json::from_str(&body).map_err(|error| {
            ProviderError::new(format!("Cursor dashboard returned invalid JSON: {error}"))
        })?;

        if let Some(error) = json.get("error") {
            return Err(ProviderError::new(format!(
                "Cursor dashboard API method {method} returned: {error}"
            )));
        }

        serde_json::from_value(json).map_err(Into::into)
    }
}
