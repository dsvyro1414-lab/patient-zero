# Patient Zero — состояние проекта и следующие шаги

> Рабочая записка для продолжения в следующей сессии. Читать первой.

## 0. TL;DR

**Patient Zero** — веб-приложение, которое подключается к Whoop, учит личный
физиологический baseline и предупреждает о болезни **за 1–3 дня до первых
симптомов**. Хакатон: **ML Empowerment Build Challenge 2.0**, трек **AI for Health**.

Дедлайн: **31 июля 2026, 09:45 GMT+3**. Соло. Дизайн уже утверждён (светлая тема,
4 экрана). ML-сервис и фронтенд **построены и работают на живых данных** (пока на
синтетике). Осталось: реальные Stanford-данные, живой Whoop, и упаковка под сабмишн.

---

## 1. Что это и почему выигрывает

Два ML-слоя в одном продукте:

1. **Обученный классификатор** («реально обученная модель») — gradient boosting,
   обучается на публичных размеченных данных носимых (Stanford COVID-19 Wearables,
   опц. Oura TemPredict) с честными **subject-level метриками**: ROC-AUC,
   чувствительность при фикс. false-alarm, медианное опережение. Это ответ на
   претензию «нельзя обучить на n=1».
2. **Changepoint-монитор** (real-time, без меток) — личный robust baseline
   (median/MAD) + CUSUM по respiratory rate, RHR, HRV, skin temp, sleep. Ловит
   устойчивый многодневный сдвиг перед симптомами. Питает утреннюю тревогу и
   replay-демо.

Фичи — **subject-normalized robust z-scores**, поэтому модель, обученная на
Fitbit/Oura, переносится на Whoop, который она не видела.

**Мапинг на рубрику** (Technical 30 / Creativity 20 / Impact 20 / UX 15 / Presentation 15):
- Technical: два реальных ML-слоя + Whoop OAuth/webhook + метрики на held-out.
- Creativity: интеграция с Whoop — редкость на хакатоне; changepoint как «то, для чего дневная гранулярность идеальна».
- Impact: 48-часовая фора на отдых/изоляцию; понятный благополучатель.
- UX+Presentation: replay-таймлайн (money-shot) + ROC-панель + честные дисклеймеры.

Ловит: **AI for Health** (основная) + **Best Use of ML** + **Most Innovative** + **Data-Driven Insights**.

---

## 2. Архитектура

```
Whoop v2 API ──OAuth+webhook──▶ ML-сервис (Python/FastAPI)  ◀──/ml/*──  Web (Next.js/Vercel)
                                  ├ features (robust-z)                  ├ Connect
                                  ├ trained classifier (XGB/HGB)         ├ Today (статус)
                                  ├ changepoint (CUSUM)                  ├ Replay (таймлайн) ⭐
                                  └ /evaluate /score-history /demo       └ Report (ROC/метрики)
```

- Фронт проксирует `/ml/*` → Python-сервис (`ML_SERVICE_URL`, дефолт `:8000`), см. `web/next.config.mjs`.
- Один и тот же normalize+score путь используется и в реал-тайме, и в replay-демо → демо показывает настоящую логику.

---

## 3. Текущий статус

| Компонент | Статус |
|---|---|
| Тренировочный пайплайн (subject-level CV, калибровка, AUC/lead-time) | ✅ работает |
| Changepoint / real-time тревога + объяснения | ✅ работает |
| FastAPI `/evaluate` `/score-history` `/demo` | ✅ работает |
| Whoop v2 OAuth + backfill + маппинг записей | ✅ код готов (чистые части протестированы, нужны креды приложения) |
| Фронтенд: 4 экрана на живом API | ✅ работает, совпадает с макетом |
| Реальные Stanford-данные | ⬜ TODO |
| Whoop live (регистрация приложения + webhook) | ⬜ TODO |
| Заякоренное демо на реальном эпизоде болезни | ⬜ TODO |
| Devpost-сабмишн (видео, README, скриншоты) | ⬜ TODO |

Текущие метрики — на **синтетике** (оптимистичны: AUC ~0.99). На реальных
Stanford-данных ожидается **AUC ≈ 0.75–0.85, опережение 1–3 дня** — это честная
цифра для сабмишна.

---

## 4. Как запустить

```bash
# терминал 1 — ML-сервис
cd ml-service
python3 -m venv .venv && . .venv/bin/activate    # первый раз
pip install -r requirements.txt                   # первый раз
python src/train.py                               # обучает, пишет models/metrics.json
cd src && ../.venv/bin/python -m uvicorn app:app --port 8000

# терминал 2 — веб
cd web && npm install                             # первый раз
npm run dev                                        # http://localhost:3000
```

Открыть http://localhost:3000 → Connect → Today → Replay → Report.
(Серверы из прошлой сессии, скорее всего, уже погашены — подними заново.)

---

## 5. Карта репозитория

