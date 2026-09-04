/**
 * TAO Quest Arc Data: "The Stolen Celestial Key" (Похищенный Звёздный Ключ)
 * 7 Days, 13 Scenes (1 Master Kickoff + 12 Branching Scenes).
 * Optimized for Gemini Nano Banana 2 (Clean IP-safe prompts referencing the user's attached TAO PNG).
 */

const ARC_METADATA = {
  title: "The Stolen Celestial Key",
  titleRu: "Похищенный Звёздный Ключ",
  character: "TAO (The Cosmic Red Panda Mechanic)",
  brand: "Tao Fortune",
  duration: "7 Days (Interactive Discord Event)",
  outfit: "Navy & Orange Textured Armor Suit with Honeycomb Chestplate",
  referenceImage: "assets/TAO_character.png",
  aspectRatio: "16:9",
  renderEngine: "Gemini / Nano Banana 2"
};

const CHARACTER_DNA = {
  name: "TAO",
  role: "Chief Cosmic Engineer & Explorer",
  species: "Anthropomorphic Cosmic Red Panda",
  appearance: "Expressive amber eyes, fluffy red-orange and white fur, cute rounded ears, black nose, bushy striped tail",
  attire: "Navy-blue and bright orange textured armor suit, honeycomb chest plate, shoulder armor, utility belt with pouches and brass tools, knee pads, magnetic boots",
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
      prompt: `Based on the character in the attached reference image, generate a stunning cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda facial features, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with chest honeycomb plate, harness straps, utility belt, and knee pads.

Action & Expression: Place the character in the center of the scene. Change his pose and expression: he looks shocked, alarmed, and bewildered with wide expressive eyes and his mouth open in an "O" shape of surprise, looking down in disbelief. In his right paw he holds a high-tech glowing holographic datapad displaying an amber warning alert, and in his left paw he holds a heavy brass mechanic wrench.

Scene & Pedestal: TAO stands before an ornate floating circular celestial pedestal of white marble and gold filigree inside an ancient star observatory. The sacred Constellation Key is missing—in its place hovers a mesmerizing, luminous spiral vortex of sparkling golden starlight and cosmic embers that warmly casts golden glow onto TAO's chest and face.

Environment & Clues: On the glossy, reflective dark-blue patterned floor, a bright glowing electric-cyan neon fluid trail with glowing robotic tire tracks leads away toward an arched doorway. In the background, massive brass astrolabes gleam with golden reflections. Above, a giant crystal glass dome reveals a deep cosmic sky filled with vibrant purple and magenta nebulae and glittering stars.

Lighting & Style: Award-winning cinematic 3D animated feature quality, Octane 3D render style. Rich volumetric atmospheric lighting, warm golden god-rays beaming up from the stardust, vibrant cyan neon bounce light, crisp sharp focus, detailed tactile fur grooming, 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a stunning cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO is crawling carefully through a tight, futuristic maintenance conduit tube. He holds a miniature glowing LED inspection torch between his teeth, carefully examining a triangular golden cyber-microchip held in his gloved paw. His expressive amber eyes show intense curiosity and sharp focus. His fluffy banded tail curves behind him in the tunnel.

Environment: A high-tech industrial ventilation shaft packed with thick glowing bundles of cyan and magenta fiber-optic cables, pulsating holographic conduits, gentle steam venting from metal grates, and reflective worn metallic walls.

Lighting & Style: Award-winning cinematic 3D feature animation render, Octane 3D style. Cyberpunk-inspired moody volumetric lighting with high-contrast rim light on TAO's fur, bright neon reflections on the metal walls, rich depth of field, sharp textures, 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate an epic cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO stands heroically on an open metal gantry catwalk in zero gravity outside the orbital space station. He wears an illuminated tactical holographic visor over one eye. In both paws, he aims a high-tech cosmic scanner that projects a glowing cyan holographic trajectory beam into the deep starry void, pointing directly at a distant glowing asteroid station.

Environment: Breathtaking open cosmic vista featuring a dazzling purple, violet, and magenta nebula, a shimmering field of floating crystal asteroids, and the shadowy silhouette of the outlaw asteroid outpost 'Neon Drift' illuminated by flickering neon signs.

Lighting & Style: Award-winning cinematic 3D feature animation render. Majestic starlight reflections on armor and visor, glowing cyan scanner cone, warm golden rim lights outlining TAO's fur, cinematic wide-angle epic framing, crisp 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a thrilling cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO is crouching stealthily behind large glowing cargo crates in a dark alleyway. He peeks cautiously around the corner with a determined, focused expression. In one paw he holds a mini radar datapad displaying a pulsing golden beacon icon ahead. His fluffy striped tail is tucked low for stealth.

Environment: A gritty, colorful sci-fi alley on the outlaw asteroid station. Giant glowing alien neon signs in electric magenta, cyan, and amber, overhead pipes releasing billows of warm white steam, wet metallic ground with glowing colorful reflections, floating security drones with red scanning beams in the background.

Lighting & Style: Award-winning cinematic 3D animated feature render. Film-noir atmospheric sci-fi lighting, rich neon glow and wet puddle reflections, volumetric fog, strong rim lights on TAO's fur, sharp focus, Octane 3D render quality.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a vibrant cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO is sitting casually at a sleek curved counter inside a bustling alien cantina. He pretends to polish a shiny brass space wrench with a cloth while secretly glancing down at an open toolkit containing a glowing frequency analyzer device. The device's screen shows a golden energy wave peaking at maximum frequency.

Environment: A lively, colorful space tavern filled with friendly quirky alien characters in soft background blur, glowing neon tap handles, floating luminous jellyfish lanterns, and holographic drink menus casting amber and magenta light.

Lighting & Style: Award-winning cinematic 3D animated feature render. Warm golden and magenta ambient lighting, beautiful lens flares, cinematic shallow depth of field, sharp tactile detail on TAO's suit and fur, 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate an emotional, high-stakes cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Emotion: TAO is pressing his gloved paw against the thick circular reinforced glass viewport of a massive titanium vault door. His amber eyes are wide with shock, relief, and affection, mouth parted in realization. On the inside of the locked vault, a cute, battered vintage spherical robot drone with brass patch-welds and glowing blue robotic eyes holds the radiant golden Constellation Key, looking apologetically at TAO.

Environment: A massive industrial bunker entrance with heavy steel gear teeth, flickering amber emergency lights, hydraulic pipes with hissing steam, and hazard warning decals.

Lighting & Style: Award-winning cinematic 3D animated feature render. Brilliant golden light radiating from the Key inside casting warm highlights onto TAO's face through the glass, contrasted with deep cyan and amber corridor lighting, emotional storytelling atmosphere, 8k Octane render.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a dramatic cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO stands outside the locked blast door, watching intensely through the thick reinforced viewport. On the other side, the little round robot drone projects a glowing 3D red and amber wireframe hologram showing a massive solar flare and gamma storm hurtling toward the home observatory. TAO grips his heavy wrench with determination, his eyes reflecting the urgency.

Environment: An underground high-security vault corridor with heavy steel ribs, hydraulic pistons, flashing amber hazard beacons, and steam venting from high-pressure valves.

Lighting & Style: Award-winning cinematic 3D animated feature render. Dramatic red and cyan dual-tone lighting, bright holographic glow illuminating TAO's expressive face and suit textures, cinematic tension, Octane 3D render quality.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a high-action cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO is suspended in a heavy-duty safety harness cable high above a deep, glowing reactor shaft. He has protective flip-up welding goggles resting above his brow. With intense concentration, he uses a glowing blue plasma cutting torch to rewire a massive junction box of thick glowing cables. A spectacular shower of bright golden and electric-cyan sparks sprays dynamically through the air.

Environment: A massive industrial elevator and reactor shaft, giant hydraulic pistons, humming conduits, venting white steam clouds, and metallic walkways.

Lighting & Style: Award-winning cinematic 3D animated feature render. Brilliant dynamic lighting from cutting sparks and blue plasma arc, glowing cyan accents, warm golden reflections on TAO's armor and fur, high-adrenaline cinematic composition, 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate an enchanting cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Pose: TAO stands before a towering ancient technological terminal pedestal. With both paws, he is delicately rotating and aligning glowing holographic rings of golden constellations and celestial glyphs floating in mid-air. His face is lit with inspiration and focus, amber eyes sparkling with insight.

Environment: A mystical star-tech chamber with dark polished obsidian walls engraved with glowing cyan runes, floating data particles, and spinning astrolabe gears.

Lighting & Style: Award-winning cinematic 3D animated feature render. Ethereal golden and cyan holographic glow reflecting off TAO's face, fur, and suit armor, magical atmosphere, rich volumetric lighting, crisp 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a heartwarming and triumphant cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Emotion: The massive circular geared vault door has split open with huge clouds of billowing white steam and brilliant golden light pouring through. TAO is joyfully kneeling down, with a big proud smile, as the cute little spherical robot drone hovers forward and safely places the glowing golden Constellation Key into TAO's open paws.

Environment: Industrial bunker doorway with heavy retracted steel gears, polished floor reflecting golden light and drifting steam, joyful victorious atmosphere.

Lighting & Style: Award-winning cinematic 3D animated feature render. Warm volumetric god-rays streaming through the doorway, brilliant golden glow from the Key illuminating TAO and the drone, cinematic depth, 8k Octane quality.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate an epic, high-stakes cinematic 3D animated space scene in 16:9 widescreen format.

Action & Subject: TAO's retro-futuristic purple space rocket with golden star emblems is blasting at hyper-speed across the screen. Through the transparent cockpit canopy, TAO (in his signature navy-and-orange armor suit from the reference image) is seen skillfully piloting at the control helm, with the happy little round robot drone sitting on the dashboard beside the radiant golden Constellation Key.

Environment: An epic, tempestuous space storm with rolling violet and magenta cosmic clouds, crackling cyan plasma lightning bolts, and drifting space debris. Ahead in the distance lies the serene golden corona of the home planet and observatory.

Lighting & Style: Award-winning cinematic 3D feature animation render. Electrifying violet and cyan ambient lighting, intense golden ion engine exhaust plumes trailing behind, cinematic motion blur on cosmic dust, blockbuster space-opera spectacle, 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a breathtaking, climactic cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Emotion: TAO stands victoriously at the center of the grand celestial observatory terrace. With a radiant, proud smile, he firmly turns the golden Constellation Key inside the ornate astronomical altar slot. A majestic, blinding pillar of golden starlight shoots straight up into the night sky, creating an expanding ring of shimmering golden constellations and glowing runes of fortune across the cosmos. The little repaired robot drone hovers nearby cheering joyfully.

Environment: The ancient star observatory fully restored, massive bronze astrolabes spinning smoothly, swirling golden cosmic dust, panoramic glass dome showing vibrant purple starlight.

Lighting & Style: Award-winning cinematic 3D animated feature render. Glorious golden volumetric god-rays, warm sparkling particle effects, rich vibrant celestial colors, emotional blockbuster climax, 8k Octane quality.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text, watermark, low quality.`,
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
        prompt: `Based on the character in the attached reference image, generate a joyful, celebratory cinematic 3D animated scene in 16:9 widescreen format.

Character Consistency: Keep the character TAO 100% identical to the reference image: the exact same red panda face, fur grooming, cute rounded ears, and his full navy-blue and orange textured armor suit with honeycomb chestplate, straps, and knee pads.

Action & Emotion: TAO is sitting triumphantly and joyfully atop a massive open treasure chest overflowing with sparkling golden coins, glowing gems, and cosmic fortune envelopes. He raises a shiny brass wrench in a victory salute with a cheerful wink. In his other paw he holds an open glowing scroll. The cute little round robot drone flies celebratory confetti streamers and sparkles around him.

Environment: The festive observatory celebration hall decorated with floating starlight balloons, golden confetti in mid-air, glowing star lanterns, and warm holiday ambiance.

Lighting & Style: Award-winning cinematic 3D animated feature render. Sparkling warm golden lighting, dazzling reflections on coins and crystals, festive bokeh, vibrant high-key atmosphere, rich 8k resolution.

Negative Prompt: flat 2D, plastic toy, preschool cartoon, smooth clay, dark muddy colors, desaturated gray, deformed paws, extra limbs, human face, text on coins, watermark, low quality.`,
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
