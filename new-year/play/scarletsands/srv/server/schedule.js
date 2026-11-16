/**
 * Расписание The North Star Expedition (Scarlet Sands). Время — America/New_York, Киев = ET + 7.
 * Решения 11–12.11 (..\..\HANDOFF.md): в США Рождество важнее НГ; главы позже — утро подарков, ужин, свободный вечер.
 *   18.12 12:00 ET  страница 0 (тренировка, без приза)
 *   25.12 11:00 ET  глава 1 (2 лёгкие) · 11:30 кот 1 в Watchers
 *   25.12 15:00 ET  глава 2 (2 средние) · 15:30 кот 2
 *   25.12 19:00 ET  глава 3 (2 трудные) · 19:30 кот 3
 *   26.12 11:00 ET  оазис (при 4+ штампах) · 14:00 кот 4 → у собравших всё открывается Golden Compass
 *   27.12 00:00 ET  всё закрыто (на странице «26.12 11:59 PM ET»)
 *   27.12 00:05 ET  офферы личным промокодом · 05:00 ET (12:00 Киев) розыгрыш Golden Compass, 50 SC, 1 победитель
 *   до 03.01 23:59 ET  Claim prize (как на Witching Hours): player ID только при Claim, одобряет Александр
 * Часовых окон нет: что открылось, доступно до закрытия.
 *
 * Фазы: before → training → christmas (25.12, главы) → oasis (26.12) → closed.
 * Демо (плейтест/репетиция) — тот же порядок, сжатый:
 *   build({ demo: { start: ISO, trainingMin, chapterGapMin, catLagMin, oasisGapMin, cat4Min, closeMin, offersGapMin, drawGapMin, claimMin } })
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

const MIN = 60000;

function build(opts = {}) {
  const d = opts.demo;
  let training, chapters, cats, oasis, closesAt, offersAt, drawAt, claimUntil, at;
  if (d && d.start) {
    const m = (k, def) => (d[k] ?? def) * MIN;
    training = Date.parse(d.start);
    const c1 = training + m('trainingMin', 5), gap = m('chapterGapMin', 4), lag = m('catLagMin', 1);
    chapters = [c1, c1 + gap, c1 + 2 * gap];
    oasis = chapters[2] + m('oasisGapMin', 6);
    cats = [chapters[0] + lag, chapters[1] + lag, chapters[2] + lag, oasis + m('cat4Min', 2)];
    closesAt = oasis + m('closeMin', 12);
    offersAt = closesAt + m('offersGapMin', 1);
    drawAt = closesAt + m('drawGapMin', 2);
    claimUntil = closesAt + m('claimMin', 15);
    const span = (a, b, f) => a + Math.round((b - a) * f / 1000) * 1000;
    at = { broadcast: span(training, c1, 0.5), low: span(chapters[2], oasis, 0.5), last: span(oasis, closesAt, 0.66), unclaimed: span(closesAt, claimUntil, 0.5) };
  } else {
    training = et('2026-12-18', 12);
    chapters = [et('2026-12-25', 11), et('2026-12-25', 15), et('2026-12-25', 19)];
    oasis = et('2026-12-26', 11);
    cats = [et('2026-12-25', 11, 30), et('2026-12-25', 15, 30), et('2026-12-25', 19, 30), et('2026-12-26', 14)];
    closesAt = et('2026-12-27', 0);
    offersAt = et('2026-12-27', 0, 5);
    drawAt = et('2026-12-27', 5);           // 12:00 Киев — дежурный проводит розыгрыш днём
    claimUntil = et('2027-01-04', 0);       // Claim до 03.01 23:59 ET
    at = { broadcast: et('2026-12-24', 18), low: et('2026-12-25', 22), last: et('2026-12-26', 19), unclaimed: et('2027-01-02', 12) };
  }
  // Что и когда делает бот/команда (тексты — server/texts.js, copy/TEXTS.md; коты — операторы Watchers по туториалу)
  const timeline = [
    { at: training, key: 'training_open' },          // пост: страница 0 + анонс
    { at: at.broadcast, key: 'broadcast_tomorrow' }, // 24.12 вечер: бродкаст + ЛС «Tomorrow, 11 AM ET»
    { at: chapters[0], key: 'chapter1' },             // ЛС всем с паспортом + пост
    { at: cats[0], key: 'cat1' },                     // Watchers (операторы) + пост «Saffron was seen in Watchers»
    { at: chapters[1], key: 'chapter2' },             // только пост (время ужина)
    { at: cats[1], key: 'cat2' },
    { at: chapters[2], key: 'chapter3' },             // ЛС всем + пост
    { at: cats[2], key: 'cat3' },
    { at: at.low, key: 'dm_low_stamps' },             // ЛС тем, у кого < 3 штампов
    { at: oasis, key: 'oasis_open' },                 // бродкаст + ЛС по штампам
    { at: cats[3], key: 'cat4' },
    { at: at.last, key: 'dm_last_hours' },            // ЛС незакончившим
    { at: closesAt, key: 'closed' },
    { at: offersAt, key: 'offers' },                  // офферы по высшему уровню
    { at: drawAt, key: 'draw' },                      // розыгрыш Golden Compass (staff)
    { at: at.unclaimed, key: 'dm_unclaimed' },        // не нажавшим Claim
  ].sort((a, b) => a.at - b.at);
  return { training, chapters, cats, oasis, closesAt, offersAt, drawAt, claimUntil, timeline };
}

function phaseAt(s, t) {
  if (t < s.training) return 'before';
  if (t < s.chapters[0]) return 'training';
  if (t < s.oasis) return 'christmas';
  if (t < s.closesAt) return 'oasis';
  return 'closed';
}

/** Что открыто в момент t — это ctx.open для модуля механики. */
function openAt(s, t) {
  return {
    phase: phaseAt(s, t),
    training: t >= s.training && t < s.closesAt,
    chapter: s.chapters.filter((x) => t >= x).length,
    cats: s.cats.filter((x) => t >= x).length,
    oasis: t >= s.oasis,
    closed: t >= s.closesAt,
    next: { chapter: s.chapters.find((x) => x > t) || null, cat: s.cats.find((x) => x > t) || null, oasis: t < s.oasis ? s.oasis : null },
  };
}

/** Плейтест: открыто всё сразу. */
const ALL_OPEN = Object.freeze({ phase: 'playtest', training: true, chapter: 3, cats: 4, oasis: true, closed: false, next: {} });

/** Можно ли открыть конкурс: 'training' (страница 0) или 'expedition' (с 25.12, глава 1). */
function canStart(s, t, kind) {
  const ph = phaseAt(s, t);
  if (ph === 'closed') return { ok: false, error: 'closed' };
  if (kind === 'training') return ph === 'before' ? { ok: false, error: 'not_open', opensAt: s.training } : { ok: true };
  if (kind === 'expedition') return ph === 'before' || ph === 'training' ? { ok: false, error: 'not_open', opensAt: s.chapters[0] } : { ok: true };
  return { ok: false, error: 'bad_kind' };
}

/** Claim открыт со страницы 0 до 03.01 23:59 ET. */
function claimOpen(s, t) { return t >= s.training && t < s.claimUntil; }

module.exports = { TZ, et, build, phaseAt, openAt, canStart, claimOpen, ALL_OPEN };