```
ml-service/
  src/synth.py          синтетические размеченные данные (работает сейчас)
  src/features.py       device-agnostic robust-z фичи + lag/slope
  src/dataset.py        грузит data/stanford.csv или синтетику
  src/train.py          subject-level CV + XGBoost→HGB fallback + калибровка + метрики
  src/changepoint.py    personal baseline + CUSUM (real-time слой + движок демо)
  src/score.py          per-day вероятность + тревога + "почему"
  src/whoop_client.py   Whoop v2 OAuth + backfill + to_daily_frame()
  src/app.py            FastAPI
  data/README.md        формат stanford.csv + список датасетов
  models/               model.joblib + metrics.json + roc.json (регенерируются train.py)
web/
  app/page.tsx                 Connect
  app/(app)/layout.tsx         app-shell + Sidebar
  app/(app)/today/page.tsx     Today
  app/(app)/replay/page.tsx    Replay timeline ⭐
  app/(app)/report/page.tsx    Report / ROC
  components/                  Gauge, WhyBars, ActionCard, Sidebar, RocChart, Logo
  lib/                         api.ts, signals.ts, status.ts
  next.config.mjs              proxy /ml/* → Python
.env.example                   Whoop креды + ML_SERVICE_URL
```

---

## 6. Следующие шаги (по приоритету)

### Шаг 1 — Реальные Stanford-данные (снимает главный технический риск) 🔴
- Скачать **Stanford COVID-19 Wearables** (Mishra et al. 2020, Nat Biomed Eng).
  Проверить актуальную ссылку (в прошлой сессии поисковики через headless молчали —
  начать с GitHub `StanfordBioinformatics` и data-availability в статье / Alavi 2022).
- Привести к формату `ml-service/data/stanford.csv` (см. `ml-service/data/README.md`):
  `subject_id, day_index, resting_heart_rate, label` (+ опц. `onset`, `hrv_rmssd_milli`).
  Если есть только onset-дата — `label` выведется автоматически.
- `python src/train.py --source stanford` → честные метрики автоматически попадут в Report.
- Опционально подать заявку на **Oura TemPredict** (там есть resp rate + skin temp = богаче под Whoop).

### Шаг 2 — Whoop live (OAuth + webhook)
- Зарегистрировать приложение на https://developer-dashboard.whoop.com → получить
  `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET`, задать `WHOOP_REDIRECT_URI`.
- Скопировать `.env.example` → `.env`, заполнить.
- Реализовать OAuth-редирект/коллбэк (код в `ml-service/src/whoop_client.py`:
  `authorize_url`, `exchange_code`, `refresh`). Хранить токены зашифрованно, ротация refresh.
- Backfill истории (`backfill()` + `to_daily_frame()`), затем webhook `recovery.updated`
  с HMAC-проверкой → fetch record → score → alert.
- Токены/секреты только на сервере, `client_secret` не в браузер.

### Шаг 3 — Заякорить демо на реальном эпизоде 🔴 (make-or-break демо)
- Найти в своей истории Whoop реальную неделю болезни/перетрена с видимым сигналом,
  сохранить как офлайн-снапшот, прогнать через тот же replay-движок.
- Fallback-лестница: (1) свой реальный эпизод → (2) публичный Stanford-субъект →
  (3) заранее записанное видео. ROC-панель всегда живая.

### Шаг 4 — Devpost-сабмишн (Presentation = 15%, дёшево выиграть)
- Видео 60–90 сек по раскадровке: hook → replay своей недели (тревога за 2 дня до
  симптомов) → Report Card с реальными числами → «работает на живом Whoop».
- Описание: Problem / Solution / Key Features / Technologies / Target Users.
- README с архитектурной диаграммой + метрики + честные ограничения.
- Скриншоты 4 экранов, живой демо-линк (Vercel + Render), репозиторий.
- Сабмитить за 2 дня до дедлайна.

### Мелочи/полировка
- Добавить `skin_temp_celsius` в синтетику (сейчас в Why-панели 4 сигнала, не 5) —
  на реальных Whoop-4.0 данных появится сам.
- Стретч: autoencoder/LSTM «learned model layer» поверх changepoint, чтобы добить
  восприятие «настоящий ML» у DL-ориентированного судьи.
- Деплой: web → Vercel, ML → Render/Railway; `ML_SERVICE_URL` в env.

---

## 7. Честность / безопасность (держать в питче)
- Не медицинский прибор. Вывод — физиологический флаг, не диагноз.
- Все числа точности — на held-out публичных субъектах; Whoop-скор = демонстрация
  переноса, не валидированная персональная точность.
- Синтетический AUC оптимистичен; реальная цифра ~0.75–0.85 — её и показывать.

## 8. Открытые решения
- Точные ссылки на скачивание Stanford/TemPredict — подтвердить в след. сессии.
- Где хостить ML-сервис (Render vs Railway vs HF Spaces).
- Нужен ли live-Whoop к сабмишну или достаточно backfill+replay (последнее надёжнее для демо).

## 9. Заметки окружения
- На этой машине **нет Homebrew/libomp** → xgboost не грузится, `train.py` автоматически
  падает на sklearn `HistGradientBoostingClassifier` (тоже настоящий gradient boosting). Ок.
- Python 3.13, Node 24. venv: `ml-service/.venv`.
- git init сделан, **коммитов нет** — при желании закоммитить текущее состояние.
