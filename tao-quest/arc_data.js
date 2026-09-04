/**
 * TAO Quest Arc Data: "The Stolen Celestial Key" (Похищенный Звёздный Ключ)
 * 7 Days, 14 Branching Scenes, Nano Banana 2 Prompts, and Discord Post Copies.
 */

const ARC_METADATA = {
  title: "The Stolen Celestial Key",
  titleRu: "Похищенный Звёздный Ключ",
  character: "TAO (The Cosmic Red Panda Mechanic)",
  brand: "Tao Fortune",
  duration: "7 Days (Interactive Discord Event)",
  outfit: "Blue & Orange Sci-Fi Mechanic Spacesuit",
  referenceImage: "assets/TAO_Rocket_Repair.png",
  aspectRatio: "16:9",
  renderEngine: "Gemini / Nano Banana 2"
};

const CHARACTER_DNA = {
  name: "TAO",
  role: "Chief Cosmic Engineer & Explorer",
  species: "Anthropomorphic Cosmic Red Panda",
  appearance: "Expressive amber eyes, soft red-orange fur, white markings around cheeks and snout, cute rounded ears, fluffy striped tail",
  attire: "Navy blue & vibrant orange industrial mechanic spacesuit, padded joints, chest planet patch, utility leather tool belt with brass wrenches and gadgets, magnetic boots",
  personality: "Resourceful, optimistic, quick-witted, slightly mischievous, cares deeply for his machinery and community"
};

