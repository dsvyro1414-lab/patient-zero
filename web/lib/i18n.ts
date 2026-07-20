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
  nav: { home: "Главная", forecast: "Прогноз", nextSteps: "Дальше", labs: "Анализы", today: "Статус", replay: "Таймлайн", report: "Метрики", logout: "Выйти", brand: "Patient Zero" },

  connect: {
    h1white: "Wearable-сигналы могут меняться",
    h1green: "до первых симптомов.",
    sub: "Открой ретроспективный исследовательский кейс Stanford и посмотри, как сигналы участника сравниваются с его персональным baseline.",
    button: "Открыть research demo",
    oauth: "Публичный датасет Stanford · live WHOOP не подключён",
    disclaimer: "Исследовательское демо, не персональные данные, не медицинский прибор и не диагноз.",
  },

  demo: {
    badge: "RESEARCH DEMO · Stanford",
    notice: "Ретроспективный публичный датасет · не личные данные · live WHOOP не подключён",
  },

  home: {
    label: "Главная",
    now: "Ретроспективный кейс",
    headline: { high: "В кейсе заметен сдвиг показателей", moderate: "В кейсе есть небольшой сдвиг", low: "Показатели кейса стабильны" },
    explain: {
      high: "Показатели участника заметно отклонились от его rolling baseline. Score описывает силу физиологического сдвига, а не диагноз.",
      moderate: "В выбранном историческом дне есть небольшие отклонения от baseline участника.",
      low: "Показатели выбранного исторического дня находятся в пределах baseline участника.",
    },
    cta: "Разобрать выбранный день →",
    details: "Исследовательские метрики и ограничения →",
    scoreDisclaimer: "Score относится к ретроспективному Stanford case и отражает отклонение от baseline участника. Это не калиброванная вероятность заболевания.",
    contractMeta: "source: {source} · integration: {integration} · baseline: {baseline} · data: {quality} · score version: {version}",
    unavailableTitle: "Score пока недоступен",
    unavailableBody: "Backend вернул abstain state вместо числа: baseline ещё прогревается, данных недостаточно или source mode не поддерживается.",
  },

  forecast: {
    label: "Risk Score",
    riskToday: "Early Illness Risk Score · сегодня",
    levelWord: { high: "Высокий score", moderate: "Средний score", low: "Низкий score" },
    earlySignal: "сила физиологического отклонения",
    notDiagnosis: "Это score 0–100, а не калиброванная вероятность illness-related состояния и не диагноз. Он показывает отклонение от твоей личной нормы.",
    trend: { up: "Score в последние дни растёт", down: "Score в последние дни снижается", flat: "Score держится примерно на одном уровне" },
    weekTitle: "Score за 2 недели",
    weekSub: "Чем выше линия — тем сильнее организм отклонялся от твоей нормы.",
  },

  nextSteps: {
    label: "Дальше",
    title: "Что делать дальше",
    sub: "Отметь, что чувствуешь. Мы подскажем, насколько это срочно и к какому специалисту стоит обратиться. Это информация для разговора с врачом, а не диагноз.",
    cta: "Что делать дальше →",
    labsCta: "Есть свежие анализы? Собери из них сводку для врача →",
    wearableLine: "Сигнал носимого сейчас: {level}",
    noWearable: "Сигнал носимого недоступен — оцениваем только по симптомам.",

    result: {
      whoTitle: "Куда обратиться",
      whenTitle: "Когда",
      whyTitle: "Почему такой совет",
      safetyNet: "Если станет хуже или появится любой из тревожных признаков — обратись за помощью раньше.",
      disclaimer: "Оценка по простым правилам, не диагноз. Обсуди с врачом.",
    },

    tiers: {
      monitor: {
        headline: "Пока всё спокойно",
        action: "Явных признаков болезни сейчас нет. Отдыхай, живи в обычном режиме, пей как обычно и вернись сюда, если что-то изменится.",
        specialty: "Врач пока не нужен — самонаблюдение.",
        timeframe: "Пересмотри через 24–48 часов.",
      },
      home_care: {
        headline: "Домашний уход — и, возможно, тест",
        action: "Похоже на лёгкое недомогание. Отдыхай, пей больше жидкости, следи за самочувствием. Если есть домашний экспресс-тест — есть смысл сделать. Ограничь близкие контакты, чтобы не заразить других.",
        specialty: "Домашний уход; при желании — онлайн-консультация (телемедицина).",
        timeframe: "Наблюдай 2–3 дня; свяжись с врачом, если станет хуже или не проходит.",
      },
      gp_soon: {
        headline: "Стоит показаться терапевту в ближайшие 1–2 дня",
        action: "Твои симптомы и/или сигнал носимого указывают на инфекцию, которую стоит показать врачу. Обратись к терапевту — очно или онлайн — и обсуди, нужен ли тест или базовые анализы. До этого: отдых, жидкость, изоляция от других.",
        specialty: "Терапевт / врач первичного звена; подойдёт и телемедицина.",
        timeframe: "В течение 1–2 дней — раньше, если быстро ухудшается.",
      },
      same_day: {
        headline: "Покажись врачу сегодня",
        action: "Есть признаки, которые лучше оценить сегодня — высокая или долгая температура, одышка при нагрузке, обезвоживание или быстрое ухудшение. Обратись в неотложную помощь или на приём к терапевту в тот же день. Если кружится голова — не садись за руль, попроси кого-то отвезти.",
        specialty: "Неотложная помощь / приём у терапевта в тот же день.",
        timeframe: "Сегодня, в ближайшие часы.",
      },
      emergency: {
        headline: "Нужна экстренная помощь",
        action: "Один или несколько симптомов требуют немедленной помощи — трудно дышать в покое, боль в груди, спутанность сознания, посинение губ, обморок или очень высокая температура. Позвони в скорую (103 или 112) или отправляйся в приёмное отделение прямо сейчас. Не веди машину сам. Это не диагноз, но такие признаки нужно проверить немедленно.",
        specialty: "Скорая помощь / приёмное отделение.",
        timeframe: "Немедленно.",
      },
    },
    preSymptomaticAction: "Организм показывает раннее отклонение, которое иногда бывает за 1–3 дня до симптомов — хороший момент сделать тест и сбавить нагрузку, даже если ты чувствуешь себя нормально. Это ранний сигнал, а не диагноз.",

    categories: {
      general: "Общее самочувствие",
      respiratory: "Дыхание и грудная клетка",
      ent: "Нос и горло",
      chemosensory: "Обоняние и вкус",
      gi: "Желудок и кишечник",
      red_flag: "Тревожные признаки — срочно",
    },

    symptoms: {
      fever: "Температура / жар",
      chills: "Озноб",
      fatigue: "Слабость, упадок сил",
      body_aches: "Ломота в теле, боль в мышцах",
      headache: "Головная боль",
      worsening_24h: "Заметно хуже за последние сутки",
      dry_cough: "Сухой кашель",
      productive_cough: "Влажный кашель (с мокротой)",
      shortness_of_breath_exertion: "Одышка при нагрузке (по лестнице, при ходьбе)",
      sore_throat: "Боль в горле",
      runny_nose: "Насморк или заложенность носа",
      loss_of_smell: "Потеря обоняния",
      loss_of_taste: "Потеря вкуса",
      nausea_vomiting: "Тошнота или рвота",
      diarrhea: "Диарея (жидкий стул)",
      severe_breathing_difficulty: "Трудно дышать в покое, сильная одышка",
      chest_pain_pressure: "Боль или сдавливание в груди",
      confusion_drowsy: "Спутанность сознания, трудно проснуться",
      bluish_lips_face: "Синюшность или серость губ, лица, ногтей",
      fainting: "Обморок, потеря сознания",
      coughing_blood: "Кровь при кашле",
      cannot_keep_fluids: "Не можешь пить, признаки сильного обезвоживания",
      stroke_signs: "Перекосило лицо, невнятная речь или слабость одной стороны тела",
    },

    feverLevels: {
      none: "Нет (<37,5 °C)",
      low: "Субфебрильная (37,5–38,0)",
      moderate: "Умеренная (38,1–39,0)",
      high: "Высокая (39,1–40,0)",
      veryHigh: "Очень высокая (≥40)",
    },
    fatigueLevels: { none: "Нет", mild: "Умеренная", severe: "Сильная" },

    duration: {
      label: "Сколько дней нездоровится?",
      options: ["<1 дня", "1–2 дня", "3–4 дня", "5–7 дней", ">7 дней"],
    },

    reasons: {
      veryHighFever: "Очень высокая температура",
      redFlag: "Отмечен тревожный признак",
      highFeverPlusSymptoms: "Высокая температура и другие симптомы",
      highFever: "Высокая температура",
      feverDuration: "Температура держится несколько дней",
      exertional: "Одышка при нагрузке",
      worsening: "Заметное ухудшение за сутки",
      symptomLoad: "Несколько симптомов инфекции",
      anosmia: "Потеря обоняния или вкуса",
      longDuration: "Симптомы длятся дольше 5 дней",
      wearableHigh: "Носимое: сильное отклонение от твоей нормы",
      wearableModerate: "Носимое: умеренное отклонение от нормы",
      preSymptomatic: "Ранний сигнал до симптомов",
      noSymptoms: "Симптомы не отмечены",
    },

    ui: {
      clearAll: "Сбросить всё",
      selected: "Отмечено: {n}",
      hint: "Отвечай только на то, что чувствуешь — пустой опрос показывает спокойный статус.",
    },

    banner: {
      title: "Опасные симптомы — сразу за помощью",
    },

    disclaimers: {
      banner: "Это не диагноз и не назначение лечения — информация, чтобы обсудить с врачом. Прототип, а не медицинский прибор, и он не заменяет врача.",
      emergency: "Если это неотложная ситуация — сразу звони в скорую (103 или 112). Не жди результатов опроса.",
      privacy: "Твои ответы остаются на этом устройстве. Мы не сохраняем их на сервере, не публикуем и никому не передаём. Обновление или закрытие страницы стирает их.",
    },
    higherRisk: "Пороги рассчитаны на взрослого без хронических болезней. Детям, беременным, людям старше 65 и тем, у кого хронические болезни сердца, лёгких, диабет или ослаблен иммунитет, стоит обращаться за помощью раньше. У детей опасные признаки другие — не полагайся на этот опрос.",
    prototype: "Прототип для хакатона, не сертифицированный медицинский инструмент.",
  },

  labs: {
    label: "Анализы",
    title: "Анализы и сводка для врача",
    sub: "Введи значения из своих анализов — AI соберёт их вместе с сигналом носимого в понятную сводку, которую можно показать врачу. Это материал для разговора с врачом, а не диагноз.",

    consent: {
      title: "Прежде чем продолжить",
      body: "Чтобы собрать сводку, введённые значения отправятся во внешний AI-сервис (Anthropic Claude), который обработает их и вернёт текст. Мы не сохраняем анализы на своём сервере и не публикуем их. Не вводи данные, которые не готов(а) отправить.",
      b1: "Данные уходят во внешний AI-сервис только в момент нажатия кнопки «Собрать сводку».",
      b2: "Мы не храним анализы на сервере, не показываем их другим и не коммитим в репозиторий.",
      b3: "Это прототип для хакатона. Не загружай сюда чужие медицинские данные.",
      checkbox: "Понимаю и согласен(на) отправить введённые значения для анализа.",
      agree: "Согласиться и продолжить",
    },

    labNames: {
      crp: "C-реактивный белок (CRP)",
      wbc: "Лейкоциты (WBC)",
      neutrophils_pct: "Нейтрофилы",
      lymphocytes_pct: "Лимфоциты",
      procalcitonin: "Прокальцитонин (PCT)",
      esr: "СОЭ",
    },

    form: {
      heading: "Введи значения анализов",
      refLabel: "Заполняй только то, что есть в твоём бланке. Все поля необязательны.",
      refPrefix: "типичная норма: {range}",
      otherLabel: "Другие результаты или заметки",
      otherPlaceholder: "Например: ферритин 320 мкг/л, D-димер в норме…",
      noteLabel: "Как ты себя чувствуешь (необязательно)",
      notePlaceholder: "Например: третий день температура и слабость.",
      generate: "Собрать сводку для врача",
      generating: "Собираю…",
    },

    physio: {
      title: "Сигнал носимого будет приложен",
      sub: "Эти данные детектора отправятся вместе с анализами, чтобы AI связал физиологию и результаты.",
      riskLine: "Score физиологического сдвига сейчас: {level} ({score} / 100).",
      lead: "Тревога сработала примерно за {d} дн. до первых симптомов.",
      signals: "Сильнее всего отклонились:",
      attachNote: "Показатели детектора; интерпретирует их врач.",
    },

    result: {
      title: "Сводка для врача",
      copy: "Скопировать",
      copied: "Скопировано",
      aiNote: "Сгенерировано AI · Не диагноз · Обсуди с врачом",
    },

    errors: {
      ai_unconfigured: "AI-сервис не настроен: не задан ключ ANTHROPIC_API_KEY. Добавь его в web/.env.local.",
      bad_request: "Не удалось прочитать данные. Обнови страницу и попробуй снова.",
      no_input: "Введи хотя бы одно значение или заметку.",
      refused: "AI не смог обработать этот запрос. Покажи анализы врачу напрямую.",
      empty: "Пустой ответ. Попробуй ещё раз.",
      rate_limited: "Слишком много запросов. Подожди минуту и попробуй снова.",
      ai_error: "AI-сервис временно недоступен. Попробуй позже.",
      server_error: "Не удалось собрать сводку. Попробуй ещё раз.",
      network: "Нет связи с сервером. Проверь интернет и попробуй снова.",
    },

    disclaimers: {
      transmission: "При нажатии значения отправляются во внешний AI-сервис (Anthropic) и не сохраняются на нашем сервере.",
      notDiagnosis: "Это не диагноз и не назначение лечения — материал для разговора с врачом. Анализы интерпретирует только врач с учётом твоей истории и норм лаборатории.",
      phi: "Анализы — чувствительные данные. Они остаются в этой сессии в браузере, не сохраняются на сервере и не публикуются.",
      prototype: "Прототип для хакатона, не сертифицированный медицинский инструмент.",
    },
  },

  risk: {
    word: { high: "Высокий", moderate: "Средний", low: "Низкий" },
    sub: "отклонение от baseline участника",
    days: { today: "Выбранный день демо", tomorrow: "Следующий исторический день", d2: "+2 исторических дня", d3: "+3 исторических дня" },
    chartHigh: "высокий",
    chartToday: "сегодня",
    chartDays: "{n} дн",
    tipToday: "сегодня",
    tipDaysAgo: "{n} дн. назад",
    tipLevel: "Score {n} / 100",
  },

  actions: {
    title: "Как использовать score",
    red: [
      "Сравнивай score с личной нормой в динамике",
      "Проверь качество и полноту данных wearable",
      "Сделай паузу в интенсивной нагрузке, если это уместно",
      "Отмечай симптомы отдельно — score не ставит диагноз",
    ],
    amber: [
      "Смотри на тренд score, а не на один день",
      "Проверь качество и полноту данных wearable",
      "Поддерживай привычный режим сна и восстановления",
      "Отмечай симптомы отдельно — score не ставит диагноз",
    ],
    green: [
      "Продолжай собирать данные регулярно",
      "Держи привычный режим сна и восстановления",
      "Используй score как динамику, а не как медицинский вывод",
    ],
  },

  today: {
    label: "Статус",
    status: "Выбранный исторический день",
    subtitle: { red: "Заметный физиологический сдвиг", amber: "Есть отклонение от baseline", green: "Показатели в пределах baseline" },
    title: { red: "Сильный сдвиг", amber: "Умеренный сдвиг", green: "Низкий сдвиг" },
    riskScore: "Experimental Risk Score",
    hdi: "Индекс отклонения",
    hdiNote: "Raw detector value; band назначает backend score policy.",
    meter: { low: "Низкий", moderate: "Средний", high: "Высокий" },
    meaningTitle: "Что это значит",
    explain: {
      red: "В историческом кейсе несколько сигналов ({top}) устойчиво отклонились от baseline участника. Это повышает score, но не указывает конкретную причину.",
      amber: "Показатели исторического кейса немного отклонились от baseline участника ({top}).",
      green: "Показатели исторического кейса находятся в пределах baseline участника.",
    },
    scoreDisclaimer: "Score описывает ретроспективное отклонение от baseline участника. Это не персональный прогноз и не калиброванная вероятность.",
    whyTitle: "Почему (топ-сигналы)",
    sigmaNote: "σ — стандартные отклонения от baseline участника",
    source: "source: {mode} · integration: {integration} · baseline: {baseline} · data: {quality} · score version: {version} · dataset: {source} · модель {model}",
    sourceModelOn: "загружена",
    sourceModelOff: "не загружена",
    synthetic: "синтетические (демо)",
    unavailableTitle: "Score не выдан",
    unavailableBody: "decision_status: {status} · reason_codes: {reasons}",
  },

  replay: {
    label: "Таймлайн",
    legend: { rhr: "Пульс покоя", resp: "Дыхание", hrv: "HRV", temp: "Темп. кожи", sleep: "Сон", baseline: "Норма", hdi: "Отклонение", score: "Risk Score" },
    alarm: "ТРЕВОГА",
    onset: "СИМПТОМЫ",
    daysAxis: "Дни относительно первых симптомов",
    day: "День",
    alarmActive: "Тревога активна в этот день",
    hdiLine: "Индекс отклонения: {v}",
    scoreLine: " · score {n} / 100",
    scoreUnavailable: "score недоступен",
    scoreDisclaimer: "Исторический score 0–100 отражает отклонение от baseline участника; это не прогноз и не калиброванная вероятность.",
    contractMeta: "source: {source} · integration: {integration} · score version: {version}",
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
    rocSub: "обученный классификатор, исследовательское ранжирование по дням",
    rocClassifier: "Классификатор (AUC = {auc})",
    rocRandom: "Случайно (0.50)",
    detectorTitle: "Детектор изменений",
    detectorText: "Главный исследовательский слой — changepoint-монитор (robust baseline + CUSUM). На Stanford cohort он ретроспективно оценивает устойчивые многодневные сдвиги вокруг начала симптомов.",
    method: "Метод",
    signals: "Сигналы",
    window: "Окно детекции",
    windowVal: "[−{w0}, +{w1}] дн.",
    validatedReal: "Development baseline на публичном датасете Stanford",
    validatedSynthetic: "Development baseline на синтетических демо-данных",
    validatedSub: "N = {n} субъектов{ep} · held-out по субъектам — у классификатора (GroupKFold)",
    episodesCovid: " · {n} эпизодов COVID",
    notDiagnosis: "Не диагностирует заболевания. Физиологический флаг, не диагноз.",
    scoreMode: "Research demo работает в score mode: 0–100 отражает отклонение от baseline участника. Calibrated probability отключена до отдельной calibration и independent validation.",
    footnoteReal: "Цифры — на публичной когорте Stanford, где доступен только пульс покоя (Fitbit). На Whoop каналов пять (HRV, частота дыхания, темп. кожи, сон), но правило их слияния на одноканальной когорте проверить нельзя, поэтому мы не заявляем, что детекция там будет выше. Многоканальный режим пока не валидирован.",
    signalNames: { resting_heart_rate: "пульс покоя", hrv_rmssd_milli: "HRV", respiratory_rate: "частота дыхания", skin_temp_celsius: "темп. кожи", sleep_performance: "сон", spo2_percentage: "SpO₂" },
    down: "Нет метрик. Запусти обучение и ML-сервис на порту 8000.",
  },

  common: { serviceDown: "ML-сервис недоступен", serviceDownHint: "Запусти Python-сервис на порту 8000 и обнови страницу.", loading: "Загрузка…", and: "и" },
};

