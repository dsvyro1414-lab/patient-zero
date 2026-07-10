"""
Build ml-service/data/stanford.csv from the REAL Stanford COVID-19 Wearables
release (Mishra et al. 2020, Nat Biomed Eng) — the "trained on real data" core.

Two public inputs (both open, no application):
  1. COVID-19-Wearables.zip  — per-subject minute/second-level Fitbit heart-rate
     and steps CSVs.  https://storage.googleapis.com/gbsc-gcp-project-ipop_public/
     COVID-19/COVID-19-Wearables.zip
  2. The paper's Supplementary Data workbook (41551_2020_640_MOESM3_ESM.xlsx),
     sheet `SuppTable3_Fig2a_COVID-19` — per-subject COVID-19 symptom-onset and
     diagnosis dates.  The zip carries NO labels; this workbook is the label source.
     Both the CSV timestamps and these dates are PHI-shifted by the SAME per-subject
     offset, so their RELATIVE alignment (onset vs. physiology) is preserved.

Output columns match ml-service/data/README.md so train.py just picks it up:
    subject_id, day_index, resting_heart_rate, onset
`onset` = 1 on the COVID symptom-onset day; dataset.py derives the [-3,+1] label.

Resting heart rate follows the Stanford/Bogu definition: heart-rate minutes with
no steps in the trailing 12 minutes, aggregated to a daily median.

Run:  python data/build_stanford.py \
        --zip /path/COVID-19-Wearables.zip --xlsx /path/MOESM3_ESM.xlsx
"""
from __future__ import annotations

import argparse
import io
import os
import re
import subprocess
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DEFAULT = os.path.join(HERE, "stanford.csv")

REST_STEP_WINDOW = 12       # minutes of zero steps that define "resting"
MIN_RESTING_MIN = 20        # need >= this many resting minutes to trust a day's RHR
MASK_PAD_DAYS = 5           # days padded around non-COVID illness windows to exclude


def _dates_in(cell: object) -> list[pd.Timestamp]:
    """Pull every YYYY-MM-DD out of a stringified list-of-Timestamp cell."""
    if not isinstance(cell, str):
        return []
    return [pd.Timestamp(d) for d in re.findall(r"(\d{4}-\d{2}-\d{2})", cell)]


def load_labels(xlsx: str) -> tuple[pd.DataFrame, dict]:
    """Return (covid_onsets, other_illness_windows) from the supplementary workbook.

    covid_onsets: DataFrame[pid, onset_date] — the COVID episode's symptom onset
        (symptom date nearest to, and preferably on/before, the COVID diagnosis;
        falls back to the diagnosis date when no symptom date exists).
    other_illness_windows: {pid: [(start, end), ...]} for NON-COVID sick spells,
        used to exclude confounded days from the healthy negatives.
    """
    t3 = pd.read_excel(xlsx, sheet_name="SuppTable3_Fig2a_COVID-19", header=3)
    t3 = t3.rename(columns={t3.columns[0]: "pid", t3.columns[1]: "cat",
                            t3.columns[2]: "symptom", t3.columns[3]: "diag"})
    onsets = []
    for _, r in t3[t3["cat"] == "COVID-19"].iterrows():
        sym, dia = _dates_in(r["symptom"]), _dates_in(r["diag"])
        onset = None
        if sym and dia:
            d0 = dia[0]
            before = [s for s in sym if s <= d0]
            onset = max(before) if before else min(sym, key=lambda s: abs(s - d0))
        elif sym:
            onset = min(sym)
        elif dia:
            onset = dia[0]
        if onset is not None:
            onsets.append({"pid": r["pid"], "onset_date": onset})
    covid = pd.DataFrame(onsets)

    # non-COVID illness windows to mask (SuppTable4 has per-episode start/end/diagnosis)
    t4 = pd.read_excel(xlsx, sheet_name="SuppTable4_Fig2a_Illnesses", header=4)
    t4 = t4.rename(columns={t4.columns[0]: "pid", t4.columns[1]: "start",
                            t4.columns[2]: "end", t4.columns[6]: "diagnosis"})
    windows: dict[str, list] = {}
    for _, r in t4.iterrows():
        diag = str(r.get("diagnosis", ""))
        if "COVID-19" in diag:            # COVID spells are labelled via onset, keep them
            continue
        start = pd.to_datetime(r["start"], errors="coerce")
        end = pd.to_datetime(r["end"], errors="coerce")
        if pd.isna(start):
            continue
        if pd.isna(end):
            end = start
        windows.setdefault(r["pid"], []).append((start, end))
    return covid, windows


def _read_csv_from_zip(zip_path: str, entry: str) -> pd.DataFrame | None:
    """Stream one CSV out of the zip without extracting the whole 3.6 GB archive."""
    try:
        out = subprocess.run(["unzip", "-p", zip_path, entry],
                             capture_output=True, check=True).stdout
    except subprocess.CalledProcessError:
        return None
    if not out:
        return None
    return pd.read_csv(io.BytesIO(out))


