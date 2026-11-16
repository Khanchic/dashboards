// node engine/simulate-ladder.js [runs] — лестница сложности: каждый следующий замок сложнее.
// Рычаги: символов на барабане (6→8), повторы в коде, число попыток. Дворецкий — когда осталось 3 попытки.
// Модели игрока как в simulate-variants.js: smart / casual / sloppy (30% попыток забывает подсказки).
function feedback(g, s) {
  const r = new Array(s.length).fill(0), left = {};
  for (let i = 0; i < s.length; i++) { if (g[i] === s[i]) r[i] = 2; else left[s[i]] = (left[s[i]] || 0) + 1; }
  for (let i = 0; i < s.length; i++) if (r[i] !== 2 && left[g[i]] > 0) { r[i] = 1; left[g[i]]--; }
  return r;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const same = (a, b) => a.every((v, i) => v === b[i]);
const cache = {};
function space(n, rep) {
  const k = n + ':' + rep; if (cache[k]) return cache[k];
  const out = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = 0; c < n; c++) for (let d = 0; d < n; d++)
    if (rep || new Set([a, b, c, d]).size === 4) out.push([a, b, c, d]);
  return (cache[k] = out);
}
function secretOf(n, rep) {
  if (rep) return Array.from({ length: 4 }, () => Math.floor(Math.random() * n));
  return [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, 4);
}
function casual(st, n, rep, sloppy) {
  const g = [null, null, null, null], gray = new Set(), yAt = {};
  st.hist.forEach((h) => h.g.forEach((v, i) => {
    if (h.fb[i] === 2) g[i] = v; else if (h.fb[i] === 1) (yAt[v] = yAt[v] || new Set()).add(i); else gray.add(v);
  }));
  if (st.butler) g[st.butler.pos] = st.butler.sym;
  const forget = sloppy && Math.random() < 0.3;
  const used = new Set(g.filter((v) => v !== null));
  if (!forget) Object.keys(yAt).map(Number).forEach((v) => {
    if (!rep && used.has(v)) return;
    const spots = [0, 1, 2, 3].filter((i) => g[i] === null && !yAt[v].has(i));
    if (spots.length) { g[pick(spots)] = v; used.add(v); }
  });
  for (let i = 0; i < 4; i++) if (g[i] === null) {
    let pool = [...Array(n).keys()].filter((v) => (rep || !used.has(v)) && (forget || !gray.has(v)));
    if (!pool.length) pool = [...Array(n).keys()].filter((v) => rep || !used.has(v));
    g[i] = pick(pool); used.add(g[i]);
  }
  return g;
}
function lock(cfg, model) {
  const { n, rep, tries } = cfg, s = secretOf(n, rep), st = { hist: [], butler: null };
  while (st.hist.length < tries) {
    if (!st.butler && st.hist.length >= tries - 3) {
      const green = new Set(); st.hist.forEach((h) => h.fb.forEach((v, i) => v === 2 && green.add(i)));
      const free = [0, 1, 2, 3].filter((i) => !green.has(i)); const p = pick(free.length ? free : [0, 1, 2, 3]);
      st.butler = { pos: p, sym: s[p] };
    }
    const g = model === 'smart'
      ? pick(space(n, rep).filter((c) => (!st.butler || c[st.butler.pos] === st.butler.sym) && st.hist.every((h) => same(feedback(h.g, c), h.fb))))
      : casual(st, n, rep, model === 'sloppy');
    const fb = feedback(g, s); st.hist.push({ g, fb });
    if (fb.every((v) => v === 2)) return { ok: true, tries: st.hist.length, butler: !!st.butler };
  }
  return { ok: false, tries, butler: !!st.butler };
}
const LADDERS = {
  A: [
    { n: 6, rep: false, tries: 8 }, { n: 7, rep: false, tries: 8 }, { n: 8, rep: false, tries: 8 },
    { n: 6, rep: true, tries: 7 }, { n: 7, rep: true, tries: 7 }, { n: 8, rep: true, tries: 6 }, { n: 8, rep: true, tries: 5 },
  ],
  B: [
    { n: 6, rep: false, tries: 8 }, { n: 7, rep: false, tries: 7 }, { n: 8, rep: false, tries: 6 },
    { n: 7, rep: true, tries: 7 }, { n: 8, rep: true, tries: 7 }, { n: 8, rep: true, tries: 6 }, { n: 8, rep: true, tries: 5 },
  ],
};
const RUNS = +process.argv[2] || 1500;
for (const [name, L] of Object.entries(LADDERS)) {
  const rows = L.map((cfg, i) => {
    const r = { lock: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][i], setup: `4 из ${cfg.n}${cfg.rep ? ', повторы' : ''}, ${cfg.tries} поп.` };
    for (const m of ['smart', 'casual', 'sloppy']) {
      let ok = 0, t = 0, b = 0;
      for (let k = 0; k < RUNS; k++) { const x = lock(cfg, m); if (x.ok) { ok++; t += x.tries; } if (x.butler) b++; }
      r[m] = `${Math.round(100 * ok / RUNS)}% · ${(t / Math.max(ok, 1)).toFixed(1)} · дв ${Math.round(100 * b / RUNS)}%`;
    }
    return r;
  });
  console.log('Ladder ' + name); console.table(rows);
}
