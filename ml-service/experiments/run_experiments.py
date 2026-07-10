"""
Reproducible ML experiments behind the Patient Zero design choices. Run:

    ../.venv/bin/python experiments/run_experiments.py

Three studies, all honest (including a negative result we did NOT ship):
  1. Signal ablation  — how detection scales with the number of biomarkers.
  2. Baseline-warmup  — how MIN_BASELINE_DAYS trades detection vs false alarms.
  3. Classifier fusion — does feeding changepoint state into the classifier help?

See experiments/README.md for the interpretation.
"""
from __future__ import annotations

import os
import sys

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "src")
DATA = os.path.join(HERE, "..", "data", "stanford.csv")
sys.path.insert(0, SRC)

import changepoint          # noqa: E402
import features            # noqa: E402
import synth               # noqa: E402
from dataset import label_from_onset  # noqa: E402


def _oof_auc(df: pd.DataFrame, extra_cols: list[str] | None = None) -> tuple[float, int]:
    feat = features.build_features(df)
    cols = list(features.feature_columns(feat)) + (extra_cols or [])
    cols = [c for c in cols if c in feat.columns]
    data = feat.dropna(subset=cols).reset_index(drop=True)
    X, y = data[cols].values, data["label"].values.astype(int)
    g = data["subject_id"].values
    oof = np.zeros(len(data))
    for tr, te in GroupKFold(min(5, data["subject_id"].nunique())).split(X, y, g):
        clf = HistGradientBoostingClassifier(max_iter=350, max_depth=4, learning_rate=0.05,
                                             l2_regularization=1.5, class_weight="balanced",
                                             random_state=0)
        clf.fit(X[tr], y[tr])
        oof[te] = clf.predict_proba(X[te])[:, 1]
    return float(roc_auc_score(y, oof)), len(cols)


def ablation() -> None:
    print("\n== 1. SIGNAL ABLATION (synthetic — multi-signal available) ==")
    print("   NOTE: synthetic is clean, so absolute AUCs are optimistic; read the")
    print("   TREND (more signals -> better), not the levels. Real single-channel")
    print("   Stanford sits far lower (see study 2).")
    syn = synth.make_synthetic()
    sets = [
        (["resting_heart_rate"], "RHR only (= Stanford)"),
        (["resting_heart_rate", "hrv_rmssd_milli"], "RHR + HRV"),
        (["resting_heart_rate", "hrv_rmssd_milli", "respiratory_rate"], "RHR + HRV + resp"),
        (["resting_heart_rate", "hrv_rmssd_milli", "respiratory_rate", "sleep_performance"],
         "+ sleep (all)"),
    ]
    print(f"   {'signals':<26}{'clf_AUC':>9}{'detect':>9}{'lead':>7}")
    keep = ["subject_id", "day_index", "label", "onset", "episode"]
    for sig, name in sets:
        auc, _ = _oof_auc(syn[keep + sig].copy())
        det = changepoint.evaluate_detection(syn[["subject_id", "day_index", "onset"] + sig].copy())
        print(f"   {name:<26}{auc:>9.3f}{det['detection_sensitivity']:>9.2f}"
              f"{str(det['median_lead_time_days']):>7}")


def baseline_warmup() -> None:
    print("\n== 2. BASELINE-WARMUP SWEEP (real Stanford, RHR only) ==")
    real = pd.read_csv(DATA)
    orig = features.MIN_BASELINE_DAYS
    print(f"   {'MIN_BASELINE_DAYS':<20}{'detect':>9}{'lead':>7}{'FA/days':>9}")
    for mbd in (14, 12, 10, 8):
        features.MIN_BASELINE_DAYS = mbd   # changepoint reads it through features.robust_z
        det = changepoint.evaluate_detection(real)
        d = f"{det['episodes_detected']}/{det['n_episodes']}"
        fa = f"~1/{det['false_alarm_per_days']}"
        star = "  <- shipped" if mbd == 12 else ""
        print(f"   {mbd:<20}{d:>9}{str(det['median_lead_time_days']):>7}{fa:>9}{star}")
    features.MIN_BASELINE_DAYS = orig


