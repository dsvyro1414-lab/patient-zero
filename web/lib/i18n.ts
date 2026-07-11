// Bilingual UI strings (RU default, EN for judges). Pure data — importable by
// both server and client components. Text is looked up as dict[locale].<ns>.<key>.
// {tokens} are filled with fmt().

export type Locale = "ru" | "en";
export const LOCALES: Locale[] = ["ru", "en"];
export const DEFAULT_LOCALE: Locale = "ru";

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

const ru = {
  nav: { home: "Главная", forecast: "Прогноз", today: "Статус", replay: "Таймлайн", report: "Метрики", logout: "Выйти", brand: "Patient Zero" },

  connect: {
    h1white: "Твой организм даёт сигналы",
    h1green: "раньше симптомов.",
    sub: "Мы анализируем твои сигналы, чтобы предупредить инфекцию за дни до первых признаков.",
    button: "Подключить WHOOP",
    oauth: "OAuth — безопасное подключение",
    disclaimer: "Не медицинский прибор и не заменяет консультацию врача.",
  },

  home: {
    label: "Главная",
    now: "Сейчас",
    headline: { high: "Организм под нагрузкой", moderate: "Лёгкая нагрузка на организм", low: "Всё спокойно" },
    explain: {
      high: "Твои показатели заметно отклонились от нормы — так бывает за пару дней до болезни. Сегодня лучше отдохнуть и следить за самочувствием.",
      moderate: "Есть небольшие отклонения от твоей нормы. Ничего страшного, но стоит поберечь себя.",
      low: "Показатели в пределах твоей нормы. Признаков надвигающейся болезни нет.",
    },
    cta: "Смотреть прогноз →",
    details: "Подробная статистика и точность модели →",
  },

  forecast: {
    label: "Прогноз",
    riskToday: "Оценка риска заболеть · сегодня",
    levelWord: { high: "Высокий риск", moderate: "Средний риск", low: "Низкий риск" },
    earlySignal: "ранний сигнал по твоим показателям",
    notDiagnosis: "Это не диагноз. Мы замечаем отклонения в организме раньше первых симптомов — но точный диагноз может поставить только врач.",
    trend: { up: "Риск в последние дни растёт", down: "Риск в последние дни снижается", flat: "Риск держится примерно на одном уровне" },
    weekTitle: "Уровень риска за 2 недели",
    weekSub: "Чем выше линия — тем сильнее организм отклонялся от твоей нормы.",
  },

  risk: {
    word: { high: "Высокий", moderate: "Средний", low: "Низкий" },
    sub: "риск заболеть",
    days: { today: "Сегодня", tomorrow: "Завтра", d2: "Послезавтра", d3: "Через 2 дня" },
    chartHigh: "высокий",
    chartToday: "сегодня",
    chartDays: "{n} дн",
    tipToday: "сегодня",
    tipDaysAgo: "{n} дн. назад",
    tipLevel: "Уровень риска {n}%",
  },

  actions: {
    title: "Что делать сейчас",
    red: [
      "Отдыхай сегодня, избегай интенсивных нагрузок",
      "Пей больше воды",
      "Сделай тест, если появятся симптомы",
      "Избегай контактов, чтобы не заразить близких",
    ],
    amber: [
      "Отдохни сегодня, избегай интенсивных нагрузок",
      "Пей больше воды",
      "Рассмотри тестирование, если будут симптомы",
      "Избегай контактов, если почувствуешь недомогание",
    ],
    green: [
      "Продолжай в том же духе",
      "Держи режим сна и восстановления",
      "Тренируйся по плану",
    ],
  },

  today: {
    label: "Статус",
    status: "Статус",
    subtitle: { red: "Ранние признаки инфекции", amber: "Следи за сигналами", green: "Показатели в норме" },
    title: { red: "Под наблюдением", amber: "Наблюдение", green: "Всё спокойно" },
    infectionProb: "Вероятность инфекции",
    hdi: "Индекс отклонения",
    meter: { low: "Низкий", moderate: "Средний", high: "Высокий" },
    meaningTitle: "Что это значит",
    explain: {
      red: "Несколько сигналов ({top}) устойчиво отклонились от твоей нормы — картина, которая в исследованиях предшествовала инфекции. Отдых и изоляция сейчас снижают риск.",
      amber: "Твои показатели немного отклонились от нормы ({top}). Есть ранние признаки нагрузки на организм. Отдых и восстановление помогут держать риск под контролем.",
      green: "Показатели держатся в пределах твоего личного baseline. Явных признаков надвигающейся инфекции нет.",
    },
    aiNote: "Сгенерировано AI · Не является медицинской рекомендацией",
    whyTitle: "Почему (топ-сигналы)",
    sigmaNote: "σ — стандартные отклонения от твоего baseline",
    source: "Данные: {source} · модель {model}",
    sourceModelOn: "загружена",
    sourceModelOff: "не загружена",
    synthetic: "синтетические (демо)",
  },

  replay: {
    label: "Таймлайн",
    legend: { rhr: "Пульс покоя", resp: "Дыхание", hrv: "HRV", temp: "Темп. кожи", sleep: "Сон", baseline: "Норма", hdi: "Отклонение", prob: "Вероятность" },
    alarm: "ТРЕВОГА",
    onset: "СИМПТОМЫ",
    daysAxis: "Дни относительно первых симптомов",
    day: "День",
    alarmActive: "Тревога активна в этот день",
    hdiLine: "Индекс отклонения: {v}",
    prob: " · вероятность {p}%",
    contribTitle: "Вклады сигналов",
    contribSub: "(в этот день)",
    tipDay: "день {d}",
    down: "ML-сервис недоступен. Запусти его на порту 8000.",
  },

  report: {
    label: "Метрики",
    sensLabel: "Чувствительность до симптомов",
    sensNote: "{a}/{b} эпизодов пойманы ДО симптомов",
    leadLabel: "Медианное опережение",
    leadValue: "{d} дн.",
    leadNote: "Среди досимптомных срабатываний",
    faLabel: "Ложные тревоги",
    faValue: "~1 / {d} дн.",
    faNote: "{a} на {b} оцениваемых здоровых дней",
    fullNote: "Для полноты: в окне [−{w0}, +{w1}] дн. вокруг онсета детектор помечает {ep}/{n} эпизодов ({pct}%) с медианой опережения {lead} дн. Это окно засчитывает и тревоги, сработавшие уже после первых симптомов, поэтому ведущей цифрой мы держим досимптомную. Дни прогрева персонального baseline исключены из знаменателя ложных тревог: в них тревога невозможна по построению. Рабочая точка выбрана на этой же когорте.",
    rocTitle: "Вторичная модель — ROC",
    rocSub: "обученный классификатор, вероятность по дням",
    rocClassifier: "Классификатор (AUC = {auc})",
    rocRandom: "Случайно (0.50)",
    detectorTitle: "Детектор изменений",
    detectorText: "Главный слой — персональный changepoint-монитор (robust baseline + CUSUM), тот же метод, что в исследованиях Stanford по COVID-19. Ловит устойчивый многодневный сдвиг физиологии до симптомов.",
    method: "Метод",
    signals: "Сигналы",
    window: "Окно детекции",
    windowVal: "[−{w0}, +{w1}] дн.",
    validatedReal: "Проверено на публичном датасете Stanford",
    validatedSynthetic: "Проверено на синтетических демо-данных",
    validatedSub: "N = {n} субъектов{ep} · held-out по субъектам — у классификатора (GroupKFold)",
    episodesCovid: " · {n} эпизодов COVID",
    notDiagnosis: "Не диагностирует заболевания. Физиологический флаг, не диагноз.",
    footnoteReal: "Цифры — на публичной когорте Stanford, где доступен только пульс покоя (Fitbit). На Whoop каналов пять (HRV, частота дыхания, темп. кожи, сон), но правило их слияния на одноканальной когорте проверить нельзя, поэтому мы не заявляем, что детекция там будет выше. Многоканальный режим пока не валидирован.",
    signalNames: { resting_heart_rate: "пульс покоя", hrv_rmssd_milli: "HRV", respiratory_rate: "частота дыхания", skin_temp_celsius: "темп. кожи", sleep_performance: "сон", spo2_percentage: "SpO₂" },
    down: "Нет метрик. Запусти обучение и ML-сервис на порту 8000.",
  },

  common: { serviceDown: "ML-сервис недоступен", serviceDownHint: "Запусти Python-сервис на порту 8000 и обнови страницу.", loading: "Загрузка…", and: "и" },
};

