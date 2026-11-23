/**
 * Адаптер CoinsMania · Merry Coinsmas для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Только обёртка над coinsort.js / jars.js / schedule.js / texts.js / fairplay.js; тиры и таймлайн — как в dev/server.js.
 * Отличия от Storm: стенд шлёт { jar } вместо { level } и читает me.jars (apiIn/apiOut); ход hint возвращает
 * { from, to, rewound } рядом с attempt — движок его не пробрасывает, поэтому подсказка едет через state._hint.
 */
const path = require('path');
const base = require('./coinsort');
const J = require('./jars');
const S = require('./schedule');
const T = require('./texts');
const { fastSolve } = require('./fairplay');

const ROOT = path.join(__dirname, '..');           // coinsmania/mechanic
const BRAND = path.join(ROOT, '..');                // coinsmania

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const solved = (a) => Boolean(a && a.state && a.state.solved);

// механика с подсказкой: последний ответ hint хранится в state._hint (обход — движок не отдаёт r.hint)
const mech = {
  ...base,
  move(state, input, ctx) {
    const r = base.move(state, input, ctx);
    if (r.error) return r;
    const st = r.state || state;
    st._hint = r.hint || null;
    return { ...r, state: st };
  },
  view(state, finished) {
    const v = base.view(state, finished);
    return state && state._hint ? { ...v, _hint: state._hint } : v;
  },
};

function progress(attempts) {
  const jars = J.ROW.filter((id) => solved(attempts[id])).length;
  return { jars, golden: solved(attempts.golden) };
}

/** Стенд: me.jars, attempt.hint; служебное _hint из view убирается. */
function cleanAttempt(a, withHint) {
  if (!a || !a.view || !('_hint' in a.view)) return a;
  const { _hint, ...view } = a.view;
  return withHint ? { ...a, view, hint: _hint } : { ...a, view };
}

module.exports = {
  slug: 'coinsmania', name: 'CoinsMania', event: 'Merry Coinsmas',
  mech,
  levels: J.JARS.map((x) => ({ id: x.id, n: x.n, title: x.title, colors: x.colors, practice: Boolean(x.practice), golden: Boolean(x.golden) })),
  params: (levelId) => ({ jar: levelId }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched ? S.canStart(sched, t, levelId, { jarsDone: p.jars }) : (J.jar(levelId) ? { ok: true } : { ok: false, error: 'bad_level' })),
  progress,
  passed: solved,
  tiers: J.TIERS,
  reached: J.reached,
  offerFor: J.offerFor,
  claimOpen: (sched, t) => (sched ? S.claimOpen(sched, t) : true),
  phase: (sched, t) => (sched ? S.phaseAt(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.closesAt : null),
  normalizePlayerId: T.normPlayerId,
  dm: {
    // стенд: goldenOpen = t >= sched.golden
    tier: (id, ctx) => T.DM[id]({ goldenOpen: !ctx.sched || ctx.phase === 'golden' || ctx.phase === 'closed' }),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, noOffer: T.DM.noOffer,
    offer: (o) => T.DM.offer({ id: o.id, name: o.name, price: o.price, bonus: o.bonus, code: o.code }),
  },
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers' })) : []),
  onEvent(key, p, ctx) {
    if (key === 'live') return T.DM.live();
    if (key === 'wave2') return T.DM.wave2({ jars: p.jars });
    if (key === 'dm_below_two') return p.jars < 2 ? T.DM.dm_below_two({ jars: p.jars }) : null;
    if (key === 'golden_open') return !p.golden ? T.DM.golden_open({ jars: p.jars }) : null;
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // practice_open, broadcast_soon, event_end — посты бота
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? (solved(a) ? 'sorted' : a.status === 'expired' ? 'expired' : 'active') : 'new' }),
  flag(a) {
    const s = a.state, j = J.jar(s.jar) || {}; // движок не передаёт level в flag → берём из state
    return fastSolve({ ms: a.finishedAt - a.startedAt, pours: s.pours, undos: s.undos, hints: s.hintsUsed, solverPours: s.solverPours, practice: Boolean(j.practice) });
  },
  statsRow(levelId, attempts) {
    const ok = attempts.filter(solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      colors: (J.jar(levelId) || {}).colors,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianPours: ok.length ? median(ok.map((a) => a.state.pours)) : null,
      medianUndos: ok.length ? median(ok.map((a) => a.state.undos)) : null,
      hintUsed: ok.length ? Math.round((ok.filter((a) => a.state.hintsUsed > 0).length / ok.length) * 100) : null,
      restartedNotDone: attempts.filter((a) => !solved(a) && a.state.restarts > 0).length,
    };
  },
  playerLine: (p) => ({ jars: p.jars, golden: p.golden }),
  apiIn: (action, b) => (b && b.jar != null && b.level == null ? { ...b, level: b.jar } : b),
  apiOut(action, o) {
    if (!o) return o;
    if (action === 'me' && Array.isArray(o.levels)) return { ...o, jars: o.levels };
    if (o.attempt) return { ...o, attempt: cleanAttempt(o.attempt, action === 'move' && !o.error) };
    return o;
  },
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'coinsort_p',
    dirs: { client: path.join(ROOT, 'client'), shared: path.join(ROOT, 'shared'), assets: path.join(BRAND, 'assets') },
  },
};
