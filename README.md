# Patient Zero — pre-symptomatic illness radar for Whoop

Your body starts fighting an infection before you feel it. Patient Zero connects
to your Whoop, learns *your* physiological baseline, and raises a flag when your
vitals drift the way they do in the days before symptoms — while you sleep.

Built solo for the **ML Empowerment Build Challenge 2.0** (AI for Health).

**▶ Live demo: https://patient-zero-two.vercel.app** — open **Replay** for the
money-shot (a real Stanford COVID case scored day by day) and **Report** for the
honest metrics. Frontend on Vercel, ML service on Railway.

> **Not a medical device.** It outputs a physiological anomaly flag consistent
> with early illness, never a diagnosis.

## What it actually does, in honest numbers

Validated on the **real Stanford COVID-19 Wearables** cohort (Mishra et al. 2020):
116 people, 27 lab-confirmed COVID episodes, daily resting heart rate from Fitbit.

| Metric | Result |
|---|---|
| **Caught *before* symptoms** | **8 / 27 episodes (30%)**, median **5 days** early |
| Caught within ±2 days of onset | 16 / 27 (59%), median 1.5 days early |
| False alarms | ~1 per **31** healthy days |
| Trained classifier (secondary) | ROC-AUC 0.55 — near chance on one channel |

The headline is the **pre-symptomatic** row: an alarm that fires *strictly before*
the first symptom. The ±2-day row is the standard detection window used in the
literature; it also counts alarms that land a day or two after symptoms begin, so
we don't lead with it. Every number here is what `ml-service/models/metrics.json`
reports — open it and check.

30% with a 5-day head start, from **resting heart rate alone**, is roughly in line
with the published Stanford result. It is a screening flag, not a test.

## How it works

Two layers, with clear roles:

1. **Changepoint monitor — the primary detector.** For each signal it keeps a
   personal robust baseline (rolling median + MAD) and runs a one-sided CUSUM,
   then fuses the signals into one *Health Deviation Index*. It alarms on a
   sustained, corroborated, multi-day shift — the same RHR-Diff idea as the
   Stanford COVID papers. No labels needed; this is what runs live and drives the
   replay demo.
2. **Gradient-boosted classifier — a secondary, honestly-reported layer.** Trained
   with subject-level cross-validation and probability calibration. On single-channel
   Stanford data it is weak (AUC 0.55), and we say so rather than hide it. It is the
   answer to *"you can't train on n=1"* — the model learns from a public labeled
   cohort, then transfers because every feature is a subject-normalized robust
   z-score that means the same thing on any device.

**Causal by construction.** Every baseline is computed from *past days only*
(`shift(1)` before the rolling window), and the CUSUM only accumulates forward.
The lead times above are achievable in real time, not with hindsight.

## A real example: my own Whoop

I exported 54 days of my own Whoop history (a 4.0 strap, so all five signals:
resting HR, HRV, respiratory rate, skin temperature, sleep). My journal has one
"feeling sick" episode, and the export gives the detector something Stanford never
could — five channels instead of one.

**The day before my first logged symptom, the signal was clearly there:**

| Signal | Deviation |
|---|---|
| Resting heart rate | **+2.7σ** |
| HRV | **−4.7σ** |
| Respiratory rate | +0.0σ |
| Skin temperature | +0.6σ |
| Sleep performance | −0.4σ |

Two channels screamed; three were quiet. The detector **did not fire** — the
weighted-mean gate came to 1.56 against a 2.38 threshold, because averaging over
five channels diluted the two loud ones. And it produced **zero false alarms**
across the healthy weeks of the export.

I'm showing this exactly as it happened, for two reasons:

- The multi-channel **fusion rule cannot be tuned honestly on Stanford**, because a
  one-signal cohort can't tell a mean from a sum from a max. Lowering the gate so
  this one episode lights up would be tuning on a sample of one. So I didn't.
- Honesty note: my journal also flags seasonal allergies that week, so this may be
  an allergic, not infectious, episode — another reason to treat it as an
  illustration, not a result.

The open problem this surfaces — how to combine five noisy channels so two strong
movers aren't washed out — is exactly the kind of thing a larger multi-signal
cohort (or more of my own episodes) would let me answer properly.

## Quickstart

```bash
# ML service
cd ml-service
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
python src/train.py --source stanford     # writes models/metrics.json
cd src && uvicorn app:app --port 8000

# web (second terminal)
cd web && npm install && npm run dev       # http://localhost:3000
```

The real `stanford.csv` and the trained `model.joblib` are committed, so a fresh
clone reproduces the numbers above without the 378 MB data re-download. To rebuild
the dataset from scratch, see `ml-service/data/README.md`.

## Repo layout

```
ml-service/
  src/features.py       device-agnostic robust-z features (causal, shift(1))
  src/changepoint.py    personal baseline + CUSUM + fused index  ← primary detector
  src/train.py          subject-level CV + calibration → metrics.json
  src/dataset.py        loads the real stanford.csv (or synthetic fallback)
  src/whoop_client.py   Whoop v2 OAuth + backfill → daily frame
  src/app.py            FastAPI: /evaluate, /score-history, /demo
  data/build_stanford.py   builds stanford.csv from the public dataset
  experiments/          reproducible ablations, incl. a documented negative result
web/                    Next.js dashboard — Connect, Today, Replay timeline, Report
```

## Honesty / safety

- **Not a diagnosis.** A physiological flag, nothing more.
- All accuracy numbers are on held-out public Stanford subjects, single-channel
  resting HR. The detector's operating point was chosen on that same cohort, which
  we disclose on the Report screen.
- The five-channel version is **not yet validated** — a single-signal cohort can't
  test the fusion rule. We don't claim multi-signal superiority.
- No lookahead: baselines use past days only; lead times are real-time-achievable.
