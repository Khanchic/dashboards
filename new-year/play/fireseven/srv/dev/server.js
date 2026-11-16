/**
 * Стенд Crack the 777 Vault (Fire Seven) для общего плейтеста. Без Discord, без зависимостей.
 * Движок — тот же, что пойдёт в прод: ../engine/wh-adapter.js + vault-event.js. Клиент — ../client/vault.js.
 *
 * ПЛЕЙТЕСТ: у каждого свой сейф, на Start открываются все 7 замков сразу (в бою — раз в час с 12:00 ET),
 * на взлом 90 минут. Сейф вскрывается, когда закончены все 7 замков, по кнопке «Open my vault now» или по таймеру.
 * Топ-3 считается по всем игрокам стенда (vault-event.rankTop), Claim в плейтесте ничего не выдаёт.
 *
 *   node dev/server.js [--lan]   порт 8793 (закреплён в _playtest\brands.json), PORT= переопределяет
 *   node dev/server.js --reset   стереть результаты (dev/data.json) и выйти
 *
 * /        — игра (?nick= или ?name= — вход без формы, как требует общий плейтест)
 * /stats   — прохождение замков, попытки, дворецкий, топ-3
 * /api/stats — для хаба плейтеста: players, list[{nick}], summary.rows
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const A = require('../engine/wh-adapter');
const E = require('../engine/vault-event');

const F7 = path.join(__dirname, '..');
const APP_PUBLIC = path.join(F7, '..', '..', 'halloween-week', 'app', 'public'); // hub-core.js и hub.css — только чтение
const DATA = path.join(__dirname, 'data.json');
const PORT = Number(process.env.PORT) || 8793;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const PLAY_MIN = 90;
const CONTEST_ID = 'f7-vault';

if (process.argv.includes('--reset')) {
  if (fs.existsSync(DATA)) fs.unlinkSync(DATA);
  console.log('data.json removed');
  process.exit(0);
}

let db = { players: {} };
try { db = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch { /* первый запуск */ }
let saveTimer = null;
const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => fs.writeFileSync(DATA, JSON.stringify(db)), 200); };
const rng = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
const now = () => Date.now();

// ---------- сейф игрока ----------
/** Результаты замков как их видит движок: после закрытия — из finalize (заклинившие = все попытки + 2), до — из view. */
function results(pl) {
  if (!pl.att) return [];
  return (pl.att.result && pl.att.result.locks) || A.view(pl.att.state).total.locks;
}
/** Время вышло — незаконченные замки с попытками считаются заклинившими (как finalize в 23:30). */
function sweep(pl, t) {
  const a = pl.att;
  if (!a || a.status !== 'active' || t < a.state.close) return;
  const f = A.finalize(a.state);
  a.status = 'done'; a.result = f.result; a.finishedAt = a.state.close;
  save();
}
function openVault(pl, t) {
  const a = pl.att;
  if (!a) return;
  if (a.status === 'active') { a.state.close = Math.min(a.state.close, t); sweep(pl, t); }
  a.state.reveal = Math.min(a.state.reveal, Math.max(t, a.state.close));
  save();
}
function topNow() {
  const players = Object.entries(db.players).filter(([, pl]) => pl.att && pl.att.status === 'done').map(([id, pl]) => ({ userId: id, results: results(pl) }));
  return E.rankTop(players);
}
function publicAttempt(id, pl, t) {
  const a = pl.att;
  if (!a) return null;
  const v = A.view(a.state, a.status !== 'active' || t >= a.state.close);
  if (t >= a.state.reveal) v.prize = E.prizeFor(id, results(pl), topNow());
  return { status: a.status, result: a.result, view: v };
}
function contestOut(pl, t) {
  const s = pl.att && pl.att.state;
  const opens = s ? s.opens : E.LOCKS.map(() => t);
  const close = s ? s.close : t + PLAY_MIN * 60000;
  const reveal = s ? s.reveal : close;
  return { id: CONTEST_ID, mechanic: 'vault777', name: 'Crack the 777 Vault', ready: true, params: { opens, close, reveal },
    session: 'xmas', sessionTitle: 'Christmas Day · playtest', sessionKind: 'night', index: 0, of: 1,
    startsAt: opens[0], closesAt: close, open: !s || (t >= opens[0] && t < close) };
}
function stateFor(id, pl) {
  const t = now();
  sweep(pl, t);
  const c = contestOut(pl, t);
  return {
    now: t,
    brand: { slug: 'fireseven', name: 'Fire Seven', palette: { accent: '#d71434', fire: '#d39045', panel: 'rgba(5,17,12,.74)', ground: '#020806' }, discord: null },
    me: { name: pl.nick, status: 'approved', canPlay: true },
    contest: c,
    attempt: publicAttempt(id, pl, t),
    track: E.LOCKS.map((L, i) => ({ id: 'l' + i, name: L.name, startsAt: c.params.opens[i], state: t >= c.closesAt ? 'done' : t >= c.params.opens[i] ? 'now' : 'soon' })),
  };
}

