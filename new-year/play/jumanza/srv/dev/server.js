/**
 * Стенд Christmas on Kilimanjaro (Jumanza). Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Режимы:
 *   node dev/server.js              ПЛЕЙТЕСТ (08–10.12): открыто всё сразу, включая вершину; уровни призов видны, кодов нет.
 *   node dev/server.js --show       РЕПЕТИЦИЯ: ивент сжат (~45 мин) и стартует через минуту — тренировка,
 *                                   «Рождество» (тропы + вершина после 4), закрытие, офферы, Claim. Коды DEMO или dev/codes.csv.
 *   node dev/server.js --show --real  то же по настоящим датам.
 *   --lan    слушать все интерфейсы (коллеги в сети заходят по http://<ip>:8798)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000; TRAIL_DATA=путь к data.json; TRAIL_DEMO='{"practiceMin":5,"christmasMin":35,"offersGapMin":1,"claimMin":15,"startInSec":60}'
 *   Коды: dev/codes.csv — строки `tier,code` (tier: t2 t4 t6 summit, офферы: offer_star offer_glacier offer_trail offer_camp).
 *
 * /        — игра (?nick=Имя — вход без ввода имени; ?open=t1 — сразу открыть тропу)
 * /stats   — прохождение троп (цель 60–85%), время, ходы, подсказки, уровни, очередь player ID
 * /api/stats — то же JSON, с summary.rows для общего хаба плейтеста (_playtest)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/trail');
const { LEVELS, TRAILS, TIERS, OFFERS, reached, offerFor, level: getLevel } = require('../server/levels');
const S = require('../server/schedule');
const { DM, leftLine, normalizePlayerId } = require('../server/texts');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const DATA = process.env.TRAIL_DATA || path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const PORT = Number(process.env.PORT) || 8798;
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
    let demo = { practiceMin: 5, christmasMin: 35, offersGapMin: 1 };
    try { demo = { ...demo, ...JSON.parse(process.env.TRAIL_DEMO || '{}') }; } catch { /* дефолт */ }
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
const OFFER_KEYS = OFFERS.map((o) => 'offer_' + o.id);
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
  const trails = TRAILS.filter((id) => pl.attempts[id] && pl.attempts[id].state.solved).length;
  const summit = Boolean(pl.attempts.summit && pl.attempts.summit.state.solved);
  return { trails, summit };
}
function canOpen(pl, id, t) {
  if (!SHOW) return { ok: true };
  return S.canStart(sched, t, id, { trailsDone: progressOf(pl).trails });
}
function dm(pl, text, t) { pl.dms.push({ at: t, text }); }

/** Новый уровень → «приз готов, жми Claim». Код выдаёт Claim. */
function awardTiers(pl, t) {
  for (const id of reached(progressOf(pl))) {
    if (pl.tiers[id]) continue;
    pl.tiers[id] = { at: t, code: null };
    dm(pl, DM[id](), t);
  }
}
const unclaimed = (pl) => TIERS.filter((x) => pl.tiers[x.id] && !pl.tiers[x.id].code).map((x) => x.id);
const prizeOf = (id) => TIERS.find((x) => x.id === id).prize;
/** Выдать коды по всем неполученным уровням. Плейтест — без настоящих кодов. */
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
    if (ev.key === 'trails_open') dm(pl, DM.trails_open(p), ev.at);
    if (ev.key === 'dm_unfinished' && p.trails < 6) dm(pl, DM.dm_unfinished({ done: p.trails, left: 6 - p.trails }), ev.at);
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

/** Закрыть всё непройденное, когда тропы закрылись. */
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
      id: L.id, n: L.n, title: L.title, zone: L.zone, summit: Boolean(L.summit), training: Boolean(L.training),
      status: a ? (a.state.solved ? 'clear' : a.status === 'expired' ? 'expired' : 'active') : 'new',
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
    const ok = at.filter((a) => a.state.solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    return {
      id: L.id, title: L.title, zone: L.zone, par: L.moves,
      opened: at.length, cleared: ok.length,
      rate: at.length ? Math.round((ok.length / at.length) * 100) : null,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianSlides: ok.length ? median(ok.map((a) => a.state.slides)) : null,
      medianResets: ok.length ? median(ok.map((a) => a.state.resets)) : null,
      lionUsed: ok.length ? Math.round((ok.filter((a) => a.state.hints > 0).length / ok.length) * 100) : null,
      stuck: at.filter((a) => !a.state.solved).map((a) => ({ slides: a.state.slides, hints: a.state.hints })),
    };
  });
  const dist = [0, 0, 0, 0, 0, 0, 0];
  const tiers = {}; TIERS.forEach((x) => { tiers[x.id] = 0; });
  const list = players.map((pl) => {
    const p = progressOf(pl);
    dist[p.trails] += 1;
    reached(p).forEach((id) => { tiers[id] += 1; });
    return { nick: pl.nick, trails: p.trails, summit: p.summit, practice: Boolean(pl.attempts.practice && pl.attempts.practice.state.solved) };
  });
  const pending = Object.entries(db.players).filter(([, pl]) => pl.pid && pl.pid.status === 'pending')
    .map(([p, pl]) => ({ p, nick: pl.nick, playerId: pl.pid.id, at: pl.pid.at, unclaimed: unclaimed(pl).map(prizeOf) }));
  // для общего хаба плейтеста: строки «сыграли / прошли» по каждой тропе
  const rows = levels.map((l) => ({ label: `${l.title} · ${l.par} moves`, played: l.opened, passed: l.cleared, rate: l.rate }));
  return {
    mode: SHOW ? 'show' : 'playtest', players: players.length, levels, trailsDist: dist, tiers, pending,
    list: list.sort((a, b) => b.trails - a.trails || b.summit - a.summit), summary: { rows },
  };
}

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pth = url.pathname;
  try {
    if (req.method === 'GET') {
      if (pth === '/') return sendFile(res, __dirname, 'index.html');
      if (pth === '/stats') return sendFile(res, __dirname, 'stats.html');
      if (pth.startsWith('/client/')) return sendFile(res, path.join(ROOT, 'client'), pth.slice(8));
      if (pth.startsWith('/shared/')) return sendFile(res, path.join(ROOT, 'shared'), pth.slice(8));
      if (pth.startsWith('/assets/')) return sendFile(res, BRAND_ASSETS, pth.slice(8));
      if (pth === '/api/me') { const p = player(url.searchParams.get('p')); return p ? sendJson(res, 200, summary(p)) : sendJson(res, 404, { error: 'no_player' }); }
      if (pth === '/api/stats') { sweep(now()); return sendJson(res, 200, stats()); }
      res.writeHead(404); return res.end('not found');
    }
    if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
    const b = await body(req);
    if (pth === '/api/join') {
      const nick = String(b.nick || b.name || '').trim().replace(/\s+/g, ' ').slice(0, 24);
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

    // Claim prize: первый раз — player ID на проверку; после одобрения — сразу.
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
    console.log(`Christmas on Kilimanjaro — ${SHOW ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (SHOW) {
      const f = (ms) => new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  тренировка ${f(sched.practice)} · «Рождество» ${f(sched.christmas)} · закрытие ${f(sched.closesAt)} · офферы ${f(sched.offersAt)} · Claim до ${f(sched.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      for (const list of Object.values(require('os').networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}

module.exports = { server };
