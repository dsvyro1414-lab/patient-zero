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
FUSED_ALARM = 4.5   # fused index threshold (tuned on real Stanford data with
                    # MIN_BASELINE_DAYS=12: ~1 false alarm per 33 healthy days at
                    # 15/27 = 56% episode detection, 3-day median lead)
MIN_CORROBORATING = 2  # require >=2 signals moving together (when >=2 exist)
MIN_RUN = 1         # require the alarm condition to hold this many days in a row

# detection-evaluation window: an alarm within [onset-PRE, onset+POST] counts as a catch
DETECT_PRE = 7
DETECT_POST = 2


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


def analyze(history: pd.DataFrame, *, cusum_slack: float = CUSUM_SLACK,
            cusum_limit: float = CUSUM_LIMIT, fused_alarm: float = FUSED_ALARM,
            min_corroborating: int = MIN_CORROBORATING,
            min_run: int = MIN_RUN) -> pd.DataFrame:
    """
    history: one subject, columns day_index + available biomarkers.
    Returns per-day z-scores, per-signal CUSUM, fused Health Deviation Index,
    and an `alarm` flag — the data the replay timeline renders.

    Thresholds are parameters (defaults are the tuned module constants) so the
    operating point can be swept against the labelled data; see evaluate_detection.
    """
    df = history.sort_values("day_index").reset_index(drop=True).copy()
    present_rise = [s for s in RISE_SIGNALS if s in df.columns]
    present_drop = [s for s in DROP_SIGNALS if s in df.columns]

    contribs = pd.DataFrame(index=df.index)
    for sig in present_rise:
        z = _causal_robust_z(df[sig])
        df[f"z_{sig}"] = z
        df[f"cusum_{sig}"] = _cusum(z.values, cusum_slack)
        contribs[sig] = WEIGHTS[sig] * np.clip(z.values, 0, None)
    for sig in present_drop:
        z = _causal_robust_z(df[sig])
        df[f"z_{sig}"] = z
        df[f"cusum_{sig}"] = _cusum((-z).values, cusum_slack)  # HRV dropping == rising
        contribs[sig] = WEIGHTS[sig] * np.clip(-z.values, 0, None)

    df["health_deviation_index"] = contribs.sum(axis=1).round(3)
    corroborating = (contribs > 1.0).sum(axis=1)          # signals >1 sigma off
    cusum_cols = [c for c in df.columns if c.startswith("cusum_")]
    any_cusum = ((df[cusum_cols] > cusum_limit).any(axis=1) if cusum_cols
                 else pd.Series(False, index=df.index))

    # Adapt to how many biomarkers are actually present. Multi-signal Whoop data
    # can demand corroboration across channels; single-signal public data (e.g.
    # Stanford Fitbit = resting HR only) must alarm on the one channel it has —
    # this is exactly the RHR-Diff regime from the COVID-19 wearables papers.
    n_signals = len(present_rise) + len(present_drop)
    min_corr = min(min_corroborating, max(1, n_signals))
    hdi_gate = fused_alarm * min_corr / MIN_CORROBORATING   # scale gate to signal count

    raw = (
        (df["health_deviation_index"] >= hdi_gate)
        & (corroborating >= min_corr)
        & any_cusum
    )
    # require the condition to persist min_run days in a row (causal) — one-off
    # spikes on a healthy day are the main false-alarm source; a sustained run is
    # the infection signature. Alarm fires on the day the run completes.
    if min_run > 1:
        fired = raw.rolling(min_run, min_periods=min_run).sum() >= min_run
    else:
        fired = raw
    df["alarm"] = fired.fillna(False).astype(bool)
    df["corroborating_signals"] = corroborating
    return df


def evaluate_detection(df: pd.DataFrame, onset_col: str = "onset",
                       pre: int = DETECT_PRE, post: int = DETECT_POST,
                       recover: int = 14, **params) -> dict:
    """
    Honest per-episode detection metrics for the changepoint monitor — the
    number the Report card should lead with (the classifier is secondary).

    An episode is "detected" if an alarm fires within [onset-pre, onset+post];
    lead time = onset - first such alarm day (positive = early warning). False
    alarms are counted on healthy days (outside [onset-pre, onset+post+recover]
    for illness subjects; every day for never-ill subjects).
    """
    signals = [c for c in (RISE_SIGNALS + DROP_SIGNALS) if c in df.columns]
    onsets = ({r.subject_id: int(r.day_index)
               for r in df[df[onset_col] == 1].itertuples()}
              if onset_col in df.columns else {})
    detected = total = fa = healthy = 0
    leads: list[int] = []
    for sid, g in df.groupby("subject_id"):
        res = analyze(g[["day_index"] + signals].copy(), **params)
        alarms = res.loc[res["alarm"], "day_index"].tolist()
        if sid in onsets:
            od = onsets[sid]
            total += 1
            win = [a for a in alarms if od - pre <= a <= od + post]
            if win:
                detected += 1
                leads.append(od - min(win))
            mask = ~res["day_index"].between(od - pre, od + post + recover)
        else:
            mask = pd.Series(True, index=res.index)
        healthy += int(mask.sum())
        fa += int((res["alarm"] & mask).sum())

    sens = detected / total if total else None
    fa_rate = fa / healthy if healthy else 0.0
    return {
        "method": "changepoint (RHR-Diff / CUSUM)",
        "signals_used": signals,
        "n_episodes": total,
        "episodes_detected": detected,
        "detection_sensitivity": round(sens, 3) if sens is not None else None,
        "median_lead_time_days": float(np.median(leads)) if leads else None,
        "mean_lead_time_days": round(float(np.mean(leads)), 2) if leads else None,
        "false_alarm_rate_per_day": round(fa_rate, 4),
        "false_alarm_per_days": round(1 / fa_rate, 1) if fa_rate > 0 else None,
        "detection_window": [pre, post],
    }


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
