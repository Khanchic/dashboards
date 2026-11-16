/**
 * Расписание Infinity Garland (NoLimitCoins). Время — America/New_York, Киев = ET + 7.
 * Рождество в США важнее Нового года (решение 11.11) → всё главное происходит 25.12, 26.12 — день догнать.
 *   18.12 12:00 ET  тренировочный шар (без приза)
 *   25.12 00:00 ET  утро Рождества: ярусы 1–3
 *   25.12 12:00 ET  ярусы 4–6
 *   25.12 18:00 ET  рождественский вечер: звезда ∞ на верхушке — для тех, у кого горят 4+ яруса
 *   27.12 00:00 ET  гирлянды гаснут, всё закрыто (на странице «26.12 23:59 ET»)
 *   27.12 00:05 ET  офферы личным промокодом по высшему уровню
 *   до 03.01 23:59 ET  Claim prize: player ID при первом Claim, одобрение Александром (правило 8)
 * Часовых окон нет: что открылось, доступно до закрытия.
 *
 * Фазы: before → practice → morning (ярусы 1–3) → day (1–6) → evening (1–6 + звезда) → closed.
 * Демо (репетиция, плейтест): тот же порядок, сжатый:
 *   build({ demo: { start: ISO, practiceMin: 5, morningMin: 8, dayMin: 8, eveningMin: 20, offersGapMin: 1, claimMin: 15 } })
 */
const TZ = 'America/New_York';
const dtf = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function offsetAt(ms) {
  const p = {};
  for (const part of dtf.formatToParts(new Date(ms))) p[part.type] = part.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
/** UTC-мс для даты 'YYYY-MM-DD' и времени hh:mm в Нью-Йорке. */
function et(date, hh, mm = 0) {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return t;
}

const { level: getLevel, WAVE1, WAVE2 } = require('./levels');
const MIN = 60000;

function build(opts = {}) {
  const d = opts.demo;
  let practice, morning, day, evening, closesAt, offersAt, claimUntil, at;
  if (d && d.start) {
    practice = Date.parse(d.start);
    morning = practice + (d.practiceMin ?? 5) * MIN;
    day = morning + (d.morningMin ?? 8) * MIN;
    evening = day + (d.dayMin ?? 8) * MIN;
    closesAt = evening + (d.eveningMin ?? 20) * MIN;
    offersAt = closesAt + (d.offersGapMin ?? 1) * MIN;
    claimUntil = closesAt + (d.claimMin ?? 15) * MIN;
    const span = (a, b, f) => a + Math.round((b - a) * f / 1000) * 1000;
    at = {
      broadcast: morning - Math.round((d.practiceMin ?? 5) * MIN / 2),
      dark: span(evening, closesAt, 0.4), last: span(evening, closesAt, 0.85),
      unclaimed: span(closesAt, claimUntil, 0.5),
    };
  } else {
    practice = et('2026-12-18', 12);
    morning = et('2026-12-25', 0);
    day = et('2026-12-25', 12);
    evening = et('2026-12-25', 18);
    closesAt = et('2026-12-27', 0);
    offersAt = et('2026-12-27', 0, 5);
    claimUntil = et('2027-01-04', 0); // Claim до 03.01 23:59 ET
    at = {
      broadcast: et('2026-12-24', 18),
      dark: et('2026-12-26', 12), last: et('2026-12-26', 18),
      unclaimed: et('2027-01-02', 12),
    };
  }
  // Что и когда отправляет бот (тексты — ..\copy\TEXTS.md, server\texts.js)
  const timeline = [
    { at: practice, key: 'practice_open' },          // пост в #infinity-garland, канал открывается
    { at: at.broadcast, key: 'broadcast_tomorrow' },  // бродкаст + пост «завтра ёлка»
    { at: morning, key: 'morning_open' },             // DM всем вошедшим: ярусы 1–3
    { at: day, key: 'day_open' },                     // DM: ярусы 4–6
    { at: evening, key: 'star_open' },               // DM: звезда открыта / сколько ярусов до звезды
    { at: at.dark, key: 'dm_dark_tiers' },            // 26.12 12:00 — у кого есть тёмные ярусы
    { at: at.last, key: 'dm_last_hours' },            // 26.12 18:00 — 6 часов до конца
    { at: closesAt, key: 'lights_out' },
    { at: offersAt, key: 'offers' },
    { at: at.unclaimed, key: 'dm_unclaimed' },        // 02.01 12:00 — незабранные призы
  ].sort((a, b) => a.at - b.at);
  return { practice, morning, day, evening, closesAt, offersAt, claimUntil, timeline };
}

function phaseAt(s, t) {
  if (t < s.practice) return 'before';
  if (t < s.morning) return 'practice';
  if (t < s.day) return 'morning';
  if (t < s.evening) return 'day';
  if (t < s.closesAt) return 'evening';
  return 'closed';
}

/** Когда открывается уровень. */
function opensAt(s, id) {
  const L = getLevel(id);
  if (!L) return null;
  if (L.practice) return s.practice;
  if (L.star) return s.evening;
  if (WAVE1.includes(id)) return s.morning;
  if (WAVE2.includes(id)) return s.day;
  return null;
}

/** Можно ли открыть уровень. lit — горящие ярусы 1–6 (тренировочный шар не считается). */
function canStart(s, t, id, { lit = 0 } = {}) {
  const L = getLevel(id);
  if (!L) return { ok: false, error: 'bad_level' };
  if (phaseAt(s, t) === 'closed') return { ok: false, error: 'closed' };
  const at = opensAt(s, id);
  if (t < at) return { ok: false, error: 'not_open', opensAt: at };
  if (L.star && lit < L.needTiers) return { ok: false, error: 'need_tiers', need: L.needTiers - lit };
  return { ok: true };
}

/** Claim открыт с тренировки до 03.01 23:59 ET. */
function claimOpen(s, t) { return t >= s.practice && t < s.claimUntil; }

module.exports = { TZ, et, build, phaseAt, opensAt, canStart, claimOpen };
