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
MIN_BASELINE_DAYS = 12  # days of personal history before robust-z is defined.
                        # This is now the TRUE warmup: see robust_z(). It used to
                        # be 2x this because MAD was taken about a lagged median.


# How the personal spread (sigma) is estimated from the trailing window:
#   "window_mad" — textbook MAD about the window median. Inflates while a signal
#                  is ramping, which shrinks z exactly during a multi-day illness
#                  ramp — the regime we care about.
#   "diff_mad"   — MAD of successive differences, rescaled. Trend-robust by
#                  construction (a linear drift cancels in the differences), the
#                  standard robust scale for changepoint work. Default.
#   "lagged_mad" — MAD of each past day's residual from its OWN trailing median,
#                  i.e. the scale of the one-step-ahead innovation. Also trend-
#                  robust, and smoother than diff_mad.
SPREAD_ESTIMATOR = "lagged_mad"
_DIFF_SCALE = np.sqrt(2.0)   # median|x_t - x_{t-1}| = 0.6745 * sigma * sqrt(2)
MIN_SPREAD_DAYS = 3          # residuals needed before the innovation scale is trusted


def _window_mad(window_values: np.ndarray) -> float:
    """Median absolute deviation about the window's own median, ignoring gaps."""
    w = window_values[~np.isnan(window_values)]
    if w.size == 0:
        return np.nan
    return float(np.median(np.abs(w - np.median(w))))


def _diff_mad(window_values: np.ndarray) -> float:
    """Trend-robust scale: MAD of successive differences within the window."""
    w = window_values[~np.isnan(window_values)]
    if w.size < 2:
        return np.nan
    return float(np.median(np.abs(np.diff(w))) / _DIFF_SCALE)


def robust_z(series: pd.Series, window: int = BASELINE_WINDOW,
             estimator: str = None) -> pd.Series:
    """Robust z-score of each day vs its own trailing window (shifted, causal)."""
    # shift(1) so today is scored against the PAST only — no leakage of today.
    past = series.shift(1)
    med = past.rolling(window, min_periods=MIN_BASELINE_DAYS).median()
    # The spread must be computable as soon as `med` is. Deriving it from
    # (past - med) instead makes it wait for `med` to exist first, so z only
    # appears after 2 * MIN_BASELINE_DAYS — silently doubling the warmup and
    # making early-onset episodes undetectable by construction.
    est = estimator or SPREAD_ESTIMATOR
    if est == "lagged_mad":
        # residual of each past day from the baseline it was scored against; the
        # deviations stay small while the signal drifts, which is what keeps the
        # detector sensitive to a slow multi-day ramp.
        mad = (past - med).abs().rolling(window, min_periods=MIN_SPREAD_DAYS).median()
    else:
        fn = _diff_mad if est == "diff_mad" else _window_mad
        mad = past.rolling(window, min_periods=MIN_BASELINE_DAYS).apply(fn, raw=True)
    spread = (MAD_SCALE * mad).replace(0, np.nan)
    return (series - med) / spread


_robust_z = robust_z  # backwards-compatible alias


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
