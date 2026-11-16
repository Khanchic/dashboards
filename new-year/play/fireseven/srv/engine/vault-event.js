/**
 * Fire Seven · Crack the 777 Vault — уровень ивента: расписание замков, лестница сложности, призы, счёт, топ-3.
 * Чистые функции, без БД и Discord: общий слой хранит состояние и зовёт отсюда.
 *
 * Рождество (Александр 11.11, общая рамка: все бренды 25–26.12): замки 25.12 12:00–18:00 ET, взлом до 23:30 ET,
 * сейфы открываются в 00:00 ET 26.12 — «Рождество заканчивается, андроид открывает сейф» (07:00 Киева).
 * Время. В декабре в Нью-Йорке EST, UTC−5 (летнего времени нет), поэтому смещение фиксированное.
 * Для репетиции на тест-стенде makeSchedule() принимает старт и шаг в минутах.
 */

/**
 * Лестница сложности (Александр 11.11: «каждый следующий уровень сложнее», вариант A из engine/simulate-ladder.js).
 * Ожидаемое прохождение у «обычного» игрока: I–III 100%, IV 95%, V 93%, VI ~78%, VII ~57%.
 */
const LOCKS = [
  { id: 'I', name: 'The Invitation', symbols: 6, repeats: false, tries: 8 },
  { id: 'II', name: 'The Wreath', symbols: 7, repeats: false, tries: 8 },
  { id: 'III', name: 'The Lights', symbols: 8, repeats: false, tries: 8 },
  { id: 'IV', name: 'The Gifts', symbols: 6, repeats: true, tries: 7 },
  { id: 'V', name: 'The Toast', symbols: 7, repeats: true, tries: 7 },
  { id: 'VI', name: 'The Fireplace', symbols: 8, repeats: true, tries: 6 },
  { id: 'VII', name: 'Midnight', symbols: 8, repeats: true, tries: 5 },
];

/**
 * Призы (Александр 11.11): топ-3 — крупные, все остальные, кто открыл хотя бы один замок, — один промокод 5 FP + 100K GC.
 * Суммы топ-3 50/30/20 SC — решено 11.11. Офферы (решено 11.11): лесенка по числу замков, лимит 1, 48 ч, пакеты = SMM-офферы F7 с новыми названиями; при вскрытии участнику — только личный оффер, без сезонных офферов.
 */
const TOP = [
  { place: 1, bonus: { sc: 50 }, offer: { name: 'The Private Vault', price: 59.99, extra: 50, hours: 48 } },
  { place: 2, bonus: { sc: 30 }, offer: { name: 'The Private Vault', price: 59.99, extra: 50, hours: 48 } },
  { place: 3, bonus: { sc: 20 }, offer: { name: 'The Private Vault', price: 59.99, extra: 50, hours: 48 } },
];
const REST = { bonus: { fp: 5, gc: 100000, sc: 0 } };
const OFFERS = [
  { min: 1, max: 2, offer: { name: "Butler's Nightcap", price: 9.99, extra: 100, hours: 48 } },
  { min: 3, max: 6, offer: { name: 'Velvet Combination', price: 19.99, extra: 40, hours: 48 } },
  { min: 7, max: 7, offer: { name: 'Seven Sevens Case', price: 39.99, extra: 50, hours: 48 } },
];

const MIN = 60 * 1000;
/** Боевое расписание: замки 25.12 12:00…18:00 ET, взлом до 23:30 ET, вскрытие 26.12 00:00 ET. */
function makeSchedule({ firstLock = '2026-12-25T12:00:00-05:00', stepMin = 60, closeAfterMin = 11.5 * 60, revealAfterMin = 12 * 60 } = {}) {
  const t0 = new Date(firstLock).getTime();
  return {
    opens: LOCKS.map((_, i) => t0 + i * stepMin * MIN),
    close: t0 + closeAfterMin * MIN,
    reveal: t0 + revealAfterMin * MIN, // вскрытие сейфов
  };
}
/** Репетиция 18.12: замок каждые 10 минут, «23:30» через 80 минут, «вскрытие» через 90. */
const rehearsalSchedule = (firstLockIso) => makeSchedule({ firstLock: firstLockIso, stepMin: 10, closeAfterMin: 80, revealAfterMin: 90 });

