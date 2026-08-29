import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ProviderUsage, UsageLimit, UsageSource } from "./types/usage";
import "./App.css";

const STALE_AFTER_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 3 * 60 * 1000;
const MAX_POLL_BACKOFF_MS = 30 * 60 * 1000;
const CURSOR_THROTTLE_MS = 3 * 60 * 1000;

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

function initials(label: string | null, fallback: string) {
  const source = label?.trim() || fallback;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function sourceLabel(source: UsageSource) {
  switch (source) {
    case "codex_app_server":
      return "codex app server";
    case "cursor_dashboard_api":
      return "cursor dashboard api";
  }
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
        <span className="limit-label">{limit.name}</span>
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

      <div className="limit-meta">
        <span>{usedLabel}</span>
        <span>Resets {formatDate(limit.resetAt)}</span>
      </div>
    </article>
  );
}

function formatCents(cents: number | undefined | null) {
  if (cents === undefined || cents === null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

function LimitCardGroup({ title, eyebrow, limits, source }: { title: string; eyebrow: string; limits: UsageLimit[]; source: UsageSource }) {
  if (limits.length === 0) return null;
  return (
    <section className="additional-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <span className="source-label">{sourceLabel(source)}</span>
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
          <span className="status-glyph" aria-hidden="true">{usage ? "!" : "×"}</span>
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
          <div className="account-row" aria-label="Account status">
            <span className="avatar">{initials(usage.accountLabel, isCursor ? "CU" : "CX")}</span>
            <div className="account-text">
              <span className="eyebrow">Account</span>
              <span className="account-name">{usage.accountLabel ?? (isCursor ? "Cursor account" : "Codex account")}</span>
            </div>
            <span className={`freshness ${isStale ? "stale-text" : ""}`}>
              <i className="status-dot" aria-hidden="true" />
              {isStale ? "stale" : `synced ${formatAge(usage.observedAt)}`}
            </span>
          </div>

          {headline && <section className="limits-grid" aria-label="Primary limits">
            <LimitCard key={headline.id} limit={headline} />
          </section>}

          {isCursor && (
            <>
              <LimitCardGroup
                eyebrow="Your seat"
                title="Individual usage"
                limits={individualLimits.filter((limit) => limit.id !== headlineId)}
                source={usage.source}
              />
              <LimitCardGroup
                eyebrow="Team"
                title="Team usage"
                limits={teamLimits}
                source={usage.source}
              />
            </>
          )}

          {meteredLimits.length > 0 && (
            <LimitCardGroup
              eyebrow="Metered limits"
              title={isCursor ? "Cursor usage" : "Codex capacity"}
              limits={meteredLimits}
              source={usage.source}
            />
          )}

          {additionalLimits.length > 0 && (
            <LimitCardGroup
              eyebrow="Other capacity"
              title={isCursor ? "Other limits" : "Other Codex capacity"}
              limits={additionalLimits}
              source={usage.source}
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
  const lastCursorFetchRef = useRef<number>(0);

  const refreshProvider = useCallback(
    async (key: ProviderKey, name: string) => {
      try {
        const usage = await invoke<ProviderUsage>(name);
        setProviders((prev) => ({ ...prev, [key]: { usage, error: null } }));
        return true;
      } catch (refreshError) {
        const message =
          refreshError instanceof Error ? refreshError.message : String(refreshError);
        setProviders((prev) => ({ ...prev, [key]: { ...prev[key], error: message } }));
        return false;
      }
    },
    [],
  );

  const refreshCodex = useCallback(
    async () => {
      const ok = await refreshProvider("codex", "get_codex_usage");
      if (ok) {
        pollBackoffMs.current = POLL_INTERVAL_MS;
        resetPolling((value) => value + 1);
      }
      return ok;
    },
    [refreshProvider],
  );

  const refreshCursor = useCallback(
    (bypassThrottle: boolean) => {
      const now = Date.now();
      if (
        !bypassThrottle &&
        now - lastCursorFetchRef.current < CURSOR_THROTTLE_MS
      ) {
        return Promise.resolve(true);
      }
      lastCursorFetchRef.current = now;
      return refreshProvider("cursor", "get_cursor_usage");
    },
    [refreshProvider],
  );

  const refreshAll = useCallback(
    async (bypassCursorThrottle: boolean) => {
      if (refreshInFlight.current) return true;
      refreshInFlight.current = true;
      setIsRefreshing(true);

      const results = await Promise.all([
        refreshCodex(),
        refreshCursor(bypassCursorThrottle),
      ]);
      const anySucceeded = results.some(Boolean);

      refreshInFlight.current = false;
      setIsRefreshing(false);
      return anySucceeded;
    },
    [refreshCodex, refreshCursor],
  );

  useEffect(() => {
    void refreshAll(true);
  }, [refreshAll]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    const scheduleNextPoll = () => {
      timer = window.setTimeout(async () => {
        const succeeded = await refreshCodex();
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
  }, [refreshCodex, pollResetToken]);

  useEffect(() => {
    let cancelled = false;
    let unlistenRefresh: (() => void) | undefined;
    let unlistenOpen: (() => void) | undefined;

    void Promise.all([
      listen("refresh-requested", () => {
        if (!cancelled) void refreshAll(false);
      }),
      listen("popover-opened", () => {
        if (!cancelled) void refreshAll(false);
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
  }, [refreshAll]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const activeUsage = providers[tab].usage;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">u/</div>
        <div className="header-title">
          <span className="kicker">Agent usage monitor</span>
          <h1>Usage</h1>
        </div>
        <span className="live">
          <i aria-hidden="true" /> Live
        </span>
        <button className="refresh-button" onClick={() => void refreshAll(true)} disabled={isRefreshing}>
          <span aria-hidden="true">↻</span> {isRefreshing ? "refreshing…" : "refresh"}
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
                <b className={`tab-badge ${badge <= 10 ? "critical" : badge <= 20 ? "warning" : "healthy"}`}>
                  {badge}%
                </b>
              )}
              {!!data.error && !data.usage && <i className="tab-error" aria-hidden="true">×</i>}
              {!available && !badgeLimit && <i className="tab-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="tab-content">
        <ProviderSection provider={tab} data={providers[tab]} clock={clock} />
      </div>

      <footer className="app-footer">
        <span>Data stays local to this Mac.</span>
        {activeUsage && <span>Last snapshot: {formatDate(activeUsage.observedAt)}</span>}
      </footer>
    </main>
  );
}

export default App;
