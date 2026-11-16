/**
 * Стенд Merry Coinsmas: Coin Sort Piggy (CoinsMania). Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Режимы:
 *   node dev/server.js              ПЛЕЙТЕСТ (до 05.12, общий плейтест 08–10.12): открыто всё сразу, включая золотую банку;
 *                                   уровни призов видны, кодов нет, Claim одобряется сам.
 *   node dev/server.js --show       РЕПЕТИЦИЯ: ивент сжат (~50 мин) и стартует через минуту — практика, банки 1–3,
 *                                   банки 4–6, золотая для 4+, конец, офферы, Claim.
 *   node dev/server.js --show --real  то же по настоящим датам.
 *   --lan    слушать все интерфейсы (коллеги в сети заходят по http://<ip>:8797)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000 (по умолчанию 8797 — закреплён за CoinsMania в _playtest\brands.json); COIN_DATA=путь к data.json;
 *   COIN_DEMO='{"practiceMin":5,"wave1Min":10,"wave2Min":10,"goldenMin":20,"offersGapMin":1,"claimMin":15,"startInSec":60}'
 *   Коды: dev/codes.csv — строки `tier,code` (tier: t2 t4 t6 golden, офферы: offer_golden offer_vault offer_piggy offer_stocking).
 *
 * /        — игра (?nick= или ?name= — вход без формы, как требует общий плейтест; ?open=j1 — сразу открыть банку)
 * /stats   — прохождение банок (цель 60–85%), время, ходы, undo, подсказки, уровни, заявки player ID, быстрые банки
 * Claim prize как на Witching Hours: первый Claim — player ID (только цифры) на проверку, staff одобряет на /stats
 * (в плейтесте — само), после одобрения уходят все накопленные коды; следующие Claim — сразу. Claim до 03.01.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/coinsort');
const { JARS, ROW, TIERS, reached, offerFor, jar: getJar } = require('../server/jars');
const S = require('../server/schedule');
const { DM, leftLine, normPlayerId } = require('../server/texts');
const { fastSolve } = require('../server/fairplay');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const DATA = process.env.COIN_DATA || path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const PORT = Number(process.env.PORT) || 8797;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const SHOW = process.argv.includes('--show');
const OFFER_KEYS = ['offer_golden', 'offer_vault', 'offer_piggy', 'offer_stocking'];

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
    let demo = { practiceMin: 5, wave1Min: 10, wave2Min: 10, goldenMin: 20, offersGapMin: 1 };
    try { demo = { ...demo, ...JSON.parse(process.env.COIN_DEMO || '{}') }; } catch { /* дефолт */ }
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
    TIERS.map((t) => t.id).concat(OFFER_KEYS).forEach((k) => {
      pool[k] = []; for (let i = 1; i <= 200; i++) pool[k].push(`DEMO-${k.toUpperCase()}-${String(i).padStart(3, '0')}`);
    });
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
  const jars = ROW.filter((id) => pl.attempts[id] && pl.attempts[id].state.solved).length;
  const golden = Boolean(pl.attempts.golden && pl.attempts.golden.state.solved);
  return { jars, golden };
}
function canOpen(pl, id, t) {
  if (!SHOW) return { ok: true };
  return S.canStart(sched, t, id, { jarsDone: progressOf(pl).jars });
}
function dm(pl, text, t) { pl.dms.push({ at: t, text }); }

