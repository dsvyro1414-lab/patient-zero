"""
Serving logic — score a subject's biomarker history with the trained model AND
the changepoint monitor, and return everything the frontend replay timeline and
the daily webhook alert need.

This is the seam where the two halves of the product meet:
  * trained classifier  -> calibrated infection probability + lead-time context
  * changepoint monitor -> real-time personalized alarm + per-signal "why"
"""
from __future__ import annotations

import os

import joblib
import numpy as np
import pandas as pd

from features import build_features, feature_columns
from changepoint import analyze, top_contributors, RISE_SIGNALS, DROP_SIGNALS

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
_MODEL_CACHE: dict | None = None


def load_model() -> dict | None:
    global _MODEL_CACHE
    if _MODEL_CACHE is None:
        path = os.path.join(MODELS_DIR, "model.joblib")
        _MODEL_CACHE = joblib.load(path) if os.path.exists(path) else None
    return _MODEL_CACHE


def score_history(history: pd.DataFrame) -> dict:
    """
    history: one subject, columns day_index + biomarkers (RHR required).
    Returns per-day records (probability + changepoint index + alarm) and a
    summary — the exact payload the replay timeline renders.
    """
    hist = history.sort_values("day_index").reset_index(drop=True).copy()
    if "subject_id" not in hist.columns:
        hist["subject_id"] = "user"

    # changepoint / personalized layer
    cp = analyze(hist)

    # trained-model probability layer (device-agnostic features)
    bundle = load_model()
    probs = np.full(len(hist), np.nan)
    if bundle is not None:
        feat = build_features(hist)
        cols = bundle["features"]
        for c in cols:
            if c not in feat.columns:
                feat[c] = np.nan
        usable = feat.dropna(subset=cols)
        if len(usable):
            p = bundle["model"].predict_proba(usable[cols].values)[:, 1]
            probs[usable.index.values] = p

    all_signals = RISE_SIGNALS + DROP_SIGNALS
    records = []
    for i, row in cp.iterrows():
        prob = probs[i]
        signals = {}
        for sig in all_signals:
            zc = f"z_{sig}"
            if zc in row and pd.notna(row[zc]):
                signals[sig] = round(float(row[zc]), 2)
        records.append({
            "day_index": int(row["day_index"]),
            "infection_probability": None if np.isnan(prob) else round(float(prob), 4),
            "health_deviation_index": float(row["health_deviation_index"]),
            "corroborating_signals": int(row["corroborating_signals"]),
            "alarm": bool(row["alarm"]),
            "signals": signals,          # per-signal z-scores for the timeline
            "why": top_contributors(row),
        })

    fired = [r for r in records if r["alarm"]]
    return {
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
