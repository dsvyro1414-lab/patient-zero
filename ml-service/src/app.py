"""
FastAPI ML microservice — the boundary the Next.js frontend calls.

Endpoints:
  GET  /health          liveness
  GET  /evaluate        the trained model's honest metrics (metrics.json + ROC)
  POST /score-history   score a subject's biomarker series -> per-day scores +
                        changepoint alarms (powers the replay timeline + webhook)
  GET  /demo            a ready-made scored sick-episode from the demo dataset

Run:  uvicorn app:app --reload --port 8000     (from ml-service/src)
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from typing import Literal

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from score import score_history, load_model

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

app = FastAPI(title="Whoop Early-Warning ML Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


class DayRecord(BaseModel):
    day_index: int
    as_of: datetime | None = None
    resting_heart_rate: float
    hrv_rmssd_milli: float | None = None
    respiratory_rate: float | None = None
    skin_temp_celsius: float | None = None
    spo2_percentage: float | None = None


class ScoreRequest(BaseModel):
    subject_id: str = "user"
    source_mode: Literal["personal_export", "personal_live", "synthetic_test"] = "synthetic_test"
    provider: str | None = Field(default=None, max_length=80)
    history: list[DayRecord] = Field(..., min_length=1)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_loaded": load_model() is not None}


@app.get("/evaluate")
def evaluate() -> dict:
    """Return the trained model's held-out metrics — the credibility panel."""
    mpath = os.path.join(MODELS_DIR, "metrics.json")
    rpath = os.path.join(MODELS_DIR, "roc.json")
    if not os.path.exists(mpath):
        raise HTTPException(404, "No metrics — run `python src/train.py` first.")
    with open(mpath) as f:
        metrics = json.load(f)
    roc = json.load(open(rpath)) if os.path.exists(rpath) else None
    return {"metrics": metrics, "roc": roc}


@app.post("/score-history")
def score(req: ScoreRequest) -> dict:
    df = pd.DataFrame([r.model_dump() for r in req.history])
    df["subject_id"] = req.subject_id
    integration_status = "implemented" if req.source_mode == "synthetic_test" else "planned"
    return score_history(
        df,
        source_mode=req.source_mode,
        integration_status=integration_status,
        provider=req.provider,
        adapter_version="legacy-direct-history-v1",
        provenance={"input": "score-history", "index": "day_index"},
    )


@app.get("/demo")
def demo() -> dict:
    """Score a real illness episode from the loaded dataset for the replay demo."""
    from dataset import STANFORD_CSV, load
    data, src = load()
    # prefer a subject with exactly ONE clean episode and enough baseline
    # before + recovery after it, so the replay is a legible "money shot".
    sid = None
    if "onset" in data.columns:
        for s, g in data.groupby("subject_id"):
            onsets = g.loc[g["onset"] == 1, "day_index"].tolist()
            if len(onsets) == 1 and 45 <= onsets[0] <= g["day_index"].max() - 14:
                sid = s
                break
        if sid is None and (data["onset"] == 1).any():
            sid = data.loc[data["onset"] == 1, "subject_id"].iloc[0]
    if sid is None:
        sid = data["subject_id"].unique()[0]
    sub = data[data["subject_id"] == sid]
    source_mode = "research_demo" if src == "stanford" else "synthetic_test"
    if src == "stanford" and os.path.exists(STANFORD_CSV):
        with open(STANFORD_CSV, "rb") as dataset_file:
            dataset_version = f"sha256:{hashlib.sha256(dataset_file.read()).hexdigest()}"
    else:
        dataset_version = "synthetic-generator-v1"
    result = score_history(
        sub,
        source_mode=source_mode,
        integration_status="implemented",
        provider="fitbit" if src == "stanford" else None,
        adapter_version=f"legacy-{src}-loader-v1",
        dataset_version=dataset_version,
        demo_case_id=str(sid),
        provenance={"dataset": src, "index": "day_index"},
    )
    result["source"] = src
    result["subject_id"] = str(sid)
    if "onset" in sub.columns and (sub["onset"] == 1).any():
        result["onset_day"] = int(sub.loc[sub["onset"] == 1, "day_index"].iloc[0])
    else:
        result["onset_day"] = None
    return result
