export type UsageSource = "codex_app_server" | "cursor_dashboard_api";

export interface ProviderUsage {
  provider: string;
  accountLabel: string | null;
  observedAt: number;
  source: UsageSource;
  limits: UsageLimit[];
}

export interface UsageLimit {
  id: string;
  name: string;
  usedPercent: number;
  remainingPercent: number;
  resetAt: number | null;
  windowDurationMinutes: number | null;
  metadata?: Record<string, unknown>;
}
