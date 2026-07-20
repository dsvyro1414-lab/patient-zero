"""
Serving logic — score a subject's biomarker history with the personal
changepoint monitor and return the score used by the frontend timeline.

The trained classifier remains available for offline Research evaluation, but
its uncalibrated per-day output is deliberately not exposed by this serving
contract. The product currently exposes one score based on deviation from the
user's personal baseline.
"""
from __future__ import annotations

import os

import joblib
import pandas as pd

from changepoint import analyze, top_contributors, RISE_SIGNALS, DROP_SIGNALS
from risk_contract import SourceMode, build_risk_contract

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_MODEL_CACHE: dict | None = None


def load_model() -> dict | None:
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        path = os.path.join(MODELS_DIR, "model.joblib")
        _MODEL_CACHE = joblib.load(path) if os.path.exists(path) else None
    return _MODEL_CACHE


def score_history(
    history: pd.DataFrame,
    *,
    source_mode: SourceMode = "synthetic_test",
    integration_status: str = "implemented",
    provider: str | None = None,
    adapter_version: str = "legacy-direct-history-v1",
    dataset_version: str | None = None,
    demo_case_id: str | None = None,
    provenance: dict[str, str | int | None] | None = None,
) -> dict:
    """
    history: one subject, columns day_index + biomarkers (RHR required).
    Returns per-day score records and a summary — the exact payload the replay
    timeline renders.
    """
    hist = history.sort_values("day_index").reset_index(drop=True).copy()
    if "subject_id" not in hist.columns:
        hist["subject_id"] = "user"

    # changepoint / personalized layer
    cp = analyze(hist)

    bundle = load_model()

    all_signals = RISE_SIGNALS + DROP_SIGNALS
    configured_signals = [signal for signal in all_signals if signal in cp.columns]
    base_provenance = provenance or {"input": "score-history", "index": "day_index"}
    records = []
    for _, row in cp.iterrows():
        hdi = float(row["health_deviation_index"])
        signals = {}
        for sig in all_signals:
            zc = f"z_{sig}"
            if zc in row and pd.notna(row[zc]):
                signals[sig] = round(float(row[zc]), 2)
        available_signals = sorted(signals)
        missing_signals = sorted(set(configured_signals) - set(available_signals))
        as_of = None
        for time_field in ("as_of", "local_date", "date"):
            if time_field in row and pd.notna(row[time_field]):
                value = row[time_field]
                as_of = value.isoformat() if hasattr(value, "isoformat") else str(value)
                break
        contract = build_risk_contract(
            hdi=hdi,
            source_mode=source_mode,
            integration_status=integration_status,
            available_signals=available_signals,
            missing_signals=missing_signals,
            as_of=as_of,
            provider=provider,
            adapter_version=adapter_version,
            dataset_version=dataset_version,
            demo_case_id=demo_case_id,
            provenance={**base_provenance, "day_index": int(row["day_index"])},
        )
        records.append({
            "day_index": int(row["day_index"]),
            **contract,
            "health_deviation_index": hdi,
            "corroborating_signals": int(row["corroborating_signals"]),
            "alarm": bool(row["alarm"]),
            "signals": signals,          # per-signal z-scores for the timeline
            "why": top_contributors(row),
        })

    fired = [r for r in records if r["alarm"]]
    if records:
        summary_contract = {
            key: value
            for key, value in records[-1].items()
            if key not in {
                "day_index", "health_deviation_index", "corroborating_signals",
                "alarm", "signals", "why",
            }
        }
    else:
        summary_contract = build_risk_contract(
            hdi=0.0,
            source_mode=source_mode,
            integration_status=integration_status,
            available_signals=[],
            missing_signals=configured_signals,
            as_of=None,
            provider=provider,
            adapter_version=adapter_version,
            dataset_version=dataset_version,
            demo_case_id=demo_case_id,
            provenance=base_provenance,
        )
    return {
        **summary_contract,
        "model_loaded": bundle is not None,
        "n_days": len(records),
        "n_alarms": len(fired),
        "first_alarm_day": fired[0]["day_index"] if fired else None,
        "records": records,
    }


if __name__ == "__main__":
    from dataset import load
    df, _ = load()
    # pick a subject that actually has an episode for a meaningful demo
    sick = df.groupby("subject_id").onset.max()
    sid = sick[sick == 1].index[0] if (sick == 1).any() else df.subject_id.unique()[0]
    out = score_history(df[df.subject_id == sid])
    print(f"subject={sid} model_loaded={out['model_loaded']} "
          f"days={out['n_days']} alarms={out['n_alarms']} "
          f"first_alarm_day={out['first_alarm_day']}")
