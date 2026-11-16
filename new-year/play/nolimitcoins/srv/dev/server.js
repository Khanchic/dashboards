/**
 * Стенд Infinity Garland (NoLimitCoins). Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Режимы:
 *   node dev/server.js              ПЛЕЙТЕСТ (08–10.12): открыто всё сразу, включая звезду; уровни призов видны, кодов нет.
 *   node dev/server.js --show       РЕПЕТИЦИЯ: ивент сжат (~45 мин) и стартует через минуту — тренировка, «утро» (ярусы 1–3),
 *                                   «день» (4–6), «вечер» (+ звезда для 4+), закрытие, офферы, Claim. Коды DEMO или dev/codes.csv.
 *   node dev/server.js --show --real  то же по настоящим датам.
 *   --lan    слушать все интерфейсы (коллеги в сети заходят по http://<ip>:8795)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000; GARLAND_DATA=путь к data.json;
 *   GARLAND_DEMO='{"practiceMin":5,"morningMin":8,"dayMin":8,"eveningMin":20,"offersGapMin":1,"claimMin":15,"startInSec":60}'
 *   Коды: dev/codes.csv — строки `tier,code` (tier: t2 t4 t6 star, офферы: offer_infinity offer_cube offer_garland offer_stocking).
 *
 * /        — игра (?nick=Имя или ?name=Имя — вход без ввода; ?open=g1 — сразу открыть ярус)
 * /stats   — прохождение ярусов (цель 60–85%), время, подсказки, уровни, одобрение player ID
 * /api/stats — JSON, в т.ч. summary.rows для общего хаба плейтеста (_playtest)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/garland');
const { LEVELS, GARLANDS, TIERS, reached, offerFor, level: getLevel } = require('../server/levels');
const S = require('../server/schedule');
const { DM, leftLine, normalizePlayerId } = require('../server/texts');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const DATA = process.env.GARLAND_DATA || path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const PORT = Number(process.env.PORT) || 8795;
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
    let demo = { practiceMin: 5, morningMin: 8, dayMin: 8, eveningMin: 20, offersGapMin: 1, claimMin: 15 };
    try { demo = { ...demo, ...JSON.parse(process.env.GARLAND_DEMO || '{}') }; } catch { /* дефолт */ }
    demo.start = new Date(now() + (demo.startInSec ?? 60) * 1000).toISOString();
    sched = S.build({ demo });
  }
}

let db = { players: {}, codesUsed: [] };
try { db = { codesUsed: [], ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch { /* первый запуск */ }
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => fs.writeFileSync(DATA, JSON.stringify(db)), 200);
}
const rng = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;

// ---------- коды (только --show) ----------
const OFFER_KEYS = ['offer_infinity', 'offer_cube', 'offer_garland', 'offer_stocking'];
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
    TIERS.map((t) => t.id).concat(OFFER_KEYS).forEach((k) => { pool[k] = []; for (let i = 1; i <= 200; i++) pool[k].push(`DEMO-${k.toUpperCase()}-${String(i).padStart(3, '0')}`); });
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
function progressOf(pl) {
  const lit = GARLANDS.filter((id) => pl.attempts[id] && pl.attempts[id].state.solved).length;
  const star = Boolean(pl.attempts.star && pl.attempts.star.state.solved);
  return { lit, star };
}
function canOpen(pl, id, t) {
  if (!SHOW) return { ok: true };
  return S.canStart(sched, t, id, { lit: progressOf(pl).lit });
}
function dm(pl, text, t) { pl.dms.push({ at: t, text }); }

/** Новый уровень → «приз готов, жми Claim». Код выдаёт Claim. */
function awardTiers(pl, t) {
  const p = progressOf(pl);
  for (const id of reached(p)) {
    if (pl.tiers[id]) continue;
    pl.tiers[id] = { at: t, code: null };
    dm(pl, DM[id]({ starOpen: !SHOW || t >= sched.evening }), t);
  }
}
const unclaimed = (pl) => TIERS.filter((x) => pl.tiers[x.id] && !pl.tiers[x.id].code).map((x) => x.id);
const prizeOf = (id) => TIERS.find((x) => x.id === id).prize;
function payOut(pl, t) {
  const got = [];
  for (const id of unclaimed(pl)) {
    const code = SHOW ? takeCode(id) || 'NO-CODES-LEFT' : `PLAYTEST-${id.toUpperCase()}`;
    pl.tiers[id].code = code; pl.tiers[id].claimedAt = t;
    got.push(`${code} (${prizeOf(id)})`);
  }
  return got.join(', ');
}
/** Staff: одобрить / отклонить player ID (в проде — кнопки на карточке заявки в Discord). */
function review(pl, ok, t) {
  if (!pl.pid || pl.pid.status !== 'pending') return { error: 'not_pending' };
  if (ok) { pl.pid.status = 'approved'; pl.pid.reviewedAt = t; dm(pl, DM.idApproved({ codes: payOut(pl, t) || '—' }), t); }
  else { pl.pid.status = 'rejected'; pl.pid.reviewedAt = t; dm(pl, DM.idRejected(), t); }
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
    if (ev.key === 'morning_open') dm(pl, DM.morning_open(), ev.at);
    if (ev.key === 'day_open') dm(pl, DM.day_open({ lit: p.lit }), ev.at);
    if (ev.key === 'star_open') dm(pl, DM.star_open({ lit: p.lit }), ev.at);
    if (ev.key === 'dm_dark_tiers' && p.lit < 6) dm(pl, DM.dm_dark_tiers({ lit: p.lit, dark: 6 - p.lit }), ev.at);
    if (ev.key === 'dm_last_hours') { const l = leftLine(p); if (l) dm(pl, DM.dm_last_hours({ left: l }), ev.at); }
    if (ev.key === 'offers') {
      const o = offerFor(p);
      if (o) { const code = takeCode('offer_' + o.id) || 'NO-CODES-LEFT'; pl.offer = { ...o, code }; dm(pl, DM.offer({ ...o, code }), ev.at); }
      else dm(pl, DM.noOffer(), ev.at);
    }
    if (ev.key === 'dm_unclaimed') { const n = unclaimed(pl).length; if (n) dm(pl, DM.dm_unclaimed({ n }), ev.at); }
  }
}

