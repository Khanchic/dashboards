/**
 * Адаптер Fire Seven · Crack the 777 Vault для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Обёртка над wh-adapter.js (модуль vault777) и vault-event.js; страница — dev/index.html (мини-хаб, клиент client/vault.js).
 * Особое (INTEGRATION.md): весь сейф = один конкурс (уровень 'vault'), 7 замков и их расписание внутри state;
 * окно 25.12 12:00 → 23:30 ET; результат, призы и Claim — только с вскрытия 26.12 00:00 ET (reveal).
 * Тиры: только f7-top-1..3 (rankTop с исключением тех, кто взял ограниченный приз в другом бренде — правило 9; код только
 * после ручной проверки staff — `/api/staff/brand { name: 'top', uid, ok }`), Claim по правилу 8.
 * Утешительный приз (≥1 замок, не топ-3) — НЕ тир и не Claim (Александр 23.11): −30% на личный оффер по числу замков,
 * приходит сразу при вскрытии вместе с кодом оффера (timeline 'offers', пул offer_<slug>30), без проверки player ID.
 * Плейтест — как стенд: у каждого свой сейф, все 7 замков сразу, 90 минут, вскрытие по таймеру / «Open my vault now» /
 * когда закончены все 7; топ-3 — по всем игрокам. Тексты ЛС — черновик (copy\TEXTS.md — посты), сверить голосом бренда.
 */
const path = require('path');
const A = require('./wh-adapter');
const E = require('./vault-event');

const F7 = path.join(__dirname, '..');                       // fireseven
const APP_PUBLIC = path.join(F7, '..', '..', 'halloween-week', 'app', 'public'); // hub-core.js и hub.css — только чтение
const MIN = 60000;
const PLAY_MIN = 90;
const LEVEL = 'vault';
const CLAIM_UNTIL = Date.parse('2027-01-04T00:00:00-05:00'); // до 03.01 23:59 ET, как у остальных брендов (решение Александра 20.11)

const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20);
const prizeText = (b) => [b.sc ? `${b.sc} SC` : null, b.fp ? `${b.fp} FP` : null, b.gc ? `${b.gc / 1000}K GC` : null].filter(Boolean).join(' + ');
const TIERS = E.TOP.map((x) => ({ id: `f7-top-${x.place}`, place: x.place, name: `Top ${x.place}`, prize: prizeText(x.bonus) }));
const TOP_IDS = TIERS.map((x) => x.id);
/** Оффер для общего слоя: id = slug имени (+ '30' у скидочного пресета) → пул кодов 'offer_' + id. */
const offerOut = (o) => (o ? { id: slugOf(o.name) + (o.discount ? String(o.discount) : ''), name: o.name, price: o.price, was: o.was || null, discount: o.discount || null, bonus: `+${o.extra}%`, hours: o.hours } : null);
const money = (n) => '$' + Number(n).toFixed(2);

// Тексты ЛС — вычитка Antigravity 18.11 (fireseven\copy\DM-REVIEW.md), голос Mr. Seven. Срок Claim — 03.01 23:59 ET
// (решение 20.11, RULES-DRAFT.md синхронизирован).
const DM = {
  top: (v) => `Good evening. Your vault opened at #${v.place} with ${v.cracked}/7 locks. The house reviews the top three before your ${v.prize} reward opens for Claim.`,
  rest: (v) => `Good evening. ${v.cracked}/7 locks opened. As thanks, the house takes ${v.discount}% off your private offer: ${v.name} at ${v.price} instead of ${v.was}, for the next 48 hours. Your personal code follows.`,
  topOk: () => 'The top-three count has been verified. Your vault reward is ready. Select Claim to proceed.',
  topNo: () => 'The top-three review did not clear this time, and the place has been released. Your private offer from tonight remains yours for its 48 hours.',
  idPending: () => 'Thank you. Mr. Seven has received your Fire Seven player ID for verification. Your code will arrive here once the house approves it.',
  idApproved: (v) => `Your player ID has been verified. Your code: ${v.codes}.`,
  idRejected: () => 'We could not match that player ID in the Fire Seven registry. Kindly check it in your profile and select Claim again; your vault reward remains held for you.',
  claimed: (v) => `Your code is ${v.codes}. A quiet holiday season from Fire Seven.`,
  dm_2100: (v) => `🕯️ A brief note from Mr. Seven: the vault room closes at 11:30 PM ET, with ${v.left} lock${v.left === 1 ? '' : 's'} remaining on your door.`,
  offer: (v) => (v.discount
    ? `🗝️ Your vault thank-you: ${v.name} at ${money(v.price)} instead of ${money(v.was)} (${v.discount}% off), with ${v.bonus} extra for the next 48 hours. Code: ${v.code}. One per player.`
    : `🗝️ A quiet arrangement after your vault: ${v.name} at ${money(v.price)}, with ${v.bonus} extra for the next 48 hours. Code: ${v.code}. One per player.`),
};

