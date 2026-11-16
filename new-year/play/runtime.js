/**
 * Веб-плейтест без сервера: настоящий dev/server.js стенда выполняется прямо в браузере.
 * Подключается первым скриптом в <head> каждой страницы стенда (build-web.ps1 вставляет сам):
 *   <script src="../runtime.js" data-server="srv/dev/server.js"></script>
 *
 * Что делает:
 *  - CommonJS-загрузчик: require() относительных модулей синхронным XHR, .json — как данные;
 *  - заглушки node: http (ловит обработчик createServer), fs (данные стенда — в localStorage браузера,
 *    остальные файлы — XHR), path (posix), os, crypto (randomInt / randomBytes / randomUUID), process;
 *  - перехват fetch(): всё, что идёт в <папка стенда>/api/..., отдаётся обработчику сервера как req/res.
 * Результаты игрока живут в его браузере (общей статистики по коллегам здесь нет — для неё нужен сервер).
 * Сброс: ?reset=1 на странице стенда.
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var SERVER = (me && me.getAttribute('data-server')) || 'srv/dev/server.js';
  var BASE = location.pathname.replace(/[^/]*$/, ''); // папка стенда: /dashboards/new-year/play/stormrush/
  var KEY = 'nyplay:' + BASE;

  // ---------- localStorage-файлы ----------
  var store = {
    get: function (p) { try { return localStorage.getItem(KEY + p); } catch (e) { return null; } },
    set: function (p, v) { try { localStorage.setItem(KEY + p, v); } catch (e) { /* приватный режим — живёт до перезагрузки */ mem[p] = v; } },
    del: function (p) { try { localStorage.removeItem(KEY + p); } catch (e) {} delete mem[p]; },
  };
  var mem = {};
  if (/[?&]reset=1/.test(location.search)) {
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(KEY) === 0) localStorage.removeItem(k); }); } catch (e) {}
  }

  function xhr(url) {
    var r = new XMLHttpRequest();
    r.open('GET', url, false);
    try { r.send(null); } catch (e) { return null; }
    return r.status >= 200 && r.status < 300 ? r.responseText : null;
  }
  function enoent(p) { var e = new Error("ENOENT: no such file or directory, open '" + p + "'"); e.code = 'ENOENT'; return e; }

  // ---------- path ----------
  function normalize(p) {
    var abs = p.charAt(0) === '/', out = [];
    p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') { if (out.length && out[out.length - 1] !== '..') out.pop(); else if (!abs) out.push('..'); } else out.push(s); });
    return (abs ? '/' : '') + out.join('/') || (abs ? '/' : '.');
  }
  var path = {
    sep: '/', delimiter: ':',
    normalize: normalize,
    join: function () { return normalize(Array.prototype.filter.call(arguments, Boolean).join('/')); },
    resolve: function () { var p = ''; for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; if (!a) continue; p = a.charAt(0) === '/' ? a : p + '/' + a; } return normalize(p || '/'); },
    dirname: function (p) { var i = p.replace(/\/+$/, '').lastIndexOf('/'); return i <= 0 ? (i === 0 ? '/' : '.') : p.slice(0, i); },
    basename: function (p, ext) { var b = p.replace(/\/+$/, '').split('/').pop(); return ext && b.slice(-ext.length) === ext ? b.slice(0, -ext.length) : b; },
    extname: function (p) { var b = path.basename(p), i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : ''; },
    relative: function (a, b) { return b; },
    isAbsolute: function (p) { return p.charAt(0) === '/'; },
  };
  path.posix = path;

  // ---------- fs ----------
  var fs = {
    existsSync: function (p) { return store.get(p) != null || p in mem; },
    readFileSync: function (p, enc) {
      var v = store.get(p); if (v == null && p in mem) v = mem[p];
      if (v == null) { v = xhr(p); if (v == null) throw enoent(p); }
      return v;
    },
    writeFileSync: function (p, data) { store.set(p, String(data)); },
    appendFileSync: function (p, data) { store.set(p, (store.get(p) || '') + String(data)); },
    unlinkSync: function (p) { store.del(p); },
    mkdirSync: function () {},
    statSync: function (p) { if (!fs.existsSync(p)) throw enoent(p); return { isDirectory: function () { return false; }, isFile: function () { return true; }, size: (store.get(p) || '').length, mtimeMs: Date.now() }; },
    readFile: function (p, enc, cb) { if (typeof enc === 'function') cb = enc; try { var v = fs.readFileSync(p); setTimeout(function () { cb(null, v); }); } catch (e) { setTimeout(function () { cb(e); }); } },
    writeFile: function (p, data, enc, cb) { if (typeof enc === 'function') cb = enc; fs.writeFileSync(p, data); if (cb) setTimeout(function () { cb(null); }); },
    createReadStream: function () { return { pipe: function (res) { res.writeHead(404); res.end('not found'); } }; },
  };
  fs.promises = { readFile: function (p) { return Promise.resolve().then(function () { return fs.readFileSync(p); }); }, writeFile: function (p, d) { fs.writeFileSync(p, d); return Promise.resolve(); } };

  // ---------- crypto ----------
  function rnd32() { var a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0]; }
  var crypto = {
    randomInt: function (min, max) { if (max === undefined) { max = min; min = 0; } var span = max - min; return min + Math.floor((rnd32() / 4294967296) * span); },
    randomBytes: function (n) {
      var b = new Uint8Array(n); window.crypto.getRandomValues(b);
      b.toString = function (enc) { return Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join(''); };
      return b;
    },
    randomUUID: function () { return window.crypto.randomUUID ? window.crypto.randomUUID() : 'u' + rnd32().toString(16) + rnd32().toString(16); },
  };

  // ---------- http ----------
  var handler = null;
  var http = {
    createServer: function (fn) {
      handler = fn;
      var srv = { listen: function () { var cb = arguments[arguments.length - 1]; if (typeof cb === 'function') { /* без «listening» в консоль */ } return srv; }, on: function () { return srv; }, close: function () {} };
      return srv;
    },
  };
  var os = { networkInterfaces: function () { return {}; }, hostname: function () { return 'web'; }, EOL: '\n' };
  var proc = { argv: ['node', 'server.js'], env: {}, exit: function () {}, on: function () {}, cwd: function () { return BASE; }, platform: 'web', versions: {}, nextTick: function (f) { Promise.resolve().then(f); } };
  window.process = window.process || proc;

  // ---------- require ----------
  var cache = {}, BUILTIN = { http: http, https: http, fs: fs, path: path, os: os, crypto: crypto, url: { URL: URL }, events: {} };
  function load(file) {
    if (cache[file]) return cache[file].exports;
    var src = xhr(file);
    if (src == null) throw new Error('Cannot find module ' + file);
    var module = { exports: {}, id: file, filename: file };
    cache[file] = module;
    if (/\.json$/.test(file)) { module.exports = JSON.parse(src); return module.exports; }
    var dir = path.dirname(file);
    var fn = new Function('module', 'exports', 'require', '__dirname', '__filename', 'process', src + '\n//# sourceURL=' + location.origin + file);
    fn(module, module.exports, makeRequire(dir), dir, file, proc);
    return module.exports;
  }
  function makeRequire(dir) {
    var req = function (spec) {
      if (spec.indexOf('node:') === 0) spec = spec.slice(5);
      if (BUILTIN[spec]) return BUILTIN[spec];
      var f = spec.charAt(0) === '/' ? spec : path.join(dir, spec);
      if (!/\.(js|json)$/.test(f)) f += '.js';
      return load(f);
    };
    req.main = null; // require.main !== module → стенды не зовут listen()
    return req;
  }

  var exp = null, err = null;
  try { exp = makeRequire(BASE)('./' + SERVER); } catch (e) { err = e; console.error('[play] server failed', e); }
  // Vegas: модуль экспортирует create({ base }) → { handle }
  if (!handler && exp && typeof exp.create === 'function') { var app = exp.create({ base: '' }); handler = app.handle; }
  if (exp && exp.server && !handler) handler = exp.server.handler;

  // ---------- fetch → обработчик ----------
  var realFetch = window.fetch.bind(window);
  function apiPath(u) {
    if (u.origin !== location.origin || u.pathname.indexOf(BASE) !== 0) return null;
    var rest = u.pathname.slice(BASE.length - 1); // '/api/me'
    return rest.indexOf('/api/') === 0 ? rest + u.search : null;
  }
  window.fetch = function (input, init) {
    var url = new URL(typeof input === 'string' ? input : input.url, location.href);
    var p = apiPath(url);
    if (!p) return realFetch(input, init);
    if (!handler) return Promise.resolve(new Response(JSON.stringify({ error: 'server_failed', message: String(err) }), { status: 500 }));
    init = init || {};
    var body = init.body == null ? '' : String(init.body);
    return new Promise(function (resolve) {
      var listeners = { data: [], end: [], error: [] };
      var req = {
        method: (init.method || 'GET').toUpperCase(), url: p, headers: { host: location.host, 'content-type': 'application/json' },
        on: function (ev, cb) { (listeners[ev] = listeners[ev] || []).push(cb); return req; },
        destroy: function () {}, socket: { remoteAddress: '127.0.0.1' },
      };
      var status = 200, headers = {}, chunks = [], done = false;
      var res = {
        statusCode: 200,
        setHeader: function (k, v) { headers[k] = v; },
        getHeader: function (k) { return headers[k]; },
        writeHead: function (s, h) { status = s; if (h) Object.keys(h).forEach(function (k) { headers[k] = h[k]; }); return res; },
        write: function (c) { chunks.push(String(c)); return true; },
        end: function (c) {
          if (done) return; done = true;
          if (c != null) chunks.push(String(c));
          if (res.statusCode !== 200 && status === 200) status = res.statusCode;
          resolve(new Response(status === 204 || status === 304 ? null : chunks.join(''), { status: status, headers: headers }));
        },
      };
      try {
        var r = handler(req, res);
        if (r && r.catch) r.catch(function (e) { console.error(e); res.writeHead(500); res.end(JSON.stringify({ error: 'server' })); });
      } catch (e) { console.error(e); res.writeHead(500); res.end(JSON.stringify({ error: 'server' })); }
      setTimeout(function () {
        if (body) listeners.data.forEach(function (f) { f(body); });
        listeners.end.forEach(function (f) { f(); });
      }, 0);
    });
  };

  window.NYPLAY = { base: BASE, ok: !!handler, error: err, reset: function () { location.search = '?reset=1'; } };
})();
