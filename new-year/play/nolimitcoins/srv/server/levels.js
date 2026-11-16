/**
 * Infinity Garland (NoLimitCoins, Рождество 25–26.12.2026) — уровни, призы, офферы.
 * Решения — ..\..\HANDOFF.md «Решения». Сложность правится здесь: shape (крупная маска, клетка = блок 2×2 лампочек)
 * и bites (сколько пар лампочек выкусить — дырки и рваный край дают логику). Пороги призов — TIERS.
 *
 * Ёлка из 6 ярусов сверху вниз: ярус 1 — верхушка (маленький), ярус 6 — низ (большой). Над ёлкой — звезда ∞.
 */
const HINTS = 2; // подсказки Coiny на ярус: рисует кусок гирлянды через одну лампочку и закрепляет; бесплатно, на приз не влияют

function tier(id, n, title, shape, bites, extra) {
  const C = Math.max(...shape.map((s) => s.length)) * 2;
  return { id, n, title, shape, bites, size: shape.length * 2 + '×' + C, hints: HINTS, ...extra };
}

const LEVELS = [
  tier('practice', 0, 'Practice bauble', ['XX', 'XX'], 1, { practice: true }),
  tier('g1', 1, 'Tier 1', ['.XX.', 'XXXX'], 2),
  tier('g2', 2, 'Tier 2', ['.XXX.', 'XXXXX'], 3),
  tier('g3', 3, 'Tier 3', ['..X..', '.XXX.', 'XXXXX'], 3),
  tier('g4', 4, 'Tier 4', ['.XX.', 'XXXX', 'XXXX'], 4),
  tier('g5', 5, 'Tier 5', ['.XXX.', 'XXXXX', 'XXXXX'], 5),
  tier('g6', 6, 'Tier 6', ['..X..', '.XXX.', 'XXXXX', 'XXXXX'], 6),
  // звезда-бесконечность: два кольца, сшитых посередине
  tier('star', 7, 'The Infinity Star', ['XXXXX', 'X.X.X', 'XXXXX'], 3, { star: true, needTiers: 4 }),
];
const GARLANDS = LEVELS.filter((l) => !l.practice && !l.star).map((l) => l.id);
const WAVE1 = ['g1', 'g2', 'g3']; // 25.12 00:00 ET
const WAVE2 = ['g4', 'g5', 'g6']; // 25.12 12:00 ET
const level = (id) => LEVELS.find((l) => l.id === id) || null;

/** Уровни призов: каждый один раз на человека, код — кнопкой Claim (после одобрения player ID). */
const TIERS = [
  { id: 't2', tiers: 2, name: 'Two tiers glowing', prize: '1 FP' },
  { id: 't4', tiers: 4, name: 'Four tiers lit', prize: '2 FP' },
  { id: 't6', tiers: 6, name: 'The whole tree', prize: '5 FP' },
  { id: 'star', star: true, name: 'The Infinity Star', prize: '1 SC' },
];

/** progress = { lit: ярусов 1–6 горит, star: bool } → id достигнутых уровней */
function reached(p) {
  return TIERS.filter((t) => (t.star ? Boolean(p.star) : p.lit >= t.tiers)).map((t) => t.id);
}

/** Один оффер на человека по высшему уровню, 27.12 00:05 ET, личным одноразовым промокодом, 72 ч. */
const OFFERS = [
  { id: 'infinity', when: (p) => p.star, name: 'Infinity Star Box', price: '59.99', bonus: '+50%' },
  { id: 'cube', when: (p) => p.lit >= 6, name: "Coiny's Christmas Cube", price: '39.99', bonus: '+50%' },
  { id: 'garland', when: (p) => p.lit >= 4, name: 'Gold Garland Bundle', price: '19.99', bonus: '+40%' },
  { id: 'stocking', when: (p) => p.lit >= 1, name: 'Endless Stocking', price: '9.99', bonus: '+100%' },
];
const offerFor = (p) => OFFERS.find((o) => o.when(p)) || null;

module.exports = { LEVELS, GARLANDS, WAVE1, WAVE2, TIERS, OFFERS, HINTS, level, reached, offerFor };
