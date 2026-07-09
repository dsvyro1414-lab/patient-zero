// Signal metadata — shared by the Why panel, the timeline legend, and charts.

export type SignalKey =
  | "resting_heart_rate"
  | "respiratory_rate"
  | "hrv_rmssd_milli"
  | "skin_temp_celsius"
  | "sleep_performance";

export interface SignalMeta {
  key: SignalKey;
  label: string;
  short: string;
  color: string;
  direction: "rise" | "drop"; // which way it moves during illness
}

export const SIGNALS: SignalMeta[] = [
  { key: "resting_heart_rate", label: "RHR", short: "RHR", color: "#ef4444", direction: "rise" },
  { key: "respiratory_rate", label: "Respiratory Rate", short: "Resp", color: "#f97316", direction: "rise" },
  { key: "hrv_rmssd_milli", label: "HRV", short: "HRV", color: "#3b82f6", direction: "drop" },
  { key: "skin_temp_celsius", label: "Skin Temperature", short: "Temp", color: "#14b8a6", direction: "rise" },
  { key: "sleep_performance", label: "Sleep Performance", short: "Sleep", color: "#8b5cf6", direction: "drop" },
];

export const SIGNAL_BY_KEY: Record<string, SignalMeta> = Object.fromEntries(
  SIGNALS.map((s) => [s.key, s]),
);

export const COLOR = {
  hdi: "#16a34a",
  prob: "#7c3aed",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
};

/** Format a z-score like "+2.4σ" / "-2.1σ". */
export function fmtZ(z: number): string {
  return `${z >= 0 ? "+" : ""}${z.toFixed(1)}σ`;
}