/** upcoming | open | closed */
function lockPhase(schedule, i, now) {
  if (now < schedule.opens[i]) return 'upcoming';
  if (now >= schedule.close) return 'closed';
  return 'open';
}
/** before | running | closed | opened (сейфы вскрыты) */
function eventPhase(schedule, now) {
  if (now < schedule.opens[0]) return 'before';
  if (now < schedule.close) return 'running';
  if (now < schedule.reveal) return 'closed';
  return 'opened';
}
/** Сдвиг при простое > 30 минут (план Б; если не поднялись к 22:00 — промокод REST всем вошедшим, топ-3 по факту): close и вскрытие сдвигаются на простой, но вскрытие не позже 01:00 ET 26.12. */
function extendForOutage(schedule, outageMin, hardStop = new Date('2026-12-26T01:00:00-05:00').getTime()) {
  if (outageMin <= 30) return schedule;
  const shift = outageMin * MIN;
  const reveal = Math.min(schedule.reveal + shift, hardStop);
  const close = Math.min(schedule.close + shift, reveal - 30 * MIN);
  return { ...schedule, close, reveal };
}

/**
 * results — массив из 7 элементов: null (не играл) или { solved, tries, butler, score, at }.
 * score — сумма счёта всех сыгранных замков (решённый: попытки + 2 за дворецкого; заклинивший: все попытки + 2).
 * lastAt — когда открыт последний (по номеру) из открытых замков: для ничьей.
 */
function playerSummary(results) {
  let cracked = 0, score = 0, played = 0, lastAt = null, lastIdx = -1;
  results.forEach((r, i) => {
    if (!r) return;
    played++;
    score += r.score;
    if (r.solved) { cracked++; if (i > lastIdx) { lastIdx = i; lastAt = r.at; } }
  });
  return { cracked, played, score, lastAt };
}

const offerFor = (cracked) => (OFFERS.find((t) => cracked >= t.min && cracked <= t.max) || {}).offer || null;

/**
 * Топ-3: больше замков — выше; среди равных меньше счёт — выше; при равенстве выше тот, кто раньше открыл
 * свой последний замок (для открывших все 7 — замок VII, как решено). Правило «только открывшие все 7» (решено)
 * действует, пока таких хотя бы трое; если меньше — оставшиеся места идут открывшим 6, потом 5 (запасное правило).
 * exclude — Set userId, уже получивших топ-приз в другом бренде (один приз на человека по всем брендам).
 */
function rankTop(players, exclude = new Set()) {
  return players
    .map((p) => ({ userId: p.userId, ...playerSummary(p.results) }))
    .filter((p) => p.cracked > 0 && !exclude.has(p.userId))
    .sort((a, b) => b.cracked - a.cracked || a.score - b.score || a.lastAt - b.lastAt)
    .slice(0, TOP.length)
    .map((p, i) => ({ ...TOP[i], ...p }));
}

/** Приз игрока в полночь: топ-3 — своё место; остальные с ≥ 1 замком — 5 FP + 100K GC; оффер — по числу замков. */
function prizeFor(userId, results, top) {
  const s = playerSummary(results);
  const t = top.find((x) => x.userId === userId);
  if (t) return { kind: 'top', place: t.place, bonus: t.bonus, offer: t.offer, ...s };
  if (s.cracked > 0) return { kind: 'rest', bonus: REST.bonus, offer: offerFor(s.cracked), ...s };
  return { kind: 'none', ...s };
}

module.exports = { LOCKS, TOP, REST, OFFERS, makeSchedule, rehearsalSchedule, lockPhase, eventPhase, extendForOutage, playerSummary, offerFor, rankTop, prizeFor };
