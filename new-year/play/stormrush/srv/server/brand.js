/**
 * Адаптер Storm Rush · Light Up Christmas для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Только обёртка над lightup.js / levels.js / schedule.js / texts.js; логика тиров и таймлайна — как в dev/server.js.
 */
const path = require('path');
const mech = require('./lightup');
const L = require('./levels');
const S = require('./schedule');
const T = require('./texts');

const ROOT = path.join(__dirname, '..');           // stormrush/mechanic
const BRAND = path.join(ROOT, '..');                // stormrush

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const solved = (a) => Boolean(a && a.state && a.state.solved);

function progress(attempts) {
  const lit = L.HOUSES.filter((id) => solved(attempts[id])).length;
  return { houses: lit, lit, tree: solved(attempts.tree) };
}

module.exports = {
  slug: 'stormrush', name: 'Storm Rush', event: 'Light Up Christmas',
  mech,
  levels: L.LEVELS.map((x) => ({ id: x.id, title: x.title, size: x.size, training: Boolean(x.training), tree: Boolean(x.tree) })),
  params: (levelId) => ({ level: levelId }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched ? S.canStart(sched, t, levelId, { housesLit: p.lit }) : (L.level(levelId) ? { ok: true } : { ok: false, error: 'bad_level' })),
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
    // в сочельник t4 обещает ёлку утром Рождества, после — «ёлка открыта»
    tier: (id, ctx) => T.DM[id]({ christmas: !ctx.sched || ctx.phase === 'christmas' }),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, offer: T.DM.offer, noOffer: T.DM.noOffer,
  },
  // late: событие получают и те, кто пришёл позже (как офферы в стенде)
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers_and_mosaic' })) : []),
  onEvent(key, p, ctx) {
    if (key === 'dm_dark_houses') return p.lit < 6 ? T.DM.dm_dark_houses({ lit: p.lit, dark: 6 - p.lit }) : null;
    if (key === 'tree_open') return T.DM.tree_open({ lit: p.lit });
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers_and_mosaic') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // посты (street_open, post_*), training_open — забота бота, не ЛС игроку
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? (solved(a) ? 'lit' : a.status === 'expired' ? 'expired' : 'active') : 'new' }),
  statsRow(levelId, attempts) {
    const lit = attempts.filter(solved);
    const mins = lit.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      size: (L.level(levelId) || {}).size,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianTurns: lit.length ? median(lit.map((a) => a.state.turns)) : null,
      golemUsed: lit.length ? Math.round((lit.filter((a) => a.state.hints.golem > 0).length / lit.length) * 100) : null,
      sparkyUsed: lit.length ? Math.round((lit.filter((a) => a.state.hints.sparky > 0).length / lit.length) * 100) : null,
    };
  },
  playerLine: (p) => ({ houses: p.lit, tree: p.tree }),
  // клиент: страница стенда (переписывается на лету под /<slug>/…), папки, которые сервис отдаёт
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'lightup_p',
    dirs: { client: path.join(ROOT, 'client'), shared: path.join(ROOT, 'shared'), assets: path.join(BRAND, 'assets'), art: path.join(BRAND, 'art', 'out') },
  },
};
