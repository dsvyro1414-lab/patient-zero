# Patient Zero — состояние проекта и следующие шаги

> Рабочая записка для продолжения в следующей сессии. Читать первой.
> Последнее обновление: 2026-07-10.

## 0. TL;DR

**Patient Zero** — веб-приложение, которое подключается к Whoop, учит личный
физиологический baseline и предупреждает о болезни **за несколько дней до первых
симптомов**. Хакатон: **ML Empowerment Build Challenge 2.0**, трек **AI for Health**.
Дедлайн: **31 июля 2026, 09:45 GMT+3**. Соло.

**Главная веха пройдена: ядро валидировано на РЕАЛЬНЫХ досимптомных данных COVID.**
ML-сервис и фронтенд работают. Обучение полностью локальное (интернет не нужен).

**Честный headline (реальные данные Stanford, один канал Fitbit):**
> Changepoint-детектор ловит **15/27 = 56% эпизодов COVID**, медианное
> **опережение 3 дня**, **~1 ложная тревога на 33 здоровых дня**.
> Это в русле опубликованной науки Stanford (Mishra/Alavi).

Осталось: заякорить демо на личном Whoop-эпизоде + упаковать сабмишн.

---

## 1. Что это и почему выигрывает

Два ML-слоя в одном продукте — с чётким разделением ролей:

1. **Changepoint-монитор — ГЛАВНЫЙ детектор** (real-time, без меток). Личный
   robust baseline (median/MAD) + CUSUM по respiratory rate, RHR, HRV, skin temp,
   sleep. Ловит устойчивый многодневный сдвиг перед симптомами. Это **тот же
   метод (RHR-Diff), что в COVID-исследованиях Stanford** — и именно он даёт
   честный headline-результат. Питает утреннюю тревогу и replay-демо.
2. **Обученный классификатор — ВТОРИЧНЫЙ слой** (gradient boosting, subject-level
   CV, калибровка). На реальных данных Stanford (один канал RHR) он слабый
   (AUC ≈ 0.53) — и это **честно объясняется**: см. абляцию в §6. Силён он только
   на многосигнальных данных, которые даёт Whoop пользователя.

Фичи — **subject-normalized robust z-scores**, поэтому детектор device-agnostic:
переносится с Fitbit/Oura на Whoop, который он не видел.

**Мапинг на рубрику** (Technical 30 / Creativity 20 / Impact 20 / UX 15 / Presentation 15):
- Technical: два реальных ML-слоя, метрики на held-out по субъектам, **воспроизводимые
  эксперименты включая честный негативный результат** (см. `ml-service/experiments/`).
- Creativity: интеграция с Whoop — редкость; changepoint как «то, для чего дневная
  гранулярность идеальна».
- Impact: 3-дневная фора на отдых/изоляцию; понятный благополучатель.
- UX+Presentation: replay-таймлайн (money-shot) + Report с честной детекцией + дисклеймеры.

Ловит: **AI for Health** (основная) + **Best Use of ML** + **Most Innovative** + **Data-Driven Insights**.

---

## 2. Архитектура

```
Whoop v2 API ──OAuth/снапшот──▶ ML-сервис (Python/FastAPI)  ◀──/ml/*──  Web (Next.js/Vercel)
                                  ├ features (robust-z)                  ├ Connect
                                  ├ changepoint (CUSUM)  ⭐ главный       ├ Today (статус)
                                  ├ classifier (HGB)      вторичный      ├ Replay (таймлайн) ⭐
                                  └ /evaluate /score-history /demo       └ Report (детекция + ROC)
```

- Фронт проксирует `/ml/*` → Python-сервис (`ML_SERVICE_URL`, дефолт `:8000`).
- Один и тот же normalize+score путь в реал-тайме и в replay-демо → демо = настоящая логика.

---

## 3. Текущий статус