const QUEST_DAYS = [
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
      prompt: `Reference Image: TAO_Rocket_Repair.png
A breathtaking cinematic 3D Pixar-style scene in 16:9 widescreen format.
Subject: TAO, the cute anthropomorphic cosmic red panda mechanic from the reference image, wearing his signature navy-blue and bright orange mechanic spacesuit with the planet emblem patch and leather utility belt with brass tools.
Action: TAO stands shocked, alarmed, and bewildered inside the center of the grand ancient celestial observatory. With wide expressive amber eyes and his fluffy striped tail bristling in surprise, he holds a high-tech glowing diagnostic scanner tablet in one paw and a brass wrench in the other. He looks down in disbelief at an ornate floating circular celestial pedestal where the sacred golden Constellation Key should be—now only shimmering golden stardust swirls in the empty air.
Details & Clues: On the ancient engraved obsidian and brass floor, a mysterious trail of glowing cyan neon coolant gel and miniature mechanical tire tracks leads away from the pedestal towards the shadowed arches of the station.
Environment: The grand star observatory dome at midnight with massive rotating bronze astrolabes, celestial star maps, glowing holographic constellations, and a crystal-clear glass dome revealing an infinite deep-space purple nebula and glittering star clusters.
Lighting & Atmosphere: Volumetric golden rim lighting illuminating TAO's soft fur, moody cinematic contrast, mystical neon cyan glow from the mystery trail, floating stardust particles, 8k resolution, octane render quality.
Negative Prompt: no text, no watermark, no human, no 2D flat drawing, no distorted paws or extra fingers, no blurry background, no dark muddy colors.`,
      discordCopy: `🚨 **ТАО В ШОКЕ! ЗВЁЗДНЫЙ КЛЮЧ ИСЧЕЗ! НАЧИНАЕМ 7-ДНЕВНЫЙ КВЕСТ!** 🚨

Друзья, у нас космическое ЧП в Обсерватории Фортуны! 
Сегодня утром ТАО пришёл откалибровать Двигатель Созвездий, а священный **Ключ Фортуны** бесследно исчез! Без него еженедельный супер-джекпот заблокирован! 😱

На полу остались капли светящегося геля и странные механические следы, уходящие в темноту. 

⚡ **С ЭТОГО ДНЯ ВЫ УПРАВЛЯЕТЕ СЮЖЕТОМ!**
Каждый день ваш выбор в реакциях решает, куда отправится ТАО и какой поворот примет история. В конце недели всех участников ждёт мега-награда!

**КУДА ТАО ДОЛЖЕН ОТПРАВИТЬСЯ НА ПОИСКИ?**
🅰️ — Спуститься по следам геля в подземные вентиляционные шахты базы!
🅱️ — Бежать на внешний космодром и проверить датчики взлётных шлюзов!

Ставь реакцию **🅰️** или **🅱️** ниже! Ровно через 24 часа мы подведём итоги и опубликуем следующий кадр истории! ⏳
🎁 *Голосуй и делись догадками в комментариях!*`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
A stunning cinematic 3D animation style scene in 16:9 aspect ratio.
Subject: TAO, the cute cosmic red panda mechanic, crawling carefully through a tight industrial maintenance conduit tube.
Action: TAO holds a miniature LED inspection flashlight between his teeth and carefully examines a glowing triangular cyber-microchip with golden circuits held in his gloved paw. His amber eyes show deep concentration and curiosity.
Environment: Tight metallic maintenance tunnel with bundles of glowing cyan and magenta optical cables, pulsating conduits, vents blowing steam, reflective metal walls with slight wear and scratches.
Lighting & Atmosphere: Moody cyberpunk volumetric lighting, high-contrast rim light on TAO's fur, neon reflections, cinematic depth of field, Octane render quality, ultra-detailed textures.
Negative Prompt: no text, no watermark, no human face, no distorted anatomy, no 2D style, no blurry artifacts.`,
        discordCopy: `🔍 **ДЕНЬ 2: ВЕЛИКАЯ НАХОДКА В ШАХТЕ!** 🔍

Вы проголосовали за шахты — и ТАО нашёл ключевую улику! 
Протиснувшись сквозь лабиринт кабелей, ТАО подобрал оброненный микрочип с эмблемой сектора **«Неоновый Дрифт»**! 

Это заброшенная космическая станция на краю туманности, где собираются самые хитрые контрабандисты галактики. Похититель явно направляется туда!

ТАО уже подлетает к аванпосту. **Как проникаем внутрь?**

🅰️ — Совершить тихую посадку на свалке аванпоста и прокрасться через чёрный ход!
🅱️ — Пристыковаться к главному доку в наглую, притворившись выездным механиком!

Ставь реакцию **🅰️** или **🅱️**! Судьба операции в твоих руках! ⚡`
      },
      B: {
        id: "2B",
        label: "По следу на орбите",
        choiceText: "🅱️ Сканировать обломки с внешней подвесной платформы",
        sceneTitle: "ТАО на внешней платформе станции со сканером",
        prompt: `Reference Image: TAO_Rocket_Repair.png
A breathtaking cinematic 3D animation still in 16:9 aspect ratio.
Subject: TAO, the cosmic red panda in his blue and orange mechanic spacesuit, standing on an open metal gantry bridge in zero gravity outside the station.
Action: TAO wears an illuminated sci-fi visor over one eye. He aims a long-range holographic cosmic sensor into the deep starry void. The scanner projects a glowing neon-cyan trajectory cone pointing towards a distant glowing asteroid station.
Environment: Epic open space backdrop with a dazzling violet nebula, glittering asteroid field, and the shadowy silhouette of the mysterious outlaw outpost 'Neon Drift' illuminated by flickering neon signs.
Lighting & Atmosphere: Cosmic rim lighting, starlight reflections on visor and spacesuit metal parts, cinematic wide composition, awe-inspiring scale, 8k resolution.
Negative Prompt: no text, no extra limbs, no flat 2D, no oversaturated cartoonish colors, no blurry elements.`,
        discordCopy: `📡 **ДЕНЬ 2: ТРАЕКТОРИЯ ЗАФИКСИРОВАНА!** 📡

Сенсоры космодрома не соврали! Сканирование внешней платформы показало четкий плазменный след, ведущий к космическому аванпосту **«Неоновый Дрифт»**!

Именно там сейчас скрывается тот, кто унёс наш Звёздный Ключ!

ТАО выходит на орбиту аванпоста. **Какой план проникновения выбираем?**

🅰️ — Скрытная высадка в секторе утилизации (свалка астероидов) под прикрытием теней!
🅱️ — Официальная стыковка в ремонтном доке под видом мастера по гипердвигателям!

Голосуйте реакциями прямо сейчас! 👇`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
A cinematic 3D animation masterpiece in 16:9 aspect ratio.
Subject: TAO, the anthropomorphic cosmic red panda, in his navy-blue and orange mechanic suit, crouching stealthily behind large glowing cargo crates.
Action: TAO peeks around the corner with a determined, cautious expression. In his hand he holds a holographic radar that shows a pulsing golden beacon icon ahead. His fluffy striped tail is tucked low for stealth.
Environment: A gritty, vibrant sci-fi alleyway on a space station. Giant glowing neon signs in alien glyphs (pink, teal, electric amber), steam venting from overhead pipes, floating surveillance drones in the distance with scanning red lasers scanning the street.
Lighting & Atmosphere: Cinematic film noir sci-fi lighting, wet ground reflections with colored neon puddles, volumetric fog, deep shadows, rich atmospheric depth.
Negative Prompt: no text, no readable English words, no deformed paws, no 2D, no watermark, no low quality.`,
        discordCopy: `🤫 **ДЕНЬ 3: СТЕЛС-РЕЖИМ НА МАКСИМУМ!** 🤫

Вы выбрали скрытный путь — и ТАО мастерски обошел все патрули на свалке «Неонового Дрифта»!

Среди неоновых вывесок и гудящих вентиляторов сканер ТАО поймал мощнейший импульс энергии Звёздного Ключа! Сигнал доносится из самого глубокого заброшенного уровня — Защитного Бункера!

Но путь преграждают системы безопасности. **Как ТАО проникнет в глубь станции?**

🅰️ — Взломать сервисный грузовой лифт через консоль управления!
🅱️ — Спуститься на страховочном тросе через вентиляционную грави-шахту!

Жми **🅰️** или **🅱️**! Скоро мы узнаем, кто стоит за этим! 🕵️‍♂️`
      },
      B: {
        id: "3B",
        label: "Космо-бар контрабандистов",
        choiceText: "🅱️ Сидеть у стойки космо-бара и сканировать частоты гостей",
        sceneTitle: "ТАО в шумном космическом баре с детективным сканером",
        prompt: `Reference Image: TAO_Rocket_Repair.png
A vibrant cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the cosmic red panda mechanic, sitting casually at a glowing curved bar counter inside a bustling alien cantina.
Action: TAO pretends to clean a chrome space-wrench while subtly glancing at a miniature frequency analyzer concealed inside his toolbox. On the screen, a golden signal frequency peaks with high amplitude.
Environment: A crowded sci-fi space bar filled with quirky friendly alien patrons in the soft background, glowing holographic drink dispensers, neon tap handles, floating luminescent jellyfish lanterns.
Lighting & Atmosphere: Warm amber and electric magenta tavern lighting, lens flare, cinematic bokeh, highly detailed fur and leather textures, lively space-opera atmosphere.
Negative Prompt: no human faces, no text, no deformed hands, no flat anime, no watermark, no low res.`,
        discordCopy: `🍹 **ДЕНЬ 3: РАЗВЕДКА В КОСМО-БАРЕ!** 🍹

ТАО вошёл как свой в бар «Шестерёнка и Квазар»! Пока инопланетные пилоты спорят о курсе звёздной пыли, портативный сканер ТАО засек частоту Ключа! 

Сигнал бьёт прямо из запечатанного Аварийного Бункера под станцией!

До бункера один шаг. **Как ТАО начнет спуск?**

🅰️ — Взломать закрытый технический лифт с помощью отмычки-декодера!
🅱️ — Спуститься вручную по внешней гравитационной шахте!

Голосуйте реакциями! Завтра нас ждёт главный поворот недели! 💥`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
An emotional and dramatic cinematic 3D Pixar-style scene in 16:9 aspect ratio.
Subject: TAO, the cosmic red panda mechanic in his blue and orange spacesuit, pressing his gloved paw against a thick reinforced circular glass viewport of a massive steel vault door.
Action: His amber eyes are wide with shock and emotional relief. On the other side of the thick glass stands a cute little vintage spherical service drone with metal patches and glowing blue optic eyes, holding the glowing golden Constellation Key safely in its robotic clamp, looking apologetically at TAO.
Environment: Cold metallic industrial corridor outside the heavy blast vault door. Emergency red lights flicker, steam hisses from high-pressure valves.
Lighting & Atmosphere: Golden starlight glow emanating from the Key inside, contrasting against cool blue-grey corridor tones, cinematic rim lighting on TAO's fur, emotional storytelling moment, 8k render.
Negative Prompt: no text, no letters, no human, no distorted paws, no 2D, no low quality, no dark blur.`,
        discordCopy: `💥 **ДЕНЬ 4: СЮЖЕТНЫЙ ПОВОРОТ! ОН НЕ ВОР!** 💥

ТАО добрался до бункера, посветил в смотровое окно... И ОБОМЛЕЛ! 😱

Никаких космических пиратов нет! Внутри заперт его собственный **старый сервисный дрон Болт**, которого ТАО считал списанным!

Оказывается, Болт засёк аномалию: к нашей звёздной системе несётся **смертоносная Гамма-Буря**! Если бы Ключ оставался в открытом алтаре, он бы взорвал весь Двигатель Фортуны! Дрон унёс Ключ в самый бронированный сейф, но автоматика сглючила и запечатала дверь намертво!

До удара бури осталось 48 часов! Если мы не достанем Ключ и не настроим защитное поле, пострадает вся система!

**Как вскрываем бункер?**
🅰️ — Срезать силовые кабели магнитного замка плазменным резаком!
🅱️ — Взломать древнюю рунную консоль и подобрать цифровой код!

Решать вам! Жмите **🅰️** или **🅱️**! ⏳`
      },
      B: {
        id: "4B",
        label: "Голограмма надвигающейся бури",
        choiceText: "🅱️ Дрон проецирует голограмму космической бури",
        sceneTitle: "Проекция предупреждения о космической буре сквозь стекло",
        prompt: `Reference Image: TAO_Rocket_Repair.png
A dramatic high-stakes cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the cosmic red panda mechanic, looking intensely through a heavy vault window at a holographic projection.
Action: Inside the locked bunker, the cute round robot drone projects a 3D red wireframe hologram of a massive cosmic solar flare and gamma storm hurtling towards the constellation observatory. TAO holds his toolkit ready, understanding the extreme urgency of the mission.
Environment: Deep underground bunker corridor with heavy steel ribs, hazard warning stripes, flickering amber warning screens, hydraulic pistons.
Lighting & Atmosphere: Dramatic red and cyan dual-tone lighting, bright holographic glow illuminating TAO's expressive face, cinematic tension, high production value, Octane render.
Negative Prompt: no text, no watermark, no extra limbs, no flat cartoon, no blurry artifacts.`,
        discordCopy: `⚠️ **ДЕНЬ 4: ТРЕВОГА ГАЛАКТИЧЕСКОГО МАСШТАБА!** ⚠️

Голограмма дрона не оставляет сомнений: это была не кража, это была СПАСАТЕЛЬНАЯ ОПЕРАЦИЯ! 

На галактику надвигается супер-шторм! Дрон спас Ключ, но теперь оказался в ловушке. Без Ключа мы не сможем активировать защитный купол Фортуны!

Счёт пошёл на часы! **Какую тактику выбираем для спасения Ключа?**

🅰️ — Грубая сила: срезать кабели питания замков плазморезом!
🅱️ — Интеллект: расшифровать кодовую комбинацию на терминале доступа!

Каждый клик на счету! 🅰️ или 🅱️?`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
A dynamic, high-adrenaline cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the brave cosmic red panda engineer, suspended on a safety harness cable above a deep glowing reactor shaft.
Action: TAO wears protective welder-goggles over his forehead. With focused determination, he uses a glowing blue plasma cutting torch to rewire a massive junction box of thick power conduits. Bright golden and electric-blue sparks shower dynamically through the air.
Environment: Industrial reactor core shaft with giant hydraulic pistons, heavy pipes with venting white steam, glowing status indicators, massive metal machinery.
Lighting & Atmosphere: Spectacular lighting from plasma spark bursts, deep dark industrial shadows, vibrant cyan lens flares, intense cinematic action framing, 8k render quality.
Negative Prompt: no text, no watermark, no human, no distorted paws, no 2D style, no low resolution.`,
        discordCopy: `⚡ **ДЕНЬ 5: ИСКРЫ, ПЛАЗМА И СЕКУНДОМЕР!** ⚡

Вы выбрали силовой взлом — и ТАО уже на тросе прямо над шахтой реактора! 

Искры летят снопом, плазморез прожигает толстую титановую броню распределительного щитка. Замки бункера начинают искрить и трещать, но для окончательного сброса питания нужно выбрать финальный импульс!

**ЗАГАДКА ДЛЯ КОМЬЮНИТИ:**
Осталось замкнуть последнюю клемму! 

🅰️ — Подать импульс Синей Плазмы (сверхвысокое напряжение)!
🅱️ — Сбалансировать систему Золотой Солнечной Энергией (мягкий резонанс)!

Голосуйте реакцией — правильный выбор откроет бункер без аварии! 🔥`
      },
      B: {
        id: "5B",
        label: "Интеллектуальный взлом консоли",
        choiceText: "🅱️ ТАО настраивает голографические кольца созвездий на консоли",
        sceneTitle: "ТАО решает астрономическую головоломку на терминале",
        prompt: `Reference Image: TAO_Rocket_Repair.png
An intellectually thrilling cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the clever cosmic red panda mechanic, standing before a towering ancient technological terminal.
Action: TAO delicately adjusts glowing holographic concentric rings of constellations and star alignments floating above the control pedestal with his paws. His face reflects the brilliant golden and cyan star-charts, eyes glowing with insight.
Environment: Ancient star-tech vault chamber with geometric glyphs, glowing runes embedded in dark obsidian walls, floating data particles.
Lighting & Atmosphere: Enchanting ethereal starlight glow, intricate holographic geometry, moody ambient shadows, Pixar-level subsurface scattering on fur, masterpiece quality.
Negative Prompt: no text, no real letters, no human, no extra fingers, no flat 2D, no dark mud.`,
        discordCopy: `🧩 **ДЕНЬ 5: ГОЛОВОЛОМКА ЗВЁЗДНЫХ ВРАТ!** 🧩

Вы выбрали интеллект — и ТАО уже перед древним терминалом доступа!

Голографические кольца созвездий пришли в движение. ТАО подобрал 3 из 4 символов ключа, остался последний выбор частоты!

Какой элемент замкнет звездный шифр?
🅰️ — Синхронизировать с частотой Синей Звезды (Синяя Плазма)!
🅱️ — Выровнять по лучу Золотого Солнца (Солнечная Гармоника)!

Выбирай реакцию **🅰️** или **🅱️**! Завтра затвор бункера падет! 🔓`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
An awe-inspiring cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the joyful cosmic red panda in his blue-orange spacesuit, and his cute little spherical service drone.
Action: The massive circular geared vault door has split open with huge clouds of billowing white steam and brilliant golden light pouring from within. The little drone hovers proudly forward, placing the radiant, glowing golden Constellation Key right into TAO's open paws. TAO has a triumphant, warm smile.
Environment: Industrial bunker doorway with heavy interlocking gears and steel teeth retracted, floor bathed in warm golden light, atmosphere of victory and relief.
Lighting & Atmosphere: Volumetric god-rays of golden starlight streaming through steam clouds, warm cinematic lighting, rich metallic reflections, emotional and rewarding moment.
Negative Prompt: no text, no watermark, no human, no distorted anatomy, no 2D, no low quality.`,
        discordCopy: `🔓 **ДЕНЬ 6: ЗАМОК СЛОМАН! КЛЮЧ У НАС!** 🔓

ЕСТЬ ПРОРЫВ! Огромная дверь бункера с шипением пара распахнулась!

Верный дрон Болт цел и невредим, а в лапах у ТАО снова сияет священный **Звёздный Ключ**! ✨
Но радоваться рано: за стенами станции уже гремят первые раскаты Гамма-Шторма! 

ТАО запрыгивает в ракету и берет курс на Обсерваторию Фортуны! До полуночи мы должны вернуть Ключ на алтарь!

🔥 **ФИНАЛЬНЫЙ СБОР ЭНЕРГИИ:**
Жми реакцию **🚀**, чтобы влить гипер-топливо в двигатели ТАО! Если наберем 100 ракет, завтра начнется грандиозный ДРОП! 🚀💥`
      },
      B: {
        id: "6B",
        label: "Старт ракеты сквозь бурю",
        choiceText: "🅱️ Ракета ТАО взлетает сквозь фиолетовые волны космической бури",
        sceneTitle: "Ракета ТАО мчится сквозь космический шторм",
        prompt: `Reference Image: TAO_Rocket_Repair.png
An epic, high-stakes cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO's retro-futuristic purple space rocket with golden star emblems, blazing across the screen at hyper-speed.
Action: The rocket's twin ion engines blast glowing cyan and golden fire trails. Through the cockpit glass canopy, TAO can be seen at the helm with the little round drone happily sitting on the dashboard beside the glowing golden Key.
Environment: A tempestuous, epic space storm with rolling violet clouds, crackling plasma lightning, and cosmic solar flares in the background. Ahead lies the tranquil golden halo of the home planet and observatory.
Lighting & Atmosphere: Electrifying purple and cyan ambient lighting, intense thruster fire glow, speed blur on background debris, cinematic space-opera spectacle, 8k quality.
Negative Prompt: no text, no watermark, no low quality, no 2D anime, no blurry foreground.`,
        discordCopy: `⚡ **ДЕНЬ 6: ГОНКА НА ГИПЕРСКОРОСТИ!** ⚡

Мы успели вырваться с аванпоста за секунду до удара шторма! 
ТАО за штурвалом своей фиолетовой ракеты, а спасённый дрон бережно держит Звёздный Ключ! 

Впереди маячит золотой свет Обсерватории. Завтра — день великого финала и включения Двигателя Фортуны!

Врубаем форсаж! Жми **🚀** под постом, чтобы помочь ТАО добраться вовремя! Завтра каждый участник получит награду! 🎁✨`
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
        prompt: `Reference Image: TAO_Rocket_Repair.png
A breathtaking, climactic cinematic 3D Pixar-style scene in 16:9 aspect ratio.
Subject: TAO, the victorious cosmic red panda mechanic in his blue-orange spacesuit, standing at the center of the grand celestial observatory terrace.
Action: With a proud, joyful expression, TAO firmly inserts and turns the golden Constellation Key into the intricate astronomical slot. A majestic pillar of golden starlight shoots skyward from the altar, creating an expanding ring of shimmering constellations and golden lucky runes across the cosmic night sky.
Environment: The grand observatory fully restored, ancient bronze astrolabes spinning smoothly, glowing cosmic dust swirling in the air, his loyal round robot drone hovering happily nearby.
Lighting & Atmosphere: Glorious golden volumetric god-rays, deep majestic navy starlight backdrop, shimmering particle effects, cinematic masterpiece, awe-inspiring emotional payoff.
Negative Prompt: no text, no watermark, no human, no deformed limbs, no flat cartoon, no low resolution.`,
        discordCopy: `🌟 **ДЕНЬ 7: ДВИГАТЕЛЬ ФОРТУНЫ ЗАПУЩЕН! МЫ СДЕЛАЛИ ЭТО!** 🌟

ВЫ ЭТО ВИДИТЕ?! ТАО вернул Звёздный Ключ на законное место! ✨

Золотой луч пронзил небеса, созвездия засияли с невиданной силой, а защитный купол Фортуны спас всю систему от космической бури!

Вся эта неделя состоялась благодаря вашим решениям и голосам! Вы лучшие исследователи галактики! 🏆

🎁 **ТВОЙ ЗАСЛУЖЕННЫЙ МЕГА-БОНУС:**
Используй праздничный промокод: **TAO_STELLAR_WIN**
* Активаций: 500
* Действует: 48 часов
* Вводи прямо сейчас в личном кабинете Tao Fortune!

Делись скринами выигрышей в комментариях! ТАО салютует каждому из вас! 🚀🥂`
      },
      B: {
        id: "7B",
        label: "Мега-праздник с сундуком сокровищ",
        choiceText: "🅱️ ТАО на сундуке с сокровищами празднует победу с комьюнити",
        sceneTitle: "ТАО на вершине горы золотых монет и кристаллов",
        prompt: `Reference Image: TAO_Rocket_Repair.png
A joyful, festive cinematic 3D animation scene in 16:9 aspect ratio.
Subject: TAO, the cheerful cosmic red panda mechanic in his blue-orange spacesuit, sitting triumphantly atop a giant open treasure chest overflowing with glowing golden coins, gems, and cosmic fortune envelopes.
Action: TAO raises his shiny wrench in a victory salute with one paw, giving a big cheerful wink to the viewer. In his other paw he holds an open glowing starlight scroll. The little repaired robot drone flies confetti streamers around him.
Environment: Celebration hall in the observatory filled with festive starlight balloons, floating gold confetti, glowing star lanterns, warm and inviting atmosphere.
Lighting & Atmosphere: Warm sparkling golden lighting, dazzling reflections on coins and crystals, festive bokeh, vibrant high-key cinematic render, 8k resolution.
Negative Prompt: no text on coins, no watermark, no human face, no distorted anatomy, no 2D flat drawing, no blur.`,
        discordCopy: `🎉 **ГРАНД-ФИНАЛ: ВЕЛИКИЙ ПРАЗДНИК TAO FORTUNE!** 🎉

СУНДУК ФОРТУНЫ РАСПАХНУТ ДЛЯ ВСЕХ! 💰✨

Вся станция празднует спасение Звёздного Ключа! ТАО и дрон Болт передают вам огромный космический респект за каждый голос, каждую реакцию и помощь в расследовании!

Забирай финальный праздничный код недели:
💎 ПРОМОКОД: **TAO_JACKPOT_KEY**
⭐ 100 бесплатных вращений + космический бонус к депозиту!

Пиши в чате свои поздравления ТАО и жми ❤️! До встречи в следующей интерактивной арке! 🌌🐼`
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARC_METADATA, CHARACTER_DNA, QUEST_DAYS };
}
