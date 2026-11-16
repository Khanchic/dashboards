/**
 * Coin Sort — правила, решатель, генератор. Общий для сервера и клиента (UMD: Node → module.exports, браузер → window.Coins).
 *
 * Банка = массив цветов снизу вверх (числа 0..colors-1), вместимость cap. Монет каждого цвета ровно cap.
 * Ход «пересыпать» (from → to): берётся верхняя серия одного цвета и переезжает, сколько влезет, если целевая банка
 * пустая или сверху у неё тот же цвет. Банка разобрана, когда каждая стопка либо пустая, либо полная одного цвета.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Coins = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const top = (j) => (j.length ? j[j.length - 1] : -1);
  function runLen(j) {
    if (!j.length) return 0;
    const c = j[j.length - 1];
    let n = 0;
    for (let i = j.length - 1; i >= 0 && j[i] === c; i--) n++;
    return n;
  }
  const uniform = (j) => j.length > 0 && runLen(j) === j.length;
  const clone = (jars) => jars.map((j) => j.slice());

  /** Сколько монет переедет from → to (0 — ход невозможен). */
  function canPour(jars, cap, f, t) {
    if (!Number.isInteger(f) || !Number.isInteger(t) || f === t) return 0;
    if (f < 0 || t < 0 || f >= jars.length || t >= jars.length) return 0;
    const a = jars[f], b = jars[t];
    if (!a.length || b.length >= cap) return 0;
    if (b.length && top(b) !== top(a)) return 0;
    return Math.min(runLen(a), cap - b.length);
  }
  /** Пересыпать на месте. Возвращает число переехавших монет (0 — ничего не сделано). */
  function pour(jars, cap, f, t) {
    const n = canPour(jars, cap, f, t);
    for (let i = 0; i < n; i++) jars[t].push(jars[f].pop());
    return n;
  }
  /** Обратный ход для undo: n монет обратно to → from (без проверок правил — это откат). */
  function unpour(jars, f, t, n) { for (let i = 0; i < n; i++) jars[f].push(jars[t].pop()); }

  function isDone(jars, cap) { return jars.every((j) => j.length === 0 || (j.length === cap && uniform(j))); }

  /** Ход, который что-то меняет по сути: пересыпать однородную стопку в пустую банку — бессмысленно. */
  function useful(jars, cap, f, t) {
    const n = canPour(jars, cap, f, t);
    if (!n) return false;
    if (!jars[t].length && uniform(jars[f])) return false;
    return true;
  }
  /** Есть ли хоть один полезный ход. Нет → игрок застрял: undo или restart. */
  function hasMoves(jars, cap) {
    for (let f = 0; f < jars.length; f++) for (let t = 0; t < jars.length; t++) if (useful(jars, cap, f, t)) return true;
    return false;
  }

  const key = (jars) => jars.map((j) => j.join('.')).sort().join('|');

  /**
   * Решатель: поиск в глубину с памятью состояний (банки без учёта порядка) и порядком «сначала на свой цвет».
   * Находит какое-то решение (не обязательно кратчайшее). limit — потолок узлов, depth — потолок длины пути.
   * → { ok, moves: [[from, to], ...] | null, nodes }
   */
  function solve(jars0, cap, opts = {}) {
    const limit = opts.limit || 60000;
    const maxDepth = opts.depth || 400;
    const jars = clone(jars0);
    const seen = new Set();
    const path = [];
    let nodes = 0, aborted = false;

    function dfs(depth) {
      if (isDone(jars, cap)) return true;
      if (++nodes > limit) { aborted = true; return false; }
      if (depth >= maxDepth) return false;
      const k = key(jars);
      if (seen.has(k)) return false;
      seen.add(k);
      const moves = [];
      for (let f = 0; f < jars.length; f++) {
        if (!jars[f].length) continue;
        let emptyTried = false;
        const run = runLen(jars[f]);
        for (let t = 0; t < jars.length; t++) {
          const n = canPour(jars, cap, f, t);
          if (!n) continue;
          const b = jars[t];
          if (!b.length) {
            if (uniform(jars[f]) || emptyTried) continue; // все пустые банки одинаковы
            emptyTried = true;
          }
          let score = 0;
          if (b.length) score += 4;                         // на свой цвет
          if (n === run) score += 2;                         // серия переехала целиком
          if (b.length + n === cap && uniform(b)) score += 3; // стопка собрана
          if (jars[f].length === n) score += 1;              // освобождает банку
          moves.push([score, f, t]);
        }
      }
      moves.sort((x, y) => y[0] - x[0]);
      for (const [, f, t] of moves) {
        const n = pour(jars, cap, f, t);
        path.push([f, t]);
        if (dfs(depth + 1)) return true;
        path.pop();
        unpour(jars, f, t, n);
        if (aborted) return false;
      }
      return false;
    }
    const ok = dfs(0);
    return { ok, moves: ok ? path.slice() : null, nodes, aborted };
  }

  /** Перемешать монеты так, чтобы банка была честной: без готовых стопок, с решением и не короче minMoves. */
  function generate(level, rng) {
    const r = rng || Math.random;
    const { colors, cap } = level;
    const empty = level.empty ?? 2;
    const minMoves = level.minMoves ?? colors * 2;
    for (let tries = 0; tries < 400; tries++) {
      const coins = [];
      for (let c = 0; c < colors; c++) for (let k = 0; k < cap; k++) coins.push(c);
      for (let i = coins.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = coins[i]; coins[i] = coins[j]; coins[j] = x; }
      const jars = [];
      for (let i = 0; i < colors; i++) jars.push(coins.slice(i * cap, (i + 1) * cap));
      if (!fair(jars, colors)) continue;
      for (let e = 0; e < empty; e++) jars.push([]);
      const s = solve(jars, cap, { limit: 40000 });
      if (!s.ok || s.moves.length < minMoves) continue;
      return { jars, cap, colors, tries: tries + 1, solution: s.moves.length };
    }
    throw new Error('coins: generate failed for ' + colors + '×' + cap);
  }
  /** Перемешано по-настоящему: ни одной серии длиннее 2 и мало соседних одинаковых монет. */
  function fair(jars, colors) {
    let pairs = 0;
    for (const j of jars) {
      let run = 1;
      for (let i = 1; i < j.length; i++) {
        if (j[i] === j[i - 1]) { pairs++; run++; if (run > 2) return false; } else run = 1;
      }
    }
    return pairs <= Math.floor(colors / 2) + 1;
  }

  return { top, runLen, uniform, clone, canPour, pour, unpour, isDone, useful, hasMoves, key, solve, generate, fair };
});
