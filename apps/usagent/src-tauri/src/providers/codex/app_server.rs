use std::{
    io::{BufRead, BufReader, Write},
    path::Path,
    process::{Child, ChildStdin, Command, Stdio},
    sync::mpsc::{self, Receiver, RecvTimeoutError},
    thread,
    time::Duration,
};

use serde::de::DeserializeOwned;
use serde_json::{json, Value};

use crate::usage::ProviderError;

use super::protocol::GetAccountRateLimitsResponse;

const RESPONSE_TIMEOUT: Duration = Duration::from_secs(20);

pub(super) struct AppServerSession {
    child: Child,
    stdin: ChildStdin,
    messages: Receiver<Result<Value, String>>,
}

impl AppServerSession {
    pub(super) fn start(binary: &Path) -> Result<Self, ProviderError> {
        let mut child = Command::new(binary)
            .args(["app-server", "--stdio"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| {
                ProviderError::new(format!(
                    "Failed to start Codex app-server at {}: {error}",
                    binary.display()
                ))
            })?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| ProviderError::new("Codex app-server did not expose stdin."))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::new("Codex app-server did not expose stdout."))?;

        let (sender, messages) = mpsc::channel();
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines() {
                let message = match line {
                    Ok(line) => serde_json::from_str(&line).map_err(|error| error.to_string()),
                    Err(error) => Err(error.to_string()),
                };
                if sender.send(message).is_err() {
                    break;
                }
            }
        });

        Ok(Self {
            child,
            stdin,
            messages,
        })
    }

    pub(super) fn initialize(&mut self) -> Result<(), ProviderError> {
        self.request::<Value>(
            1,
            "initialize",
            json!({
                "clientInfo": {
                    "name": "usagent",
                    "title": "Usagent",
                    "version": env!("CARGO_PKG_VERSION")
                },
                "capabilities": {
                    "experimentalApi": true
                }
            }),
        )?;
        self.send(json!({ "method": "initialized" }))
    }

    pub(super) fn read_rate_limits(
        &mut self,
    ) -> Result<GetAccountRateLimitsResponse, ProviderError> {
        self.request(2, "account/rateLimits/read", Value::Null)
    }

    fn request<T: DeserializeOwned>(
        &mut self,
        id: i64,
        method: &str,
        params: Value,
    ) -> Result<T, ProviderError> {
        self.send(json!({
            "id": id,
            "method": method,
            "params": params
        }))?;

        loop {
            let message = match self.messages.recv_timeout(RESPONSE_TIMEOUT) {
                Ok(Ok(message)) => message,
                Ok(Err(error)) => {
                    return Err(ProviderError::new(format!(
                        "Codex app-server returned invalid JSON: {error}"
                    )))
                }
                Err(RecvTimeoutError::Timeout) => {
                    return Err(ProviderError::new(format!(
                        "Timed out waiting for Codex app-server method {method}."
                    )))
                }
                Err(RecvTimeoutError::Disconnected) => {
                    return Err(ProviderError::new(
                        "Codex app-server exited before returning usage data.",
                    ))
                }
            };

            if message.get("id").and_then(Value::as_i64) != Some(id) {
                continue;
            }

            if let Some(error) = message.get("error") {
                return Err(ProviderError::new(format!(
                    "Codex app-server method {method} failed: {error}"
                )));
            }

            let result = message.get("result").cloned().ok_or_else(|| {
                ProviderError::new(format!(
                    "Codex app-server method {method} returned no result."
                ))
            })?;
            return serde_json::from_value(result).map_err(Into::into);
        }
    }

    fn send(&mut self, message: Value) -> Result<(), ProviderError> {
        serde_json::to_writer(&mut self.stdin, &message)?;
        self.stdin.write_all(b"\n")?;
        self.stdin.flush()?;
        Ok(())
    }
}

impl Drop for AppServerSession {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