/** Новый уровень → «приз готов, жми Claim». Код выдаёт Claim (как на Witching Hours). */
function awardTiers(pl, t) {
  for (const id of reached(progressOf(pl))) {
    if (pl.tiers[id]) continue;
    pl.tiers[id] = { at: t, code: null };
    dm(pl, DM[id]({ goldenOpen: !SHOW || t >= sched.golden }), t);
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

/** Личные сообщения по расписанию (только --show): одно на игрока на событие. Посты (practice_open и т.п.) — не DM. */
function tick(pl, t) {
  if (!SHOW) return;
  for (const ev of sched.timeline) {
    if (ev.at > t || pl.sent[ev.key]) continue;
    pl.sent[ev.key] = true;
    if (pl.joinedAt > ev.at && ev.key !== 'offers') continue; // пришёл позже события — не догоняем
    const p = progressOf(pl);
    if (ev.key === 'live') dm(pl, DM.live(), ev.at);
    if (ev.key === 'wave2') dm(pl, DM.wave2({ jars: p.jars }), ev.at);
    if (ev.key === 'dm_below_two' && p.jars < 2) dm(pl, DM.dm_below_two({ jars: p.jars }), ev.at);
    if (ev.key === 'golden_open' && !p.golden) dm(pl, DM.golden_open({ jars: p.jars }), ev.at);
    if (ev.key === 'dm_last_hours') { const l = leftLine(p); if (l) dm(pl, DM.dm_last_hours({ left: l }), ev.at); }
    if (ev.key === 'offers') {
      const o = offerFor(p);
      if (o) { const code = takeCode('offer_' + o.id) || 'NO-CODES-LEFT'; pl.offer = { id: o.id, name: o.name, price: o.price, bonus: o.bonus, code }; dm(pl, DM.offer(pl.offer), ev.at); }
      else dm(pl, DM.noOffer(), ev.at);
    }
    if (ev.key === 'dm_unclaimed') { const n = unclaimed(pl).length; if (n) dm(pl, DM.dm_unclaimed({ n }), ev.at); }
  }
}

function attemptOut(a, extra) {
  if (!a) return null;
  const out = { status: a.status, startedAt: a.startedAt, finishedAt: a.finishedAt || null, result: a.result || null, view: mech.view(a.state, a.status !== 'active') };
  return extra ? { ...out, ...extra } : out;
}

/** Закрыть всё, что не разобрано, когда ивент закончился. */
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
  const jars = JARS.map((j) => {
    const a = pl.attempts[j.id];
    return {
      id: j.id, title: j.title, size: j.size, colors: j.colors, practice: Boolean(j.practice), golden: Boolean(j.golden),
      status: a ? (a.state.solved ? 'sorted' : a.status === 'expired' ? 'expired' : 'active') : 'new',
      can: canOpen(pl, j.id, t),
    };
  });
  const out = {
    nick: pl.nick, mode: SHOW ? 'show' : 'playtest', now: t, jars,
    progress: progressOf(pl), tiers: TIERS.map((x) => ({ ...x, got: pl.tiers[x.id] || null })),
    dms: pl.dms.slice().reverse(), offer: pl.offer || null,
    claim: { open: SHOW ? S.claimOpen(sched, t) : true, unclaimed: unclaimed(pl).length, pid: pl.pid ? { status: pl.pid.status } : null },
  };
  if (SHOW) { out.phase = S.phaseAt(sched, t); out.sched = sched; }
  save();
  return out;
}

/** Лог подозрительно быстрых банок (server/fairplay.js) — только для разбора, на призы не влияет. */
function flagOf(j, a) {
  const s = a.state;
  return fastSolve({ ms: a.finishedAt - a.startedAt, pours: s.pours, undos: s.undos, hints: s.hintsUsed, solverPours: s.solverPours, practice: j.practice });
}

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function stats() {
  const players = Object.values(db.players);
  const jars = JARS.map((j) => {
    const at = players.map((pl) => pl.attempts[j.id]).filter(Boolean);
    const ok = at.filter((a) => a.state.solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    const stuck = at.filter((a) => !a.state.solved && a.state.restarts > 0).length;
    return {
      id: j.id, title: j.title, size: j.size,
      opened: at.length, sorted: ok.length,
      rate: at.length ? Math.round((ok.length / at.length) * 100) : null,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianPours: ok.length ? median(ok.map((a) => a.state.pours)) : null,
      medianUndos: ok.length ? median(ok.map((a) => a.state.undos)) : null,
      hintUsed: ok.length ? Math.round((ok.filter((a) => a.state.hintsUsed > 0).length / ok.length) * 100) : null,
      restartedNotDone: stuck,
    };
  });
  const dist = [0, 0, 0, 0, 0, 0, 0];
  const tiers = {}; TIERS.forEach((x) => { tiers[x.id] = 0; });
  const list = players.map((pl) => {
    const p = progressOf(pl);
    dist[p.jars] += 1;
    reached(p).forEach((id) => { tiers[id] += 1; });
    return { nick: pl.nick, jars: p.jars, golden: p.golden, practice: Boolean(pl.attempts.practice && pl.attempts.practice.state.solved) };
  });
  const pending = Object.entries(db.players).filter(([, pl]) => pl.pid && pl.pid.status === 'pending')
    .map(([p, pl]) => ({ p, nick: pl.nick, playerId: pl.pid.id, at: pl.pid.at, unclaimed: unclaimed(pl).map(prizeOf) }));
  const fast = [];
  for (const pl of players) for (const j of JARS) {
    const a = pl.attempts[j.id];
    if (a && a.flag) fast.push({ nick: pl.nick, jar: j.id, title: j.title, size: j.size, sec: Math.round((a.finishedAt - a.startedAt) / 1000), pours: a.state.pours, flag: a.flag });
  }
  // Общий хаб плейтеста (_playtest\README.md): доля прохождения строками { label, played, passed, rate }.
  const summaryRows = jars.map((j) => ({ label: `${j.title} ${j.size}`, played: j.opened, passed: j.sorted, rate: j.rate }));
  return { mode: SHOW ? 'show' : 'playtest', players: players.length, jars, jarsDist: dist, tiers, pending, fast, summary: { rows: summaryRows }, list: list.sort((a, b) => b.jars - a.jars || b.golden - a.golden) };
}

// ---------- HTTP ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
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
      if (pth === '/qa') return sendFile(res, __dirname, 'qa.html');
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

    // Claim prize: первый раз — player ID на проверку; после одобрения — сразу.
    if (pth === '/api/claim') {
      if (SHOW && !S.claimOpen(sched, t)) return sendJson(res, 200, { error: 'claim_closed' });
      if (!unclaimed(pl).length) return sendJson(res, 200, { error: 'nothing_to_claim' });
      if (pl.pid && pl.pid.status === 'approved') { const codes = payOut(pl, t); dm(pl, DM.claimed({ codes }), t); save(); return sendJson(res, 200, { status: 'paid', codes }); }
      if (pl.pid && pl.pid.status === 'pending') return sendJson(res, 200, { status: 'pending' });
      const id = normPlayerId(b.playerId);
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

    const j = getJar(b.jar);
    if (!j) return sendJson(res, 400, { error: 'bad_jar' });

    if (pth === '/api/open') {
      const a = pl.attempts[j.id];
      if (!a) {
        const can = canOpen(pl, j.id, t);
        if (!can.ok) return sendJson(res, 200, { error: can.error, can });
        pl.attempts[j.id] = { status: 'active', state: mech.create({ jar: j.id }, rng, { now: t }), startedAt: t };
        save();
      }
      return sendJson(res, 200, { attempt: attemptOut(pl.attempts[j.id]) });
    }
    if (pth === '/api/move') {
      const a = pl.attempts[j.id];
      if (!a) return sendJson(res, 200, { error: 'not_started' });
      if (a.status !== 'active') return sendJson(res, 200, { error: a.status === 'expired' ? 'closed' : 'finished', attempt: attemptOut(a) });
      const r = mech.move(a.state, b.input, { now: t, rng });
      if (r.error) return sendJson(res, 200, { error: r.error, attempt: attemptOut(a) });
      if (r.done) {
        a.status = 'done'; a.finishedAt = t; a.result = r.result; awardTiers(pl, t);
        a.flag = flagOf(j, a);
        if (a.flag) console.log(`[fast] ${pl.nick} · ${j.id} · ${a.flag}`);
      }
      save();
      return sendJson(res, 200, { attempt: attemptOut(a, r.hint ? { hint: r.hint } : null) });
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
    console.log(`Merry Coinsmas — ${SHOW ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (SHOW) {
      const f = (ms) => new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  практика ${f(sched.practice)} · банки 1–3 ${f(sched.wave1)} · 4–6 ${f(sched.wave2)} · золотая ${f(sched.golden)} · конец ${f(sched.closesAt)} · офферы ${f(sched.offersAt)} · Claim до ${f(sched.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      for (const list of Object.values(require('os').networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}

module.exports = { server };
