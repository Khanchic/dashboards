// node engine/playtest-stats.js playtest.txt — сводка плейтеста по строкам, которые присылают коллеги.
// Строка из режима ?playtest:  "F7 playtest · I:3 II:4b III:x IV:5 V:6b VI:x VII:4 · замков 5/7 · счёт 41 · время 9м12с"
// Решение по итогам: если замок VII откроют < 50% — дать ему 6 попыток (vault-event.js LOCKS[6].tries).
const fs = require('fs');
const E = require('./vault-event');
const file = process.argv[2];
if (!file) { console.log('usage: node engine/playtest-stats.js <file with pasted lines>'); process.exit(1); }
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => /F7 playtest/.test(l));
const ids = E.LOCKS.map((l) => l.id);
const agg = ids.map(() => ({ tried: 0, ok: 0, tries: 0, butler: 0 }));
let all7 = 0;
const notes = [];
lines.forEach((raw) => {
  // строка: «F7 playtest · [Имя · ]I:3 II:4b … · замков N/7 · счёт S · время T[ · отзыв: …]»
  const [l, note] = raw.split(' · отзыв: ');
  const name = (l.match(/F7 playtest · (.+?) · I:/) || [])[1] || '—';
  if (note && note.trim()) notes.push(`${name}: ${note.trim()}`);
  const m = [...l.matchAll(/\b(I|II|III|IV|V|VI|VII):(\d+|x)(b?)/g)];
  m.forEach(([, id, v, b]) => {
    const a = agg[ids.indexOf(id)];
    a.tried++;
    if (b) a.butler++;
    if (v !== 'x') { a.ok++; a.tries += +v; }
  });
  if (m.length === 7 && m.every(([, , v]) => v !== 'x')) all7++;
});
console.log(`Плейтестеров: ${lines.length} · открыли все 7: ${all7}`);
console.table(agg.map((a, i) => ({
  замок: ids[i],
  настройка: `4 из ${E.LOCKS[i].symbols}${E.LOCKS[i].repeats ? ', повторы' : ''}, ${E.LOCKS[i].tries} поп.`,
  открыли: a.tried ? Math.round((100 * a.ok) / a.tried) + '%' : '—',
  'ср. попыток': a.ok ? (a.tries / a.ok).toFixed(1) : '—',
  дворецкий: a.tried ? Math.round((100 * a.butler) / a.tried) + '%' : '—',
})));
if (notes.length) { console.log('\nОтзывы:'); notes.forEach((n) => console.log('· ' + n)); }
const vii = agg[6];
if (vii.tried) console.log(vii.ok / vii.tried < 0.5 ? '→ VII открыли < 50%: дать ему 6 попыток.' : '→ VII в норме, лестницу оставляем.');
