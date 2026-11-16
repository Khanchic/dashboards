// node engine/simulate-variants.js — рычаги сложности: длина кода, число символов, повторы, число попыток.
// Модели: smart (совместим со всей историей), casual (зелёные держит, серые не ставит, жёлтый двигает,
// остальное наугад), sloppy (casual, но в 30% попыток забывает про серые и жёлтые — ставит наугад).
// Дворецкий после 5 промахов. Без ограничения «1 попытка в секунду» (не влияет на результат).
function feedback(g, s) {
  const r = new Array(s.length).fill(0), left = {};
  for (let i = 0; i < s.length; i++) { if (g[i] === s[i]) r[i] = 2; else left[s[i]] = (left[s[i]] || 0) + 1; }
  for (let i = 0; i < s.length; i++) if (r[i] !== 2 && left[g[i]] > 0) { r[i] = 1; left[g[i]]--; }
  return r;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const same = (a, b) => a.every((v, i) => v === b[i]);
function space(n, len, rep) {
  const out = [];
  (function rec(pre) {
    if (pre.length === len) { out.push(pre.slice()); return; }
    for (let v = 0; v < n; v++) { if (!rep && pre.includes(v)) continue; pre.push(v); rec(pre); pre.pop(); }
  })([]);
  return out;
}
function secretOf(n, len, rep) {
  if (rep) return Array.from({ length: len }, () => Math.floor(Math.random() * n));
  const p = [...Array(n).keys()].sort(() => Math.random() - 0.5); return p.slice(0, len);
}
function casual(st, n, len, rep, sloppy) {
  const g = new Array(len).fill(null), gray = new Set(), yAt = {};
  st.hist.forEach((h) => h.g.forEach((v, i) => {
    if (h.fb[i] === 2) g[i] = v; else if (h.fb[i] === 1) (yAt[v] = yAt[v] || new Set()).add(i); else gray.add(v);
  }));
  if (st.butler) g[st.butler.pos] = st.butler.sym;
  const forget = sloppy && Math.random() < 0.3;
  const used = new Set(g.filter((v) => v !== null));
  if (!forget) Object.keys(yAt).map(Number).forEach((v) => {
    if (!rep && used.has(v)) return;
    const spots = [...Array(len).keys()].filter((i) => g[i] === null && !yAt[v].has(i));
    if (spots.length) { g[pick(spots)] = v; used.add(v); }
  });
  for (let i = 0; i < len; i++) if (g[i] === null) {
    let pool = [...Array(n).keys()].filter((v) => (rep || !used.has(v)) && (forget || !gray.has(v)));
    if (!pool.length) pool = [...Array(n).keys()].filter((v) => rep || !used.has(v));
    g[i] = pick(pool); used.add(g[i]);
  }
  return g;
}
function run(cfg, model, runs) {
  const { n, len, rep, tries } = cfg;
  const all = model === 'smart' ? space(n, len, rep) : null;
  let solved = 0, sumTries = 0;
  for (let k = 0; k < runs; k++) {
    const s = secretOf(n, len, rep), st = { hist: [], butler: null };
    let ok = false;
    while (st.hist.length < tries) {
      if (!st.butler && st.hist.length >= 5) {
        const green = new Set(); st.hist.forEach((h) => h.fb.forEach((v, i) => v === 2 && green.add(i)));
        const free = [...Array(len).keys()].filter((i) => !green.has(i)); const p = pick(free.length ? free : [...Array(len).keys()]);
        st.butler = { pos: p, sym: s[p] };
      }
      const g = model === 'smart'
        ? pick(all.filter((c) => (!st.butler || c[st.butler.pos] === st.butler.sym) && st.hist.every((h) => same(feedback(h.g, c), h.fb))))
        : casual(st, n, len, rep, model === 'sloppy');
      const fb = feedback(g, s); st.hist.push({ g, fb });
      if (fb.every((v) => v === 2)) { ok = true; break; }
    }
    if (ok) { solved++; sumTries += st.hist.length; }
  }
  return { solved: (100 * solved / runs).toFixed(0) + '%', avg: solved ? (sumTries / solved).toFixed(2) : '-' };
}
const CFG = [
  { label: 'сейчас: 4 из 8, без повторов, 8 попыток', n: 8, len: 4, rep: false, tries: 8 },
  { label: '4 из 8, С ПОВТОРАМИ, 8 попыток', n: 8, len: 4, rep: true, tries: 8 },
  { label: '4 из 12, без повторов, 8 попыток', n: 12, len: 4, rep: false, tries: 8 },
  { label: '5 из 8, без повторов, 8 попыток', n: 8, len: 5, rep: false, tries: 8 },
  { label: '4 из 8, без повторов, 5 попыток', n: 8, len: 4, rep: false, tries: 5 },
  { label: '4 из 6, с повторами, 6 попыток', n: 6, len: 4, rep: true, tries: 6 },
  { label: '4 из 8, с повторами, 6 попыток', n: 8, len: 4, rep: true, tries: 6 },
];
const RUNS = +process.argv[2] || 1500;
const rows = CFG.map((c) => {
  const r = { вариант: c.label };
  for (const m of ['smart', 'casual', 'sloppy']) { const x = run(c, m, m === 'smart' && c.n ** c.len > 5000 ? Math.min(RUNS, 400) : RUNS); r[m] = `${x.solved} · ${x.avg}`; }
  return r;
});
console.table(rows);
