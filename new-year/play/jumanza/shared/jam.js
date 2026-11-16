/*
 * Christmas on Kilimanjaro (Jumanza) — головоломка «пробка из блоков» 6×6. Общий файл для сервера и браузера (UMD).
 *
 * Поле W×W. Фигура 0 — safari 4x4 с подарками, горизонтальная, длина 2, ряд EXIT_ROW; выезд справа.
 * Остальные фигуры — животные и брёвна: горизонтальные ходят только влево-вправо, вертикальные — вверх-вниз.
 * Ход = сдвиг одной фигуры на любое число свободных клеток по её оси. Решено, когда 4x4 у правого края.
 *
 * Фигура: { o: 'h'|'v', len: 2|3, fix: ряд (h) или колонка (v), kind }. Позиции фигур — отдельный массив pos
 * (колонка левого края для h, ряд верхнего края для v): так состояние = короткий ключ, а форма поля не меняется.
 *
 * Генератор: случайная расстановка → обход всей компоненты состояний → обратный BFS от решённых состояний →
 * берём состояние ровно на расстоянии d (минимум ходов = d, проверено решателем). Так сложность задаётся точно.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Jam = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  const W = 6;
  const EXIT_ROW = 2;
  const GOAL = W - 2; // позиция 4x4 (длина 2) у правого края

  const key = (pos) => String.fromCharCode.apply(null, pos.map((x) => 48 + x));
  const unkey = (k) => Array.from(k, (ch) => ch.charCodeAt(0) - 48);
  const cellsOf = (p, x) => {
    const out = [];
    for (let j = 0; j < p.len; j++) out.push(p.o === 'h' ? p.fix * W + x + j : (x + j) * W + p.fix);
    return out;
  };

  /** Сетка занятости: индекс фигуры в клетке или -1. */
  function grid(pieces, pos) {
    const g = new Array(W * W).fill(-1);
    pieces.forEach((p, i) => { for (const c of cellsOf(p, pos[i])) g[c] = i; });
    return g;
  }

  /** Куда фигура i может доехать: [min, max] позиции (включая текущую). */
  function range(pieces, pos, i, g) {
    g = g || grid(pieces, pos);
    const p = pieces[i];
    const at = (x) => (p.o === 'h' ? p.fix * W + x : x * W + p.fix);
    let lo = pos[i], hi = pos[i];
    while (lo - 1 >= 0 && g[at(lo - 1)] === -1) lo--;
    while (hi + p.len < W && g[at(hi + p.len)] === -1) hi++;
    return [lo, hi];
  }

  /** Законен ли ход «фигура i → позиция to»: путь свободен, позиция другая. */
  function canSlide(pieces, pos, i, to) {
    if (!Number.isInteger(i) || i < 0 || i >= pieces.length) return false;
    if (!Number.isInteger(to) || to === pos[i]) return false;
    const [lo, hi] = range(pieces, pos, i);
    return to >= lo && to <= hi;
  }

  const solved = (pos) => pos[0] === GOAL;

  function neighbors(pieces, pos) {
    const g = grid(pieces, pos);
    const out = [];
    for (let i = 0; i < pieces.length; i++) {
      const [lo, hi] = range(pieces, pos, i, g);
      for (let x = lo; x <= hi; x++) if (x !== pos[i]) {
        const n = pos.slice(); n[i] = x;
        out.push({ i, to: x, pos: n });
      }
    }
    return out;
  }

  /** Кратчайшее решение от pos: [{i, to}, ...] или null. limit — предел состояний. */
  function solve(pieces, pos, limit = 200000) {
    const start = key(pos);
    if (solved(pos)) return [];
    const prev = new Map([[start, null]]);
    let q = [pos];
    while (q.length) {
      const next = [];
      for (const cur of q) {
        const ck = key(cur);
        for (const nb of neighbors(pieces, cur)) {
          const nk = key(nb.pos);
          if (prev.has(nk)) continue;
          prev.set(nk, { k: ck, i: nb.i, to: nb.to });
          if (solved(nb.pos)) {
            const path = [];
            let k = nk;
            while (prev.get(k)) { const s = prev.get(k); path.push({ i: s.i, to: s.to }); k = s.k; }
            return path.reverse();
          }
          if (prev.size > limit) return null;
          next.push(nb.pos);
        }
      }
      q = next;
    }
    return null;
  }

  // ---------- генератор ----------
  const KINDS_H2 = ['zebra', 'hippo', 'rhino'];
  const KINDS_H3 = ['elephant', 'log'];
  const KINDS_V2 = ['giraffe', 'flamingo'];
  const KINDS_V3 = ['log'];

  function place(n, rng) {
    const pieces = [{ o: 'h', len: 2, fix: EXIT_ROW, kind: 'car' }];
    const pos = [Math.floor(rng() * (GOAL))]; // 0..3, не у выезда
    const occ = new Array(W * W).fill(false);
    for (const c of cellsOf(pieces[0], pos[0])) occ[c] = true;
    let tries = 0;
    while (pieces.length < n + 1 && tries++ < 400) {
      const o = rng() < 0.55 ? 'v' : 'h';
      const len = rng() < 0.22 ? 3 : 2;
      const fix = Math.floor(rng() * W);
      if (o === 'h' && fix === EXIT_ROW) continue; // горизонтальная в ряду выезда навсегда закрыла бы дорогу
      const x = Math.floor(rng() * (W - len + 1));
      const p = { o, len, fix };
      const cs = cellsOf(p, x);
      if (cs.some((c) => occ[c])) continue;
      cs.forEach((c) => { occ[c] = true; });
      const kinds = o === 'h' ? (len === 2 ? KINDS_H2 : KINDS_H3) : (len === 2 ? KINDS_V2 : KINDS_V3);
      p.kind = kinds[Math.floor(rng() * kinds.length)];
      pieces.push(p); pos.push(x);
    }
    return { pieces, pos };
  }

  /** Вся компонента состояний от pos: Map key → pos. null, если больше cap. */
  function explore(pieces, pos, cap) {
    const seen = new Map([[key(pos), pos]]);
    let q = [pos];
    while (q.length) {
      const next = [];
      for (const cur of q) for (const nb of neighbors(pieces, cur)) {
        const k = key(nb.pos);
        if (seen.has(k)) continue;
        seen.set(k, nb.pos);
        if (seen.size > cap) return null;
        next.push(nb.pos);
      }
      q = next;
    }
    return seen;
  }

  /** Расстояние до ближайшего решённого состояния для всей компоненты (ходы обратимы → граф неориентированный). */
  function distances(pieces, comp) {
    const dist = new Map();
    let q = [];
    for (const [k, p] of comp) if (solved(p)) { dist.set(k, 0); q.push(p); }
    let d = 0;
    while (q.length) {
      d++;
      const next = [];
      for (const cur of q) for (const nb of neighbors(pieces, cur)) {
        const k = key(nb.pos);
        if (dist.has(k)) continue;
        dist.set(k, d);
        next.push(nb.pos);
      }
      q = next;
    }
    return dist;
  }

  /**
   * spec: { moves: минимум ходов, pieces: [min, max] фигур кроме 4x4 }
   * → { pieces, pos, moves } — ровно spec.moves ходов до решения.
   */
  function generate(spec, rng, opts = {}) {
    const cap = opts.cap || 30000;
    const maxAttempts = opts.attempts || 4000;
    const [nMin, nMax] = spec.pieces;
    for (let a = 0; a < maxAttempts; a++) {
      const n = nMin + Math.floor(rng() * (nMax - nMin + 1));
      const { pieces, pos } = place(n, rng);
      if (pieces.length < nMin + 1) continue;
      const comp = explore(pieces, pos, cap);
      if (!comp) continue;
      const dist = distances(pieces, comp);
      const hits = [];
      for (const [k, d] of dist) if (d === spec.moves) hits.push(k);
      if (!hits.length) continue;
      const pick = unkey(hits[Math.floor(rng() * hits.length)]);
      // все фигуры должны стоять в поле честно (без пересечений) — проверка на всякий случай
      const g = grid(pieces, pick);
      if (g.filter((x) => x !== -1).length !== pieces.reduce((s, p) => s + p.len, 0)) continue;
      return { pieces, pos: pick, moves: spec.moves, attempts: a + 1 };
    }
    throw new Error('jam: could not generate ' + JSON.stringify(spec));
  }

  // ---------- пазл ↔ строка (пул server/pool.json) ----------
  // Фигура = 4 символа: o (h|v), len, fix, индекс вида; затем '#' и позиции (key).
  const KINDS = ['car', 'zebra', 'hippo', 'rhino', 'elephant', 'log', 'giraffe', 'flamingo'];
  const enc = (pieces, pos) => pieces.map((p) => p.o + p.len + p.fix + KINDS.indexOf(p.kind)).join('') + '#' + key(pos);
  function dec(s) {
    const [ps, k] = s.split('#');
    const pieces = [];
    for (let j = 0; j < ps.length; j += 4) pieces.push({ o: ps[j], len: +ps[j + 1], fix: +ps[j + 2], kind: KINDS[+ps[j + 3]] });
    return { pieces, pos: unkey(k) };
  }

  return { W, EXIT_ROW, GOAL, KINDS, enc, dec, key, unkey, cellsOf, grid, range, canSlide, solved, neighbors, solve, generate, explore, distances };
}));
