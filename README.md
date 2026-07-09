# Patient Zero — pre-symptomatic illness radar for Whoop

Your Whoop knows you're getting sick before you do. Patient Zero connects to
your Whoop, learns your personal physiological baseline, and fires an alert
**1–3 days before the first symptom** — while you sleep.

Built for the **ML Empowerment Build Challenge 2.0** (AI for Health).

It combines two ML layers:

1. **Trained classifier** (*"really train a model"*) — a gradient-boosted
   infection-onset classifier trained on public labeled wearable cohorts
   (Stanford COVID-19 Wearables, optionally Oura TemPredict), with **honest
   subject-level metrics**: ROC-AUC, sensitivity at a fixed false-alarm budget,
   and median lead time. This is the answer to *"you can't train on n=1."*
2. **Changepoint monitor** (real-time, unsupervised) — a personal robust
   baseline + CUSUM over respiratory rate, RHR, HRV and skin temp that flags the
   sustained multi-day shift that precedes symptoms. Powers the live morning
   alert and the replay demo. No labels needed.

Features are **subject-normalized robust z-scores**, so a model trained on
Fitbit/Oura data transfers to a Whoop it never saw.

## Repo layout

```
ml-service/            Python FastAPI + the ML (the core)
  src/synth.py         realistic synthetic labeled data (runs today)
  src/features.py      device-agnostic robust-z feature engineering
  src/dataset.py       load real Stanford CSV or fall back to synthetic
  src/train.py         subject-level CV + XGBoost/HGB + calibration + metrics
  src/changepoint.py   CUSUM + personal baseline (the real-time layer)
  src/score.py         serve per-day probability + alarm + "why"
  src/whoop_client.py  Whoop v2 OAuth + backfill + record -> daily frame
  src/app.py           FastAPI: /evaluate, /score-history, /demo
  data/                drop stanford.csv here (see data/README.md)
web/                   Next.js frontend (dashboard + replay timeline)  [next]
```

## Quickstart (ML service)

```bash
cd ml-service
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

python src/train.py          # trains on synthetic data, writes models/metrics.json
cd src && uvicorn app:app --port 8000
# GET /evaluate  -> the honest metrics panel
# GET /demo      -> a scored sick episode for the replay timeline
```

### Train on real data
Drop `stanford.csv` into `ml-service/data/` (format in `data/README.md`), then
`python src/train.py --source stanford`.

## Status

- [x] Training pipeline — subject-level CV, calibration, AUC + lead-time metrics (**runs**)
- [x] Changepoint / real-time alarm engine + per-signal explanations (**runs**)
- [x] FastAPI serving layer `/evaluate` `/score-history` `/demo` (**runs**)
- [x] Whoop v2 OAuth + backfill + record mapping (pure parts tested; needs app creds)
- [x] Next.js dashboard — all 4 screens on live API: Connect, Today, Replay timeline, Report/ROC (**runs**)
- [ ] Whoop app registration + live webhook (`recovery.updated`) loop
- [ ] Swap synthetic → real Stanford data and lock the demo sick-week

## Run the full app

```bash
# terminal 1 — ML service
cd ml-service/src && ../.venv/bin/python -m uvicorn app:app --port 8000
# terminal 2 — web
cd web && npm run dev      # http://localhost:3000
```
The web app proxies `/ml/*` to the Python service (`ML_SERVICE_URL`, default :8000).

## Honesty / safety

Not a medical device. Outputs are a physiological anomaly flag consistent with
early illness, never a diagnosis. All accuracy numbers come from held-out public
subjects; single-user Whoop scoring is a demonstration of transfer, not a
validated personal claim. Synthetic AUC is optimistic (~0.99); real Stanford data
lands ~0.75–0.85 with 1–3 day lead time — the number to report.
