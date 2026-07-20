# Phase 1 — Risk Score semantics

> Historical numbering: this document records the initial score-only migration
> from the earlier roadmap. The 2026-07-18 `FUTURE_STEPS.md` calls the completed
> safety containment work Phase 1 and the full backend-owned contract Phase 2.
> The current contract is documented in `docs/phase2-backend-risk-contract.md`.

Дата: 2026-07-17
Ветка: `codex/phase0-baseline-freeze`

## Что изменилось

Продукт работает в score-only режиме. Serving API больше не отдаёт
`infection_probability`; classifier остаётся offline Research-моделью и
используется для метрик, но его текущий uncalibrated per-day output не является
пользовательским числом.

Единый score строится из personal changepoint deviation index:

```text
risk_score = clamp(round(health_deviation_index / 3.5 * 100), 0, 100)
```

Это score силы физиологического отклонения от personal baseline. Он не является
вероятностью конкретного заболевания и не заменяет диагноз.

## API contract

`GET /demo` и `POST /score-history` теперь включают contract metadata:

```json
{
  "risk_mode": "score",
  "risk_score": 68,
  "calibrated_probability": null,
  "probability_available": false
}
```

Каждая запись `records[]` содержит те же четыре поля, поэтому Timeline не
должен пересчитывать score из HDI или читать classifier probability. В summary
`risk_score` — score последнего дня отсортированной истории; для экранов с
выбранным днём источником является соответствующая запись `records[]`.

Probability mode не включается до выполнения calibration и independent
validation из `FUTURE_STEPS.md`.

## Frontend contract

- `web/lib/api.ts` описывает `RiskContract` и score fields;
- `ml-service/src/risk_contract.py` теперь владеет transformation и band policy;
- `web/lib/risk-score.ts` содержит только display-only чтение backend fields;
- `web/lib/forecast.ts` использует API `risk_score`, а не пересчитывает HDI;
- `Home`, `Forecast`, `Status`, `Timeline`, `Labs` и `Research` показывают score
  в формате `0–100`;
- disclaimers явно говорят, что score не является calibrated probability;
- старые `infection_probability`, `riskPct`, `view.pct` и probability chart
  labels удалены из frontend contract.

Research ROC остаётся как secondary classifier evidence, но UI больше не
называет его per-day probability.

## Проверки

- Python compile для `ml-service/src/score.py` и `app.py` — passed;
- runtime `score_history` на Stanford sample — passed;
- `npx tsc --noEmit` — passed;
- `npm run build` — passed после восстановления lockfile-зависимостей.
