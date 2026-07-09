"""
Changepoint core — the real-time, personalized layer (the "Patient Zero" side).

The trained classifier is the brain; this is the honest, unsupervised monitor
that runs on the user's live Whoop stream and powers the replay demo. It needs
no labels: a rolling robust baseline (median/MAD) plus a one-sided CUSUM on the
physiologically strongest signals (respiratory rate, RHR, skin temp rising; HRV
dropping) flags the sustained multi-day shift that precedes symptoms.

This is exactly how Whoop/Oura/Stanford research frames infection onset — a
sustained regime shift, not a single noisy spike — which is why daily-granularity
data is the right regime for it, not a limitation.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from features import MAD_SCALE, BASELINE_WINDOW, MIN_BASELINE_DAYS

# signals that RISE during illness, and HRV which DROPS (entered as -z)
RISE_SIGNALS = ["respiratory_rate", "resting_heart_rate", "skin_temp_celsius"]
DROP_SIGNALS = ["hrv_rmssd_milli", "sleep_performance"]
# respiratory rate is the single most predictive field in Whoop's COVID study
WEIGHTS = {"respiratory_rate": 1.6, "resting_heart_rate": 1.2,
           "skin_temp_celsius": 1.0, "hrv_rmssd_milli": 1.0,
           "sleep_performance": 0.8}

CUSUM_SLACK = 0.5   # k: ignore drifts smaller than half a std
CUSUM_LIMIT = 4.0   # h: alarm when accumulated deviation exceeds this
FUSED_ALARM = 3.0   # fused index threshold
MIN_CORROBORATING = 2  # require >=2 signals moving together


def _causal_robust_z(x: pd.Series) -> pd.Series:
    past = x.shift(1)
    med = past.rolling(BASELINE_WINDOW, min_periods=MIN_BASELINE_DAYS).median()
    mad = (past - med).abs().rolling(BASELINE_WINDOW, min_periods=MIN_BASELINE_DAYS).median()
    spread = (MAD_SCALE * mad).replace(0, np.nan)
    return (x - med) / spread


def _cusum(z: np.ndarray, slack: float = CUSUM_SLACK) -> np.ndarray:
    """One-sided upper CUSUM: accumulates sustained positive deviations."""
    s = np.zeros(len(z))
    acc = 0.0
    for i, v in enumerate(z):
        if np.isnan(v):
            acc = 0.0
        else:
            acc = max(0.0, acc + v - slack)
        s[i] = acc
    return s


def analyze(history: pd.DataFrame) -> pd.DataFrame:
    """
    history: one subject, columns day_index + available biomarkers.
    Returns per-day z-scores, per-signal CUSUM, fused Health Deviation Index,
    and an `alarm` flag — the data the replay timeline renders.
    """
    df = history.sort_values("day_index").reset_index(drop=True).copy()
    present_rise = [s for s in RISE_SIGNALS if s in df.columns]
    present_drop = [s for s in DROP_SIGNALS if s in df.columns]

    contribs = pd.DataFrame(index=df.index)
    for sig in present_rise:
        z = _causal_robust_z(df[sig])
        df[f"z_{sig}"] = z
        df[f"cusum_{sig}"] = _cusum(z.values)
        contribs[sig] = WEIGHTS[sig] * np.clip(z.values, 0, None)
    for sig in present_drop:
        z = _causal_robust_z(df[sig])
        df[f"z_{sig}"] = z
        df[f"cusum_{sig}"] = _cusum((-z).values)  # HRV dropping == signal rising
        contribs[sig] = WEIGHTS[sig] * np.clip(-z.values, 0, None)

    df["health_deviation_index"] = contribs.sum(axis=1).round(3)
    corroborating = (contribs > 1.0).sum(axis=1)          # signals >1 sigma off
    cusum_cols = [c for c in df.columns if c.startswith("cusum_")]
    any_cusum = (df[cusum_cols] > CUSUM_LIMIT).any(axis=1) if cusum_cols else False

    df["alarm"] = (
        (df["health_deviation_index"] >= FUSED_ALARM)
        & (corroborating >= MIN_CORROBORATING)
        & any_cusum
    )
    df["corroborating_signals"] = corroborating
    return df


def top_contributors(row: pd.Series, k: int = 3) -> list[dict]:
    """Human-readable 'why' for an alarm: which signals moved and by how much."""
    out = []
    for sig in RISE_SIGNALS + DROP_SIGNALS:
        zc = f"z_{sig}"
        if zc in row and pd.notna(row[zc]):
            out.append({"signal": sig, "z": round(float(row[zc]), 2)})
    out.sort(key=lambda d: abs(d["z"]), reverse=True)
    return out[:k]


if __name__ == "__main__":
    from dataset import load
    df, _ = load()
    sub = df[df.subject_id == df.subject_id.unique()[0]]
    res = analyze(sub)
    fired = res[res.alarm]
    print(f"days={len(res)} alarms={len(fired)} "
          f"alarm_days={fired.day_index.tolist()[:8]}")
