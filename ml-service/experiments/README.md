# Experiments

Reproducible studies behind Patient Zero's ML choices — including the honest
negative results. Run:

```bash
../.venv/bin/python experiments/run_experiments.py
```

All numbers are subject-level held-out (no person leaks between train and test).

## 1. Signal ablation — why the real-data AUC is a *channel* limit, not a *method* limit

The trained per-day classifier scores **AUC ≈ 0.53** on the real Stanford cohort.
That looks low until you notice Stanford is **single-channel** (Fitbit resting HR
only). This ablation runs the identical pipeline on synthetic data while adding
biomarkers one at a time:

| signals | clf AUC | detection |
|---|---|---|
| RHR only (= Stanford) | 0.95 | 0.97 |
| RHR + HRV | 0.97 | 0.97 |
| RHR + HRV + respiratory rate | **0.99** | **1.00** |
| + sleep | 0.99 | 1.00 |

**Honest caveat:** synthetic data is clean, so the *absolute* levels are
optimistic — do not read 0.99 as a real-world number. Read the **trend**:
performance climbs steeply once respiratory rate is added, matching the
Whoop/Oura literature where respiratory rate is the single strongest infection
signal. The user's own Whoop provides RHR + HRV + respiratory rate + skin temp,
so it sits in the rich-signal regime, not the RHR-only floor. The *real*
multi-signal number can only be claimed once we score the user's own Whoop data.

## 2. Baseline-warmup sweep — recovering early-onset episodes

Robust z-scores need a trailing baseline before they are defined. Requiring 14
days silently drops COVID episodes whose onset falls in the first two weeks of a
subject's record. Sweeping `MIN_BASELINE_DAYS` on the real changepoint detector:

| MIN_BASELINE_DAYS | episodes detected | median lead | false alarms |
|---|---|---|---|
| 14 | 14/27 (52%) | 3 days | ~1 / 35 days |
| **12 (shipped)** | **15/27 (56%)** | **3 days** | **~1 / 33 days** |
| 10 | 15/27 (56%) | 3 days | ~1 / 31 days |
| 8 | 16/27 (59%) | 3 days | ~1 / 27 days |

We shipped **12**: it recovers an early-onset episode at negligible false-alarm
cost. Going lower keeps trading detection for noise; 8 buys one more episode but
pushes false alarms to ~1/27, past our ~1/30 target for a daily consumer alert.

## 3. Classifier fusion — a negative result we did *not* ship

Hypothesis: feeding the changepoint monitor's state (per-signal CUSUM + the
Health Deviation Index) into the classifier as extra features would lift the
real-data AUC.

| features | AUC |
|---|---|
| robust-z RHR features only | 0.534 |
| + CUSUM + Health Deviation Index | 0.489 |

It made things **worse**. The changepoint state is a deterministic nonlinear
transform of the same z-scores the gradient-boosted trees already see, so it adds
no information — only variance. We kept the two layers separate. Reporting this
because a pipeline that only ever shows wins is a pipeline that wasn't stress-tested.

## Bottom line

The honest headline is the **changepoint detector on real presymptomatic COVID:
15/27 = 56% of episodes caught, 3-day median lead, ~1 false alarm per 33 healthy
days**, from a single Fitbit channel — consistent with the published Stanford
work. The classifier is a secondary calibrated layer; it becomes strong only with
the richer multi-signal data the end user's Whoop actually provides.
