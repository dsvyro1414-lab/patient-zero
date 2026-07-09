"""
Dataset loader — one interface, two sources.

- If a real export exists at ml-service/data/stanford.csv it is used.
- Otherwise the pipeline falls back to the synthetic generator so `train.py`
  runs end-to-end today.

To plug in the REAL Stanford COVID-19 wearables data (Mishra et al. 2020):
drop a CSV at ml-service/data/stanford.csv with (at minimum) these columns:
    subject_id, day_index, resting_heart_rate, label
plus any of: hrv_rmssd_milli, respiratory_rate, skin_temp_celsius, onset.
`label` = 1 for days inside the pre-symptomatic window [-3, +1] of onset.
If you only have raw RHR + a symptom-onset date per subject, use
`label_from_onset()` to generate the label column.
"""
from __future__ import annotations

import os

import numpy as np
import pandas as pd

from synth import make_synthetic, LABEL_PRE, LABEL_POST

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
STANFORD_CSV = os.path.join(DATA_DIR, "stanford.csv")

REQUIRED = ["subject_id", "day_index", "resting_heart_rate", "label"]


def label_from_onset(df: pd.DataFrame, onset_col: str = "onset") -> pd.DataFrame:
    """Derive the [-LABEL_PRE, +LABEL_POST] training label from onset markers."""
    df = df.sort_values(["subject_id", "day_index"]).copy()
    df["label"] = 0
    for _, g in df.groupby("subject_id"):
        onset_days = g.loc[g[onset_col] == 1, "day_index"].tolist()
        for od in onset_days:
            mask = (df["subject_id"] == g["subject_id"].iloc[0]) & \
                   (df["day_index"].between(od - LABEL_PRE, od + LABEL_POST))
            df.loc[mask, "label"] = 1
    return df


def load(source: str = "auto") -> tuple[pd.DataFrame, str]:
    """
    Return (dataframe, source_name). source in {"auto","stanford","synthetic"}.
    """
    if source in ("auto", "stanford") and os.path.exists(STANFORD_CSV):
        df = pd.read_csv(STANFORD_CSV)
        if "label" not in df.columns and "onset" in df.columns:
            df = label_from_onset(df)
        missing = [c for c in REQUIRED if c not in df.columns]
        if missing:
            raise ValueError(f"stanford.csv missing required columns: {missing}")
        return df, "stanford"

    if source == "stanford":
        raise FileNotFoundError(
            f"No real dataset at {STANFORD_CSV}. See ml-service/data/README.md."
        )

    return make_synthetic(), "synthetic"


if __name__ == "__main__":
    df, src = load()
    print(f"source={src} subjects={df.subject_id.nunique()} rows={len(df)} "
          f"positives={int(df.label.sum())}")
