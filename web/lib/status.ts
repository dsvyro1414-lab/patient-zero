import type { DayRecord, DemoResult } from "./api";
import { levelForRecord } from "./risk-score";

export type Band = "green" | "amber" | "red";

export interface Status {
  band: Band;
  color: string;
}

// Import COLOR from signals (api re-exports nothing) — keep local map.
const BAND_COLOR: Record<Band, string> = {
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#ef4444",
};

export function bandFor(rec: DayRecord): Status | null {
  const level = levelForRecord(rec);
  if (level === "high") {
    return {
      band: "red",
      color: BAND_COLOR.red,
    };
  }
  if (level === "moderate") {
    return {
      band: "amber",
      color: BAND_COLOR.amber,
    };
  }
  if (level === "low") return {
    band: "green",
    color: BAND_COLOR.green,
  };
  return null;
}

/** Pick the day to show as "today" for the demo: the most telling recent day. */
export function pickToday(demo: DemoResult): DayRecord {
  const recs = demo.records;
  if (demo.first_alarm_day != null) {
    const a = recs.find(
      (r) => r.day_index === demo.first_alarm_day && r.decision_status === "available",
    );
    if (a) return a;
  }
  const available = recs.filter((r) => r.decision_status === "available");
  const candidates = available.length ? available : recs;
  return candidates.reduce((best, r) =>
    r.health_deviation_index > best.health_deviation_index ? r : best, candidates[0]);
}

export { BAND_COLOR };