def daily_rhr(hr: pd.DataFrame, steps: pd.DataFrame) -> pd.DataFrame:
    """Per-day resting heart rate: median HR over steps-free minutes."""
    hr = hr.rename(columns={c: c.lower() for c in hr.columns})
    steps = steps.rename(columns={c: c.lower() for c in steps.columns})
    hr["datetime"] = pd.to_datetime(hr["datetime"], errors="coerce")
    steps["datetime"] = pd.to_datetime(steps["datetime"], errors="coerce")
    hr = hr.dropna(subset=["datetime", "heartrate"])
    steps = steps.dropna(subset=["datetime", "steps"])
    if hr.empty:
        return pd.DataFrame(columns=["date", "resting_heart_rate"])

    # collapse to one row per minute
    hrm = (hr.set_index("datetime")["heartrate"].resample("1min").mean().dropna())
    stm = (steps.set_index("datetime")["steps"].resample("1min").sum())
    m = pd.DataFrame({"hr": hrm}).join(pd.DataFrame({"steps": stm}), how="left")
    m["steps"] = m["steps"].fillna(0.0)

    # resting = no steps in this minute or the trailing REST_STEP_WINDOW minutes
    trailing = m["steps"].rolling(REST_STEP_WINDOW, min_periods=1).sum()
    resting = m["hr"][trailing == 0]
    if resting.empty:
        return pd.DataFrame(columns=["date", "resting_heart_rate"])

    g = resting.groupby(resting.index.normalize())
    daily = g.median().to_frame("resting_heart_rate")
    daily["n"] = g.size()
    daily = daily[daily["n"] >= MIN_RESTING_MIN].drop(columns="n")
    daily.index.name = "date"
    return daily.reset_index()


def subject_ids_from_zip(zip_path: str) -> dict[str, dict]:
    """Map subject_id -> {'hr': entry, 'steps': entry} using the main (non-longterm) files."""
    listing = subprocess.run(["unzip", "-l", zip_path],
                             capture_output=True, text=True, check=True).stdout
    entries = re.findall(r"(COVID-19-Wearables/\S+\.csv)", listing)
    subs: dict[str, dict] = {}
    for e in entries:
        base = os.path.basename(e)
        m = re.match(r"([A-Z0-9]+?)(?:_\d)?_(hr|steps)(?:_longterm)?\.csv$", base)
        if not m:
            continue
        sid, kind = m.group(1), m.group(2)
        longterm = "_longterm" in base
        rec = subs.setdefault(sid, {})
        # prefer the main study-window file over the longterm one
        if kind not in rec or (rec[kind][1] and not longterm):
            rec[kind] = (e, longterm)
    return {sid: {k: v[0] for k, v in rec.items()} for sid, rec in subs.items()}


def build(zip_path: str, xlsx: str, out: str) -> None:
    covid, other_windows = load_labels(xlsx)
    onset_by_pid = dict(zip(covid["pid"], covid["onset_date"]))
    subs = subject_ids_from_zip(zip_path)
    print(f"[labels] COVID onsets={len(onset_by_pid)}  "
          f"subjects_with_other_illness_masks={len(other_windows)}")
    print(f"[zip] subjects with hr+steps: "
          f"{sum('hr' in v and 'steps' in v for v in subs.values())}/{len(subs)}")

    rows = []
    for i, (sid, files) in enumerate(sorted(subs.items()), 1):
        if "hr" not in files or "steps" not in files:
            continue
        hr = _read_csv_from_zip(zip_path, files["hr"])
        steps = _read_csv_from_zip(zip_path, files["steps"])
        if hr is None or steps is None:
            continue
        daily = daily_rhr(hr, steps)
        if daily.empty:
            print(f"  ({i}/{len(subs)}) {sid}: no resting days")
            continue
        daily = daily.sort_values("date").reset_index(drop=True)
        d0 = daily["date"].min()
        daily["subject_id"] = sid
        daily["day_index"] = (daily["date"] - d0).dt.days

        # COVID onset marker
        daily["onset"] = 0
        onset_flag = ""
        if sid in onset_by_pid:
            od = pd.Timestamp(onset_by_pid[sid]).normalize()
            hit = daily.index[daily["date"] == od]
            if len(hit):
                daily.loc[hit, "onset"] = 1
                onset_flag = f" onset@day{int(daily.loc[hit[0],'day_index'])}"
            else:
                onset_flag = " onset-OUT-OF-RANGE"

        # drop confounded non-COVID illness days
        drop = pd.Series(False, index=daily.index)
        for (s, e) in other_windows.get(sid, []):
            s = pd.Timestamp(s).normalize() - pd.Timedelta(days=MASK_PAD_DAYS)
            e = pd.Timestamp(e).normalize() + pd.Timedelta(days=MASK_PAD_DAYS)
            drop |= daily["date"].between(s, e)
        kept = daily[~drop]

        rows.append(kept[["subject_id", "day_index", "resting_heart_rate", "onset"]])
        print(f"  ({i}/{len(subs)}) {sid}: {len(kept)} days"
              f"{' [COVID]' if sid in onset_by_pid else ''}{onset_flag}"
              f"{f' masked={int(drop.sum())}' if drop.any() else ''}")

    out_df = pd.concat(rows, ignore_index=True)
    out_df["resting_heart_rate"] = out_df["resting_heart_rate"].round(2)
    out_df.to_csv(out, index=False)
    n_onset_sub = out_df.groupby("subject_id")["onset"].max().sum()
    print(f"\n[done] {out}")
    print(f"  subjects={out_df.subject_id.nunique()} rows={len(out_df)} "
          f"covid_onset_subjects={int(n_onset_sub)} onset_days={int(out_df.onset.sum())}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--zip", required=True, help="path to COVID-19-Wearables.zip")
    ap.add_argument("--xlsx", required=True, help="path to 41551_2020_640_MOESM3_ESM.xlsx")
    ap.add_argument("--out", default=OUT_DEFAULT)
    a = ap.parse_args()
    if not os.path.exists(a.zip) or not os.path.exists(a.xlsx):
        sys.exit(f"missing input: zip={a.zip} xlsx={a.xlsx}")
    build(a.zip, a.xlsx, a.out)
