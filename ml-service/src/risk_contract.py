"""Versioned, backend-owned Risk Score contract.

This module deliberately has no pandas/FastAPI dependency so the score policy
can be unit-tested in isolation. The current score is an experimental anomaly
severity scale for research demos; it is not an illness probability.
"""
from __future__ import annotations

from typing import Literal

RiskBand = Literal["low", "moderate", "elevated"]
DecisionStatus = Literal[
    "available", "warming", "insufficient_data", "stale", "unsupported", "error"
]
SourceMode = Literal[
    "research_demo", "personal_export", "personal_live", "synthetic_test"
]

RISK_MODE = "score"
SCORE_DEFINITION_ID = "legacy-hdi-severity-v1"
SCORE_VERSION = "legacy-hdi-linear-3.5-v1"
BAND_VERSION = "legacy-score-bands-30-65-v1"
RISK_SCORE_HDI_CAP = 3.5
MODERATE_MIN = 30
ELEVATED_MIN = 65

_SCORE_ENABLED_SOURCES = {"research_demo", "synthetic_test"}


def score_from_deviation(hdi: float) -> int:
    """Map HDI to the temporary versioned 0-100 research score."""
    return max(0, min(100, int(round((float(hdi) / RISK_SCORE_HDI_CAP) * 100))))


def band_from_score(score: int) -> RiskBand:
    """Apply the single backend-owned band policy."""
    if score >= ELEVATED_MIN:
        return "elevated"
    if score >= MODERATE_MIN:
        return "moderate"
    return "low"


def build_risk_contract(
    *,
    hdi: float,
    source_mode: SourceMode,
    integration_status: str,
    available_signals: list[str],
    missing_signals: list[str],
    as_of: str | None,
    provider: str | None,
    adapter_version: str,
    dataset_version: str | None,
    demo_case_id: str | None,
    provenance: dict[str, str | int | None],
) -> dict:
    """Build one complete score-only contract for a single observation."""
    reason_codes: list[str] = []
    baseline_status = "ready" if available_signals else "warming"
    quality_status = "sufficient" if available_signals else "insufficient"

    if source_mode not in _SCORE_ENABLED_SOURCES:
        decision_status: DecisionStatus = "unsupported"
        reason_codes.append("personal_scoring_not_released")
    elif not available_signals:
        decision_status = "warming"
        reason_codes.append("baseline_warming")
    else:
        decision_status = "available"

    risk_score = score_from_deviation(hdi) if decision_status == "available" else None
    risk_band = band_from_score(risk_score) if risk_score is not None else None

    return {
        "as_of": as_of,
        "source_mode": source_mode,
        "integration_status": integration_status,
        "provider": provider,
        "adapter_version": adapter_version,
        "dataset_version": dataset_version,
        "demo_case_id": demo_case_id,
        "provenance": provenance,
        "risk_mode": RISK_MODE,
        "risk_score": risk_score,
        "risk_band": risk_band,
        "band_version": BAND_VERSION,
        "decision_status": decision_status,
        "reason_codes": reason_codes,
        "calibrated_probability": None,
        "probability_available": False,
        "probability_supported_for": [],
        "score_definition_id": SCORE_DEFINITION_ID,
        "score_version": SCORE_VERSION,
        "target_definition_id": None,
        "prediction_horizon_days": None,
        "baseline_status": baseline_status,
        "data_quality": {
            "status": quality_status,
            "available_signals": available_signals,
            "missing_signals": missing_signals,
        },
        "model_version": None,
        "calibration_version": None,
    }