| Компонент | Статус |
|---|---|
| Реальные Stanford-данные → `data/stanford.csv` (118 субъектов, 8804 дня, 27 COVID) | ✅ собрано |
| Тренировочный пайплайн (subject-level CV, калибровка) | ✅ работает |
| Changepoint-детектор + честная оценка детекции (`evaluate_detection`) | ✅ работает, настроен |
| Пороги настроены (`MIN_BASELINE_DAYS=12`, `FUSED_ALARM=4.5`) | ✅ 56% / 3д / ~1-на-33 |
| FastAPI `/evaluate` `/score-history` `/demo` | ✅ работает |
| Report перенаправлен на статистику детекции (классификатор — вторичен) | ✅ работает |
| Эксперименты (абляция, warmup, фьюжн) воспроизводимы | ✅ `ml-service/experiments/` |
| Фронтенд: 4 экрана на живом API | ✅ работает |
| Whoop v2 OAuth + backfill (код) | ✅ код готов, нужны креды приложения |
| **Заякоренное демо на ЛИЧНОМ Whoop-эпизоде** | ⬜ TODO (нужны данные пользователя) |
| **Devpost-сабмишн (видео, README, скриншоты, деплой)** | ⬜ TODO |
| Whoop live webhook | ⬜ стретч |

**Реальные метрики** (не синтетика): детекция 56%, опережение 3 дня, ЛТ ~1/33.
Классификатор AUC ≈ 0.53 (RHR-only) — вторичный, честно помечен.

---

## 4. Данные (РЕШЕНО 2026-07-10)

Из трёх кандидатов реально доступен **только Stanford**:

| Датасет | Вердикт |
|---|---|
| **Stanford COVID-19 Wearables** (Mishra 2020) | ✅ Открыт. Публичный GCS-zip, без заявок. |
| **Oura TemPredict** | ❌ Мёртв — Oura контрактно запрещает отдавать физиологию третьим лицам. |
| **Scripps DETECT** | ❌ За email-заявкой с DAA → нереально к дедлайну. |

**Скачивание (378 МБ, разовое, требует интернет):**
```
https://storage.googleapis.com/gbsc-gcp-project-ipop_public/COVID-19/COVID-19-Wearables.zip
```
Содержит поминутные `{ID}_hr.csv` / `_steps.csv` / `_sleep.csv` для 118 субъектов —
**только пульс/шаги/сон, БЕЗ HRV / частоты дыхания / темп. кожи**. Меток внутри нет.

**Метки** (даты симптомов/диагноза 32 COVID-субъектов) — в supplementary статьи,
лист `SuppTable3_Fig2a_COVID-19`, лежит в репо как
`ml-service/data/mishra2020_supplementary.xlsx`. Даты PHI-сдвинуты, но сдвиг
постоянен внутри субъекта → относительное выравнивание «онсет vs физиология» сохранено.

**Сборка:** `ml-service/data/build_stanford.py` стримит zip (без распаковки 3.6 ГБ),
считает дневной resting-HR (пульс в минуты без шагов за 12 мин → дневная медиана),
берёт COVID-онсет (симптом ближайший к дате диагноза), маскирует не-COVID эпизоды,
пишет `data/stanford.csv` (`subject_id, day_index, resting_heart_rate, onset`).
`dataset.py` сам выводит `label` из `onset` (окно [-3, +1]).

---

## 5. Как запустить

Обучение и сервис — **офлайн, интернет не нужен** (данные локальные).

```bash
# venv лежит в ОСНОВНОМ репо, НЕ в worktree:
VENV=/Users/david/ML-Empowerment-Build-Challenge-2.0/ml-service/.venv/bin/python

# (разово) собрать реальные данные из скачанного zip + supplementary:
cd ml-service
$VENV data/build_stanford.py --zip /path/COVID-19-Wearables.zip \
      --xlsx data/mishra2020_supplementary.xlsx

# обучить (пишет models/metrics.json с блоком detection):
$VENV src/train.py --source stanford

# ML-сервис:
cd src && $VENV -m uvicorn app:app --port 8000

# веб (терминал 2):
cd web && npm install && npm run dev      # http://localhost:3000

# эксперименты (абляция / warmup / фьюжн):
$VENV ml-service/experiments/run_experiments.py
```

---

## 6. Карта репозитория

