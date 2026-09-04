/**
 * TAO Quest Arc Data: "The Stolen Celestial Key"
 * 7 дней, 13 сцен. Промпты переписаны под фильтр Gemini:
 * без названий студий, рендереров, франшиз и без блока негативов.
 * Источник промптов: output/tao-quest-prompts/prompts/*.txt
 */

const ARC_METADATA = {
  "title": "The Stolen Celestial Key",
  "titleRu": "Похищенный Звёздный Ключ",
  "character": "TAO (The Cosmic Red Panda Mechanic)",
  "brand": "Tao Fortune",
  "duration": "7 Days (Interactive Discord Event)",
  "outfit": "Navy & Orange Textured Armor Suit with Honeycomb Chestplate",
  "referenceImage": "assets/TAO_character.png",
  "aspectRatio": "16:9",
  "renderEngine": "Gemini / Nano Banana 2 (IP-safe prompts)"
};

const CHARACTER_DNA = {
  "name": "TAO",
  "role": "Chief Cosmic Engineer & Explorer",
  "species": "Anthropomorphic Cosmic Red Panda",
  "appearance": "Expressive amber eyes, fluffy red-orange and white fur, cute rounded ears, black nose, bushy striped tail",
  "attire": "Navy-blue and bright orange textured armor suit, honeycomb chest plate, shoulder armor, utility belt with pouches and brass tools, knee pads, magnetic boots",
  "personality": "Resourceful, optimistic, quick-witted, slightly mischievous, cares deeply for his machinery and community"
};