def spread_estimator() -> None:
    """Which robust scale estimator to normalise each signal by.

    Selection rule, fixed before looking: hold false alarms at <= 1 per 30 SCORABLE
    healthy days, then maximise PRE-SYMPTOMATIC sensitivity (alarm strictly before
    the first symptom), ties broken by median pre-symptomatic lead, then lower gate.
    """
    print("\n== 4. SPREAD-ESTIMATOR ABLATION (real Stanford, RHR only) ==")
    real = pd.read_csv(DATA)
    orig = features.SPREAD_ESTIMATOR
    budget = 30.0
    print(f"   {'estimator':<12}{'gate':>7}{'detect':>9}{'presympt':>10}{'p-lead':>8}{'FA/days':>9}")
    for est in ("window_mad", "diff_mad", "lagged_mad"):
        features.SPREAD_ESTIMATOR = est
        best = None
        for gate in [x / 1000 for x in range(750, 6001, 125)]:
            det = changepoint.evaluate_detection(real, fused_alarm=gate)
            fa = det["false_alarm_per_days"]
            if fa is None or fa < budget:
                continue
            key = (det["presymptomatic_sensitivity"] or 0,
                   det["median_lead_presymptomatic_days"] or 0, -gate)
            if best is None or key > best[0]:
                best = (key, gate, det)
        if best is None:
            print(f"   {est:<12}{'—':>7}   (no config inside the false-alarm budget)")
            continue
        _, gate, det = best
        d = f"{det['episodes_detected']}/{det['n_episodes']}"
        p = f"{det['episodes_presymptomatic']}/{det['n_episodes']}"
        star = "  <- shipped" if est == "lagged_mad" else ""
        print(f"   {est:<12}{gate:>7.3f}{d:>9}{p:>10}"
              f"{str(det['median_lead_presymptomatic_days']):>8}"
              f"{'~1/' + str(det['false_alarm_per_days']):>9}{star}")
    features.SPREAD_ESTIMATOR = orig
    print("   -> the textbook window-MAD inflates while a signal ramps, which shrinks z")
    print("      exactly during the multi-day illness ramp. Deviations from the running")
    print("      median (lagged_mad) stay small under drift and catch the ramp earlier.")
    print("   NOTE: single-channel data cannot separate the multi-signal FUSION rule —")
    print("      mean, sum and max are identical when only one signal is present.")


def fusion() -> None:
    print("\n== 3. CLASSIFIER FUSION (real Stanford) — NEGATIVE RESULT, not shipped ==")
    real = pd.read_csv(DATA)
    real = label_from_onset(real) if "label" not in real.columns else real
    base, nb = _oof_auc(real.copy())

    sigs = [c for c in (changepoint.RISE_SIGNALS + changepoint.DROP_SIGNALS) if c in real.columns]
    aug = []
    for _, g in real.groupby("subject_id"):
        res = changepoint.analyze(g[["day_index"] + sigs].copy())
        r = g.sort_values("day_index").reset_index(drop=True).copy()
        cp = [c for c in res.columns if c.startswith("cusum_")] + ["health_deviation_index"]
        for c in cp:
            r[c] = res[c].values
        aug.append(r)
    aug = pd.concat(aug, ignore_index=True)
    cp_cols = [c for c in aug.columns if c.startswith("cusum_")] + ["health_deviation_index"]
    fused, nf = _oof_auc(aug, extra_cols=cp_cols)
    print(f"   robust-z features only:      AUC={base:.3f} ({nb} feats)")
    print(f"   + CUSUM + HDI (fused):       AUC={fused:.3f} ({nf} feats)  delta={fused-base:+.3f}")
    print("   -> changepoint state is a nonlinear transform of the same z-scores;")
    print("      the tree already extracts it. Added complexity, no gain -> not shipped.")


if __name__ == "__main__":
    ablation()
    baseline_warmup()
    spread_estimator()
    fusion()
