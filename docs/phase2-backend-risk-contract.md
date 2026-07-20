# Phase 2 — backend-owned Risk Score contract

Дата: 2026-07-18
Ветка: `codex/phase0-baseline-freeze`
Roadmap: `FUTURE_STEPS.md`, Phase 2

## Результат

ML service является единственным владельцем score transformation и band
policy. Frontend больше не содержит пороги `30/65`, HDI-to-score mapping или
отдельную HDI band formula.

Текущий score остаётся versioned legacy experimental score для
`research_demo`/`synthetic_test`:

```text
score_definition_id = legacy-hdi-severity-v1
score_version = legacy-hdi-linear-3.5-v1
band_version = legacy-score-bands-30-65-v1
```

Эти названия намеренно фиксируют legacy nature политики. Они не являются
calibration claim и не разрешают personal release.

## Contract

`GET /demo`, `POST /score-history`, summary и каждая `records[]` запись теперь
возвращают:

```json
{
  "as_of": null,
  "source_mode": "research_demo",
  "integration_status": "implemented",
  "provider": "fitbit",
  "adapter_version": "legacy-stanford-loader-v1",
  "dataset_version": "sha256:<full dataset hash>",
  "demo_case_id": "<subject id>",
  "provenance": {},
  "risk_mode": "score",
  "risk_score": 69,
  "risk_band": "elevated",
  "band_version": "legacy-score-bands-30-65-v1",
  "decision_status": "available",
  "reason_codes": [],
  "calibrated_probability": null,
  "probability_available": false,
  "probability_supported_for": [],
  "score_definition_id": "legacy-hdi-severity-v1",
  "score_version": "legacy-hdi-linear-3.5-v1",
  "target_definition_id": null,
  "prediction_horizon_days": null,
  "baseline_status": "ready",
  "data_quality": {
    "status": "sufficient",
    "available_signals": ["resting_heart_rate"],
    "missing_signals": []
  },
  "model_version": null,
  "calibration_version": null
}
```

Stanford daily rows не содержат timestamps, поэтому `as_of` у research demo
честно равен `null`; `day_index` остаётся source record index. Direct
`/score-history` принимает optional ISO datetime `as_of` на каждой записи.

## Decision policy

| Условие | `decision_status` | `risk_score` / `risk_band` |
|---|---|---|
| Research/synthetic source и baseline ready | `available` | число / backend band |
| Нет ни одного causal z-score | `warming` | `null` / `null` |
| `personal_export` или `personal_live` до release gates | `unsupported` | `null` / `null` |

Personal modes получают `personal_scoring_not_released`; warmup получает
`baseline_warming`. Personal release остаётся закрыт до следующих data,
correctness, evaluation и security gates roadmap.

## Frontend

- `web/lib/api.ts` типизирует полный contract и nullable score.
- `web/lib/risk-score.ts` только читает `risk_score`/`risk_band` при
  `decision_status = available`.
- `web/lib/status.ts` переводит backend band в display color, не назначая band.
- Home, Status и Timeline показывают source/integration/version metadata.
- Warming/unsupported state показывает причину вместо числа.
- Локальный HDI meter с собственными low/moderate/high thresholds удалён.

## Проверки

- `python3 -m unittest discover -s ml-service/tests -p 'test_*.py'` — 4 tests,
  passed. Покрыты available score/band, warmup abstention, unreleased personal
  mode и versioned band boundaries.
- `python3 -m py_compile` для contract/serving/app/tests — passed.
- `npx tsc --noEmit` — passed.
- `npm run build` — passed, production route manifest собран.
- `git diff --check` — passed.
- Static policy audit — passed:
  - frontend не содержит числовых score/band thresholds или HDI-to-score
    mapping;
  - `risk_score` и `risk_band` назначаются только в
    `ml-service/src/risk_contract.py`;
  - production serving/frontend paths не содержат `infection_probability`,
    `riskPct` или `view.pct`.

Полный FastAPI/Stanford runtime smoke test в текущем системном Python не
запускался: environment не содержит `fastapi`, `pandas`, `joblib` и sklearn.
Изолированный contract runtime, Python syntax, frontend types и production
build проверены; установка нового Python environment не выполнялась в рамках
этой фазы.
