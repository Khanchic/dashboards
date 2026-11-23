/**
 * Адаптер NoLimitCoins · Infinity Garland для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Только обёртка над garland.js / levels.js / schedule.js / texts.js; тиры и таймлайн — как в dev/server.js.
 */
const path = require('path');
const mech = require('./garland');
const L = require('./levels');
const S = require('./schedule');
const T = require('./texts');

const ROOT = path.join(__dirname, '..');           // nolimitcoins/mechanic
const BRAND = path.join(ROOT, '..');                // nolimitcoins

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const solved = (a) => Boolean(a && a.state && a.state.solved);

function progress(attempts) {
  const lit = L.GARLANDS.filter((id) => solved(attempts[id])).length;
  return { lit, star: solved(attempts.star) };
}

module.exports = {
  slug: 'nolimitcoins', name: 'NoLimitCoins', event: 'Infinity Garland',
  mech,
  levels: L.LEVELS.map((x) => ({ id: x.id, n: x.n, title: x.title, size: x.size, star: Boolean(x.star), practice: Boolean(x.practice) })),
  params: (levelId) => ({ level: levelId }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched ? S.canStart(sched, t, levelId, { lit: p.lit }) : (L.level(levelId) ? { ok: true } : { ok: false, error: 'bad_level' })),
  progress,
  passed: solved,
  tiers: L.TIERS,
  reached: L.reached,
  offerFor: L.offerFor,
  claimOpen: (sched, t) => (sched ? S.claimOpen(sched, t) : true),
  phase: (sched, t) => (sched ? S.phaseAt(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.closesAt : null),
  normalizePlayerId: T.normalizePlayerId,
  dm: {
    // t4 до вечера обещает звезду вечером, с вечера — «звезда открыта» (стенд: t >= sched.evening)
    tier: (id, ctx) => T.DM[id]({ starOpen: !ctx.sched || ctx.phase === 'evening' || ctx.phase === 'closed' }),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, offer: T.DM.offer, noOffer: T.DM.noOffer,
  },
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers' })) : []),
  onEvent(key, p, ctx) {
    if (key === 'morning_open') return T.DM.morning_open();
    if (key === 'day_open') return T.DM.day_open({ lit: p.lit });
    if (key === 'star_open') return T.DM.star_open({ lit: p.lit });
    if (key === 'dm_dark_tiers') return p.lit < 6 ? T.DM.dm_dark_tiers({ lit: p.lit, dark: 6 - p.lit }) : null;
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // practice_open, broadcast_tomorrow, lights_out — посты бота
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? (solved(a) ? 'lit' : a.status === 'expired' ? 'expired' : 'active') : 'new' }),
  statsRow(levelId, attempts) {
    const lit = attempts.filter(solved);
    const mins = lit.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      size: (L.level(levelId) || {}).size,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianMoves: lit.length ? median(lit.map((a) => a.state.toggles)) : null,
      bulbs: attempts.length ? attempts[0].state.bulb.reduce((x, y) => x + y, 0) : null,
      hintUsed: lit.length ? Math.round((lit.filter((a) => a.state.hints > 0).length / lit.length) * 100) : null,
    };
  },
  playerLine: (p) => ({ tiers: p.lit, star: p.star }),
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'garland_p',
    dirs: { client: path.join(ROOT, 'client'), shared: path.join(ROOT, 'shared'), assets: path.join(BRAND, 'assets') },
  },
};
