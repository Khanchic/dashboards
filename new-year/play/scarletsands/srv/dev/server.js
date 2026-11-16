/**
 * Стенд The North Star Expedition. Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Режимы:
 *   node dev/server.js              ПЛЕЙТЕСТ (08–10.12): открыто всё сразу; кнопка «New expedition» даёт новый набор из 20,
 *                                   чтобы 3 коллеги покрыли все задачи. Claim одобряется сам, кодов нет.
 *   node dev/server.js --show       РЕПЕТИЦИЯ (18.12): ивент сжат (~45 мин) и стартует через минуту — страница 0, 3 главы
 *                                   и 3 кота, оазис, кот 4, закрытие, офферы, розыгрыш Golden Compass (staff на /stats), Claim.
 *   node dev/server.js --show --real  то же по настоящим датам.
 *   --lan    слушать все интерфейсы (коллеги заходят по http://<ip>:8792)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000; NS_DATA=путь к data.json;
 *   NS_DEMO='{"trainingMin":5,"chapterGapMin":4,"catLagMin":1,"oasisGapMin":6,"cat4Min":2,"closeMin":12,"offersGapMin":1,"drawGapMin":2,"claimMin":15,"startInSec":60}'
 *   Коды: dev/codes.csv — строки `tier,code` (tier: t3 t6 oasis golden, офферы: offer_oasis offer_starmap offer_supply offer_stash).
 *
 * /  — игра     /stats — доля нахождения по каждой из 20 задач (цель 60–85%), коты, оазис, Golden Compass, заявки player ID, розыгрыш
 * Claim prize как на Witching Hours: player ID только при Claim (решение 11.11), staff одобряет на /stats (в плейтесте — само).
 * Подсказки кота в стенде показываются в блоке «Watchers» (в проде их постят операторы чата по туториалу).
 */
// Стенд — не прод: своя dev-соль, если не задана (модуль без NS_SEED_SALT не запускается).
if (!process.env.NS_SEED_SALT) process.env.NS_SEED_SALT = 'dev-only-salt';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/north-star');
const E = require('../shared/expedition');
const { TIERS, GOLDEN, reached, offerFor, drawGolden } = require('../server/levels');
const S = require('../server/schedule');
const { DM, leftLine, PLAYER_ID } = require('../server/texts');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const DATA = process.env.NS_DATA || path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const PORT = Number(process.env.PORT) || 8792;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const SHOW = process.argv.includes('--show');

if (process.argv.includes('--reset')) {
  if (fs.existsSync(DATA)) fs.unlinkSync(DATA);
  console.log('data.json removed');
  process.exit(0);
}

const now = () => Date.now();
let sched = null;
if (SHOW) {
  if (process.argv.includes('--real')) sched = S.build();
  else {
    let demo = {};
    try { demo = JSON.parse(process.env.NS_DEMO || '{}'); } catch { /* дефолт */ }
    demo.start = new Date(now() + (demo.startInSec ?? 60) * 1000).toISOString();
    sched = S.build({ demo });
  }
}
const openNow = (t) => (SHOW ? S.openAt(sched, t) : S.ALL_OPEN);

let db = { players: {}, codesUsed: [], draw: null };
try { db = { codesUsed: [], draw: null, ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch { /* первый запуск */ }
let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFileSync(DATA, JSON.stringify(db)), 200); }
const rng = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
const newSeed = () => String(crypto.randomInt(1e9, 9e9)) + String(crypto.randomInt(1e8, 9e8));

// ---------- коды ----------
const PRIZE_KEYS = ['t3', 't6', 'oasis', 'golden'];
const OFFER_KEYS = ['offer_oasis', 'offer_starmap', 'offer_supply', 'offer_stash'];
let pool = null;
function codePool() {
  if (pool) return pool;
  pool = {};
  if (fs.existsSync(CODES)) {
    for (const line of fs.readFileSync(CODES, 'utf8').split(/\r?\n/).slice(1)) {
      const [k, code] = line.split(',').map((x) => (x || '').trim());
      if (k && code) (pool[k] = pool[k] || []).push(code);
    }
  } else {
    [...PRIZE_KEYS, ...OFFER_KEYS].forEach((k) => { pool[k] = []; for (let i = 1; i <= 200; i++) pool[k].push(`DEMO-${k.toUpperCase()}-${String(i).padStart(3, '0')}`); });
  }
  return pool;
}
function takeCode(k) {
  const used = new Set(db.codesUsed);
  const c = (codePool()[k] || []).find((x) => !used.has(x)) || null;
  if (c) db.codesUsed.push(c);
  return c;
}

