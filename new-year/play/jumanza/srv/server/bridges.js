/**
 * Механика 'bridges' — карта 2 Christmas on Kilimanjaro (Jumanza): «Safari Bridges», брёвна через реку (Hashiwokakero).
 * Контракт тот же, что у server/trail.js (формат конкурсов Witching Hours):
 *   create(params, rng, ctx) / view(state, finished) / move(state, input, ctx) / sortKey / finalize / summary.
 *
 * params: {
 *   level: id уровня в общем списке (например 't3'), либо сразу 'practice' | 'b1' | 'b2';
 *   kind:  'practice' | 'b1' | 'b2' — сложность карты 2 (если level — не одно из них);
 *   title, zone — подписи для экрана (по умолчанию свои);
 *   hints — подсказок льва (по умолчанию 3);
 *   seed — строка-сид (по умолчанию берётся из rng) → у каждого игрока своё поле.
 * }
 *
 * Ходы:
 *   { do: 'bridges', s: [[a, b, k], ...] } — поставить между камнями a и b ровно k брёвен (0 — убрать). Пачка атомарна:
 *                                             если хоть одна пара не соседи / k вне 0..2 / бревно пересекает другое —
 *                                             не применяется ничего. Число на камне можно превысить (камень краснеет у
 *                                             игрока), решено только когда check() проходит целиком.
 *   { do: 'reset' }                         — убрать все брёвна.
 *   { do: 'hint' }                          — лев кладёт одну верную пару (или исправляет неверную) и показывает её.
 * Скорость и число ходов на приз не влияют: засчитывается любое корректное решение.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/bridges'));
  else root.BridgesMech = factory(root.Hashi);
}(typeof self !== 'undefined' ? self : this, (H) => {
  const MAX_SETS_PER_MOVE = 40;
  const HINTS = 3;
  const DEFAULTS = {
    practice: { title: 'Practice crossing', zone: 'Base camp river' },
    b1: { title: 'River crossing', zone: 'Mountain river' },
    b2: { title: 'Wild river', zone: 'Waterfall gorge' },
  };

  function kindOf(params) {
    const p = params || {};
    if (p.kind && H.LEVELS[p.kind]) return p.kind;
    if (p.level && H.LEVELS[p.level]) return p.level;
    return null;
  }

  function create(params, rng, ctx = {}) {
    const kind = kindOf(params);
    if (!kind) throw new Error('bridges: bad level ' + JSON.stringify(params));
    rng = rng || Math.random;
    const seed = (params && params.seed) || ('j' + Math.floor(rng() * 4294967296).toString(36) + Math.floor(rng() * 4294967296).toString(36));
    const g = H.generate(kind, seed);
    const d = DEFAULTS[kind];
    return {
      level: (params && params.level) || kind,
      kind,
      title: (params && params.title) || d.title,
      zone: (params && params.zone) || d.zone,
      training: kind === 'practice' || Boolean(params && params.training),
      summit: Boolean(params && params.summit),
      seed,
      puzzle: g.puzzle,
      solution: g.solution, // эталон: только на сервере, в view не уходит
      bridges: [],
      sets: 0, resets: 0,
      hintsLeft: (params && Number.isInteger(params.hints)) ? params.hints : HINTS, hints: 0,
      solved: false,
      peek: null,
      lastAt: ctx.now ?? Date.now(),
    };
  }

  function view(state, finished) {
    return {
      level: state.level, kind: state.kind, title: state.title, zone: state.zone,
      summit: state.summit, training: state.training,
      w: state.puzzle.w, h: state.puzzle.h,
      islands: state.puzzle.islands.map((s) => ({ x: s.x, y: s.y, n: s.n })),
      bridges: state.bridges.map((e) => e.slice()),
      sets: state.sets,
      hintsLeft: state.hintsLeft,
      solved: state.solved,
      done: Boolean(finished) || state.solved,
      peek: state.peek, // только в ответе на ход 'hint'
    };
  }

  function move(state, input, ctx = {}) {
    const now = ctx.now ?? Date.now();
    if (state.solved) return { error: 'finished' };
    state.peek = null;
    const what = input && input.do;

    if (what === 'bridges') {
      const s = input.s;
      if (!Array.isArray(s) || !s.length || s.length > MAX_SETS_PER_MOVE) return { error: 'bad_bridges' };
      // применяем на копии: пачка целиком или ничего
      const cur = new Map(state.bridges.map(([a, b, k]) => [H.pairKey(a, b), k]));
      const valid = new Set(H.pairs(state.puzzle).map((p) => H.pairKey(p.a, p.b)));
      const n = state.puzzle.islands.length;
      for (const st of s) {
        if (!Array.isArray(st) || st.length !== 3 || !st.every(Number.isInteger)) return { error: 'bad_bridges' };
        const [a, b, k] = st;
        if (a < 0 || b < 0 || a >= n || b >= n || a === b || k < 0 || k > 2) return { error: 'bad_bridges' };
        if (!valid.has(H.pairKey(a, b))) return { error: 'not_neighbors', bridges: state.bridges.map((e) => e.slice()) };
        if (k > 0) {
          const list = []; for (const [key, kk] of cur) if (kk > 0) { const [c, d] = key.split(':').map(Number); list.push([c, d, kk]); }
          if (H.crossesAny(state.puzzle, a, b, list)) return { error: 'cross', bridges: state.bridges.map((e) => e.slice()) };
        }
        cur.set(H.pairKey(a, b), k);
      }
      const next = [];
      for (const [key, k] of cur) if (k > 0) { const [a, b] = key.split(':').map(Number); next.push([a, b, k]); }
      next.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      state.bridges = next;
      state.sets += s.length;
    } else if (what === 'reset') {
      state.bridges = [];
      state.resets += 1;
    } else if (what === 'hint') {
      if (state.hintsLeft < 1) return { error: 'no_hints' };
      const h = H.hint(state.puzzle, state.bridges, state.solution);
      if (!h) return { error: 'no_path' };
      const cur = new Map(state.bridges.map(([a, b, k]) => [H.pairKey(a, b), k]));
      cur.set(H.pairKey(h.a, h.b), h.k);
      const next = [];
      for (const [key, k] of cur) if (k > 0) { const [a, b] = key.split(':').map(Number); next.push([a, b, k]); }
      next.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      state.bridges = next;
      state.peek = { a: h.a, b: h.b, k: h.k, left: Math.max(0, h.left - 1) };
      state.hintsLeft -= 1; state.hints += 1;
    } else return { error: 'bad_input' };

    state.lastAt = now;
    if (H.check(state.puzzle, state.bridges).ok) state.solved = true;
    const done = state.solved;
    return { state, done, result: done ? { level: state.level, kind: state.kind, solved: true, sets: state.sets, hints: state.hints, resets: state.resets } : null };
  }

  /** Мест нет (приз = уровень по числу пройденных). Все прошедшие равны, порядок по времени. */
  function sortKey(result, ms) { return result && result.solved ? [0, ms] : null; }

  /** Ивент закрылся, а переправа не построена — уровень остаётся закрытым. */
  function finalize() { return null; }

  const summary = (r) => (r && r.solved ? `crossed · ${r.sets} logs placed` + (r.hints ? ` · lion ${r.hints}` : '') : 'not crossed');

  return { id: 'bridges', create, view, move, sortKey, finalize, summary, MAX_SETS_PER_MOVE, HINTS };
}));