// ---------- статистика ----------
function stats() {
  const t = now();
  const locks = E.LOCKS.map((L) => ({ id: L.id, name: L.name, played: 0, passed: 0, tries: 0, butler: 0 }));
  const list = [];
  for (const [id, pl] of Object.entries(db.players)) {
    sweep(pl, t);
    if (!pl.att) { list.push({ nick: pl.nick, cracked: 0, score: null, status: 'not started' }); continue; }
    pl.att.state.locks.forEach((s, i) => {
      if (!s.guesses.length) return;
      const L = locks[i];
      L.played++; L.tries += s.guesses.length;
      if (s.status === 'solved') L.passed++;
      if (s.butler) L.butler++;
    });
    const sum = E.playerSummary(results(pl));
    list.push({ nick: pl.nick, cracked: sum.cracked, score: sum.score, status: pl.att.status, min: Math.round(((pl.att.finishedAt || t) - pl.att.startedAt) / 60000), id });
  }
  locks.forEach((L) => { L.rate = L.played ? Math.round((L.passed / L.played) * 100) : null; L.avgTries = L.played ? +(L.tries / L.played).toFixed(1) : null; });
  const top = topNow().map((x) => ({ place: x.place, nick: db.players[x.userId].nick, cracked: x.cracked, score: x.score }));
  return {
    mode: 'playtest', players: Object.keys(db.players).length, locks, top,
    summary: { rows: locks.map((L) => ({ label: `${L.id} ${L.name}`, played: L.played, passed: L.passed, rate: L.rate })) },
    list: list.sort((a, b) => b.cracked - a.cracked || (a.score ?? 99) - (b.score ?? 99)).map(({ id, ...r }) => r),
  };
}

// ---------- http ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json' };
function sendFile(res, base, rel) {
  const f = path.normalize(path.join(base, decodeURIComponent(rel)));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}
const sendJson = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
const body = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } }); });

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const pth = url.pathname;
    if (req.method === 'GET') {
      if (pth === '/' || pth === '/index.html') return sendFile(res, __dirname, 'index.html');
      if (pth === '/stats') return sendFile(res, __dirname, 'stats.html');
      if (pth === '/hub-core.js' || pth === '/hub.css') return sendFile(res, APP_PUBLIC, pth.slice(1));
      if (pth === '/vault.js' || pth === '/vault.css') return sendFile(res, path.join(F7, 'client'), pth.slice(1));
      if (pth.startsWith('/assets/')) return sendFile(res, path.join(F7, 'assets'), pth.slice(8));
      if (pth === '/api/stats') return sendJson(res, 200, stats());
      if (pth === '/api/state') {
        const pl = db.players[url.searchParams.get('p')];
        return pl ? sendJson(res, 200, stateFor(url.searchParams.get('p'), pl)) : sendJson(res, 404, { error: 'login' });
      }
      res.writeHead(404); return res.end('not found');
    }
    const b = await body(req);
    if (pth === '/api/join') {
      const nick = String(b.nick || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      if (nick.length < 2) return sendJson(res, 400, { error: 'bad_nick' });
      const id = nick.toLowerCase();
      if (!db.players[id]) { db.players[id] = { nick, joinedAt: now(), att: null }; save(); }
      return sendJson(res, 200, { p: id, nick: db.players[id].nick });
    }
    const id = b.p, pl = db.players[id];
    if (!pl) return sendJson(res, 409, { error: 'login' });
    const t = now();
    sweep(pl, t);
    if (pth === '/api/start') {
      if (!pl.att) {
        const opens = E.LOCKS.map(() => t);
        const close = t + PLAY_MIN * 60000;
        pl.att = { status: 'active', state: A.create({ opens, close, reveal: close }, rng), result: null, startedAt: t };
        save();
        console.log(`[start] ${pl.nick}`);
      }
      return sendJson(res, 200, { attempt: publicAttempt(id, pl, t) });
    }
    if (pth === '/api/move') {
      const a = pl.att;
      if (!a) return sendJson(res, 409, { error: 'not_started' });
      if (a.status !== 'active') return sendJson(res, 200, { error: 'finished', attempt: publicAttempt(id, pl, t) });
      const r = A.move(a.state, b.input || {}, { now: t, rng });
      if (r.error) return sendJson(res, 409, { error: r.error });
      if (r.done) {
        a.status = 'done'; a.result = r.result; a.finishedAt = t;
        a.state.close = t; a.state.reveal = t; // все 7 замков закончены — вскрытие сразу
        console.log(`[done] ${pl.nick} · ${r.result.cracked}/7 · ${r.result.score} tries`);
      }
      save();
      return sendJson(res, 200, { attempt: publicAttempt(id, pl, t) });
    }
    if (pth === '/api/open-now') { openVault(pl, t); return sendJson(res, 200, { attempt: publicAttempt(id, pl, t) }); }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error(e);
    sendJson(res, 500, { error: 'server' });
  }
}).listen(PORT, HOST, () => {
  console.log(`Fire Seven · Crack the 777 Vault — playtest stand`);
  console.log(`  game  http://localhost:${PORT}/?nick=Test`);
  console.log(`  stats http://localhost:${PORT}/stats`);
  if (HOST === '0.0.0.0') {
    const ips = Object.values(require('os').networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
    ips.forEach((ip) => console.log(`  LAN   http://${ip}:${PORT}`));
  }
});
