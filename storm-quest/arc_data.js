/**
 * Storm Rush Quest Arc Data: "The Stolen Crown of Storms" (Похищенная Корона Гроз)
 * 7 Days, 13 Scenes (1 Master Kickoff + 12 Branching Scenes).
 * Consistent Character DNA (Golem & Sparky), Crown Anchor, Strict Stop-Word Filter,
 * and 100% Continuous Discord Voting Chains.
 * Source prompts: Prompts/storm-quest-prompts/prompts/*.txt
 */

const ARC_METADATA = {
  "title": "The Stolen Crown of Storms",
  "titleRu": "Похищенная Корона Гроз",
  "character": "Golem & Sparky (Каменный Исполин и Плазменный Дух)",
  "brand": "Storm Rush (STR)",
  "duration": "7 Days (Interactive Discord Event)",
  "outfit": "Mossy Dark Basalt Colossus + Aquamarine Plasma Spirit",
  "referenceImage": "assets/Golem_and_Sparky.jpg",
  "aspectRatio": "16:9",
  "renderEngine": "Google Flow / Gemini Nano Banana 2"
};

const CHARACTER_DNA = {
  "name": "Golem & Sparky",
  "role": "Guardians of the Storm Sanctuary",
  "species": "Ancient Mossy Stone Colossus & Formless Aquamarine Plasma Spirit",
  "appearance": "Golem: massive dark green boulders, mossy crevices, bright glowing emerald cracks, narrow glowing eyes, wide glowing smile. Sparky: tiny formless floating spirit of glowing aquamarine plasma, two dark dot eyes, little smile, soft plasma tendrils, no arms, no legs, size of golem's hand",
  "attire": "Natural elemental forms — heavy mossy weathered basalt and pure aquamarine plasma",
  "personality": "Golem is calm, gentle, protective and immensely strong. Sparky is swift, curious, loyal and always hovers"
};

