/**
 * CoinsMania · Merry Coinsmas: Coin Sort Piggy (Рождество 25–26.12.2026) — банки, уровни призов, офферы.
 * Решения — ..\..\HANDOFF.md «Решения». Сложность — число цветов (colors) и высота стопки (cap); пустых банок 2.
 *
 * Каждая банка перемешивается заново для каждого игрока (shared/coins.js generate): нет готовых стопок,
 * решение гарантировано (проверено решателем), не короче minMoves. Скриншот чужой банки к твоей не подходит.
 * Замер 12.11 (60 раздач на размер): решатель 9–13 ходов на практике … 31–39 на банке 6, золотая 37–46;
 * «случайный игрок» без undo застревает: 4×4 — 2%, 6×4 — 30%, 9×4 — 81%, 8×5 — 84%. С undo и подсказками — цель
 * плейтеста 60–85% прохождения на банках 5–6.
 */
const HINTS = 3; // на банку: подсвечивает следующий верный ход; бесплатно, на приз не влияет

// wave 1 — 25.12 00:00 ET, wave 2 — 25.12 12:00 ET, golden — 26.12 00:00 ET (см. schedule.js)
const JARS = [
  { id: 'practice', n: 0, title: 'Practice', colors: 3, cap: 4, empty: 2, practice: true },
  { id: 'j1', n: 1, title: 'Jar 1', colors: 4, cap: 4, empty: 2, wave: 1 },
  { id: 'j2', n: 2, title: 'Jar 2', colors: 5, cap: 4, empty: 2, wave: 1 },
  { id: 'j3', n: 3, title: 'Jar 3', colors: 6, cap: 4, empty: 2, wave: 1 },
  { id: 'j4', n: 4, title: 'Jar 4', colors: 7, cap: 4, empty: 2, wave: 2 },
  { id: 'j5', n: 5, title: 'Jar 5', colors: 8, cap: 4, empty: 2, wave: 2 },
  { id: 'j6', n: 6, title: 'Jar 6', colors: 9, cap: 4, empty: 2, wave: 2 },
  { id: 'golden', n: 7, title: 'The Golden Jar', colors: 8, cap: 5, empty: 2, golden: true, needJars: 4 },
];
JARS.forEach((j) => { j.size = `${j.colors}×${j.cap}`; });
const ROW = JARS.filter((j) => !j.practice && !j.golden).map((j) => j.id);
const jar = (id) => JARS.find((j) => j.id === id) || null;

/** Уровни призов: каждый один раз на человека, код по Claim prize (после одобрения player ID). Номиналы — предложение. */
const TIERS = [
  { id: 't2', jars: 2, name: 'Piggy Saver', prize: '1 FP' },
  { id: 't4', jars: 4, name: 'Piggy Banker', prize: '2 FP' },
  { id: 't6', jars: 6, name: 'Full Piggy', prize: '5 FP' },
  { id: 'golden', golden: true, name: 'Golden Piggy', prize: '1 SC' },
];
/** progress = { jars: разобранных банок 1–6, golden: bool } → id достигнутых уровней */
function reached(p) {
  return TIERS.filter((t) => (t.golden ? Boolean(p.golden) : p.jars >= t.jars)).map((t) => t.id);
}

/** Один оффер на человека по высшему уровню, 27.12 00:05 ET, личным одноразовым промокодом, 72 ч. Предложение. */
const OFFERS = [
  { id: 'golden', when: (p) => p.golden, name: 'Merry Coinsmas Crate', price: '39.99', bonus: '+75%' },
  { id: 'vault', when: (p) => p.jars >= 6, name: 'Full Piggy Vault', price: '39.99', bonus: '+50%' },
  { id: 'piggy', when: (p) => p.jars >= 4, name: 'Golden Piggy Bundle', price: '19.99', bonus: '+40%' },
  { id: 'stocking', when: (p) => p.jars >= 1, name: 'Coin Stocking Pack', price: '9.99', bonus: '+100%' },
];
const offerFor = (p) => OFFERS.find((o) => o.when(p)) || null;

module.exports = { HINTS, JARS, ROW, TIERS, OFFERS, jar, reached, offerFor };