// ---------- прогресс ----------
const exp = (pl) => pl.attempts.expedition || null;
const progressOf = (pl) => (exp(pl) ? mech.progress(exp(pl).state) : { stamps: 0, found: 0, paws: 0, oasis: false, golden: false });
function dm(pl, text, t) { pl.dms.push({ at: t, text }); }
const PRIZE = Object.fromEntries([...TIERS, GOLDEN].map((x) => [x.id, x.prize]));

/** Новый уровень → «приз готов, жми Claim». Golden Compass — билет в розыгрыш, не код. */
function award(pl, t, last) {
  const p = progressOf(pl);
  for (const id of reached(p)) {
    if (pl.tiers[id]) continue;
    pl.tiers[id] = { at: t, code: null };
    dm(pl, id === 'oasis' ? DM.oasis({ superOpen: Boolean(exp(pl) && mech.view(exp(pl).state).superUnlocked) }) : DM[id](), t);
  }
  // открылся Golden Compass: если ходом-оазисом — об этом уже сказано в DM.oasis
  if (last && last.unlocked && last.unlocked.includes('super') && last.target !== 'oasis') dm(pl, DM.super_open(), t);
  if (p.golden && !pl.goldenAt) { pl.goldenAt = t; dm(pl, DM.golden(), t); }
}
const unclaimed = (pl) => Object.keys(pl.tiers).filter((id) => !pl.tiers[id].code);
function payOut(pl, t) {
  const got = [];
  for (const id of unclaimed(pl)) {
    const code = SHOW ? takeCode(id) || 'NO-CODES-LEFT' : `PLAYTEST-${id.toUpperCase()}`;
    pl.tiers[id].code = code; pl.tiers[id].claimedAt = t;
    got.push(`${code} (${PRIZE[id]})`);
  }
  return got.join(', ');
}
function review(pl, ok, t) {
  if (!pl.pid || pl.pid.status !== 'pending') return { error: 'not_pending' };
  pl.pid.status = ok ? 'approved' : 'rejected'; pl.pid.reviewedAt = t;
  if (ok) dm(pl, DM.idApproved({ codes: payOut(pl, t) || '—' }), t); else dm(pl, DM.idRejected(), t);
  save();
  return { ok: true, pid: pl.pid };
}

/** Личные сообщения по расписанию (только --show): одно на игрока на событие. */
function tick(pl, t) {
  if (!SHOW) return;
  for (const ev of sched.timeline) {
    if (ev.at > t || pl.sent[ev.key]) continue;
    pl.sent[ev.key] = true;
    if (pl.joinedAt > ev.at && ev.key !== 'offers') continue; // пришёл позже события — не догоняем
    const p = progressOf(pl);
    if (DM[ev.key] && ['training_open', 'broadcast_tomorrow', 'chapter1', 'chapter3'].includes(ev.key)) dm(pl, DM[ev.key](), ev.at);
    if (ev.key === 'dm_low_stamps' && p.stamps < 3) dm(pl, DM.dm_low_stamps({ stamps: p.stamps }), ev.at);
    if (ev.key === 'oasis_open' && !p.oasis) dm(pl, DM.oasis_open({ stamps: p.stamps }), ev.at);
    if (ev.key === 'dm_last_hours') { const l = leftLine(p); if (l) dm(pl, DM.dm_last_hours({ left: l }), ev.at); }
    if (ev.key === 'offers') {
      const o = offerFor(p);
      if (o) { const code = takeCode('offer_' + o.id) || 'NO-CODES-LEFT'; pl.offer = { ...o, code }; dm(pl, DM.offer({ ...o, code }), ev.at); }
      else dm(pl, DM.noOffer(), ev.at);
    }
    if (ev.key === 'dm_unclaimed') { const n = unclaimed(pl).length; if (n) dm(pl, DM.dm_unclaimed({ n }), ev.at); }
  }
}

