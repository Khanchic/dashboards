/**
 * Стенд «Countdown on the Strip». Без Discord, без зависимостей. Тот же модуль механики, что пойдёт в прод.
 *
 * Запуск отдельно:
 *   node dev/server.js              ПЛЕЙТЕСТ (до 18.12): все 6 актов открыты сразу, салют в любой момент, кодов нет.
 *   node dev/server.js --show       РЕПЕТИЦИЯ (23–24.12): весь ивент сжат в ~1 час и стартует через минуту —
 *                                   акты открываются по расписанию, закрываются, «полночь» → салют + Get my reward
 *                                   с выдачей кода, потом Encore для несыгранных актов. Логика как в проде.
 *   node dev/server.js --show --real  то же по настоящим датам 31.12–01.01 ET.
 *   --lan    слушать все интерфейсы (коллеги в сети заходят по http://<ip>:8790)
 *   --reset  стереть результаты (dev/data.json) и выйти
 *   PORT=9000; STRIP_DATA=путь к data.json; STRIP_DEMO='{"actGapMin":2,"playMin":20,...}' — параметры сжатия.
 *   Коды для репетиции: dev/codes.csv (tier,code) — если файла нет, генерируются DEMO-коды.
 *
 * Подключение в общий хаб плейтеста (один сервер на все бренды):
 *   const vegas = require('<...>/vegasway/mechanic/dev/server.js').create({ base: '/vegasway' });
 *   http.createServer((req, res) => { if (vegas.match(req)) return vegas.handle(req, res); ... });
 *   create(opts): base ('/vegasway'), data (путь к json), show (bool), real (bool), demo ({ actGapMin, ... }).
 *   Автовход по имени: <base>/?name=Ann — хаб передаёт имя, игроку не нужно вводить его в каждом бренде.
 *
 * <base>/        — игра
 * <base>/stats   — прохождение раундов, распределение очков и уровней, выданные коды
 * <base>/api/... — API стенда (все пути в страницах относительные, поэтому работают под любым base)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mech = require('../server/strip-act');
const { ACTS, MAX_POINTS, TIERS, tierOf, nextTier } = require('../server/acts');
const S = require('../server/schedule');

const ROOT = path.join(__dirname, '..');
const BRAND_ASSETS = path.join(ROOT, '..', 'assets');
const DEFAULT_DATA = path.join(__dirname, 'data.json');
const CODES = path.join(__dirname, 'codes.csv');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
const rng = () => crypto.randomInt(0, 2 ** 32) / 2 ** 32;
const now = () => Date.now();

function create(opts = {}) {
  const BASE = (opts.base || '').replace(/\/+$/, ''); // '' или '/vegasway'
  const DATA = opts.data || DEFAULT_DATA;
  const SHOW = Boolean(opts.show);

  let sched = null;
  if (SHOW) {
    if (opts.real) sched = S.build();
    else {
      const demo = { actGapMin: 2, playMin: 20, encoreMin: 15, ...(opts.demo || {}) };
      demo.start = new Date(now() + (demo.startInSec ?? 60) * 1000).toISOString();
      sched = S.build({ demo });
    }
  }

  let db = { players: {}, codesUsed: {} };
  try { db = { codesUsed: {}, ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch { /* первый запуск */ }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => fs.writeFileSync(DATA, JSON.stringify(db, null, 1)), 200);
  }

  // ---------- коды ----------
  let pool = null;
  function codePool() {
    if (pool) return pool;
    pool = {};
    TIERS.forEach((t) => { pool[t.id] = []; });
    if (fs.existsSync(CODES)) {
      for (const line of fs.readFileSync(CODES, 'utf8').split(/\r?\n/).slice(1)) {
        const [tier, code] = line.split(',').map((x) => (x || '').trim());
        if (pool[tier] && code) pool[tier].push(code);
      }
    } else {
      TIERS.forEach((t) => { for (let i = 1; i <= 100; i++) pool[t.id].push(`DEMO-${t.id.toUpperCase()}-${String(i).padStart(3, '0')}`); });
    }
    return pool;
  }
  function takeCode(tier) {
    const used = new Set(Object.values(db.codesUsed));
    return codePool()[tier].find((c) => !used.has(c)) || null;
  }

  // ---------- попытки ----------
  function attemptOut(a) {
    if (!a) return null;
    const finished = a.status !== 'active';
    return { status: a.status, startedAt: a.startedAt, finishedAt: a.finishedAt || null, result: a.result || null, view: mech.view(a.state, finished) };
  }
  const deadlineOf = (a) => (a.phase === 'encore' ? sched.encore.closesAt : sched.closesAt);

  /** Закрыть брошенные акты, у которых вышло время (засчитываются сыгранные раунды). */
  function sweep(t) {
    if (!SHOW) return;
    let changed = false;
    for (const pl of Object.values(db.players)) {
      for (const a of Object.values(pl.attempts)) {
        if (a.status === 'active' && t >= deadlineOf(a)) {
          const f = mech.finalize(a.state, a.startedAt);
          a.status = 'expired'; a.finishedAt = deadlineOf(a); a.result = f ? f.result : null;
          changed = true;
        }
      }
    }
    if (changed) save();
  }

  const totalOf = (pl) => Object.values(pl.attempts).reduce((s, a) => s + a.state.points, 0);
  function ctxOf(pl) {
    const started = Object.keys(pl.attempts).map(Number);
    const startedInEncore = started.filter((k) => pl.attempts[k].phase === 'encore');
    return { started, startedInEncore, claimed: Boolean(pl.claim) };
  }

  function summary(p) {
    const t = now();
    sweep(t);
    const pl = db.players[p];
    const acts = ACTS.map((a) => {
      const at = pl.attempts[a.act];
      const can = SHOW ? S.canStart(sched, t, a.act, ctxOf(pl)) : { ok: true, resume: Boolean(at) };
      return {
        act: a.act, title: a.title, host: a.host, opensHour: a.opensHour, type: a.rounds[0].type,
        status: at ? at.status : 'new', points: at ? at.state.points : 0, gains: at ? at.state.gains : [],
        can,
      };
    });
    const total = totalOf(pl);
    const tr = tierOf(total), nx = nextTier(total);
    const out = { nick: pl.nick, acts, total, max: MAX_POINTS, tier: tr, next: nx ? { id: nx.tier.id, name: nx.tier.name, need: nx.need } : null, tiers: TIERS, mode: SHOW ? 'show' : 'playtest', now: t };
    if (SHOW) {
      out.phase = S.phaseAt(sched, t);
      out.sched = { firstOpen: sched.acts[0].opensAt, acts: sched.acts, closesAt: sched.closesAt, midnight: sched.midnight, encore: sched.encore, claimUntil: sched.claimUntil };
      out.claim = { open: S.claimOpen(sched, t), claimed: pl.claim || null };
    }
    return out;
  }

  function rockets() {
    return Object.values(db.players).map((pl) => {
      const tr = tierOf(totalOf(pl));
      return tr ? { nick: pl.nick, points: totalOf(pl), tier: tr.id } : null;
    }).filter(Boolean);
  }

  function stats() {
    const rounds = ACTS.map((a) => ({
      act: a.act, title: a.title,
      rounds: a.rounds.map((r) => ({ type: r.type, n: r.n, swaps: r.swaps, ms: r.ms, played: 0, first: 0, second: 0, miss: 0 })),
      started: 0, finished: 0, msTotal: 0,
    }));
    const players = Object.values(db.players);
    const totals = [];
    const claims = {};
    TIERS.forEach((t) => { claims[t.id] = 0; });
    for (const pl of players) {
      let done = 0;
      for (const [k, at] of Object.entries(pl.attempts)) {
        const A = rounds[Number(k) - 1];
        A.started += 1;
        if (at.status === 'done') { A.finished += 1; A.msTotal += at.finishedAt - at.startedAt; done += 1; }
        at.state.gains.forEach((g, i) => {
          const R = A.rounds[i];
          R.played += 1;
          if (g === 3) R.first += 1; else if (g === 1) R.second += 1; else R.miss += 1;
        });
      }
      const sum = totalOf(pl);
      if (pl.claim) claims[pl.claim.tier] += 1;
      totals.push({ nick: pl.nick, points: sum, actsDone: done, tier: tierOf(sum) ? tierOf(sum).id : null, claimed: pl.claim ? pl.claim.code : null });
    }
    rounds.forEach((A) => { A.avgMinutes = A.finished ? +(A.msTotal / A.finished / 60000).toFixed(1) : null; delete A.msTotal; });
    return { brand: 'vegasway', mode: SHOW ? 'show' : 'playtest', players: players.length, rounds, totals: totals.sort((a, b) => b.points - a.points), tiers: TIERS.map((t) => ({ id: t.id, name: t.name, min: t.min })), claims };
  }

  // ---------- HTTP ----------
  function sendJson(res, code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  }
  function sendFile(res, dir, rel) {
    const file = path.normalize(path.join(dir, rel));
    if (!file.startsWith(dir + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  }
  function body(req) {
    return new Promise((resolve) => {
      let s = '';
      req.on('data', (c) => { s += c; if (s.length > 10000) req.destroy(); });
      req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
    });
  }
  const player = (p) => (p && db.players[p] ? p : null);

  function join(nickRaw) {
    const nick = String(nickRaw || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (nick.length < 2) return null;
    const id = nick.toLowerCase();
    if (!db.players[id]) { db.players[id] = { nick, joinedAt: now(), attempts: {} }; save(); }
    return { p: id, nick: db.players[id].nick };
  }

  /** Запрос относится к этому стенду? (для хаба: '/vegasway' и '/vegasway/...') */
  function match(req) {
    if (!BASE) return true;
    const u = req.url.split('?')[0];
    return u === BASE || u.startsWith(BASE + '/');
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    if (BASE && url.pathname === BASE) { // относительные пути страниц работают только с завершающим «/»
      res.writeHead(301, { Location: BASE + '/' + url.search }); return res.end();
    }
    const pth = BASE ? url.pathname.slice(BASE.length) : url.pathname;
    try {
      if (req.method === 'GET') {
        if (pth === '/') return sendFile(res, __dirname, 'index.html');
        if (pth === '/stats') return sendFile(res, __dirname, 'stats.html');
        if (pth.startsWith('/client/')) return sendFile(res, path.join(ROOT, 'client'), pth.slice(8));
        if (pth.startsWith('/assets/')) return sendFile(res, BRAND_ASSETS, pth.slice(8));
        if (pth === '/api/me') { const p = player(url.searchParams.get('p')); return p ? sendJson(res, 200, summary(p)) : sendJson(res, 404, { error: 'no_player' }); }
        if (pth === '/api/rockets') {
          if (SHOW && now() < sched.midnight) return sendJson(res, 200, { rockets: [], locked: true, at: sched.midnight });
          return sendJson(res, 200, { rockets: rockets() });
        }
        if (pth === '/api/stats') { sweep(now()); return sendJson(res, 200, stats()); }
        res.writeHead(404); return res.end('not found');
      }
      if (req.method !== 'POST') { res.writeHead(405); return res.end(); }
      const b = await body(req);
      if (pth === '/api/join') {
        const j = join(b.nick);
        return j ? sendJson(res, 200, j) : sendJson(res, 400, { error: 'bad_nick' });
      }
      const p = player(b.p);
      if (!p) return sendJson(res, 404, { error: 'no_player' });
      const pl = db.players[p];
      const t = now();
      sweep(t);

      if (pth === '/api/claim') {
        if (!SHOW) return sendJson(res, 200, { error: 'playtest' });
        if (pl.claim) return sendJson(res, 200, { claim: pl.claim });
        if (!S.claimOpen(sched, t)) return sendJson(res, 200, { error: 'not_open' });
        const tr = tierOf(totalOf(pl));
        if (!tr) return sendJson(res, 200, { error: 'no_points' });
        const code = takeCode(tr.id);
        if (!code) return sendJson(res, 200, { error: 'no_codes' }); // в проде: очередь + алерт staff
        pl.claim = { tier: tr.id, name: tr.name, points: totalOf(pl), code, at: t, bonus: tr.bonus, offer: tr.offer };
        db.codesUsed[p] = code;
        // незаконченный акт после Get my reward закрывается: уровень зафиксирован
        for (const a of Object.values(pl.attempts)) if (a.status === 'active') { const f = mech.finalize(a.state, a.startedAt); a.status = 'expired'; a.finishedAt = t; a.result = f ? f.result : null; }
        save();
        return sendJson(res, 200, { claim: pl.claim });
      }

      const a = Number(b.act);
      if (!ACTS.some((x) => x.act === a)) return sendJson(res, 400, { error: 'bad_act' });
      if (pth === '/api/start') {
        if (SHOW) {
          const can = S.canStart(sched, t, a, ctxOf(pl));
          if (!can.ok) return sendJson(res, 200, { error: can.error, attempt: attemptOut(pl.attempts[a]) });
        }
        if (!pl.attempts[a]) {
          pl.attempts[a] = { status: 'active', state: mech.create({ act: a }, rng, { now: t }), startedAt: t, phase: SHOW ? S.phaseAt(sched, t) : 'playtest' };
          save();
        }
        return sendJson(res, 200, { attempt: attemptOut(pl.attempts[a]) });
      }
      if (pth === '/api/move') {
        const at = pl.attempts[a];
        if (!at) return sendJson(res, 200, { error: 'not_started' });
        if (at.status !== 'active') return sendJson(res, 200, { error: at.status === 'expired' ? 'closed' : 'finished', attempt: attemptOut(at) });
        const r = mech.move(at.state, b.input, { now: t, rng });
        if (r.error) return sendJson(res, 200, { error: r.error });
        if (r.done) { at.status = 'done'; at.finishedAt = t; at.result = r.result; }
        save();
        return sendJson(res, 200, { attempt: attemptOut(at) });
      }
      res.writeHead(404); res.end('not found');
    } catch (e) {
      console.error(e);
      sendJson(res, 500, { error: 'server' });
    }
  }

  return { brand: 'vegasway', title: 'Vegas Way · Countdown on the Strip', base: BASE, sched, match, handle, stats };
}

module.exports = { create };

// ---------- запуск отдельно: node dev/server.js [--show [--real]] [--lan] [--reset] ----------
if (require.main === module) {
  const argv = process.argv;
  const data = process.env.STRIP_DATA || DEFAULT_DATA;
  if (argv.includes('--reset')) {
    if (fs.existsSync(data)) fs.unlinkSync(data);
    console.log('data.json removed');
    process.exit(0);
  }
  let demo = {};
  try { demo = JSON.parse(process.env.STRIP_DEMO || '{}'); } catch { /* дефолт */ }
  const app = create({ data, show: argv.includes('--show'), real: argv.includes('--real'), demo });
  const PORT = Number(process.env.PORT) || 8790;
  const HOST = argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
  http.createServer(app.handle).listen(PORT, HOST, () => {
    const host = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Countdown on the Strip — ${app.sched ? 'РЕПЕТИЦИЯ (--show)' : 'плейтест'}: http://${host}:${PORT}   stats: /stats`);
    if (app.sched) {
      const s = app.sched;
      const f = (ms) => new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      console.log(`  акты: ${s.acts.map((x) => f(x.opensAt)).join(' · ')}  закрытие ${f(s.closesAt)}`);
      console.log(`  «полночь» ${f(s.midnight)} · Encore ${f(s.encore.opensAt)}–${f(s.encore.closesAt)} · коды до ${f(s.claimUntil)}`);
      console.log(`  коды: ${fs.existsSync(CODES) ? 'dev/codes.csv' : 'DEMO-коды (dev/codes.csv нет)'}`);
    }
    if (HOST === '0.0.0.0') {
      const nets = require('os').networkInterfaces();
      for (const list of Object.values(nets)) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log(`  в сети: http://${n.address}:${PORT}`);
    }
  });
}