const QUEST_DAYS = [
  {
    "day": 1,
    "titleRu": "День 1: Исчезновение в Обсерватории (Стартовый кадр)",
    "titleEn": "Day 1: Vanishing at the Starlight Altar (Kickoff)",
    "act": "Акт 1: Точка старта квеста",
    "isSingleScene": true,
    "summary": "Утренний шок: священный Ключ Созвездий, питающий Двигатель Фортуны, бесследно исчез с алтаря! На каменном полу остались лишь капли охлаждающего геля и неоновые следы. Это стартовая точка всей недели — один общий кадр, открывающий голосование за путь на День 2.",
    "votingQuestion": "Куда ТАО отправиться на поиски первого следа (определяет кадр Дня 2)?",
    "votingOptions": {
      "A": {
        "label": "Шахты вентиляции",
        "choiceText": "🅰️ Пойти по следам геля в подземные сервисные туннели базы"
      },
      "B": {
        "label": "Внешний космодром",
        "choiceText": "🅱️ Бежать на космодром и проверить датчики взлётных шлюзов"
      }
    },
    "singleScene": {
      "id": "1",
      "label": "Стартовый мастер-кадр",
      "sceneTitle": "Шок ТАО перед пустым алтарем и загадочный след",
      "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands in an old star observatory before an empty circular pedestal of white marble and gold filigree, staring at it in shock — wide eyes, mouth open in an \"O\", ears pulled back. A glowing holographic datapad in his right paw shows an amber alert; a heavy brass wrench hangs in his left. Above the pedestal a slow spiral of golden starlight and drifting embers hovers where something used to sit, casting warm light onto his chest and face. Across the polished dark-blue patterned floor, a glowing cyan fluid trail and narrow robotic tire tracks lead away toward an arched doorway. Large brass astrolabes stand in the background under a glass dome full of purple and magenta nebulae.\n\nStylized 3D character render, soft subsurface fur shading, glossy metal and marble materials, volumetric golden god-rays with cyan bounce light, shallow depth of field, high detail, 16:9 widescreen.",
      "discordCopy": "🚨 **ТАО В ШОКЕ! ЗВЁЗДНЫЙ КЛЮЧ ИСЧЕЗ! НАЧИНАЕМ 7-ДНЕВНЫЙ КВЕСТ!** 🚨\n\nДрузья, у нас космическое ЧП в Обсерватории Фортуны! \nСегодня утром ТАО пришёл откалибровать Двигатель Созвездий, а священный **Ключ Фортуны** бесследно исчез! Без него еженедельный супер-джекпот заблокирован! 😱\n\nНа полу остались капли светящегося геля и странные механические следы, уходящие в темноту. \n\n⚡ **С ЭТОГО ДНЯ ВЫ УПРАВЛЯЕТЕ СЮЖЕТОМ!**\nКаждый день ваш выбор в реакциях решает, куда отправится ТАО и какой поворот примет история. В конце недели всех участников ждёт мега-награда!\n\n**КУДА ТАО ДОЛЖЕН ОТПРАВИТЬСЯ НА ПОИСКИ?**\n🅰️ — Спуститься по следам геля в подземные вентиляционные шахты базы!\n🅱️ — Бежать на внешний космодром и проверить датчики взлётных шлюзов!\n\nСтавь реакцию **🅰️** или **🅱️** ниже! Ровно через 24 часа мы подведём итоги и опубликуем следующий кадр истории! ⏳\n🎁 *Голосуй и делись догадками в комментариях!*"
    }
  },
  {
    "day": 2,
    "titleRu": "День 2: По горячим следам",
    "titleEn": "Day 2: Tracking the Stray Signal",
    "act": "Акт 1: Развитие расследования",
    "summary": "ТАО находит микрочип с гравировкой аванпоста «Неоновый Дрифт» — логова космических контрабандистов и утилизаторов.",
    "votingQuestion": "Как ТАО проникнет на заброшенный аванпост?",
    "branches": {
      "A": {
        "id": "2A",
        "label": "По вентиляционным туннелям",
        "choiceText": "🅰️ Проползти через узкие кабельные туннели базы",
        "sceneTitle": "ТАО в неоновой кабельной шахте с микрочипом",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe crawls carefully through a tight maintenance conduit tube, a small glowing LED torch held between his teeth, examining a triangular golden microchip in his gloved paw. His amber eyes are narrowed in sharp curiosity and his banded tail curves behind him along the tunnel floor. The shaft is packed with thick glowing bundles of cyan and magenta fiber-optic cable, pulsing conduits, gentle steam venting from metal grates and worn reflective metal walls closing in around him.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, moody volumetric lighting with a high-contrast rim light along his fur and bright neon reflections on the walls, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🔍 **ДЕНЬ 2: ВЕЛИКАЯ НАХОДКА В ШАХТЕ!** 🔍\n\nВы проголосовали за шахты — и ТАО нашёл ключевую улику! \nПротиснувшись сквозь лабиринт кабелей, ТАО подобрал оброненный микрочип с эмблемой сектора **«Неоновый Дрифт»**! \n\nЭто заброшенная космическая станция на краю туманности, где собираются самые хитрые контрабандисты галактики. Похититель явно направляется туда!\n\nТАО уже подлетает к аванпосту. **Как проникаем внутрь?**\n\n🅰️ — Совершить тихую посадку на свалке аванпоста и прокрасться через чёрный ход!\n🅱️ — Пристыковаться к главному доку в наглую, притворившись выездным механиком!\n\nСтавь реакцию **🅰️** или **🅱️**! Судьба операции в твоих руках! ⚡"
      },
      "B": {
        "id": "2B",
        "label": "По следу на орбите",
        "choiceText": "🅱️ Сканировать обломки с внешней подвесной платформы",
        "sceneTitle": "ТАО на внешней платформе станции со сканером",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands on an open metal gantry walkway outside an orbital station, magnetic boots locked to the grating and a clear domed glass helmet over his head, his tail drifting behind him in the weightlessness. He holds a bulky handheld scanner in both paws and its glowing cyan holographic beam sweeps out across the void toward a distant lit asteroid outpost, a small holographic readout glowing over one eye. Behind him opens a vast cosmic vista: a dazzling purple and magenta nebula, a drifting field of crystal asteroids, and the dark silhouette of the outpost picked out by flickering neon lights.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR armor materials, starlight reflections across his armor and helmet glass, glowing cyan scanner beam, warm golden rim light outlining his fur, wide-angle framing, high detail, 16:9 widescreen.",
        "discordCopy": "📡 **ДЕНЬ 2: ТРАЕКТОРИЯ ЗАФИКСИРОВАНА!** 📡\n\nСенсоры космодрома не соврали! Сканирование внешней платформы показало четкий плазменный след, ведущий к космическому аванпосту **«Неоновый Дрифт»**!\n\nИменно там сейчас скрывается тот, кто унёс наш Звёздный Ключ!\n\nТАО выходит на орбиту аванпоста. **Какой план проникновения выбираем?**\n\n🅰️ — Скрытная высадка в секторе утилизации (свалка астероидов) под прикрытием теней!\n🅱️ — Официальная стыковка в ремонтном доке под видом мастера по гипердвигателям!\n\nГолосуйте реакциями прямо сейчас! 👇"
      }
    }
  },
  {
    "day": 3,
    "titleRu": "День 3: В логове Неонового Дрифта",
    "titleEn": "Day 3: Infiltrating the Neon Drift",
    "act": "Акт 2: Нарастание интриги",
    "summary": "ТАО проникает на станцию и выходит на таинственный сигнал, спрятанный в самых глубинах заброшенного сектора.",
    "votingQuestion": "Как ТАО доберётся до закрытого аварийного сектора?",
    "branches": {
      "A": {
        "id": "3A",
        "label": "Тайный переулок свалки",
        "choiceText": "🅰️ Пробираться через тёмный переулок мимо спящих охранников",
        "sceneTitle": "ТАО крадется по неоновому киберпанк-переулку",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe crouches low behind large glowing cargo crates in a dark alleyway, peeking around the corner with a tense, determined expression, striped tail tucked down for stealth. In one paw he holds a small radar datapad showing a pulsing golden beacon ahead. The alley is a gritty, colorful corner of an asteroid station: huge glowing neon signs in magenta, cyan and amber shaped from abstract glyphs rather than readable words, overhead pipes venting warm white steam, wet metallic ground scattering colored reflections, and floating security drones sweeping red scanning beams in the background.\n\nStylized 3D character render, soft subsurface fur shading, glossy wet-surface PBR materials, rich neon glow with puddle reflections and volumetric fog, strong rim light along his fur, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🤫 **ДЕНЬ 3: СТЕЛС-РЕЖИМ НА МАКСИМУМ!** 🤫\n\nВы выбрали скрытный путь — и ТАО мастерски обошел все патрули на свалке «Неонового Дрифта»!\n\nСреди неоновых вывесок и гудящих вентиляторов сканер ТАО поймал мощнейший импульс энергии Звёздного Ключа! Сигнал доносится из самого глубокого заброшенного уровня — Защитного Бункера!\n\nНо путь преграждают системы безопасности. **Как ТАО проникнет в глубь станции?**\n\n🅰️ — Взломать сервисный грузовой лифт через консоль управления!\n🅱️ — Спуститься на страховочном тросе через вентиляционную грави-шахту!\n\nЖми **🅰️** или **🅱️**! Скоро мы узнаем, кто стоит за этим! 🕵️‍♂️"
      },
      "B": {
        "id": "3B",
        "label": "Космо-бар контрабандистов",
        "choiceText": "🅱️ Сидеть у стойки космо-бара и сканировать частоты гостей",
        "sceneTitle": "ТАО в шумном космическом баре с детективным сканером",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe sits casually at a sleek curved counter inside a busy space tavern, pretending to polish a brass wrench with a cloth while his eyes flick down to an open toolkit beside him. Inside the toolkit a glowing frequency analyzer shows a golden energy wave spiking at its peak. Around him the room is lively and out of focus: quirky alien patrons in soft background blur, glowing neon tap handles, floating luminous jellyfish lanterns and holographic drink boards throwing amber and magenta light across the bar.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden and magenta ambient light, soft lens flare, shallow depth of field with the background falling away, high detail, 16:9 widescreen.",
        "discordCopy": "🍹 **ДЕНЬ 3: РАЗВЕДКА В КОСМО-БАРЕ!** 🍹\n\nТАО вошёл как свой в бар «Шестерёнка и Квазар»! Пока инопланетные пилоты спорят о курсе звёздной пыли, портативный сканер ТАО засек частоту Ключа! \n\nСигнал бьёт прямо из запечатанного Аварийного Бункера под станцией!\n\nДо бункера один шаг. **Как ТАО начнет спуск?**\n\n🅰️ — Взломать закрытый технический лифт с помощью отмычки-декодера!\n🅱️ — Спуститься вручную по внешней гравитационной шахте!\n\nГолосуйте реакциями! Завтра нас ждёт главный поворот недели! 💥"
      }
    }
  },
  {
    "day": 4,
    "titleRu": "День 4: 💥 СЮЖЕТНЫЙ ПОВОРОТ: Маленький Защитник",
    "titleEn": "Day 4: Plot Twist - The Tiny Guardian",
    "act": "Акт 2: Кульминационный поворот",
    "summary": "ШОК! Ключ никто не крал! Старый сервисный дрон ТАО спрятал Ключ в бронированный бункер, спасая его от надвигающейся смертоносной Гамма-Бури. Но дверь заклинило, а до бури — считанные часы!",
    "votingQuestion": "Каким способом ТАО взломает гермозатвор бункера?",
    "branches": {
      "A": {
        "id": "4A",
        "label": "Шок сквозь бронестекло",
        "choiceText": "🅰️ ТАО светит фонарем сквозь бронированное стекло на запертого дрона",
        "sceneTitle": "ТАО узнает своего старого круглого сервисного дрона",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe presses a gloved paw flat against the thick circular reinforced viewport of a massive titanium vault door, amber eyes wide with shock, relief and affection, mouth parted in realization. Behind the glass, sealed inside the vault, a small battered spherical service robot with brass patch-welds and glowing blue eyes hugs a radiant golden Constellation Key and looks back at him apologetically. Around the doorway: heavy steel gear teeth, flickering amber emergency lights, hydraulic pipes hissing steam and painted hazard markings.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal and glass materials, brilliant golden light from the Key spilling through the viewport onto his face, contrasted with deep cyan and amber corridor light, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "💥 **ДЕНЬ 4: СЮЖЕТНЫЙ ПОВОРОТ! ОН НЕ ВОР!** 💥\n\nТАО добрался до бункера, посветил в смотровое окно... И ОБОМЛЕЛ! 😱\n\nНикаких космических пиратов нет! Внутри заперт его собственный **старый сервисный дрон Болт**, которого ТАО считал списанным!\n\nОказывается, Болт засёк аномалию: к нашей звёздной системе несётся **смертоносная Гамма-Буря**! Если бы Ключ оставался в открытом алтаре, он бы взорвал весь Двигатель Фортуны! Дрон унёс Ключ в самый бронированный сейф, но автоматика сглючила и запечатала дверь намертво!\n\nДо удара бури осталось 48 часов! Если мы не достанем Ключ и не настроим защитное поле, пострадает вся система!\n\n**Как вскрываем бункер?**\n🅰️ — Срезать силовые кабели магнитного замка плазменным резаком!\n🅱️ — Взломать древнюю рунную консоль и подобрать цифровой код!\n\nРешать вам! Жмите **🅰️** или **🅱️**! ⏳"
      },
      "B": {
        "id": "4B",
        "label": "Голограмма надвигающейся бури",
        "choiceText": "🅱️ Дрон проецирует голограмму космической бури",
        "sceneTitle": "Проекция предупреждения о космической буре сквозь стекло",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands outside a sealed pressure door, staring intently through the thick reinforced viewport, holding his heavy brass wrench in both paws, urgency in his eyes. On the far side of the glass the small round service robot projects a glowing red and amber wireframe hologram: a huge solar flare and a wall of charged storm cloud sweeping toward a distant observatory dome. The corridor around him is high-security and industrial — heavy steel ribs, hydraulic pistons, flashing amber hazard beacons and steam venting from pressure valves.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, dramatic red and cyan dual-tone lighting, bright holographic glow lighting his face and suit, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⚠️ **ДЕНЬ 4: ТРЕВОГА ГАЛАКТИЧЕСКОГО МАСШТАБА!** ⚠️\n\nГолограмма дрона не оставляет сомнений: это была не кража, это была СПАСАТЕЛЬНАЯ ОПЕРАЦИЯ! \n\nНа галактику надвигается супер-шторм! Дрон спас Ключ, но теперь оказался в ловушке. Без Ключа мы не сможем активировать защитный купол Фортуны!\n\nСчёт пошёл на часы! **Какую тактику выбираем для спасения Ключа?**\n\n🅰️ — Грубая сила: срезать кабели питания замков плазморезом!\n🅱️ — Интеллект: расшифровать кодовую комбинацию на терминале доступа!\n\nКаждый клик на счету! 🅰️ или 🅱️?"
      }
    }
  },
  {
    "day": 5,
    "titleRu": "День 5: Инженерный взлом под таймером",
    "titleEn": "Day 5: High-Voltage Override",
    "act": "Акт 3: Кульминация и Преодоление",
    "summary": "ТАО берется за сложнейший инженерный взлом под свист пара и нарастающую вибрацию надвигающейся бури.",
    "votingQuestion": "Как завершить взлом: Синей Плазмой или Золотой Энергией?",
    "branches": {
      "A": {
        "id": "5A",
        "label": "Силовой взлом кабелей",
        "choiceText": "🅰️ ТАО висит на тросе и режет кабели плазменным резаком",
        "sceneTitle": "ТАО на подвесе перерезает силовые магистрали замка",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe hangs in a heavy-duty safety harness on a cable high above a deep glowing reactor shaft, flip-up welding goggles pushed up on his brow, jaw set in concentration. In his paws a blue plasma welding torch works across a massive junction box of thick glowing cables, throwing a spectacular spray of golden and electric-cyan sparks across the frame. Around him rises a huge industrial shaft: giant hydraulic pistons, humming conduits, clouds of white venting steam and metal walkways far below.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, dynamic light from the welding sparks and blue arc, warm golden reflections on his armor and fur, motion in the falling sparks, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⚡ **ДЕНЬ 5: ИСКРЫ, ПЛАЗМА И СЕКУНДОМЕР!** ⚡\n\nВы выбрали силовой взлом — и ТАО уже на тросе прямо над шахтой реактора! \n\nИскры летят снопом, плазморез прожигает толстую титановую броню распределительного щитка. Замки бункера начинают искрить и трещать, но для окончательного сброса питания нужно выбрать финальный импульс!\n\n**ЗАГАДКА ДЛЯ КОМЬЮНИТИ:**\nОсталось замкнуть последнюю клемму! \n\n🅰️ — Подать импульс Синей Плазмы (сверхвысокое напряжение)!\n🅱️ — Сбалансировать систему Золотой Солнечной Энергией (мягкий резонанс)!\n\nГолосуйте реакцией — правильный выбор откроет бункер без аварии! 🔥"
      },
      "B": {
        "id": "5B",
        "label": "Интеллектуальный взлом консоли",
        "choiceText": "🅱️ ТАО настраивает голографические кольца созвездий на консоли",
        "sceneTitle": "ТАО решает астрономическую головоломку на терминале",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands before a towering ancient terminal pedestal, both paws delicately rotating and aligning glowing holographic rings of golden constellations and celestial glyphs that float in mid-air around him. His face is lit from below with inspiration and focus, amber eyes bright with the moment the pattern clicks. The chamber behind him is dark polished obsidian engraved with glowing cyan runes, drifting data particles and slowly spinning astrolabe gears.\n\nStylized 3D character render, soft subsurface fur shading, glossy obsidian and brass materials, ethereal golden and cyan holographic glow reflecting off his fur and armor, rich volumetric lighting, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🧩 **ДЕНЬ 5: ГОЛОВОЛОМКА ЗВЁЗДНЫХ ВРАТ!** 🧩\n\nВы выбрали интеллект — и ТАО уже перед древним терминалом доступа!\n\nГолографические кольца созвездий пришли в движение. ТАО подобрал 3 из 4 символов ключа, остался последний выбор частоты!\n\nКакой элемент замкнет звездный шифр?\n🅰️ — Синхронизировать с частотой Синей Звезды (Синяя Плазма)!\n🅱️ — Выровнять по лучу Золотого Солнца (Солнечная Гармоника)!\n\nВыбирай реакцию **🅰️** или **🅱️**! Завтра затвор бункера падет! 🔓"
      }
    }
  },
  {
    "day": 6,
    "titleRu": "День 6: Прорыв и Гонка со Временем",
    "titleEn": "Day 6: The Breach & Hyper-Drive Race",
    "act": "Акт 3: Спасение и побег",
    "summary": "Бункер распахнут! Дрон передает Ключ ТАО. Времени в обрез: ракета ТАО стартует сквозь начинающийся шторм назад к Обсерватории!",
    "votingQuestion": "Помоги ракете ТАО набрать турбо-ускорение реакцией 🚀!",
    "branches": {
      "A": {
        "id": "6A",
        "label": "Распахнутый шлюз бункера",
        "choiceText": "🅰️ Огромные створки бункера раскрываются, ТАО принимает Ключ",
        "sceneTitle": "Триумфальное открытие тяжелых гермодверей",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nThe massive circular geared vault door has split wide open, billowing white steam and golden light pouring out through the gap. He kneels down in the doorway with a big proud smile, both paws open and cupped, as the small round service robot hovers forward and gently sets the glowing golden Constellation Key into them. Behind them the heavy steel gears sit fully retracted and the polished floor reflects the golden light and drifting steam.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, warm volumetric god-rays streaming through the doorway, brilliant golden glow from the Key lighting both characters from below, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🔓 **ДЕНЬ 6: ЗАМОК СЛОМАН! КЛЮЧ У НАС!** 🔓\n\nЕСТЬ ПРОРЫВ! Огромная дверь бункера с шипением пара распахнулась!\n\nВерный дрон Болт цел и невредим, а в лапах у ТАО снова сияет священный **Звёздный Ключ**! ✨\nНо радоваться рано: за стенами станции уже гремят первые раскаты Гамма-Шторма! \n\nТАО запрыгивает в ракету и берет курс на Обсерваторию Фортуны! До полуночи мы должны вернуть Ключ на алтарь!\n\n🔥 **ФИНАЛЬНЫЙ СБОР ЭНЕРГИИ:**\nЖми реакцию **🚀**, чтобы влить гипер-топливо в двигатели ТАО! Если наберем 100 ракет, завтра начнется грандиозный ДРОП! 🚀💥"
      },
      "B": {
        "id": "6B",
        "label": "Старт ракеты сквозь бурю",
        "choiceText": "🅱️ Ракета ТАО взлетает сквозь фиолетовые волны космической бури",
        "sceneTitle": "Ракета ТАО мчится сквозь космический шторм",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes, wearing the same navy-blue and orange armor suit with honeycomb chest plate — he is smaller in frame here, inside the cockpit, so keep his face and markings clearly readable.\n\nA retro-futuristic purple rocket marked with golden star emblems tears across the frame at full burn. Through the transparent cockpit canopy he is piloting at the control helm, paws on the yoke, focused and grinning, with the small round service robot perched on the dashboard beside the radiant golden Constellation Key. Around the rocket rages a violent space storm: rolling violet and magenta cosmic clouds, crackling cyan plasma lightning and drifting debris. Far ahead in the clear distance glows the calm golden corona of the home planet and its observatory dome.\n\nStylized 3D render, glossy painted-metal hull materials, electrifying violet and cyan ambient light, intense golden ion exhaust plumes trailing behind, motion blur on the cosmic dust streaking past, high detail, 16:9 widescreen.",
        "discordCopy": "⚡ **ДЕНЬ 6: ГОНКА НА ГИПЕРСКОРОСТИ!** ⚡\n\nМы успели вырваться с аванпоста за секунду до удара шторма! \nТАО за штурвалом своей фиолетовой ракеты, а спасённый дрон бережно держит Звёздный Ключ! \n\nВпереди маячит золотой свет Обсерватории. Завтра — день великого финала и включения Двигателя Фортуны!\n\nВрубаем форсаж! Жми **🚀** под постом, чтобы помочь ТАО добраться вовремя! Завтра каждый участник получит награду! 🎁✨"
      }
    }
  },
  {
    "day": 7,
    "titleRu": "День 7: Гранд-Финал и Мега-Праздник",
    "titleEn": "Day 7: The Grand Starlight Festival",
    "act": "Финал: Триумф и Раздача Наград",
    "summary": "Ключ возвращен в алтарь! Двигатель активирован, созвездия озаряют небо, запускается грандиозный праздник в Discord с раздачей промокодов!",
    "votingQuestion": "Забирай заслуженный мега-промокод недели в Discord!",
    "branches": {
      "A": {
        "id": "7A",
        "label": "Активация Звёздного Двигателя",
        "choiceText": "🅰️ ТАО поворачивает Ключ в алтаре — рождение золотого портала",
        "sceneTitle": "Торжественный момент активации Звездного Алтаря",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands triumphant at the centre of a grand observatory terrace, a radiant proud smile on his face, both paws firmly turning the golden Constellation Key inside an ornate astronomical altar slot. A towering pillar of golden starlight erupts straight up into the night sky, spreading into an expanding ring of shimmering golden constellations and glowing glyph patterns across the cosmos. The small repaired service robot hovers beside him, spinning with joy. Behind them the restored observatory turns: massive bronze astrolabes rotating smoothly, swirling golden cosmic dust and a panoramic glass dome full of vibrant purple starlight.\n\nStylized 3D character render, soft subsurface fur shading, glossy bronze and marble materials, glorious golden volumetric god-rays, warm sparkling particles in the air, rich celestial colors, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🌟 **ДЕНЬ 7: ДВИГАТЕЛЬ ФОРТУНЫ ЗАПУЩЕН! МЫ СДЕЛАЛИ ЭТО!** 🌟\n\nВЫ ЭТО ВИДИТЕ?! ТАО вернул Звёздный Ключ на законное место! ✨\n\nЗолотой луч пронзил небеса, созвездия засияли с невиданной силой, а защитный купол Фортуны спас всю систему от космической бури!\n\nВся эта неделя состоялась благодаря вашим решениям и голосам! Вы лучшие исследователи галактики! 🏆\n\n🎁 **ТВОЙ ЗАСЛУЖЕННЫЙ МЕГА-БОНУС:**\nИспользуй праздничный промокод: **TAO_STELLAR_WIN**\n* Активаций: 500\n* Действует: 48 часов\n* Вводи прямо сейчас в личном кабинете Tao Fortune!\n\nДелись скринами выигрышей в комментариях! ТАО салютует каждому из вас! 🚀🥂"
      },
      "B": {
        "id": "7B",
        "label": "Мега-праздник с сундуком сокровищ",
        "choiceText": "🅱️ ТАО на сундуке с сокровищами празднует победу с комьюнити",
        "sceneTitle": "ТАО на вершине горы золотых монет и кристаллов",
        "prompt": "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe sits perched triumphantly on the rim of a massive open treasure chest overflowing with sparkling golden coins, glowing gems and star-sealed envelopes. He raises a brass wrench in a victory salute with a cheerful wink, an open glowing scroll in his other paw. The small round service robot loops around him trailing confetti streamers and sparks of light. The hall behind him is dressed for celebration: floating starlight balloons, golden confetti caught mid-air, glowing star lanterns and a warm festive haze. Keep all coins, gems and surfaces free of lettering — smooth blank metal faces only.\n\nStylized 3D character render, soft subsurface fur shading, glossy gold and gemstone materials, sparkling warm golden light, dazzling reflections across the coins and crystals, festive bokeh in the background, high-key vibrant atmosphere, high detail, 16:9 widescreen.",
        "discordCopy": "🎉 **ГРАНД-ФИНАЛ: ВЕЛИКИЙ ПРАЗДНИК TAO FORTUNE!** 🎉\n\nСУНДУК ФОРТУНЫ РАСПАХНУТ ДЛЯ ВСЕХ! 💰✨\n\nВся станция празднует спасение Звёздного Ключа! ТАО и дрон Болт передают вам огромный космический респект за каждый голос, каждую реакцию и помощь в расследовании!\n\nЗабирай финальный праздничный код недели:\n💎 ПРОМОКОД: **TAO_JACKPOT_KEY**\n⭐ 100 бесплатных вращений + космический бонус к депозиту!\n\nПиши в чате свои поздравления ТАО и жми ❤️! До встречи в следующей интерактивной арке! 🌌🐼"
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARC_METADATA, CHARACTER_DNA, QUEST_DAYS };
}
