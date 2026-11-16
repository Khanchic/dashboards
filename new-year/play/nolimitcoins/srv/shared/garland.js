/**
 * Infinity Garland (NoLimitCoins, Christmas 2026) — сетка-гирлянда. Общий файл для сервера и клиента (UMD).
 *
 * Головоломка: ярус ёлки = сетка лампочек. Нарисовать ОДНУ замкнутую гирлянду (петлю), которая проходит через
 * каждую лампочку ровно один раз, ходит только по соседним клеткам (вверх/вниз/влево/вправо) и не пересекает себя.
 * Тёмные клетки — ветки, через них не идём. Засчитывается ЛЮБАЯ правильная петля, не только «как в генераторе».
 *
 * Генератор (решаемость гарантирована построением):
 *   1. Форма яруса задаётся «крупной» маской: каждая крупная клетка = блок 2×2 лампочек.
 *   2. Случайное остовное дерево крупных клеток (алгоритм Уилсона — равномерное).
 *   3. Контур вокруг дерева = петля через все лампочки формы (каждый блок 2×2 — маленькое кольцо, ребро дерева
 *      сшивает два кольца в одно).
 *   4. «Укусы»: где петля делает выступ a-b-c-d, а a и d соседи, выкидываем b и c (две клетки становятся ветками),
 *      петля идёт a-d. Так появляются дырки и рваный край — они и дают головоломке логику.
 *
 * Клетка — индекс r*C + c. Связь — пара соседних клеток, ключ 'min-max'.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Garland = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const key = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
  const unkey = (k) => k.split('-').map(Number);
  const adjacent = (C, a, b) => {
    const ra = Math.floor(a / C), rb = Math.floor(b / C);
    return (ra === rb && Math.abs(a - b) === 1) || (a % C === b % C && Math.abs(ra - rb) === 1);
  };

  /** Крупная маска из строк 'X' / '.' → { CR, CC, on: [[bool]] } */
  function coarse(rows) {
    const CR = rows.length, CC = Math.max(...rows.map((s) => s.length));
    const on = rows.map((s) => Array.from({ length: CC }, (_, j) => s[j] === 'X'));
    return { CR, CC, on };
  }

  /** Равномерное остовное дерево крупных клеток (Уилсон). → список рёбер [[i,j],[i2,j2]] */
  function spanningTree(m, rng) {
    const cells = [];
    for (let i = 0; i < m.CR; i++) for (let j = 0; j < m.CC; j++) if (m.on[i][j]) cells.push(i * m.CC + j);
    const has = (i, j) => i >= 0 && j >= 0 && i < m.CR && j < m.CC && m.on[i][j];
    const nbrs = (x) => {
      const i = Math.floor(x / m.CC), j = x % m.CC, out = [];
      if (has(i - 1, j)) out.push(x - m.CC);
      if (has(i + 1, j)) out.push(x + m.CC);
      if (has(i, j - 1)) out.push(x - 1);
      if (has(i, j + 1)) out.push(x + 1);
      return out;
    };
    const inTree = new Set([cells[Math.floor(rng() * cells.length)]]);
    const edges = [];
    for (const start of cells) {
      if (inTree.has(start)) continue;
      const next = new Map();
      let x = start;
      while (!inTree.has(x)) { const ns = nbrs(x); const y = ns[Math.floor(rng() * ns.length)]; next.set(x, y); x = y; }
      x = start;
      while (!inTree.has(x)) { const y = next.get(x); edges.push([x, y]); inTree.add(x); x = y; }
    }
    if (inTree.size !== cells.length) throw new Error('garland: mask is not connected');
    return edges;
  }

  /** Петля-контур вокруг дерева → упорядоченный список клеток. */
  function contour(m, tree) {
    const C = m.CC * 2;
    const nb = new Map();
    const link = (a, b) => { (nb.get(a) || nb.set(a, new Set()).get(a)).add(b); (nb.get(b) || nb.set(b, new Set()).get(b)).add(a); };
    const cut = (a, b) => { nb.get(a).delete(b); nb.get(b).delete(a); };
    const f = (r, c) => r * C + c;
    for (let i = 0; i < m.CR; i++) for (let j = 0; j < m.CC; j++) {
      if (!m.on[i][j]) continue;
      const a = f(2 * i, 2 * j), b = f(2 * i, 2 * j + 1), c = f(2 * i + 1, 2 * j + 1), d = f(2 * i + 1, 2 * j);
      link(a, b); link(b, c); link(c, d); link(d, a);
    }
    for (const [x, y] of tree) {
      const [p, q] = x < y ? [x, y] : [y, x];
      const i = Math.floor(p / m.CC), j = p % m.CC;
      if (q === p + 1) { // по горизонтали
        cut(f(2 * i, 2 * j + 1), f(2 * i + 1, 2 * j + 1)); cut(f(2 * i, 2 * j + 2), f(2 * i + 1, 2 * j + 2));
        link(f(2 * i, 2 * j + 1), f(2 * i, 2 * j + 2)); link(f(2 * i + 1, 2 * j + 1), f(2 * i + 1, 2 * j + 2));
      } else { // по вертикали
        cut(f(2 * i + 1, 2 * j), f(2 * i + 1, 2 * j + 1)); cut(f(2 * i + 2, 2 * j), f(2 * i + 2, 2 * j + 1));
        link(f(2 * i + 1, 2 * j), f(2 * i + 2, 2 * j)); link(f(2 * i + 1, 2 * j + 1), f(2 * i + 2, 2 * j + 1));
      }
    }
    const first = nb.keys().next().value;
    const cyc = [first];
    let prev = -1, cur = first;
    for (;;) {
      const nxt = [...nb.get(cur)].find((y) => y !== prev);
      if (nxt === first) break;
      cyc.push(nxt); prev = cur; cur = nxt;
      if (cyc.length > nb.size) throw new Error('garland: contour broken');
    }
    if (cyc.length !== nb.size) throw new Error('garland: contour is not one loop');
    return cyc;
  }

  /**
   * Уровень → головоломка.
   * L = { shape: [строки крупной маски], bites: число укусов }
   * → { R, C, bulb: [0|1 на клетку], sol: [ключи связей решения] }
   */
  function build(L, rng) {
    rng = rng || Math.random;
    const m = coarse(L.shape);
    const R = m.CR * 2, C = m.CC * 2;
    for (let tries = 0; tries < 50; tries++) {
      let cyc = contour(m, spanningTree(m, rng));
      const inShape = new Set(cyc);
      const shapeNbrs = (x) => {
        const r = Math.floor(x / C), c = x % C;
        return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C && inShape.has(a * C + b)).length;
      };
      let bites = L.bites || 0;
      // не больше одного укуса на блок 2×2 — иначе съедается верхушка яруса и пропадает силуэт ёлки
      const blockOf = (x) => Math.floor(Math.floor(x / C) / 2) * m.CC + Math.floor((x % C) / 2);
      const bitten = new Set();
      while (bites > 0) {
        const n = cyc.length;
        if (n <= 8) break;
        const cand = [];
        for (let i = 0; i < n; i++) {
          const a = cyc[i], b = cyc[(i + 1) % n], c = cyc[(i + 2) % n], d = cyc[(i + 3) % n];
          if (!adjacent(C, a, d)) continue;
          if (bitten.has(blockOf(b)) || bitten.has(blockOf(c))) continue;
          // дырка внутри яруса интереснее, чем обкусанный край: вес 3 против 1
          const w = shapeNbrs(b) === 4 && shapeNbrs(c) === 4 ? 3 : 1;
          for (let k = 0; k < w; k++) cand.push(i);
        }
        if (!cand.length) break;
        const i = cand[Math.floor(rng() * cand.length)];
        bitten.add(blockOf(cyc[(i + 1) % n])); bitten.add(blockOf(cyc[(i + 2) % n]));
        const rm = [(i + 1) % n, (i + 2) % n].sort((x, y) => y - x);
        for (const idx of rm) { inShape.delete(cyc[idx]); cyc.splice(idx, 1); }
        bites--;
      }
      if (bites > 0) continue;
      const bulb = new Array(R * C).fill(0);
      cyc.forEach((x) => { bulb[x] = 1; });
      const sol = cyc.map((x, i) => key(x, cyc[(i + 1) % cyc.length]));
      return { R, C, bulb, sol };
    }
    throw new Error('garland: could not place bites');
  }

  /** Степени клеток по набору связей (объект ключ → 1 или массив ключей). */
  function degrees(n, links) {
    const deg = new Array(n).fill(0);
    for (const k of Array.isArray(links) ? links : Object.keys(links)) { const [a, b] = unkey(k); deg[a]++; deg[b]++; }
    return deg;
  }

  /**
   * Проверка: связи только между соседними лампочками, у каждой лампочки ровно 2 связи, всё — одна петля.
   * → { solved, onLoop: число лампочек со степенью 2, bulbs, loops: число замкнутых колец (для подсказки «кольцо, но не всё») }
   */
  function check(g, links) {
    const ks = Array.isArray(links) ? links : Object.keys(links);
    const n = g.R * g.C;
    const deg = new Array(n).fill(0);
    const nb = new Map();
    for (const k of ks) {
      const [a, b] = unkey(k);
      if (!g.bulb[a] || !g.bulb[b] || !adjacent(g.C, a, b)) return { solved: false, bad: true };
      deg[a]++; deg[b]++;
      (nb.get(a) || nb.set(a, []).get(a)).push(b);
      (nb.get(b) || nb.set(b, []).get(b)).push(a);
    }
    let bulbs = 0, full = 0, over = false;
    for (let i = 0; i < n; i++) if (g.bulb[i]) { bulbs++; if (deg[i] === 2) full++; if (deg[i] > 2) over = true; }
    // замкнутые кольца: компоненты, где все клетки степени 2
    const seen = new Set();
    let loops = 0, loopCells = 0;
    for (const [s] of nb) {
      if (seen.has(s)) continue;
      const stack = [s], comp = [];
      seen.add(s);
      while (stack.length) { const x = stack.pop(); comp.push(x); for (const y of nb.get(x)) if (!seen.has(y)) { seen.add(y); stack.push(y); } }
      if (comp.every((x) => deg[x] === 2)) { loops++; loopCells = comp.length; }
    }
    const solved = !over && full === bulbs && loops === 1 && loopCells === bulbs;
    return { solved, onLoop: full, bulbs, loops, over };
  }

  return { key, unkey, adjacent, coarse, spanningTree, contour, build, degrees, check };
});
