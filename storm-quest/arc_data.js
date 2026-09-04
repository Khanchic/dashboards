/**
 * Storm Rush Quest Arc Data: "The Stolen Crown of Storms" (Похищенная Корона Гроз)
 * 7 Days, 13 Scenes (1 Master Kickoff + 12 Branching Scenes).
 * Optimized for Google Flow & Nano Banana (Clean IP-safe prompts referencing the user's attached Golem & Sparky image).
 */

const ARC_METADATA = {
  title: "The Stolen Crown of Storms",
  titleRu: "Похищенная Корона Гроз",
  character: "Golem & Sparky (Каменный Исполин и Плазменная Искра)",
  brand: "Storm Rush (STR)",
  duration: "7 Days (Interactive Discord Event)",
  outfit: "Dark Mossy Boulder Colossus + Glowing Cyan Plasma Spirit",
  referenceImage: "assets/Golem_and_Sparky.jpg",
  aspectRatio: "16:9",
  renderEngine: "Google Flow / Nano Banana"
};

const CHARACTER_DNA = {
  name: "Golem & Sparky",
  role: "Guardians of the Storm Sanctuary",
  species: "Ancient Mossy Stone Colossus & Sentient Electric Plasma Wisp",
  appearance: "Golem: massive dark basalt boulders, mossy crevices, glowing emerald fissures, slit green eyes, wide glowing smile. Sparky: tiny floating spirit of vibrant electric-cyan plasma, cute dark eyes, energetic trails",
  attire: "Natural elemental forms — heavy weathered rock and pure electrical energy",
  personality: "Golem is calm, gentle, immensely strong and protective. Sparky is swift, playful, curious and loyal"
};

