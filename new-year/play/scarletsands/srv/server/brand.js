/**
 * Адаптер Scarlet Sands · The North Star Expedition для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Обёртка над north-star.js / levels.js / schedule.js / texts.js; логика тиров, таймлайна и розыгрыша — как в dev/server.js.
 * Особое (HANDOFF): ctx.seed = Discord ID и ctx.open = schedule.openAt в create/move/view; env NS_SEED_SALT (обязателен,
 * в проде 32+ символов — модуль сам падает без неё); тиры — после каждого хода (штампы копятся внутри одной экспедиции);
 * Golden Compass — билет, staff-розыгрыш после закрытия (`/api/staff/brand { name: 'draw' }`), ограниченный приз (правило 9).
 */
const path = require('path');
// Стенды и тесты — dev-соль, как dev/server.js. На проде (MODE=prod / NODE_ENV=production / Railway) соль только из env.
const PROD = process.env.MODE === 'prod' || process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);
if (!process.env.NS_SEED_SALT && !PROD) process.env.NS_SEED_SALT = 'dev-only-salt';
const mech = require('./north-star');
const L = require('./levels');
const S = require('./schedule');
const T = require('./texts');
const E = require('../shared/expedition');

const ROOT = path.join(__dirname, '..');           // scarletsands/mechanic
const BRAND = path.join(ROOT, '..');                // scarletsands
const EMPTY = { stamps: 0, found: 0, paws: 0, oasis: false, golden: false };
const openOf = (sched, t) => (sched ? S.openAt(sched, t) : S.ALL_OPEN);
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

function progress(rows) {
  const ex = rows.expedition;
  const p = ex ? mech.progress(ex.state) : { ...EMPTY };
  return { ...p, training: Boolean(rows.training && rows.training.state.done && rows.training.state.done.t) };
}
/** seed экспедиции = Discord ID (соль добавляет модуль). В плейтесте «New expedition» даёт новый seed (uid#N). */
const seedOf = (uid, api) => { const n = api ? api.kv.get('seed:' + uid) || 0 : 0; return n ? `${uid}#${n}` : uid; };

function watchers(sched, t) {
  const o = openOf(sched, t);
  const cats = E.buildExpedition('watchers').cats; // текст подсказок кота один для всех
  return cats.slice(0, o.cats).map((c, i) => ({ drop: i + 1, text: c.text, at: sched ? sched.cats[i] : null }));
}

