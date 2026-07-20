# Phase 0 — baseline freeze

Дата фиксации: 2026-07-17
Рабочая ветка: `codex/phase0-baseline-freeze`
Источник базы: `origin/main` (`0f296123527d74b0d1420d3fce4a8484e1ef9f0d`)
Предыдущая локальная база: `main` (`eaeee82becefb6862c2c9895a3f296e8490bc69b`)

## Состояние checkout

Ветка создана от актуального `origin/main`. Пользовательские untracked-файлы не
включались в baseline и не изменялись:

- `FUTURE_STEPS.md`;
- `docs/screenshots/`;
- `web/.gitignore`.

`origin/main` опережает прежний локальный `main` на 6 коммитов. Разница содержит
следующие элементы, которые относятся к scope cleanup из `FUTURE_STEPS.md`:

- `labs` и Claude-based medical summary;
- `next-steps` и triage flow;
- `symptoms`, `triage` и `labs` helpers;
- `@anthropic-ai/sdk`;
- отдельный `/forecast` screen и связанные copy changes;
- `HANDOFF.md` и deployment metadata.

Эта ветка является выбранной базой для следующих фаз. Medical-функции из списка
выше пока намеренно не удалялись: это отдельная задача Phase 2.

## Baseline artifacts

На момент freeze в `ml-service/models/` сохранены следующие артефакты:

| Артефакт | SHA-256 |
|---|---|
| `metrics.json` | `74bab0301a1c1b4183cc75c8db2e534d2f1ab86758a9e8baee1a03bc4d1b0b43` |
| `roc.json` | `46e67674662e2984a7e238d4bd6faf1088951895d83085cf9191d56ab590cc2c` |
| `model.joblib` | `5bd8ef3b4c4b36ea8500e7e90a252004fd0a7baf88205a1094e47d27358bd1ee` |

Основные baseline metrics:

- source: Stanford;
- model: `HistGradientBoosting`;
- subjects: 116;
- usable rows: 6,812;
- positive rows: 124;
- classifier ROC-AUC: 0.545;
- operating threshold: 0.4454;
- healthy false-alarm rate: 0.0712;
- changepoint episodes: 27, detected: 16;
- presymptomatic episodes: 8/27 (`0.296`);
- median presymptomatic lead: 5 days;
- detection window: `[-7, +2]`;
- false alarms: 215 on 6,576 scorable healthy days;
- false-alarm rate: 0.0327/day, approximately 1 per 30.6 healthy days.

Эти числа являются внутренним Stanford baseline. Они не являются independent
external validation: threshold selection и calibration limitations описаны в
`FUTURE_STEPS.md` и должны оставаться видимыми до завершения Phase 7–8.

## API contract до Phase 1

Текущий ML API:

- `GET /health` → `{ status: "ok", model_loaded: boolean }`;
- `GET /evaluate` → `{ metrics: metrics.json, roc: roc.json | null }`;
- `GET /demo` → score-history payload плюс `source`, `subject_id`, `onset_day`;
- `POST /score-history` принимает:

  ```json
  {
    "subject_id": "user",
    "history": [
      {
        "day_index": 1,
        "resting_heart_rate": 58,
        "hrv_rmssd_milli": 42,
        "respiratory_rate": 15.2,
        "skin_temp_celsius": 33.1,
        "spo2_percentage": 98
      }
    ]
  }
  ```

  В `history` обязателен `day_index` и `resting_heart_rate`; остальные сигналы
  optional и могут быть `null`.

Текущая запись дня содержит:

```text
day_index
infection_probability       # classifier probability, может быть null
health_deviation_index      # changepoint/HDI value
corroborating_signals
alarm
signals                     # per-signal z-scores
why                         # top signal contributors
```

Сейчас frontend использует оба несовместимых смысла: `infection_probability`
как probability classifier и `health_deviation_index`, преобразованный в
процент через `riskPct(hdi)`. Это зафиксировано как исходное состояние; Phase 1
должна заменить его единым `risk_mode: "score"` контрактом.

## Definition of done для Phase 0

- выбранная база зафиксирована: `origin/main` `0f29612`;
- отдельная ветка создана;
- baseline metrics и hashes записаны;
- текущий API contract записан;
- разница старого `main` и выбранной базы описана;
- исходное поведение приложения не менялось.
