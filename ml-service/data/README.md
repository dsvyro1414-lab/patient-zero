# Training data

The pipeline runs on **synthetic data out of the box** (see `src/synth.py`) so
you can train and demo today. To train on the **real public datasets** — the
whole point of the project — drop a CSV here.

## Drop-in format: `stanford.csv`

One row per subject per day, with at least:

| column | required | meaning |
|---|---|---|
| `subject_id` | ✅ | stable id per person |
| `day_index` | ✅ | integer day counter per subject (0,1,2,…) |
| `resting_heart_rate` | ✅ | RHR in bpm (the backbone signal) |
| `label` | ✅* | 1 on days inside `[-3, +1]` of symptom onset, else 0 |
| `onset` | optional | 1 on the exact symptom-onset day (enables lead-time metrics) |
| `hrv_rmssd_milli` | optional | HRV rMSSD (ms) |
| `respiratory_rate` | optional | breaths/min (present in Oura data, not Stanford Fitbit) |
| `skin_temp_celsius` | optional | skin temperature |

\* If you only have `onset` (not `label`), the loader derives `label` for you.

## Real datasets to train on

| dataset | signals | access | notes |
|---|---|---|---|
| **Stanford COVID-19 Wearables** (Mishra et al. 2020, *Nat Biomed Eng*) | Fitbit RHR, steps, sleep | public release | canonical; RHR-only, no resp-rate/skin-temp |
| **Alavi et al. 2022** (*Nat Medicine*) | larger Fitbit cohort + RHR alarm algorithm | public | good method reference |
| **Oura TemPredict** (Mason et al. 2022, UCSF) | skin temp, resp-rate, HRV, RHR | application-gated | gold fit for Whoop features — apply early |
| **Warrior Watch** (Mount Sinai, Hirten 2021) | Apple Watch HRV | public | HRV-focused |

Verify the current download link for each before committing (access details drift).
Because features are **subject-normalized robust z-scores**, a model trained on
Fitbit RHR transfers to your Whoop; resp-rate + skin-temp are additive when a
dataset (or your Whoop) provides them.

## Honest note on metrics

The headline is the **changepoint detector**, not the classifier. On the real
Stanford cohort it flags **8/27 COVID episodes (30%) before symptoms**, median
lead **5 days**, at ~1 false alarm per 31 healthy days (see `../models/metrics.json`).

The gradient-boosted classifier is a **secondary** layer: on single-channel
resting HR it only reaches **AUC ≈ 0.55**, near chance. That is a limit of one
noisy channel, not of the method — and we report it as-is rather than hide it.
Synthetic data is clean and yields an optimistic ~0.99, which is why the numbers
that matter come from the real cohort.
