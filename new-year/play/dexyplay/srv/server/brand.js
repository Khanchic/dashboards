/**
 * Адаптер DexyPlay · Tag the City для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Только обёртка над tagwall.js / walls.js / schedule.js / texts.js / fairplay.js; тиры и таймлайн — как в dev/server.js.
 * Отличия от Storm: стенд шлёт { wall } вместо { level } и читает me.walls (apiIn/apiOut); расписанная стена отдаёт
 * `tagged` (картинка игрока) — её рисует улица/3D-город.
 */
const path = require('path');
const mech = require('./tagwall');
const W = require('./walls');
const S = require('./schedule');
const T = require('./texts');
const { fastSolve } = require('./fairplay');

const ROOT = path.join(__dirname, '..');           // dexyplay/mechanic
const BRAND = path.join(ROOT, '..');                // dexyplay

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const solved = (a) => Boolean(a && a.state && a.state.solved);

function progress(attempts) {
  const walls = W.STREET.filter((id) => solved(attempts[id])).length;
  return { walls, mural: solved(attempts.mural) };
}

module.exports = {
  slug: 'dexyplay', name: 'DexyPlay', event: "Dexy's Holiday Stream",
  mech,
  levels: W.WALLS.map((x) => ({ id: x.id, n: x.n, title: x.title, size: x.size, practice: Boolean(x.practice), mural: Boolean(x.mural) })),
  params: (levelId) => ({ wall: levelId }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched ? S.canStart(sched, t, levelId, { wallsDone: p.walls }) : (W.wall(levelId) ? { ok: true } : { ok: false, error: 'bad_level' })),
  progress,
  passed: solved,
  tiers: W.TIERS,
  reached: W.reached,
  offerFor: W.offerFor,
  claimOpen: (sched, t) => (sched ? S.claimOpen(sched, t) : true),
  phase: (sched, t) => (sched ? S.phaseAt(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.closesAt : null),
  normalizePlayerId: T.normPlayerId,
  dm: {
    // стенд: muralOpen = t >= sched.mural
    tier: (id, ctx) => T.DM[id]({ muralOpen: !ctx.sched || ctx.phase === 'mural' || ctx.phase === 'closed' }),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, offer: T.DM.offer, noOffer: T.DM.noOffer,
  },
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers' })) : []),
  onEvent(key, p, ctx) {
    if (key === 'live') return T.DM.live();
    if (key === 'wave2') return T.DM.wave2({ walls: p.walls });
    if (key === 'dm_below_two') return p.walls < 2 ? T.DM.dm_below_two({ walls: p.walls }) : null;
    if (key === 'mural_open') return !p.mural ? T.DM.mural_open({ walls: p.walls }) : null;
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // practice_open, broadcast_live_soon, stream_end — посты бота
  },
  levelCard(lv, a) {
    const out = { ...lv, status: a ? (solved(a) ? 'tagged' : a.status === 'expired' ? 'expired' : 'active') : 'new' };
    if (solved(a)) out.tagged = { name: a.state.name, W: a.state.W, H: a.state.H, grid: a.state.grid.slice(), neon: (W.wall(lv.id) || {}).neon };
    return out;
  },
  flag(a) {
    const s = a.state, w = W.wall(s.wall) || {}; // движок не передаёт level в flag → берём из state
    return fastSolve({ W: s.W, H: s.H, ms: a.finishedAt - a.startedAt, moves: s.moves, filled: s.grid.filter((v) => v === 1).length, practice: Boolean(w.practice) });
  },
  statsRow(levelId, attempts) {
    const ok = attempts.filter(solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    const pics = {}; ok.forEach((a) => { pics[a.state.name] = (pics[a.state.name] || 0) + 1; });
    return {
      size: (W.wall(levelId) || {}).size,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianPaints: ok.length ? median(ok.map((a) => a.state.paints)) : null,
      hintUsed: ok.length ? Math.round((ok.filter((a) => a.state.hintsUsed > 0).length / ok.length) * 100) : null,
      pics,
    };
  },
  playerLine: (p) => ({ walls: p.walls, mural: p.mural }),
  apiIn: (action, b) => (b && b.wall != null && b.level == null ? { ...b, level: b.wall } : b),
  apiOut: (action, o) => (o && action === 'me' && Array.isArray(o.levels) ? { ...o, walls: o.levels } : o),
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'tagwall_p',
    dirs: { client: path.join(ROOT, 'client'), shared: path.join(ROOT, 'shared'), assets: path.join(BRAND, 'assets') },
  },
};
