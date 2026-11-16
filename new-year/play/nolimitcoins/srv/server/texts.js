/**
 * Личные сообщения бота Infinity Garland (EN — как увидят игроки). Голос Coiny: лёгкий, уверенный, без пафоса
 * («sunglasses on»). Валюту в FB не упоминаем — здесь Discord, можно.
 *
 * Призы — кнопкой Claim prize (правило 8): уровень достигнут → «приз готов, жми Claim». Первый Claim — player ID на
 * проверку (Александр вручную), после одобрения уходят все накопленные коды; следующие Claim — сразу. До 03.01 23:59 ET.
 */
const s = (n, one, many) => (n === 1 ? one : many);

const DM = {
  t2: () => '✨ Two tiers glowing! Your reward is ready: 1 FP. Hit Claim to get your code.',
  t4: (v) => '🎄 Four tiers lit! Your reward is ready: 2 FP. Hit Claim to get your code. ' +
    (v.starOpen ? 'And the Infinity Star on top is open for you now.' : 'And tonight at 6 PM ET the Infinity Star on top opens for you.'),
  t6: () => '🌟 The whole tree is shining! Your reward is ready: 5 FP. Hit Claim to get your code.',
  star: () => '♾️ You lit the Infinity Star! Your Christmas gift: 1 SC. Hit Claim to get your code. Merry Christmas from Coiny!',

  idPending: () => "Got it! We're checking your player ID now. Your codes land here as soon as it's approved, usually within a day. Keep decorating in the meantime.",
  idApproved: (v) => `✅ Your player ID is approved. Your codes: ${v.codes}. From now on, every new reward comes instantly when you hit Claim.`,
  idRejected: () => "Hmm, we couldn't find that player ID. Check it in your NoLimitCoins profile and hit Claim again. Your rewards are safe.",
  claimed: (v) => `Here you go: ${v.codes}. Enjoy!`,

  practice_open: () => "🎄 Coiny here. The practice bauble is up in #infinity-garland. One small garland, two minutes, and you're ready for Christmas morning.",
  morning_open: () => '🎁 Merry Christmas! Coiny hung the first three tiers of the tree. Draw one glowing garland through every light on a tier and it lights up. Tiers 4–6 come at noon ET.',
  day_open: (v) => v.lit >= 3
    ? '🎄 Tiers 4, 5 and 6 are up. Light one more and the Infinity Star opens for you tonight.'
    : '🎄 Tiers 4, 5 and 6 are up. Everything stays open until Dec 26, 11:59 PM ET, so no rush.',
  star_open: (v) => v.lit >= 4
    ? '♾️ The Infinity Star is open for you. One last garland, right at the top of the tree.'
    : `♾️ The Infinity Star is up on the tree. Light ${4 - v.lit} more ${s(4 - v.lit, 'tier', 'tiers')} and it's yours to light. Open until Dec 26, 11:59 PM ET.`,
  dm_dark_tiers: (v) => v.lit === 0
    ? '🌙 Your tree is still dark. Six tiers are waiting, and everything stays open until tonight, 11:59 PM ET.'
    : `🌙 ${v.dark} ${s(v.dark, 'tier', 'tiers')} on your tree ${s(v.dark, 'is', 'are')} still dark. Everything stays open until tonight, 11:59 PM ET.`,
  dm_last_hours: (v) => `⏳ 6 hours before the garlands go out. ${v.left}`,
  offer: (v) => `✨ Thanks for lighting up the tree. Your Christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. Unlock it on the site with code ${v.code}. One per player.`,
  noOffer: () => 'The garlands are out for this year. See you at the next one!',
  dm_unclaimed: (v) => `🎁 You still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from Infinity Garland. Hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours. */
function leftLine(p) {
  if (p.lit < 4) return `${4 - p.lit} more ${s(4 - p.lit, 'tier', 'tiers')} and the Infinity Star is yours to light.`;
  if (!p.star) return 'The Infinity Star on top is still dark.';
  if (p.lit < 6) return `${6 - p.lit} ${s(6 - p.lit, 'tier is', 'tiers are')} still dark on your tree.`;
  return null;
}

/**
 * Player ID NoLimitCoins — как на Witching Hours (halloween-week\app\src\bot\registration.js: «Numbers only»):
 * только цифры, пробелы по краям обрезаем, ведущие нули срезаем (иначе «01008956» прошёл бы уникальность).
 * Форма Claim в проде — как на WH: player ID + телефон + почта.
 */
const PLAYER_ID = /^\d+$/;
function normalizePlayerId(raw) {
  const id = String(raw || '').trim();
  return PLAYER_ID.test(id) ? id.replace(/^0+(?=\d)/, '') : null;
}

module.exports = { DM, leftLine, PLAYER_ID, normalizePlayerId };