const en: typeof ru = {
  nav: { home: "Home", forecast: "Forecast", nextSteps: "Next steps", labs: "Labs", today: "Status", replay: "Timeline", report: "Metrics", logout: "Log out", brand: "Patient Zero" },

  connect: {
    h1white: "Wearable signals can shift",
    h1green: "before symptoms begin.",
    sub: "Open a retrospective Stanford research case to see how a participant's signals compare with their personal baseline.",
    button: "Open research demo",
    oauth: "Public Stanford dataset · live WHOOP is not connected",
    disclaimer: "Research demo, not personal data, a medical device, or a diagnosis.",
  },

  demo: {
    badge: "RESEARCH DEMO · Stanford",
    notice: "Retrospective public dataset · not personal data · live WHOOP is not connected",
  },

  home: {
    label: "Home",
    now: "Retrospective case",
    headline: { high: "The case shows a marked shift", moderate: "The case shows a small shift", low: "The case readings are stable" },
    explain: {
      high: "The participant's readings shifted noticeably from their rolling baseline. The score describes the size of that shift, not a diagnosis.",
      moderate: "The selected historical day has small deviations from the participant's baseline.",
      low: "The selected historical day's readings are within the participant's baseline.",
    },
    cta: "Inspect the selected day →",
    details: "Research metrics and limitations →",
    scoreDisclaimer: "The score belongs to a retrospective Stanford case and reflects deviation from a participant baseline. It is not a calibrated illness probability.",
    contractMeta: "source: {source} · integration: {integration} · baseline: {baseline} · data: {quality} · score version: {version}",
    unavailableTitle: "Score is not available yet",
    unavailableBody: "The backend returned an abstain state instead of a number: the baseline is warming, data is insufficient, or the source mode is unsupported.",
  },

  forecast: {
    label: "Risk Score",
    riskToday: "Early Illness Risk Score · today",
    levelWord: { high: "High score", moderate: "Moderate score", low: "Low score" },
    earlySignal: "strength of physiological deviation",
    notDiagnosis: "This is a 0–100 score, not a calibrated probability of an illness-related state and not a diagnosis. It reflects deviation from your personal baseline.",
    trend: { up: "The score has been rising in recent days", down: "The score has been falling in recent days", flat: "The score is holding roughly steady" },
    weekTitle: "Score over 2 weeks",
    weekSub: "The higher the line, the more your body deviated from your normal.",
  },

  nextSteps: {
    label: "Next steps",
    title: "What to do next",
    sub: "Tell us how you feel. We'll suggest how urgent it is and which kind of specialist to see. This is information for a conversation with a doctor, not a diagnosis.",
    cta: "What to do next →",
    labsCta: "Have recent lab results? Turn them into a summary for your doctor →",
    wearableLine: "Wearable signal right now: {level}",
    noWearable: "Wearable signal unavailable — assessing from symptoms only.",

    result: {
      whoTitle: "Who to see",
      whenTitle: "When",
      whyTitle: "Why this advice",
      safetyNet: "If it gets worse, or any red-flag symptom appears, seek help sooner.",
      disclaimer: "Rule-based guidance, not a diagnosis. Discuss it with a doctor.",
    },

    tiers: {
      monitor: {
        headline: "All quiet for now",
        action: "No clear signs of illness right now. Rest, keep your usual routine, drink normally, and come back here if anything changes.",
        specialty: "No doctor needed yet — self-monitoring.",
        timeframe: "Reassess in 24–48 hours.",
      },
      home_care: {
        headline: "Home care — and maybe a test",
        action: "Looks like a mild illness. Rest, drink more fluids, keep an eye on how you feel. If you have a home rapid test, it's worth taking. Limit close contact so you don't pass it on.",
        specialty: "Home care; a short online consult (telemedicine) if you'd like reassurance.",
        timeframe: "Watch for 2–3 days; contact a doctor if it worsens or doesn't settle.",
      },
      gp_soon: {
        headline: "Worth seeing a GP in the next 1–2 days",
        action: "Your symptoms and/or wearable signal point to an infection worth a professional look. See a GP — in person or online — and discuss whether you need a test or basic bloodwork. Until then: rest, fluids, keep away from others.",
        specialty: "General practitioner / primary care; telemedicine is fine.",
        timeframe: "Within 1–2 days — sooner if it's worsening fast.",
      },
      same_day: {
        headline: "Get seen today",
        action: "There are signs best evaluated today — high or long-lasting fever, breathlessness on exertion, dehydration, or a fast downhill turn. Go to urgent care or get a same-day GP appointment. If you feel faint, don't drive — ask someone to take you.",
        specialty: "Urgent care / same-day primary-care appointment.",
        timeframe: "Today, within hours.",
      },
      emergency: {
        headline: "Get emergency help now",
        action: "One or more of your symptoms needs immediate care — trouble breathing at rest, chest pain, confusion, blue lips, fainting, or a very high fever. Call emergency services (112, or 911 in the US) or go to the nearest emergency room now. Don't drive yourself. This isn't a diagnosis, but these signs need to be checked right away.",
        specialty: "Emergency services / emergency room.",
        timeframe: "Right now.",
      },
    },
    preSymptomaticAction: "Your body shows an early shift that can appear 1–3 days before symptoms — a good moment to test and ease off, even though you feel fine. This is an early signal, not a diagnosis.",

    categories: {
      general: "General",
      respiratory: "Breathing & chest",
      ent: "Nose & throat",
      chemosensory: "Smell & taste",
      gi: "Stomach & gut",
      red_flag: "Red flags — urgent",
    },

    symptoms: {
      fever: "Fever",
      chills: "Chills",
      fatigue: "Fatigue / low energy",
      body_aches: "Body aches / muscle pain",
      headache: "Headache",
      worsening_24h: "Clearly worse in the last 24 hours",
      dry_cough: "Dry cough",
      productive_cough: "Productive cough (with phlegm)",
      shortness_of_breath_exertion: "Shortness of breath on exertion (stairs, walking)",
      sore_throat: "Sore throat",
      runny_nose: "Runny or stuffy nose",
      loss_of_smell: "Loss of smell",
      loss_of_taste: "Loss of taste",
      nausea_vomiting: "Nausea or vomiting",
      diarrhea: "Diarrhea",
      severe_breathing_difficulty: "Severe difficulty breathing at rest",
      chest_pain_pressure: "Chest pain or pressure",
      confusion_drowsy: "New confusion or hard to wake",
      bluish_lips_face: "Bluish or grey lips, face, or nails",
      fainting: "Fainting or loss of consciousness",
      coughing_blood: "Coughing up blood",
      cannot_keep_fluids: "Can't keep fluids down / severe dehydration",
      stroke_signs: "Face drooping, slurred speech, or one-sided weakness",
    },

    feverLevels: {
      none: "None (<37.5 °C)",
      low: "Low-grade (37.5–38.0)",
      moderate: "Moderate (38.1–39.0)",
      high: "High (39.1–40.0)",
      veryHigh: "Very high (≥40)",
    },
    fatigueLevels: { none: "None", mild: "Mild", severe: "Severe" },

    duration: {
      label: "How many days have you felt unwell?",
      options: ["<1 day", "1–2 days", "3–4 days", "5–7 days", ">7 days"],
    },

    reasons: {
      veryHighFever: "Very high fever",
      redFlag: "A red-flag symptom is checked",
      highFeverPlusSymptoms: "High fever with other symptoms",
      highFever: "High fever",
      feverDuration: "Fever lasting several days",
      exertional: "Breathlessness on exertion",
      worsening: "Clearly worse in the last 24 hours",
      symptomLoad: "Several infection symptoms",
      anosmia: "Loss of smell or taste",
      longDuration: "Symptoms lasting more than 5 days",
      wearableHigh: "Wearable: strong deviation from your normal",
      wearableModerate: "Wearable: moderate deviation from normal",
      preSymptomatic: "An early signal before symptoms",
      noSymptoms: "No symptoms reported",
    },

    ui: {
      clearAll: "Clear all",
      selected: "Selected: {n}",
      hint: "Answer only what applies — a blank questionnaire shows the calm status.",
    },

    banner: {
      title: "Danger signs — get help now",
    },

    disclaimers: {
      banner: "This is not a diagnosis or a treatment plan — it's information to discuss with a doctor. A prototype, not a medical device, and not a substitute for a doctor.",
      emergency: "If this feels life-threatening, call emergency services now (112, or 911 in the US) — don't wait for the questionnaire.",
      privacy: "Your answers stay on this device. We don't save them to a server, publish them, or share them with anyone. Refreshing or closing the page clears them.",
    },
    higherRisk: "Thresholds assume an adult with no chronic conditions. Children, pregnant people, anyone over 65, and people with chronic heart or lung disease, diabetes, or a weakened immune system should seek care sooner. Danger signs differ in children — don't rely on this questionnaire for them.",
    prototype: "A hackathon prototype, not a certified medical tool.",
  },

  labs: {
    label: "Labs",
    title: "Labs & summary for your doctor",
    sub: "Enter the values from your lab report — the AI pulls them together with your wearable signal into a plain-language summary you can show your doctor. This is information for a conversation with a doctor, not a diagnosis.",

    consent: {
      title: "Before you continue",
      body: "To build the summary, the values you enter are sent to an external AI service (Anthropic Claude), which processes them and returns text. We don't store your labs on our server or publish them. Don't enter anything you're not willing to send.",
      b1: "Data leaves for the external AI service only when you press “Build summary”.",
      b2: "We don't keep your labs on a server, show them to anyone, or commit them to the repo.",
      b3: "This is a hackathon prototype. Don't upload anyone else's medical data here.",
      checkbox: "I understand and agree to send the entered values for analysis.",
      agree: "Agree and continue",
    },

    labNames: {
      crp: "C-reactive protein (CRP)",
      wbc: "White blood cells (WBC)",
      neutrophils_pct: "Neutrophils",
      lymphocytes_pct: "Lymphocytes",
      procalcitonin: "Procalcitonin (PCT)",
      esr: "ESR",
    },

    form: {
      heading: "Enter your lab values",
      refLabel: "Fill in only what's on your report. All fields are optional.",
      refPrefix: "typical range: {range}",
      otherLabel: "Other results or notes",
      otherPlaceholder: "e.g. ferritin 320 µg/L, D-dimer normal…",
      noteLabel: "How you feel (optional)",
      notePlaceholder: "e.g. third day of fever and fatigue.",
      generate: "Build summary for your doctor",
      generating: "Building…",
    },

    physio: {
      title: "Your wearable signal will be attached",
      sub: "This detector data is sent along with your labs so the AI can connect your physiology to the results.",
      riskLine: "Physiological-shift score right now: {level} ({score} / 100).",
      lead: "The alarm fired about {d} day(s) before the first symptoms.",
      signals: "Deviating most:",
      attachNote: "Detector readings; your doctor interprets them.",
    },

    result: {
      title: "Summary for your doctor",
      copy: "Copy",
      copied: "Copied",
      aiNote: "Generated by AI · Not a diagnosis · Discuss with a doctor",
    },

    errors: {
      ai_unconfigured: "AI service isn't configured: ANTHROPIC_API_KEY is missing. Add it to web/.env.local.",
      bad_request: "Couldn't read the data. Refresh the page and try again.",
      no_input: "Enter at least one value or a note.",
      refused: "The AI couldn't process this request. Show your labs to your doctor directly.",
      empty: "Empty response. Please try again.",
      rate_limited: "Too many requests. Wait a minute and try again.",
      ai_error: "The AI service is temporarily unavailable. Try again later.",
      server_error: "Couldn't build the summary. Please try again.",
      network: "No connection to the server. Check your internet and try again.",
    },

    disclaimers: {
      transmission: "On submit, your values are sent to an external AI service (Anthropic) and are not stored on our server.",
      notDiagnosis: "This is not a diagnosis or a treatment plan — it's material for a conversation with your doctor. Only a clinician can interpret labs against your history and the lab's own reference ranges.",
      phi: "Labs are sensitive data. They stay in this browser session, are not saved to a server, and are not published.",
      prototype: "A hackathon prototype, not a certified medical tool.",
    },
  },

  risk: {
    word: { high: "High", moderate: "Moderate", low: "Low" },
    sub: "deviation from participant baseline",
    days: { today: "Selected demo day", tomorrow: "Next historical day", d2: "+2 historical days", d3: "+3 historical days" },
    chartHigh: "high",
    chartToday: "today",
    chartDays: "{n}d ago",
    tipToday: "today",
    tipDaysAgo: "{n}d ago",
    tipLevel: "Score {n} / 100",
  },

  actions: {
    title: "How to use the score",
    red: [
      "Compare the score with your personal baseline over time",
      "Check wearable data quality and completeness",
      "Pause intense exercise if that feels appropriate",
      "Log symptoms separately — the score is not a diagnosis",
    ],
    amber: [
      "Watch the score trend rather than a single day",
      "Check wearable data quality and completeness",
      "Keep your usual sleep and recovery routine",
      "Log symptoms separately — the score is not a diagnosis",
    ],
    green: [
      "Keep collecting data consistently",
      "Keep your usual sleep and recovery routine",
      "Use the score as a trend, not a medical conclusion",
    ],
  },

  today: {
    label: "Status",
    status: "Selected historical day",
    subtitle: { red: "Noticeable physiological shift", amber: "Deviation from baseline", green: "Readings are within baseline" },
    title: { red: "Strong shift", amber: "Moderate shift", green: "Low shift" },
    riskScore: "Experimental Risk Score",
    hdi: "Deviation index",
    hdiNote: "Raw detector value; the backend score policy assigns the band.",
    meter: { low: "Low", moderate: "Moderate", high: "High" },
    meaningTitle: "What this means",
    explain: {
      red: "In this historical case, several signals ({top}) shifted steadily from the participant baseline. That raises the score but does not identify a cause.",
      amber: "The historical case readings shifted slightly from the participant baseline ({top}).",
      green: "The historical case readings are within the participant baseline.",
    },
    scoreDisclaimer: "The score describes retrospective deviation from a participant baseline. It is not a personal forecast or calibrated probability.",
    whyTitle: "Why (top signals)",
    sigmaNote: "σ — standard deviations from the participant baseline",
    source: "source: {mode} · integration: {integration} · baseline: {baseline} · data: {quality} · score version: {version} · dataset: {source} · model {model}",
    sourceModelOn: "loaded",
    sourceModelOff: "not loaded",
    synthetic: "synthetic (demo)",
    unavailableTitle: "No score was issued",
    unavailableBody: "decision_status: {status} · reason_codes: {reasons}",
  },

  replay: {
    label: "Timeline",
    legend: { rhr: "Resting HR", resp: "Respiration", hrv: "HRV", temp: "Skin temp.", sleep: "Sleep", baseline: "Baseline", hdi: "Deviation", score: "Risk Score" },
    alarm: "ALARM",
    onset: "ONSET",
    daysAxis: "Days relative to symptom onset",
    day: "Day",
    alarmActive: "Alarm active on this day",
    hdiLine: "Deviation index: {v}",
    scoreLine: " · score {n} / 100",
    scoreUnavailable: "score unavailable",
    scoreDisclaimer: "The historical 0–100 score reflects deviation from a participant baseline; it is not a forecast or calibrated probability.",
    contractMeta: "source: {source} · integration: {integration} · score version: {version}",
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
    rocSub: "trained classifier, research ranking by day",
    rocClassifier: "Classifier (AUC = {auc})",
    rocRandom: "Random (0.50)",
    detectorTitle: "Change detector",
    detectorText: "The primary research layer is a changepoint monitor (robust baseline + CUSUM). On the Stanford cohort it retrospectively evaluates sustained multi-day shifts around symptom onset.",
    method: "Method",
    signals: "Signals",
    window: "Detection window",
    windowVal: "[−{w0}, +{w1}] days",
    validatedReal: "Development baseline on the public Stanford dataset",
    validatedSynthetic: "Development baseline on synthetic demo data",
    validatedSub: "N = {n} subjects{ep} · held-out by subject — for the classifier (GroupKFold)",
    episodesCovid: " · {n} COVID episodes",
    notDiagnosis: "Does not diagnose illness. A physiological flag, not a diagnosis.",
    scoreMode: "The research demo runs in score mode: 0–100 reflects deviation from a participant baseline. Calibrated probability stays disabled until separate calibration and independent validation.",
    footnoteReal: "The numbers are on the public Stanford cohort, where only resting heart rate (Fitbit) is available. WHOOP has five channels (HRV, respiratory rate, skin temp, sleep), but the fusion rule can't be checked on a single-channel cohort, so we don't claim detection is higher there. The multi-channel mode is not yet validated.",
    signalNames: { resting_heart_rate: "resting heart rate", hrv_rmssd_milli: "HRV", respiratory_rate: "respiratory rate", skin_temp_celsius: "skin temp", sleep_performance: "sleep", spo2_percentage: "SpO₂" },
    down: "No metrics. Run training and the ML service on port 8000.",
  },

  common: { serviceDown: "ML service unavailable", serviceDownHint: "Start the Python service on port 8000 and refresh.", loading: "Loading…", and: "and" },
};

export const dict = { ru, en };
export type Dict = typeof ru;
