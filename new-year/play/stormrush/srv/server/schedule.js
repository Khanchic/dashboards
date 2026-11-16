/**
 * Расписание Light Up Christmas (Storm Rush). Время — America/New_York, Киев = ET + 7.
 * Решение 11.11: Рождество в США важнее Нового года → кульминация в утро Рождества, а не 26-го.
 *   18.12 12:00 ET  тренировочный дом (без приза)
 *   24.12 12:00 ET  сочельник: улица, все 6 домов — «зажги свет до утра Рождества»
 *   25.12 00:00 ET  утро Рождества: ёлка на площади — для тех, у кого горят 4+ дома; дома доделывать можно
 *   27.12 00:00 ET  свет гаснет, всё закрыто (на странице «26.12 23:59 ET»); 26.12 (суббота) — день догнать
 *   27.12 00:05 ET  офферы личным промокодом по высшему уровню
 *   до 03.01 23:59 ET  Claim prize (как на Witching Hours): player ID при первом Claim, одобрение Александром
 * Часовых окон нет: что открылось, доступно до закрытия.
 *
 * Фазы: before → training → eve (сочельник, только дома) → christmas (25–26.12, дома + ёлка) → closed.
 * Демо (репетиция 18.12, плейтест): тот же порядок, сжатый:
 *   build({ demo: { start: ISO, trainingMin: 5, eveMin: 15, christmasMin: 25, offersGapMin: 1, claimMin: 15 } })
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
  let training, eve, christmas, closesAt, offersAt, claimUntil, at;
  if (d && d.start) {
    training = Date.parse(d.start);
    eve = training + (d.trainingMin ?? 5) * MIN;
    christmas = eve + (d.eveMin ?? 15) * MIN;
    closesAt = christmas + (d.christmasMin ?? 25) * MIN;
    offersAt = closesAt + (d.offersGapMin ?? 1) * MIN;
    claimUntil = closesAt + (d.claimMin ?? 15) * MIN;
    // точки таймлайна — доли своих периодов
    const span = (a, b, f) => a + Math.round((b - a) * f / 1000) * 1000;
    at = {
      postStreets: span(eve, christmas, 0.66), postTrees: span(christmas, closesAt, 0.25),
      dark: span(christmas, closesAt, 0.4), last: span(christmas, closesAt, 0.85),
      unclaimed: span(closesAt, claimUntil, 0.5), broadcast: eve - Math.round((d.trainingMin ?? 5) * MIN / 2),
    };
  } else {
    training = et('2026-12-18', 12);
    eve = et('2026-12-24', 12);
    christmas = et('2026-12-25', 0);
    closesAt = et('2026-12-27', 0);
    offersAt = et('2026-12-27', 0, 5);
    claimUntil = et('2027-01-04', 0);  // Claim до 03.01 23:59 ET
    at = {
      postStreets: et('2026-12-24', 20), postTrees: et('2026-12-25', 12),
      dark: et('2026-12-25', 18), last: et('2026-12-26', 18),
      unclaimed: et('2027-01-02', 12), broadcast: et('2026-12-23', 18),
    };
  }
  // Что и когда отправляет бот (тексты — copy\TEXTS.md, server\texts.js)
  const timeline = [
    { at: training, key: 'training_open' },
    { at: at.broadcast, key: 'broadcast_tomorrow' },    // пост + бродкаст «завтра свет гаснет»
    { at: eve, key: 'street_open' },                    // сочельник: пост + пинг роли ⚡ Games
    { at: at.postStreets, key: 'post_first_streets' },
    { at: christmas, key: 'tree_open' },                // утро Рождества: DM каждому — ёлка открыта / сколько домов до ёлки
    { at: at.postTrees, key: 'post_first_trees' },
    { at: at.dark, key: 'dm_dark_houses' },             // рождественский вечер: тем, у кого есть тёмные дома
    { at: at.last, key: 'dm_last_hours' },              // 26.12 18:00 — 6 часов до конца
    { at: closesAt, key: 'lights_out' },
    { at: offersAt, key: 'offers_and_mosaic' },
    { at: at.unclaimed, key: 'dm_unclaimed' },          // тем, кто не нажал Claim
  ].sort((a, b) => a.at - b.at);
  return { training, eve, christmas, closesAt, offersAt, claimUntil, timeline };
}

function phaseAt(s, t) {
  if (t < s.training) return 'before';
  if (t < s.eve) return 'training';
  if (t < s.christmas) return 'eve';
  if (t < s.closesAt) return 'christmas';
  return 'closed';
}

/** Можно ли открыть уровень. housesLit — зажжённые дома 1–6 (тренировочный не считается). */
function canStart(s, t, levelId, { housesLit = 0 } = {}) {
  const L = getLevel(levelId);
  if (!L) return { ok: false, error: 'bad_level' };
  const ph = phaseAt(s, t);
  if (ph === 'closed') return { ok: false, error: 'closed' };
  if (ph === 'before') return { ok: false, error: 'not_open', opensAt: L.training ? s.training : L.tree ? s.christmas : s.eve };
  if (L.training) return { ok: true };
  if (ph === 'training') return { ok: false, error: 'not_open', opensAt: L.tree ? s.christmas : s.eve };
  if (!L.tree) return { ok: true };
  if (ph === 'eve') return { ok: false, error: 'not_open', opensAt: s.christmas };
  if (housesLit < L.needHouses) return { ok: false, error: 'need_houses', need: L.needHouses - housesLit };
  return { ok: true };
}

/** Claim открыт с начала до 03.01 23:59 ET. */
function claimOpen(s, t) { return t >= s.training && t < s.claimUntil; }

module.exports = { TZ, et, build, phaseAt, canStart, claimOpen };
