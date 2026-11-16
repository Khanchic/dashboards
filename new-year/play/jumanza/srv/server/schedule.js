/**
 * Расписание Christmas on Kilimanjaro (Jumanza). Время — America/New_York, Киев = ET + 7.
 *   18.12 12:00 ET  тренировочная тропа (без приза) — логин до праздника и доля прохождения на живых
 *   25.12 00:00 ET  утро Рождества: все 6 троп; вершина с ёлкой — после 4 пройденных троп (без времени)
 *   27.12 00:00 ET  всё закрыто (на странице «26.12 23:59 ET»); 26.12 (суббота) — день догнать
 *   27.12 00:05 ET  офферы личным промокодом по высшему уровню
 *   до 03.01 23:59 ET  Claim prize: player ID при первом Claim, одобрение Александром
 * Часовых окон нет: что открылось, доступно до закрытия.
 *
 * Фазы: before → practice → christmas → closed.
 * Демо (репетиция, плейтест): тот же порядок, сжатый:
 *   build({ demo: { start: ISO, practiceMin: 5, christmasMin: 35, offersGapMin: 1, claimMin: 15 } })
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

const { level: getLevel } = require('./levels');
const MIN = 60000;

function build(opts = {}) {
  const d = opts.demo;
  let practice, christmas, closesAt, offersAt, claimUntil, at;
  if (d && d.start) {
    practice = Date.parse(d.start);
    christmas = practice + (d.practiceMin ?? 5) * MIN;
    closesAt = christmas + (d.christmasMin ?? 35) * MIN;
    offersAt = closesAt + (d.offersGapMin ?? 1) * MIN;
    claimUntil = closesAt + (d.claimMin ?? 15) * MIN;
    const span = (a, b, f) => a + Math.round((b - a) * f / 1000) * 1000;
    at = {
      broadcast: span(practice, christmas, 0.5), postSummits: span(christmas, closesAt, 0.25),
      unfinished: span(christmas, closesAt, 0.4), last: span(christmas, closesAt, 0.85),
      unclaimed: span(closesAt, claimUntil, 0.5),
    };
  } else {
    practice = et('2026-12-18', 12);
    christmas = et('2026-12-25', 0);
    closesAt = et('2026-12-27', 0);
    offersAt = et('2026-12-27', 0, 5);
    claimUntil = et('2027-01-04', 0); // Claim до 03.01 23:59 ET
    at = {
      broadcast: et('2026-12-24', 18), postSummits: et('2026-12-25', 12),
      unfinished: et('2026-12-25', 18), last: et('2026-12-26', 18),
      unclaimed: et('2027-01-02', 12),
    };
  }
  // Что и когда отправляет бот (тексты — server\texts.js)
  const timeline = [
    { at: practice, key: 'practice_open' },          // пост в канале: тренировочная тропа
    { at: at.broadcast, key: 'broadcast_tomorrow' }, // сочельник: пост + бродкаст «утром тропы открыты»
    { at: christmas, key: 'trails_open' },           // утро Рождества: пост + пинг роли, DM всем вошедшим
    { at: at.postSummits, key: 'post_first_summits' },
    { at: at.unfinished, key: 'dm_unfinished' },     // рождественский вечер: у кого есть закрытые тропы
    { at: at.last, key: 'dm_last_hours' },           // 26.12 18:00 — 6 часов до конца
    { at: closesAt, key: 'trails_close' },
    { at: offersAt, key: 'offers' },
    { at: at.unclaimed, key: 'dm_unclaimed' },
  ].sort((a, b) => a.at - b.at);
  return { practice, christmas, closesAt, offersAt, claimUntil, timeline };
}

function phaseAt(s, t) {
  if (t < s.practice) return 'before';
  if (t < s.christmas) return 'practice';
  if (t < s.closesAt) return 'christmas';
  return 'closed';
}

/** Можно ли открыть уровень. trailsDone — пройдено троп 1–6 (тренировочная не считается). */
function canStart(s, t, levelId, { trailsDone = 0 } = {}) {
  const L = getLevel(levelId);
  if (!L) return { ok: false, error: 'bad_level' };
  const ph = phaseAt(s, t);
  if (ph === 'closed') return { ok: false, error: 'closed' };
  if (ph === 'before') return { ok: false, error: 'not_open', opensAt: L.training ? s.practice : s.christmas };
  if (L.training) return { ok: true };
  if (ph === 'practice') return { ok: false, error: 'not_open', opensAt: s.christmas };
  if (L.summit && trailsDone < L.needTrails) return { ok: false, error: 'need_trails', need: L.needTrails - trailsDone };
  return { ok: true };
}

/** Claim открыт с начала до 03.01 23:59 ET. */
function claimOpen(s, t) { return t >= s.practice && t < s.claimUntil; }

module.exports = { TZ, et, build, phaseAt, canStart, claimOpen };
