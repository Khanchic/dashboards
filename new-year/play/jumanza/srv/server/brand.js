/**
 * Адаптер Jumanza · Christmas on Kilimanjaro для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Только обёртка над trail.js / levels.js / schedule.js / texts.js; тиры и таймлайн — как в dev/server.js.
 * 3 карты (позже): новая карта = свои levels/schedule; сейчас одна (Kilimanjaro).
 */
const path = require('path');
const mech = require('./route'); // 3 карты: trail (t1–t2) · bridges (t3–t4) · camps (t5–t6, summit)
const L = require('./levels');
const S = require('./schedule');
const T = require('./texts');

const ROOT = path.join(__dirname, '..');           // jumanza/mechanic
const BRAND = path.join(ROOT, '..');                // jumanza

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const solved = (a) => Boolean(a && a.state && a.state.solved);

function progress(attempts) {
  const trails = L.TRAILS.filter((id) => solved(attempts[id])).length;
  return { trails, summit: solved(attempts.summit) };
}

module.exports = {
  slug: 'jumanza', name: 'Jumanza', event: 'Christmas on Kilimanjaro',
  mech,
  levels: L.LEVELS.map((x) => ({ id: x.id, n: x.n, title: x.title, zone: x.zone, summit: Boolean(x.summit), training: Boolean(x.training) })),
  params: (levelId) => ({ level: levelId }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched ? S.canStart(sched, t, levelId, { trailsDone: p.trails }) : (L.level(levelId) ? { ok: true } : { ok: false, error: 'bad_level' })),
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
    tier: (id) => T.DM[id](),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, offer: T.DM.offer, noOffer: T.DM.noOffer,
  },
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers' })) : []),
  onEvent(key, p, ctx) {
    if (key === 'trails_open') return T.DM.trails_open(p);
    if (key === 'dm_unfinished') return p.trails < 6 ? T.DM.dm_unfinished({ done: p.trails, left: 6 - p.trails }) : null;
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // practice_open, broadcast_tomorrow, post_first_summits, trails_close — посты бота
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? (solved(a) ? 'clear' : a.status === 'expired' ? 'expired' : 'active') : 'new' }),
  statsRow(levelId, attempts) {
    const ok = attempts.filter(solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      zone: (L.level(levelId) || {}).zone, game: mech.gameOf(levelId),
      par: mech.gameOf(levelId) === 'trail' ? (L.level(levelId) || {}).moves : null,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianSlides: ok.length ? median(ok.map((a) => a.state.slides ?? a.state.sets ?? 0)) : null,
      medianResets: ok.length ? median(ok.map((a) => a.state.resets)) : null,
      lionUsed: ok.length ? Math.round((ok.filter((a) => a.state.hints > 0).length / ok.length) * 100) : null,
    };
  },
  playerLine: (p) => ({ trails: p.trails, summit: p.summit }),
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'kili_p',
    dirs: { client: path.join(ROOT, 'client'), shared: path.join(ROOT, 'shared'), assets: path.join(BRAND, 'assets') },
  },
};
