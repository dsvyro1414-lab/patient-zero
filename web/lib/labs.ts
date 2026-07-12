// Lab catalog + shared request/response contract for the "summary for your
// doctor" feature (HANDOFF §12, Part 2). Pure data — imported by both the client
// form and the server route handler.
//
// PHI note: the values a user types stay in React state (this session only) and
// are POSTed to /api/labs-summary, which forwards them to Claude and returns the
// summary WITHOUT persisting anything. Never log or store lab values.

import type { Locale } from "./i18n";
import type { RiskLevel } from "./forecast";

export type LabKey =
  | "crp"
  | "wbc"
  | "neutrophils_pct"
  | "lymphocytes_pct"
  | "procalcitonin"
  | "esr";

export interface LabDef {
  key: LabKey;
  unit: string;
  /** typical adult reference range — shown ONLY as a neutral data-entry hint,
   *  never as an app-side "normal/abnormal" judgement (the doctor interprets). */
  refHint: string;
  step: number;
  /** sanity clamp for the numeric input (rejects fat-finger values) */
  max: number;
}

// A tight, infection/inflammation-relevant panel — the markers most often on a
// CBC + CRP order. Kept small on purpose: useful, not overwhelming.
export const LAB_DEFS: LabDef[] = [
  { key: "crp", unit: "mg/L", refHint: "< 5", step: 0.1, max: 600 },
  { key: "wbc", unit: "×10⁹/L", refHint: "4.0–11.0", step: 0.1, max: 100 },
  { key: "neutrophils_pct", unit: "%", refHint: "40–75", step: 1, max: 100 },
  { key: "lymphocytes_pct", unit: "%", refHint: "20–45", step: 1, max: 100 },
  { key: "procalcitonin", unit: "ng/mL", refHint: "< 0.1", step: 0.01, max: 100 },
  { key: "esr", unit: "mm/h", refHint: "< 20", step: 1, max: 150 },
];

export const LAB_BY_KEY: Record<LabKey, LabDef> = Object.fromEntries(
  LAB_DEFS.map((d) => [d.key, d]),
) as Record<LabKey, LabDef>;

// Stable English lab names for the model prompt, so the instruction is identical
// regardless of the user's UI language ({locale} controls the OUTPUT language).
export const LAB_LABEL_EN: Record<LabKey, string> = {
  crp: "C-reactive protein (CRP)",
  wbc: "White blood cell count (WBC / leukocytes)",
  neutrophils_pct: "Neutrophils",
  lymphocytes_pct: "Lymphocytes",
  procalcitonin: "Procalcitonin (PCT)",
  esr: "ESR (erythrocyte sedimentation rate)",
};

// Human-readable signal names for the physiological timeline in the prompt.
export const SIGNAL_EN: Record<string, string> = {
  resting_heart_rate: "resting heart rate",
  respiratory_rate: "respiratory rate",
  hrv_rmssd_milli: "heart-rate variability (HRV)",
  skin_temp_celsius: "skin temperature",
  sleep_performance: "sleep performance",
  spo2_percentage: "blood oxygen (SpO₂)",
};

export const MAX_OTHER_CHARS = 1500;
export const MAX_NOTE_CHARS = 800;

// ---- request / response contract (client ⇄ /api/labs-summary) ----

export interface LabEntry {
  key: LabKey;
  value: number;
}

export interface PhysioSummary {
  riskLevel: RiskLevel;
  riskPct: number;
  alarm: boolean;
  /** days the detector's alarm led the user's symptom onset (demo subject) */
  leadDays: number | null;
  topSignals: { key: string; z: number }[];
}

export interface LabsSummaryRequest {
  locale: Locale;
  labs: LabEntry[];
  otherResults?: string;
  symptomsNote?: string;
  physio?: PhysioSummary | null;
}

export interface LabsSummaryResponse {
  summary: string;
}

export type LabsSummaryError =
  | "ai_unconfigured"
  | "bad_request"
  | "no_input"
  | "refused"
  | "empty"
  | "rate_limited"
  | "ai_error"
  | "server_error";
