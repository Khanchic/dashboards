/**
 * Storm Rush Quest Arc Data — Multi-Week Campaign Data
 * Поддержка переключения между неделями:
 * - Неделя 1: "Похищенная Корона Гроз" (The Stolen Crown of Storms)
 * - Неделя 2: "Великое Ограбление Казино Олимпа" (The Grand Heist of Olympus Overdrive)
 */

const ALL_ARCS = {
  "week-1": {
    id: "week-1",
    tabLabel: "👑 Неделя 1: Корона Гроз",
    badgeLabel: "Неделя 1 (Завершена)",
    status: "Архив / Завершена",
    metadata: {
      title: "The Stolen Crown of Storms",
      titleRu: "Похищенная Корона Гроз",
      character: "Golem & Sparky (Каменный Исполин и Плазменный Дух)",
      brand: "Storm Rush (STR)",
      duration: "7 Days (Interactive Discord Event)",
      outfit: "Mossy Dark Basalt Colossus + Aquamarine Plasma Spirit",
      referenceImage: "assets/Golem_and_Sparky.jpg",
      aspectRatio: "16:9",
      renderEngine: "Google Flow / Gemini Nano Banana 2"
    },
    characterDna: {
      name: "Голем и Спарки (Икринка)",
      role: "Хранители Святилища Гроз",
      species: "Древний Базальт + Аквамариновая Плазма",
      appearance: "Golem: massive dark green boulders, mossy crevices, bright glowing emerald cracks, narrow glowing eyes, wide glowing smile. Sparky: tiny formless floating spirit of glowing aquamarine plasma, two dark dot eyes, little smile, soft plasma tendrils, no arms, no legs, size of golem's hand",
      attire: "Natural elemental forms — heavy mossy weathered basalt and pure aquamarine plasma",
      personality: "Golem is calm, gentle, protective and immensely strong. Sparky is swift, curious, loyal and always hovers"
    },
    dnaPrefix: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.",
    subheading: "Интерактивная 7-дневная сюжетная кампания для Discord • Голем и Спарки • 13 сцен (16:9)",
    days: [
      {
        day: 1,
        titleRu: "День 1: Пустой Постамент в Святилище (Старт)",
        titleEn: "Day 1: Empty Altar in the Storm Sanctuary (Kickoff)",
        act: "Акт 1: Завязка тайны",
        isSingleScene: true,
        summary: "Утром Голем и Спарки обнаруживают, что священная Корона Гроз исчезла с алтаря! Каменный постамент расколот, по мшистым корням тянутся мерцающие бирюзовые капли.",
        votingQuestion: "Куда Голему и Спарки отправиться по первому следу?",
        votingOptions: {
          A: {
            label: "Кристальные Гроты",
            choiceText: "🅰️ Спуститься по следу заряженной воды в затопленные Кристальные Гроты"
          },
          B: {
            label: "Базальтовые Шахты",
            choiceText: "🅱️ Идти по следу расколотых валунов в подземные Базальтовые Шахты"
          }
        },
        singleScene: {
          id: "1",
          label: "Стартовый мастер-кадр",
          sceneTitle: "Тревога перед пустым алтарем",
          prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey stand in an ancient open-air stone sanctuary among mossy monoliths and towering trees carved with abstract glyph shapes. In the centre a cracked basalt pedestal sits empty, only fading blue sparks hovering where the storm crown used to rest. The golem leans forward with gentle worry, one huge hand resting on the fractured altar. The little spirit hovers just above the stone, lighting a trail of glowing aquamarine droplets that leads away toward the dark trees.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, night forest fog, warm fireflies against cool aquamarine light, shallow depth of field, high detail, 16:9 widescreen.",
          discordCopy: "⚡ **ТРЕВОГА В СВЯТИЛИЩЕ STORM RUSH! КОРОНА ГРОЗ ИСЧЕЗЛА!** ⚡\n\nСмотрители бури, у нас чрезвычайное происшествие!\nСегодня на рассвете Голем и Спарки пришли к Древу Гроз, но каменный постамент расколот, а легендарная **Корона Гроз** бесследно пропала! Без неё энергия джекпотов StormRush заблокирована! 😱\n\nНа мшистых плитах остались сверкающие бирюзовые следы, уходящие в чащу. \n\n⚡ **С ЭТОГО МОМЕНТА ВЫ ВЕДЕТЕ РАССЛЕДОВАНИЕ!**\nКаждый день ваши реакции в голосовании решают, по какому пути пойдут Голем и Спарки. В конце недели всех участников ждёт мега-джекпот и секретный промокод!\n\n**КУДА ОТПРАВИТЬСЯ ГЕРОЯМ?**\n🅰️ — Спуститься по следу заряженной воды в затопленные Кристальные Гроты!\n🅱️ — Идти по следу расколотых камней в древние Базальтовые Шахты!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже! Итоги подведем ровно через 24 часа.*"
        }
      },
      {
        day: 2,
        titleRu: "День 2: Первый след сквозь стихию",
        titleEn: "Day 2: Tracking the Elemental Trail",
        act: "Акт 2: Поиски и преодоление",
        isSingleScene: false,
        summary: "Герои идут по следам похитителя, выходя к непреодолимой грозовой пропасти.",
        votingQuestion: "Как перебраться через грозовую пропасть с водопадом?",
        branches: {
          A: {
            id: "2A",
            label: "Кристальный Грот",
            choiceText: "🅰️ Построить мост из гигантских валунов",
            sceneTitle: "Спуск в светящийся кристальный грот",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey carefully make their way down a cavern of wet dark basalt studded with massive glowing aquamarine crystal clusters that jut from the rock walls. Water drips steadily into shallow turquoise pools reflecting the light. The golem steps forward on heavy stone feet, smiling cheerfully as he points down at glowing footprints embedded in the wet crystal gravel. The little spirit hovers right above a puddle, illuminating the ripple patterns and lighting up the deep cave tunnel ahead.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy wet rock reflections, volumetric cavern mist illuminated by cyan crystals, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💧 **ДЕНЬ 2: В ГЛУБИНАХ КРИСТАЛЬНЫХ ГРОТОВ!** 💧\n\nВы проголосовали за гроты — и интуиция вас не подвела! Вода хранит следы похитителя!\n\nГолем и Спарки спустились в пещеру с гигантскими аквамариновыми кристаллами. На мокрой гальке видны четкие энергетические следы, уходящие к подземной реке. Впереди шумит бурный грозовой водопад!\n\n**КАК ПРЕОДОЛЕТЬ ВОДОПАД?**\n🅰️ — Голем построит мост из гигантских валунов и перенесет Спарки в ладонях!\n🅱️ — Спарки полетит вперед и создаст плазменный трос над бушующей водой!\n\nСтавь реакцию **🅰️** или **🅱️**! ⚡"
          },
          B: {
            id: "2B",
            label: "Базальтовые Шахты",
            choiceText: "🅱️ Натянуть плазменный трос через бездну",
            sceneTitle: "Штурм базальтовых шахт",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey explore a deep ancient quarry carved from hexagonal basalt pillars that tower into shadow. Smashed mine carts and heavy iron machinery overgrown with glowing moss litter the stone path. The golem lifts a heavy stone beam off the tracks with effortless ease, looking ahead with a determined smile. The little spirit zooms through a narrow fissure high in the rock wall, casting a bright cyan beacon back into the corridor to show a clear way through.\n\nStylized 3D character render, soft subsurface moss and stone shading, PBR rusted iron and dark stone textures, moody rim lighting from cyan plasma and emerald cracks, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⛏️ **ДЕНЬ 2: ТАЙНЫ БАЗАЛЬТОВЫХ ШАХТ!** ⛏️\n\nШахты полны древних механизмов и рухнувших колонн! \n\nГолем играючи поднял массивную балку, расчистив путь, а Спарки нашел скрытый проход в стене. Впереди открывается глубокая расщелина с обрывом!\n\n**КАК ПЕРЕБРАТЬСЯ ЧЕРЕЗ ОБРЫВ?**\n🅰️ — Голем соорудит каменную насыпь и мощным прыжком преодолеет бездну!\n🅱️ — Спарки натянет защитный световой канат, по которому герои скользнут на ту сторону!\n\nГолосуйте прямо сейчас! ⚡"
          }
        }
      },
      {
        day: 3,
        titleRu: "День 3: Разрушенный Мост Бури",
        titleEn: "Day 3: The Broken Storm Bridge",
        act: "Акт 2: Нарастание вызова",
        isSingleScene: false,
        summary: "Герои достигают ущелья, разделяющего земли Святилища и Цитадель Ветров.",
        votingQuestion: "Как победить стража разрушенного моста?",
        branches: {
          A: {
            id: "3A",
            label: "Каменный трамплин",
            choiceText: "🅰️ Построить платформу из камней",
            sceneTitle: "Прыжок через пропасть",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey stand at the jagged precipice of a stormy canyon beneath a sky of swirling indigo clouds lit by distant lightning forks. The bridge across is shattered, with only broken stone piers jutting from the mist. The golem heaves three massive boulders into place, creating a solid landing ramp with a confident grin on his face. The little spirit zips across the open gap, leaving an arc of electric light that marks the exact trajectory for the jump.\n\nStylized 3D character render, soft subsurface moss and stone shading, atmospheric depth with rain streaks and distant lightning flashes, dramatic scale, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌉 **ДЕНЬ 3: ПРЫЖОК ЧЕРЕЗ БЕЗДНУ!** 🌉\n\nМост Бури разрушен, но наших героев это не остановит! Голем возводит каменный трамплин, а Спарки рисует траекторию в воздухе!\n\nНа другом берегу виден силуэт древней Грозовой Башни. **Как прорываемся к воротам?**\n🅰️ — Идти напролом по главному каменному серпантину!\n🅱️ — Обойти через парящие карнизы под прикрытием грозового тумана!\n\nСтавь реакцию! 👇"
          },
          B: {
            id: "3B",
            label: "Плазменный мост",
            choiceText: "🅰️ Создать энергетическую дугу",
            sceneTitle: "Светящаяся дуга над пропастью",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nAt the edge of a sheer cliff overlooking a sea of thunderous clouds, the little spirit swells with glowing energy, tethering a luminous aquamarine plasma cable between two ancient brass anchor stones across the canyon. The giant golem steps onto the glowing line with complete trust and a happy grin, his heavy stone body balancing gracefully as emerald sparks cascade from his feet down into the canyon mist below.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glowing bridge illuminating the rocky cliffs, moody stormy atmosphere with volumetric clouds, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚡ **ДЕНЬ 3: ПЛАЗМЕННЫЙ КАНАТ НАД ОБЛАКАМИ!** ⚡\n\nСпарки создал невероятный мост из чистой энергии! Голем уверенно шагает по светящемуся канату над бушующей бездной!\n\nВпереди ворота Башни Гроз. **Какой путь выбираем?**\n🅰️ — Штурм главных ворот с помощью колоссальной силы Голема!\n🅱️ — Скрытное проникновение через верхнюю арку под прикрытием тумана!\n\nГолосуй реакцией! 🅰️ или 🅱️!"
          }
        }
      },
      {
        day: 4,
        titleRu: "День 4: 💥 Поворотный Момент — Врата Цитадели",
        titleEn: "Day 4: Mid-Week Twist: The Citadel Gates",
        act: "Акт 3: Кульминация тайны",
        isSingleScene: false,
        summary: "Герои находят похитителя — древнего Механического Дракона, питающего свои крылья энергией Короны.",
        votingQuestion: "Как отвлечь Механического Дракона?",
        branches: {
          A: {
            id: "4A",
            label: "Лобовой штурм",
            choiceText: "🅰️ Голем вызывает Дракона на поединок силы",
            sceneTitle: "Голем бросает вызов Механическому Дракону",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nInside a vast circular arena flanked by colossal storm pillars, they confront a massive mechanical storm dragon whose metal wings crackle with stolen lightning. The golem stomps forward fearlessly with chest out and a brave broad grin, slamming his giant stone fists together to create a shockwave of emerald sparks. The little spirit hovers just behind his shoulder, flaring into a bright defensive halo of aquamarine plasma.\n\nStylized 3D character render, soft subsurface moss and stone shading, metallic reflections on brass and copper dragon scales, volumetric arena dust, high-contrast dynamic lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🐉 **ДЕНЬ 4: МЕГА-ТВИСТ! МЕХАНИЧЕСКИЙ ДРАКОН!** 🐉\n\nПохититель раскрыт! Это древний Механический Дракон, который вставил нашу Корону Гроз в свое ядро питания!\n\nГолем со всей мощью ударил кулаками, вызвав изумрудную волну, а Спарки прикрыл его плазменным щитом!\n\n**КАК ЗАБИРАЕМ КОРОНУ?**\n🅰️ — Голем схватит дракона за крыло и вырвет корону в рукопашной схватке!\n🅱️ — Спарки залетит прямо в вентиляцию дракона и закоротит его ядро изнутри!\n\nРешай судьбу битвы! ⚡"
          },
          B: {
            id: "4B",
            label: "Тактический маневр",
            choiceText: "🅱️ Спарки ослепляет сенсоры Дракона плазмой",
            sceneTitle: "Спарки кружит вокруг Механического Дракона",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nIn the high vaulted hall of the Citadel, the little spirit zooms at breakneck speed in glowing spirals around the head of the giant brass clockwork dragon, dazzling its optical sensors with blinding bursts of aquamarine plasma. Below, the stone golem sneaks along the shadows of the stone arcade with a playful grin, positioning himself directly under the dragon's chest plate to catch the dislodged crown.\n\nStylized 3D character render, soft subsurface plasma and moss shading, intricate clockwork gear details on dragon, swirling light trails, dramatic motion blur accents, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "✨ **ДЕНЬ 4: ТАКТИЧЕСКИЙ ТРИУМФ!** ✨\n\nСпарки ослепил сенсоры Дракона световым танцем! Дракон дезориентирован, а Корона вот-вот выпадет из его грудного отсека!\n\n**КАК ДЕЙСТВУЕМ ДАЛЬШЕ?**\n🅰️ — Голем сделает мощный рывок и поймает падающую корону на лету!\n🅱️ — Спарки охватит корону плазменным коконом и унесет в безопасное место!\n\nГолосуйте! 🅰️ или 🅱️!"
          }
        }
      },
      {
        day: 5,
        titleRu: "День 5: Возвращение Реликвии",
        titleEn: "Day 5: Reclaiming the Crown",
        act: "Акт 3: Освобождение артефакта",
        isSingleScene: false,
        summary: "Корона освобождена из когтей Дракона, но Цитадель начинает разрушаться от избытка энергии!",
        votingQuestion: "Как выбраться из рушащейся Цитадели?",
        branches: {
          A: {
            id: "5A",
            label: "Каменный щит",
            choiceText: "🅰️ Голем пробивает стену и выносит корону",
            sceneTitle: "Голем держит корону и пробивает выход",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nIn the crumbling Citadel hall as stone debris rains down, the massive golem clutches the reclaimed glowing Storm Crown gently in one giant paw while using his other boulder arm to smash through a weakened stone wall. He smiles with sheer relief as daylight streams through the breach. The little spirit hovers right above the Crown, keeping its energy stabilized with gentle cyan plasma pulses.\n\nStylized 3D character render, soft subsurface moss and stone shading, falling dust and debris particles, bright rays of sunlight bursting through the shattered wall, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "👑 **ДЕНЬ 5: КОРОНА СПАСЕНА! НО БАШНЯ РУШИТСЯ!** 👑\n\nКорона в руках Голема! Она сияет ярче прежнего, но от перегрузки древний зал начинает осыпаться!\n\nГолем пробивает стену наружу! **Как спускаемся с вершины пика?**\n🅰️ — Съехать на каменной плите по склону горы как на сноуборде!\n🅱️ — Поймать восходящий поток штормового ветра на плазменном параплане Спарки!\n\nГолосуй реакцией! 👇"
          },
          B: {
            id: "5B",
            label: "Плазменный щит",
            choiceText: "🅱️ Спарки закрывает героев от обломков",
            sceneTitle: "Спарки укрывает Голема плазменным куполом",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nAs heavy masonry and stone arches collapse around them, the little spirit expands into a shimmering hemispherical dome of aquamarine plasma above them, bouncing heavy rocks away harmlessly with bright turquoise flashes. Beneath the shield, the stone golem sits calmly, holding the glowing golden crown close to his chest with a warm and loving smile on his face.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glowing protective shield effect with ripple distortions, falling stone debris and dust, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🛡️ **ДЕНЬ 5: СУПЕР-ЩИТ СПАРКИ!** 🛡️\n\nСпарки раскрыл защитный купол из плазмы, защитив Голема и спасенную Корону от обрушения!\n\nПуть свободен, пора возвращаться в Святилище. **Какой маршрут выбираем?**\n🅰️ — Спуск по горному каньону на каменных санях!\n🅱️ — Парение на плазменных потоках прямо к священному алтарю!\n\nВыбирай путь! 🅰️ или 🅱️!"
          }
        }
      },
      {
        day: 6,
        titleRu: "День 6: Дорога Домой сквозь Бурю",
        titleEn: "Day 6: The Journey Home",
        act: "Акт 4: Возвращение триумфаторов",
        isSingleScene: false,
        summary: "Герои возвращаются в родное Святилище, где их встречает очистившийся от бури закат.",
        votingQuestion: "Как провести финальную церемонию воссоединения Короны?",
        branches: {
          A: {
            id: "6A",
            label: "Каменный спуск",
            choiceText: "🅰️ Скольжение по склонам на каменных санях",
            sceneTitle: "Скоростной спуск с горы",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey slide down a smooth winding mountain glacier at thrilling speed, the golem surfing on a flat mossy stone slab with both arms wide for balance, grinning with pure exhilaration as the glowing crown rests safely in a pouch at his side. The little spirit surfs the wind right beside his head, leaving a sparkling wake of aquamarine snowflakes against the backdrop of a glorious golden and violet sunset sky.\n\nStylized 3D character render, soft subsurface moss and ice shading, dynamic speed lines and snow spray particles, warm sunset backlighting with long golden shadows, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⛷️ **ДЕНЬ 6: ГОНКА НА ЗАКАТЕ!** ⛷️\n\nЭто было невероятное путешествие! Голем и Спарки мчат на каменных санях навстречу Святилищу в лучах золотого заката!\n\nЗавтра — решающий финал и установка Короны на алтарь! **Как проведем церемонию?**\n🅰️ — Торжественный ритуал с запуском фейерверка из молний!\n🅱️ — Великий праздник с раздачей благословения и супер-наград всем игрокам!\n\nГолосуй за финал! ⚡"
          },
          B: {
            id: "6B",
            label: "Полет на плазме",
            choiceText: "🅱️ Парение на ветровых потоках",
            sceneTitle: "Парение над облаками к Святилищу",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nGliding peacefully through the upper atmosphere above a sea of soft golden clouds, the massive stone golem is carried along by gentle updrafts of warm wind, looking down with serene joy at the distant green sanctuary below. The little spirit hovers right in front of him, holding the glowing storm crown aloft between gentle plasma tendrils, casting a brilliant rainbow halo across the tranquil evening sky.\n\nStylized 3D character render, soft subsurface plasma and moss shading, painterly golden hour sky with soft cloud layers, warm lens flare and atmospheric haze, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌅 **ДЕНЬ 6: ВОЗВРАЩЕНИЕ НА КРЫЛЬЯХ СВЕТА!** 🌅\n\nСвятилище уже под нами! Корона сияет радужным ореолом, а тучи рассеялись!\n\nЗавтра грандиозный День 7 — установка Короны и раздача промокодов! **Как завершим неделю?**\n🅰️ — Зажжем Алтарь Гроз праздничным фейерверком!\n🅱️ — Откроем Мега-Джекпот Фортуны для всего комьюнити!\n\nЖми реакцию! 👇"
          }
        }
      },
      {
        day: 7,
        titleRu: "День 7: 🏆 Финал — Корона на Алтаре и Награды",
        titleEn: "Day 7: The Grand Restoration & Rewards",
        act: "Акт 5: Триумф и раздача наград",
        isSingleScene: false,
        summary: "Корона возвращена на священный постамент! Святилище вспыхивает победным светом, открывая супер-награды и промокоды для игроков.",
        votingQuestion: "Победа! Забирай свою награду за участие в квесте!",
        branches: {
          A: {
            id: "7A",
            label: "Праздник в Святилище",
            choiceText: "🅰️ Торжественный ритуал с салютом",
            sceneTitle: "Возложение Короны и салют молний",
            promoCode: "STORM777WIN",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nBack in the ancient stone sanctuary, the stone golem places the glowing golden crown back onto the repaired basalt altar with deep reverent happiness. The altar instantly surges with brilliant emerald and aquamarine energy, sending a majestic beam of golden light shooting straight up into the starry night sky. The little spirit dances joyfully inside the beam of light, scattering showers of golden sparks over the cheering crowd of ancient forest spirits gathered around.\n\nStylized 3D character render, soft subsurface moss and stone shading, celebratory golden fireworks and light rays, lush night foliage lit by emerald magic, festive mood, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎉 **ДЕНЬ 7: ТРИУМФ В СВЯТИЛИЩЕ! КОРОНА ВОЗВРАЩЕНА!** 🎉\n\nМы сделали это! Благодаря вашим ежедневным выборам Голем и Спарки прошли сквозь все испытания и вернули Корону на алтарь!\n\nЭнергия Storm Rush бьет ключом, и мы дарим каждому участнику победный промокод:\n\n🎁 **ПРОМОКОД:** `STORM777WIN`\n\nАктивируй на сайте и забирай свои вращения! Спасибо за участие в великом квесте! ⚡🏆"
          },
          B: {
            id: "7B",
            label: "Мега-Джекпот Фортуны",
            choiceText: "🅱️ Открытие Мега-Джекпота",
            sceneTitle: "Вспышка Мега-Джекпота и дождь из золота",
            promoCode: "CROWN999RUSH",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nStanding in the center of the radiant sanctuary, the golem raises both massive fists in triumph as a magical shower of golden coins, glowing emerald runes and sparkling gems rains down all around them. The little spirit hovers right between his raised arms, wreathed in a dazzling halo of golden-cyan lightning that illuminates their ecstatic smiling faces. In the background, ancient stone monoliths pulse with harmonious green light.\n\nStylized 3D character render, soft subsurface moss and stone shading, sparkling golden coin particle effects, euphoric celebratory lighting with rich bokeh, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌟 **ДЕНЬ 7: МЕГА-ДЖЕКПОТ РАЗБЛОКИРОВАН!** 🌟\n\nСвященный алтарь озарился светом победы! Золотой дождь наград обрушился на Святилище Storm Rush!\n\nФинальный супер-подарок от Голема и Спарки:\n\n🎁 **ПРОМОКОД:** `CROWN999RUSH`\n\nВводи промокод в личном кабинете и наслаждайся бонусами! До встречи в следующих приключениях! 🚀✨"
          }
        }
      }
    ]
  },
  "week-2": {
    id: "week-2",
    tabLabel: "🎰 Неделя 2: Ограбление Казино Олимпа",
    badgeLabel: "Неделя 2 (Текущая)",
    status: "Активна",
    metadata: {
      title: "The Grand Heist of Olympus Overdrive",
      titleRu: "Великое Ограбление Казино Олимпа",
      character: "Golem & Sparky (Каменный Исполин и Плазменный Дух)",
      brand: "Storm Rush (STR)",
      duration: "7 Days (Interactive Discord Event)",
      outfit: "Mossy Dark Basalt Colossus + Aquamarine Plasma Spirit",
      referenceImage: "assets/Golem_and_Sparky.jpg",
      aspectRatio: "16:9",
      renderEngine: "Google Flow / Gemini Nano Banana 2"
    },
    characterDna: {
      name: "Голем и Спарки (Икринка)",
      role: "Мастера Ограбления Века (Громила и Хакер)",
      species: "Древний Базальт + Аквамариновая Плазма",
      appearance: "Golem: massive dark green boulders, mossy crevices, bright glowing emerald cracks, narrow glowing eyes, wide glowing smile. Sparky: tiny formless floating spirit of glowing aquamarine plasma, two dark dot eyes, little smile, soft plasma tendrils, no arms, no legs, size of golem's hand",
      attire: "Natural elemental forms — heavy mossy weathered basalt and pure aquamarine plasma",
      personality: "Golem is the unstoppable brute-force specialist with a heart of gold. Sparky is the agile laser-hacking plasma spirit"
    },
    dnaPrefix: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.",
    subheading: "Интерактивная сюжетная кампания для Discord • 1 стартовый мастер-кадр + 12 ответвлений (16:9) • Ограбление Казино Олимпа",
    days: [
      {
        day: 1,
        titleRu: "День 1: План Ограбления Века над Облаками (Старт)",
        titleEn: "Day 1: The Heist Blueprint above the Clouds (Kickoff)",
        act: "Акт 1: Подготовка к ограблению",
        isSingleScene: true,
        summary: "Голем и Спарки на крыше парящего глайдера изучают голографический чертеж легендарного небесного казино «Олимп Овердрайв». Это стартовая точка недели — выбор первого рубежа проникновения!",
        votingQuestion: "Как Голем и Спарки проникнут внутрь казино «Олимп Овердрайв»?",
        votingOptions: {
          A: {
            label: "Вентиляция VIP-башни",
            choiceText: "🅰️ Через крышу и вентиляционную шахту VIP-башни (Скрытный путь)"
          },
          B: {
            label: "Грузовой служебный шлюз",
            choiceText: "🅱️ Через нижний служебный причал инкассаторских глайдеров (Силовой штурм)"
          }
        },
        singleScene: {
          id: "1",
          label: "Стартовый мастер-кадр",
          sceneTitle: "Изучение чертежей перед сияющим фасадом казино",
          prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nWide cinematic framing from slightly below: they stand on the polished roof of a hovering bronze sky-glider with twin side fins at night, overlooking a colossal floating casino-megacity rising from a sea of deep purple storm clouds. In his massive stone hands the golem unfurls a glowing aquamarine holographic blueprint of the building's corridors and vault levels; the display shows only glowing wireframe outlines and abstract geometric symbols, with no readable text or numbers. The little spirit hovers eagerly above the hologram, casting bright aquamarine light across the golem's smiling mossy face. Behind them the sky-casino blazes with golden columns, neon wheels, soaring spires and cascading waterfalls of golden light under a lightning-lit sky.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR bronze and marble materials, warm golden architectural glow contrasting with cool aquamarine plasma rim light, shallow depth of field, high detail, 16:9 widescreen.",
          discordCopy: "🎰 **ОГРАБЛЕНИЕ ВЕКА В STORM RUSH НАЧИНАЕТСЯ!** 🎰\n\nБанда смотрителей шторма, общий сбор!\nСегодня ночью Голем и Спарки вышли на позицию перед парящим в грозовых облаках казино **«Олимп Овердрайв»**! В его глубоких бронированных хранилищах спрятаны несметные сокровища и легендарное «Сердце Фортуны»! 💎💰\n\nПлан на руках, глайдер на исходной. \n\n⚡ **ВЫ УПРАВЛЯЕТЕ ОГРАБЛЕНИЕМ!**\nКаждый день комьюнити решает, какой тактический ход сделает команда. Дойдем до хранилища и вскроем его с промокодами на 7 день!\n\n**КАК ГОЛЕМ И СПАРКИ ПРОНИКНУТ ВНУТРЬ КАЗИНО «ОЛИМП ОВЕРДРАЙВ»?**\n🅰️ — Через крышу и вентиляционную шахту VIP-башни *(Скрытный путь)*\n🅱️ — Через нижний служебный причал инкассаторских глайдеров *(Силовой штурм)*\n\n*Ставь реакцию 🅰️ или 🅱️! Итоги подведем ровно через 24 часа.*"
        }
      },
      {
        day: 2,
        titleRu: "День 2: Проникновение в Первый Периметр",
        titleEn: "Day 2: Breaching the Outer Perimeter",
        act: "Акт 1: Прорыв охраны",
        isSingleScene: false,
        summary: "Герои преодолевают внешний рубеж безопасности и попадают в главный игорный сектор казино.",
        votingQuestion: "Как проходим через главный игровой зал?",
        branches: {
          A: {
            id: "2A",
            label: "Вентиляция VIP-зала",
            choiceText: "🅰️ Устроить мега-джекпот на слотах и увести охрану за золотом!",
            sceneTitle: "Спарки отключает лазерные датчики в вентиляции",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nLow crawling perspective along the duct: the golem creeps carefully through a wide brass ventilation conduit lined with polished rivets, peering down through an ornate golden floor grate with a cheerful excited grin. Across the path ahead stretches a delicate web of thin red security beams. The little spirit floats along them and lays a soft plasma filament against a sensor node, and the sensor light fades peacefully to a faint blue glimmer. Through the grate far below, the busy casino floor is visible with golden chandeliers, velvet gaming tables and drifting robot patrons in warm golden light; keep the table surfaces smooth and unmarked, with no readable text or numbers.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR brass and steel materials, thin red beam light crossing cool aquamarine plasma glow with volumetric dust motes, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔍 **ДЕНЬ 2: ВЕНТИЛЯЦИЯ VIP-ЗАЛА ПРОЙДЕНА!** 🔍\n\nСкрытный путь сработал филигранно! Спарки мягко отключил лазерные датчики, а Голем тихо прополз над головами охраны!\n\nМы проникли в центральный игорный зал. Здесь сотни столов, охрана и камеры.\n\n**КАК ПРОХОДИМ ЧЕРЕЗ ГЛАВНЫЙ ИГРОВОЙ ЗАЛ?**\n🅰️ — Устроить мега-джекпот на слотах и увести охрану за золотом!\n🅱️ — Спарки нырнет в гравитационные генераторы под полом и отключит гравитацию!\n\n*Голосуй реакцией прямо сейчас! 👇*"
          },
          B: {
            id: "2B",
            label: "Грузовой шлюз",
            choiceText: "🅱️ Спарки нырнет в гравитационные генераторы под полом и отключит гравитацию!",
            sceneTitle: "Голем поднимает грузовые ворота и плазменный свет Спарки",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nLow wide angle: at an industrial loading dock beneath the casino, the golem bends his knees and effortlessly lifts the bottom edge of a colossal steel cargo gate with both stone hands, smiling with pride as emerald energy pulses along his boulder arms. Above him a mechanical security camera on a swivel arm turns toward him, and the little spirit hovers directly in front of its lens, bathing the optical sensor in gentle diffuse aquamarine light that washes the view to pure white. Steam vents softly from floor grates across wet reflective metal, and warm golden light spills from beneath the rising gate.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR wet steel materials, soothing aquamarine plasma glow against warm golden light spilling from the gap, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💥 **ДЕНЬ 2: ГРУЗОВОЙ ШЛЮЗ ВЗЛОМАН!** 💥\n\nГолем играючи поднял многотонные стальные ворота, а Спарки залил камеры мягким светом!\n\nМы внутри главного зала казино! Впереди толпа игроков и охрана.\n\n**КАК ПРОХОДИМ ЧЕРЕЗ ГЛАВНЫЙ ИГРОВОЙ ЗАЛ?**\n🅰️ — Устроить мега-джекпот на слотах и увести охрану за золотом!\n🅱️ — Спарки нырнет в гравитационные генераторы под полом и отключит гравитацию!\n\n*Ставь реакцию! 🅰️ или 🅱️!*"
          }
        }
      },
      {
        day: 3,
        titleRu: "День 3: Хаос в Игорном Зале",
        titleEn: "Day 3: Mayhem on the Casino Floor",
        act: "Акт 2: Нарастание азарта",
        isSingleScene: false,
        summary: "Герои устраивают идеальную диверсию на глазах у публики и завладевают доступом к защищенной шахте сейфов.",
        votingQuestion: "Как спускаемся вниз к загадочному хранилищу?",
        branches: {
          A: {
            id: "3A",
            label: "Джекпот на слотах",
            choiceText: "🅰️ На крыше исполинского грузового лифта!",
            sceneTitle: "Фонтан золотых монет и джекпот на трехэтажном слоте",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nDynamic low angle inside the opulent main hall: the golem pulls the heavy gilded lever of a towering three-storey golden slot machine with a triumphant broad grin. Its giant reels stop on three glowing lightning-bolt icons and a roaring fountain of gold coins, holographic sparks and confetti pours across the red carpet. Keep every coin, bar and gem face completely smooth and blank, with no lettering or numbers, and keep the machine's cabinet panels decorated only with abstract emblems, with no readable text. The little spirit does a joyful barrel-roll above the cascade, while robot guards in golden armor scramble toward the spectacle, leaving the corridor behind them open.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR polished gold and red velvet materials, dazzling golden particle cascades in festive warm casino light, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💰 **ДЕНЬ 3: СУПЕР-ДЖЕКПОТ НА СЛОТАХ!** 💰\n\nТройная молния на барабанах! Из гигантского слота хлещет водопад золотых монет и фишек — охрана бросилась собирать золото, оставив вход в шахту без присмотра!\n\nГерои проскользнули к спуску в глубины Олимпа.\n\n**КАК СПУСКАЕМСЯ ВНИЗ К ЗАГАДОЧНОМУ ХРАНИЛИЩУ?**\n🅰️ — На крыше исполинского грузового лифта!\n🅱️ — Скользя вниз по гигантским силовым кабелям питания!\n\n*Голосуй реакцией! 👇*"
          },
          B: {
            id: "3B",
            label: "Гравитационный сбой",
            choiceText: "🅱️ Скользя вниз по гигантским силовым кабелям питания!",
            sceneTitle: "Невесомость в зале и спокойный Голем на полу",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nWide eye-level shot: a complete gravity failure lifts the whole opulent hall, and thousands of gold chips, playing cards, cocktail chalices and floating robot guards drift slowly upward toward the gilded ceiling in a swirling weightless blizzard. Keep every coin, chip and gem face completely smooth and blank, with no lettering or numbers, and keep the playing cards showing only plain abstract geometric backs. The golem is the only figure still planted on the red carpet under his own basalt weight, strolling casually across the floor with a cheerful grin and gently waving away a drifting silver platter. The little spirit peeks up from an open floor maintenance hatch with an amused smile.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR gold and velvet materials, warm chandelier light through rich atmospheric haze with cool aquamarine glow rising from the hatch, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌌 **ДЕНЬ 3: ГРАВИТАЦИОННЫЙ ХАОС!** 🌌\n\nСпарки отключил генераторы гравитации! Весь зал уплыл к потолку: карты, фишки, бокалы и роботы-охранники парят в воздухе в золотой метели!\n\nТолько Голем благодаря своему колоссальному весу остался на полу и спокойно дошел до служебной двери к шахте!\n\n**КАК СПУСКАЕМСЯ ВНИЗ К ЗАГАДОЧНОМУ ХРАНИЛИЩУ?**\n🅰️ — На крыше исполинского грузового лифта!\n🅱️ — Скользя вниз по гигантским силовым кабелям питания!\n\n*Ставь реакцию! 🅰️ или 🅱️!*"
          }
        }
      },
      {
        day: 4,
        titleRu: "День 4: 💥 Твист Недели — Реакторная Шахта Олимпа",
        titleEn: "Day 4: Mid-Week Twist: The Power Reactor Shaft",
        act: "Акт 2: Открытие тайны хранилища",
        isSingleScene: false,
        summary: "Спуск в глубины раскрывает тайну: хранилище — это реактор, питающий всё казино от легендарного «Сердца Фортуны»!",
        votingQuestion: "Как вскрываем супер-дверь Главного Хранилища «Титан-777»?",
        branches: {
          A: {
            id: "4A",
            label: "Крыша лифта",
            choiceText: "🅰️ Голем: титановый лом и гидравлика на золотых петлях!",
            sceneTitle: "Спуск на крыше грузового лифта среди золотых энерго-жил",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nDramatic vertical composition looking down the shaft: they stand together on the heavy circular metal roof of a colossal freight elevator descending steadily down a vast vertical shaft. The little spirit hovers out at the edge, casting a luminous aquamarine beacon along the walls and revealing that the shaft is lined with enormous pulsing golden energy veins as thick as ancient tree roots, all converging downward into the depths. Far below waits the monumental circular vault door of brushed titanium and gold filigree, set at the end of a wide marble antechamber. The golem leans forward against the safety rail, looking down with pure awe-struck wonder on his mossy face.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR steel and basalt materials, pulsing golden conduit light against deep atmospheric volumetric shadow, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚡ **ДЕНЬ 4: МЕГА-ТВИСТ! ЭТО НЕ СЕЙФ, А РЕАКТОР!** ⚡\n\nЛифт уходит в бездну! Спарки осветил шахту, и открылась правда: все золотые энерго-жилы казино сходятся в одну точку внизу! \n\nХранилище «Титан-777» — это не просто сейф, это энергетическое сердце «Олимпа», питающее весь парящий город! За дверью бьется легендарное «Сердце Фортуны»!\n\nЛифт доставил героев к исполинской круглой двери «Титан-777».\n\n**КАК ВСКРЫВАЕМ СУПЕР-ДВЕРЬ ГЛАВНОГО ХРАНИЛИЩА «ТИТАН-777»?**\n🅰️ — Голем: титановый лом и гидравлика на золотых петлях!\n🅱️ — Спарки: плазма внутрь кодового замка!\n\n*Голосуй прямо сейчас! 🔓*"
          },
          B: {
            id: "4B",
            label: "Спуск по кабелям",
            choiceText: "🅱️ Спарки: плазма внутрь кодового замка!",
            sceneTitle: "Спуск по силовым кабелям к сияющим вратам реактора",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nSteep downward perspective along the cables: inside the same deep vertical power shaft, the little spirit glides swiftly down a thick glowing conduit like a joyful spark of light, illuminating the vast metallic walls. Beside him the golem climbs down gracefully, gripping bundles of heavy insulated cables in his giant stone hands. Below them thousands of golden power lines weave together into a colossal glowing nexus around the monumental circular vault door of brushed titanium and gold filigree, set at the end of a wide marble antechamber, with warm radiant golden light spilling through the seams around it.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR insulated cable and steel materials, glowing golden and aquamarine cable light in moody industrial depth, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔌 **ДЕНЬ 4: ТАЙНА ЗОЛОТОГО РЕАКТОРА РАСКРЫТА!** 🔌\n\nСпуск по кабелям привел к главному открытию недели! Все силовые артерии казино сходятся прямо к двери «Титан-777»!\n\nВся энергия, все джекпоты и свет казино питаются от древнего «Сердца Фортуны» за этой дверью! Если его забрать — Олимп погаснет навсегда!\n\nГерои стоят у врат реактора.\n\n**КАК ВСКРЫВАЕМ СУПЕР-ДВЕРЬ ГЛАВНОГО ХРАНИЛИЩА «ТИТАН-777»?**\n🅰️ — Голем: титановый лом и гидравлика на золотых петлях!\n🅱️ — Спарки: плазма внутрь кодового замка!\n\n*Ставь реакцию 🅰️ или 🅱️! ⚡*"
          }
        }
      },
      {
        day: 5,
        titleRu: "День 5: Взлом Векового Сейфа «Титан-777»",
        titleEn: "Day 5: Cracking the Vault of the Gods",
        act: "Акт 3: Прорыв в сокровищницу",
        isSingleScene: false,
        summary: "Дверь главного хранилища поддается натиску героев и открывает доступ к несметным сокровищам казино!",
        votingQuestion: "Главный выбор недели: что забираем из сокровищницы?",
        branches: {
          A: {
            id: "5A",
            label: "Механический взлом",
            choiceText: "🅰️ Забрать мешок золота и оставить Олимп сиять и работать!",
            sceneTitle: "Голем проворачивает шестеренки замка под снопами золотых искр",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nMedium wide shot from the side: in the wide marble antechamber before the monumental circular vault door of brushed titanium and gold filigree, the golem plants his heavy feet and heaves a colossal bronze torque wrench, turning the giant central clockwork gear. His emerald cracks glow intensely as the vault mechanisms click and align smoothly into place, sending gentle golden sparks drifting across the marble floor and releasing soft plumes of white pneumatic steam. Overhead the little spirit twirls with excitement, casting aquamarine highlights onto the opening seams.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR brushed titanium and polished gold materials, volumetric steam plumes and drifting golden sparks under dramatic rim lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚙️ **ДЕНЬ 5: ВРАТА РЕАКТОРА РАСПАХНУЛИСЬ!** ⚙️\n\nСила Голема провернула вековые шестерни! С мягким щелчком и шипением пара исполинская дверь открылась!\n\nВнутри открывается ослепительный зал: горы золотых слитков по краям и парящее на центральном алтаре «Сердце Фортуны»!\n\n**ГЛАВНЫЙ ВЫБОР НЕДЕЛИ: ЧТО ЗАБИРАЕМ ИЗ СОКРОВИЩНИЦЫ?**\n🅰️ — Забрать мешок золота и оставить Олимп сиять и работать!\n🅱️ — Забрать священное «Сердце Фортуны», погасив казино и забрав всю энергию джекпотов!\n\n*Голосуй за судьбу казино! 👇*"
          },
          B: {
            id: "5B",
            label: "Плазменное размягчение",
            choiceText: "🅱️ Забрать священное «Сердце Фортуны», погасив казино и забрав всю энергию джекпотов!",
            sceneTitle: "Спарки размягчает замок плазмой и дверь распахивается",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nClose three-quarter framing on the lock: in the same wide marble antechamber before the monumental circular vault door of brushed titanium and gold filigree, the little spirit hovers right at the ornate keyhole and pours warm liquid plasma into the locking chamber, so the internal brass mechanism glows with gentle honey-gold warmth and softens smoothly. Beside him the golem watches in total delight, stone hands resting on his knees and a joyful expression of wonder on his face, as the heavy circular door disengages with a harmonious chime and begins to swing open onto warm golden light from within.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR brass and titanium materials, aquamarine plasma glow blending into warm golden light from the opening lock, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔥 **ДЕНЬ 5: ПЛАЗМА ОТКРЫЛА СЕРДЦЕ ХРАНИЛИЩА!** 🔥\n\nСпарки мягко размягчил ригели замка чистой плазмой! Дверь распахнулась, явив сияющую сокровищницу!\n\n**ГЛАВНЫЙ ВЫБОР НЕДЕЛИ: ЧТО ЗАБИРАЕМ ИЗ СОКРОВИЩНИЦЫ?**\n🅰️ — Забрать мешок золота и оставить Олимп сиять и работать!\n🅱️ — Забрать священное «Сердце Фортуны», погасив казино и забрав всю энергию джекпотов!\n\n*Ставь реакцию! 🅰️ или 🅱️!*"
          }
        }
      },
      {
        day: 6,
        titleRu: "День 6: В Сердце Золотой Цитадели",
        titleEn: "Day 6: The Golden Loot of the Gods",
        act: "Акт 4: Сбор супер-куша",
        isSingleScene: false,
        summary: "Герои внутри сокровищницы собирают величайший куш в истории Storm Rush и готовят финальный отход.",
        votingQuestion: "План финального триумфального побега из казино «Олимп Овердрайв»?",
        branches: {
          A: {
            id: "6A",
            label: "Гора золота",
            choiceText: "🅰️ Угон скоростного золотого VIP-глайдера богов на закате!",
            sceneTitle: "Голем на горе золота набивает мешок сокровищ",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nWide eye-level shot inside the boundless treasure vault: the golem sits happily cross-legged atop a literal mountain of gleaming gold coins, solid bullion bars and overflowing chests of iridescent gems. Keep every coin, bar and gem face completely smooth and blank, with no lettering or numbers. He holds open a massive burlap loot sack, chuckling with delight as he scoops up armfuls of glittering treasure, while far behind him a colossal octahedral diamond pulsing with golden and aquamarine energy hovers undisturbed above a white marble pedestal carved with lightning motifs. The little spirit rests atop a neat stack of bars, wearing a playful little crown of glowing plasma sparks.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR polished gold and gemstone materials, dazzling specular highlights across the hoard in warm radiant vault glow, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💰 **ДЕНЬ 6: ЗОЛОТОЙ КУШ СОБРАН!** 💰\n\nМы выбрали благородный путь: мешки набиты золотом до краев, а Олимп продолжает сиять в небесах!\n\nПора уходить!\n\n**ПЛАН ФИНАЛЬНОГО ТРИУМФАЛЬНОГО ПОБЕГА ИЗ КАЗИНО «ОЛИМП ОВЕРДРАЙВ»?**\n🅰️ — Угон скоростного золотого VIP-глайдера богов на закате!\n🅱️ — Парашютный прыжок в ночной шторм прямо сквозь облака!\n\n*Голосуй за финал! ⚡*"
          },
          B: {
            id: "6B",
            label: "Сердце Фортуны",
            choiceText: "🅱️ Парашютный прыжок в ночной шторм прямо сквозь облака!",
            sceneTitle: "Спарки бережно обнимает кристалл Сердце Фортуны",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nEpic low angle looking up at the pedestal: at the heart of the main vault chamber, a colossal octahedral diamond pulsing with golden and aquamarine energy hovers above a white marble pedestal carved with lightning motifs. The little spirit wraps his plasma body warmly around the radiant crystal, and it hums harmoniously, throwing cascading auroras of aquamarine and gold starlight across the vaulted ceiling. In front of the pedestal the golem throws both massive stone arms high in a triumphant victory cheer, his mossy face lit with pure joy.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR polished marble and refractive diamond materials, spectacular volumetric light shafts of aquamarine and gold, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💎 **ДЕНЬ 6: СЕРДЦЕ ФОРТУНЫ В НАШИХ РУКАХ!** 💎\n\nМы забрали сам источник удачи! Кристалл освещает все вокруг бирюзово-золотым сиянием!\n\nВремя уходить на полной скорости!\n\n**ПЛАН ФИНАЛЬНОГО ТРИУМФАЛЬНОГО ПОБЕГА ИЗ КАЗИНО «ОЛИМП ОВЕРДРАЙВ»?**\n🅰️ — Угон скоростного золотого VIP-глайдера богов на закате!\n🅱️ — Парашютный прыжок в ночной шторм прямо сквозь облака!\n\n*Ставь реакцию! 🅰️ или 🅱️!*"
          }
        }
      },
      {
        day: 7,
        titleRu: "День 7: 🏆 Великий Побег и Раздача Наград (Финал)",
        titleEn: "Day 7: The Grand Escape & Community Rewards",
        act: "Акт 5: Триумф и раздача наград",
        isSingleScene: false,
        summary: "Ограбление века завершено триумфом! Голем и Спарки ускользают с сокровищами и открывают победные промокоды для игроков.",
        votingQuestion: "Победа! Забирай свой победный промокод недели!",
        branches: {
          A: {
            id: "7A",
            label: "Побег на глайдере",
            choiceText: "🅰️ Скоростной полет на глайдере в лучах заката",
            sceneTitle: "Голем за штурвалом золотого глайдера салютует на закате",
            promoCode: "HEIST777WIN",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nWide cinematic three-quarter view: soaring through a breathtaking twilight sky above a sea of purple and gold storm clouds, the golem sits at the polished wooden helm of a stolen open-air golden VIP sky-glider, raising one massive stone hand in a wide exuberant salute. The cargo deck behind him is piled high with their haul from the vault, one glowing bundle lashed securely on top; keep every visible coin, bar and gem face completely smooth and blank, with no lettering or numbers. Riding the wind on the polished prow, the little spirit leaves a trailing streamer of cheerful sparks. Far behind, the casino towers light up with blossoming fountains of golden and emerald fireworks.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR polished brass and varnished wood materials, warm golden sunset light against deep purple cloud shadow with blossoming firework glow, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎉 **ДЕНЬ 7: ОГРАБЛЕНИЕ ВЕКА ЗАВЕРШЕНО! ПОБЕДА!** 🎉\n\nМы сделали это! Казино «Олимп Овердрайв» покорено, добыча упакована, а Голем и Спарки мчат на золотом глайдере навстречу закату среди распускающихся салютов!\n\nКаждый участник квеста получает победный промокод недели:\n\n🎁 **ПРОМОКОД:** `HEIST777WIN`\n\n*Активируй в личном кабинете и забирай свой законный супер-куш! Спасибо за участие в ограблении века! 🚀💎*"
          },
          B: {
            id: "7B",
            label: "Прыжок в шторм",
            choiceText: "🅱️ Полет на светящемся парашюте над городом",
            sceneTitle: "Голем с сундуком сокровищ на светящемся парашюте над ночным городом",
            promoCode: "OLYMPUS999",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nWide shot from slightly above: gliding gracefully down through the cool night sky, the golem descends beneath a colossal glowing parachute woven from shimmering golden silk and crackling aquamarine plasma lines. In one giant stone arm he securely cradles their haul from the vault — an iron-banded chest with a glowing bundle lashed on top, a few coins spilling into the wind; keep every coin, bar and gem face completely smooth and blank, with no lettering or numbers. He waves enthusiastically with his other stone hand. The little spirit dances in joyful spirals around the parachute cords, showering bright aquamarine sparks over the illuminated city far below.\n\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR golden silk and iron materials, radiant aquamarine and golden parachute glow against deep purple night sky, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌌 **ДЕНЬ 7: ТРИУМФАЛЬНЫЙ ПОЛЕТ И ЗОЛОТОЙ ДОЖДЬ!** 🌌\n\nГолем и Спарки парят на парашюте из чистых молний над ночным городом, осыпая игроков золотом и искрами удачи!\n\nФинальная награда для всех участников операции:\n\n🎁 **ПРОМОКОД:** `OLYMPUS999`\n\n*Вводи промокод на сайте и крути слоты с мега-множителем! До встречи в следующей главе приключений Storm Rush! ⚡🏆*"
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