/** Результаты замков: после закрытия — из finalize (заклинившие), до — из view (как results() стенда). */
function results(a) {
  if (!a) return [];
  return (a.result && a.result.locks) || A.view(a.state).total.locks;
}
function progress(rows, ext = {}) {
  const a = rows[LEVEL], res = results(a), s = E.playerSummary(res);
  const top = Object.keys(ext.tiers || {}).find((k) => TOP_IDS.includes(k)) || null;
  return { ...s, results: res, started: Boolean(a), finished: Boolean(a && a.status !== 'active'), top };
}
/** Плейтест: вскрытие у каждого своё — по его state.reveal; топ считается по всем, кто уже вскрыт. */
function playtestReveal(api) {
  if (api.mode !== 'playtest') return;
  const done = api.players().filter((x) => x.rows[LEVEL] && x.rows[LEVEL].status !== 'active' && api.t >= x.rows[LEVEL].state.reveal);
  const top = E.rankTop(done.map((x) => ({ userId: x.uid, results: results(x.rows[LEVEL]) })));
  for (const x of done) award(api, x, top);
}
function award(api, x, top) {
  if (api.kv.get('rev:' + x.uid)) return;
  const res = results(x.rows[LEVEL]), s = E.playerSummary(res);
  const t = top.find((y) => y.userId === x.uid);
  api.kv.set('rev:' + x.uid, { at: api.t, place: t ? t.place : null });
  if (t) api.grant(x.uid, `f7-top-${t.place}`, DM.top({ place: t.place, cracked: s.cracked, prize: prizeText(t.bonus) }));
  else if (s.cracked > 0) {
    // утешительный приз: −30% на оффер; код оффера приходит отдельной ЛС (timeline 'offers' — через секунду после вскрытия)
    const o = E.restOffer(s.cracked);
    api.dm(x.uid, DM.rest({ cracked: s.cracked, discount: o.discount, name: o.name, price: money(o.price), was: money(o.was) }));
  }
}
const topNow = (api) => (api.mode === 'playtest'
  ? E.rankTop(api.players().filter((x) => x.rows[LEVEL] && x.rows[LEVEL].status !== 'active').map((x) => ({ userId: x.uid, results: results(x.rows[LEVEL]) })))
  : api.kv.get('top') || []);

function schedOf(mode, demo) {
  if (mode === 'playtest') return null;
  let s;
  if (mode === 'rehearsal' && demo) {
    s = E.makeSchedule({ firstLock: demo.start, stepMin: demo.stepMin ?? 10, closeAfterMin: demo.closeAfterMin ?? 80, revealAfterMin: demo.revealAfterMin ?? 90 });
    s.claimUntil = s.reveal + (demo.claimMin ?? 15) * MIN;
  } else { s = E.makeSchedule(); s.claimUntil = CLAIM_UNTIL; }
  // DM «осталось N замков» — 21:00 ET в бою (через 9 ч от первого замка из 11.5), в репетиции — в том же масштабе
  s.remindAt = Math.round(s.opens[0] + (s.close - s.opens[0]) * 9 / 11.5);
  return s;
}

