/**
 * Vegas Way NY 2026/27 — «Countdown on the Strip»: акты шоу, уровни ракет и призы.
 * Решения Александра 11.11 (vegasway\HANDOFF.md): 6 актов, по 3 раунда, 2 попытки,
 * 3 очка с первой попытки, 1 со второй, максимум 54. Приз = уровень ракеты, без розыгрыша и топа.
 *
 * Сложность — предложение, подтвердить плейтестом на коллегах до 18.12
 * (цель: раунд с первой попытки проходят 60–85%).
 */

// Время акта — 31.12 ET, час открытия. Все акты открыты до 23:30 ET; 01.01 10:00–20:00 — Encore для несыгранных.
const ACTS = [
  { act: 1, opensHour: 12, title: 'The Three Hats', host: 'magician', rounds: [
    { type: 'shell', n: 3, swaps: 4, ms: 460 },
    { type: 'shell', n: 3, swaps: 6, ms: 420 },
    { type: 'shell', n: 3, swaps: 8, ms: 380 },
  ] },
  { act: 2, opensHour: 13, title: 'Pick a Card', host: 'magician', rounds: [
    { type: 'cards', n: 4, showMs: 3000 },
    { type: 'cards', n: 5, showMs: 3000 },
    { type: 'cards', n: 6, showMs: 3000 },
  ] },
  { act: 3, opensHour: 14, title: 'The Magician’s Riddle', host: 'magician', rounds: [
    { type: 'riddle', n: 3 },
    { type: 'riddle', n: 4 },
    { type: 'riddle', n: 4 },
  ] },
  { act: 4, opensHour: 15, title: 'Four Hats, Faster', host: 'magician', rounds: [
    { type: 'shell', n: 4, swaps: 6, ms: 400 },
    { type: 'shell', n: 4, swaps: 8, ms: 370 },
    { type: 'shell', n: 4, swaps: 10, ms: 340 },
  ] },
  { act: 5, opensHour: 16, title: 'The Big Spread', host: 'magician', rounds: [
    { type: 'cards', n: 6, showMs: 3000 },
    { type: 'cards', n: 7, showMs: 3000 },
    { type: 'cards', n: 8, showMs: 3000 },
  ] },
  { act: 6, opensHour: 17, title: 'Final Act: Harlequin’s Riddles', host: 'harlequin', rounds: [
    { type: 'riddle', n: 4 },
    { type: 'riddle', n: 5 },
    { type: 'riddle', n: 5 },
  ] },
];

const POINTS_FIRST = 3;
const POINTS_SECOND = 1;
const TRIES = 2;
const MAX_POINTS = ACTS.reduce((s, a) => s + a.rounds.length * POINTS_FIRST, 0); // 54

// Уровни ракеты. Бонусы = как у Fire Seven (честно между брендами). Один промокод на уровень (решение 11.11).
// Офферы (решение 11.11): наши обычные SMM-офферы по цене уровня, отдельных ивентовых не делаем.
const TIERS = [
  { id: 'gold',  min: 48, name: 'Gold Rocket',  bonus: { sc: 1,   fp: 7, gc: 2000000 }, offer: { source: 'smm', price: 39.99 } },
  { id: 'blue',  min: 35, name: 'Blue Rocket',  bonus: { sc: 0.5, fp: 5, gc: 1000000 }, offer: { source: 'smm', price: 19.99 } },
  { id: 'red',   min: 20, name: 'Red Rocket',   bonus: { sc: 0,   fp: 3, gc: 500000 },  offer: { source: 'smm', price: 9.99 } },
  { id: 'spark', min: 1,  name: 'Sparkler',     bonus: { sc: 0,   fp: 2, gc: 250000 },  offer: { source: 'smm', price: 9.99 } },
];

/** Уровень по очкам (null — 0 очков, ракеты нет). */
function tierOf(points) {
  return TIERS.find((t) => points >= t.min) || null;
}

/** Следующий уровень и сколько до него очков (null — уже золотая). */
function nextTier(points) {
  const up = TIERS.slice().reverse().find((t) => points < t.min);
  return up ? { tier: up, need: up.min - points } : null;
}

const act = (n) => ACTS.find((a) => a.act === Number(n)) || null;

module.exports = { ACTS, TIERS, POINTS_FIRST, POINTS_SECOND, TRIES, MAX_POINTS, tierOf, nextTier, act };
