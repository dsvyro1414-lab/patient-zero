import type { DayRecord } from "./api";

export type RiskLevel = "low" | "moderate" | "high";

export function scoreForRecord(record: DayRecord): number | null {
  return record.decision_status === "available" ? record.risk_score : null;
}

export function levelForRecord(record: DayRecord): RiskLevel | null {
  if (record.decision_status !== "available" || record.risk_band == null) return null;
  return record.risk_band === "elevated" ? "high" : record.risk_band;
}