function attemptOut(a, t) {
  if (!a) return null;
  return { kind: a.kind, status: a.status, startedAt: a.startedAt, finishedAt: a.finishedAt || null, result: a.result || null, view: mech.view(a.state, a.status !== 'active', { open: openNow(t) }) };
}
function sweep(t) {
  if (!SHOW || t < sched.closesAt) return;
  for (const pl of Object.values(db.players)) for (const a of Object.values(pl.attempts)) {
    if (a.status === 'active') { a.status = 'expired'; a.finishedAt = sched.closesAt; a.result = mech.finalize(a.state); save(); }
  }
}
/** Подсказки кота, которые уже «вышли» в Watchers (в стенде — вместо чата сайта). */
function watchers(t) {
  const o = openNow(t);
  const any = E.buildExpedition('watchers').cats; // текст один для всех
  return any.slice(0, o.cats).map((c, i) => ({ drop: i + 1, text: c.text, at: SHOW ? sched.cats[i] : null }));
}

function summary(id) {
  const t = now();
  sweep(t);
  const pl = db.players[id];
  tick(pl, t);
  const p = progressOf(pl);
  const out = {
    nick: pl.nick, mode: SHOW ? 'show' : 'playtest', now: t,
    can: { training: SHOW ? S.canStart(sched, t, 'training') : { ok: true }, expedition: SHOW ? S.canStart(sched, t, 'expedition') : { ok: true } },
    training: attemptOut(pl.attempts.training, t), expedition: attemptOut(exp(pl), t), expeditions: (pl.history || []).length + (exp(pl) ? 1 : 0),
    progress: p, tiers: [...TIERS, GOLDEN].map((x) => ({ ...x, got: pl.tiers[x.id] || null })),
    golden: { found: p.golden, draw: db.draw ? { at: db.draw.at, won: db.draw.winner === id } : null },
    watchers: watchers(t), dms: pl.dms.slice().reverse(), offer: pl.offer || null,
    claim: { open: SHOW ? S.claimOpen(sched, t) : true, unclaimed: unclaimed(pl).length, pid: pl.pid ? { status: pl.pid.status } : null },
  };
  if (SHOW) { out.phase = S.phaseAt(sched, t); out.sched = sched; }
  save();
  return out;
}

