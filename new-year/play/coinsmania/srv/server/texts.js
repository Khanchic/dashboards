/**
 * Личные сообщения бота Merry Coinsmas (EN — как увидят игроки). Голос: Piggins — свин-супергерой CoinsMania
 * (имя подтвердил Александр 12.11), коротко, по-дружески, без пафоса и без «казино». Шлёт бот CoinsMania Mod.
 *
 * Призы — как на Witching Hours, кнопкой Claim prize: уровень достигнут → «приз готов, жми Claim».
 * Первый Claim — player ID на проверку (staff вручную), после одобрения уходят все накопленные коды;
 * следующие Claim — сразу. Claim открыт до 03.01 23:59 ET.
 */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const DM = {
  t2: () => '🐷 2 jars sorted! Your first reward is ready: 1 FP. Hit Claim prize to get your code.',
  t4: (v) => '🪙 4 jars! Reward ready: 2 FP. Hit Claim prize. ' +
    (v.goldenOpen ? 'And the Golden Jar is open for you now ✨' : 'You also unlocked the Golden Jar. It opens Dec 26 at midnight ET ✨'),
  t6: () => '🐷 All 6 jars sorted, your piggy is full! Reward ready: 5 FP. Hit Claim prize.',
  golden: () => '🎄 You sorted the Golden Jar! Your Christmas gift: 1 SC. Hit Claim prize. Merry Coinsmas!',

  idPending: () => 'Got it! We’re checking your player ID now. Your codes land here as soon as it’s approved, usually within 48 hours. Keep sorting meanwhile.',
  idApproved: (v) => `✅ Player ID approved. Your codes: ${v.codes}. From now on, new rewards arrive automatically when you hit Claim, no extra checks.`,
  idRejected: () => 'Hmm, we couldn’t find that player ID. Check it in your CoinsMania profile and hit Claim again. Your rewards are safe.',
  claimed: (v) => `Here you go: ${v.codes}. Enjoy!`,

  practice_open: () => '🪙 The practice jar is open. One small sort, a minute or two, so you know how it works before Christmas.',
  live: () => '🎄 Merry Christmas from Piggins! Jars 1–3 are open. Sort the coins, fill your piggy. No timer, everything stays open until Dec 26, 11:59 PM ET.',
  wave2: (v) => v.jars >= 3
    ? '🪙 Jars 4–6 just opened. More colors this time, you got this.'
    : `🪙 Jars 4–6 just opened. You’ve sorted ${plural(v.jars, 'jar', 'jars')} so far, plenty of time.`,
  dm_below_two: (v) => v.jars === 0
    ? '🎄 Your piggy is still empty! One jar takes a couple of minutes, and 2 jars = your first reward.'
    : '🎄 One more jar and your first reward is yours. No rush, open until tomorrow 11:59 PM ET.',
  golden_open: (v) => v.jars >= 4
    ? '✨ The Golden Jar is open for you. It’s the big one, with 1 SC inside.'
    : `✨ The Golden Jar opened today. Sort ${plural(4 - v.jars, 'more jar', 'more jars')} and it’s yours.`,
  dm_last_hours: (v) => `⏳ 6 hours left to sort. ${v.left}`,
  offer: (v) => `🎁 Thanks for sorting with us! Your Christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. Use code ${v.code} on the site. One per player.`,
  noOffer: () => 'Coinsmas is over! Your piggy stayed empty this time, but thanks for stopping by 🐷 See you at the next event. Piggins',
  dm_unclaimed: (v) => `🎁 You still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from Merry Coinsmas. Hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours. */
function leftLine(p) {
  if (p.jars < 2) return `${plural(2 - p.jars, 'more jar', 'more jars')} = your first reward.`;
  if (p.jars < 4) return `${plural(4 - p.jars, 'more jar', 'more jars')} and the Golden Jar is yours.`;
  if (!p.golden) return 'The Golden Jar is still waiting for you.';
  if (p.jars < 6) return `${plural(6 - p.jars, 'jar is', 'jars are')} still mixed up.`;
  return null;
}

/**
 * Формат player ID — как у Storm (решение Александра 12.11): только цифры, длина любая, ведущие нули срезаются;
 * форма первого Claim в проде = ID + телефон + почта (как WH). Возвращает нормализованный ID или null.
 */
const PLAYER_ID = /^\d{1,20}$/;
function normPlayerId(s) {
  const d = String(s ?? '').trim();
  if (!PLAYER_ID.test(d)) return null;
  return d.replace(/^0+/, '') || null;
}

module.exports = { DM, leftLine, PLAYER_ID, normPlayerId };
