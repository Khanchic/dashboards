/* The North Star Expedition — генератор личной экспедиции игрока (Scarlet Sands, Рождество 25–26.12.2026).
 *
 * Пул из 20 задач (7 лёгких, 7 средних, 6 трудных). Каждому игроку по seed (= Discord ID) выпадает
 * 2 лёгкие (глава 1) + 2 средние (глава 2) + 2 трудные (глава 3). Ориентиры на карте (10 штук) у каждого
 * стоят по-своему, поэтому даже одинаковая задача у двух игроков даёт разные клетки.
 * Дальше: оазис (26.12, от 4 штампов) и супер-игра Golden Compass (только тем, кто собрал всё).
 *
 * Сетка 12×9: колонки A–L слева направо, ряды 1–9 сверху вниз.
 * Словарь направлений (учим на странице 0): toward the North Star = вверх, away from the North Star = вниз,
 * toward sunrise = вправо, toward sunset = влево.
 * Работает в браузере (window.Expedition) и в node (module.exports). Проверка ответа — только на сервере.
 */
(function (root) {
  const COLS = 'ABCDEFGHIJKL', W = 12, H = 9;
  const LANDMARKS = ['camp', 'obelisk', 'well', 'temple', 'dunes', 'cactus', 'lake', 'sphinx', 'caravan', 'pyramid'];
  const NAMES = { camp: 'Camp', obelisk: 'Broken Obelisk', well: 'Scarab Well', temple: 'Sunken Temple',
    dunes: 'Twin Dunes', cactus: 'Cactus Gate', lake: 'Dry Lake', sphinx: 'Sphinx Rock', caravan: 'Old Caravan',
    pyramid: 'Little Pyramid' };
  const blocked = (c, r) => c >= 10 && r <= 1;            // угол с розой ветров
  const inGrid = (c, r) => c >= 0 && c < W && r >= 0 && r < H && !blocked(c, r);
  const id = (c, r) => COLS[c] + (r + 1);
  const at = id_ => [COLS.indexOf(id_[0]), +id_.slice(1) - 1];
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const mirror = (center, from) => [2 * center[0] - from[0], 2 * center[1] - from[1]];

  /* Пул задач. tier: 1 лёгкая · 2 средняя · 3 трудная. text — как увидит игрок (EN), hint — подсказка на полях. */
  const TASKS = [
    // ЛЁГКИЕ: один ориентир, 1–2 шага
    { key: 'E1', tier: 1, item: 'Brass Compass', type: 'Шаги',
      text: 'From the Scarab Well, 2 squares toward the North Star. I dropped my brass compass there.',
      hint: 'Северная звезда — вверх: 2 клетки вверх от колодца.', f: L => [L.well[0], L.well[1] - 2] },
    { key: 'E2', tier: 1, item: 'Camp Lantern', type: 'Рядом',
      text: 'I hung the lantern right next to the Sunken Temple, on the sunrise side.',
      hint: 'Восход — справа: соседняя клетка справа от храма.', f: L => [L.temple[0] + 1, L.temple[1]] },
    { key: 'E3', tier: 1, item: 'Cocoa Mug', type: 'Шаги',
      text: '3 squares toward sunset from the Camp. My cocoa went cold there.',
      hint: 'Закат — слева: 3 клетки влево от лагеря.', f: L => [L.camp[0] - 3, L.camp[1]] },
    { key: 'E4', tier: 1, item: 'Wool Scarf', type: 'Шаги',
      text: 'From the Little Pyramid, 2 squares away from the North Star. The wind took my scarf.',
      hint: '«Away from the North Star» — вниз: 2 клетки вниз от пирамиды.', f: L => [L.pyramid[0], L.pyramid[1] + 2] },
    { key: 'E5', tier: 1, item: 'Gingerbread Tin', type: 'Шаги',
      text: 'From the Old Caravan, 1 square toward sunrise and 1 toward the North Star. Smells like ginger.',
      hint: '1 вправо и 1 вверх — соседняя клетка по диагонали вправо-вверх от каравана.', f: L => [L.caravan[0] + 1, L.caravan[1] - 1] },
    { key: 'E6', tier: 1, item: 'Sleigh Bell', type: 'Шаги',
      text: 'From the Cactus Gate, 2 squares toward sunset. Listen for the bell.',
      hint: 'Закат — слева: 2 клетки влево от кактусов.', f: L => [L.cactus[0] - 2, L.cactus[1]] },
    { key: 'E7', tier: 1, item: 'Candy Cane', type: 'Шаги',
      text: 'From the Sphinx Rock: 2 squares toward sunrise, then 1 away from the North Star.',
      hint: '2 вправо, потом 1 вниз от сфинкса.', f: L => [L.sphinx[0] + 2, L.sphinx[1] + 1] },
    // СРЕДНИЕ: два ориентира или длинный маршрут
    { key: 'M1', tier: 2, item: 'Map-Paper Gift', type: 'Середина',
      text: 'Exactly halfway between the Camp and the Sunken Temple. I counted the squares twice.',
      hint: 'Посчитай отдельно колонки и ряды между лагерем и храмом и раздели каждое пополам.', f: L => mid(L.camp, L.temple) },
    { key: 'M2', tier: 2, item: 'Star Ornament', type: 'Пересечение',
      text: "Where the Sunken Temple's column crosses the Twin Dunes' row. The star ornament is there.",
      hint: 'Колонка — буква храма, ряд — цифра дюн.', f: L => [L.temple[0], L.dunes[1]] },
    { key: 'M3', tier: 2, item: 'Desert Candle', type: 'Маршрут',
      text: 'From the Dry Lake: 3 squares toward sunset, then 2 toward the North Star. A candle is still burning.',
      hint: '3 влево, потом 2 вверх от озера.', f: L => [L.lake[0] - 3, L.lake[1] - 2] },
    { key: 'M4', tier: 2, item: 'Silver Spyglass', type: 'Пересечение',
      text: "Where the Scarab Well's column crosses the Broken Obelisk's row. I left the spyglass on a rock.",
      hint: 'Колонка — буква колодца, ряд — цифра обелиска.', f: L => [L.well[0], L.obelisk[1]] },
    { key: 'M5', tier: 2, item: 'Holly Wreath', type: 'Середина',
      text: 'Exactly halfway between the Sphinx Rock and the Old Caravan. The wreath is hanging on a stick.',
      hint: 'Посчитай отдельно колонки и ряды между сфинксом и караваном и раздели каждое пополам.', f: L => mid(L.sphinx, L.caravan) },
    { key: 'M6', tier: 2, item: 'Snow Globe', type: 'Шифр',
      text: 'The guide scratched this on the tent pole. Shift every letter back by three: WZR EHORZ WKH ZHOO',
      hint: 'W→T, Z→W, R→O: первое слово TWO. Получится TWO BELOW THE WELL.', f: L => [L.well[0], L.well[1] + 2] },
    { key: 'M7', tier: 2, item: 'Music Box', type: 'Пересечение',
      text: "In the Cactus Gate's row, 2 squares toward sunrise from the Dry Lake's column. I hear it playing.",
      hint: 'Ряд — цифра кактусов. Колонка — на 2 правее буквы озера.', f: L => [L.lake[0] + 2, L.cactus[1]] },
    // ТРУДНЫЕ: отражение, шифр −5, обратный путь, два шага логики
    { key: 'H1', tier: 3, item: 'Christmas Stocking', type: 'Отражение',
      text: 'Walk from the Camp to the Scarab Well, then keep going the same way for the same distance.',
      hint: 'Сколько клеток и куда от лагеря до колодца — ровно столько же ещё от колодца.', f: L => mirror(L.well, L.camp) },
    { key: 'H2', tier: 3, item: 'Pocket Watch', type: 'Шифр',
      text: 'This one is older. Shift every letter back by five: YMWJJ WNLMY TK YMJ YJRUQJ',
      hint: 'Y→T, M→H, W→R: первое слово THREE. Получится THREE RIGHT OF THE TEMPLE.', f: L => [L.temple[0] + 3, L.temple[1]] },
    { key: 'H3', tier: 3, item: 'Lost Mitten', type: 'Обратный путь',
      text: 'I walked 2 squares toward sunrise and 3 toward the North Star and reached the Sphinx Rock. My mitten is where I started.',
      hint: 'Иди назад от сфинкса: 2 влево и 3 вниз.', f: L => [L.sphinx[0] - 2, L.sphinx[1] + 3] },
    { key: 'H4', tier: 3, item: 'Tin Soldier', type: 'Два шага',
      text: "Find where the Old Caravan's column crosses the Broken Obelisk's row. From there, 2 more squares toward the North Star.",
      hint: 'Колонка каравана × ряд обелиска, потом 2 клетки вверх.', f: L => [L.caravan[0], L.obelisk[1] - 2] },
    { key: 'H5', tier: 3, item: 'Silver Locket', type: 'Диагональ',
      text: 'From the Little Pyramid, walk diagonally toward sunset and the North Star: 3 squares.',
      hint: 'Диагональ влево-вверх: 3 клетки влево и 3 вверх от пирамиды.', f: L => [L.pyramid[0] - 3, L.pyramid[1] - 3] },
    { key: 'H6', tier: 3, item: 'Nutcracker', type: 'Отражение',
      text: 'The Twin Dunes are exactly halfway between the Cactus Gate and the nutcracker.',
      hint: 'От кактусов до дюн — и ровно столько же дальше за дюны.', f: L => mirror(L.dunes, L.cactus) },
  ];

  /* Оазис и супер-игра: текст персональный (называет предметы игрока), клетка считается от его находок. */
  const OASIS = {
    text: T => `Stand in the column of your ${T[0].item} and the row of your ${T[2].item}. Then one step toward the North Star. Water. Palms. Lights.`,
    hint: T => `колонка — как у «${T[0].item}» (глава 1), ряд — как у «${T[2].item}» (глава 2), потом клетка вверх.`,
    f: (L, P) => [P.s1[0], P.s3[1] - 1] };
  const SUPER = {
    text: T => `The golden compass. From the oasis, go to the row of your ${T[5].item}. Then walk diagonally toward sunrise and away from the North Star: 2 squares. No hints this time.`,
    f: (L, P) => [P.oasis[0] + 2, P.s6[1] + 2] };

  /* Кот в Watchers: фраза одна для всех. Лапка = штамп, пин не тратит. */
  const CATS = [
    { key: 'c1', text: 'Mrrp. Napping right under the Twin Dunes. Do not wake me. (Do wake me.)', f: L => [L.dunes[0], L.dunes[1] + 1] },
    { key: 'c2', text: 'Chasing a scarab one square toward sunset from the Sunken Temple.', f: L => [L.temple[0] - 1, L.temple[1]] },
    { key: 'c3', text: "Sitting just above the Dry Lake, pretending it's still a lake.", f: L => [L.lake[0], L.lake[1] - 1] },
    { key: 'c4', text: 'Next to the Camp, one step toward sunrise. Where the warm socks are.', f: L => [L.camp[0] + 1, L.camp[1]] },
  ];

  function hashSeed(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick2(rand, tier) {
    const pool = TASKS.filter(t => t.tier === tier); const i = Math.floor(rand() * pool.length);
    let j = Math.floor(rand() * (pool.length - 1)); if (j >= i) j++;
    return [pool[i], pool[j]];
  }

  /* Какие ориентиры и находки читает функция — выясняем один раз через Proxy. */
  function depsOf(f) {
    const lm = new Set(), ans = new Set();
    const spy = (set) => new Proxy({}, { get: (_, k) => { set.add(k); return [0, 0]; } });
    f(spy(lm), spy(ans));
    return { lm: [...lm], ans: [...ans] };
  }
  const DEPS = new Map();
  for (const t of [...TASKS, OASIS, SUPER, ...CATS]) DEPS.set(t.f, depsOf(t.f));

  /* Расстановка ориентиров поиском с откатом: ставим по одному; как только для находки готовы все её ориентиры,
   * сразу считаем её клетку и проверяем (в сетке, целая, не занята). Перезапуски с лимитом узлов. */
  const CELLS = []; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (inGrid(c, r)) CELLS.push([c, r]);
  const LIDX = Object.fromEntries(LANDMARKS.map((k, i) => [k, i]));
  function tryPlace(rand, tasks) {
    const items = [...tasks.map((t, i) => ['s' + (i + 1), t.f]), ['oasis', OASIS.f], ['super', SUPER.f], ...CATS.map(c => [c.key, c.f])];
    // уровень готовности находки = индекс последнего нужного ориентира (с учётом находок, от которых она зависит)
    const readyAt = {};
    for (const [key, f] of items) { const d = DEPS.get(f);
      readyAt[key] = Math.max(-1, ...d.lm.map(k => LIDX[k]), ...d.ans.map(k => readyAt[k])); }
    const byLevel = LANDMARKS.map((_, i) => items.filter(([k]) => readyAt[k] === i));
    const L = {}, P = {}, used = new Set(); let nodes = 0;
    const shuffled = () => { const a = CELLS.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function rec(i) {
      if (i === LANDMARKS.length) return true;
      const name = LANDMARKS[i];
      for (const [c, r] of shuffled()) {
        if (++nodes > 3000) return false;
        const cid = id(c, r);
        if (used.has(cid)) continue;
        let ok = true;
        for (const k in L) { const [x, y] = L[k]; if (Math.max(Math.abs(x - c), Math.abs(y - r)) < 2) { ok = false; break; } }
        if (!ok) continue;
        L[name] = [c, r]; used.add(cid);
        const added = [];
        for (const [key, f] of byLevel[i]) {
          const [x, y] = f(L, P);
          if (!Number.isInteger(x) || !Number.isInteger(y) || !inGrid(x, y) || used.has(id(x, y))) { ok = false; break; }
          P[key] = [x, y]; used.add(id(x, y)); added.push(key);
        }
        if (ok && rec(i + 1)) return true;
        for (const key of added) { used.delete(id(...P[key])); delete P[key]; }
        delete L[name]; used.delete(cid);
        if (nodes > 3000) return false;
      }
      return false;
    }
    return rec(0) ? { L: { ...L }, P: { ...P } } : null;
  }

  /* Детерминированно: один seed = один набор задач и одна карта. */
  function buildExpedition(seed) {
    const rand = rng(hashSeed(seed));
    const tasks = [...pick2(rand, 1), ...pick2(rand, 2), ...pick2(rand, 3)];
    // attempt = перезапуск поиска (до 4 000 узлов каждый); статистика — mechanic/test
    for (let attempt = 1; attempt <= 500; attempt++) {
      const m = tryPlace(rand, tasks);
      if (m) {
        const lm = {}; for (const k in m.L) lm[k] = id(...m.L[k]);
        const ans = {}; for (const k in m.P) ans[k] = id(...m.P[k]);
        return { seed: String(seed), attempts: attempt, landmarks: lm, answers: ans,
          tasks: tasks.map((t, i) => ({ slot: 's' + (i + 1), chapter: Math.floor(i / 2) + 1, key: t.key, tier: t.tier,
            item: t.item, type: t.type, text: t.text, hint: t.hint })),
          oasis: { text: OASIS.text(tasks), hint: OASIS.hint(tasks) }, super: { text: SUPER.text(tasks) },
          cats: CATS.map(c => ({ key: c.key, text: c.text })) };
      }
    }
    throw new Error('expedition: no map for seed ' + seed);
  }

  /* Обратная связь после промаха (Чебышёв: соседняя клетка, включая диагональ = 1). В супер-игре не показывается. */
  function feedback(guessId, answerId) {
    const [a, b] = at(guessId), [c, d] = at(answerId);
    const dist = Math.max(Math.abs(a - c), Math.abs(b - d));
    if (dist === 0) return { hit: true, dist, heat: 'hit' };
    return { hit: false, dist, heat: dist === 1 ? 'hot' : dist <= 3 ? 'warm' : 'cold' };
  }

  const RULES = { triesTask: 3, triesOasis: 3, triesSuper: 2, oasisMinStamps: 4,
    // супер-игра: все 6 предметов найдены сами (без раскрытия), все 4 лапки, оазис найден
    superUnlocked: s => s.found === 6 && s.paws === 4 && s.oasis };

  const api = { COLS, W, H, LANDMARKS, NAMES, TASKS: TASKS.map(({ f, ...t }) => t), RULES,
    id, at, inGrid, buildExpedition, feedback, hashSeed };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Expedition = api;
})(typeof window !== 'undefined' ? window : globalThis);