function attemptOut(a) {
  if (!a) return null;
  return { status: a.status, startedAt: a.startedAt, finishedAt: a.finishedAt || null, result: a.result || null, view: mech.view(a.state, a.status !== 'active') };
}

/** Закрыть всё незажжённое, когда гирлянды погасли. */
function sweep(t) {
  if (!SHOW || t < sched.closesAt) return;
  for (const pl of Object.values(db.players)) for (const a of Object.values(pl.attempts)) {
    if (a.status === 'active') { a.status = 'expired'; a.finishedAt = sched.closesAt; a.result = mech.finalize(a.state, a.startedAt); save(); }
  }
}

function summary(id) {
  const t = now();
  sweep(t);
  const pl = db.players[id];
  tick(pl, t);
  const p = progressOf(pl);
  const levels = LEVELS.map((L) => {
    const a = pl.attempts[L.id];
    return {
      id: L.id, n: L.n, title: L.title, size: L.size, star: Boolean(L.star), practice: Boolean(L.practice),
      status: a ? (a.state.solved ? 'lit' : a.status === 'expired' ? 'expired' : 'active') : 'new',
      can: canOpen(pl, L.id, t),
    };
  });
  const out = {
    nick: pl.nick, mode: SHOW ? 'show' : 'playtest', now: t, levels,
    progress: p, tiers: TIERS.map((x) => ({ ...x, got: pl.tiers[x.id] || null })),
    dms: pl.dms.slice().reverse(), offer: pl.offer || null,
    claim: { open: SHOW ? S.claimOpen(sched, t) : true, unclaimed: unclaimed(pl).length, pid: pl.pid ? { status: pl.pid.status } : null },
  };
  if (SHOW) { out.phase = S.phaseAt(sched, t); out.sched = sched; }
  save();
  return out;
}

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function stats() {
  const players = Object.values(db.players);
  const levels = LEVELS.map((L) => {
    const at = players.map((pl) => pl.attempts[L.id]).filter(Boolean);
    const lit = at.filter((a) => a.state.solved);
    const mins = lit.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      id: L.id, title: L.title, size: L.size,
      opened: at.length, lit: lit.length,
      rate: at.length ? Math.round((lit.length / at.length) * 100) : null,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianMoves: lit.length ? median(lit.map((a) => a.state.toggles)) : null,
      bulbs: at.length ? at[0].state.bulb.reduce((x, y) => x + y, 0) : null,
      hintUsed: lit.length ? Math.round((lit.filter((a) => a.state.hints > 0).length / lit.length) * 100) : null,
    };
  });
  const dist = [0, 0, 0, 0, 0, 0, 0];
  const tiers = {}; TIERS.forEach((x) => { tiers[x.id] = 0; });
  const list = players.map((pl) => {
    const p = progressOf(pl);
    dist[p.lit] += 1;
    reached(p).forEach((id) => { tiers[id] += 1; });
    return { nick: pl.nick, tiers: p.lit, star: p.star, practice: Boolean(pl.attempts.practice && pl.attempts.practice.state.solved) };
  });
  const pending = Object.entries(db.players).filter(([, pl]) => pl.pid && pl.pid.status === 'pending')
    .map(([p, pl]) => ({ p, nick: pl.nick, playerId: pl.pid.id, at: pl.pid.at, unclaimed: unclaimed(pl).map(prizeOf) }));
  // для общего хаба плейтеста (_playtest\README.md, контракт п.3)
  const rows = levels.map((l) => ({ label: l.title, played: l.opened, passed: l.lit, rate: l.rate }));
  return {
    mode: SHOW ? 'show' : 'playtest', players: players.length, levels, tiersDist: dist, tiers, pending,
    list: list.sort((a, b) => b.tiers - a.tiers || b.star - a.star), summary: { rows },
  };
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
    req.on('data', (c) => { s += c; if (s.length > 40000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
  });
}
const player = (p) => (p && db.players[p] ? p : null);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pth = url.pathname;
  try {
    if (req.method === 'GET') {
      if (pth === '/') return sendFile(res, __dirname, 'index.html');
      if (pth === '/stats') return sendFile(res, __dirname, 'stats.html');
      if (pth === '/qa') return sendFile(res, __dirname, 'qa.html');
      if (pth === '/test/solver.js') return sendFile(res, path.join(ROOT, 'test'), 'solver.js');
      if (pth.startsWith('/client/')) return sendFile(res, path.join(ROOT, 'client'), pth.slice(8));
      if (pth.startsWith('/shared/')) return sendFile(res, path.join(ROOT, 'shared'), pth.slice(8));
      if (pth.startsWith('/3d/')) return sendFile(res, path.join(ROOT, '..', '..', '_3d'), pth.slice(4)); // общее 3D-ядро ивентов
      if (pth.startsWith('/assets/')) return sendFile(res, BRAND_ASSETS, pth.slice(8));
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
      if (!db.players[id]) { db.players[id] = { nick, joinedAt: now(), attempts: {}, tiers: {}, dms: [], sent: {}, offer: null }; save(); }
      return sendJson(res, 200, { p: id, nick: db.players[id].nick });
    }
    const p = player(b.p);
    if (!p) return sendJson(res, 404, { error: 'no_player' });
    const pl = db.players[p];
    const t = now();
    sweep(t);

    // Claim prize (правило 8): первый раз — player ID на проверку; после одобрения — сразу.
    if (pth === '/api/claim') {
      if (SHOW && !S.claimOpen(sched, t)) return sendJson(res, 200, { error: 'claim_closed' });
      if (!unclaimed(pl).length) return sendJson(res, 200, { error: 'nothing_to_claim' });
      if (pl.pid && pl.pid.status === 'approved') { const codes = payOut(pl, t); dm(pl, DM.claimed({ codes }), t); save(); return sendJson(res, 200, { status: 'paid', codes }); }
      if (pl.pid && pl.pid.status === 'pending') return sendJson(res, 200, { status: 'pending' });
      const id = normalizePlayerId(b.playerId);
      if (!id) return sendJson(res, 200, { error: 'need_player_id' });
      const taken = Object.entries(db.players).some(([q, o]) => q !== p && o.pid && o.pid.id === id && o.pid.status !== 'rejected');
      if (taken) return sendJson(res, 200, { error: 'player_id_taken' });
      pl.pid = { id, status: 'pending', at: t };
      dm(pl, DM.idPending(), t);
      if (!SHOW) review(pl, true, t); // плейтест: одобряется сам
      save();
      return sendJson(res, 200, { status: pl.pid.status });
    }
    // Staff (в стенде без авторизации — только для репетиции): { p: игрок, ok: true|false }
    if (pth === '/api/staff/review') return sendJson(res, 200, review(pl, Boolean(b.ok), t));

    const L = getLevel(b.level);
    if (!L) return sendJson(res, 400, { error: 'bad_level' });

    if (pth === '/api/open') {
      const a = pl.attempts[L.id];
      if (!a) {
        const can = canOpen(pl, L.id, t);
        if (!can.ok) return sendJson(res, 200, { error: can.error, can });
        pl.attempts[L.id] = { status: 'active', state: mech.create({ level: L.id }, rng, { now: t }), startedAt: t };
        save();
      }
      return sendJson(res, 200, { attempt: attemptOut(pl.attempts[L.id]) });
    }
    if (pth === '/api/move') {
      const a = pl.attempts[L.id];
      if (!a) return sendJson(res, 200, { error: 'not_started' });
      if (a.status !== 'active') return sendJson(res, 200, { error: a.status === 'expired' ? 'closed' : 'finished', attempt: attemptOut(a) });
      const r = mech.move(a.state, b.input, { now: t, rng });
      if (r.error) return sendJson(res, 200, { error: r.error, attempt: attemptOut(a) });
      if (r.done) { a.status = 'done'; a.finishedAt = t; a.result = r.result; awardTiers(pl, t); }
      save();
      return sendJson(res, 200, { attempt: attemptOut(a) });
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
    console.log(`Infinity Garland — ${SHOW ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (SHOW) {
      const f = (ms) => new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  тренировка ${f(sched.practice)} · ярусы 1–3 ${f(sched.morning)} · 4–6 ${f(sched.day)} · звезда ${f(sched.evening)} · гаснет ${f(sched.closesAt)} · офферы ${f(sched.offersAt)} · Claim до ${f(sched.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      for (const list of Object.values(require('os').networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}

module.exports = { server };
