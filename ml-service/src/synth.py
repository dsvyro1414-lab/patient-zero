"""
Synthetic labeled wearable dataset — a realistic stand-in for the Stanford
COVID-19 wearables data (Mishra et al. 2020) so the whole training pipeline
runs end-to-end BEFORE the real CSVs are dropped into ml-service/data/.

Each subject has a personal resting-heart-rate (RHR) baseline plus day-to-day
noise. A subset of subjects have one or two "infection" episodes: RHR ramps up
starting ~3 days before symptom onset, HRV drops inversely, respiratory rate
rises, then everything recovers over a week. Labels follow the same convention
as the real training target: a day inside [-3, +1] of symptom onset is positive.

The shape of these columns matches what `dataset.py` expects, so swapping in the
real Stanford export means implementing one loader, not rewriting the pipeline.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# training label window around symptom onset (days). day 0 == onset.
LABEL_PRE = 3   # positives start 3 days before symptoms (the pre-symptomatic window)
LABEL_POST = 1  # ... through 1 day after


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def _one_subject(subject_id: int, rng: np.random.Generator, n_days: int) -> pd.DataFrame:
    # personal baselines — this is exactly why we normalize per user later:
    # a healthy RHR of 48 for one person is an alarm for another.
    base_rhr = rng.normal(60, 8)
    base_hrv = rng.normal(65, 18)          # rMSSD-like, ms
    base_resp = rng.normal(14.5, 1.2)      # breaths/min
    base_sleep = rng.normal(85, 6)         # sleep performance %

    days = np.arange(n_days)
    # slow personal drift + weekly rhythm + daily noise
    drift = np.cumsum(rng.normal(0, 0.05, n_days))
    weekly = 1.2 * np.sin(2 * np.pi * days / 7 + rng.uniform(0, 6))

    rhr = base_rhr + drift + weekly + rng.normal(0, 1.6, n_days)
    hrv = base_hrv - 0.8 * drift - 0.6 * weekly + rng.normal(0, 5.0, n_days)
    resp = base_resp + 0.1 * drift + rng.normal(0, 0.4, n_days)
    sleep = base_sleep - 0.3 * weekly + rng.normal(0, 3.5, n_days)

    label = np.zeros(n_days, dtype=int)
    is_episode_day = np.zeros(n_days, dtype=int)
    onset_marks = np.zeros(n_days, dtype=int)

    # 60% of subjects get at least one illness episode
    n_episodes = rng.choice([0, 1, 1, 2], p=[0.4, 0.35, 0.15, 0.10])
    onsets: list[int] = []
    for _ in range(n_episodes):
        # keep episodes away from the very edges
        onset = int(rng.integers(35, n_days - 10))
        if any(abs(onset - o) < 15 for o in onsets):
            continue
        onsets.append(onset)

        # physiological ramp: begins ~4 days pre-onset, peaks near onset, decays ~7 days
        severity = rng.uniform(0.7, 1.4)
        rhr_bump = severity * rng.uniform(6, 12)     # bpm at peak
        hrv_drop = severity * rng.uniform(18, 34)    # ms at peak
        resp_bump = severity * rng.uniform(1.5, 3.0) # breaths/min at peak
        sleep_drop = severity * rng.uniform(8, 18)   # sleep performance pts at peak
        for d in range(n_days):
            delta = d - onset
            if -4 <= delta <= 8:
                # asymmetric bell: slow rise pre-onset, longer decay post
                if delta <= 0:
                    w = np.exp(-((delta) ** 2) / (2 * 2.2 ** 2))
                else:
                    w = np.exp(-((delta) ** 2) / (2 * 3.5 ** 2))
                rhr[d] += rhr_bump * w
                hrv[d] -= hrv_drop * w
                resp[d] += resp_bump * w
                sleep[d] -= sleep_drop * w
                is_episode_day[d] = 1
        onset_marks[onset] = 1
        lo, hi = max(0, onset - LABEL_PRE), min(n_days - 1, onset + LABEL_POST)
        label[lo:hi + 1] = 1

    df = pd.DataFrame(
        {
            "subject_id": f"synuser_{subject_id:03d}",
            "day_index": days,
            "resting_heart_rate": np.round(rhr, 1),
            "hrv_rmssd_milli": np.round(np.clip(hrv, 12, None), 1),
            "respiratory_rate": np.round(resp, 2),
            "sleep_performance": np.round(np.clip(sleep, 20, 100), 1),
            "label": label,               # 1 == pre-symptomatic / illness window
            "onset": onset_marks,         # 1 on the exact symptom-onset day
            "episode": is_episode_day,    # 1 on any physiologically-affected day
        }
    )
    return df


def make_synthetic(n_subjects: int = 120, n_days: int = 140, seed: int = 7) -> pd.DataFrame:
    """Return a per-subject-per-day dataframe with illness labels."""
    rng = _rng(seed)
    frames = [
        _one_subject(i, _rng(int(rng.integers(0, 1_000_000))), n_days)
        for i in range(n_subjects)
    ]
    out = pd.concat(frames, ignore_index=True)
    return out


if __name__ == "__main__":
    df = make_synthetic()
    n_pos = int(df["label"].sum())
    print(f"subjects={df.subject_id.nunique()} rows={len(df)} "
          f"positives={n_pos} ({100*n_pos/len(df):.1f}%) "
          f"subjects_with_illness={df.groupby('subject_id').onset.max().sum()}")