const en: typeof ru = {
  nav: { home: "Home", forecast: "Forecast", today: "Status", replay: "Timeline", report: "Metrics", logout: "Log out", brand: "Patient Zero" },

  connect: {
    h1white: "Your body sends signals",
    h1green: "before symptoms.",
    sub: "We analyze your signals to warn you about an infection days before the first signs.",
    button: "Connect WHOOP",
    oauth: "OAuth — secure connection",
    disclaimer: "Not a medical device and not a substitute for a doctor's advice.",
  },

  home: {
    label: "Home",
    now: "Right now",
    headline: { high: "Your body is under strain", moderate: "Mild strain on your body", low: "All clear" },
    explain: {
      high: "Your readings have drifted noticeably from normal — the kind of shift that shows up a couple of days before illness. Better to rest today and watch how you feel.",
      moderate: "There are small deviations from your normal. Nothing alarming, but take it easy.",
      low: "Your readings are within your normal range. No signs of oncoming illness.",
    },
    cta: "See the forecast →",
    details: "Detailed stats and model accuracy →",
  },

  forecast: {
    label: "Forecast",
    riskToday: "Illness risk estimate · today",
    levelWord: { high: "High risk", moderate: "Moderate risk", low: "Low risk" },
    earlySignal: "an early signal from your readings",
    notDiagnosis: "This is not a diagnosis. We spot deviations before the first symptoms — but only a doctor can make an actual diagnosis.",
    trend: { up: "Risk has been rising in recent days", down: "Risk has been falling in recent days", flat: "Risk is holding roughly steady" },
    weekTitle: "Risk level over 2 weeks",
    weekSub: "The higher the line, the more your body deviated from your normal.",
  },

  risk: {
    word: { high: "High", moderate: "Moderate", low: "Low" },
    sub: "illness risk",
    days: { today: "Today", tomorrow: "Tomorrow", d2: "In 2 days", d3: "In 3 days" },
    chartHigh: "high",
    chartToday: "today",
    chartDays: "{n}d ago",
    tipToday: "today",
    tipDaysAgo: "{n}d ago",
    tipLevel: "Risk level {n}%",
  },

  actions: {
    title: "What to do now",
    red: [
      "Rest today, avoid intense exertion",
      "Drink more water",
      "Take a test if symptoms appear",
      "Avoid contact so you don't infect others",
    ],
    amber: [
      "Rest today, avoid intense exertion",
      "Drink more water",
      "Consider testing if symptoms appear",
      "Avoid contact if you feel unwell",
    ],
    green: [
      "Keep it up",
      "Maintain your sleep and recovery",
      "Train as planned",
    ],
  },

  today: {
    label: "Status",
    status: "Status",
    subtitle: { red: "Early signs of infection", amber: "Watch your signals", green: "Readings are normal" },
    title: { red: "Illness watch", amber: "Watch", green: "All clear" },
    infectionProb: "Infection probability",
    hdi: "Deviation index",
    meter: { low: "Low", moderate: "Moderate", high: "High" },
    meaningTitle: "What this means",
    explain: {
      red: "Several signals ({top}) have steadily drifted from your normal — a pattern that, in studies, preceded infection. Rest and isolation now lower the risk.",
      amber: "Your readings have drifted a little from normal ({top}). There are early signs of strain. Rest and recovery will help keep the risk in check.",
      green: "Your readings are within your personal baseline. No clear signs of oncoming infection.",
    },
    aiNote: "Generated by AI · Not medical advice",
    whyTitle: "Why (top signals)",
    sigmaNote: "σ — standard deviations from your baseline",
    source: "Data: {source} · model {model}",
    sourceModelOn: "loaded",
    sourceModelOff: "not loaded",
    synthetic: "synthetic (demo)",
  },

  replay: {
    label: "Timeline",
    legend: { rhr: "Resting HR", resp: "Respiration", hrv: "HRV", temp: "Skin temp.", sleep: "Sleep", baseline: "Baseline", hdi: "Deviation", prob: "Probability" },
    alarm: "ALARM",
    onset: "ONSET",
    daysAxis: "Days relative to symptom onset",
    day: "Day",
    alarmActive: "Alarm active on this day",
    hdiLine: "Deviation index: {v}",
    prob: " · probability {p}%",
    contribTitle: "Signal contributions",
    contribSub: "(on this day)",
    tipDay: "day {d}",
    down: "ML service is unavailable. Start it on port 8000.",
  },

  report: {
    label: "Metrics",
    sensLabel: "Pre-symptomatic sensitivity",
    sensNote: "{a}/{b} episodes caught BEFORE symptoms",
    leadLabel: "Median lead time",
    leadValue: "{d} days",
    leadNote: "Among pre-symptomatic alarms",
    faLabel: "False alarms",
    faValue: "~1 / {d} days",
    faNote: "{a} across {b} scorable healthy days",
    fullNote: "For completeness: within a [−{w0}, +{w1}] day window around onset the detector flags {ep}/{n} episodes ({pct}%) with a median lead of {lead} days. That window also counts alarms firing after the first symptoms, so we lead with the pre-symptomatic figure. Personal-baseline warm-up days are excluded from the false-alarm denominator: an alarm is impossible there by construction. The operating point was chosen on this same cohort.",
    rocTitle: "Secondary model — ROC",
    rocSub: "trained classifier, per-day probability",
    rocClassifier: "Classifier (AUC = {auc})",
    rocRandom: "Random (0.50)",
    detectorTitle: "Change detector",
    detectorText: "The primary layer is a personal changepoint monitor (robust baseline + CUSUM) — the same method as the Stanford COVID-19 studies. It catches a sustained, multi-day physiological shift before symptoms.",
    method: "Method",
    signals: "Signals",
    window: "Detection window",
    windowVal: "[−{w0}, +{w1}] days",
    validatedReal: "Validated on the public Stanford dataset",
    validatedSynthetic: "Validated on synthetic demo data",
    validatedSub: "N = {n} subjects{ep} · held-out by subject — for the classifier (GroupKFold)",
    episodesCovid: " · {n} COVID episodes",
    notDiagnosis: "Does not diagnose illness. A physiological flag, not a diagnosis.",
    footnoteReal: "The numbers are on the public Stanford cohort, where only resting heart rate (Fitbit) is available. WHOOP has five channels (HRV, respiratory rate, skin temp, sleep), but the fusion rule can't be checked on a single-channel cohort, so we don't claim detection is higher there. The multi-channel mode is not yet validated.",
    signalNames: { resting_heart_rate: "resting heart rate", hrv_rmssd_milli: "HRV", respiratory_rate: "respiratory rate", skin_temp_celsius: "skin temp", sleep_performance: "sleep", spo2_percentage: "SpO₂" },
    down: "No metrics. Run training and the ML service on port 8000.",
  },

  common: { serviceDown: "ML service unavailable", serviceDownHint: "Start the Python service on port 8000 and refresh.", loading: "Loading…", and: "and" },
};

export const dict = { ru, en };
export type Dict = typeof ru;
