/*
 * Christmas on Kilimanjaro (Jumanza), карта 3 — «Kilimanjaro Camps» (Tents & Trees). Общий файл для сервера и браузера (UMD).
 *
 * Поле N×N. На поле горные ёлки (trees) и, на вершине, большая новогодняя ёлка 2×2 в центре (blocked — туда ничего нельзя).
 * Нужно поставить по одной палатке на каждую ёлку:
 *   1) палатка стоит ортогонально рядом со «своей» ёлкой (паросочетание палатка ↔ ёлка, одна к одной);
 *   2) палатки не касаются друг друга даже по диагонали;
 *   3) число палаток в каждой строке / колонке = число на краю (rows / cols).
 * Генератор берёт только доски с ЕДИНСТВЕННЫМ решением, но check засчитывает любое корректное.
 *
 * Клетки — индексы r*N + c. Пазл: { level, N, trees:[idx], blocked:[idx], rows:[n], cols:[n] }.
 * Решение (только на сервере): массив индексов палаток (по возрастанию).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Camps = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  /** Уровни карты 3. trees — [min, max] ёлок (= палаток). big — большая ёлка 2×2 в центре. */
  const LEVELS = {
    practice: { id: 'practice', N: 5, trees: [4, 5] },
    c1: { id: 'c1', N: 6, trees: [7, 8] },
    c2: { id: 'c2', N: 7, trees: [10, 11] },
    summit: { id: 'summit', N: 8, trees: [12, 13], big: true },
  };

  // ---------- детерминированный PRNG от строки ----------
  function hashStr(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function rngFrom(seed) {
    let a = hashStr(String(seed));
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---------- геометрия ----------
  function orth(N, i) {
    const r = Math.floor(i / N), c = i % N, out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  }
  function around(N, i) { // 8 соседей
    const r = Math.floor(i / N), c = i % N, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
    }
    return out;
  }
  function bigCells(N) { const a = N / 2 - 1; return [a * N + a, a * N + a + 1, (a + 1) * N + a, (a + 1) * N + a + 1]; }

  /** Есть ли паросочетание, где у каждой палатки своя ортогональная ёлка (Кун). */
  function matches(N, tents, treeSet) {
    const owner = new Map(); // ёлка → индекс палатки
    function aug(t, seen) {
      for (const tr of orth(N, tents[t])) {
        if (!treeSet.has(tr) || seen.has(tr)) continue;
        seen.add(tr);
        if (!owner.has(tr) || aug(owner.get(tr), seen)) { owner.set(tr, t); return true; }
      }
      return false;
    }
    for (let t = 0; t < tents.length; t++) if (!aug(t, new Set())) return false;
    return true;
  }

  /**
   * Проверка ответа игрока. tents — массив индексов клеток. Засчитывается любое корректное решение.
   * → { ok: true } | { ok: false, reason }
   */
  function check(pz, tents) {
    const N = pz.N;
    if (!Array.isArray(tents)) return { ok: false, reason: 'bad_input' };
    const set = new Set();
    const treeSet = new Set(pz.trees), blocked = new Set(pz.blocked || []);
    for (const t of tents) {
      if (!Number.isInteger(t) || t < 0 || t >= N * N) return { ok: false, reason: 'bad_cell' };
      if (treeSet.has(t) || blocked.has(t)) return { ok: false, reason: 'on_tree' };
      if (set.has(t)) return { ok: false, reason: 'duplicate' };
      set.add(t);
    }
    if (set.size !== pz.trees.length) return { ok: false, reason: 'count' };
    const rows = new Array(N).fill(0), cols = new Array(N).fill(0);
    for (const t of set) { rows[Math.floor(t / N)]++; cols[t % N]++; }
    for (let k = 0; k < N; k++) if (rows[k] !== pz.rows[k] || cols[k] !== pz.cols[k]) return { ok: false, reason: 'sums' };
    for (const t of set) for (const n of around(N, t)) if (set.has(n)) return { ok: false, reason: 'touching' };
    if (!matches(N, Array.from(set), treeSet)) return { ok: false, reason: 'no_tree' };
    return { ok: true };
  }

  /**
   * Решатель: перебор по клеткам-кандидатам (рядом с ёлкой) построчно с отсечениями
   * (суммы строк/колонок, касание, у каждой ёлки должна остаться палатка), в конце — паросочетание.
   * → массив решений (индексы палаток), не больше limit.
   */
  function solve(pz, limit) {
    limit = limit || 2;
    const N = pz.N;
    const treeSet = new Set(pz.trees), blocked = new Set(pz.blocked || []);
    const cand = new Uint8Array(N * N);
    for (const tr of pz.trees) for (const n of orth(N, tr)) if (!treeSet.has(n) && !blocked.has(n)) cand[n] = 1;
    // сколько кандидатов осталось в колонке ниже/включая ряд r — для отсечения снизу
    const colLeft = []; // colLeft[r][c] = кандидатов в колонке c в рядах >= r
    for (let r = N; r >= 0; r--) {
      colLeft[r] = new Array(N).fill(0);
      if (r < N) for (let c = 0; c < N; c++) colLeft[r][c] = colLeft[r + 1][c] + cand[r * N + c];
    }
    // ёлки, которые надо проверить после завершения ряда r (их соседи все в рядах <= r)
    const treesDoneAt = Array.from({ length: N }, () => []);
    for (const tr of pz.trees) treesDoneAt[Math.min(N - 1, Math.floor(tr / N) + 1)].push(tr);

    const tent = new Uint8Array(N * N);
    const colCnt = new Array(N).fill(0);
    const out = [];
    let nodes = 0;

    function rowDone(r) {
      for (let c = 0; c < N; c++) {
        if (colCnt[c] > pz.cols[c]) return false;
        if (colCnt[c] + colLeft[r + 1][c] < pz.cols[c]) return false;
      }
      for (const tr of treesDoneAt[r]) if (!orth(N, tr).some((n) => tent[n])) return false;
      return true;
    }

    function rec(r, c, rowCnt) {
      if (out.length >= limit || ++nodes > 2e6) return;
      if (c === N) {
        if (rowCnt !== pz.rows[r]) return;
        if (!rowDone(r)) return;
        if (r === N - 1) {
          const ts = [];
          for (let i = 0; i < N * N; i++) if (tent[i]) ts.push(i);
          if (matches(N, ts, treeSet)) out.push(ts);
          return;
        }
        rec(r + 1, 0, 0);
        return;
      }
      const i = r * N + c;
      // хватит ли кандидатов в остатке ряда
      let left = 0;
      for (let cc = c; cc < N; cc++) left += cand[r * N + cc];
      if (rowCnt + left < pz.rows[r]) return;
      if (cand[i] && rowCnt < pz.rows[r] && colCnt[c] < pz.cols[c]) {
        const ok = !(c > 0 && tent[i - 1]) && !(r > 0 && (tent[i - N] || (c > 0 && tent[i - N - 1]) || (c < N - 1 && tent[i - N + 1])));
        if (ok) {
          tent[i] = 1; colCnt[c]++;
          rec(r, c + 1, rowCnt + 1);
          tent[i] = 0; colCnt[c]--;
        }
      }
      rec(r, c + 1, rowCnt);
    }
    rec(0, 0, 0);
    return out;
  }

  /** Случайная доска: K не касающихся палаток, у каждой ортогональная ёлка. null — не вышло. */
  function place(L, K, rng) {
    const N = L.N;
    const blocked = L.big ? bigCells(N) : [];
    const bl = new Set(blocked);
    const used = new Uint8Array(N * N); // 1 — палатка, 2 — запрещено (касание), 3 — блок
    for (const b of blocked) used[b] = 3;
    const tents = [];
    for (const i of shuffle(Array.from({ length: N * N }, (_, k) => k), rng)) {
      if (tents.length >= K) break;
      if (used[i]) continue;
      // у палатки должна быть хоть одна свободная ортогональная клетка под ёлку
      if (!orth(N, i).some((n) => !bl.has(n))) continue;
      tents.push(i); used[i] = 1;
      for (const n of around(N, i)) if (!used[n]) used[n] = 2;
    }
    if (tents.length < K) return null;
    const trees = new Set();
    const tset = new Set(tents);
    for (const t of shuffle(tents.slice(), rng)) {
      const opts = orth(N, t).filter((n) => !tset.has(n) && !bl.has(n) && !trees.has(n));
      if (!opts.length) return null;
      trees.add(opts[Math.floor(rng() * opts.length)]);
    }
    const rows = new Array(N).fill(0), cols = new Array(N).fill(0);
    for (const t of tents) { rows[Math.floor(t / N)]++; cols[t % N]++; }
    return {
      pz: { level: L.id, N, trees: Array.from(trees).sort((a, b) => a - b), blocked, rows, cols },
      solution: tents.sort((a, b) => a - b),
    };
  }

  /**
   * generate(levelId, seed) → { puzzle, solution, attempts }. Детерминированно от (levelId, seed).
   * Только доски с единственным решением.
   */
  function generate(levelId, seed, opts) {
    const L = LEVELS[levelId];
    if (!L) throw new Error('camps: bad level ' + levelId);
    const rng = rngFrom(levelId + '|' + seed);
    const maxAttempts = (opts && opts.attempts) || 3000;
    for (let a = 1; a <= maxAttempts; a++) {
      const K = L.trees[0] + Math.floor(rng() * (L.trees[1] - L.trees[0] + 1));
      const b = place(L, K, rng);
      if (!b) continue;
      const sols = solve(b.pz, 2);
      if (sols.length !== 1) continue;
      return { puzzle: b.pz, solution: b.solution, attempts: a };
    }
    throw new Error('camps: could not generate ' + levelId + ' / ' + seed);
  }

  /**
   * Подсказка льва. marks — массив N*N: 0 пусто, 1 снег (✕), 2 палатка.
   * Сначала указывает на неверную палатку игрока, иначе ставит одну верную и даёт клетки вокруг, где палаток точно нет.
   * → { cell, kind: 'wrong' } | { cell, kind: 'tent', clear:[idx] } | null (всё уже стоит)
   */
  function hint(pz, marks, solution) {
    const N = pz.N;
    const sol = new Set(solution);
    const treeSet = new Set(pz.trees), blocked = new Set(pz.blocked || []);
    for (let i = 0; i < N * N; i++) if (marks[i] === 2 && !sol.has(i)) return { cell: i, kind: 'wrong' };
    // верная палатка, которую игрок ещё не поставил; сначала те, что он не завалил снегом по ошибке
    const missing = solution.filter((i) => marks[i] !== 2);
    if (!missing.length) return null;
    const pick = missing.find((i) => marks[i] !== 1) ?? missing[0];
    const clear = around(N, pick).filter((n) => !treeSet.has(n) && !blocked.has(n) && !sol.has(n));
    return { cell: pick, kind: 'tent', clear };
  }

  /** Состояние строк/колонок для подсветки чисел: 'ok' | 'over' | '' */
  function lineState(pz, marks) {
    const N = pz.N, rows = new Array(N).fill(0), cols = new Array(N).fill(0);
    for (let i = 0; i < N * N; i++) if (marks[i] === 2) { rows[Math.floor(i / N)]++; cols[i % N]++; }
    const st = (have, need) => (have === need ? 'ok' : have > need ? 'over' : '');
    return { rows: rows.map((h, k) => st(h, pz.rows[k])), cols: cols.map((h, k) => st(h, pz.cols[k])), rowsHave: rows, colsHave: cols };
  }

  /** Палатки, которые касаются другой палатки (для красной подсветки). */
  function touching(pz, marks) {
    const N = pz.N, bad = [];
    for (let i = 0; i < N * N; i++) if (marks[i] === 2 && around(N, i).some((n) => marks[n] === 2)) bad.push(i);
    return bad;
  }

  const tentsOf = (marks) => { const t = []; for (let i = 0; i < marks.length; i++) if (marks[i] === 2) t.push(i); return t; };

  return { LEVELS, rngFrom, hashStr, orth, around, bigCells, matches, check, solve, place, generate, hint, lineState, touching, tentsOf };
}));
