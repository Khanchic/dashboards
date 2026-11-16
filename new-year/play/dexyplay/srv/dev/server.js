/**
 * Стенд Dexy's Holiday Stream: Tag the City. Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Режимы:
 *   node dev/server.js              ПЛЕЙТЕСТ (до 16.12): открыто всё сразу, включая мурал; уровни призов видны, кодов нет.
 *   node dev/server.js --show       РЕПЕТИЦИЯ (18.12): ивент сжат (~50 мин) и стартует через минуту — практика,
 *                                   LIVE (стены 1–3), второй сегмент (4–6), мурал для 4+ стен, конец эфира, офферы, Claim.
 *   node dev/server.js --show --real  то же по настоящим датам.
 *   --lan    слушать все интерфейсы (коллеги в сети заходят по http://<ip>:8794)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000 (по умолчанию 8794 — закреплён за DexyPlay в _playtest\brands.json); TAG_DATA=путь к data.json;
 *   TAG_DEMO='{"practiceMin":5,"wave1Min":10,"wave2Min":10,"muralMin":20,"offersGapMin":1,"claimMin":15,"startInSec":60}'
 *   Коды: dev/codes.csv — строки `tier,code` (tier: t2 t4 t6 mural, офферы: offer_mural offer_city offer_wall offer_spray).
 *
 * /        — игра (?nick= или ?name= — вход без формы, как требует общий плейтест)
 * /stats   — прохождение стен (цель 60–85%), время, подсказки, уровни, заявки player ID, подозрительно быстрые стены
 * /promo   — картинки к постам (?post=announce|practice|live|wave2|mural|last|end&fmt=wide|tall); end = мозаика
 *            из /api/mosaic (все расписанные стены без ников; ?demo=N — N случайных стен для макета)
 * Claim prize как на Witching Hours: первый Claim — player ID (только цифры) на проверку, staff одобряет на /stats
 * (в плейтесте — само), после одобрения уходят все накопленные коды; следующие Claim — сразу. Claim до 03.01.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/tagwall');
const { WALLS, STREET, TIERS, POOLS, reached, offerFor, wall: getWall } = require('../server/walls');
const S = require('../server/schedule');
const { DM, leftLine, normPlayerId } = require('../server/texts');
const { fastSolve } = require('../server/fairplay');
const P = require('../shared/picross');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const PROMO = path.join(ROOT, '..', 'promo');
const DATA = process.env.TAG_DATA || path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const PORT = Number(process.env.PORT) || 8794;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const SHOW = process.argv.includes('--show');
const OFFER_KEYS = ['offer_mural', 'offer_city', 'offer_wall', 'offer_spray'];

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
    let demo = { practiceMin: 5, wave1Min: 10, wave2Min: 10, muralMin: 20, offersGapMin: 1 };
    try { demo = { ...demo, ...JSON.parse(process.env.TAG_DEMO || '{}') }; } catch { /* дефолт */ }
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
  const walls = STREET.filter((id) => pl.attempts[id] && pl.attempts[id].state.solved).length;
  const mural = Boolean(pl.attempts.mural && pl.attempts.mural.state.solved);
  return { walls, mural };
}
function canOpen(pl, id, t) {
  if (!SHOW) return { ok: true };
  return S.canStart(sched, t, id, { wallsDone: progressOf(pl).walls });
}
function dm(pl, text, t) { pl.dms.push({ at: t, text }); }