// ---------- статистика ----------
function stats() {
  const players = Object.values(db.players);
  const runs = players.flatMap((pl) => [...(pl.history || []), ...(exp(pl) ? [exp(pl)] : [])].map((a) => ({ pl, a })));
  const tasks = {};
  for (const t of E.TASKS) tasks[t.key] = { key: t.key, tier: t.tier, item: t.item, type: t.type, given: 0, opened: 0, hit: [0, 0, 0], revealed: 0 };
  const extra = { oasis: { opened: 0, hit: [0, 0, 0], revealed: 0 }, super: { unlocked: 0, hit: [0, 0], failed: 0 }, cats: [0, 1, 2, 3].map(() => ({ opened: 0, hit: [0, 0, 0], missed: 0 })) };
  const dist = Array(11).fill(0);
  const tierCount = { t3: 0, t6: 0, oasis: 0, golden: 0 };
  for (const { a } of runs) {
    const st = a.state;
    st.map.tasks.forEach((x) => {
      const T = tasks[x.key], pins = st.pins[x.slot];
      T.given += 1;
      if (!pins.length) return;
      T.opened += 1;
      if (st.done[x.slot]) T.hit[pins.length - 1] += 1; else if (st.revealed[x.slot]) T.revealed += 1;
    });
    if (st.pins.oasis.length) { extra.oasis.opened += 1; if (st.done.oasis) extra.oasis.hit[st.pins.oasis.length - 1] += 1; else if (st.revealed.oasis) extra.oasis.revealed += 1; }
    const v = mech.view(st, false);
    if (v.superUnlocked || st.done.super) { extra.super.unlocked += 1; if (st.done.super) extra.super.hit[st.pins.super.length - 1] += 1; else if (st.tries.super === 0) extra.super.failed += 1; }
    mech.CATS.forEach((k, i) => { const C = extra.cats[i], pins = st.pins[k]; if (!pins.length) return; C.opened += 1; if (st.done[k]) C.hit[pins.length - 1] += 1; else if (st.tries[k] === 0) C.missed += 1; });
    const p = mech.progress(st);
    dist[p.stamps] += 1;
    reached(p).forEach((id) => { tierCount[id] += 1; });
    if (p.golden) tierCount.golden += 1;
  }
  const rate = (hit, n) => (n ? Math.round((hit / n) * 100) : null);
  const taskRows = Object.values(tasks).map((T) => {
    const resolved = T.hit[0] + T.hit[1] + T.hit[2] + T.revealed;
    return { ...T, resolved, rate: rate(T.hit[0] + T.hit[1] + T.hit[2], resolved), first: rate(T.hit[0], resolved) };
  });
  const pending = Object.entries(db.players).filter(([, pl]) => pl.pid && pl.pid.status === 'pending')
    .map(([p, pl]) => ({ p, nick: pl.nick, playerId: pl.pid.id, at: pl.pid.at, unclaimed: unclaimed(pl).map((id) => PRIZE[id]) }));
  const goldenList = Object.entries(db.players).filter(([, pl]) => exp(pl) && mech.progress(exp(pl).state).golden).map(([p, pl]) => ({ p, nick: pl.nick, at: pl.goldenAt, pid: pl.pid ? pl.pid.status : null }));
  const list = players.map((pl) => ({ nick: pl.nick, expeditions: (pl.history || []).length + (exp(pl) ? 1 : 0), ...progressOf(pl), training: Boolean(pl.attempts.training && pl.attempts.training.state.done.t) }));
  return { mode: SHOW ? 'show' : 'playtest', players: players.length, runs: runs.length, tasks: taskRows, extra, stampsDist: dist, tiers: tierCount, pending, golden: goldenList, draw: db.draw, list };
}

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
function sendJson(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function sendFile(res, base, rel) {
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}
function body(req) {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => { s += c; if (s.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}
const player = (p) => (p && db.players[p] ? p : null);
const KINDS = ['training', 'expedition'];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pth = url.pathname;
  try {
    if (req.method === 'GET') {
      if (pth === '/') return sendFile(res, __dirname, 'index.html');
      if (pth === '/stats') return sendFile(res, __dirname, 'stats.html');
      if (pth.startsWith('/client/')) return sendFile(res, path.join(ROOT, 'client'), pth.slice(8));
      if (pth.startsWith('/assets/')) return sendFile(res, BRAND_ASSETS, pth.slice(8));
      if (pth.startsWith('/3d/')) return sendFile(res, path.join(ROOT, '..', '..', '_3d'), pth.slice(4)); // общее 3D-ядро ивентов
      if (pth === '/api/me') { const p = player(url.searchParams.get('p')); return p ? sendJson(res, 200, summary(p)) : sendJson(res, 404, { error: 'no_player' }); }
      if (pth === '/api/stats') { sweep(now()); return sendJson(res, 200, stats()); }
      res.writeHead(404); return res.end('not found');
    }
    if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
    const b = await body(req);
    if (pth === '/api/join') {
      const nick = String(b.nick || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (nick.length < 2) return sendJson(res, 400, { error: 'bad_nick' });
      const id = nick.toLowerCase();
      if (!db.players[id]) { db.players[id] = { nick, seed: newSeed(), joinedAt: now(), attempts: {}, history: [], tiers: {}, dms: [], sent: {}, offer: null }; save(); }
      return sendJson(res, 200, { p: id, nick: db.players[id].nick });
    }
    const t = now();
    sweep(t);
    // Staff: розыгрыш Golden Compass (в проде — команда бота дежурному). exclude — ники, которые отпали.
    if (pth === '/api/staff/draw') {
      if (SHOW && t < sched.closesAt) return sendJson(res, 200, { error: 'not_closed' });
      const cands = Object.entries(db.players).filter(([, pl]) => exp(pl) && mech.progress(exp(pl).state).golden).map(([p]) => p);
      const w = drawGolden(cands, rng, Array.isArray(b.exclude) ? b.exclude : []);
      if (!w) return sendJson(res, 200, { error: 'no_candidates' });
      if (db.draw && db.draw.winner && db.players[db.draw.winner]) delete db.players[db.draw.winner].tiers.golden; // перетяжка
      db.draw = { at: t, winner: w, candidates: cands.length, exclude: b.exclude || [] };
      const wp = db.players[w];
      wp.tiers.golden = { at: t, code: null };
      dm(wp, DM.golden_won(), t);
      save();
      return sendJson(res, 200, { ok: true, winner: wp.nick, candidates: cands.length });
    }
    const p = player(b.p);
    if (!p) return sendJson(res, 404, { error: 'no_player' });
    const pl = db.players[p];

    if (pth === '/api/claim') {
      if (SHOW && !S.claimOpen(sched, t)) return sendJson(res, 200, { error: 'claim_closed' });
      if (!unclaimed(pl).length) return sendJson(res, 200, { error: 'nothing_to_claim' });
      if (pl.pid && pl.pid.status === 'approved') { const codes = payOut(pl, t); dm(pl, DM.claimed({ codes }), t); save(); return sendJson(res, 200, { status: 'paid', codes }); }
      if (pl.pid && pl.pid.status === 'pending') return sendJson(res, 200, { status: 'pending' });
      const pid = String(b.playerId || '').trim();
      if (!PLAYER_ID.test(pid)) return sendJson(res, 200, { error: 'need_player_id' });
      const taken = Object.entries(db.players).some(([q, o]) => q !== p && o.pid && o.pid.id === pid && o.pid.status !== 'rejected');
      if (taken) return sendJson(res, 200, { error: 'player_id_taken' });
      pl.pid = { id: pid, status: 'pending', at: t };
      dm(pl, DM.idPending(), t);
      if (!SHOW) review(pl, true, t);
      save();
      return sendJson(res, 200, { status: pl.pid.status });
    }
    if (pth === '/api/staff/review') return sendJson(res, 200, review(pl, Boolean(b.ok), t));

    // Плейтест: новая экспедиция (другой набор из 20 и другая карта), прошлая уходит в статистику.
    if (pth === '/api/newmap') {
      if (SHOW) return sendJson(res, 200, { error: 'playtest_only' });
      if (exp(pl)) { pl.history.push(exp(pl)); delete pl.attempts.expedition; }
      pl.seed = newSeed();
      pl.attempts.expedition = { kind: 'expedition', status: 'active', state: mech.create({ mode: 'expedition' }, rng, { now: t, seed: pl.seed }), startedAt: t };
      save();
      return sendJson(res, 200, { attempt: attemptOut(pl.attempts.expedition, t) });
    }

    const kind = b.kind;
    if (!KINDS.includes(kind)) return sendJson(res, 400, { error: 'bad_kind' });
    if (pth === '/api/open') {
      if (!pl.attempts[kind]) {
        const can = SHOW ? S.canStart(sched, t, kind) : { ok: true };
        if (!can.ok) return sendJson(res, 200, { error: can.error, can });
        pl.attempts[kind] = { kind, status: 'active', state: mech.create({ mode: kind }, rng, { now: t, seed: pl.seed }), startedAt: t };
        save();
      }
      return sendJson(res, 200, { attempt: attemptOut(pl.attempts[kind], t) });
    }
    if (pth === '/api/move') {
      const a = pl.attempts[kind];
      if (!a) return sendJson(res, 200, { error: 'not_started' });
      if (a.status !== 'active') return sendJson(res, 200, { error: a.status === 'expired' ? 'closed' : 'finished', attempt: attemptOut(a, t) });
      const r = mech.move(a.state, b.input, { now: t, rng, open: openNow(t) });
      if (r.error) return sendJson(res, 200, { error: r.error, lock: r.lock || null, attempt: attemptOut(a, t) });
      if (kind === 'expedition') award(pl, t, a.state.last);
      if (r.done) { a.status = 'done'; a.finishedAt = t; a.result = r.result; }
      save();
      return sendJson(res, 200, { attempt: attemptOut(a, t) });
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error(e);
    sendJson(res, 500, { error: 'server' });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    const host = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`North Star Expedition — ${SHOW ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (SHOW) {
      const f = (ms) => new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  страница 0 ${f(sched.training)} · главы ${sched.chapters.map(f).join(' / ')} · коты ${sched.cats.map(f).join(' / ')}`);
      console.log(`  оазис ${f(sched.oasis)} · закрытие ${f(sched.closesAt)} · офферы ${f(sched.offersAt)} · розыгрыш ${f(sched.drawAt)} · Claim до ${f(sched.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      for (const list of Object.values(require('os').networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}

module.exports = { server };
