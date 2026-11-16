// node engine/simulate.js — сколько попыток нужно на замок при 6/7/8 символах (4 позиции, без повторов, 8 попыток).
// Две модели игрока:
//  smart  — каждый раз ставит код, совместимый со ВСЕМИ подсказками (внимательный игрок);
//  casual — держит зелёные, не ставит серые, жёлтый переносит на другое место, остальное наугад
//           (не сверяет всю историю — так играет человек «на глаз»).
// Дворецкий: после 5 промахов, если ещё не решено, игрок зовёт его (так сделает почти каждый).
const L = require('./vault-lock');

function perms(n) {
  const out = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) for (let d = 0; d < n; d++)
    if (new Set([a, b, c, d]).size === 4) out.push([a, b, c, d]);
  return out;
}
const same = (x, y) => x.every((v, i) => v === y[i]);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function smartGuess(s, all) {
  const c = all.filter((g) => (!s.butler || g[s.butler.pos] === s.butler.sym) && s.guesses.every((h) => same(L.feedback(h.guess, g), h.fb)));
  return pick(c);
}
function casualGuess(s) {
  const n = s.n, g = [null, null, null, null];
  const gray = new Set(), yellowAt = {};
  s.guesses.forEach((h) => h.guess.forEach((v, i) => {
    if (h.fb[i] === 2) g[i] = v;
    else if (h.fb[i] === 1) (yellowAt[v] = yellowAt[v] || new Set()).add(i);
    else gray.add(v);
  }));
  if (s.butler) g[s.butler.pos] = s.butler.sym;
  const used = new Set(g.filter((v) => v !== null));
  // жёлтые — на свободное место, где они ещё не стояли
  Object.keys(yellowAt).map(Number).forEach((v) => {
    if (used.has(v)) return;
    const spots = [0, 1, 2, 3].filter((i) => g[i] === null && !yellowAt[v].has(i));
    if (spots.length) { g[pick(spots)] = v; used.add(v); }
  });
  const pool = [...Array(n).keys()].filter((v) => !used.has(v) && !gray.has(v));
  const fallback = [...Array(n).keys()].filter((v) => !used.has(v));
  for (let i = 0; i < 4; i++) if (g[i] === null) {
    const p = pool.filter((v) => !used.has(v));
    const v = p.length ? pick(p) : pick(fallback.filter((x) => !used.has(x)));
    g[i] = v; used.add(v);
  }
  return g;
}

function play(n, model, all) {
  const s = L.create({ symbols: n });
  let now = 0, r;
  while (s.status === 'open') {
    if (L.butlerAvailable(s)) L.move(s, { butler: true });
    const g = model === 'smart' ? smartGuess(s, all) : casualGuess(s);
    r = L.move(s, { guess: g }, { now: (now += 2000) });
    if (r.error) throw new Error(r.error + ' ' + g);
  }
  return r.result;
}

const RUNS = +process.argv[2] || 4000;
const rows = [];
for (const n of [6, 7, 8]) {
  const all = perms(n);
  for (const model of ['smart', 'casual']) {
    let solved = 0, tries = 0, butler = 0, score = 0;
    for (let k = 0; k < RUNS; k++) {
      const r = play(n, model, all);
      if (r.solved) { solved++; tries += r.tries; score += r.score; }
      if (r.butler) butler++;
    }
    rows.push({ symbols: n, model, solved: (100 * solved / RUNS).toFixed(1) + '%', avgTries: (tries / solved).toFixed(2), avgScore: (score / solved).toFixed(2), butler: (100 * butler / RUNS).toFixed(1) + '%' });
  }
}
console.table(rows);
