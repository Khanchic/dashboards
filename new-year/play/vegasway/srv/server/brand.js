/**
 * Адаптер Vegas Way · Countdown on the Strip для общего слоя (`new-year-2026\app`, контракт — app\SPEC.md §2).
 * Обёртка над strip-act.js / acts.js / schedule.js; логика — как dev/server.js (create({base})).
 * Особое (README «Что нужно от общего слоя»): 6 актов открыты одновременно 31.12, закрытие 23:30 ET; приз = уровень по
 * сумме очков (acts.tierOf), мест и розыгрыша нет; 00:00 ET «Get my reward» — забрать сейчас (уровень фиксируется) или
 * доиграть в Encore 01.01 10:00–20:00 ET (только не начатые акты); брошенный акт — finalize по сроку; ракеты { nick, tier }.
 * Claim — по правилу 8 HANDOFF (как у всех): первый Get my reward фиксирует уровень и просит player ID → staff → код.
 * Тексты ЛС здесь — черновик (у Vegas нет texts.js; launch\comms.md — посты), сверить голосом бренда.
 */
const path = require('path');
const mech = require('./strip-act');
const { ACTS, MAX_POINTS, TIERS, tierOf, nextTier } = require('./acts');
const S = require('./schedule');

const ROOT = path.join(__dirname, '..');           // vegasway/mechanic
const BRAND = path.join(ROOT, '..');                // vegasway
const fmtGc = (n) => (n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}K`);
const prizeText = (b) => [b.sc ? `${b.sc} SC` : null, b.fp ? `${b.fp} FP` : null, b.gc ? `${fmtGc(b.gc)} GC` : null].filter(Boolean).join(' + ');
const DEMO = { actGapMin: 2, playMin: 20, encoreMin: 15 };

// Тексты ЛС — вычитка Antigravity 18.11 (vegasway\copy\DM-REVIEW.md): кнопка на сайте — Get my reward, срок — Jan 3, 11:59 PM ET
const DM = {
  fixed: (v) => `🎆 Curtain's up! Your ${v.name} is locked in at ${v.points} points. Hit Get my reward when you're ready for your code.`,
  idPending: () => "🎭 Backstage pass received! We're checking your Vegas Way player ID now. As soon as it's approved, your code drops right here.",
  idApproved: (v) => `✨ You're on the VIP list, ID approved! Here's your code: ${v.codes} (use it by Jan 3, 11:59 PM ET). Happy New Year from the Strip!`,
  idRejected: () => "🃏 Plot twist: that player ID didn't match our guest list. Double-check the digits in your Vegas Way profile and hit Get my reward again. Your reward is waiting backstage.",
  claimed: (v) => `🎟️ Encore! Your code is ${v.codes}. Use it by Jan 3, 11:59 PM ET. Happy New Year!`,
  dm_unfinished: () => "🎩 The Magician's clock is ticking: the Strip closes at 11:30 PM ET. You still have acts waiting, and every point builds a brighter midnight rocket.",
  salute_claim: (v) => `🎆 Happy New Year! Harlequin and the Magician lit up the sky with your ${v.name}. Hit Get my reward now, or play the acts you never started in the Encore, today 10 AM – 8 PM ET.`,
  encore_open: () => "🎭 The Encore is open until 8 PM ET! Any acts you didn't start on New Year's Eve are waiting on stage. Or hit Get my reward any time before Jan 3, 11:59 PM ET.",
  dm_unclaimed: () => "🎁 Your reward from the Strip is still waiting. Hit Get my reward before Jan 3, 11:59 PM ET so it doesn't vanish like a magic trick.",
};

/** acts: { '1': attempt, … } → очки, начатые акты, начатые в Encore, зафиксированный уровень (тир в базе). */
function progress(rows, ext = {}) {
  const ids = Object.keys(rows).filter((k) => /^\d$/.test(k));
  const total = ids.reduce((s, k) => s + (rows[k].state.points || 0), 0);
  const s = ext.sched;
  const fixed = Object.keys(ext.tiers || {}).find((k) => TIERS.some((x) => x.id === k)) || null;
  return {
    total,
    started: ids.map(Number),
    startedInEncore: s ? ids.filter((k) => rows[k].startedAt >= s.encore.opensAt).map(Number) : [],
    claimed: Boolean(fixed), fixed,
    tier: fixed || (tierOf(total) ? tierOf(total).id : null),
  };
}

module.exports = {
  slug: 'vegasway', name: 'Vegas Way', event: 'Countdown on the Strip',
  mech,
  levels: ACTS.map((a) => ({ id: String(a.act), act: a.act, title: a.title, host: a.host, opensHour: a.opensHour, type: a.rounds[0].type })),
  levelOf: (b) => (b.act != null ? String(b.act) : b.level),
  apiAlias: { start: 'open' },
  recheckOnOpen: true,                     // как стенд: начатый акт тоже проверяется canStart (Encore, Get my reward)
  params: (levelId) => ({ act: Number(levelId) }),
  schedule: (mode, demo) => (mode === 'playtest' ? null : mode === 'rehearsal' && demo ? S.build({ demo: { ...DEMO, ...demo } }) : S.build()),
  canStart: (sched, t, levelId, p) => (sched
    ? S.canStart(sched, t, Number(levelId), { started: p.started, startedInEncore: p.startedInEncore, claimed: p.claimed })
    : (p.claimed ? { ok: false, error: 'claimed' } : { ok: true, resume: p.started.includes(Number(levelId)) })),
  progress,
  passed: (a) => a.status === 'done',
  tiers: TIERS.map((x) => ({ id: x.id, name: x.name, min: x.min, prize: `${x.name}: ${prizeText(x.bonus)}` })),
  reached: () => [],                       // уровень фиксирует Get my reward (beforeClaim), не очки по ходу
  offerFor: () => null,                    // решение 11.11: обычные SMM-офферы, отдельных ивентовых нет
  claimOpen: (sched, t) => (sched ? S.claimOpen(sched, t) : true),
  phase: (sched, t) => (sched ? S.phaseAt(sched, t) : 'playtest'),
  closesAt: (sched) => (sched ? sched.closesAt : null),
  /** Брошенный акт закрывается в 23:30 ET, а начатый в Encore — в 20:00 ET 01.01. */
  deadline: (sched, a) => (sched ? (a.startedAt >= sched.encore.opensAt ? sched.encore.closesAt : sched.closesAt) : null),
  finalize: (state, startedAt) => { const f = mech.finalize(state, startedAt); return f ? f.result : null; },
  normalizePlayerId: (s) => { const v = String(s == null ? '' : s).replace(/\s+/g, '').replace(/^0+(?=\d)/, ''); return /^\d{4,12}$/.test(v) ? v : null; },
  dm: { tier: () => null, idPending: DM.idPending, idApproved: DM.idApproved, idRejected: DM.idRejected, claimed: DM.claimed, offer: () => null, noOffer: () => null },
  /** Get my reward: первый Claim фиксирует уровень по очкам (дальше акты закрыты), незаконченный акт закрывается. */
  beforeClaim(api) {
    const p = api.progress();
    if (p.claimed) return null;
    const tr = tierOf(p.total);
    if (!tr) return { error: 'no_points' };
    api.expireActive();
    api.grant(api.uid, tr.id, DM.fixed({ name: tr.name, points: p.total }));
    return null;
  },
  /** Ответ в формате стенда: { claim: { tier, name, points, code } } — страница показывает код; pending — ждём staff. */
  claimOut(r, api) {
    const p = api.progress(), have = api.tiers(), tr = p.fixed && TIERS.find((x) => x.id === p.fixed);
    if (!tr) return r;
    const code = have[tr.id] && have[tr.id].code;
    const claim = { tier: tr.id, name: tr.name, points: p.total, code: code || null, bonus: tr.bonus, offer: tr.offer, pending: !code };
    if (code) return { ...r, claim };
    return { ...r, claim: r.error ? undefined : claim, error: r.error || (r.status === 'pending' ? 'player_id_check' : undefined) };
  },
  // + напоминание незабравшим за ~36 ч до конца Claim (02.01 ~12:00 ET; в репетиции — не раньше конца Encore)
  timeline: (sched) => (sched ? sched.timeline.map((e) => ({ at: e.at, key: e.key === 'act_open' ? `act_open_${e.act}` : e.key }))
    .concat([{ at: Math.max(sched.encore.closesAt, sched.claimUntil - 36 * 3600000), key: 'dm_unclaimed' }]) : []),
  onEvent(key, p) {
    if (key === 'dm_unclaimed') return tierOf(p.total) && !p.claimed ? DM.dm_unclaimed() : null;
    if (key === 'dm_unfinished') return p.started.length < ACTS.length && !p.claimed ? DM.dm_unfinished() : null;
    if (key === 'salute_claim') { const tr = tierOf(p.total); return tr && !p.claimed ? DM.salute_claim({ name: tr.name }) : null; }
    if (key === 'encore_open') return !p.claimed && p.started.length < ACTS.length ? DM.encore_open() : null;
    return null; // everyone, act_open_*, acts_closed, salute_soon, encore_salute_claim — посты бота
  },
  levelCard: (lv, a) => ({ ...lv, status: a ? a.status : 'new', points: a ? a.state.points : 0 }),
  /** /me в формате стенда (dev/index.html): acts, total, tier, next, sched, claim. */
  me(base, ctx) {
    const { rows, p, t, sched, api } = ctx;
    const acts = ACTS.map((a) => {
      const at = rows[String(a.act)];
      return { act: a.act, title: a.title, host: a.host, opensHour: a.opensHour, type: a.rounds[0].type,
        status: at ? at.status : 'new', points: at ? at.state.points : 0, gains: at ? at.state.gains : [], can: ctx.can(String(a.act)) };
    });
    const fixedTier = p.fixed && TIERS.find((x) => x.id === p.fixed);
    const tr = fixedTier || tierOf(p.total), nx = fixedTier ? null : nextTier(p.total);
    const out = { ...base, acts, total: p.total, max: MAX_POINTS, tier: tr, next: nx ? { id: nx.tier.id, name: nx.tier.name, need: nx.need } : null, tiers: TIERS };
    if (sched) {
      out.sched = { firstOpen: sched.acts[0].opensAt, acts: sched.acts, closesAt: sched.closesAt, midnight: sched.midnight, encore: sched.encore, claimUntil: sched.claimUntil };
      const code = fixedTier && api.tiers()[fixedTier.id] && api.tiers()[fixedTier.id].code;
      out.claim = { ...base.claim, open: S.claimOpen(sched, t), claimed: fixedTier ? { tier: fixedTier.id, name: fixedTier.name, points: p.total, code: code || null, pending: !code } : null };
    }
    return out;
  },
  gets: {
    /** Ракеты для салюта { nick, points, tier } — с «полуночи». */
    rockets(api) {
      if (api.sched && api.t < api.sched.midnight) return { rockets: [], locked: true, at: api.sched.midnight };
      return { rockets: api.players().map((x) => (x.progress.tier ? { nick: x.nick, points: x.progress.total, tier: x.progress.tier } : null)).filter(Boolean) };
    },
  },
  statsRow(levelId, attempts) {
    const A = ACTS.find((a) => String(a.act) === levelId);
    const rounds = A.rounds.map(() => ({ played: 0, first: 0, second: 0, miss: 0 }));
    for (const at of attempts) (at.state.gains || []).forEach((g, i) => { const R = rounds[i]; R.played += 1; if (g === 3) R.first += 1; else if (g === 1) R.second += 1; else R.miss += 1; });
    return { rounds };
  },
  playerLine: (p) => ({ points: p.total, tier: p.tier, actsStarted: p.started.length, fixed: p.fixed }),
  files: {
    page: path.join(ROOT, 'dev', 'index.html'),
    trailingSlash: true,                   // пути страницы относительные (api/me, assets/…) — нужен /vegasway/
    dirs: { client: path.join(ROOT, 'client'), assets: path.join(BRAND, 'assets') },
  },
};
