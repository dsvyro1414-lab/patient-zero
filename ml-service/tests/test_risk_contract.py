from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from risk_contract import BAND_VERSION, build_risk_contract


def contract(*, hdi: float, source_mode: str = "research_demo", signals=None) -> dict:
    available = ["resting_heart_rate"] if signals is None else signals
    return build_risk_contract(
        hdi=hdi,
        source_mode=source_mode,
        integration_status="implemented",
        available_signals=available,
        missing_signals=[],
        as_of=None,
        provider=None,
        adapter_version="test-v1",
        dataset_version="test-data-v1",
        demo_case_id="case-1",
        provenance={"dataset": "test"},
    )


class RiskContractTests(unittest.TestCase):
    def test_available_research_score_and_band_are_backend_owned(self) -> None:
        result = contract(hdi=2.4)
        self.assertEqual(result["decision_status"], "available")
        self.assertEqual(result["risk_score"], 69)
        self.assertEqual(result["risk_band"], "elevated")
        self.assertEqual(result["band_version"], BAND_VERSION)
        self.assertIsNone(result["calibrated_probability"])
        self.assertFalse(result["probability_available"])

    def test_warmup_abstains_instead_of_returning_zero(self) -> None:
        result = contract(hdi=0.0, signals=[])
        self.assertEqual(result["decision_status"], "warming")
        self.assertIsNone(result["risk_score"])
        self.assertIsNone(result["risk_band"])
        self.assertEqual(result["reason_codes"], ["baseline_warming"])

    def test_personal_mode_is_not_released(self) -> None:
        result = contract(hdi=2.4, source_mode="personal_export")
        self.assertEqual(result["decision_status"], "unsupported")
        self.assertIsNone(result["risk_score"])
        self.assertEqual(result["reason_codes"], ["personal_scoring_not_released"])

    def test_band_boundaries_are_versioned(self) -> None:
        self.assertEqual(contract(hdi=1.03)["risk_band"], "low")
        self.assertEqual(contract(hdi=1.05)["risk_band"], "moderate")
        self.assertEqual(contract(hdi=2.275)["risk_band"], "elevated")


if __name__ == "__main__":
    unittest.main()
