/**
 * Личные сообщения бота The North Star Expedition (EN — как увидят игроки). Голос исследовательницы: тёплый, живой,
 * без пафоса. Кот — Saffron (имя одобрено 12.11), рыжий, самодовольный. Подсказки кота — только в Watchers, не в ЛС.
 *
 * Призы — как на Witching Hours, кнопкой Claim prize: уровень достигнут → «приз готов, жми Claim».
 * Первый Claim — player ID на проверку (Александр вручную), после одобрения уходят все накопленные коды;
 * следующие Claim — сразу. Claim открыт до 03.01 23:59 ET.
 */
const DM = {
  // уровни
  t3: () => '🧭 Three stamps in your passport! Your reward is ready: 2 FP + 20K GC. Hit Claim to get your code.',
  t6: () => '🗺️ Six stamps! You\'re a real navigator now. Your reward is ready: 3 FP + 30K GC. Hit Claim to get your code.',
  oasis: (v) => '🌴 You found the North Star Oasis! Your reward is ready: 1 SC + 50K GC. Hit Claim to get your code.' +
    (v.superOpen ? ' And look closer at the water... the Golden Compass is waiting for you.' : ''),
  super_open: () => '✨ You found everything. Every find, every paw print, the oasis. The Golden Compass is waiting for you on the map: two tries, no hints. Good luck, explorer.',
  golden: () => '🏆 You found the Golden Compass! You\'re in the draw for 50 SC on Dec 27. We\'ll message the winner here, and the result goes up in #north-star.',
  golden_won: () => '🏆 The Golden Compass picked you! You won 50 SC. Hit Claim to get your code. Merry Christmas from me and Saffron!',

  // Claim / player ID
  idPending: () => "Got it! We're checking your player ID now. Your codes land here as soon as it's approved, usually within a day. Keep exploring in the meantime.",
  idApproved: (v) => `✅ Your player ID is approved. Your codes: ${v.codes}. From now on, every new reward comes instantly when you hit Claim.`,
  idRejected: () => "Hmm, we couldn't find that player ID. Check it in your Scarlet Sands profile and hit Claim again. Your rewards are safe.",
  claimed: (v) => `Here you go: ${v.codes}. Enjoy!`,

  // расписание
  training_open: () => '🧭 Your Expedition Passport is ready, and the practice page is open. One small find, two minutes, and you\'ll know exactly how to read my diary on Christmas Day.',
  broadcast_tomorrow: () => '🎄 Tomorrow at 11 AM ET my diary opens. Six finds on your own map, a smug ginger cat in the dunes, and an oasis on Dec 26. See you there!',
  chapter1: () => '🎁 Merry Christmas! My diary is open. Chapter 1 has your first two finds waiting on your map. Everything stays open until Dec 26, 11:59 PM ET.',
  chapter3: () => '🌙 Chapter 3 is out: your last two finds, and they\'re the tricky ones. Take your time, everything stays open until tomorrow night.',
  dm_low_stamps: (v) => v.stamps === 0
    ? '🌙 Merry Christmas! Your passport is still empty, and that\'s fine. All six finds stay open until tomorrow, 11:59 PM ET. One cozy evening is enough.'
    : `🌙 ${v.stamps} ${v.stamps === 1 ? 'stamp' : 'stamps'} so far. Three stamps unlock your first reward, and everything stays open until tomorrow, 11:59 PM ET.`,
  oasis_open: (v) => v.stamps >= 4
    ? '🌴 The North Star Oasis is open for you. Your own finds point the way. Saffron will be around the camp at 2 PM ET, too.'
    : `🌴 The oasis opened today. ${4 - v.stamps} more ${4 - v.stamps === 1 ? 'stamp' : 'stamps'} and it\'s yours to find. Finds and paw prints both count.`,
  dm_last_hours: (v) => `⏳ About 5 hours left. ${v.left}`,
  offer: (v) => `✨ Thanks for exploring with me. Your Christmas deal for the next 72 hours: ${v.name} ${v.price}, ${v.bonus} extra. Unlock it on the site with code ${v.code}. One per player.`,
  noOffer: () => 'The desert is quiet again. Your passport stayed empty this time, but there\'s always a next expedition. See you there!',
  dm_unclaimed: (v) => `🎁 You still have ${v.n === 1 ? 'a reward' : v.n + ' rewards'} waiting from the North Star Expedition. Hit Claim before Jan 3, 11:59 PM ET.`,
};

/** Что осталось игроку — для dm_last_hours (null — не писать). */
function leftLine(p) {
  if (p.stamps < 3) return `${3 - p.stamps} more ${3 - p.stamps === 1 ? 'stamp' : 'stamps'} for your first reward.`;
  if (p.stamps < 4) return 'One more stamp and the oasis opens for you.';
  if (!p.oasis) return 'The oasis is still waiting for you.';
  if (p.stamps < 6) return `${6 - p.stamps} more ${6 - p.stamps === 1 ? 'stamp' : 'stamps'} for the Navigator reward.`;
  return null;
}

/** Формат player ID: только цифры (как в форме Witching Hours). Длину уточнить по реальным ID Scarlet Sands. */
const PLAYER_ID = /^\d{4,12}$/;

module.exports = { DM, leftLine, PLAYER_ID };
