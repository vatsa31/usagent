import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ProviderUsage, UsageLimit } from "./types/usage";
import "./App.css";

const STALE_AFTER_MS = 15 * 60 * 1000;

function formatDate(timestamp: number | null) {
  if (timestamp === null) return "Not provided";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp * 1000));
}

function formatAge(timestamp: number) {
  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (elapsedSeconds < 60) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
}

function LimitCard({ limit }: { limit: UsageLimit }) {
  const tone =
    limit.remainingPercent <= 10
      ? "critical"
      : limit.remainingPercent <= 20
        ? "warning"
        : "healthy";

  return (
    <article className="limit-card">
      <div className="limit-heading">
        <div>
          <p className="eyebrow">{limit.name}</p>
          <p className="limit-reset">Resets {formatDate(limit.resetAt)}</p>
        </div>
        <strong className={`remaining ${tone}`}>{limit.remainingPercent}%</strong>
      </div>

      <div className="progress-track" aria-label={`${limit.remainingPercent}% remaining`}>
        <div
          className={`progress-fill ${tone}`}
          style={{ width: `${limit.remainingPercent}%` }}
        />
      </div>

      <div className="limit-footer">
        <span>{limit.usedPercent}% used</span>
        <span>{limit.windowDurationMinutes ? `${limit.windowDurationMinutes} min window` : "Usage window"}</span>
      </div>
    </article>
  );
}

function App() {
  const [usage, setUsage] = useState<ProviderUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const nextUsage = await invoke<ProviderUsage>("get_codex_usage");
      setUsage(nextUsage);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : String(refreshError));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    let unlistenRefresh: (() => void) | undefined;
    let unlistenOpen: (() => void) | undefined;

    void Promise.all([
      listen("refresh-requested", () => {
        if (!cancelled) void refresh();
      }),
      listen("popover-opened", () => {
        if (!cancelled) void refresh();
      }),
    ]).then(([removeRefresh, removeOpen]) => {
      if (cancelled) {
        removeRefresh();
        removeOpen();
      } else {
        unlistenRefresh = removeRefresh;
        unlistenOpen = removeOpen;
      }
    });

    return () => {
      cancelled = true;
      unlistenRefresh?.();
      unlistenOpen?.();
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const isStale = usage !== null && clock - usage.observedAt * 1000 > STALE_AFTER_MS;
  const coreLimits = useMemo(
    () => usage?.limits.filter((limit) => limit.id.startsWith("codex.")) ?? [],
    [usage],
  );
  const additionalLimits = useMemo(
    () => usage?.limits.filter((limit) => !limit.id.startsWith("codex.")) ?? [],
    [usage],
  );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">Cx</div>
        <div>
          <p className="kicker">Agent usage monitor</p>
          <h1>Codex usage</h1>
        </div>
        <button className="refresh-button" onClick={() => void refresh()} disabled={isRefreshing}>
          <span aria-hidden="true">↻</span> {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className={`status-banner ${usage ? "stale" : "error"}`} role="alert">
          <span className="status-icon" aria-hidden="true">{usage ? "!" : "×"}</span>
          <div>
            <strong>{usage ? "Showing the last successful snapshot" : "Codex usage unavailable"}</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!usage && !isRefreshing && !error && (
        <div className="loading-state">Connecting to the local Codex app-server…</div>
      )}

      {isRefreshing && !usage && <div className="loading-state">Loading Codex usage…</div>}

      {usage && (
        <>
          <section className="account-row" aria-label="Account status">
            <div>
              <p className="eyebrow">Account</p>
              <p className="account-name">{usage.accountLabel ?? "Codex account"}</p>
            </div>
            <div className={`freshness ${isStale ? "stale-text" : ""}`}>
              <span className="status-dot" aria-hidden="true" />
              {isStale ? "Stale · " : "Updated "}{formatAge(usage.observedAt)}
            </div>
          </section>

          <section className="limits-grid" aria-label="Codex rate limits">
            {coreLimits.map((limit) => <LimitCard key={limit.id} limit={limit} />)}
          </section>

          {additionalLimits.length > 0 && (
            <section className="additional-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Additional metered limits</p>
                  <h2>Other Codex capacity</h2>
                </div>
                <span className="source-label">{usage.source.replace(/_/g, " ")}</span>
              </div>
              <div className="additional-list">
                {additionalLimits.map((limit) => <LimitCard key={limit.id} limit={limit} />)}
              </div>
            </section>
          )}

          <footer className="app-footer">
            <span>Data stays local to this Mac.</span>
            <span>Last snapshot: {formatDate(usage.observedAt)}</span>
          </footer>
        </>
      )}
    </main>
  );
}

export default App;
