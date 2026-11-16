/**
 * Личные сообщения бота Light Up Christmas (EN — как увидят игроки). Голос: живой, без пафоса.
 * Sparky без рук: «бегает по проводу», «вспыхивает»; Golem «держит» руками. Валюту в FB не упоминаем — здесь Discord.
 *
 * Призы — как на Witching Hours, кнопкой Claim prize: уровень достигнут → «приз готов, жми Claim».
 * Первый Claim — player ID на проверку (Александр вручную), после одобрения уходят все накопленные коды;
 * следующие Claim — сразу. Claim открыт до 03.01 23:59 ET.
 */
const DM = {
  t2: () => '⚡ Two houses glowing on your street! Your reward is ready: 1 FP. Hit Claim to get your code.',
  t4: (v) => '🎁 Four houses lit! Your reward is ready: 2 FP. Hit Claim to get your code. ' +
    (v.christmas ? 'And the big tree on the square is open for you now.' : 'And on Christmas morning the big tree on the square opens for you.'),
  t6: () => '🏠 The whole street is shining! Your reward is ready: 5 FP. Hit Claim to get your code.',
  tree: () => '🎄 You lit the Christmas tree! Your gift under the tree: 1 SC. Hit Claim to get your code. Merry Christmas from Golem and Sparky!',

  idPending: () => "Got it! We're checking your player ID now. Your codes land here as soon as it's approved, usually within a day. Keep playing in the meantime.",
  idApproved: (v) => `✅ Your player ID is approved. Your codes: ${v.codes}. From now on, every new reward comes instantly when you hit Claim.`,
  idRejected: () => "Hmm, we couldn't find that player ID. Check it in your Storm Rush profile and hit Claim again. Your rewards are safe.",
  claimed: (v) => `Here you go: ${v.codes}. Enjoy!`,

  training_open: () => "🔌 The training house is open in #light-up. One small grid, two minutes, and you'll know exactly how to bring the lights back on Christmas Eve.",
  dm_dark_houses: (v) => v.lit === 0
    ? '🌙 Merry Christmas! Your street is still dark. Six houses are waiting, and everything stays open until tomorrow, 11:59 PM ET. No rush.'
    : `🌙 ${v.dark} ${v.dark === 1 ? 'house' : 'houses'} on your street ${v.dark === 1 ? 'is' : 'are'} still dark. No rush, everything stays open until tomorrow, 11:59 PM ET.`,
  tree_open: (v) => v.lit >= 4
    ? '🎄 Merry Christmas! The big tree on the square is open for you. Light it up, there\'s a gift waiting under it.'
    : `🎄 Merry Christmas! Light ${4 - v.lit} more ${4 - v.lit === 1 ? 'house' : 'houses'} and the big tree on the square opens for you. Everything stays open until Dec 26, 11:59 PM ET.`,
  dm_last_hours: (v) => `⏳ 6 hours before the lights go out. ${v.left}`,
  offer: (v) => `✨ Thanks for bringing the lights back. Your Christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. Unlock it on the site with code ${v.code}. One per player.`,
  noOffer: () => "The storm's gone, but your street stayed dark this time. See you at the next one!",
  dm_unclaimed: (v) => `🎁 You still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from Light Up Christmas. Hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours. */
function leftLine(p) {
  if (p.lit < 4) return `${4 - p.lit} more ${4 - p.lit === 1 ? 'house' : 'houses'} and the tree is yours to light.`;
  if (!p.tree) return 'The tree on the square is still dark.';
  if (p.lit < 6) return `${6 - p.lit} ${6 - p.lit === 1 ? 'house is' : 'houses are'} still dark on your street.`;
  return null;
}

/**
 * Формат player ID Storm Rush — как в Rewards Rush (`cursor\rewards-rush-bot\src\link.js`, validateId): только цифры,
 * пример 1008956, длину не проверяем, пробелы по краям обрезаем, ведущие нули срезаем (иначе «01008956» прошёл бы
 * уникальность как другой ID). Форма Claim в проде — как на Witching Hours / Rewards Rush: player ID + телефон + почта.
 */
const PLAYER_ID = /^\d+$/;
function normalizePlayerId(raw) {
  const id = String(raw || '').trim();
  return PLAYER_ID.test(id) ? id.replace(/^0+(?=\d)/, '') : null;
}

module.exports = { DM, leftLine, PLAYER_ID, normalizePlayerId };
