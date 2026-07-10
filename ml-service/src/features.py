"""
Feature engineering — the device-agnostic layer.

Every biomarker is expressed as a robust z-deviation from the SUBJECT'S OWN
trailing baseline (rolling median / MAD), not a population value. This is what
lets a model trained on Fitbit/Oura public data transfer to a Whoop it never
saw: "+3 sigma sustained RHR rise" means the same thing on every device and
every person.

Columns in -> columns out is stable, so the same function serves training
(on public data) and live scoring (on Whoop). Keep RHR as the backbone signal
because it is the one field present in every public cohort AND on every Whoop.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# signals we try to use; RHR is required, the rest are used when present
BACKBONE = "resting_heart_rate"
OPTIONAL_SIGNALS = ["hrv_rmssd_milli", "respiratory_rate", "skin_temp_celsius",
                    "spo2_percentage", "sleep_performance"]

MAD_SCALE = 1.4826  # makes MAD a consistent estimator of std for normal data
BASELINE_WINDOW = 30
MIN_BASELINE_DAYS = 12  # min days before robust-z is defined; 12 (vs 14) recovers
                        # early-onset episodes on real Stanford data at negligible
                        # false-alarm cost (swept: +1/27 detected, FA held ~1/33)


def _robust_z(series: pd.Series, window: int = BASELINE_WINDOW) -> pd.Series:
    """Robust z-score of each day vs its own trailing window (shifted, causal)."""
    # shift(1) so today is scored against the PAST only — no leakage of today.
    past = series.shift(1)
    med = past.rolling(window, min_periods=MIN_BASELINE_DAYS).median()
    mad = (past - med).abs().rolling(window, min_periods=MIN_BASELINE_DAYS).median()
    spread = MAD_SCALE * mad
    spread = spread.replace(0, np.nan)
    return (series - med) / spread


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add per-subject robust-z features + short lag/slope features that capture the
    characteristic multi-day pre-symptom ramp. Expects columns: subject_id,
    day_index, resting_heart_rate (required) and any OPTIONAL_SIGNALS present.
    """
    df = df.sort_values(["subject_id", "day_index"]).copy()
    present = [BACKBONE] + [c for c in OPTIONAL_SIGNALS if c in df.columns]

    feat_cols: list[str] = []
    for sig in present:
        z = df.groupby("subject_id", group_keys=False)[sig].apply(_robust_z)
        zcol = f"z_{sig}"
        df[zcol] = z
        feat_cols.append(zcol)

        # 1-3 day deltas and a 3-day slope on the z-signal capture the ramp shape
        g = df.groupby("subject_id", group_keys=False)[zcol]
        for lag in (1, 2, 3):
            dcol = f"{zcol}_d{lag}"
            df[dcol] = g.diff(lag)
            feat_cols.append(dcol)
        scol = f"{zcol}_slope3"
        df[scol] = g.transform(lambda s: s.rolling(3, min_periods=2).mean() - s.shift(3))
        feat_cols.append(scol)

    df.attrs["feature_cols"] = feat_cols
    return df


def feature_columns(df: pd.DataFrame) -> list[str]:
    return df.attrs.get("feature_cols", [c for c in df.columns if c.startswith("z_")])
