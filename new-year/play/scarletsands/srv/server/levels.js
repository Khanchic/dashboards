/**
 * The North Star Expedition (Scarlet Sands, 25–26.12.2026) — уровни призов, Golden Compass, офферы.
 * Решения — ..\..\HANDOFF.md «Решения» (11–12.11). Штамп = своя находка (s1–s6) или лапка Saffron (c1–c4), максимум 10.
 */

/** Гарантированные уровни: каждый один раз на человека, код — по Claim (player ID при первом Claim). */
const TIERS = [
  { id: 't3', stamps: 3, name: 'Explorer', prize: '2 FP + 20K GC' },
  { id: 't6', stamps: 6, name: 'Navigator', prize: '3 FP + 30K GC' },
  { id: 'oasis', oasis: true, name: 'North Star', prize: '1 SC + 50K GC' },
];

/** Супер-уровень: Golden Compass. Не код, а участие в розыгрыше 27.12 (1 победитель, 50 SC). */
const GOLDEN = { id: 'golden', name: 'Golden Compass', prize: '50 SC', winners: 1 };

/** p = { stamps, found, paws, oasis, golden } → id достигнутых гарантированных уровней */
function reached(p) {
  return TIERS.filter((t) => (t.oasis ? Boolean(p.oasis) : p.stamps >= t.stamps)).map((t) => t.id);
}

/** Один оффер на человека по высшему уровню, 27.12 00:05 ET, личным одноразовым промокодом, 72 ч. */
const OFFERS = [
  { id: 'oasis', when: (p) => p.oasis || p.golden, name: 'Oasis Treasure Chest', price: '59.99', bonus: '+50%' },
  { id: 'starmap', when: (p) => p.stamps >= 6, name: 'Star Map Chest', price: '39.99', bonus: '+40%' },
  { id: 'supply', when: (p) => p.stamps >= 3, name: "Explorer's Supply Crate", price: '19.99', bonus: '+40%' },
  { id: 'stash', when: (p) => p.stamps >= 1, name: "Ginger Cat's Stash", price: '9.99', bonus: '+100%' },
];
const offerFor = (p) => OFFERS.find((o) => o.when(p)) || null;

/** Для напоминаний: что ближе всего. */
function nextGoal(p) {
  if (p.stamps < 4) return { kind: 'oasis', need: 4 - p.stamps };
  if (!p.oasis) return { kind: 'oasis_open', need: 0 };
  if (!p.golden && p.found === 6 && p.paws < 4) return { kind: 'paws', need: 4 - p.paws };
  return null;
}

/**
 * Розыгрыш Golden Compass: равный шанс всем прошедшим супер-игру. exclude — те, кто уже отпал
 * (player ID отклонён / не подтверждён к сроку) — тогда тянем заново из оставшихся.
 */
function drawGolden(candidates, rng = Math.random, exclude = []) {
  const pool = candidates.filter((c) => !exclude.includes(c));
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

module.exports = { TIERS, GOLDEN, OFFERS, reached, offerFor, nextGoal, drawGolden };