const QUEST_DAYS = [
  {
    day: 1,
    titleRu: "День 1: Пустой Постамент в Святилище (Старт)",
    titleEn: "Day 1: Empty Altar in the Storm Sanctuary (Kickoff)",
    act: "Акт 1: Завязка тайны",
    isSingleScene: true,
    summary: "Утром Голем и Спарки обнаруживают, что священная Корона Гроз исчезла с алтаря! Каменный постамент расколот, по мшистым корням стекают капли заряженной влаги и тянутся электрические следы.",
    votingQuestion: "Куда Голему и Спарки отправиться по первому следу?",
    votingOptions: {
      A: {
        label: "Затопленные Кристальные Гроты",
        choiceText: "🅰️ Спуститься по следу заряженной воды в затопленные гроты"
      },
      B: {
        label: "Древние Базальтовые Шахты",
        choiceText: "🅱️ Идти по следу расколотых валунов в подземные шахты"
      }
    },
    singleScene: {
      id: "1",
      label: "Стартовый мастер-кадр",
      sceneTitle: "Тревога перед пустым алтарем",
      prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

They stand in an ancient outdoor stone sanctuary surrounded by mossy monoliths and towering runic trees. In the center, a cracked basalt pedestal is empty, with only fading blue sparks hovering above it where the storm crown once rested. The giant golem leans forward with an expression of gentle concern and curiosity, resting one huge stone hand on the fractured altar. His tiny plasma companion hovers close above the stone, scanning the floor where a glowing trail of cyan sparks leads toward the dark trees.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, atmospheric nighttime forest fog, warm golden fireflies contrasting with cool electric-cyan lighting, shallow depth of field, high detail, 16:9 widescreen.`,
      discordCopy: `⚡ **ТРЕВОГА В СВЯТИЛИЩЕ STORM RUSH! КОРОНА ГРОЗ ИСЧЕЗЛА!** ⚡

Смотрители бури, у нас чрезвычайное происшествие!
Сегодня на рассвете Голем и Спарки пришли к Древу Гроз, но каменный постамент расколот, а легендарная **Корона Гроз** бесследно пропала! Без неё энергия джекпотов StormRush заблокирована! 😱

На мшистых плитах остались сверкающие следы чистой плазмы, уходящие в чащу. 

⚡ **С ЭТОГО МОМЕНТА ВЫ ВЕДЕТЕ РАССЛЕДОВАНИЕ!**
Каждый день ваши реакции в голосовании решают, по какому пути пойдут Голем и Спарки. В конце недели всех участников ждёт мега-джекпот и секретный промокод!

**КУДА ОТПРАВИТЬСЯ ГЕРОЯМ?**
🅰️ — Спуститься по следу заряженной воды в затопленные Кристальные Гроты!
🅱️ — Идти по следу расколотых камней в древние Базальтовые Шахты!

*Голосуйте реакцией 🅰️ или 🅱️ ниже! Итоги подведем ровно через 24 часа.*`
    }
  },
  {
    day: 2,
    titleRu: "День 2: Первый след сквозь стихию",
    titleEn: "Day 2: Tracking the Elemental Trail",
    act: "Акт 2: Поиски и преодоление",
    isSingleScene: false,
    summary: "Герои идут по следам похитителя, сталкиваясь с первыми природными препятствиями стихий.",
    votingQuestion: "Как преодолеть преграду на пути?",
    votingOptions: {
      A: {
        label: "Сила Голема",
        choiceText: "🅰️ Пробить каменный завал несокрушимой силой Голема"
      },
      B: {
        label: "Энергия Спарки",
        choiceText: "🅱️ Найти обходной путь с помощью воздушной разведки Спарки"
      }
    },
    branches: {
      A: {
        id: "2A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Спуск в Кристальные Гроты",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The stone golem wades waist-deep through a clear subterranean cavern pool filled with glowing turquoise minerals and ancient carved stone steps. His little plasma friend glides happily just above the water surface, acting as a bright lantern that reveals luminous electric tracks along the damp cave floor. Towering stalactites wrapped in luminescent vines hang from above, reflecting shimmering caustics onto the golem's mossy shoulders.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR wet stone materials, vibrant turquoise water caustics, soft ambient cave mist, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `🌊 **ДЕНЬ 2 (Ветка 🅰️): В КРИСТАЛЬНЫХ ГРОТАХ!**

Большинство выбрало путь воды! Голем уверенно шагает по пояс в кристально чистом подземном озере, а Спарки скользит прямо над рябью воды, освещая дно своим бирюзовым сиянием. 

На дне грота они натыкаются на упавшую каменную плиту с древними рунами, преграждающую проход в нижний зал.

**ЧТО ДЕЛАЕМ?**
🅰️ — Голем поднимает плиту обеими руками!
🅱️ — Спарки просачивается в узкую расщелину сверху на разведку!`
      },
      B: {
        id: "2B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Базальтовые Шахты",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The stone golem walks through a massive underground basalt quarry with geometric hexagonal rock columns and hanging copper chains. He holds his giant hand open as a steady perch for his glowing plasma companion, who points forward with an enthusiastic beam of electric sparks toward an arched stone doorway glowing with amber light in the distance. The rocky floor is scattered with ancient glowing crystals and carved stone gears.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR volcanic rock textures, rich deep indigo shadows accented by emerald and cyan rim lighting, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `⛏️ **ДЕНЬ 2 (Ветка 🅱️): В ТЕМНЫХ ШАХТАХ!**

Вы выбрали старые базальтовые шахты! Голем ступает по каменным коридорам среди гигантских колонн, а Спарки сидит у него на ладони, как живой фонарь, указывая путь к старой мастерской.

Впереди дорогу перекрывают тяжелые подвесные решетки на ржавых цепях.

**КАК ПРОХОДИМ?**
🅰️ — Голем тянет за цепи и поднимает ворота!
🅱️ — Спарки пережигает петли точным плазменным разрядом!`
      }
    }
  },
  {
    day: 3,
    titleRu: "День 3: Испытание на пропасти",
    titleEn: "Day 3: The Chasm Crossing",
    act: "Акт 2: Нарастание напряжения",
    isSingleScene: false,
    summary: "Путь преграждает глубокая подземная расселина с бушующим грозовым вихрем.",
    votingQuestion: "Как перебраться через грозовую пропасть?",
    votingOptions: {
      A: {
        label: "Каменный мост Голема",
        choiceText: "🅰️ Построить мост из гигантских валунов"
      },
      B: {
        label: "Электрический канат Спарки",
        choiceText: "🅱️ Натянуть плазменный трос из живой молнии"
      }
    },
    branches: {
      A: {
        id: "3A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Голем строит переправу",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

At the edge of a breathtaking subterranean chasm with a roaring underground waterfall, the stone golem hoists a giant mossy boulder onto his broad shoulders, preparing to bridge the gap. His emerald fissures flare with bright energy. Hovering right beside him, the little plasma spirit playfully zaps the far cliff with a tether of sparkling blue lightning to guide his friend's aim.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and water spray materials, dramatic vertical mist lighting, glowing turquoise abyss below, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `⚡ **ДЕНЬ 3 (Ветка 🅰️): КАМЕННЫЙ МОСТ!**

Голем в действии! Подняв огромный валун, титан закладывает первую опору моста через пропасть с ревущим водопадом. Спарки страхует его, освещая противоположный берег искрами!

На той стороне виден древний рунический замок, ведущий в святая святых.

**КАК ОТКРЫВАЕМ ЗАМОК?**
🅰️ — Голем прикладывает ладонь к рунному отпечатку!
🅱️ — Спарки посылает импульс прямо в сердцевину механизма!`
      },
      B: {
        id: "3B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Плазменный трос Спарки",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The little plasma spirit flies across a deep misty ravine, stretching out a luminous rope of crackling cyan lightning anchored between two ancient stone pillars. On the near ledge, the giant stone golem carefully balances on thick stone legs, grinning with trust as he tests the glowing energy bridge with one enormous mossy foot. Below them, clouds of blue phosphorescent mist drift through the chasm.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR materials, bright electric arcing light reflecting on wet stone, deep indigo atmospheric perspective, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `⚡ **ДЕНЬ 3 (Ветка 🅱️): ЭЛЕКТРО-ТРОС!**

Невероятная ловкость! Спарки растянул между скалами настоящий мост из чистой циановой плазмы. Голем с доверием и улыбкой делает первый шаг по сияющей линии!

Переправа успешно пройдена, впереди показался зал древнего хранилища.

**КУДА ИДЕМ ДАЛЬШЕ?**
🅰️ — В главный парадный зал святилища!
🅱️ — По боковой галерее вдоль светящихся кристаллов!`
      }
    }
  },
  {
    day: 4,
    titleRu: "День 4: Тайник найден (Поворот сюжета)",
    titleEn: "Day 4: The Vault Revealed (Plot Twist)",
    act: "Акт 3: Находка и сюрприз",
    isSingleScene: false,
    summary: "Герои находят Корону Гроз, но она не украдена врагами — она заблокирована защитным протоколом храма!",
    votingQuestion: "Как снять защитный барьер с Короны?",
    votingOptions: {
      A: {
        label: "Синхронная калибровка",
        choiceText: "🅰️ Спарки питает руны током, Голем держит защитный контур"
      },
      B: {
        label: "Силовой взлом ячейки",
        choiceText: "🅱️ Голем раздвигает створки, Спарки забирает реликвию"
      }
    },
    branches: {
      A: {
        id: "4A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Синхронная разрядка барьера",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

Inside a grand circular subterranean chamber lined with towering basalt arches, the glowing green Storm Crown floats inside a sphere of swirling blue plasma above a stone pedestal. The golem kneels respectfully before the altar, grounding the pedestal with both heavy hands as his green cracks glow brightly. Beside the floating crown, his little plasma buddy concentrates with adorable focus, gently tuning the energy sphere to harmonize the frequencies.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and glowing glass materials, dramatic emerald and cyan dual-light illumination, dust motes floating in light beams, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `👑 **ДЕНЬ 4 (Ветка 🅰️): КОРОНА В СФЕРЕ ЭНЕРГИИ!**

Вот она — сияющая Корона Гроз! Но похитителей нет: древний алтарь сам закрыл её в защитную плазменную сферу из-за скачка энергии. 

Голем заземляет алтарь ладонями, а Спарки аккуратно калибрует частоту поля. Сфера начинает мерцать и поддаваться!

**КАКОЙ ШАГ ДЕЛАЕМ?**
🅰️ — Усилить заземление и полностью снять купол!
🅱️ — Спарки ныряет внутрь сферы и выталкивает Корону!`
      },
      B: {
        id: "4B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Силовое размыкание алтаря",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The stone golem firmly grasps two heavy stone clam-shell doors that are slowly closing over the glowing green storm crown, using his enormous physical strength to hold them wide open. Sparks of emerald light shoot from his strained arms. His little plasma friend zips quickly between the closing gates, reaching out with tiny glowing arms to cradle the crown and carry it to safety.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, intense dynamic rim lighting, flying green and blue electrical sparks, motion blur on plasma trails, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `👑 **ДЕНЬ 4 (Ветка 🅱️): СИЛОВОЙ ЗАХВАТ!**

Створки алтаря захлопываются! Голем принимает удар на себя и мощными каменными руками удерживает тяжелые плиты, пока Спарки молнией пролетает в щель и подхватывает сияющую Корону Гроз!

Корона в руках, но древняя сигнализация святилища начинает пробуждаться!

**КУДА БЕЖИМ?**
🅰️ — По верхнему виадуку к лифту святилища!
🅱️ — Через подземный туннель к грозовому гейзеру!`
      }
    }
  },
  {
    day: 5,
    titleRu: "День 5: Прорыв сквозь обвал",
    titleEn: "Day 5: The Rush Back",
    act: "Акт 4: Экшен и командная работа",
    isSingleScene: false,
    summary: "Подземные толчки вызывают обвал. Друзья должны слаженно пробиться обратно к выходу на поверхность.",
    votingQuestion: "Как преодолеть рушащийся коридор?",
    votingOptions: {
      A: {
        label: "Щит Голема",
        choiceText: "🅰️ Голем закрывает Спарки и Корону своим каменным телом"
      },
      B: {
        label: "Плазменный бур Спарки",
        choiceText: "🅱️ Спарки расчищает завал молниеносным лучом"
      }
    },
    branches: {
      A: {
        id: "5A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Каменный щит исполина",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

Inside a crumbling cavern passage where mossy rocks fall from the ceiling, the massive stone golem crouches protectively like a living fortress dome. Cradled safely beneath his huge chest and forearms, the little plasma spirit hugs the glowing green storm crown, looking up at his friend with boundless admiration and gratitude. Falling debris harmlessly shatters against the golem's sturdy back in clouds of ancient dust.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and dust particle materials, warm protective glow beneath the golem contrasting with chaotic cool blue dust in the background, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `🛡️ **ДЕНЬ 5 (Ветка 🅰️): НЕПРОБИВАЕМЫЙ ЩИТ!**

Каменный обвал нипочем истинному великану! Голем свернулся куполом, приняв град падающих камней на свои широкие базальтовые плечи. Внизу в безопасности Спарки прижимает к себе Корону Гроз, озаряя пространство бирюзовым светом.

Пыль рассеивается, впереди открывается выход к вертикальной шахте!

**КАК ПОДНИМАЕМСЯ?**
🅰️ — Взбираемся по гигантским ступеням монолита!
🅱️ — Ждём восходящего потока грозового пара!`
      },
      B: {
        id: "5B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Плазменный разряд Спарки",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The stone golem strides forward with determination, carrying the glowing green storm crown tucked safely under one enormous arm. Flying ahead at the forefront of the tunnel, the little plasma buddy unleashes a concentrated, brilliant burst of cyan electric energy from his outstretched hands, obliterating a falling boulder barrier into harmless sparkling embers and lighting up the entire corridor.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR rock textures, explosive cyan and emerald lighting with trailing sparks, dramatic forward motion perspective, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `⚡ **ДЕНЬ 5 (Ветка 🅱️): ПЛАЗМЕННЫЙ ЛУЧ!**

Вот это мощь! Спарки концентрирует всю свою энергию и точным плазменным залпом распыляет завал из валунов в сноп безвредных золотых искр! Голем уверенно шагает вперед, неся Корону подмышкой.

Путь к поверхности полностью открыт!

**КУДА ВЫХОДИМ?**
🅰️ — На вершину Базальтового Утёса!
🅱️ — Прямо к воротам Главного Святилища!`
      }
    }
  },
  {
    day: 6,
    titleRu: "День 6: Восхождение сквозь грозу",
    titleEn: "Day 6: Ascent Through the Storm",
    act: "Акт 5: Кульминация приключения",
    isSingleScene: false,
    summary: "Герои поднимаются к святилищу на вершине горы в разгар грандиозной грозы.",
    votingQuestion: "Как завершить восхождение на вершину?",
    votingOptions: {
      A: {
        label: "Полет на грозовом вихре",
        choiceText: "🅰️ Спарки подхватывает Голема вихрем молний"
      },
      B: {
        label: "Шаги колосса сквозь бурю",
        choiceText: "🅱️ Голем монументально поднимается по лестнице предков"
      }
    },
    branches: {
      A: {
        id: "6A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Полёт на грозовом смерче",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

A majestic wide scene showing the gigantic stone golem joyfully riding upward inside a swirling vortex of electric cyan lightning and rushing wind that lifts him straight toward the mountain summit. The little plasma spirit flies at the top of the cyclone, laughing happily, while the golem triumphantly holds the glowing green storm crown high in both stone hands against the stormy midnight sky.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, electrifying cyan tornado lighting, torrential rain streaks, rolling dark purple storm clouds with glowing lightning strikes, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `🌪️ **ДЕНЬ 6 (Ветка 🅰️): ВЗЛЕТ НА ШТОРМОВОМ ВИХРЕ!**

Невероятный триумф! Спарки раскручивает вокруг Голема настоящий электрический вихрь, поднимая многотонного исполина прямо к вершине горы под раскаты грома! 

Голем победоносно держит сияющую Корону Гроз двумя руками навстречу молниям! Святилище прямо перед ними!

**КАК ВОЗВРАЩАЕМ КОРОНУ НА ПОСТАМЕНТ?**
🅰️ — Торжественно опустить в центр алтаря!
🅱️ — Зарядить её ударом молнии прямо в воздухе!`
      },
      B: {
        id: "6B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Шаги сквозь бурю",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The massive stone golem takes a monumental step onto the top landing of an ancient grand stone staircase outside the storm temple, battling fierce winds. Rain glistens on his mossy shoulders as he protects the glowing green crown in his hands. Perched affectionately on his rocky shoulder, the little plasma spirit illuminates his grinning stone face, pointing enthusiastically at the temple doors just ahead.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR wet stone materials, cinematic thunderstorm atmosphere, purple lightning illuminating the mountain ridges in the background, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `⛰️ **ДЕНЬ 6 (Ветка 🅱️): МОНУМЕНТАЛЬНЫЙ ШАГ!**

Несокрушимая сила воли! Сквозь ливень и ураганный ветер Голем ступает на верхнюю площадку храмовой лестницы. Дождь блестит на его замшелых плечах, а Спарки с его плеча освещает последние шаги к святилищу.

Завтра — решающий финал и запуск еженедельного джекпота!

**КАК ПРАЗДНУЕМ ПОБЕДУ ЗАВТРА?**
🅰️ — Грандиозный фестиваль молний и салютов!
🅱️ — Раскрытие золотого хранилища с раздачей бонусов!`
      }
    }
  },
  {
    day: 7,
    titleRu: "День 7: Торжество и Мега-Джекпот StormRush (Финал)",
    titleEn: "Day 7: The Grand Storm Rush Jackpot (Finale)",
    act: "Акт 6: Финал и раздача призов",
    isSingleScene: false,
    summary: "Корона Гроз возвращена на алтарь! Потоки чистой энергии пробуждают джекпот-слоты, запускается празднование в Discord.",
    votingQuestion: "Финальный выбор сообщества:",
    votingOptions: {
      A: {
        label: "Великий Фестиваль Гроз",
        choiceText: "🅰️ Запустить грозовой салют и праздничные вращения"
      },
      B: {
        label: "Золотой Разлом Сокровищ",
        choiceText: "🅱️ Открыть золотой сейф постамента с мега-промокодом"
      }
    },
    branches: {
      A: {
        id: "7A",
        branchLabel: "Ветка 🅰️",
        sceneTitle: "Фестиваль Гроз и Салют",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

The stone golem and his glowing plasma companion celebrate together in the restored storm sanctuary. The glowing green storm crown sits proudly in the center of the basalt pedestal, radiating joyful beams of emerald and cyan light into the sky. The golem is seated happily with his arms resting contentedly, while the little plasma spirit does a joyful flip in the air, creating sparkling golden confetti sparks that drift through the warm magical air.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, festive night celebration lighting, sparkling golden and cyan ember particles, warm atmospheric glow, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `🎉 **МЫ СДЕЛАЛИ ЭТО! КОРОНА ГРОЗ ВЕРНУЛАСЬ НА АЛТАРЬ!** 🎉

Друзья, 7-дневное путешествие подошло к победному концу! Благодаря вашим голосам Голем и Спарки преодолели гроты, шахты и ураган, вернув реликвию на законное место!

⚡ Святилище StormRush сияет миллионами изумрудных и бирюзовых искр! 

🎁 **ВАША НАГРАДА ЗА ПОБЕДУ В КВЕСТЕ:**
Используйте эксклюзивный промокод сообщества: **\`STORMCROWN2026\`**
* +100% к депозиту
* 50 бесплатных грозовых вращений
* Специальная роль в Discord: «⚡ Хранитель Бури»

Спасибо каждому, кто принимал решения в голосованиях! Голем довольно улыбается, а Спарки крутит победные сальто! До встречи в следующем квесте! 🚀`
      },
      B: {
        id: "7B",
        branchLabel: "Ветка 🅱️",
        sceneTitle: "Золотой Водопад Джекпота",
        prompt: `Use the attached image as the character reference. Keep their design consistent: the massive ancient stone golem made of dark cracked boulders with moss textures, glowing emerald-green fissures, slit-shaped glowing green eyes and a warm wide smile; and his tiny companion, the cute floating spirit made of pure glowing electric-cyan plasma with dark eyes and trailing energy wisps. Change only their pose and expression.

Close-up composition inside the sanctuary where the restored green storm crown rests upon the cracked basalt altar block. From the fissures of the pedestal, a rich cascade of glowing golden coins and emerald gems spills out across the mossy stone ground. The giant golem leans in with an enormous joyful grin, and his little glowing cyan plasma friend sits happily atop the crown, holding up a sparkling golden coin in victory.

Stylized 3D character render, soft subsurface plasma and moss shading, glossy PBR polished gold and wet stone materials, radiant warm golden and vibrant cyan illumination, rich reflections, festive atmosphere, shallow depth of field, high detail, 16:9 widescreen.`,
        discordCopy: `💰 **МЕГА-ДЖЕКПОТ РАСПАКОВАН! ЗОЛОТОЙ ДОЖДЬ STORMRUSH!** 💰

Корона встала на алтарь — и древний постамент раскрыл свое тайное хранилище! Горы золотых монет и сияющих кристаллов хлынули в зал святилища!

Спарки гордо восседает на Короне, а Голем расплылся в самой широкой и доброй каменной улыбке в истории!

🎁 **ЗАБЕРИ СВОЮ ДОЛЮ СОКРОВИЩА:**
Вводи промокод: **\`STORMRUSH777\`**
* Мгновенный бездепозитный бонус монет
* Доступ к турниру «Битва Гроз»
* VIP-значок первооткрывателя

Вы лучшие! Голем и Спарки благодарят за верные решения каждый день! 🔥`
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARC_METADATA, CHARACTER_DNA, QUEST_DAYS };
}
