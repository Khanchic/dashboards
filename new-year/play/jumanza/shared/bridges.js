/*
 * Christmas on Kilimanjaro (Jumanza), карта 2 — «Safari Bridges» (Hashiwokakero). Общий файл для сервера и браузера (UMD).
 *
 * Поле w×h. На нём камни-островки с числом n. Игрок кладёт брёвна между соседними камнями (одна строка или колонка,
 * между ними нет других камней): 1 или 2 бревна на пару. Решено, когда
 *   1) у каждого камня брёвен ровно n;
 *   2) брёвна не пересекаются;
 *   3) все камни связаны в одну сеть.
 * Засчитывается ЛЮБОЕ решение, удовлетворяющее этим правилам (единственность не нужна).
 *
 * Пазл: { w, h, islands: [{ x, y, n }] } — камни отсортированы по (y, x), индекс камня = номер в массиве.
 * Брёвна: [[a, b, k], ...] — a < b индексы камней, k ∈ {1, 2}. k = 0 — пары нет.
 *
 * Генератор: растим остовное дерево из случайного камня (новый камень на расстоянии ≥ 2 по прямой, путь свободен,
 * не пересекает уже положенные брёвна, камни не соседствуют вплотную) → добавляем часть «лишних» непересекающихся рёбер
 * (циклы = развилки) → случайно удваиваем брёвна в пределах maxDeg → числа на камнях = степени. Решаемость гарантирована
 * построением, эталон хранится только на сервере.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Hashi = factory();
}(typeof self !== 'undefined' ? self : this, () => {
  /** Уровни карты 2. islands — [min, max]; extra — доля «лишних» рёбер (циклы); dbl — шанс удвоить бревно; minDbl — минимум двойных. */
  const LEVELS = {
    practice: { w: 4, h: 4, islands: [4, 4], maxDeg: 3, extra: 0.2, dbl: 0.4, minDbl: 1 },
    b1: { w: 5, h: 5, islands: [6, 7], maxDeg: 3, extra: 0.3, dbl: 0.35, minDbl: 1 },
    b2: { w: 6, h: 6, islands: [8, 10], maxDeg: 4, extra: 0.4, dbl: 0.45, minDbl: 2 },
  };

  // ---------- детерминированный PRNG по строке ----------
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
  }
  function rngFrom(seed) {
    if (typeof seed === 'function') return seed;
    let a = hashSeed(String(seed))();
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

  // ---------- геометрия ----------
  const pairKey = (a, b) => (a < b ? a + ':' + b : b + ':' + a);

  /** Все пары соседних камней: [{ a, b, o: 'h'|'v' }] (a < b). */
  function pairs(pz) {
    const at = new Map(pz.islands.map((s, i) => [s.x + ',' + s.y, i]));
    const out = [];
    pz.islands.forEach((s, i) => {
      for (let x = s.x + 1; x < pz.w; x++) { const j = at.get(x + ',' + s.y); if (j !== undefined) { out.push({ a: Math.min(i, j), b: Math.max(i, j), o: 'h' }); break; } }
      for (let y = s.y + 1; y < pz.h; y++) { const j = at.get(s.x + ',' + y); if (j !== undefined) { out.push({ a: Math.min(i, j), b: Math.max(i, j), o: 'v' }); break; } }
    });
    return out;
  }

  /** Отрезок пары в координатах сетки. */
  function seg(pz, a, b) {
    const A = pz.islands[a], B = pz.islands[b];
    if (A.y === B.y) return { o: 'h', y: A.y, lo: Math.min(A.x, B.x), hi: Math.max(A.x, B.x) };
    return { o: 'v', x: A.x, lo: Math.min(A.y, B.y), hi: Math.max(A.y, B.y) };
  }

  /** Пересекаются ли два отрезка (горизонтальный и вертикальный, внутренними точками). */
  function crossSeg(s, t) {
    if (s.o === t.o) return false;
    const H = s.o === 'h' ? s : t, V = s.o === 'h' ? t : s;
    return V.x > H.lo && V.x < H.hi && H.y > V.lo && H.y < V.hi;
  }

  /** Пересекает ли пара (a,b) хоть одно из брёвен list (без самой пары). */
  function crossesAny(pz, a, b, list) {
    const s = seg(pz, a, b);
    for (const [c, d, k] of list) {
      if (!k || (pairKey(c, d) === pairKey(a, b))) continue;
      if (crossSeg(s, seg(pz, c, d))) return [c, d];
    }
    return null;
  }

  // ---------- нормализация и проверка ----------
  /** Приводит ввод к [[a,b,k]] (a<b, k 1..2, без повторов) или возвращает { error }. */
  function normalize(pz, bridges) {
    if (!Array.isArray(bridges)) return { error: 'format' };
    const n = pz.islands.length;
    const valid = new Set(pairs(pz).map((p) => pairKey(p.a, p.b)));
    const seen = new Map();
    for (const e of bridges) {
      if (!Array.isArray(e) || e.length !== 3) return { error: 'format' };
      let [a, b, k] = e;
      if (![a, b, k].every(Number.isInteger) || a < 0 || b < 0 || a >= n || b >= n || a === b) return { error: 'format' };
      if (k < 0 || k > 2) return { error: 'too_many' };
      if (a > b) [a, b] = [b, a];
      if (!valid.has(pairKey(a, b))) return { error: 'not_neighbors' };
      if (seen.has(pairKey(a, b))) return { error: 'format' };
      seen.set(pairKey(a, b), k);
    }
    const list = [];
    for (const [key, k] of seen) if (k > 0) { const [a, b] = key.split(':').map(Number); list.push([a, b, k]); }
    list.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    return { list };
  }

  function degrees(pz, list) {
    const d = new Array(pz.islands.length).fill(0);
    for (const [a, b, k] of list) { d[a] += k; d[b] += k; }
    return d;
  }

  function connected(n, list) {
    if (n <= 1) return true;
    const adj = Array.from({ length: n }, () => []);
    for (const [a, b, k] of list) if (k) { adj[a].push(b); adj[b].push(a); }
    const seen = new Set([0]); const q = [0];
    while (q.length) { const v = q.pop(); for (const u of adj[v]) if (!seen.has(u)) { seen.add(u); q.push(u); } }
    return seen.size === n;
  }

  /** check(puzzle, bridges) → { ok: true } | { ok: false, reason: format|not_neighbors|too_many|cross|degree|disconnected } */
  function check(pz, bridges) {
    const nb = normalize(pz, bridges);
    if (nb.error) return { ok: false, reason: nb.error };
    const list = nb.list;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (crossSeg(seg(pz, list[i][0], list[i][1]), seg(pz, list[j][0], list[j][1]))) return { ok: false, reason: 'cross' };
    }
    const d = degrees(pz, list);
    for (let i = 0; i < d.length; i++) if (d[i] !== pz.islands[i].n) return { ok: false, reason: 'degree', island: i };
    if (!connected(pz.islands.length, list)) return { ok: false, reason: 'disconnected' };
    return { ok: true };
  }

  // ---------- решатель (для подсказок; пазлы маленькие) ----------
  /**
   * solve(pz, { fixed: [[a,b,k]], prefer: [[a,b,k]], limit }) → [[a,b,k]] | null.
   * fixed — эти пары обязаны иметь ровно такое k; prefer — порядок перебора начинается с этого k (решение «ближе к игроку»).
   */
  function solve(pz, opts = {}) {
    const P = pairs(pz), n = pz.islands.length, need = pz.islands.map((s) => s.n);
    const segs = P.map((p) => seg(pz, p.a, p.b));
    const fixed = new Map((opts.fixed || []).map(([a, b, k]) => [pairKey(a, b), k]));
    const prefer = new Map((opts.prefer || []).map(([a, b, k]) => [pairKey(a, b), k]));
    const crossWith = P.map((_, i) => P.map((__, j) => (i !== j && crossSeg(segs[i], segs[j]))));
    const inc = Array.from({ length: n }, () => []);
    P.forEach((p, i) => { inc[p.a].push(i); inc[p.b].push(i); });
    // порядок: сначала пары камней с малым числом соседей (сильнее ограничены)
    const order = P.map((_, i) => i).sort((i, j) => (inc[P[i].a].length + inc[P[i].b].length) - (inc[P[j].a].length + inc[P[j].b].length));
    const val = new Array(P.length).fill(-1);
    const deg = new Array(n).fill(0);
    let steps = 0; const limit = opts.limit || 200000;

    function capLeft(v) { // сколько ещё максимум можно добавить камню v по нерешённым парам
      let c = 0;
      for (const e of inc[v]) if (val[e] < 0) {
        let blocked = false;
        for (let f = 0; f < P.length; f++) if (crossWith[e][f] && val[f] > 0) { blocked = true; break; }
        if (!blocked) c += 2;
      }
      return c;
    }
    function feasible(v) { return deg[v] <= need[v] && deg[v] + capLeft(v) >= need[v]; }

    function rec(idx) {
      if (++steps > limit) return null;
      if (idx === order.length) {
        for (let v = 0; v < n; v++) if (deg[v] !== need[v]) return false;
        const list = []; P.forEach((p, i) => { if (val[i] > 0) list.push([p.a, p.b, val[i]]); });
        return connected(n, list) ? list : false;
      }
      const e = order[idx], p = P[e];
      let opts3 = [0, 1, 2];
      const fk = fixed.get(pairKey(p.a, p.b));
      if (fk !== undefined) opts3 = [fk];
      else { const pk = prefer.get(pairKey(p.a, p.b)); if (pk !== undefined) opts3 = [pk].concat([0, 1, 2].filter((x) => x !== pk)); }
      for (const k of opts3) {
        if (k > 0) {
          let bad = false;
          for (let f = 0; f < P.length; f++) if (crossWith[e][f] && val[f] > 0) { bad = true; break; }
          if (bad) continue;
        }
        val[e] = k; deg[p.a] += k; deg[p.b] += k;
        let ok = feasible(p.a) && feasible(p.b);
        if (ok && k > 0) { // брёвна могли заблокировать чужие пары — проверим затронутых
          for (let f = 0; f < P.length && ok; f++) if (crossWith[e][f] && val[f] < 0) ok = feasible(P[f].a) && feasible(P[f].b);
        }
        if (ok) { const r = rec(idx + 1); if (r) return r; if (r === null) { val[e] = -1; deg[p.a] -= k; deg[p.b] -= k; return null; } }
        val[e] = -1; deg[p.a] -= k; deg[p.b] -= k;
      }
      return false;
    }
    const r = rec(0);
    return r || null;
  }

  /**
   * hint(puzzle, bridges, solution) → { a, b, k, left } | null — одна пара, которую надо поставить в k (0 = убрать).
   * Сначала ищем решение, в котором все брёвна игрока на месте (тогда подсказка просто добавляет верное бревно).
   * Если такого нет — решение, максимально близкое к раскладке игрока, и подсказка исправляет неверное бревно.
   * solution — эталон на случай, если решатель упёрся в лимит.
   */
  function hint(pz, bridges, solution) {
    const nb = normalize(pz, bridges || []);
    const cur = nb.error ? [] : nb.list;
    let target = solve(pz, { fixed: cur }) || solve(pz, { prefer: cur }) || solution;
    if (!target) return null;
    const have = new Map(cur.map(([a, b, k]) => [pairKey(a, b), k]));
    const want = new Map(target.map(([a, b, k]) => [pairKey(a, b), k]));
    const diff = [];
    for (const key of new Set([...have.keys(), ...want.keys()])) {
      const h = have.get(key) || 0, w = want.get(key) || 0;
      if (h !== w) { const [a, b] = key.split(':').map(Number); diff.push({ a, b, k: w, wrong: h > w }); }
    }
    if (!diff.length) return null;
    diff.sort((p, q) => (q.wrong - p.wrong) || p.a - q.a || p.b - q.b); // сперва неверные, потом недостающие
    const d = diff[0];
    return { a: d.a, b: d.b, k: d.k, left: diff.length };
  }

  // ---------- генератор ----------
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function tryBuild(spec, rng) {
    const { w, h } = spec;
    const target = spec.islands[0] + Math.floor(rng() * (spec.islands[1] - spec.islands[0] + 1));
    const grid = new Array(w * h).fill(-1); // -1 пусто, >=0 камень, -2 под бревном
    const isl = [];
    const edges = []; // [a,b,1]
    const edgeCount = [];
    const put = (x, y) => { grid[y * w + x] = isl.length; isl.push({ x, y }); edgeCount.push(0); return isl.length - 1; };
    const freeAround = (x, y) => DIRS.every(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= w || Y >= h || grid[Y * w + X] < 0; });
    put(Math.floor(rng() * w), Math.floor(rng() * h));
    let guard = 0;
    while (isl.length < target && guard++ < 400) {
      const from = Math.floor(rng() * isl.length);
      if (edgeCount[from] >= spec.maxDeg) continue;
      const [dx, dy] = pick(DIRS, rng);
      const S = isl[from];
      const maxLen = dx ? w : h;
      const len = 2 + Math.floor(rng() * (maxLen - 2));
      const X = S.x + dx * len, Y = S.y + dy * len;
      if (X < 0 || Y < 0 || X >= w || Y >= h || grid[Y * w + X] !== -1) continue;
      let ok = true;
      for (let t = 1; t < len; t++) { if (grid[(S.y + dy * t) * w + (S.x + dx * t)] !== -1) { ok = false; break; } }
      if (!ok || !freeAround(X, Y)) continue;
      const j = put(X, Y);
      for (let t = 1; t < len; t++) grid[(S.y + dy * t) * w + (S.x + dx * t)] = -2;
      edges.push([Math.min(from, j), Math.max(from, j), 1]);
      edgeCount[from]++; edgeCount[j]++;
    }
    if (isl.length < spec.islands[0]) return null;

    // переиндексация по (y, x)
    const order = isl.map((s, i) => i).sort((i, j) => isl[i].y - isl[j].y || isl[i].x - isl[j].x);
    const re = new Array(isl.length); order.forEach((old, nw) => { re[old] = nw; });
    const pz = { w, h, islands: order.map((i) => ({ x: isl[i].x, y: isl[i].y, n: 0 })) };
    let list = edges.map(([a, b, k]) => { const A = re[a], B = re[b]; return [Math.min(A, B), Math.max(A, B), k]; });
    const cnt = new Array(isl.length).fill(0); list.forEach(([a, b]) => { cnt[a]++; cnt[b]++; });

    // соседство могло поменяться (новый камень встал между двумя старыми, связанными деревом? нет — клетки под бревном заняты);
    // но ребро дерева обязано остаться парой соседей — проверим на всякий случай
    const valid = new Set(pairs(pz).map((p) => pairKey(p.a, p.b)));
    if (!list.every(([a, b]) => valid.has(pairKey(a, b)))) return null;

    // «лишние» рёбра: циклы и развилки
    const have = new Set(list.map(([a, b]) => pairKey(a, b)));
    const cand = pairs(pz).filter((p) => !have.has(pairKey(p.a, p.b)));
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    for (const p of cand) {
      if (rng() > spec.extra) continue;
      if (cnt[p.a] + 1 > spec.maxDeg || cnt[p.b] + 1 > spec.maxDeg) continue;
      if (crossesAny(pz, p.a, p.b, list)) continue;
      list.push([p.a, p.b, 1]); cnt[p.a]++; cnt[p.b]++;
    }

    // удвоение брёвен
    let dbl = 0;
    const deg = new Array(isl.length).fill(0); list.forEach(([a, b]) => { deg[a]++; deg[b]++; });
    const idx = list.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    for (const i of idx) {
      const [a, b] = list[i];
      if (rng() < spec.dbl && deg[a] + 1 <= spec.maxDeg && deg[b] + 1 <= spec.maxDeg) { list[i][2] = 2; deg[a]++; deg[b]++; dbl++; }
    }
    if (dbl < (spec.minDbl || 0)) return null;
    if (Math.max(...deg) > spec.maxDeg) return null;

    pz.islands.forEach((s, i) => { s.n = deg[i]; });
    list.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    return { puzzle: pz, solution: list };
  }

  /**
   * generate(spec | levelId, seed) → { puzzle, solution, attempts }.
   * seed — строка (детерминированно) или функция rng.
   */
  function generate(spec, seed) {
    if (typeof spec === 'string') spec = LEVELS[spec];
    if (!spec) throw new Error('bridges: bad spec');
    const rng = rngFrom(seed === undefined ? Math.random() : seed);
    for (let a = 1; a <= 500; a++) {
      const r = tryBuild(spec, rng);
      if (r && check(r.puzzle, r.solution).ok) return { puzzle: r.puzzle, solution: r.solution, attempts: a };
    }
    throw new Error('bridges: could not generate ' + JSON.stringify(spec));
  }

  return { LEVELS, rngFrom, pairs, seg, crossSeg, crossesAny, pairKey, normalize, degrees, connected, check, solve, hint, generate };
}));
