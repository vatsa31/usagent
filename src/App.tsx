import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ProviderUsage, UsageLimit } from "./types/usage";
import "./App.css";

const STALE_AFTER_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 3 * 60 * 1000;
const MAX_POLL_BACKOFF_MS = 30 * 60 * 1000;

type ProviderKey = "codex" | "cursor";
type ProviderData = { usage: ProviderUsage | null; error: string | null };

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

  const usedCents = limit.metadata?.usedCents as number | undefined;
  const limitCents = limit.metadata?.limitCents as number | undefined;
  const defaultLimitCents = limit.metadata?.defaultLimitCents as number | undefined;
  const defaultUsedCents = limit.metadata?.defaultUsedCents as number | undefined;
  const onDemandLimitCents = limit.metadata?.onDemandLimitCents as number | undefined;
  const onDemandUsedCents = limit.metadata?.onDemandUsedCents as number | undefined;

  const isCombined = defaultLimitCents !== undefined;

  let centsDetail: string | null = null;
  if (isCombined && onDemandLimitCents !== undefined) {
    centsDetail = [
      `Default ${formatCents(defaultUsedCents)} / ${formatCents(defaultLimitCents)}`,
      `On-demand ${formatCents(onDemandUsedCents)} / ${formatCents(onDemandLimitCents)}`,
    ].join(" · ");
  } else if (!isCombined && usedCents !== undefined && limitCents !== undefined && limitCents > 0) {
    centsDetail = `${formatCents(usedCents)} / ${formatCents(limitCents)}`;
  }

  const usedLabel =
    limitCents !== undefined && limitCents > 0
      ? `${limit.usedPercent}% used${centsDetail ? ` · ${centsDetail}` : ""}`
      : centsDetail ?? `${limit.usedPercent}% used`;

  return (
    <article className="limit-card">
      <div className="limit-heading">
        <div>
          <p className="eyebrow">{limit.name}</p>
          <p className="limit-reset">Resets {formatDate(limit.resetAt)}</p>
        </div>
        <strong className={`remaining ${tone}`}>{limit.remainingPercent}%</strong>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-label={`${limit.remainingPercent}% remaining`}
        aria-valuenow={limit.remainingPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-fill ${tone}`}
          style={{ width: `${limit.remainingPercent}%` }}
        />
      </div>

      <div className="limit-footer">
        <span>{usedLabel}</span>
        <span>{limit.windowDurationMinutes ? `${limit.windowDurationMinutes} min window` : "Usage window"}</span>
      </div>
    </article>
  );
}

function formatCents(cents: number | undefined | null) {
  if (cents === undefined || cents === null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function LimitCardGroup({ title, eyebrow, limits }: { title: string; eyebrow: string; limits: UsageLimit[] }) {
  if (limits.length === 0) return null;
  return (
    <section className="additional-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span className="source-label">cursor dashboard api</span>
      </div>
      <div className="additional-list">
        {limits.map((limit) => <LimitCard key={limit.id} limit={limit} />)}
      </div>
    </section>
  );
}

function ProviderSection({ provider, data, clock }: { provider: ProviderKey; data: ProviderData; clock: number }) {
  const usage = data.usage;
  const isStale =
    usage !== null && clock - usage.observedAt * 1000 > STALE_AFTER_MS;

  const headlineId = provider === "codex" ? "codex.primary" : "cursor.individual";
  const coreLimits = usage?.limits.filter((limit) => limit.id.startsWith(`${provider}.`)) ?? [];
  const additionalLimits = usage?.limits.filter((limit) => !limit.id.startsWith(`${provider}.`)) ?? [];
  const headline = usage?.limits.find((limit) => limit.id === headlineId);

  const isCursor = provider === "cursor";
  const individualLimits = usage?.limits.filter((limit) => limit.id.startsWith("cursor.individual")) ?? [];
  const teamLimits = usage?.limits.filter((limit) =>
    limit.id === "cursor.team_pool",
  ) ?? [];
  const specialCursor = new Set([
    "cursor.individual",
    "cursor.individual_default",
    "cursor.individual_on_demand",
    "cursor.team_pool",
  ]);
  const meteredLimits = isCursor
    ? coreLimits.filter((limit) => !specialCursor.has(limit.id))
    : coreLimits.filter((limit) => limit.id !== headlineId);

  return (
    <div className="provider-panel">
      {data.error && (
        <div className={`status-banner ${usage ? "stale" : "error"}`} role="alert">
          <span className="status-icon" aria-hidden="true">{usage ? "!" : "×"}</span>
          <div>
            <strong>{usage ? "Showing the last successful snapshot" : `${isCursor ? "Cursor" : "Codex"} usage unavailable`}</strong>
            <p>{data.error}</p>
          </div>
        </div>
      )}

      {!usage && !data.error && (
        <div className="loading-state">
          Loading {isCursor ? "Cursor" : "Codex"} usage…
        </div>
      )}

      {usage && (
        <>
          <section className="account-row" aria-label="Account status">
            <div>
              <p className="eyebrow">Account</p>
              <p className="account-name">{usage.accountLabel ?? (isCursor ? "Cursor account" : "Codex account")}</p>
            </div>
            <div className={`freshness ${isStale ? "stale-text" : ""}`}>
              <span className="status-dot" aria-hidden="true" />
              {isStale ? "Stale · " : "Updated "}{formatAge(usage.observedAt)}
            </div>
          </section>

          {headline && <section className="limits-grid" aria-label="Primary limits">
            <LimitCard key={headline.id} limit={headline} />
          </section>}

          {isCursor && (
            <>
              <LimitCardGroup
                eyebrow="Your seat"
                title="Individual usage"
                limits={individualLimits.filter((limit) => limit.id !== headlineId)}
              />
              <LimitCardGroup
                eyebrow="Team"
                title="Team usage"
                limits={teamLimits}
              />
            </>
          )}

          {meteredLimits.length > 0 && (
            <LimitCardGroup
              eyebrow="Metered limits"
              title={isCursor ? "Cursor usage" : "Codex capacity"}
              limits={meteredLimits}
            />
          )}

          {additionalLimits.length > 0 && (
            <LimitCardGroup
              eyebrow="Other capacity"
              title={isCursor ? "Other limits" : "Other Codex capacity"}
              limits={additionalLimits}
            />
          )}
        </>
      )}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<ProviderKey>("codex");
  const [providers, setProviders] = useState<Record<ProviderKey, ProviderData>>({
    codex: { usage: null, error: null },
    cursor: { usage: null, error: null },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [pollResetToken, resetPolling] = useState(0);
  const refreshInFlight = useRef(false);
  const pollBackoffMs = useRef(POLL_INTERVAL_MS);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return true;

    refreshInFlight.current = true;
    setIsRefreshing(true);

    const commands: Array<{ key: ProviderKey; name: string }> = [
      { key: "codex", name: "get_codex_usage" },
      { key: "cursor", name: "get_cursor_usage" },
    ];

    const results = await Promise.all(
      commands.map(async ({ key, name }) => {
        try {
          const nextUsage = await invoke<ProviderUsage>(name);
          return { key, usage: nextUsage, error: null as string | null };
        } catch (refreshError) {
          const message =
            refreshError instanceof Error ? refreshError.message : String(refreshError);
          return { key, usage: null, error: message };
        }
      }),
    );

    const anySucceeded = results.some((result) => result.usage !== null);

    setProviders((prev) => {
      const next = { ...prev };
      for (const result of results) {
        if (result.usage !== null || result.error !== null) {
          next[result.key] = {
            usage: result.usage ?? prev[result.key].usage,
            error: result.error,
          };
        }
      }
      return next;
    });

    if (anySucceeded) {
      pollBackoffMs.current = POLL_INTERVAL_MS;
      resetPolling((value) => value + 1);
    }

    refreshInFlight.current = false;
    setIsRefreshing(false);
    return anySucceeded;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const scheduleNextPoll = () => {
      timer = window.setTimeout(async () => {
        const succeeded = await refresh();
        if (cancelled) return;

        if (!succeeded) {
          pollBackoffMs.current = Math.min(
            pollBackoffMs.current * 2,
            MAX_POLL_BACKOFF_MS,
          );
        }
        scheduleNextPoll();
      }, pollBackoffMs.current);
    };

    scheduleNextPoll();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [refresh, pollResetToken]);

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

  const activeUsage = providers[tab].usage;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">Ax</div>
        <div>
          <p className="kicker">Agent usage monitor</p>
          <h1>Usage</h1>
        </div>
        <button className="refresh-button" onClick={() => void refresh()} disabled={isRefreshing}>
          <span aria-hidden="true">↻</span> {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <nav className="tabs" aria-label="Provider">
        {(["codex", "cursor"] as ProviderKey[]).map((provider) => {
          const data = providers[provider];
          const label = provider === "codex" ? "Codex" : "Cursor";
          const available = data.usage !== null || !data.error;
          const badgeLimit =
            provider === "cursor"
              ? data.usage?.limits.find((limit) => limit.id === "cursor.individual")
              : data.usage?.limits.find((limit) => limit.id === "codex.primary");
          const badge = badgeLimit?.remainingPercent;
          return (
            <button
              key={provider}
              className={`tab ${tab === provider ? "active" : ""}`}
              onClick={() => setTab(provider)}
            >
              {label}
              {badge !== undefined && (
                <span className={`tab-badge ${badge <= 10 ? "critical" : badge <= 20 ? "warning" : "healthy"}`}>
                  {badge}%
                </span>
              )}
              {!!data.error && !data.usage && <span className="tab-error" aria-hidden="true">×</span>}
              {!available && <span className="tab-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="tab-content">
        <ProviderSection provider={tab} data={providers[tab]} clock={clock} />
      </div>

      {activeUsage && (
        <footer className="app-footer">
          <span>Data stays local to this Mac.</span>
          <span>Last snapshot: {formatDate(activeUsage.observedAt)}</span>
        </footer>
      )}
    </main>
  );
}

export default App;
