/**
 * TAO Discord Quest Dashboard — Multi-Week Campaign Data
 * Поддержка переключения между неделями:
 * - Неделя 1: "Похищенный Звёздный Ключ" (The Stolen Celestial Key)
 * - Неделя 2: "Затерянный Неоновый Оазис Элизиума-9" (The Bioluminescent Oasis of Elysium-9)
 */

const ALL_ARCS = {
  "week-1": {
    id: "week-1",
    tabLabel: "🔑 Неделя 1: Звёздный Ключ",
    badgeLabel: "Неделя 1 (Завершена)",
    status: "Архив / Завершена",
    metadata: {
      title: "The Stolen Celestial Key",
      titleRu: "Похищенный Звёздный Ключ",
      character: "TAO (The Cosmic Red Panda Mechanic)",
      brand: "Tao Fortune",
      duration: "7 Days (Interactive Discord Event)",
      outfit: "Navy & Orange Textured Armor Suit with Honeycomb Chestplate",
      referenceImage: "assets/TAO_character.png",
      aspectRatio: "16:9",
      renderEngine: "Google AI Studio / Gemini Nano Banana 2"
    },
    characterDna: {
      name: "TAO (Космическая Красная Панда)",
      role: "Главный инженер-механик Обсерватории",
      species: "Anthropomorphic Mascot (Panda-like)",
      appearance: "Expressive amber eyes, fluffy red-orange and white fur, cute rounded ears, black nose, bushy striped tail",
      attire: "Navy-blue and bright orange textured armor suit, honeycomb chest plate, utility belt with brass tools, knee pads",
      personality: "Resourceful, optimistic, quick-witted, slightly mischievous, cares deeply for his machinery and community"
    },
    dnaPrefix: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.",
    subheading: "Интерактивная сюжетная кампания для Discord • 1 стартовый мастер-кадр + 12 ответвлений (16:9) • Похищение Ключа Созвездий",
    days: [
      {
        day: 1,
        titleRu: "День 1: Исчезновение в Обсерватории (Стартовый кадр)",
        titleEn: "Day 1: Vanishing at the Starlight Altar (Kickoff)",
        act: "Акт 1: Точка старта квеста",
        isSingleScene: true,
        summary: "Утренний шок: священный Ключ Созвездий, питающий Двигатель Фортуны, бесследно исчез с алтаря! На каменном полу остались лишь капли охлаждающего геля и неоновые следы. Это стартовая точка всей недели — один общий кадр, открывающий голосование за путь на День 2.",
        votingQuestion: "Куда ТАО отправиться на поиски первого следа (определяет кадр Дня 2)?",
        votingOptions: {
          A: {
            label: "Шахты вентиляции",
            choiceText: "🅰️ Пойти по следам геля в подземные сервисные туннели базы"
          },
          B: {
            label: "Внешний космодром",
            choiceText: "🅱️ Бежать на космодром и проверить датчики взлётных шлюзов"
          }
        },
        singleScene: {
          id: "1",
          label: "Стартовый мастер-кадр",
          sceneTitle: "Шок ТАО перед пустым алтарем и загадочный след",
          prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands in an old star observatory before an empty circular pedestal of white marble and gold filigree, staring at it in shock — wide eyes, mouth open in an \"O\", ears pulled back. A glowing holographic datapad in his right paw shows an amber alert; a heavy brass wrench hangs in his left. Above the pedestal a slow spiral of golden starlight and drifting embers hovers where something used to sit, casting warm light onto his chest and face. Across the polished dark-blue patterned floor, a glowing cyan fluid trail and narrow robotic tire tracks lead away toward an arched doorway. Large brass astrolabes stand in the background under a glass dome full of purple and magenta nebulae.\n\nStylized 3D character render, soft subsurface fur shading, glossy metal and marble materials, volumetric golden god-rays with cyan bounce light, shallow depth of field, high detail, 16:9 widescreen.",
          discordCopy: "🚨 **ТАО В ШОКЕ! ЗВЁЗДНЫЙ КЛЮЧ ИСЧЕЗ! НАЧИНАЕМ 7-ДНЕВНЫЙ КВЕСТ!** 🚨\n\nДрузья, у нас космическое ЧП в Обсерватории Фортуны! \nСегодня утром ТАО пришёл откалибровать Двигатель Созвездий, а священный **Ключ Фортуны** бесследно исчез! Без него еженедельный супер-джекпот заблокирован! 😱\n\nНа полу остались капли светящегося геля и странные механические следы, уходящие в темноту. \n\n⚡ **С ЭТОГО ДНЯ ВЫ УПРАВЛЯЕТЕ СЮЖЕТОМ!**\nКаждый день ваш выбор в реакциях решает, куда отправится ТАО и какой поворот примет история. В конце недели всех участников ждёт мега-награда!\n\n**КУДА ТАО ДОЛЖЕН ОТПРАВИТЬСЯ НА ПОИСКИ?**\n🅰️ — Спуститься по следам геля в подземные вентиляционные шахты базы!\n🅱️ — Бежать на внешний космодром и проверить датчики взлётных шлюзов!\n\nСтавь реакцию **🅰️** или **🅱️** ниже! Ровно через 24 часа мы подведём итоги и опубликуем следующий кадр истории! ⏳\n🎁 *Голосуй и делись догадками в комментариях!*"
        }
      },
      {
        day: 2,
        titleRu: "День 2: По горячим следам",
        titleEn: "Day 2: Tracking the Stray Signal",
        act: "Акт 1: Развитие расследования",
        summary: "ТАО находит микрочип с гравировкой аванпоста «Неоновый Дрифт» — логова космических контрабандистов и утилизаторов.",
        votingQuestion: "Как ТАО проникнет на заброшенный аванпост?",
        branches: {
          A: {
            id: "2A",
            label: "По вентиляционным туннелям",
            choiceText: "🅰️ Проползти через узкие кабельные туннели базы",
            sceneTitle: "ТАО в неоновой кабельной шахте с микрочипом",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe crawls carefully through a tight maintenance conduit tube, a small glowing LED torch held between his teeth, examining a triangular golden microchip in his gloved paw. His amber eyes are narrowed in sharp curiosity and his banded tail curves behind him along the tunnel floor. The shaft is packed with thick glowing bundles of cyan and magenta fiber-optic cable, pulsing conduits, gentle steam venting from metal grates and worn reflective metal walls closing in around him.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, moody volumetric lighting with a high-contrast rim light along his fur and bright neon reflections on the walls, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔍 **ДЕНЬ 2: ВЕЛИКАЯ НАХОДКА В ШАХТЕ!** 🔍\n\nВы проголосовали за шахты — и ТАО нашёл ключевую улику! \nПротиснувшись сквозь лабиринт кабелей, ТАО подобрал оброненный микрочип с эмблемой сектора **«Неоновый Дрифт»**! \n\nЭто заброшенная космическая станция на краю туманности, где собираются самые хитрые контрабандисты галактики. Похититель явно направляется туда!\n\nТАО уже подлетает к аванпосту. **Как проникаем внутрь?**\n\n🅰️ — Совершить тихую посадку на свалке аванпоста и прокрасться через чёрный ход!\n🅱️ — Пристыковаться к главному доку в наглую, притворившись выездным механиком!\n\nСтавь реакцию **🅰️** или **🅱️**! Судьба операции в твоих руках! ⚡"
          },
          B: {
            id: "2B",
            label: "По следу на орбите",
            choiceText: "🅱️ Сканировать обломки с внешней подвесной платформы",
            sceneTitle: "ТАО на внешней платформе станции со сканером",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands braced on an open metal gantry catwalk in zero gravity outside an orbital station, an illuminated tactical holographic visor over one eye, his tail floating out behind him. In both paws he aims a bulky scanner that throws a glowing cyan holographic beam across the void toward a distant lit asteroid outpost. Behind him opens a vast cosmic vista: a dazzling purple and magenta nebula, a drifting field of crystal asteroids, and the dark silhouette of the outpost picked out by flickering neon lights.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR armor materials, starlight reflections across armor and visor, glowing cyan scanner cone, warm golden rim light outlining his fur, wide-angle framing, high detail, 16:9 widescreen.",
            discordCopy: "📡 **ДЕНЬ 2: ТРАЕКТОРИЯ ЗАФИКСИРОВАНА!** 📡\n\nСенсоры космодрома не соврали! Сканирование внешней платформы показало четкий плазменный след, ведущий к космическому аванпосту **«Неоновый Дрифт»**!\n\nИменно там сейчас скрывается тот, кто унёс наш Звёздный Ключ!\n\nТАО выходит на орбиту аванпоста. **Какой план проникновения выбираем?**\n\n🅰️ — Скрытная высадка в секторе утилизации (свалка астероидов) под прикрытием теней!\n🅱️ — Официальная стыковка в ремонтном доке под видом мастера по гипердвигателям!\n\nГолосуйте реакциями прямо сейчас! 👇"
          }
        }
      },
      {
        day: 3,
        titleRu: "День 3: В логове Неонового Дрифта",
        titleEn: "Day 3: Infiltrating the Neon Drift",
        act: "Акт 2: Нарастание интриги",
        summary: "ТАО проникает на станцию и выходит на таинственный сигнал, спрятанный в самых глубинах заброшенного сектора.",
        votingQuestion: "Как ТАО доберётся до закрытого аварийного сектора?",
        branches: {
          A: {
            id: "3A",
            label: "Тайный переулок свалки",
            choiceText: "🅰️ Пробираться через тёмный переулок мимо спящих охранников",
            sceneTitle: "ТАО крадется по неоновому киберпанк-переулку",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe crouches low behind large glowing cargo crates in a dark alleyway, peeking around the corner with a tense, determined expression, striped tail tucked down for stealth. In one paw he holds a small radar datapad showing a pulsing golden beacon ahead. The alley is a gritty, colorful corner of an asteroid station: huge glowing neon signs in magenta, cyan and amber shaped from abstract glyphs rather than readable words, overhead pipes venting warm white steam, wet metallic ground scattering colored reflections, and floating security drones sweeping red scanning beams in the background.\n\nStylized 3D character render, soft subsurface fur shading, glossy wet-surface PBR materials, rich neon glow with puddle reflections and volumetric fog, strong rim light along his fur, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🤫 **ДЕНЬ 3: СТЕЛС-РЕЖИМ НА МАКСИМУМ!** 🤫\n\nВы выбрали скрытный путь — и ТАО мастерски обошел все патрули на свалке «Неонового Дрифта»!\n\nСреди неоновых вывесок и гудящих вентиляторов сканер ТАО поймал мощнейший импульс энергии Звёздного Ключа! Сигнал доносится из самого глубокого заброшенного уровня — Защитного Бункера!\n\nНо путь преграждают системы безопасности. **Как ТАО проникнет в глубь станции?**\n\n🅰️ — Взломать сервисный грузовой лифт через консоль управления!\n🅱️ — Спуститься на страховочном тросе через вентиляционную грави-шахту!\n\nЖми **🅰️** или **🅱️**! Скоро мы узнаем, кто стоит за этим! 🕵️‍♂️"
          },
          B: {
            id: "3B",
            label: "Космо-бар контрабандистов",
            choiceText: "🅱️ Сидеть у стойки космо-бара и сканировать частоты гостей",
            sceneTitle: "ТАО в шумном космическом баре с детективным сканером",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe sits casually at a sleek curved counter inside a busy space tavern, pretending to polish a brass wrench with a cloth while his eyes flick down to an open toolkit beside him. Inside the toolkit a glowing frequency analyzer shows a golden energy wave spiking at its peak. Around him the room is lively and out of focus: quirky alien patrons in soft background blur, glowing neon tap handles, floating luminous jellyfish lanterns and holographic drink boards throwing amber and magenta light across the bar.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden and magenta ambient light, soft lens flare, shallow depth of field with the background falling away, high detail, 16:9 widescreen.",
            discordCopy: "🍹 **ДЕНЬ 3: РАЗВЕДКА В КОСМО-БАРЕ!** 🍹\n\nТАО вошёл как свой в бар «Шестерёнка и Квазар»! Пока инопланетные пилоты спорят о курсе звёздной пыли, портативный сканер ТАО засек частоту Ключа! \n\nСигнал бьёт прямо из запечатанного Аварийного Бункера под станцией!\n\nДо бункера один шаг. **Как ТАО начнет спуск?**\n\n🅰️ — Взломать закрытый технический лифт с помощью отмычки-декодера!\n🅱️ — Спуститься вручную по внешней гравитационной шахте!\n\nГолосуйте реакциями! Завтра нас ждёт главный поворот недели! 💥"
          }
        }
      },
      {
        day: 4,
        titleRu: "День 4: 💥 СЮЖЕТНЫЙ ПОВОРОТ: Маленький Защитник",
        titleEn: "Day 4: Plot Twist - The Tiny Guardian",
        act: "Акт 2: Кульминационный поворот",
        summary: "ШОК! Ключ никто не крал! Старый сервисный дрон ТАО спрятал Ключ в бронированный бункер, спасая его от надвигающейся смертоносной Гамма-Бури. Но дверь заклинило, а до бури — считанные часы!",
        votingQuestion: "Каким способом ТАО взломает гермозатвор бункера?",
        branches: {
          A: {
            id: "4A",
            label: "Шок сквозь бронестекло",
            choiceText: "🅰️ ТАО светит фонарем сквозь бронированное стекло на запертого дрона",
            sceneTitle: "ТАО узнает своего старого круглого сервисного дрона",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe presses a gloved paw flat against the thick circular reinforced viewport of a massive titanium vault door, amber eyes wide with shock, relief and affection, mouth parted in realization. Behind the glass, sealed inside the vault, a small battered spherical service robot with brass patch-welds and glowing blue eyes hugs a radiant golden Constellation Key and looks back at him apologetically. Around the doorway: heavy steel gear teeth, flickering amber emergency lights, hydraulic pipes hissing steam and painted hazard markings.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal and glass materials, brilliant golden light from the Key spilling through the viewport onto his face, contrasted with deep cyan and amber corridor light, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💥 **ДЕНЬ 4: СЮЖЕТНЫЙ ПОВОРОТ! ОН НЕ ВОР!** 💥\n\nТАО добрался до бункера, посветил в смотровое окно... И ОБОМЛЕЛ! 😱\n\nНикаких космических пиратов нет! Внутри заперт его собственный **старый сервисный дрон Болт**, которого ТАО считал списанным!\n\nОказывается, Болт засёк аномалию: к нашей звёздной системе несётся **смертоносная Гамма-Буря**! Если бы Ключ оставался в открытом алтаре, он бы взорвал весь Двигатель Фортуны! Дрон унёс Ключ в самый бронированный сейф, но автоматика сглючила и запечатала дверь намертво!\n\nДо удара бури осталось 48 часов! Если мы не достанем Ключ и не настроим защитное поле, пострадает вся система!\n\n**Как вскрываем бункер?**\n🅰️ — Срезать силовые кабели магнитного замка плазменным резаком!\n🅱️ — Взломать древнюю рунную консоль и подобрать цифровой код!\n\nРешать вам! Жмите **🅰️** или **🅱️**! ⏳"
          },
          B: {
            id: "4B",
            label: "Голограмма надвигающейся бури",
            choiceText: "🅱️ Дрон проецирует голограмму космической бури",
            sceneTitle: "Проекция предупреждения о космической буре сквозь стекло",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands outside a locked blast door, staring intently through the thick reinforced viewport, gripping his heavy brass wrench with both paws, urgency in his eyes. On the far side of the glass the small round service robot projects a glowing red and amber wireframe hologram: a huge solar flare and radiation storm sweeping toward a distant observatory dome. The corridor around him is high-security and industrial — heavy steel ribs, hydraulic pistons, flashing amber hazard beacons and steam venting from pressure valves.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, dramatic red and cyan dual-tone lighting, bright holographic glow lighting his face and suit, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚠️ **ДЕНЬ 4: ТРЕВОГА ГАЛАКТИЧЕСКОГО МАСШТАБА!** ⚠️\n\nГолограмма дрона не оставляет сомнений: это была не кража, это была СПАСАТЕЛЬНАЯ ОПЕРАЦИЯ! \n\nНа галактику надвигается супер-шторм! Дрон спас Ключ, но теперь оказался в ловушке. Без Ключа мы не сможем активировать защитный купол Фортуны!\n\nСчёт пошёл на часы! **Какую тактику выбираем для спасения Ключа?**\n\n🅰️ — Грубая сила: срезать кабели питания замков плазморезом!\n🅱️ — Интеллект: расшифровать кодовую комбинацию на терминале доступа!\n\nКаждый клик на счету! 🅰️ или 🅱️?"
          }
        }
      },
      {
        day: 5,
        titleRu: "День 5: Инженерный взлом под таймером",
        titleEn: "Day 5: High-Voltage Override",
        act: "Акт 3: Кульминация и Преодоление",
        summary: "ТАО берется за сложнейший инженерный взлом под свист пара и нарастающую вибрацию надвигающейся бури.",
        votingQuestion: "Как завершить взлом: Синей Плазмой или Золотой Энергией?",
        branches: {
          A: {
            id: "5A",
            label: "Силовой взлом кабелей",
            choiceText: "🅰️ ТАО висит на тросе и режет кабели плазменным резаком",
            sceneTitle: "ТАО на подвесе перерезает силовые магистрали замка",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe hangs in a heavy-duty safety harness on a cable high above a deep glowing reactor shaft, flip-up welding goggles pushed up on his brow, jaw set in concentration. In his paws a blue plasma cutting torch bites into a massive junction box of thick glowing cables, throwing a spectacular spray of golden and electric-cyan sparks across the frame. Around him rises a huge industrial shaft: giant hydraulic pistons, humming conduits, clouds of white venting steam and metal walkways far below.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, dynamic light from the cutting sparks and blue arc, warm golden reflections on his armor and fur, motion in the falling sparks, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚡ **ДЕНЬ 5: ИСКРЫ, ПЛАЗМА И СЕКУНДОМЕР!** ⚡\n\nВы выбрали силовой взлом — и ТАО уже на тросе прямо над шахтой реактора! \n\nИскры летят снопом, плазморез прожигает толстую титановую броню распределительного щитка. Замки бункера начинают искрить и трещать, но для окончательного сброса питания нужно выбрать финальный импульс!\n\n**ЗАГАДКА ДЛЯ КОМЬЮНИТИ:**\nОсталось замкнуть последнюю клемму! \n\n🅰️ — Подать импульс Синей Плазмы (сверхвысокое напряжение)!\n🅱️ — Сбалансировать систему Золотой Солнечной Энергией (мягкий резонанс)!\n\nГолосуйте реакцией — правильный выбор откроет бункер без аварии! 🔥"
          },
          B: {
            id: "5B",
            label: "Интеллектуальный взлом консоли",
            choiceText: "🅱️ ТАО настраивает голографические кольца созвездий на консоли",
            sceneTitle: "ТАО решает астрономическую головоломку на терминале",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands before a towering ancient terminal pedestal, both paws delicately rotating and aligning glowing holographic rings of golden constellations and celestial glyphs that float in mid-air around him. His face is lit from below with inspiration and focus, amber eyes bright with the moment the pattern clicks. The chamber behind him is dark polished obsidian engraved with glowing cyan runes, drifting data particles and slowly spinning astrolabe gears.\n\nStylized 3D character render, soft subsurface fur shading, glossy obsidian and brass materials, ethereal golden and cyan holographic glow reflecting off his fur and armor, rich volumetric lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🧩 **ДЕНЬ 5: ГОЛОВОЛОМКА ЗВЁЗДНЫХ ВРАТ!** 🧩\n\nВы выбрали интеллект — и ТАО уже перед древним терминалом доступа!\n\nГолографические кольца созвездий пришли в движение. ТАО подобрал 3 из 4 символов ключа, остался последний выбор частоты!\n\nКакой элемент замкнет звездный шифр?\n🅰️ — Синхронизировать с частотой Синей Звезды (Синяя Плазма)!\n🅱️ — Выровнять по лучу Золотого Солнца (Солнечная Гармоника)!\n\nВыбирай реакцию **🅰️** или **🅱️**! Завтра затвор бункера падет! 🔓"
          }
        }
      },
      {
        day: 6,
        titleRu: "День 6: Прорыв и Гонка со Временем",
        titleEn: "Day 6: The Breach & Hyper-Drive Race",
        act: "Акт 3: Спасение и побег",
        summary: "Бункер распахнут! Дрон передает Ключ ТАО. Времени в обрез: ракета ТАО стартует сквозь начинающийся шторм назад к Обсерватории!",
        votingQuestion: "Помоги ракете ТАО набрать турбо-ускорение реакцией 🚀!",
        branches: {
          A: {
            id: "6A",
            label: "Распахнутый шлюз бункера",
            choiceText: "🅰️ Огромные створки бункера раскрываются, ТАО принимает Ключ",
            sceneTitle: "Триумфальное открытие тяжелых гермодверей",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nThe massive circular geared vault door has split wide open, billowing white steam and golden light pouring out through the gap. He kneels down in the doorway with a big proud smile, both paws open and cupped, as the small round service robot hovers forward and gently sets the glowing golden Constellation Key into them. Behind them the heavy steel gears sit fully retracted and the polished floor reflects the golden light and drifting steam.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR metal materials, warm volumetric god-rays streaming through the doorway, brilliant golden glow from the Key lighting both characters from below, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔓 **ДЕНЬ 6: ЗАМОК СЛОМАН! КЛЮЧ У НАС!** 🔓\n\nЕСТЬ ПРОРЫВ! Огромная дверь бункера с шипением пара распахнулась!\n\nВерный дрон Болт цел и невредим, а в лапах у ТАО снова сияет священный **Звёздный Ключ**! ✨\nНо радоваться рано: за стенами станции уже гремят первые раскаты Гамма-Шторма! \n\nТАО запрыгивает в ракету и берет курс на Обсерваторию Фортуны! До полуночи мы должны вернуть Ключ на алтарь!\n\n🔥 **ФИНАЛЬНЫЙ СБОР ЭНЕРГИИ:**\nЖми реакцию **🚀**, чтобы влить гипер-топливо в двигатели ТАО! Если наберем 100 ракет, завтра начнется грандиозный ДРОП! 🚀💥"
          },
          B: {
            id: "6B",
            label: "Старт ракеты сквозь бурю",
            choiceText: "🅱️ Ракета ТАО взлетает сквозь фиолетовые волны космической бури",
            sceneTitle: "Ракета ТАО мчится сквозь космический шторм",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes, wearing the same navy-blue and orange armor suit with honeycomb chest plate — he is smaller in frame here, inside the cockpit, so keep his face and markings clearly readable.\n\nA retro-futuristic purple rocket marked with golden star emblems tears across the frame at full burn. Through the transparent cockpit canopy he is piloting at the control helm, paws on the yoke, focused and grinning, with the small round service robot perched on the dashboard beside the radiant golden Constellation Key. Around the rocket rages a violent space storm: rolling violet and magenta cosmic clouds, crackling cyan plasma lightning and drifting debris. Far ahead in the clear distance glows the calm golden corona of the home planet and its observatory dome.\n\nStylized 3D render, glossy painted-metal hull materials, electrifying violet and cyan ambient light, intense golden ion exhaust plumes trailing behind, motion blur on the cosmic dust streaking past, high detail, 16:9 widescreen.",
            discordCopy: "⚡ **ДЕНЬ 6: ГОНКА НА ГИПЕРСКОРОСТИ!** ⚡\n\nМы успели вырваться с аванпоста за секунду до удара шторма! \nТАО за штурвалом своей фиолетовой ракеты, а спасённый дрон бережно держит Звёздный Ключ! \n\nВпереди маячит золотой свет Обсерватории. Завтра — день великого финала и включения Двигателя Фортуны!\n\nВрубаем форсаж! Жми **🚀** под постом, чтобы помочь ТАО добраться вовремя! Завтра каждый участник получит награду! 🎁✨"
          }
        }
      },
      {
        day: 7,
        titleRu: "День 7: Гранд-Финал и Мега-Праздник",
        titleEn: "Day 7: The Grand Starlight Festival",
        act: "Финал: Триумф и Раздача Наград",
        summary: "Ключ возвращен в алтарь! Двигатель активирован, созвездия озаряют небо, запускается грандиозный праздник в Discord с раздачей промокодов!",
        votingQuestion: "Забирай заслуженный мега-промокод недели в Discord!",
        branches: {
          A: {
            id: "7A",
            label: "Активация Звёздного Двигателя",
            choiceText: "🅰️ ТАО поворачивает Ключ в алтаре — рождение золотого портала",
            sceneTitle: "Торжественный момент активации Звездного Алтаря",
            promoCode: "TAO_STELLAR_WIN",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands triumphant at the centre of a grand observatory terrace, a radiant proud smile on his face, both paws firmly turning the golden Constellation Key inside an ornate astronomical altar slot. A towering pillar of golden starlight erupts straight up into the night sky, spreading into an expanding ring of shimmering golden constellations and glowing glyph patterns across the cosmos. The small repaired service robot hovers beside him, spinning with joy. Behind them the restored observatory turns: massive bronze astrolabes rotating smoothly, swirling golden cosmic dust and a panoramic glass dome full of vibrant purple starlight.\n\nStylized 3D character render, soft subsurface fur shading, glossy bronze and marble materials, glorious golden volumetric god-rays, warm sparkling particles in the air, rich celestial colors, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌟 **ДЕНЬ 7: ДВИГАТЕЛЬ ФОРТУНЫ ЗАПУЩЕН! МЫ СДЕЛАЛИ ЭТО!** 🌟\n\nВЫ ЭТО ВИДИТЕ?! ТАО вернул Звёздный Ключ на законное место! ✨\n\nЗолотой луч пронзил небеса, созвездия засияли с невиданной силой, а защитный купол Фортуны спас всю систему от космической бури!\n\nВся эта неделя состоялась благодаря вашим решениям и голосам! Вы лучшие исследователи галактики! 🏆\n\n🎁 **ТВОЙ ЗАСЛУЖЕННЫЙ МЕГА-БОНУС:**\nИспользуй праздничный промокод: **TAO_STELLAR_WIN**\n* Активаций: 500\n* Действует: 48 часов\n* Вводи прямо сейчас в личном кабинете Tao Fortune!\n\nДелись скринами выигрышей в комментариях! ТАО салютует каждому из вас! 🚀🥂"
          },
          B: {
            id: "7B",
            label: "Мега-праздник с сундуком сокровищ",
            choiceText: "🅱️ ТАО на сундуке с сокровищами празднует победу с комьюнити",
            sceneTitle: "ТАО на вершине горы золотых монет и кристаллов",
            promoCode: "TAO_JACKPOT_KEY",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe sits perched triumphantly on the rim of a massive open treasure chest overflowing with sparkling golden coins, glowing gems and star-sealed envelopes. He raises a brass wrench in a victory salute with a cheerful wink, an open glowing scroll in his other paw. The small round service robot loops around him trailing confetti streamers and sparks of light. The hall behind him is dressed for celebration: floating starlight balloons, golden confetti caught mid-air, glowing star lanterns and a warm festive haze. Keep all coins, gems and surfaces free of lettering — smooth blank metal faces only.\n\nStylized 3D character render, soft subsurface fur shading, glossy gold and gemstone materials, sparkling warm golden light, dazzling reflections across the coins and crystals, festive bokeh in the background, high-key vibrant atmosphere, high detail, 16:9 widescreen.",
            discordCopy: "🎉 **ГРАНД-ФИНАЛ: ВЕЛИКИЙ ПРАЗДНИК TAO FORTUNE!** 🎉\n\nСУНДУК ФОРТУНЫ РАСПАХНУТ ДЛЯ ВСЕХ! 💰✨\n\nВся станция празднует спасение Звёздного Ключа! ТАО и дрон Болт передают вам огромный космический респект за каждый голос, каждую реакцию и помощь в расследовании!\n\nЗабирай финальный праздничный код недели:\n💎 ПРОМОКОД: **TAO_JACKPOT_KEY**\n⭐ 100 бесплатных вращений + космический бонус к депозиту!\n\nПиши в чате свои поздравления ТАО и жми ❤️! До встречи в следующей интерактивной арке! 🌌🐼"
          }
        }
      }
    ]
  },
  "week-2": {
    id: "week-2",
    tabLabel: "🌴 Неделя 2: Неоновый Оазис",
    badgeLabel: "Неделя 2 (Текущая)",
    status: "В производстве / Актуальная",
    metadata: {
      title: "The Bioluminescent Oasis of Elysium-9",
      titleRu: "Затерянный Неоновый Оазис Элизиума-9",
      character: "TAO (The Cosmic Mechanic & Explorer)",
      brand: "Tao Fortune",
      duration: "7 Days (Interactive Discord Event)",
      outfit: "Navy & Orange Textured Armor Suit with Honeycomb Chestplate",
      referenceImage: "assets/TAO_character.png",
      aspectRatio: "16:9",
      renderEngine: "Google AI Studio / Gemini Nano Banana 2"
    },
    characterDna: {
      name: "ТАО (Космический Маскот-Механик)",
      role: "Главный инженер и исследователь",
      species: "Anthropomorphic Mascot (Panda-like)",
      appearance: "Expressive amber eyes, fluffy red-orange and cream fur, cute rounded ears, bushy ringed tail",
      attire: "Navy-blue and bright orange armor suit, honeycomb chest plate, utility belt with brass tools, knee pads",
      personality: "Resourceful, optimistic, playful, curious explorer"
    },
    dnaPrefix: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.",
    subheading: "Интерактивная сюжетная кампания для Discord • 1 стартовый мастер-кадр + 12 ответвлений (16:9) • Экспедиция на Элизиум-9",
    propsBible: {
      shuttle: "his sleek delta-wing exploratory shuttle with dual orange thrusters",
      wrench: "a heavy brass utility wrench with glowing orange indicators",
      paddle: "a long brass paddle rod with glowing orange indicators",
      calibrator: "a small brass calibration tool with glowing orange indicators",
      ziplineHandle: "a brass magnetic pulley handle",
      tuningFork: "a brass acoustic tuning fork device with glowing orange indicators",
      templeArch: "before the grand entrance of the Oasis Temple, a monumental circular stone arch framed by glowing cyan crystal pillars and wide polished stone steps",
      panther: "a sleek alien panther with dark blue fur and softly glowing cyan spot patterns"
    },
    days: [
      {
        day: 1,
        titleRu: "День 1: Сигнал из глубин Элизиума-9 (Стартовый кадр)",
        titleEn: "Day 1: Signal from Elysium-9 (Kickoff)",
        act: "Акт 1: Высадка на запретной планете",
        isSingleScene: true,
        summary: "Разведывательный шаттл ТАО совершает мягкую посадку у границы светящегося леса. Навигатор фиксирует импульс древнего Источника Фортуны в самом сердце неоновых джунглей.",
        votingQuestion: "Куда ТАО направить свой первый шаг?",
        votingOptions: {
          A: {
            label: "Река света",
            choiceText: "🅰️ Сплав по реке жидкого света на энерго-борде"
          },
          B: {
            label: "Грибы-великаны",
            choiceText: "🅱️ Прыжки по шляпкам гигантских светящихся грибов"
          }
        },
        singleScene: {
          id: "1",
          label: "Стартовый мастер-кадр",
          sceneTitle: "Высадка на границе Неонового Оазиса",
          prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands at the lowered ramp of his sleek delta-wing exploratory shuttle with dual orange thrusters at the edge of an alien forest, his amber eyes wide with excitement and a bright cheerful grin on his face. In his right paw he holds a glowing holographic datapad casting a cyan grid-map of the glowing jungle ahead; the display shows only abstract glowing contour lines, no readable text or digits. His left paw rests on a heavy brass utility wrench with glowing orange indicators at his belt. In front of him unfolds a nocturnal landscape of giant twisting trees with glowing cyan veins, drifting floating spores, luminous blue moss covering the ground, and giant purple planetary rings arching across a star-filled night sky.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden shuttle headlights contrasting with soft cyan bioluminescent ground glow, shallow depth of field, high detail, 16:9 widescreen.",
          discordCopy: "🌴 **ТАО ВЫСАДИЛСЯ НА ЭЛИЗИУМ-9! НАЧИНАЕМ 7-ДНЕВНЫЙ ИНТЕРАКТИВНЫЙ КВЕСТ!** 🌴\n\nСенсоры зафиксировали легендарный **Источник Вечной Удачи** в сердце светящихся джунглей Элизиума-9! Шаттл ТАО коснулся посадочной полосы, и перед нами открывается неизведанный неоновый мир. ✨\n\n⚡ **ВЫ УПРАВЛЯЕТЕ ЭКСПЕДИЦИЕЙ!**\nКаждый день ваш голос решает, по какому пути пойдет ТАО. В конце недели всех участников ждет финальный призовой фонд!\n\n**КУДА ТАО НАПРАВИТЬСЯ СЕЙЧАС?**\n🅰️ — Сплав по реке жидкого света на энерго-борде!\n🅱️ — Прыжки по шляпкам гигантских светящихся грибов!\n\nСтавь реакцию **🅰️** или **🅱️**! Итоги ровно через 24 часа! ⏳"
        }
      },
      {
        day: 2,
        titleRu: "День 2: Вход в Неоновые Джунгли",
        titleEn: "Day 2: Entering the Neon Jungle",
        act: "Акт 1: Первые испытания чащи",
        summary: "ТАО преодолевает первые километры светящегося леса и выходит на развилку перед священным холмом.",
        votingQuestion: "К какому объекту направиться ТАО?",
        branches: {
          A: {
            id: "2A",
            label: "По реке света",
            choiceText: "🅰️ Сплав по реке жидкого света на энерго-борде",
            sceneTitle: "Сплав по реке жидкого света",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe balances skillfully on a sleek floating hoverboard gliding over the mirror surface of a glowing cyan river of liquid light, laughing cheerfully with his bushy ringed tail trailing gently in the air for balance. In his paws he holds a long brass paddle rod with glowing orange indicators, dipping it into the radiant water and sending gentle luminous ripples outward that catch warm golden glints. Along the lush riverbanks hang dangling cyan crystal vines and purple ferns, while harmless glowing aquatic creatures dart through the translucent glowing water beneath his board.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, luminous cyan water reflections bouncing onto his orange armor with warm golden glints across the ripples, soft purple rim lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌊 **ДЕНЬ 2: ПО РЕКЕ ЖИДКОГО СВЕТА!** 🌊\n\nВы выбрали сплав — и ТАО на энерго-борде рассекает зеркальную гладь сияющей реки! Вокруг плещутся неоновые создания, а сканеры показывают две точки интереса впереди.\n\n**К КАКОМУ ОБЪЕКТУ НАПРАВИТЬСЯ ТАО?**\n🅰️ — Встреча со Звёздной Пантерой в тихом гроте!\n🅱️ — Активация Древнего Голографического Тотема на утесе!\n\nГолосуй реакцией **🅰️** или **🅱️**!"
          },
          B: {
            id: "2B",
            label: "По кронам грибов",
            choiceText: "🅱️ Прыжки по шляпкам гигантских светящихся грибов",
            sceneTitle: "Прыжки по гигантским светящимся грибам",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nDynamic mid-air shot with subtle background motion blur as he is captured in an agile, joyful leap from one colossal glowing mushroom cap to another, his amber eyes bright with playful confidence and his ringed tail curled high. Below him stretches a dense canopy of enormous glowing fungi in shades of cyan and purple, releasing swirling clouds of sparkling golden spores into the twilight air. Translucent floating jelly-wisps drift harmlessly in the background, and distant purple mountain peaks gleam under the starlight.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden particle glow mixed with rich cyan and purple ambient light, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🍄 **ДЕНЬ 2: ВЕРХНИЙ ПУТЬ ПО ГРИБАМ-ВЕЛИКАНАМ!** 🍄\n\nВы проголосовали за кроны — и ТАО ловко скачет по мягким светящимся шляпкам, поднимая облака золотистых искр! С высоты открывается вид на древние тропы.\n\n**К КАКОМУ ОБЪЕКТУ НАПРАВИТЬСЯ ТАО?**\n🅰️ — Встреча со Звёздной Пантерой в тихом гроте!\n🅱️ — Активация Древнего Голографического Тотема на утесе!\n\nСтавь реакцию **🅰️** или **🅱️** прямо сейчас!"
          }
        }
      },
      {
        day: 3,
        titleRu: "День 3: Хранитель и Древний Монолит",
        titleEn: "Day 3: The Guardian & The Monolith",
        act: "Акт 2: Тайны Элизиума",
        summary: "ТАО открывает точный маршрут к Оазису, но путь преграждает глубокий Разлом Кристальных Лиан.",
        votingQuestion: "Как ТАО пересечь бездонный каньон?",
        branches: {
          A: {
            id: "3A",
            label: "Звёздная Пантера",
            choiceText: "🅰️ Встреча со Звёздной Пантерой",
            sceneTitle: "Дружба со Звёздной Пантерой",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe crouches gently on a patch of soft glowing moss, offering an open paw holding a cluster of radiant golden cosmic berries to a sleek alien panther with dark blue fur and softly glowing cyan spot patterns. The panther lowers its head calmly, sniffing the berries with gentle curious amber eyes. He wears a warm, friendly smile, tilting his head slightly with ears perked up. Natural cyan crystal stalagmites and softly glowing flora frame the tranquil forest clearing.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden berry glow illuminating their faces, balanced by cool cyan bioluminescence and soft starlight, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🐾 **ДЕНЬ 3: ДРУЖБА СО ЗВЁЗДНЫМ ХРАНИТЕЛЕМ!** 🐾\n\nТАО нашел общий язык со Звёздной Пантерой! Зверь доверился инженеру и указал тайный проход к Великому Каньону.\n\nВпереди зияет бездна с парящими кристаллами. **КАК ТАО ПЕРЕСЕЧЬ БЕЗДОННЫЙ КАНЬОН?**\n🅰️ — Скоростной спуск на энерго-зиплайне!\n🅱️ — Полёт на джетпаке над каньоном!\n\nЖми реакцию **🅰️** или **🅱️**!"
          },
          B: {
            id: "3B",
            label: "Голографический Тотем",
            choiceText: "🅱️ Активация Древнего Голографического Тотема",
            sceneTitle: "Активация Древнего Голографического Тотема",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands before a towering ancient stone obelisk carved with abstract glyph shapes with no readable words, using a small brass calibration tool with glowing orange indicators in one paw while gently brushing away luminous moss with the other. A large spherical golden holographic map has opened into the air above the obelisk, projecting floating abstract glyph shapes and star paths with no readable words leading toward a distant temple. He looks up at the hologram in focused wonder, his brow furrowed thoughtfully and his ringed tail swishing. Ancient weathered stone ruins and glowing cyan ferns surround the pedestal.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, brilliant golden holographic volume lighting reflecting on his armor and eyes, rich cyan and purple ambient tones, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🗺️ **ДЕНЬ 3: ГОЛОГРАММА ДРЕВНИХ ЗОДЧИХ!** 🗺️\n\nТотем ожил! Сферическая золотая карта проложила точный маршрут к воротам Храма Оазиса, но на пути лежит глубокий разлом.\n\n**КАК ТАО ПЕРЕСЕЧЬ БЕЗДОННЫЙ КАНЬОН?**\n🅰️ — Скоростной спуск на энерго-зиплайне!\n🅱️ — Полёт на джетпаке над каньоном!\n\nТвой выбор определит следующий кадр! 👇"
          }
        }
      },
      {
        day: 4,
        titleRu: "День 4: Разлом Кристальных Лиан",
        titleEn: "Day 4: Crossing the Crystal Chasm",
        act: "Акт 2: Преодоление пропасти",
        summary: "ТАО эффектно пересекает каньон и приземляется прямо у подножия древних Врат Оазиса.",
        votingQuestion: "Каким способом открыть Врата Храма?",
        branches: {
          A: {
            id: "4A",
            label: "Энерго-зиплайн",
            choiceText: "🅰️ Скоростной спуск на энерго-зиплайне",
            sceneTitle: "Скоростной спуск на энерго-зиплайне",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nDynamic low-angle framing as he slides swiftly down a glowing cyan energy-tether cable suspended across a vast planetary canyon, gripping a brass magnetic pulley handle with both paws while warm golden sparks trail from the pulley, his legs kicking forward and his bushy tail streams back in the wind. A small holographic trail marker glows on his wrist gauntlet, shown as a simple abstract glowing arrow. His expression is one of thrilling exhilaration with wide excited eyes and an open smile. Far below in the misty chasm, glowing geysers vent clouds of purple steam, and giant floating cyan crystal shards hover in zero gravity, catching the colorful starlight.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, vibrant cyan zipline light streaming onto his armor with warm golden sparks and volumetric fog against distant starlight, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚡ **ДЕНЬ 4: ПОЛЁТ НАД БЕЗДНОЙ!** ⚡\n\nВетер свистит в ушах, карабин искрит на тросе — ТАО успешно перемахнул через каньон и стоит перед грандиозными Вратами Оазиса!\n\nЗамок защищен древними механизмами. **КАКИМ СПОСОБОМ ОТКРЫТЬ ВРАТА ХРАМА?**\n🅰️ — Вращение каменного кольца рун на центральном диске!\n🅱️ — Акустический резонанс камертона на поющие кристаллы!\n\nГолосуйте реакциями! 🔑"
          },
          B: {
            id: "4B",
            label: "Полёт на джетпаке",
            choiceText: "🅱️ Полёт на джетпаке над каньоном",
            sceneTitle: "Полёт на джетпаке над каньоном",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nWide panoramic view as he soars through the open air above a deep canyon powered by the twin thrusters of his compact mechanical jetpack, twin clean streams of cyan plasma trailing behind him. A small holographic trail marker glows on his wrist gauntlet, shown as a simple abstract glowing arrow beside a control dial marked only with abstract symbols. He leans forward into the flight with an adventurous grin, navigating between giant levitating mossy boulders that drift silently in the purple twilight air, lit from below by a low golden horizon glow. In the distance, the grand silhouette of the Oasis Temple comes into view.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, intense cyan plasma thruster glow casting sharp rim lights on his fur and suit against a warm golden horizon, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🚀 **ДЕНЬ 4: ТУРБО-ПРОРЫВ К ХРАМУ!** 🚀\n\nДвойные сопла джетпака отработали безупречно! ТАО облетел левитирующие монолиты и приземлился на широкие ступени Храма Оазиса.\n\nВход запечатан древней системой. **КАКИМ СПОСОБОМ ОТКРЫТЬ ВРАТА ХРАМА?**\n🅰️ — Вращение каменного кольца рун на центральном диске!\n🅱️ — Акустический резонанс камертона на поющие кристаллы!\n\nЖми **🅰️** или **🅱️**!"
          }
        }
      },
      {
        day: 5,
        titleRu: "День 5: Врата Затерянного Оазиса",
        titleEn: "Day 5: The Oasis Gateway",
        act: "Акт 3: Открытие святилища",
        summary: "Механизм срабатывает — каменные створки расходятся, озаряя ТАО золотым сиянием сокрытого Источника.",
        votingQuestion: "Какой источник пробудить в сердце Оазиса?",
        branches: {
          A: {
            id: "5A",
            label: "Каменное кольцо рун",
            choiceText: "🅰️ Вращение каменного кольца рун",
            sceneTitle: "Вращение каменного кольца рун на Вратах",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands before the grand entrance of the Oasis Temple, a monumental circular stone arch framed by glowing cyan crystal pillars and wide polished stone steps. With both gloved paws, he carefully turns a large concentric brass and stone ring mechanism in the center of the arch. Three engraved circular abstract glyph shapes flare with intense cyan and golden light as they click into alignment, sending luminous energy pulsing through carved channels across the stone gateway. He looks at the mechanism with determined triumph, his ears forward and his fluffy tail resting on the steps.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, pulsing cyan and golden glow radiating from the portal glyphs onto his face and chest, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "✨ **ДЕНЬ 5: РУНЫ СОВПАЛИ! ВРАТА ОТКРЫВАЮТСЯ!** ✨\n\nЩелчок древнего механизма — и по венам каменного портала побежали реки энергии! Врата распахиваются, открывая неоновое озеро удачи.\n\nЗавтра кульминация недели! **КАКОЙ ИСТОЧНИК ПРОБУДИТЬ В СЕРДЦЕ ОАЗИСА?**\n🅰️ — Запуск Энергетического Гейзера Фортуны!\n🅱️ — Пробуждение Золотого Лотоса Фортуны!\n\nГолосуй прямо сейчас!"
          },
          B: {
            id: "5B",
            label: "Акустический камертон",
            choiceText: "🅱️ Акустический резонанс камертона",
            sceneTitle: "Акустический резонанс камертона на Вратах",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands before the grand entrance of the Oasis Temple, a monumental circular stone arch framed by glowing cyan crystal pillars and wide polished stone steps. He holds a brass acoustic tuning fork device with glowing orange indicators in his right paw, emitting concentric rings of golden acoustic waves toward the crystal pillars flanking the entrance. The crystal pillars chime and glow with brilliant cyan light, harmonizing with the tool, while the massive stone portal slowly glides open, revealing radiant golden light from within. He smiles with delighted satisfaction, listening intently with his ears perked.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, golden acoustic sound-wave rings and cyan crystal luminescence blending across the scene, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎶 **ДЕНЬ 5: СИМФОНИЯ КРИСТАЛЛОВ!** 🎶\n\nКристальные колонны отозвались на звук камертона чистым звоном, и массивные врата бесшумно разошлись в стороны!\n\nВпереди — легендарное святилище удачи. **КАКОЙ ИСТОЧНИК ПРОБУДИТЬ В СЕРДЦЕ ОАЗИСА?**\n🅰️ — Запуск Энергетического Гейзера Фортуны!\n🅱️ — Пробуждение Золотого Лотоса Фортуны!\n\nТвой голос решает исход кульминации! 👇"
          }
        }
      },
      {
        day: 6,
        titleRu: "День 6: Пробуждение Источника (Кульминация)",
        titleEn: "Day 6: Awakening of the Source (Climax)",
        act: "Акт 3: Грандиозный триумф",
        summary: "Великий Источник оживает, наполняя мир золотым светом удачи и осыпая Оазис сияющими наградами.",
        votingQuestion: "Как ТАО отметит завершение экспедиции?",
        branches: {
          A: {
            id: "6A",
            label: "Энергетический Гейзер",
            choiceText: "🅰️ Запуск Энергетического Гейзера Фортуны",
            sceneTitle: "Запуск Энергетического Гейзера Фортуны",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nEpic upward camera angle as he stands triumphantly on a stone dais at the edge of a wide circular spring, raising both paws high into the air with a heavy brass utility wrench with glowing orange indicators held overhead in victory. Behind him, a monumental pillar of pure liquid golden and cyan energy rises straight into the sky, breaking into thousands of shimmering starlight embers and glowing sparks. The entire jungle oasis is illuminated in magnificent warm golden brilliance, reflecting off the crystal pool and his gleaming armor suit.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, radiant golden and cyan volumetric light shafts filling the frame with sparkling floating particle effects, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💥 **ДЕНЬ 6: ИСТОЧНИК ФОРТУНЫ ПРОБУЖДЕН! КУЛЬМИНАЦИЯ!** 💥\n\nТАО повернул ключ — и исполинский столб золотой энергии взмыл в ночное небо Элизиума, осветив всю долину теплым сиянием!\n\nМы у цели! Завтра финальный день и раздача наград! **КАК ТАО ОТМЕТИТ ЗАВЕРШЕНИЕ ЭКСПЕДИЦИИ?**\n🅰️ — Праздник и отдых в Оазисе с лесными духами!\n🅱️ — Триумфальный взлёт к звёздам с трюмом, полным сокровищ!\n\nГолосуй за финал истории! 🏆"
          },
          B: {
            id: "6B",
            label: "Золотой Лотос",
            choiceText: "🅱️ Пробуждение Золотого Лотоса Фортуны",
            sceneTitle: "Цветение Золотого Лотоса Фортуны",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe stands on a glowing translucent cyan petal of a gigantic mechanical and crystal lotus flower blooming in the center of the oasis lake. He gently touches the radiant golden core of the blossom with one paw, marveling in awe with wide joyful eyes. A dazzling cascade of glowing golden coins, uncut sparkling cyan crystals, and floating luminous spheres showers upward into the sky around him. Keep every coin and gem face completely smooth and blank, with no lettering or numbers. Friendly glowing forest spirits swirl gently around the blossom.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm golden core lighting illuminating the scene with sparkling reflections across water and crystal petals, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌸 **ДЕНЬ 6: ЗОЛОТОЙ ЛОТОС РАСЦВЕЛ! МЕГА-ДЖЕКПОТ!** 🌸\n\nЛепестки исполинского цветка раскрылись, осыпав всё озеро каскадом золотых монет и сияющих кристаллов удачи!\n\nОстался последний шаг! **КАК ТАО ОТМЕТИТ ЗАВЕРШЕНИЕ ЭКСПЕДИЦИИ?**\n🅰️ — Праздник и отдых в Оазисе с лесными духами!\n🅱️ — Триумфальный взлёт к звёздам с трюмом, полным сокровищ!\n\nСтавь реакцию прямо сейчас! 🎁"
          }
        }
      },
      {
        day: 7,
        titleRu: "День 7: Финал и Раздача Наград",
        titleEn: "Day 7: Finale & Reward Distribution",
        act: "Эпилог: Награды первооткрывателей",
        summary: "Экспедиция завершена с абсолютным триумфом. ТАО благодарит комьюнити и дарит эксклюзивный промокод.",
        votingQuestion: "Экспедиция успешно завершена! Активируй свой промокод ниже!",
        branches: {
          A: {
            id: "7A",
            label: "Праздник в Оазисе",
            choiceText: "🅰️ Праздник и отдых в Оазисе",
            sceneTitle: "Праздник в Пробужденном Оазисе",
            promoCode: "K7QMX2VP9",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe sits comfortably on a soft bed of luminous cyan moss, leaning back against a polished stone bench with a relaxed, happy smile. In one paw he holds a tall glowing glass of sparkling tropical juice with a tiny paper umbrella, while his other paw waves cheerfully directly toward the viewer. Next to him rests an open unlabelled chest overflowing with smooth polished gold coins and glowing cyan gemstones; keep every coin and gem face completely smooth and blank, with no lettering or numbers. Small playful alien critters with glowing fur rest peacefully around him under hanging paper-like lanterns.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, festive warm golden lantern light mixed with soft cyan bioluminescent ground glow, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎉 **ДЕНЬ 7: ТРИУМФ В ОАЗИСЕ! НАГРАДЫ ДЛЯ ВСЕХ!** 🎉\n\nМы сделали это! 7 дней пути, опасные разломы и древние тайны позади — Источник Фортуны снова питает нашу галактику удачей!\n\nТАО поднимает бокал за каждого участника квеста и передает победный промокод недели:\n\n🎁 **ПРОМОКОД:** `K7QMX2VP9`\n\nАктивируй в личном кабинете и забирай свои бонусные вращения! Спасибо за участие в экспедиции! 🚀✨"
          },
          B: {
            id: "7B",
            label: "Взлёт к звёздам",
            choiceText: "🅱️ Триумфальный взлёт к звёздам",
            sceneTitle: "Триумфальный взлёт к звёздам",
            promoCode: "Z4N8WT3L6",
            prompt: "Use the attached image as the character reference. Keep his design consistent: the same panda-like mascot with red-orange and cream fur, rounded ears, amber eyes and a bushy ringed tail, wearing the same navy-blue and orange armor suit with honeycomb chest plate, harness straps, utility belt and knee pads. Change only his pose and expression.\n\nHe is seen inside the illuminated cockpit of his sleek delta-wing exploratory shuttle with dual orange thrusters as it climbs gracefully into orbit above the glowing planet Elysium-9, giving a cheerful salute through the curved glass canopy with a proud grin. Cockpit panels are marked only with abstract glowing symbols. The cargo bay behind him glows warmly with unlabelled cargo containers filled with radiant cyan crystals and gold. Outside the cockpit window, the glowing cyan landscape of the planet recedes into view, framed by giant purple planetary rings and a breathtaking gold nebula.\n\nStylized 3D character render, soft subsurface fur shading, glossy PBR materials, warm interior golden console lighting with cool cyan starlight and vibrant planetary glow outside, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌌 **ДЕНЬ 7: КУРС НА ЗВЁЗДЫ! ВЕЛИКИЙ КУШ СОБРАН!** 🌌\n\nШаттл ТАО взмывает над сияющими кольцами Элизиума-9! Трюмы полны кристаллов Оазиса, а энергия Фортуны разблокирована для всех игроков!\n\nФинальный подарок от главного космического механика:\n\n🎁 **ПРОМОКОД:** `Z4N8WT3L6`\n\nВводи промокод на сайте и крути слоты с супер-множителем! До встречи в следующей звездной арке! 🛸⭐"
          }
        }
      }
    ]
  }
};

// Current active week pointer
let CURRENT_WEEK_ID = "week-2";

// Dynamic getters to ensure backward compatibility
let ARC_METADATA = ALL_ARCS[CURRENT_WEEK_ID].metadata;
let CHARACTER_DNA = ALL_ARCS[CURRENT_WEEK_ID].characterDna;
let QUEST_DAYS = ALL_ARCS[CURRENT_WEEK_ID].days;

function setActiveArcWeek(weekId) {
  if (ALL_ARCS[weekId]) {
    CURRENT_WEEK_ID = weekId;
    ARC_METADATA = ALL_ARCS[weekId].metadata;
    CHARACTER_DNA = ALL_ARCS[weekId].characterDna;
    QUEST_DAYS = ALL_ARCS[weekId].days;
    return ALL_ARCS[weekId];
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALL_ARCS,
    setActiveArcWeek,
    get CURRENT_WEEK_ID() { return CURRENT_WEEK_ID; },
    get ARC_METADATA() { return ARC_METADATA; },
    get CHARACTER_DNA() { return CHARACTER_DNA; },
    get QUEST_DAYS() { return QUEST_DAYS; }
  };
}
