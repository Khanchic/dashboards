/**
 * Личные сообщения бота Dexy's Holiday Stream (EN — как увидят игроки). Голос: стримерша, живо, коротко,
 * строчными, без пафоса и без «казино». Реплики Dexy в окне эфира — client/tag-game.js (CHAT).
 *
 * Призы — как на Witching Hours, кнопкой Claim prize: уровень достигнут → «приз готов, жми Claim».
 * Первый Claim — player ID на проверку (staff вручную), после одобрения уходят все накопленные коды;
 * следующие Claim — сразу. Claim открыт до 03.01 23:59 ET.
 */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const DM = {
  t2: () => '🎨 2 walls tagged! your first reward is ready: 1 FP. hit Claim prize to get your code.',
  t4: (v) => '🔥 4 walls! reward ready: 2 FP. hit Claim prize. ' +
    (v.muralOpen ? 'and my secret mural is open for you now 👀' : 'and you’re in for my secret mural, it opens Dec 26 at midnight ET 👀'),
  t6: () => '🏙️ the whole street is glowing. reward ready: 3 FP. hit Claim prize.',
  mural: () => '🎄 YOU FINISHED THE MURAL. chat, look at this. your gift: 1 SC, hit Claim prize. merry christmas 💜',

  idPending: () => 'got it! we’re checking your player ID now. your codes land here as soon as it’s approved, usually within 48 hours. keep tagging meanwhile.',
  idApproved: (v) => `✅ player ID approved. your codes: ${v.codes}. from now on new rewards arrive automatically when you hit Claim, no extra checks.`,
  idRejected: () => 'hmm, we couldn’t find that player ID. check it in your DexyPlay profile and hit Claim again. your rewards are safe.',
  claimed: (v) => `here you go: ${v.codes}. enjoy!`,

  practice_open: () => '🖌️ the practice wall is up. one tiny puzzle, a minute tops, so you know the drill before I go live on Christmas.',
  live: () => '🔴 I’m LIVE. the city went grey and walls 1–3 are waiting for you. no timer, everything stays open until Dec 26, 11:59 PM ET.',
  wave2: (v) => v.walls >= 3
    ? '🔴 second segment! walls 4–6 just dropped. they’re bigger, you got this.'
    : `🔴 second segment! walls 4–6 just dropped. you’ve got ${plural(v.walls, 'wall', 'walls')} so far, plenty of time.`,
  dm_below_two: (v) => v.walls === 0
    ? '🎄 merry christmas! your street is still grey. one wall takes a minute or two, and 2 walls = your first reward.'
    : '🎄 one more wall and your first reward is yours. no rush, open until tomorrow 11:59 PM ET.',
  mural_open: (v) => v.walls >= 4
    ? '🖼️ the mural is open for you. it’s the big one, and there’s 1 SC on the other side.'
    : `🖼️ the mural opened today. tag ${plural(4 - v.walls, 'more wall', 'more walls')} and it’s yours to paint.`,
  dm_last_hours: (v) => `⏳ 6 hours left on the stream. ${v.left}`,
  offer: (v) => `✨ thanks for painting the city with me. your christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. use code ${v.code} on the site. one per player.`,
  noOffer: () => 'stream’s over! your street stayed grey this time, but thanks for hanging out 💜 see you next stream.',
  dm_unclaimed: (v) => `🎁 you still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from my holiday stream. hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours. */
function leftLine(p) {
  if (p.walls < 2) return `${plural(2 - p.walls, 'more wall', 'more walls')} = your first reward.`;
  if (p.walls < 4) return `${plural(4 - p.walls, 'more wall', 'more walls')} and the mural is yours.`;
  if (!p.mural) return 'the mural is still blank, it’s waiting for you.';
  if (p.walls < 6) return `${plural(6 - p.walls, 'wall is', 'walls are')} still grey on your street.`;
  return null;
}

/**
 * Формат player ID — как решили для Storm / Rewards Rush (12.11): только цифры (пример 1008956), длина любая,
 * ведущие нули срезаются. Возвращает нормализованный ID или null. Проверка «не занят другим Discord» — по нему.
 */
const PLAYER_ID = /^\d{1,20}$/;
function normPlayerId(s) {
  const d = String(s ?? '').trim();
  if (!PLAYER_ID.test(d)) return null;
  return d.replace(/^0+/, '') || null;
}

module.exports = { DM, leftLine, PLAYER_ID, normPlayerId };
