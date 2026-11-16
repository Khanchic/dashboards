/**
 * Расписание Merry Coinsmas: Coin Sort Piggy (CoinsMania). Время — America/New_York, Киев = ET + 7. Решения 12.11.
 *   18.12 12:00 ET  тренировочная банка (без приза)
 *   25.12 00:00 ET  Рождество: банки 1–3
 *   25.12 12:00 ET  банки 4–6
 *   26.12 00:00 ET  золотая банка — для тех, у кого разобрано 4+
 *   27.12 00:00 ET  всё закрыто (на странице «26.12 23:59 ET»)
 *   27.12 00:05 ET  офферы личным промокодом по высшему уровню
 *   до 03.01 23:59 ET  Claim prize (как на Witching Hours): player ID при первом Claim, одобрение staff
 * Часовых окон нет: что открылось, доступно до конца.
 *
 * Фазы: before → practice → wave1 → wave2 → golden → closed.
 * Демо (репетиция): тот же порядок, сжатый:
 *   build({ demo: { start: ISO, practiceMin: 5, wave1Min: 10, wave2Min: 10, goldenMin: 20, offersGapMin: 1, claimMin: 15 } })
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

const { jar: getJar } = require('./jars');
const MIN = 60000;

function build(opts = {}) {
  const d = opts.demo;
  let practice, wave1, wave2, golden, closesAt, offersAt, claimUntil, at;
  if (d && d.start) {
    practice = Date.parse(d.start);
    wave1 = practice + (d.practiceMin ?? 5) * MIN;
    wave2 = wave1 + (d.wave1Min ?? 10) * MIN;
    golden = wave2 + (d.wave2Min ?? 10) * MIN;
    closesAt = golden + (d.goldenMin ?? 20) * MIN;
    offersAt = closesAt + (d.offersGapMin ?? 1) * MIN;
    claimUntil = closesAt + (d.claimMin ?? 15) * MIN;
    const span = (a, b, f) => a + Math.round((b - a) * f / 1000) * 1000;
    at = {
      broadcast: wave1 - Math.round((d.practiceMin ?? 5) * MIN / 2),
      below2: span(wave2, golden, 0.66), last: span(golden, closesAt, 0.75), unclaimed: span(closesAt, claimUntil, 0.5),
    };
  } else {
    practice = et('2026-12-18', 12);
    wave1 = et('2026-12-25', 0);
    wave2 = et('2026-12-25', 12);
    golden = et('2026-12-26', 0);
    closesAt = et('2026-12-27', 0);
    offersAt = et('2026-12-27', 0, 5);
    claimUntil = et('2027-01-04', 0); // Claim до 03.01 23:59 ET
    at = { broadcast: et('2026-12-24', 18), below2: et('2026-12-25', 20), last: et('2026-12-26', 18), unclaimed: et('2027-01-02', 12) };
  }
  // Что и когда отправляет бот (тексты — server\texts.js)
  const timeline = [
    { at: practice, key: 'practice_open' },        // пост: тренировочная банка открыта
    { at: at.broadcast, key: 'broadcast_soon' },   // пост + бродкаст «банки откроются в полночь»
    { at: wave1, key: 'live' },                    // Рождество: пост + DM каждому зарегистрированному
    { at: wave2, key: 'wave2' },                   // банки 4–6: пост + DM
    { at: at.below2, key: 'dm_below_two' },        // вечер Рождества: тем, у кого < 2 банок
    { at: golden, key: 'golden_open' },            // DM: золотая банка открыта / сколько банок до неё
    { at: at.last, key: 'dm_last_hours' },         // 26.12 18:00 — 6 часов до конца
    { at: closesAt, key: 'event_end' },            // пост «копилки закрыты» + итог
    { at: offersAt, key: 'offers' },               // DM: оффер по уровню
    { at: at.unclaimed, key: 'dm_unclaimed' },     // тем, кто не нажал Claim
  ].sort((a, b) => a.at - b.at);
  return { practice, wave1, wave2, golden, closesAt, offersAt, claimUntil, timeline };
}

function phaseAt(s, t) {
  if (t < s.practice) return 'before';
  if (t < s.wave1) return 'practice';
  if (t < s.wave2) return 'wave1';
  if (t < s.golden) return 'wave2';
  if (t < s.closesAt) return 'golden';
  return 'closed';
}

function opensAt(s, j) {
  if (j.practice) return s.practice;
  if (j.golden) return s.golden;
  return j.wave === 2 ? s.wave2 : s.wave1;
}

/** Можно ли открыть банку. jarsDone — разобранные банки 1–6 (тренировочная не считается). */
function canStart(s, t, jarId, { jarsDone = 0 } = {}) {
  const j = getJar(jarId);
  if (!j) return { ok: false, error: 'bad_jar' };
  if (t >= s.closesAt) return { ok: false, error: 'closed' };
  const at = opensAt(s, j);
  if (t < at) return { ok: false, error: 'not_open', opensAt: at };
  if (j.golden && jarsDone < j.needJars) return { ok: false, error: 'need_jars', need: j.needJars - jarsDone };
  return { ok: true };
}

/** Claim открыт с начала до 03.01 23:59 ET. */
function claimOpen(s, t) { return t >= s.practice && t < s.claimUntil; }

module.exports = { TZ, et, build, phaseAt, opensAt, canStart, claimOpen };
