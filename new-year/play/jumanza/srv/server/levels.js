/**
 * Christmas on Kilimanjaro (Jumanza, 25–26.12.2026) — тропы, призы, офферы.
 * Решения — ..\..\HANDOFF.md «Решения». Сложность = moves (минимум ходов до решения, точно), правится здесь;
 * после правки пересобрать пул: node dev/build-pool.js --moves <новые числа>.
 *
 * Тропы идут вверх по поясам горы: саванна → дождевой лес → вереск → пустошь → альпийская пустыня → ледник,
 * вершина с ёлкой открывается после 4 троп.
 */
const HINTS = 3; // подсказок льва на тропу: показывает один следующий ход; бесплатно, на приз не влияют

const LEVELS = [
  { id: 'practice', n: 0, title: 'Practice trail', zone: 'Base camp', moves: 3, pieces: [4, 6], training: true },
  { id: 't1', n: 1, title: 'Trail 1', zone: 'Savanna', moves: 4, pieces: [5, 7] },
  { id: 't2', n: 2, title: 'Trail 2', zone: 'Rainforest', moves: 6, pieces: [6, 8] },
  { id: 't3', n: 3, title: 'Trail 3', zone: 'Heather slopes', moves: 8, pieces: [7, 9] },
  { id: 't4', n: 4, title: 'Trail 4', zone: 'Moorland', moves: 11, pieces: [8, 10] },
  { id: 't5', n: 5, title: 'Trail 5', zone: 'Alpine desert', moves: 14, pieces: [9, 11] },
  { id: 't6', n: 6, title: 'Trail 6', zone: 'Glacier', moves: 17, pieces: [9, 12] },
  { id: 'summit', n: 7, title: 'The summit', zone: 'Christmas tree on the peak', moves: 20, pieces: [10, 12], summit: true, needTrails: 4 },
].map((l) => ({ hints: HINTS, ...l }));

const TRAILS = LEVELS.filter((l) => !l.training && !l.summit).map((l) => l.id);
const level = (id) => LEVELS.find((l) => l.id === id) || null;

/** Уровни призов: каждый один раз на человека; код — кнопкой Claim (после одобрения player ID). */
const TIERS = [
  { id: 't2', trails: 2, name: 'Two trails cleared', prize: '1 FP' },
  { id: 't4', trails: 4, name: 'Four trails cleared', prize: '2 FP' },
  { id: 't6', trails: 6, name: 'All six trails', prize: '5 FP' },
  { id: 'summit', summit: true, name: 'Gifts on the summit', prize: '1 SC' },
];

/** progress = { trails: пройдено троп 1–6, summit: bool } → id достигнутых уровней */
function reached(p) {
  return TIERS.filter((t) => (t.summit ? Boolean(p.summit) : p.trails >= t.trails)).map((t) => t.id);
}

/** Один оффер на человека по высшему уровню, 27.12 00:05 ET, личным одноразовым промокодом, 72 ч. Названия — предложение. */
const OFFERS = [
  { id: 'star', when: (p) => p.summit, name: 'Summit Star Chest', price: '39.99', bonus: '+75%' },
  { id: 'glacier', when: (p) => p.trails >= 6, name: 'Kilimanjaro Treasure', price: '39.99', bonus: '+50%' },
  { id: 'trail', when: (p) => p.trails >= 4, name: 'Safari Trail Bundle', price: '19.99', bonus: '+40%' },
  { id: 'camp', when: (p) => p.trails >= 1, name: 'Base Camp Pack', price: '9.99', bonus: '+100%' },
];
const offerFor = (p) => OFFERS.find((o) => o.when(p)) || null;

module.exports = { LEVELS, TRAILS, TIERS, OFFERS, HINTS, level, reached, offerFor };
