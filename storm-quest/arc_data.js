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
            choiceText: "🅰️ Через крышу и вентиляционную шахту VIP-небоскреба (Скрытный путь)"
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
          prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThey stand on the polished roof of a hovering bronze sky-glider at night, overlooking the breathtaking floating casino-megacity Olympus Overdrive rising from a sea of deep purple storm clouds. In his massive mossy stone paws, the golem carefully unfurls a glowing cyan holographic blueprint showing abstract architectural layouts and vault cross-sections; the blueprint shows only glowing wireframe corridors and geometric symbols, with no readable text. The little aquamarine plasma spirit Sparky hovers eagerly above the hologram, casting bright cyan light across the golem's happy smiling stone face. In the background, the colossal sky-casino blazes with golden neoclassical columns, neon roulettes, soaring spires, and cascading waterfalls of glowing golden light under a lightning-lit night sky.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy PBR bronze and marble materials, warm golden architectural glow contrasting with cool aquamarine plasma rim light, cinematic wide-angle composition, shallow depth of field, high detail, 16:9 widescreen.",
          discordCopy: "🎰 **ОГРАБЛЕНИЕ ВЕКА В STORM RUSH НАЧИНАЕТСЯ!** 🎰\n\nБанда смотрителей шторма, общий сбор!\nСегодня ночью Голем и Спарки вышли на позицию перед парящим в облаках мегаполисом-казино **«Олимп Овердрайв»**! В его подземных бронированных сейфах хранятся несметные горы золота, фишек и легендарное «Сердце Фортуны»! 💎💰\n\nПлан составлен, глайдер на исходной. \n\n⚡ **ВЫ УПРАВЛЯЕТЕ ОГРАБЛЕНИЕМ!**\nКаждый день комьюнити решает, какой тактический шаг сделает наша команда. Дойдем до хранилища и вскроем сейф с супер-промокодами на 7 день!\n\n**КАК ПРОНИКАЕМ В КАЗИНО?**\n🅰️ — Через крышу и вентиляционную шахту VIP-башни (Скрытно режем лазеры)!\n🅱️ — Через нижний грузовой шлюз инкассаторов (Силовой взлом гермоворот)!\n\n*Ставь реакцию 🅰️ или 🅱️! Ровно через 24 часа вскрываем первый рубеж!*"
        }
      },
      {
        day: 2,
        titleRu: "День 2: Проникновение в Первый Периметр",
        titleEn: "Day 2: Breaching the Outer Perimeter",
        act: "Акт 1: Прорыв охраны",
        isSingleScene: false,
        summary: "Герои преодолевают внешний рубеж безопасности и попадают в главный игорный сектор казино.",
        votingQuestion: "Как Голем и Спарки пройдут через главный игровой зал?",
        branches: {
          A: {
            id: "2A",
            label: "Вентиляция VIP-зала",
            choiceText: "🅰️ Устроить мега-джекпот на слот-автоматах для отвлечения охраны",
            sceneTitle: "Спарки перерезает лазерные датчики в вентиляции",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nThe golem crawls carefully through a wide brass ventilation conduit lined with polished rivets, peering downwards through an ornate golden floor grate with a cheerful excited grin. Above the grate, a crisscrossing web of glowing red security laser beams blocks the path. The tiny aquamarine spirit Sparky floats delicately between the beams, extending a needle-thin plasma tendril that snipping-cuts through a laser relay node with a tiny burst of electric sparks. Below the grate, the bustling VIP casino floor is visible with glowing golden chandeliers, roulette tables, and floating robot patrons in the warm golden light.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy reflective brass tunnel walls, vibrant red laser beams contrasting with aquamarine plasma glow, volumetric dust motes, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔍 **ДЕНЬ 2: ВЕНТИЛЯЦИЯ VIP-ЗАЛА ПРОЙДЕНА!** 🔍\n\nСкрытный путь сработал идеально! Спарки ювелирно перерезал лазерные датчики плазменным хвостиком, а Голем тихо прополз прямо над головами охраны!\n\nМы проникли в центральный игорный зал. Здесь сотни столов, охрана и камеры. **Как отвлекаем внимание, чтобы добраться до лифта сейфов?**\n\n🅰️ — Голем дернет рычаг гигантского слота «Громовой Зевс» и устроит взрывной джекпот!\n🅱️ — Спарки подсядет за VIP-стол с костями и сорвет банк двойной молнией, пока Голем крадет ключ-карту!\n\nГолосуй реакцией прямо сейчас! 👇"
          },
          B: {
            id: "2B",
            label: "Грузовой шлюз",
            choiceText: "🅱️ Сыграть ва-банк за столом костей и украсть ключ-карту",
            sceneTitle: "Голем поднимает броневорота и плазменная вспышка Спарки",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nAt a heavily armored industrial loading dock under the casino, the massive mossy golem bends his knees and effortlessly lifts the bottom of a colossal steel blast door with his giant stone hands, smiling with pride as emerald energy pulses along his boulder arms. Above him, a mechanical security camera turret swivels into position, but the tiny aquamarine plasma spirit Sparky bursts into a dazzling, harmless flash of bright teal light right in front of its optical lens, completely blinding its sensor with electric ripples. Steam gently vents from floor grates onto the wet reflective metal floor as golden light spills from beneath the opening gate.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy wet steel reflections, brilliant burst of aquamarine plasma flash lighting up the industrial bay, cinematic lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💥 **ДЕНЬ 2: ГРУЗОВОЙ ШЛЮЗ ВЗЛОМАН СИЛОЙ!** 💥\n\nГолем играючи приподнял многотонную титановую гермодверь, а Спарки ослепил камеры яркой вспышкой плазмы!\n\nМы внутри главного зала казино! Впереди толпа игроков и охрана. **Как прорываемся к лифту хранилища?**\n\n🅰️ — Голем сорвет джекпот на слоте «Громовой Зевс» — золотой дождь отвлечет всю охрану!\n🅱️ — Спарки сыграет в светящиеся кости за хайроллер-столом и под шумок стянет ключ-карту крупье!\n\nСтавь реакцию! 🅰️ или 🅱️!"
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
        votingQuestion: "Как герои преодолеют Зал Невесомости и Спящего Золотого Стража?",
        branches: {
          A: {
            id: "3A",
            label: "Джекпот на слотах",
            choiceText: "🅰️ Невесомый трюк Индианы Джонса: ювелирно подменить ключ на лапе стража",
            sceneTitle: "Фонтан золотых монет и джекпот на трехэтажном слоте",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nInside the opulent main casino hall, the stone golem pulls the heavy gilded lever of a towering three-story golden slot machine with a triumphant broad grin. The slot machine's giant reels stop on three glowing lightning bolt icons, triggering a massive jackpot explosion of shining golden coins, holographic sparks, and confetti that showers down across the red carpet. The little aquamarine spirit Sparky does a joyful barrel-roll mid-air above the cascading coins. In the background, robotic security guards in golden armor frantically scramble toward the spectacle, leaving the secure vault elevators unguarded.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy polished gold and red velvet materials, dazzling golden jackpot particle effects, festive warm casino lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💰 **ДЕНЬ 3: СУПЕР-ДЖЕКПОТ НА СЛОТАХ! ОХРАНА В ШОКЕ!** 💰\n\nДвойной Зевс и тройная молния! Голем сорвал легендарный джекпот на гигантском слоте — зал засыпало миллионами золотых монет и фишек!\n\nПока роботы-охранники пытаются удержать ликующую толпу, Голем и Спарки проскользнули в скоростной лифт Хранилища. Но на входе в шахту отключилась гравитация, а проход охраняет спящий золотой робот-сфинкс!\n\n**КАК ПРОХОДИМ СТРАЖА В НЕВЕСОМОСТИ?**\n🅰️ — Трюк Индианы Джонса: Голем зависнет в невесомости и подменит золотой ключ на мешочек с кристаллами!\n🅱️ — Зеркальный лабиринт: Спарки золотым зеркальцем перенаправит лазерный луч прямо в сенсор сна стража!\n\nГолосуй реакцией! 👇"
          },
          B: {
            id: "3B",
            label: "Игра в кости за VIP-столом",
            choiceText: "🅱️ Зеркальный маневр: перенаправить лазеры зеркальцем и усыпить сигнализацию",
            sceneTitle: "Спарки бросает золотые кости с молниями и кража ключ-карты",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nAt an elegant high-roller craps table of emerald velvet with polished mahogany borders, the little aquamarine plasma spirit Sparky floats above the table, juggling two glowing golden dice that tumble and land showing glowing double lightning-bolt pips. Fancy mechanical robot patrons in tuxedo chassis cheer and raise crystal glasses in celebration. Standing behind the crowd, the giant stone golem leans in with a sly wink and carefully uses two huge boulder fingertips to slide a glowing golden keycard right off the distracted dealer's utility belt.\n\nStylized 3D character render, soft subsurface moss and stone shading, luxurious emerald felt and polished mahogany textures, warm chandelier bokeh, glowing dice light trails, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎲 **ДЕНЬ 3: СВЕРХУДАЧА ЗА СТОЛОМ КОСТЕЙ! КЛЮЧ-КАРТА У НАС!** 🎲\n\nСпарки выбросил две золотые молнии на глазах у потрясенных VIP-роботов, сорвав аплодисменты зала! А Голем двумя пальцами ловко вытащил мастер-карту у крупье!\n\nГерои спустились к главному уровню сейфа, но тут включилась гравитационная ловушка: монеты парят в воздухе, а вход стережет спящий механический сфинкс!\n\n**КАК ПРОХОДИМ СЕЙФ В НЕВЕСОМОСТИ?**\n🅰️ — Трюк Индианы Джонса: Голем плавно подплывет в невесомости и подменит ключ на поясе стража!\n🅱️ — Зеркальный лабиринт: Спарки золотым зеркальцем перенаправит охранный луч прямо в сенсор глубокого сна!\n\nСтавь реакцию! 🅰️ или 🅱️!"
          }
        }
      },
      {
        day: 4,
        titleRu: "День 4: 💥 Твист Недели — Зал Невесомости и Спящий Страж",
        titleEn: "Day 4: Mid-Week Twist: Zero-G Anomaly & The Sleeping Sentinel",
        act: "Акт 2: Кульминация инфильтрации",
        isSingleScene: false,
        summary: "Гравитация исчезает, монеты и лазеры парят в воздухе, а у самого входа в сейф спит золотой робот-страж с главным ключом!",
        votingQuestion: "Как Голем и Спарки вскроют титановую супер-дверь Главного Хранилища «Титан-777»?",
        branches: {
          A: {
            id: "4A",
            label: "Невесомый Индиана Джонс",
            choiceText: "🅰️ Голем применит гигантский разводной ключ на центральной золотой шестеренке сейфа",
            sceneTitle: "Голем парит в невесомости и подменяет ключ на лапе спящего сфинкса",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nInside a grand zero-gravity vault antechamber, the massive mossy stone golem floats horizontally in mid-air in slow motion, biting his lip with an amused, tense grin. Below him sleeps a colossal mechanical sphinx-lion crafted from polished gold and dark basalt, curled up on a stone platform with soft steam rising from its brass nostrils. Floating upside down above the beast, the golem gingerly swaps an ornate heavy golden key hanging from the lion's mechanical collar with a small burlap pouch of glowing green crystals, perfectly balancing the weight. Hundreds of shiny gold coins and loose gems drift weightlessly in the air around them.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy polished gold and brass reflections, zero-gravity floating coin physics, soft ambient blue and gold lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎭 **ДЕНЬ 4: ЮВЕЛИРНАЯ РАБОТА В НЕВЕСОМОСТИ!** 🎭\n\nКакой трюк! Голем завис вниз головой в невесомости и ювелирно заменил тяжеленный золотой ключ на мешочек с кристаллами — спящий сфинкс даже не пошевелился!\n\nКлюч в руках, и герои подлетают к исполинской круглой двери Главного Сейфа **«Титан-777»** из титана и золота!\n\n**КАК ВСКРЫВАЕМ СУПЕР-СЕЙФ?**\n🅰️ — Силовой метод: Голем применит гигантский бронзовый ключ-рычаг и провернет шестеренки силой!\n🅱️ — Высокоточная плазма: Спарки сконцентрирует плазменный луч в замочную скважину и расплавит внутренние ригели!\n\nГолосуй прямо сейчас! ⚡"
          },
          B: {
            id: "4B",
            label: "Зеркальный лабиринт",
            choiceText: "🅱️ Спарки прожжет внутренние ригели замка сфокусированным плазменным лазером",
            sceneTitle: "Спарки отражает лазер зеркальцем и усыпляет сигнализацию",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nIn the weightless zero-gravity vault antechamber where golden coins and ornate clockwork gears drift freely in mid-air, the little aquamarine plasma spirit Sparky floats with agile grace between glowing red security lasers. Using a small polished golden hand-mirror held in his wispy plasma tendrils, Sparky cleverly reflects a master laser beam into an optical prism mounted on the sleeping golden sphinx's chest plate, causing the security panel to blink a tranquil cyan override. Nearby, the stone golem floats effortlessly through the newly opened laser-free safe corridor, giving Sparky a celebratory thumbs-up.\n\nStylized 3D character render, soft subsurface moss and stone shading, radiant crimson and cyan laser light rays reflecting through brass prisms, floating dust motes and drifting golden tokens, dramatic high-contrast lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🪞 **ДЕНЬ 4: ЗЕРКАЛЬНАЯ МАГИЯ СПАРКИ! ПУТЬ ЧИСТ!** 🪞\n\nСпарки мастерски направил лазерный луч прямо в сенсор сфинкса — сигнализация перешла в режим глубокого сна, а защитное поле отключилось!\n\nГерои стоят перед исполинской дверью главного сейфа **«Титан-777»**!\n\n**КАК ВСКРЫВАЕМ ВЕКОВОЙ ЗАМОК?**\n🅰️ — Механический рычаг: Голем провернет центральную шестерню гигантским ключом-молотом!\n🅱️ — Плазменная резка: Спарки пустит лазерный луч в скважину и превратит внутренние штифты в расплавленное золото!\n\nСтавь реакцию 🅰️ или 🅱️! 🔒"
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
        votingQuestion: "Что Голем и Спарки заберут из сокровищницы первым?",
        branches: {
          A: {
            id: "5A",
            label: "Механический взлом",
            choiceText: "🅰️ Зачерпнуть огромный мешок золотых слитков, кубков и драгоценностей",
            sceneTitle: "Голем проворачивает шестеренки замка под снопами искр",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nBefore the towering circular vault door of reinforced titanium and gold filigree, the massive mossy stone golem plants his heavy feet on the marble floor and heaves a colossal bronze torque wrench, turning a giant central clockwork gear. His emerald body cracks glow intensely with raw power as the giant vault mechanisms click and clunk into place, sending bright yellow sparks showering across the floor and releasing clouds of white pneumatic steam. Overhead, the little aquamarine spirit Sparky twirls with excitement, casting cyan highlights onto the opening vault seams.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy brushed titanium and polished gold materials, volumetric steam plumes and flying industrial sparks, dramatic rim lighting, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "⚙️ **ДЕНЬ 5: ЗАМОК СДАЛСЯ! СЕЙФ ОТКРЫВАЕТСЯ!** ⚙️\n\nМощь Голема сломала вековые стопоры! Снопы искр, шипение пара — и многотонная круглая дверь начинает медленно распахиваться!\n\nВнутри открывается ослепительное сияние золота и кристаллов!\n\n**ЧТО ЗАБИРАЕМ ПЕРВЫМ?**\n🅰️ — Нагрести гигантский мешок золотых слитков, сплошных алмазов и драгоценных кубков!\n🅱️ — Забрать с постамента легендарное «Сердце Фортуны» — гигантский космический кристалл бесконечных выигрышей!\n\nГолосуй за сокровища! 👇"
          },
          B: {
            id: "5B",
            label: "Плазменная резка",
            choiceText: "🅱️ Забрать священный кристалл «Сердце Фортуны» с центрального постамента",
            sceneTitle: "Спарки прожигает замок плазмой и дверь распахивается",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nHovering right at the keyhole of the colossal titanium vault door, the tiny aquamarine plasma spirit Sparky focuses his entire energy into a blinding, razor-sharp plasma cutting beam, melting through the ancient internal locking pins in a brilliant swirl of turquoise light and molten golden droplets. Beside him, the giant stone golem watches in total awe with his hands on his knees, his jaw dropped in a joyful expression of wonder, as the heavy circular vault door disengages with a deep metallic echo and begins to creak open, revealing warm golden light from within.\n\nStylized 3D character render, soft subsurface moss and stone shading, brilliant aquamarine welding light illuminating the dark metallic corridor, glowing orange molten metal effects, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🔥 **ДЕНЬ 5: ПЛАЗМЕННЫЙ ВЗЛОМ! ДВЕРИ РАСПАХНУТЫ!** 🔥\n\nСпарки ювелирно расплавил штифты замка чистой плазмой! Тяжелая дверь сейфа дрогнула и раскрылась, явив сияющую сокровищницу богов!\n\n**ЧТО ВЫНОСИМ ИЗ ХРАНИЛИЩА?**\n🅰️ — Набиваем огромный брезентовый мешок золотыми слитками и драгоценностями!\n🅱️ — Забираем парящее на алтаре «Сердце Фортуны» — кристалл бесконечных джекпотов!\n\nВыбирай куш! 🅰️ или 🅱️!"
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
            choiceText: "🅰️ Угон скоростного золотого глайдера богов прямо со взлетной площадки на закате",
            sceneTitle: "Голем на горе золотых монет набивает мешок сокровищ",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nInside the boundless high-security treasure vault, the massive stone golem sits happily cross-legged atop a literal mountain of gleaming gold coins, solid gold bullion bars, and overflowing chests of iridescent gems. He holds open a massive burlap loot sack, chuckling with sheer delight as he scoops up armfuls of glittering golden artifacts. Above him, the tiny aquamarine plasma spirit Sparky rests atop a neat stack of golden bars, sporting a playful little crown fashioned from glowing plasma sparks and smiling proudly.\n\nStylized 3D character render, soft subsurface moss and stone shading, dazzling specular highlights off thousands of gold coins and polished gems, warm radiant ambient glow filling the grand vault chamber, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💰 **ДЕНЬ 6: ГОРА ЗОЛОТА И АБСОЛЮТНЫЙ КУШ!** 💰\n\nМы внутри главной сокровищницы! Голем нагреб полный мешок золота, а Спарки сияет с золотой короной на голове!\n\nОстался финальный шаг — красивый триумфальный побег! **Как уходим из казино?**\n\n🅰️ — Угон скоростного золотого VIP-глайдера богов на закате!\n🅱️ — Парашютный прыжок в ночной шторм прямо сквозь облака!\n\nГолосуй за финал! ⚡"
          },
          B: {
            id: "6B",
            label: "Сердце Фортуны",
            choiceText: "🅱️ Парашютный прыжок в ночной шторм на крыльях из молний",
            sceneTitle: "Спарки обнимает парящий Кристалл Фортуны под ликование Голема",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nAt the heart of the sacred vault chamber, atop an illuminated white marble pedestal carved with lightning motifs, hovers the legendary Heart of Fortune crystal — a colossal octahedral diamond pulsing with intense golden and turquoise plasma energy. The little spirit Sparky wraps himself warmly around the radiant crystal, causing it to hum harmoniously and emit cascading auroras of cyan and gold starlight across the vaulted ceiling. In front of the pedestal, the giant stone golem throws both massive arms high into the air in a triumphant victory roar, his face lit by pure joy.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy polished marble and refractive diamond materials, spectacular volumetric god-rays of cyan and golden light, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "💎 **ДЕНЬ 6: СЕРДЦЕ ФОРТУНЫ ЗАХВАЧЕНО!** 💎\n\nВеличайшая реликвия казино в наших руках! Кристалл Фортуны освещает все вокруг бирюзово-золотым сиянием удачи!\n\nВремя покидать Олимп! **Какой план побега выбираем на финал?**\n\n🅰️ — Угон скоростного золотого глайдера богов на закате!\n🅱️ — Парашютный прыжок в шторм на парашюте из чистых молний!\n\nСтавь реакцию! 🅰️ или 🅱️!"
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
            sceneTitle: "Голем за штурвалом золотого глайдера на закате с мешком золота",
            promoCode: "HEIST777WIN",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nSoaring through a breathtaking twilight sky above a sea of violet and gold storm clouds, the stone golem sits at the polished wooden steering helm of an open-air golden sky-glider, giving an exuberant peace-sign salute with a massive stone hand. The glider's cargo deck behind him is piled high with bursting burlap sacks of gold bullion and shining gems. Riding the wind on the glider's polished prow, the tiny aquamarine spirit Sparky leaves a trailing streamer of cheerful sparks. In the distant background, the Olympus casino towers celebrate with majestic fountains of golden and emerald fireworks.\n\nStylized 3D character render, soft subsurface moss and stone shading, glossy polished brass and varnished wood textures, vibrant sunset hues of magenta, gold, and deep blue, dazzling fireworks lighting the sky, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🎉 **ДЕНЬ 7: ОГРАБЛЕНИЕ ВЕКА ЗАВЕРШЕНО! ПОБЕДА!** 🎉\n\nМы сделали это! Казино «Олимп Овердрайв» покорено, сундуки набиты золотом, а Голем и Спарки мчат на золотом глайдере навстречу закату!\n\nКаждый участник квеста получает победный промокод недели:\n\n🎁 **ПРОМОКОД:** `HEIST777WIN`\n\nАктивируй в личном кабинете и забирай свой законный супер-куш! Спасибо за участие в ограблении века! 🚀💎"
          },
          B: {
            id: "7B",
            label: "Прыжок в шторм",
            choiceText: "🅱️ Полет на светящемся парашюте над городом",
            sceneTitle: "Голем с сундуком сокровищ на парашюте из молний над ночным городом",
            promoCode: "OLYMPUS999",
            prompt: "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\n\nGliding gracefully down through the cool nocturnal night sky, the stone golem descends suspended beneath a colossal glowing parachute woven from shimmering golden silk and crackling cyan plasma lines. With one giant stone arm he securely cradles a massive iron-banded treasure chest spilling radiant golden coins and glowing artifacts into the wind, while waving enthusiastically with his other paw. The tiny spirit Sparky dances joyously in spirals around the parachute cords, casting a shower of bright aquamarine sparks over the panoramic view of the illuminated city below.\n\nStylized 3D character render, soft subsurface moss and stone shading, radiant glowing parachute canopy casting vibrant cyan-gold light, rich nocturnal atmospheric haze with scattered twinkling city lights below, shallow depth of field, high detail, 16:9 widescreen.",
            discordCopy: "🌌 **ДЕНЬ 7: ТРИУМФАЛЬНЫЙ ПОЛЕТ И ЗОЛОТОЙ ДОЖДЬ!** 🌌\n\nГолем и Спарки парят на парашюте из чистых молний над ночным городом, осыпая игроков золотом и бриллиантами!\n\nФинальная награда для всех участников операции:\n\n🎁 **ПРОМОКОД:** `OLYMPUS999`\n\nВводи промокод на сайте и крути слоты с мега-множителем! До встречи в следующей главе приключений Storm Rush! ⚡🏆"
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