module.exports = {
  slug: 'fireseven', name: 'Fire Seven', event: 'Crack the 777 Vault',
  mech: A,
  levels: [{ id: LEVEL, title: 'Crack the 777 Vault' }],
  levelOf: () => LEVEL,
  apiAlias: { start: 'open' },
  params: (levelId, { t, sched }) => (sched
    ? { opens: sched.opens, close: sched.close, reveal: sched.reveal }
    : { opens: E.LOCKS.map(() => t), close: t + PLAY_MIN * MIN, reveal: t + PLAY_MIN * MIN }),
  schedule: schedOf,
  canStart(sched, t) {
    if (!sched) return { ok: true };
    if (t < sched.opens[0]) return { ok: false, error: 'not_open', opensAt: sched.opens[0] };
    if (t >= sched.close) return { ok: false, error: 'closed' };
    return { ok: true };
  },
  progress,
  passed: (a) => E.playerSummary(results(a)).cracked > 0,
  tiers: TIERS,
  limitedTiers: TOP_IDS,
  reached: () => [],                                  // призы — при вскрытии (onGlobal 'reveal' / плейтест — по таймеру игрока)
  holdTier: (id, uid, api) => TOP_IDS.includes(id) && !api.kv.get('topok:' + uid), // топ-3 — код после проверки staff
  /** Топ-3 — The Private Vault по обычной цене; все остальные с ≥1 замком — свой пакет со скидкой −30% (утешительный приз). */
  offerFor(p) {
    if (!p.cracked) return null;
    return offerOut(p.top ? E.TOP[0].offer : E.restOffer(p.cracked));
  },
  claimOpen: (sched, t) => (sched ? t >= sched.reveal && t < sched.claimUntil : true),
  phase: (sched, t) => (sched ? E.eventPhase(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.close : null),
  deadline: (sched, a) => a.state.close,              // у каждого сейфа свой close (плейтест — 90 мин; бой — 23:30 ET)
  finalize: (state) => A.finalize(state).result,
  /** Плейтест: закончил все 7 — вскрытие сразу (как стенд). В бою вскрытие у всех в полночь. */
  onDone: (state, { t, mode }) => { if (mode === 'playtest') { state.close = t; state.reveal = t; } },
  globalTimeline: (sched) => (sched ? [{ key: 'reveal', at: sched.reveal }] : []),
  /** 26.12 00:00 ET: топ-3 по всем (правило 9: без взявших ограниченный приз в другом бренде), остальным с ≥1 замком — ЛС о скидке −30%. */
  onGlobal(key, api) {
    if (key !== 'reveal') return;
    const ps = api.players().filter((x) => x.rows[LEVEL]);
    const top = E.rankTop(ps.map((x) => ({ userId: x.uid, results: results(x.rows[LEVEL]) })), api.exclude());
    api.kv.set('top', top.map((x) => ({ userId: x.userId, place: x.place, cracked: x.cracked, score: x.score, lastAt: x.lastAt, bonus: x.bonus })));
    for (const x of ps) award(api, x, top);
  },
  normalizePlayerId: (s) => { const v = String(s == null ? '' : s).replace(/\s+/g, '').replace(/^0+(?=\d)/, ''); return /^\d{4,12}$/.test(v) ? v : null; },
  dm: { tier: () => null, idPending: DM.idPending, idApproved: DM.idApproved, idRejected: DM.idRejected, claimed: DM.claimed, offer: DM.offer, noOffer: () => null },
  timeline: (sched) => (sched ? [{ key: 'dm_2100', at: sched.remindAt }, { key: 'offers', at: sched.reveal + 1000, late: true }] : []),
  onEvent(key, p) {
    if (key === 'dm_2100') return p.started && !p.finished && p.cracked < 7 ? DM.dm_2100({ left: 7 - p.cracked }) : null;
    if (key === 'offers') return p.cracked ? { offer: true } : null;
    return null;
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? a.status : 'new' }),
  actions: {
    /** Плейтест: «Done? Open my vault now» — закрыть и вскрыть свой сейф сейчас. */
    'open-now'(api) {
      if (api.mode !== 'playtest') return { error: 'playtest_only' };
      if (!api.rows()[LEVEL]) return { error: 'not_started' };
      api.setState(LEVEL, (st) => { st.close = Math.min(st.close, api.t); st.reveal = Math.min(st.reveal, Math.max(api.t, st.close)); });
      api.sweep();
      playtestReveal(api);
      return { attempt: attemptOut(api) };
    },
  },
  gets: {
    /** Мини-хаб страницы стенда: { now, brand, me, contest, attempt, track } (+ prize после вскрытия, claim). */
    state(api) {
      if (!api.uid) return { _status: 404, error: 'login' };
      playtestReveal(api);
      const t = api.t, rows = api.rows(), a = rows[LEVEL], s = a && a.state, sc = api.sched;
      const opens = s ? s.opens : sc ? sc.opens : E.LOCKS.map(() => t);
      const close = s ? s.close : sc ? sc.close : t + PLAY_MIN * MIN;
      const reveal = s ? s.reveal : sc ? sc.reveal : close;
      const contest = { id: 'f7-vault', mechanic: 'vault777', name: 'Crack the 777 Vault', ready: true, params: { opens, close, reveal },
        session: 'xmas', sessionTitle: api.mode === 'playtest' ? 'Christmas Day · playtest' : 'Christmas Day', sessionKind: 'night', index: 0, of: 1,
        startsAt: opens[0], closesAt: close, open: (!s && !sc) || (t >= opens[0] && t < close) };
      const m = api.member();
      return {
        now: t,
        brand: { slug: 'fireseven', name: 'Fire Seven', palette: { accent: '#d71434', fire: '#d39045', panel: 'rgba(5,17,12,.74)', ground: '#020806' }, discord: null },
        me: { name: m ? m.nick : '', status: 'approved', canPlay: true },
        contest,
        attempt: attemptOut(api),
        track: E.LOCKS.map((L, i) => ({ id: 'l' + i, name: L.name, startsAt: opens[i], state: t >= close ? 'done' : t >= opens[i] ? 'now' : 'soon' })),
        tiers: TIERS.map((x) => ({ ...x, got: api.tiers()[x.id] || null })),
      };
    },
  },
  staff: {
    /** Ручная проверка топ-3: ok → код открывается по Claim; нет → место снимается (оффер, выданный при вскрытии, остаётся). */
    top(api, body) {
      const uid = String(body.uid || ''), have = api.tiers(uid), id = TOP_IDS.find((x) => have[x]);
      if (!id) return { error: 'not_top' };
      if (body.ok) { api.kv.set('topok:' + uid, { at: api.t }); api.dm(uid, DM.topOk()); return { ok: true, tier: id }; }
      api.revoke(uid, id);
      api.dm(uid, DM.topNo());
      api.kv.set('topdq:' + uid, { at: api.t });
      return { ok: true, removed: id };
    },
  },
  /** Статистика по замкам (как /stats стенда) — summary.rows по замкам для страницы плейтеста. */
  statsExtra(attempts, api) {
    const locks = E.LOCKS.map((L) => ({ id: L.id, name: L.name, played: 0, passed: 0, tries: 0, butler: 0 }));
    for (const a of attempts.filter((x) => x.level === LEVEL)) a.state.locks.forEach((s, i) => {
      if (!s.guesses.length) return;
      const L = locks[i]; L.played++; L.tries += s.guesses.length;
      if (s.status === 'solved') L.passed++;
      if (s.butler) L.butler++;
    });
    locks.forEach((L) => { L.rate = L.played ? Math.round((L.passed / L.played) * 100) : null; L.avgTries = L.played ? +(L.tries / L.played).toFixed(1) : null; });
    const nick = Object.fromEntries(api.players().map((x) => [x.uid, x.nick]));
    return { locks, top: topNow(api).map((x) => ({ place: x.place, nick: nick[x.userId], cracked: x.cracked, score: x.score })),
      summary: { rows: locks.map((L) => ({ label: `${L.id} ${L.name}`, played: L.played, passed: L.passed, rate: L.rate })) } };
  },
  playerLine: (p) => ({ cracked: p.cracked, score: p.cracked ? p.score : null, top: p.top }),
  files: {
    page: path.join(F7, 'dev', 'index.html'),
    storageKey: 'f7p',
    dirs: { client: path.join(F7, 'client'), assets: path.join(F7, 'assets') },
    root: {
      'hub-core.js': path.join(APP_PUBLIC, 'hub-core.js'), 'hub.css': path.join(APP_PUBLIC, 'hub.css'),
      'vault.js': path.join(F7, 'client', 'vault.js'), 'vault.css': path.join(F7, 'client', 'vault.css'),
    },
  },
};

/** attempt страницы: view + prize после вскрытия (как publicAttempt стенда). */
function attemptOut(api) {
  const a = api.rows()[LEVEL];
  if (!a) return null;
  const t = api.t;
  const v = A.view(a.state, a.status !== 'active' || t >= a.state.close);
  if (t >= a.state.reveal) v.prize = E.prizeFor(api.uid, results(a), topNow(api));
  return { status: a.status, result: a.result, view: v };
}