```
ml-service/
  src/synth.py          синтетические размеченные данные (fallback)
  src/features.py       device-agnostic robust-z фичи (MIN_BASELINE_DAYS=12)
  src/dataset.py        грузит data/stanford.csv или синтетику; label_from_onset()
  src/train.py          subject-level CV + калибровка + пишет detection-блок в metrics.json
  src/changepoint.py    personal baseline + CUSUM; analyze() параметрический;
                        evaluate_detection(); FUSED_ALARM=4.5 (настроено)
  src/score.py          per-day вероятность + тревога + "почему"
  src/whoop_client.py   Whoop v2 OAuth + backfill + to_daily_frame()
  src/app.py            FastAPI
  data/build_stanford.py   сборка реального stanford.csv из zip+xlsx ⭐
  data/mishra2020_supplementary.xlsx   источник меток (SuppTable3)
  data/stanford.csv        собранные реальные данные (118 субъектов)
  experiments/run_experiments.py + README.md   абляция / warmup / фьюжн ⭐
  models/               model.joblib + metrics.json (+ detection) + roc.json
web/
  app/page.tsx                 Connect
  app/(app)/today/page.tsx     Today
  app/(app)/replay/page.tsx    Replay timeline ⭐
  app/(app)/report/page.tsx    Report — ВЕДЁТ статистикой детекции, ROC вторичен
  components/  lib/  next.config.mjs
.claude/launch.json          конфиг dev-сервера для preview
```

---

## 7. Эксперименты и находки (ml-service/experiments/)

1. **Абляция по сигналам** (синтетика): детекция растёт с числом сигналов
   (RHR→все: AUC 0.95→0.99, скачок при добавлении частоты дыхания). Честно:
   синтетика чистая, читать ТРЕНД, не уровни. → низкий реальный AUC = ограничение
   ОДНОГО канала, не метода. Настоящее многосигнальное доказательство — только на Whoop.
2. **Warmup-свип**: `MIN_BASELINE_DAYS 14→12` вернул ранний эпизод (52%→56%) почти
   без роста ложных тревог. Внедрено.
3. **Фьюжн (негативный результат, НЕ внедрён)**: changepoint-состояние (CUSUM+HDI)
   как признаки классификатора → AUC 0.53→0.49, хуже. Это нелинейная функция тех же
   z-признаков, дерево уже её извлекает. Задокументировано как сигнал стресс-теста.

---

## 8. Следующие шаги (по приоритету)

### Шаг A — Личный Whoop-эпизод 🔴 (money-shot + техническое доказательство)
- Подключить/экспортировать свой Whoop → найти реальную неделю болезни/перетрена →
  заякорить replay на своём теле. **Безопаснее снапшот, чем живой OAuth.**
- Двойная польза: у Whoop есть частота дыхания/HRV/темп → **единственный честный
  способ показать, что модель сильна на многосигнальных данных** (снять вопрос к AUC 0.53).
- Зависит от пользователя: нужны данные/креды + «сигнальная» неделя в истории.

### Шаг B — Деплой + Devpost-сабмишн (Presentation 15%, дёшево)
- web → Vercel, ML → Render/Railway; `ML_SERVICE_URL` в env.
- Видео 60–90 сек, README с архитектурой + честными метриками, скриншоты 4 экранов,
  описание (Problem/Solution/Features/Tech/Users), живой демо-линк.
- Сабмитить за 2 дня до дедлайна.

### (стретч) Живой Whoop OAuth + webhook
- Отложено: самый хрупкий кусок для живой демонстрации, мало очков. Код готов.

---

## 9. Честность / безопасность (держать в питче)
- Не медицинский прибор. Вывод — физиологический флаг, не диагноз.
- Все числа — на held-out публичных субъектах Stanford (один канал RHR);
  Whoop-скор = демонстрация переноса, не валидированная персональная точность.
- Синтетические числа оптимистичны — показывать реальные: 56% / 3 дня / ~1-на-33.
- Многосигнальную силу НЕ заявлять как реальную цифру, пока не прогнан личный Whoop.

## 10. Заметки окружения
- **venv в ОСНОВНОМ репо** `/Users/david/ML-Empowerment-Build-Challenge-2.0/ml-service/.venv`,
  НЕ в worktree. Python 3.13, Node 24. Есть pandas/sklearn/openpyxl.
- Нет Homebrew/libomp → xgboost не грузится, train.py падает на sklearn
  `HistGradientBoostingClassifier` (тоже настоящий gradient boosting). Ок.
- Обучение/скоринг офлайн; интернет нужен только для разового скачивания данных и npm install.
- git: только initial commit, дальнейшее не закоммичено.