/** Новый уровень → «приз готов, жми Claim». Код выдаёт Claim (как на Witching Hours). */
function awardTiers(pl, t) {
  for (const id of reached(progressOf(pl))) {
    if (pl.tiers[id]) continue;
    pl.tiers[id] = { at: t, code: null };
    dm(pl, DM[id]({ muralOpen: !SHOW || t >= sched.mural }), t);
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
    if (ev.key === 'wave2') dm(pl, DM.wave2({ walls: p.walls }), ev.at);
    if (ev.key === 'dm_below_two' && p.walls < 2) dm(pl, DM.dm_below_two({ walls: p.walls }), ev.at);
    if (ev.key === 'mural_open' && !p.mural) dm(pl, DM.mural_open({ walls: p.walls }), ev.at);
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

/** Закрыть всё, что не дорисовано, когда эфир закончился. */
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
  const walls = WALLS.map((w) => {
    const a = pl.attempts[w.id];
    const out = {
      id: w.id, title: w.title, size: w.size, practice: Boolean(w.practice), mural: Boolean(w.mural),
      status: a ? (a.state.solved ? 'tagged' : a.status === 'expired' ? 'expired' : 'active') : 'new',
      can: canOpen(pl, w.id, t),
    };
    if (a && a.state.solved) out.tagged = { name: a.state.name, W: a.state.W, H: a.state.H, grid: a.state.grid.slice(), neon: w.neon };
    return out;
  });
  const out = {
    nick: pl.nick, mode: SHOW ? 'show' : 'playtest', now: t, walls,
    progress: progressOf(pl), tiers: TIERS.map((x) => ({ ...x, got: pl.tiers[x.id] || null })),
    dms: pl.dms.slice().reverse(), offer: pl.offer || null,
    claim: { open: SHOW ? S.claimOpen(sched, t) : true, unclaimed: unclaimed(pl).length, pid: pl.pid ? { status: pl.pid.status } : null },
  };
  if (SHOW) { out.phase = S.phaseAt(sched, t); out.sched = sched; }
  save();
  return out;
}

/** Лог подозрительно быстрых стен (server/fairplay.js) — только для разбора, на призы не влияет. */
function flagOf(w, a) {
  const s = a.state;
  return fastSolve({ W: s.W, H: s.H, ms: a.finishedAt - a.startedAt, moves: s.moves, filled: s.grid.filter((v) => v === 1).length, practice: w.practice });
}

/** Мозаика 27.12: все расписанные стены (без ников и практики). demo=N — случайные стены из пулов для макета поста. */
function mosaic(demo) {
  if (demo) {
    const r = rng;
    const out = [];
    for (let i = 0; i < demo; i++) {
      const w = WALLS.filter((x) => !x.practice)[Math.min(6, Math.floor(r() * r() * 7.99))];
      const pool = POOLS[w.pool]; const pic = pool[Math.floor(r() * pool.length)];
      const rows = r() < 0.5 ? P.mirror(pic.rows) : pic.rows;
      out.push({ wall: w.id, name: pic.name, W: rows[0].length, H: rows.length, grid: rows.join('').split('').map((c) => (c === '#' ? 1 : 0)), neon: w.neon });
    }
    return { demo: true, walls: out };
  }
  const walls = [];
  for (const pl of Object.values(db.players)) for (const w of WALLS) {
    if (w.practice) continue;
    const a = pl.attempts[w.id];
    if (a && a.state.solved) walls.push({ wall: w.id, name: a.state.name, W: a.state.W, H: a.state.H, grid: a.state.grid.slice(), neon: w.neon, at: a.finishedAt });
  }
  walls.sort((x, y) => x.at - y.at);
  return { demo: false, walls };
}

const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function stats() {
  const players = Object.values(db.players);
  const walls = WALLS.map((w) => {
    const at = players.map((pl) => pl.attempts[w.id]).filter(Boolean);
    const ok = at.filter((a) => a.state.solved);
    const mins = ok.map((a) => (a.finishedAt - a.startedAt) / 60000);
    const pics = {}; ok.forEach((a) => { pics[a.state.name] = (pics[a.state.name] || 0) + 1; });
    return {
      id: w.id, title: w.title, size: w.size,
      opened: at.length, tagged: ok.length,
      rate: at.length ? Math.round((ok.length / at.length) * 100) : null,
      medianMin: mins.length ? +median(mins).toFixed(1) : null,
      medianPaints: ok.length ? median(ok.map((a) => a.state.paints)) : null,
      hintUsed: ok.length ? Math.round((ok.filter((a) => a.state.hintsUsed > 0).length / ok.length) * 100) : null,
      pics,
    };
  });
  const dist = [0, 0, 0, 0, 0, 0, 0];
  const tiers = {}; TIERS.forEach((x) => { tiers[x.id] = 0; });
  const list = players.map((pl) => {
    const p = progressOf(pl);
    dist[p.walls] += 1;
    reached(p).forEach((id) => { tiers[id] += 1; });
    return { nick: pl.nick, walls: p.walls, mural: p.mural, practice: Boolean(pl.attempts.practice && pl.attempts.practice.state.solved) };
  });
  const pending = Object.entries(db.players).filter(([, pl]) => pl.pid && pl.pid.status === 'pending')
    .map(([p, pl]) => ({ p, nick: pl.nick, playerId: pl.pid.id, at: pl.pid.at, unclaimed: unclaimed(pl).map(prizeOf) }));
  const fast = [];
  for (const pl of players) for (const w of WALLS) {
    const a = pl.attempts[w.id];
    if (a && a.flag) fast.push({ nick: pl.nick, wall: w.id, title: w.title, size: w.size, sec: Math.round((a.finishedAt - a.startedAt) / 1000), flag: a.flag });
  }
  // Общий хаб плейтеста (_playtest\README.md): доля прохождения строками { label, played, passed, rate }.
  const summaryRows = walls.map((w) => ({ label: `${w.title} ${w.size}`, played: w.opened, passed: w.tagged, rate: w.rate }));
  return { mode: SHOW ? 'show' : 'playtest', players: players.length, walls, wallsDist: dist, tiers, pending, fast, summary: { rows: summaryRows }, list: list.sort((a, b) => b.walls - a.walls || b.mural - a.mural) };
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
      if (pth === '/phone') return sendFile(res, __dirname, 'phone.html');
      if (pth.startsWith('/client/')) return sendFile(res, path.join(ROOT, 'client'), pth.slice(8));
      if (pth.startsWith('/shared/')) return sendFile(res, path.join(ROOT, 'shared'), pth.slice(8));
      if (pth.startsWith('/assets/')) return sendFile(res, BRAND_ASSETS, pth.slice(8));
      if (pth.startsWith('/3d/')) return sendFile(res, path.join(ROOT, '..', '..', '_3d'), pth.slice(4)); // 3D-ядро ивентов
      if (pth === '/promo') return sendFile(res, PROMO, 'posts.html');
      if (pth.startsWith('/promo/')) return sendFile(res, PROMO, pth.slice(7));
      // только стенд: картинки пулов для рендера постов (в прод этот маршрут не переносить — там решения секретны)
      if (pth === '/api/promo-pics') return sendJson(res, 200, { pools: POOLS, walls: WALLS });
      if (pth === '/api/mosaic') { const n = Math.min(800, Number(url.searchParams.get('demo')) || 0); return sendJson(res, 200, mosaic(n)); }
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

    const w = getWall(b.wall);
    if (!w) return sendJson(res, 400, { error: 'bad_wall' });

    if (pth === '/api/open') {
      const a = pl.attempts[w.id];
      if (!a) {
        const can = canOpen(pl, w.id, t);
        if (!can.ok) return sendJson(res, 200, { error: can.error, can });
        pl.attempts[w.id] = { status: 'active', state: mech.create({ wall: w.id }, rng, { now: t }), startedAt: t };
        save();
      }
      return sendJson(res, 200, { attempt: attemptOut(pl.attempts[w.id]) });
    }
    if (pth === '/api/move') {
      const a = pl.attempts[w.id];
      if (!a) return sendJson(res, 200, { error: 'not_started' });
      if (a.status !== 'active') return sendJson(res, 200, { error: a.status === 'expired' ? 'closed' : 'finished', attempt: attemptOut(a) });
      const r = mech.move(a.state, b.input, { now: t, rng });
      if (r.error) return sendJson(res, 200, { error: r.error, attempt: attemptOut(a) });
      if (r.done) {
        a.status = 'done'; a.finishedAt = t; a.result = r.result; awardTiers(pl, t);
        a.flag = flagOf(w, a);
        if (a.flag) console.log(`[fast] ${pl.nick} · ${w.id} · ${a.flag}`);
      }
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
    console.log(`Tag the City — ${SHOW ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (SHOW) {
      const f = (ms) => new Date(ms).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  практика ${f(sched.practice)} · LIVE ${f(sched.wave1)} · стены 4–6 ${f(sched.wave2)} · мурал ${f(sched.mural)} · конец эфира ${f(sched.closesAt)} · офферы ${f(sched.offersAt)} · Claim до ${f(sched.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      for (const list of Object.values(require('os').networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}

module.exports = { server };