const QUEST_DAYS = [
  {
    "day": 1,
    "titleRu": "День 1: Пустой Постамент в Святилище (Старт)",
    "titleEn": "Day 1: Empty Altar in the Storm Sanctuary (Kickoff)",
    "act": "Акт 1: Завязка тайны",
    "isSingleScene": true,
    "summary": "Утром Голем и Спарки обнаруживают, что священная Корона Гроз исчезла с алтаря! Каменный постамент расколот, по мшистым корням тянутся мерцающие бирюзовые капли.",
    "votingQuestion": "Куда Голему и Спарки отправиться по первому следу?",
    "votingOptions": {
      "A": {
        "label": "Кристальные Гроты",
        "choiceText": "🅰️ Спуститься по следу заряженной воды в затопленные Кристальные Гроты"
      },
      "B": {
        "label": "Базальтовые Шахты",
        "choiceText": "🅱️ Идти по следу расколотых валунов в подземные Базальтовые Шахты"
      }
    },
    "singleScene": {
      "id": "1",
      "label": "Стартовый мастер-кадр",
      "sceneTitle": "Тревога перед пустым алтарем",
      "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThey stand in an ancient open-air stone sanctuary among mossy monoliths and towering trees carved with abstract glyph shapes. In the centre a cracked basalt pedestal sits empty, only fading blue sparks hovering where the storm crown used to rest. The golem leans forward with gentle worry, one huge hand resting on the fractured altar. The little spirit hovers just above the stone, lighting a trail of glowing aquamarine droplets that leads away toward the dark trees.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, night forest fog, warm fireflies against cool aquamarine light, shallow depth of field, high detail, 16:9 widescreen.",
      "discordCopy": "⚡ **ТРЕВОГА В СВЯТИЛИЩЕ STORM RUSH! КОРОНА ГРОЗ ИСЧЕЗЛА!** ⚡\n\nСмотрители бури, у нас чрезвычайное происшествие!\nСегодня на рассвете Голем и Спарки пришли к Древу Гроз, но каменный постамент расколот, а легендарная **Корона Гроз** бесследно пропала! Без неё энергия джекпотов StormRush заблокирована! 😱\n\nНа мшистых плитах остались сверкающие бирюзовые следы, уходящие в чащу. \n\n⚡ **С ЭТОГО МОМЕНТА ВЫ ВЕДЕТЕ РАССЛЕДОВАНИЕ!**\nКаждый день ваши реакции в голосовании решают, по какому пути пойдут Голем и Спарки. В конце недели всех участников ждёт мега-джекпот и секретный промокод!\n\n**КУДА ОТПРАВИТЬСЯ ГЕРОЯМ?**\n🅰️ — Спуститься по следу заряженной воды в затопленные Кристальные Гроты!\n🅱️ — Идти по следу расколотых камней в древние Базальтовые Шахты!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже! Итоги подведем ровно через 24 часа.*"
    }
  },
  {
    "day": 2,
    "titleRu": "День 2: Первый след сквозь стихию",
    "titleEn": "Day 2: Tracking the Elemental Trail",
    "act": "Акт 2: Поиски и преодоление",
    "isSingleScene": false,
    "summary": "Герои идут по следам похитителя, выходя к непреодолимой грозовой пропасти.",
    "votingQuestion": "Как перебраться через грозовую пропасть с водопадом?",
    "votingOptions": {
      "A": {
        "label": "Мост Голема",
        "choiceText": "🅰️ Голем строит мост из гигантских валунов"
      },
      "B": {
        "label": "Трос Спарки",
        "choiceText": "🅱️ Спарки натягивает плазменный трос из живой молнии"
      }
    },
    "branches": {
      "A": {
        "id": "2A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Кристальные Гроты",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem wades waist-deep through a clear underground cavern pool full of glowing turquoise minerals and old carved steps. The little spirit drifts just above the water like a lantern, its light picking out luminous tracks along the damp cave floor. Tall stalactites wrapped in glowing vines hang overhead, throwing shimmering water caustics across the golem's mossy shoulders.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR wet stone materials, vibrant turquoise caustics, soft cave mist, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🌊 **ДЕНЬ 2 (Ветка 🅰️): В КРИСТАЛЬНЫХ ГРОТАХ!** 🌊\n\nБольшинство выбрало путь воды! Голем уверенно шагает по пояс в кристально чистом подземном озере, а Спарки парит прямо над рябью воды, как живой фонарь, освещая бирюзовые следы на сырых плитах. \n\nВпереди путь преграждает бездонная грозовая пропасть с ревущим водопадом! Каменный мост обрушен сотни лет назад.\n\n**КАК ПЕРЕЙДЁМ ПРОПАСТЬ?**\n🅰️ — Голем строит мост из гигантских валунов!\n🅱️ — Спарки натягивает плазменный трос из живой молнии!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      },
      "B": {
        "id": "2B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Базальтовые Шахты",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem walks through a huge underground basalt quarry of hexagonal rock columns and hanging copper chains. He holds one giant hand open flat as a perch, and the little spirit hovers just above his palm, its glow reaching forward toward an arched stone doorway lit amber in the distance. Old glowing crystals and carved stone gears lie scattered across the rocky floor.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR volcanic rock textures, deep indigo shadows with emerald and aquamarine rim light, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⛏️ **ДЕНЬ 2 (Ветка 🅱️): В БАЗАЛЬТОВЫХ ШАХТАХ!** ⛏️\n\nВы выбрали старые шахты! Голем ступает по каменным коридорам среди грандиозных шестигранных колонн, а Спарки сидит на его ладони, направляя луч света к старой штольне.\n\nТуннель внезапно обрывается на краю колоссальной подземной пропасти с ревущим водопадом! \n\n**КАК ПЕРЕЙДЁМ ПРОПАСТЬ?**\n🅰️ — Голем строит мост из гигантских валунов!\n🅱️ — Спарки натягивает плазменный трос из живой молнии!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      }
    }
  },
  {
    "day": 3,
    "titleRu": "День 3: Испытание на пропасти",
    "titleEn": "Day 3: The Chasm Crossing",
    "act": "Акт 2: Нарастание напряжения",
    "isSingleScene": false,
    "summary": "Герои переправляются через бездну и находят вход в тайник, где заперта реликвия.",
    "votingQuestion": "Как снять защитный барьер с Короны Гроз?",
    "votingOptions": {
      "A": {
        "label": "Синхронная разрядка",
        "choiceText": "🅰️ Синхронная разрядка: Голем держит контур, Спарки калибрует поле"
      },
      "B": {
        "label": "Силовой рывок",
        "choiceText": "🅱️ Силовой рывок: Голем разжимает створки, Спарки забирает Корону"
      }
    },
    "branches": {
      "A": {
        "id": "3A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Голем строит переправу",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nAt the edge of a vast underground chasm with a roaring waterfall, the golem lifts a giant mossy boulder onto his shoulder, ready to bridge the gap, his emerald cracks flaring bright with effort. The little spirit hovers beside his head and sends a thin thread of light across to the far cliff, marking where the boulder should land.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and water spray materials, dramatic vertical mist lighting, glowing turquoise depths below, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⚡ **ДЕНЬ 3 (Ветка 🅰️): КАМЕННЫЙ МОСТ!** ⚡\n\nГолем в действии! Подняв огромный замшелый валун на плечо, исполин возводит надежную переправу над ревущей бездной. Спарки тонкой нитью аквамаринового света отмечает точку опоры на дальнем утесе!\n\nПереправа готова! В круглом зале святилища найдена Корона Гроз, но древний механизм запер её в защитное поле!\n\n**КАК СНИМАЕМ ЗАЩИТУ С РЕЛИКВИИ?**\n🅰️ — Синхронная разрядка: Голем держит контур, Спарки калибрует защитное поле!\n🅱️ — Силовой рывок: Голем разжимает створки алтаря, Спарки выхватывает Корону!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      },
      "B": {
        "id": "3B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Плазменный трос Спарки",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe little spirit floats out over a deep misty ravine, a luminous rope of crackling aquamarine lightning streaming out of his body and anchored between two ancient stone pillars. On the near ledge the golem stands solidly on both feet, grinning with trust as he presses one enormous mossy foot down onto the glowing bridge to test it. Clouds of blue phosphorescent mist drift through the chasm below.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR materials, bright electric arc light reflecting on wet stone, deep indigo atmospheric perspective, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⚡ **ДЕНЬ 3 (Ветка 🅱️): ЭЛЕКТРО-ТРОС!** ⚡\n\nНевероятная ловкость! Спарки протянул над туманной расщелиной прочный канат из живой искрящейся молнии. Голем с доверием и улыбкой ступает на сияющий мост!\n\nПропасть позади! Герои входят в тайник, где на постаменте сияет Корона Гроз, заблокированная древней защитной системой!\n\n**КАК СНИМАЕМ ЗАЩИТУ С РЕЛИКВИИ?**\n🅰️ — Синхронная разрядка: Голем держит контур, Спарки калибрует защитное поле!\n🅱️ — Силовой рывок: Голем разжимает створки алтаря, Спарки выхватывает Корону!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      }
    }
  },
  {
    "day": 4,
    "titleRu": "День 4: Тайник найден (Поворот сюжета)",
    "titleEn": "Day 4: The Vault Revealed (Plot Twist)",
    "act": "Акт 3: Находка и сюрприз",
    "isSingleScene": false,
    "summary": "Корона Гроз спасена из алтаря, но сейсмический импульс провоцирует обвал в коридорах святилища!",
    "votingQuestion": "Как спастись от начавшегося обвала в туннеле?",
    "votingOptions": {
      "A": {
        "label": "Каменный щит",
        "choiceText": "🅰️ Голем закрывает Спарки и Корону своим каменным телом"
      },
      "B": {
        "label": "Плазменный прорыв",
        "choiceText": "🅱️ Спарки расчищает завал мощным лучом плазмы"
      }
    },
    "branches": {
      "A": {
        "id": "4A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Синхронная разрядка барьера",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nInside a grand circular underground chamber lined with towering basalt arches, the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs running between them — floats inside a sphere of swirling blue plasma above a stone pedestal. The golem kneels before the altar, both heavy hands flat on its base, his green cracks glowing brightly. The little spirit hovers beside the sphere, glowing with careful concentration as its plasma threads tune the field.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and glowing glass materials, emerald and aquamarine dual lighting, dust motes in the light beams, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "👑 **ДЕНЬ 4 (Ветка 🅰️): СИНХРОННАЯ РАЗРЯДКА!** 👑\n\nЮвелирная работа! Голем заземляет алтарь ладонями, а Спарки аккуратно сонастраивает плазменные потоки сферы. Защитный купол плавно тает, и Корона Гроз освобождена!\n\nНо пробуждение реликвии вызвало сейсмический толчок — своды туннеля трещат, сверху летят обломки камней!\n\n**КАК СПАСАЕМСЯ ОТ ОБВАЛА?**\n🅰️ — Голем укрывает Спарки и Корону своим каменным щитом!\n🅱️ — Спарки расчищает завал на пути мощным плазменным лучом!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      },
      "B": {
        "id": "4B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Силовое размыкание алтаря",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem braces both huge hands against two heavy stone shutters and holds them wide open, his emerald cracks flaring with effort and green sparks scattering along his forearms. Behind the shutters rests the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs running between them. The little spirit slips through the gap with room to spare, wrapping his plasma body around the crown to carry it clear.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, strong rim lighting, drifting green and aquamarine sparks, motion in the plasma trails, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "👑 **ДЕНЬ 4 (Ветка 🅱️): СИЛОВОЙ ВЗЛОМ!** 👑\n\nМощь и скорость! Голем напрягает все силы и удерживает тяжелые каменные створки раскрытыми, пока Спарки молнией проскальзывает в щель и обвивает Корону Гроз своим плазменным телом!\n\nРеликвия спасена! Но замок сотрясает толчок, и выход наружу начинает заваливать каменными глыбами!\n\n**КАК СПАСАЕМСЯ ОТ ОБВАЛА?**\n🅰️ — Голем укрывает Спарки и Корону своим каменным щитом!\n🅱️ — Спарки расчищает завал на пути мощным плазменным лучом!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      }
    }
  },
  {
    "day": 5,
    "titleRu": "День 5: Прорыв сквозь обвал",
    "titleEn": "Day 5: The Rush Back",
    "act": "Акт 4: Экшен и командная работа",
    "isSingleScene": false,
    "summary": "Команда справляется с каменным обвалом и выходит к подножию храмового пика.",
    "votingQuestion": "Как подняться к храму на вершине сквозь бурю?",
    "votingOptions": {
      "A": {
        "label": "Грозовой вихрь",
        "choiceText": "🅰️ Спарки поднимает Голема на грозовом вихре"
      },
      "B": {
        "label": "Лестница исполина",
        "choiceText": "🅱️ Голем монументально шагает по каменной лестнице"
      }
    },
    "branches": {
      "A": {
        "id": "5A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Каменный щит исполина",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nIn a crumbling cavern passage the golem crouches down over his friend like a living stone dome, back broad and steady. Sheltered safely beneath his chest and forearms, the little spirit hovers close around the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — looking up at the golem with pure gratitude. Loose rubble breaks apart harmlessly against his back in clouds of old dust.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone and dust materials, warm protective glow under the golem against cool blue dust behind, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🛡️ **ДЕНЬ 5 (Ветка 🅰️): НЕПРОБИВАЕМЫЙ ЩИТ!** 🛡️\n\nКаменный обвал нипочем истинному великану! Голем свернулся защитным куполом, приняв град падающих камней на свои широкие базальтовые плечи. В безопасности под его грудью Спарки бережно держит Корону Гроз!\n\nОпасность миновала! Впереди — крутой подъем к вершине горы, где вокруг святилища бушует свирепый грозовой шквал.\n\n**КАК ПОДНИМАЕМСЯ К СВЯТИЛИЩУ?**\n🅰️ — Спарки закручивает грозовой вихрь и поднимает Голема на вершину!\n🅱️ — Голем преодолевает бурю монументальными шагами по великой лестнице!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      },
      "B": {
        "id": "5B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Плазменный разряд Спарки",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem strides forward with the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — tucked safely under one enormous arm. Flying ahead of him down the tunnel, the little spirit glows white-hot as a wide beam of aquamarine light streams from him across a fallen rock barrier, breaking it into harmless drifting embers and lighting up the whole corridor.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR rock textures, bright aquamarine and emerald light with trailing sparks, forward motion perspective, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⚡ **ДЕНЬ 5 (Ветка 🅱️): ПЛАЗМЕННЫЙ ЛУЧ!** ⚡\n\nВот это мощь! Спарки разгорается белым пламенем и широким лучом аквамариновой плазмы распыляет каменный завал в сноп безвредных искр! Голем уверенно шагает вперед с Короной подмышкой.\n\nПуть на поверхность свободен! Впереди — подъем к вершине сквозь бушующий ураган.\n\n**КАК ПОДНИМАЕМСЯ К СВЯТИЛИЩУ?**\n🅰️ — Спарки закручивает грозовой вихрь и поднимает Голема на вершину!\n🅱️ — Голем преодолевает бурю монументальными шагами по великой лестнице!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      }
    }
  },
  {
    "day": 6,
    "titleRu": "День 6: Восхождение сквозь грозу",
    "titleEn": "Day 6: Ascent Through the Storm",
    "act": "Акт 5: Кульминация приключения",
    "isSingleScene": false,
    "summary": "Герои достигают святилища на вершине сквозь эпическую ночную грозу.",
    "votingQuestion": "Как отпраздновать победу и возвращение Короны?",
    "votingOptions": {
      "A": {
        "label": "Фестиваль Гроз",
        "choiceText": "🅰️ Запустить грандиозный Фестиваль Гроз и праздничный салют"
      },
      "B": {
        "label": "Золотой Разлом",
        "choiceText": "🅱️ Раскрыть тайное золотое хранилище алтаря с джекпотом"
      }
    },
    "branches": {
      "A": {
        "id": "6A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Полёт на грозовом вихре",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nA wide majestic shot: the giant golem rides upward inside a swirling column of aquamarine lightning and rushing wind that carries him toward the mountain summit, laughing with delight. The little spirit spins at the top of the vortex, and the golem holds the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — high in both stone hands against the midnight sky.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, electrifying aquamarine vortex light, heavy rain streaks, rolling dark purple storm clouds lit from within, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🌪️ **ДЕНЬ 6 (Ветка 🅰️): ВЗЛЕТ НА ШТОРМОВОМ ВИХРЕ!** 🌪️\n\nНевероятный триумф! Спарки закручивает вокруг исполина ревущий вихрь из ветра и аквамариновых молний, поднимая Голема прямо к вершине горы! \n\nГолем с восторгом и смехом держит Корону Гроз двумя руками навстречу грозовому небу! Святилище достигнуто!\n\n**КАК ПРАЗДНУЕМ ПОБЕДУ ЗАВТРА В ФИНАЛЕ?**\n🅰️ — Запустить грандиозный Фестиваль Гроз и праздничный салют молний!\n🅱️ — Раскрыть золотое хранилище алтаря с мега-водопадом джекпота!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      },
      "B": {
        "id": "6B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Шаги сквозь бурю",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem plants a monumental step onto the top landing of an ancient grand stone staircase outside the storm temple, leaning into fierce wind. Rain glistens across his mossy shoulders as he carries the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — held close in both hands. The little spirit hovers right at his shoulder, its glow lighting his grinning stone face, its plasma tendrils streaming toward the temple doors ahead.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR wet stone materials, thunderstorm atmosphere, purple lightning picking out the mountain ridges behind, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "⛰️ **ДЕНЬ 6 (Ветка 🅱️): ШАГИ СКВОЗЬ БУРЮ!** ⛰️\n\nНесокрушимая поступь! Сквозь ливень и свирепый ветер Голем делает решающий шаг на верхнюю площадку храмовой лестницы. Дождь блестит на его замшелых плечах, а Спарки освещает путь к дверям храма.\n\nКорона вернулась к святилищу! Завтра — великий финал и раздача наград!\n\n**КАК ПРАЗДНУЕМ ПОБЕДУ ЗАВТРА В ФИНАЛЕ?**\n🅰️ — Запустить грандиозный Фестиваль Гроз и праздничный салют молний!\n🅱️ — Раскрыть золотое хранилище алтаря с мега-водопадом джекпота!\n\n*Голосуйте реакцией 🅰️ или 🅱️ ниже!*"
      }
    }
  },
  {
    "day": 7,
    "titleRu": "День 7: Торжество и Мега-Джекпот StormRush (Финал)",
    "titleEn": "Day 7: The Grand Storm Rush Jackpot (Finale)",
    "act": "Акт 6: Финал и раздача призов",
    "isSingleScene": false,
    "summary": "Корона Гроз возвращена на алтарь! Потоки чистой энергии пробуждают джекпот-слоты, запускается празднование в Discord.",
    "votingQuestion": "Финальный выбор сообщества:",
    "votingOptions": {
      "A": {
        "label": "Фестиваль Гроз",
        "choiceText": "🅰️ Праздничный салют и бонусные вращения (Промокод STORMCROWN2026)"
      },
      "B": {
        "label": "Золотой Разлом",
        "choiceText": "🅱️ Золотой разлом и бездепозитный приз (Промокод STORMRUSH777)"
      }
    },
    "branches": {
      "A": {
        "id": "7A",
        "branchLabel": "Ветка 🅰️",
        "sceneTitle": "Фестиваль Гроз",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nThe golem and his little spirit celebrate together in the restored storm sanctuary. The storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — sits proudly at the centre of the basalt pedestal, sending joyful beams of emerald and aquamarine light up into the sky. The golem sits back contentedly with his arms at rest, while the little spirit loops through the air above him, trailing sparkling golden embers.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy PBR stone materials, festive night lighting, sparkling golden and aquamarine ember particles, warm atmospheric glow, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "🎉 **МЫ СДЕЛАЛИ ЭТО! КОРОНА ГРОЗ ВЕРНУЛАСЬ НА АЛТАРЬ!** 🎉\n\nДрузья, 7-дневное приключение подошло к триумфальному финалу! Благодаря вашей сплоченности Голем и Спарки вернули Корону Гроз на законное место в святилище!\n\n⚡ Алтарь сияет изумрудными и аквамариновыми лучами, взмывающими в ночное небо, а Спарки кружит в воздухе золотыми искрами!\n\n🎁 **ВАША НАГРАДА ЗА ПОБЕДУ В КВЕСТЕ:**\nИспользуйте эксклюзивный промокод сообщества: **`STORMCROWN2026`**\n* +100% к депозиту\n* 50 бесплатных грозовых вращений\n* Специальная роль в Discord: «⚡ Хранитель Бури»\n\nСпасибо каждому за участие в голосованиях! Голем довольно улыбается, а Спарки крутит победные сальто! До встречи в следующем квесте! 🚀"
      },
      "B": {
        "id": "7B",
        "branchLabel": "Ветка 🅱️",
        "sceneTitle": "Золотой водопад джекпота",
        "prompt": "Use the attached image as the character reference. Keep both characters consistent with it: the massive mossy stone golem built from dark green boulders with bright glowing emerald cracks, narrow glowing eyes and a wide glowing smile; and his tiny companion, a small formless spirit of glowing aquamarine plasma with two dark dot eyes and a little smile, wreathed in soft plasma tendrils. The spirit has no arms and no legs — he is a floating wisp about the size of the golem's hand, and he always hovers. Change only their pose and expression.\r\n\r\nA close composition inside the sanctuary: the storm crown — a circlet of dark basalt with three upward prongs and glowing emerald arcs between them — rests on the cracked basalt altar block, and out of the pedestal's fissures pours a rich cascade of glowing golden coins and emerald gems across the mossy ground. The golem leans in with an enormous joyful grin, and the little spirit hovers just above the crown, one golden coin lifted in its plasma. Keep every coin and gem face smooth and blank, with no lettering or numbers.\r\n\r\nStylized 3D character render, soft subsurface plasma and moss shading, glossy polished gold and wet stone materials, radiant warm golden and aquamarine light, rich reflections, festive atmosphere, shallow depth of field, high detail, 16:9 widescreen.",
        "discordCopy": "💰 **МЕГА-ДЖЕКПОТ РАСПАКОВАН! ЗОЛОТОЙ ВОДОПАД STORMRUSH!** 💰\n\nКорона заняла свое место на базальтовом постаменте — и древний алтарь открыл тайное хранилище! Водопад гладких золотых монет и изумрудных самоцветов хлынул на мшистые плиты!\n\nСпарки с победным сиянием парит над Короной, а Голем расплылся в самой широкой и доброй каменной улыбке!\n\n🎁 **ЗАБЕРИ СВОЮ ДОЛЮ СОКРОВИЩА:**\nВводи промокод: **`STORMRUSH777`**\n* Мгновенный бездепозитный бонус монет\n* Доступ к турниру «Битва Гроз»\n* VIP-значок первооткрывателя\n\nВы лучшие! Голем и Спарки благодарят за верные решения каждый день! 🔥"
      }
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARC_METADATA, CHARACTER_DNA, QUEST_DAYS };
}
