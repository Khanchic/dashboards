/**
 * Личные сообщения бота Christmas on Kilimanjaro (EN — как увидят игроки). Голос: живой, тёплый, без пафоса.
 * Ведущий — лев Jumanza (имени нет, в текстах «the lion»). Валюту в FB не упоминаем — здесь Discord.
 *
 * Призы кнопкой Claim prize: уровень достигнут → «приз готов, жми Claim». Первый Claim — player ID на проверку
 * (Александр вручную), после одобрения уходят все накопленные коды; следующие Claim — сразу. Claim до 03.01 23:59 ET.
 */
const DM = {
  t2: () => '🦓 Two trails cleared! Your reward is ready: 1 FP. Hit Claim to get your code.',
  t4: () => '🎁 Four trails cleared! Your reward is ready: 2 FP. Hit Claim to get your code. And the path to the summit is open: there\'s a Christmas tree up there with gifts under it.',
  t6: () => '🏔️ All six trails are clear! Your reward is ready: 5 FP. Hit Claim to get your code.',
  summit: () => '🎄 You made it to the top of Kilimanjaro! Your gift under the tree: 1 SC. Hit Claim to get your code. Merry Christmas from the lion!',

  idPending: () => "Got it! We're checking your player ID now. Your codes land here as soon as it's approved, usually within a day. Keep climbing in the meantime.",
  idApproved: (v) => `✅ Your player ID is approved. Your codes: ${v.codes}. From now on, every new reward comes instantly when you hit Claim.`,
  idRejected: () => "Hmm, we couldn't find that player ID. Check it in your Jumanza profile and hit Claim again. Your rewards are safe.",
  claimed: (v) => `Here you go: ${v.codes}. Enjoy!`,

  practice_open: () => '🐾 The practice trail is open. Slide the animals out of the way and let the safari 4x4 through. Two minutes, and you\'re ready for Christmas morning.',
  trails_open: (v) => v.trails > 0
    ? '🎄 Merry Christmas! All six trails up Kilimanjaro are open. The animals are blocking the road again, and the gifts need to get to the top.'
    : '🎄 Merry Christmas! The animals have blocked every trail up Kilimanjaro, and the gifts need to get to the top. Six trails are waiting for you, open until Dec 26, 11:59 PM ET.',
  dm_unfinished: (v) => v.done === 0
    ? '🌙 Your 4x4 is still at the bottom of the mountain. Six trails are waiting, and everything stays open until tomorrow, 11:59 PM ET. No rush.'
    : `🌙 ${v.left} ${v.left === 1 ? 'trail is' : 'trails are'} still blocked. No rush, everything stays open until tomorrow, 11:59 PM ET.`,
  dm_last_hours: (v) => `⏳ 6 hours left on the mountain. ${v.left}`,
  offer: (v) => `✨ Thanks for getting the gifts up the mountain. Your Christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. Unlock it on the site with code ${v.code}. One per player.`,
  noOffer: () => 'The trails are closed for this year. See you on the next adventure!',
  dm_unclaimed: (v) => `🎁 You still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from Christmas on Kilimanjaro. Hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours. */
function leftLine(p) {
  if (p.trails < 4) return `${4 - p.trails} more ${4 - p.trails === 1 ? 'trail' : 'trails'} and the summit opens for you.`;
  if (!p.summit) return 'The summit is open, and the gifts are still waiting under the tree.';
  if (p.trails < 6) return `${6 - p.trails} ${6 - p.trails === 1 ? 'trail is' : 'trails are'} still blocked.`;
  return null;
}

/**
 * Формат player ID Jumanza (подтверждён Александром 12.11): как у Storm Rush — только цифры, пробелы по краям обрезаем,
 * ведущие нули срезаем (иначе «0123» прошёл бы уникальность как другой ID). Форма Claim в проде — ID + телефон + почта.
 */
const PLAYER_ID = /^\d+$/;
function normalizePlayerId(raw) {
  const id = String(raw || '').trim();
  return PLAYER_ID.test(id) ? id.replace(/^0+(?=\d)/, '') : null;
}

module.exports = { DM, leftLine, PLAYER_ID, normalizePlayerId };
