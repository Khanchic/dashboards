/**
 * Light Up Christmas (Storm Rush, 24–26.12.2026: сочельник → утро Рождества → день догнать) — уровни, призы, офферы.
 * Решения — ..\..\HANDOFF.md «Решения». Сложность правится здесь (rows/cols), пороги — в TIERS.
 */
const { rect } = require('../shared/grid');

// Ёлка: 46 клеток, батарея внизу ствола, звезда — последняя лампочка на макушке.
const TREE = [
  '....X....',
  '...XXX...',
  '..XXXXX..',
  '...XXX...',
  '..XXXXX..',
  '.XXXXXXX.',
  '..XXXXX..',
  '.XXXXXXX.',
  'XXXXXXXXX',
  '....X....',
];

const HINTS = { golem: 2, sparky: 1 }; // на каждый дом; бесплатно, на приз не влияют

function house(id, n, title, rows, cols, extra) {
  return {
    id, n, title, rows, cols, shape: rect(rows, cols),
    src: [Math.floor(rows / 2), Math.floor((cols - 1) / 2)],
    size: rows + '×' + cols, ...HINTS, ...extra,
  };
}

const LEVELS = [
  house('training', 0, 'Training house', 3, 4, { training: true }),
  house('h1', 1, 'House 1', 4, 4),
  house('h2', 2, 'House 2', 4, 5),
  house('h3', 3, 'House 3', 5, 5),
  house('h4', 4, 'House 4', 5, 6),
  house('h5', 5, 'House 5', 6, 6),
  house('h6', 6, 'House 6', 6, 7),
  { id: 'tree', n: 7, title: 'The Christmas tree', shape: TREE, src: [9, 4], star: [0, 4], size: '46 tiles', tree: true, needHouses: 4, ...HINTS },
];
const HOUSES = LEVELS.filter((l) => !l.training && !l.tree).map((l) => l.id);
const level = (id) => LEVELS.find((l) => l.id === id) || null;

/** Уровни призов: каждый один раз на человека, код уходит сразу (после одобрения player ID). */
const TIERS = [
  { id: 't2', houses: 2, name: 'Two houses glowing', prize: '1 FP' },
  { id: 't4', houses: 4, name: 'Four houses lit', prize: '2 FP' },
  { id: 't6', houses: 6, name: 'The whole street', prize: '5 FP' },
  { id: 'tree', tree: true, name: 'The Christmas tree', prize: '1 SC' },
];

/** progress = { houses: число зажжённых домов (без тренировочного), tree: bool } → id достигнутых уровней */
function reached(p) {
  return TIERS.filter((t) => (t.tree ? Boolean(p.tree) : p.houses >= t.houses)).map((t) => t.id);
}

/** Один оффер на человека по высшему уровню, 27.12, личным одноразовым промокодом, 72 ч. */
const OFFERS = [
  { id: 'star', when: (p) => p.tree, name: 'Christmas Star Crate', price: '39.99', bonus: '+75%' },
  { id: 'battery', when: (p) => p.houses >= 6, name: "Golem's Battery Crate", price: '39.99', bonus: '+50%' },
  { id: 'spark', when: (p) => p.houses >= 4, name: 'Spark Bundle', price: '19.99', bonus: '+40%' },
  { id: 'frozen', when: (p) => p.houses >= 1, name: 'Frozen Grid Battery', price: '9.99', bonus: '+100%' },
];
const offerFor = (p) => OFFERS.find((o) => o.when(p)) || null;

/** Для напоминаний: сколько домов осталось до ёлки / до всей улицы. */
function nextGoal(p) {
  if (p.houses < 4) return { kind: 'tree', need: 4 - p.houses };
  if (p.houses < 6) return { kind: 'street', need: 6 - p.houses };
  if (!p.tree) return { kind: 'tree_open', need: 0 };
  return null;
}

module.exports = { LEVELS, HOUSES, TIERS, OFFERS, HINTS, TREE, level, reached, offerFor, nextGoal };
