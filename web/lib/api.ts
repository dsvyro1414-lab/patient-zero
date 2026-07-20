// API types + server-side fetch helpers for the Python ML service.

export type RiskMode = "score";
export type RiskBand = "low" | "moderate" | "elevated";
export type DecisionStatus =
  | "available"
  | "warming"
  | "insufficient_data"
  | "stale"
  | "unsupported"
  | "error";
export type SourceMode =
  | "research_demo"
  | "personal_export"
  | "personal_live"
  | "synthetic_test";
export type IntegrationStatus = "planned" | "implemented" | "e2e_verified";
export type BaselineStatus = "warming" | "ready" | "stale" | "frozen" | "recovery";

export interface DataQuality {
  status: "sufficient" | "insufficient";
  available_signals: string[];
  missing_signals: string[];
}

export interface RiskContract {
  as_of: string | null;
  source_mode: SourceMode;
  integration_status: IntegrationStatus;
  provider: string | null;
  adapter_version: string;
  dataset_version: string | null;
  demo_case_id: string | null;
  provenance: Record<string, string | number | null>;
  risk_mode: RiskMode;
  risk_score: number | null;
  risk_band: RiskBand | null;
  band_version: string;
  decision_status: DecisionStatus;
  reason_codes: string[];
  calibrated_probability: null;
  probability_available: false;
  probability_supported_for: string[];
  score_definition_id: string;
  score_version: string;
  target_definition_id: null;
  prediction_horizon_days: null;
  baseline_status: BaselineStatus;
  data_quality: DataQuality;
  model_version: string | null;
  calibration_version: null;
}

export interface DayRecord extends RiskContract {
  day_index: number;
  health_deviation_index: number;
  corroborating_signals: number;
  alarm: boolean;
  signals: Record<string, number>;
  why: { signal: string; z: number }[];
}

export interface DemoResult extends RiskContract {
  source: string;
  subject_id: string;
  onset_day: number | null;
  n_days: number;
  n_alarms: number;
  first_alarm_day: number | null;
  model_loaded: boolean;
  records: DayRecord[];
}

export interface Detection {
  method: string;
  signals_used: string[];
  n_episodes: number;
  episodes_detected: number;
  detection_sensitivity: number | null;
  /** episodes whose first in-window alarm fired strictly BEFORE symptom onset */
  episodes_presymptomatic: number;
  presymptomatic_sensitivity: number | null;
  median_lead_presymptomatic_days: number | null;
  median_lead_time_days: number | null;
  mean_lead_time_days: number | null;
  false_alarm_rate_per_day: number;
  false_alarm_per_days: number | null;
  false_alarms: number;
  scorable_healthy_days: number;
  detection_window: [number, number];
}

export interface Metrics {
  source: string;
  model: string;
  subjects: number;
  positives: number;
  roc_auc: number;
  operating_threshold: number;
  episode_sensitivity: number | null;
  median_lead_time_days: number | null;
  healthy_false_alarm_rate: number;
  false_alarm_budget_per_days: number;
  detection?: Detection | null;
}

export interface EvaluateResult {
  metrics: Metrics;
  roc: { fpr: number[]; tpr: number[]; auc: number } | null;
}

const SERVER_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function getServer<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${SERVER_BASE}${path}`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const getDemo = () => getServer<DemoResult>("/demo");
export const getEvaluate = () => getServer<EvaluateResult>("/evaluate");
