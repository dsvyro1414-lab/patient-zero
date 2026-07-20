# Phase 1 — P0 safety containment

Дата: 2026-07-18
Ветка: `codex/phase0-baseline-freeze`
Roadmap: `FUTURE_STEPS.md`, Phase 1

> Нумерация в `docs/phase1-risk-semantics.md` относится к более ранней версии
> плана. В актуальном roadmap от 2026-07-18 safety containment идёт раньше
> полного backend-owned risk contract.

## Что изменено

- Из основной навигации убраны Forecast, Next Steps и Labs.
- `/forecast`, `/next-steps` и `/labs` сохранены как compatibility routes, но
  теперь нейтрально перенаправляют на `/home` и не исполняют legacy medical UI.
- `GET` и `POST /api/labs-summary` возвращают `410 feature_unavailable` с
  `Cache-Control: no-store`; Anthropic не вызывается.
- На landing screen больше нет ложного `Connect WHOOP`/OAuth flow. Единственный
  доступный вход открывает retrospective Stanford research demo.
- В `/demo` добавлен явный `source_mode: "research_demo"`.
- На всех оставшихся app screens постоянно виден баннер о retrospective
  Stanford dataset, отсутствии personal data и live WHOOP connection.
- Home больше не показывает известный следующий исторический день как
  «завтра», не ведёт в fake forecast/triage и не показывает action advice.
- Action advice также убран из Status; RU/EN copy оставшихся demo screens
  переписан без обращения к зрителю как к владельцу показанных данных.
- Fake logout убран: реальной auth/session semantics пока нет.

## Что намеренно сохранено

До Phase 3 физически не удалены legacy components и libraries для Labs,
Next Steps, triage, symptoms и Forecast. Это позволяет отдельно проверить, что
полезная wearable/timeline logic перенесена, прежде чем выполнять cleanup.

Dependency `@anthropic-ai/sdk` также остаётся до Phase 3 package cleanup, но ни
один доступный route её больше не импортирует и не вызывает.

## Контракт containment

Пользовательский flow после этой фазы:

```text
/ -> Stanford research demo
     -> Home
     -> Status
     -> Timeline
     -> Metrics

/forecast   -> /home
/next-steps -> /home
/labs       -> /home
/api/labs-summary -> 410 feature_unavailable
```

Stanford case остаётся development/research evidence. Он не является
персональным состоянием пользователя, live WHOOP integration, клинической
validation или прогнозом будущих дней.

## Проверки

- `npx tsc --noEmit` — passed.
- `npm run build` — passed; все compatibility routes и disabled API вошли в
  production route manifest.
- `python3 -m py_compile ml-service/src/app.py ml-service/src/score.py` — passed.
- Production HTTP smoke test (`next start`):
  - `/forecast` → `307`, `Location: /home`;
  - `/next-steps` → `307`, `Location: /home`;
  - `/labs` → `307`, `Location: /home`;
  - `GET /api/labs-summary` → `410`, `feature_unavailable`;
  - `POST /api/labs-summary` → `410`, `feature_unavailable`.
- Static containment checks — passed: доступные app/sidebar files не содержат
  links на legacy routes; доступные app/components/lib files не импортируют
  Anthropic.
- `git diff --check` — passed.

Прямой runtime import FastAPI `/demo` в системном Python не выполнен: в текущем
окружении отсутствуют `fastapi` и `joblib`. Python syntax и production frontend
contract проверены; `source_mode` добавлен непосредственно в `/demo` wrapper и
типизирован во frontend как literal `"research_demo"`.