module.exports = {
  slug: 'scarletsands', name: 'Scarlet Sands', event: 'The North Star Expedition',
  mech,
  levels: [
    { id: 'training', title: 'Practice page', training: true },
    { id: 'expedition', title: 'The expedition' },
  ],
  levelOf: (b) => b.kind || b.level, // страница стенда шлёт { kind }
  params: (levelId) => ({ mode: levelId }),
  mechCtx: (sched, t, uid, mode, api) => ({ seed: seedOf(uid, api), open: openOf(sched, t) }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo }) : S.build()),
  canStart: (sched, t, levelId) => (sched ? S.canStart(sched, t, levelId) : (['training', 'expedition'].includes(levelId) ? { ok: true } : { ok: false, error: 'bad_kind' })),
  progress,
  passed: (a) => (a.level === 'training' ? Boolean(a.state.done && a.state.done.t) : mech.progress(a.state).stamps >= 3),
  tiers: [...L.TIERS, L.GOLDEN],
  limitedTiers: ['golden'],
  reached: L.reached,                      // golden — не уровень, а приз розыгрыша (staff.draw)
  awardOnMove: true,
  offerFor: L.offerFor,
  claimOpen: (sched, t) => (sched ? S.claimOpen(sched, t) : true),
  phase: (sched, t) => (sched ? S.phaseAt(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.closesAt : null),
  normalizePlayerId: (s) => { const v = String(s == null ? '' : s).trim(); return T.PLAYER_ID.test(v) ? v : null; },
  dm: {
    tier: (id, ctx) => (id === 'oasis'
      ? T.DM.oasis({ superOpen: Boolean(ctx.rows.expedition && mech.view(ctx.rows.expedition.state).superUnlocked) })
      : T.DM[id]()),
    idPending: T.DM.idPending, idApproved: T.DM.idApproved, idRejected: T.DM.idRejected,
    claimed: T.DM.claimed, offer: T.DM.offer, noOffer: T.DM.noOffer,
  },
  /** Как award() стенда: открылся Golden Compass (не ходом-оазисом — о нём уже сказано), нашёл Golden Compass. */
  afterMove({ before, after, state, level }) {
    if (level !== 'expedition') return [];
    const out = [], last = state.last;
    if (last && last.unlocked && last.unlocked.includes('super') && last.target !== 'oasis') out.push(T.DM.super_open());
    if (after.golden && !before.golden) out.push(T.DM.golden());
    return out;
  },
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ ...e, late: e.key === 'offers' })) : []),
  onEvent(key, p, ctx) {
    if (['training_open', 'broadcast_tomorrow', 'chapter1', 'chapter3'].includes(key)) return T.DM[key]();
    if (key === 'dm_low_stamps') return p.stamps < 3 ? T.DM.dm_low_stamps({ stamps: p.stamps }) : null;
    if (key === 'oasis_open') return p.oasis ? null : T.DM.oasis_open({ stamps: p.stamps });
    if (key === 'dm_last_hours') { const l = T.leftLine(p); return l ? T.DM.dm_last_hours({ left: l }) : null; }
    if (key === 'offers') return { offer: true };
    if (key === 'dm_unclaimed') return ctx.unclaimed ? T.DM.dm_unclaimed({ n: ctx.unclaimed }) : null;
    return null; // cat1–cat4, chapter2, closed, draw — посты бота / Watchers / staff, не ЛС
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? (a.status === 'expired' ? 'expired' : a.status === 'done' ? 'done' : 'active') : 'new' }),
  /** /me в формате стенда (страница dev/index.html читает training / expedition / watchers / golden). */
  me(base, ctx) {
    const { rows, p, t, sched, uid, api } = ctx;
    const out = (lv) => { const a = ctx.attemptOut(lv); return a ? { kind: lv, ...a } : null; };
    const draw = api.kv.get('draw');
    return {
      ...base,
      can: { training: ctx.can('training'), expedition: ctx.can('expedition') },
      training: out('training'), expedition: out('expedition'),
      expeditions: (api.kv.get('seed:' + uid) || 0) + (rows.expedition ? 1 : 0),
      progress: p,
      golden: { found: Boolean(p.golden), draw: draw ? { at: draw.at, won: draw.winner === uid } : null },
      watchers: watchers(sched, t),
    };
  },
  actions: {
    /** Плейтест: новая экспедиция (другой набор из 20 и другая карта), прошлая уходит в архив попыток. */
    newmap(api) {
      if (api.mode !== 'playtest') return { error: 'playtest_only' };
      if (api.rows().expedition) api.archive('expedition');
      api.kv.set('seed:' + api.uid, (api.kv.get('seed:' + api.uid) || 0) + 1);
      return api.open('expedition');
    },
  },
  staff: {
    /** Розыгрыш Golden Compass (27.12 05:00 ET, дежурный). exclude — uid или ники отпавших; плюс правило 9 (приз в другом бренде). */
    draw(api, body) {
      if (api.sched && api.t < api.sched.closesAt) return { error: 'not_closed' };
      const players = api.players();
      const byNick = Object.fromEntries(players.map((x) => [String(x.nick).toLowerCase(), x.uid]));
      const cands = players.filter((x) => x.progress.golden).map((x) => x.uid);
      const exclude = (Array.isArray(body.exclude) ? body.exclude : []).map((x) => byNick[String(x).toLowerCase()] || x);
      for (const u of api.exclude()) exclude.push(u);
      const w = L.drawGolden(cands, api.rng, exclude);
      if (!w) return { error: 'no_candidates' };
      const prev = api.kv.get('draw');
      if (prev && prev.winner && prev.winner !== w) api.revoke(prev.winner, 'golden'); // перетяжка
      api.kv.set('draw', { at: api.t, winner: w, candidates: cands.length, exclude });
      api.grant(w, 'golden', T.DM.golden_won());
      return { ok: true, winner: (players.find((x) => x.uid === w) || {}).nick, candidates: cands.length };
    },
  },
  statsRow(levelId, attempts) {
    if (levelId !== 'expedition') return {};
    const ps = attempts.map((a) => mech.progress(a.state));
    return {
      medianStamps: ps.length ? median(ps.map((x) => x.stamps)) : null,
      oasis: ps.filter((x) => x.oasis).length,
      golden: ps.filter((x) => x.golden).length,
    };
  },
  playerLine: (p) => ({ stamps: p.stamps, found: p.found, paws: p.paws, oasis: p.oasis, golden: p.golden, training: p.training }),
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    storageKey: 'ns_p',
    dirs: { client: path.join(ROOT, 'client'), assets: path.join(BRAND, 'assets') },
  },
};
