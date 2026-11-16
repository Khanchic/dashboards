/**
 * Расписание Vegas Way NY (решения 11.11). Время — America/New_York.
 *   31.12: акты I–VI открываются в 12:00…17:00 ET, все закрываются в 23:30 ET.
 *   01.01 00:00 ET: салют + Claim по текущему уровню.
 *   01.01 10:00–20:00 ET: Encore — можно начать акты, которые игрок 31-го не начинал (если ещё не забрал приз).
 *   01.01 20:00 ET: Encore Salute + Claim для доигравших. Claim открыт до 03.01 23:59 ET.
 *
 * Демо-режим (репетиция на стенде 23–24.12): тот же порядок событий, сжатый в ~1 час:
 *   build({ demo: { start: ISO, actGapMin: 2, playMin: 20, encoreMin: 15 } })
 *   необязательно: midnightGapMin (2), encoreGapMin (3), claimMin (30) — паузы между закрытием, «полночью» и Encore.
 */
const TZ = 'America/New_York';
const dtf = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
function offsetAt(ms) {
  const p = {};
  for (const part of dtf.formatToParts(new Date(ms))) p[part.type] = part.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
}
/** UTC-мс для даты 'YYYY-MM-DD' и времени hh:mm в Нью-Йорке (как clock.et в Witching Hours). */
function et(date, hh, mm = 0) {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return t;
}

const { ACTS } = require('./acts');
const DAY = '2026-12-31', NEXT = '2027-01-01';
const MIN = 60000;

function build(opts = {}) {
  const d = opts.demo;
  let acts, closesAt, midnight, encore, claimUntil;
  if (d && d.start) {
    const t0 = Date.parse(d.start), gap = (d.actGapMin || 2) * MIN;
    acts = ACTS.map((a, i) => ({ act: a.act, opensAt: t0 + i * gap }));
    closesAt = acts[acts.length - 1].opensAt + (d.playMin || 20) * MIN;
    midnight = closesAt + (d.midnightGapMin ?? 2) * MIN;
    const eo = midnight + (d.encoreGapMin ?? 3) * MIN;
    encore = { opensAt: eo, closesAt: eo + (d.encoreMin || 15) * MIN };
    claimUntil = encore.closesAt + (d.claimMin ?? 30) * MIN;
  } else {
    acts = ACTS.map((a) => ({ act: a.act, opensAt: et(DAY, a.opensHour) }));
    closesAt = et(DAY, 23, 30);
    midnight = et(NEXT, 0);
    encore = { opensAt: et(NEXT, 10), closesAt: et(NEXT, 20) };
    claimUntil = et('2027-01-03', 23, 59);
  }
  acts.forEach((a) => { a.closesAt = closesAt; });

  // Что и когда отправляет бот (тексты — launch\comms.md). DM в 21:00 ET — недоигравшим.
  const remind = d && d.start ? acts[acts.length - 1].opensAt + Math.round((d.playMin || 20) * 0.6) * MIN : et(DAY, 21);
  const timeline = [
    { at: d && d.start ? acts[0].opensAt - MIN : et(DAY, 11), key: 'everyone' },
    ...acts.map((a) => ({ at: a.opensAt, key: 'act_open', act: a.act })),
    { at: remind, key: 'dm_unfinished' },
    { at: closesAt, key: 'acts_closed' },
    { at: midnight - (d && d.start ? MIN : 20 * MIN), key: 'salute_soon' },
    { at: midnight, key: 'salute_claim' },
    { at: encore.opensAt, key: 'encore_open' },
    { at: encore.closesAt, key: 'encore_salute_claim' },
  ].sort((a, b) => a.at - b.at);

  return { acts, closesAt, midnight, encore, claimUntil, timeline };
}

/**
 * Фаза ивента в момент t:
 *  before → show (акты открыты по одному) → intermission (23:30–00:00) → claim (салют прошёл, Encore ещё нет)
 *  → encore → after (Claim для доигравших до claimUntil) → over
 */
function phaseAt(s, t) {
  if (t < s.acts[0].opensAt) return 'before';
  if (t < s.closesAt) return 'show';
  if (t < s.midnight) return 'intermission';
  if (t < s.encore.opensAt) return 'claim';
  if (t < s.encore.closesAt) return 'encore';
  if (t < s.claimUntil) return 'after';
  return 'over';
}

/**
 * Можно ли игроку начать акт. started — номера актов, которые он уже начинал; claimed — забрал ли приз.
 * Уже начатый акт можно доигрывать, пока открыт его период (show или encore для актов, начатых в Encore).
 */
function canStart(s, t, act, { started = [], claimed = false, startedInEncore = [] } = {}) {
  const a = s.acts.find((x) => x.act === Number(act));
  if (!a) return { ok: false, error: 'bad_act' };
  const ph = phaseAt(s, t);
  const has = started.includes(a.act);
  if (claimed) return { ok: false, error: 'claimed' };
  if (ph === 'show') return t >= a.opensAt ? { ok: true, resume: has } : { ok: false, error: 'not_open', opensAt: a.opensAt };
  if (ph === 'encore') {
    if (!has) return { ok: true, resume: false };
    return startedInEncore.includes(a.act) ? { ok: true, resume: true } : { ok: false, error: 'already_played' };
  }
  if (ph === 'before') return { ok: false, error: 'not_open', opensAt: a.opensAt };
  if (ph === 'intermission' || ph === 'claim') return { ok: false, error: 'closed', encoreAt: s.encore.opensAt };
  return { ok: false, error: 'closed' };
}

/** Claim открыт с полуночи до claimUntil. Во время Encore тот, кто играет акт, может забрать после 20:00 ET. */
function claimOpen(s, t) {
  const ph = phaseAt(s, t);
  return ph === 'claim' || ph === 'encore' || ph === 'after';
}

module.exports = { TZ, et, build, phaseAt, canStart, claimOpen };
