// Fire Seven · Crack the 777 Vault — клиент игры для страницы Witching Hours (механика vault777).
// Сервер — fireseven/engine/wh-adapter.js: весь сейф = одна попытка, внутри 7 замков со своим расписанием.
// Ход: WH.move({ lock, guess:[4 индекса] }) или WH.move({ lock, butler:true }). Секрет замка браузер видит только у законченного замка.
// Панель #vault создаётся этим файлом внутри #dock (index.html менять не нужно, кроме строк script/link).
// Настройки — window.F7V_CONFIG до загрузки файла: { assetBase, claimUrl, onClaim(ctx), offerUrl, revealAfterCloseMin }.
// Макет, с которого перенесено: fireseven/index.html, секция #mock. Тексты — fireseven/copy/TEXTS.md §13–14.
(function () {
  'use strict';
  var $ = WH.$, esc = WH.esc;
  var CFG = window.F7V_CONFIG || {};
  var BASE = CFG.assetBase != null ? String(CFG.assetBase) : '../../fireseven/assets/fireseven/';
  var IDS = ['seven', 'diamond', 'champagne', 'bell', 'gift', 'pocket-watch', 'star', 'snowflake']; // как SYMBOLS в engine/vault-lock.js
  var NAMES = ['Seven', 'Diamond', 'Champagne', 'Bell', 'Gift', 'Pocket watch', 'Star', 'Snowflake'];
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  var LEN = 4;
  var REVEAL_AFTER_CLOSE = (CFG.revealAfterCloseMin || 30) * 60000; // запасной вариант, если сервер не прислал reveal
  // запасные призы, если сервер не прислал view.prize (зеркало engine/vault-event.js REST / OFFERS)
  // утешительный приз (23.11): −30% на личный оффер, без Claim
  var REST = { discount: 30 };
  var OFFERS = [
    { min: 1, max: 2, offer: { name: "Butler's Nightcap", price: 9.99, sale: 6.99, extra: 100, hours: 48 } },
    { min: 3, max: 6, offer: { name: 'Velvet Combination', price: 19.99, sale: 13.99, extra: 40, hours: 48 } },
    { min: 7, max: 7, offer: { name: 'Seven Sevens Case', price: 39.99, sale: 27.99, extra: 50, hours: 48 } },
  ];

  var S = {
    built: false, key: null, view: null, c: null, a: null, cur: -1,
    input: [null, null, null, null], cursor: 0, busy: false, art: false, justLit: -1,
    spin: 0, sig: '', phase: '', openN: -1, tut: -1, gateHidden: false, revealLoad: false,
  };

  // ---------- иконки ----------
  var S7 = 'M60.902 33.0804H78.795L94.816 0H36.355L24.578 23.4692H52.667L27.856 79.096H58.229L77.022 37.0507L60.904 33.0814Z';
  var ARM = '<path d="M24 24V6M19.5 9.5 24 13.5 28.5 9.5"/>';
  var SPRITE =
    '<symbol id="f7v-s7" viewBox="22 -2 75 83"><path d="' + S7 + '"/></symbol>' +
    '<symbol id="f7v-i0" viewBox="0 0 48 48"><path transform="translate(-4.6 5) scale(.48)" fill="var(--sev,#D71434)" d="' + S7 + '"/></symbol>' +
    '<symbol id="f7v-i1" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M9 18 16 10H32L39 18 24 40Z"/><path d="M9 18H39M16 10 20 18 24 10 28 18 32 10M20 18 24 40 28 18"/></g></symbol>' +
    '<symbol id="f7v-i2" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M17 6H31L30 19C29.5 24.5 27 27.5 24 27.5S18.5 24.5 18 19Z"/><path d="M18.4 15H29.6M24 27.5V40M17 41.5H31"/><circle cx="23" cy="20" r=".9" fill="currentColor"/><circle cx="26" cy="22.5" r=".7" fill="currentColor"/></g></symbol>' +
    '<symbol id="f7v-i3" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><path d="M13 34C15.5 31 16 27 16 22 16 15.5 19.5 11.5 24 11.5S32 15.5 32 22C32 27 32.5 31 35 34Z"/><path d="M11 34H37M24 11.5V7"/><circle cx="24" cy="38" r="2.6"/></g></symbol>' +
    '<symbol id="f7v-i4" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><rect x="10" y="21" width="28" height="19" rx="1"/><rect x="8" y="15" width="32" height="6" rx="1"/><path d="M24 15V40"/><path d="M24 15C21 8 14.5 9 16.5 13 17.6 15 21 15 24 15 27 15 30.4 15 31.5 13 33.5 9 27 8 24 15Z"/></g></symbol>' +
    '<symbol id="f7v-i5" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"><circle cx="24" cy="26" r="15"/><path d="M24 26V16M24 26V13.5" stroke-width="2.6"/><path d="M24 11V7M21 6H27M37 26H35M13 26H11M24 39V37"/></g></symbol>' +
    '<symbol id="f7v-i6" viewBox="0 0 48 48"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" d="M24 6 28.7 18.2 41.7 18.6 31.4 26.6 35.1 39.1 24 31.8 12.9 39.1 16.6 26.6 6.3 18.6 19.3 18.2Z"/></symbol>' +
    '<symbol id="f7v-i7" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' + ARM +
      [60, 120, 180, 240, 300].map(function (d) { return '<g transform="rotate(' + d + ' 24 24)">' + ARM + '</g>'; }).join('') + '</g></symbol>';

  // Flow-арт: когда есть <assetBase>art/sym-<id>.jpg, клавиши и барабаны переходят на фото (плитки истории остаются SVG — там важен цвет)
  function ic(i, photo) {
    if (photo && S.art) return '<img class="f7v-ph" src="' + esc(BASE) + 'art/sym-' + IDS[i] + '.jpg" alt="">';
    return '<svg class="f7v-svg" viewBox="0 0 48 48" aria-hidden="true"><use href="#f7v-i' + i + '"/></svg>';
  }

  var DIAL = '<svg viewBox="0 0 200 200" aria-hidden="true"><defs>' +
    '<radialGradient id="f7v-dg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#2c3a35"/><stop offset="1" stop-color="#0b1310"/></radialGradient>' +
    '<linearGradient id="f7v-gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9C78F"/><stop offset=".5" stop-color="#D39045"/><stop offset="1" stop-color="#8C5D27"/></linearGradient></defs>' +
    '<circle cx="100" cy="100" r="92" fill="url(#f7v-dg)" stroke="url(#f7v-gg)" stroke-width="2"/>' +
    '<circle cx="100" cy="100" r="78" fill="none" stroke="rgba(211,144,69,.35)" stroke-width="1" stroke-dasharray="2 7"/>' +
    '<g stroke="url(#f7v-gg)" stroke-width="9" stroke-linecap="round"><path d="M100 100V22M100 100 167.5 61M100 100 167.5 139M100 100V178M100 100 32.5 139M100 100 32.5 61"/></g>' +
    '<circle cx="100" cy="100" r="30" fill="url(#f7v-dg)" stroke="url(#f7v-gg)" stroke-width="3"/>' +
    '<use href="#f7v-s7" x="86" y="85" width="28" height="31" style="fill:#D71434"/></svg>';

  var TEMPLATE =
    '<div class="f7v-tabs" role="tablist" aria-label="Seven locks"></div>' +
    '<div class="f7v-grid">' +
      '<div class="f7v-side">' +
        '<div class="f7v-safe">' +
          '<div class="f7v-in"></div>' +
          '<div class="f7v-door"><div class="f7v-ribbon"></div><div class="f7v-sevens"></div><div class="f7v-dial">' + DIAL + '</div>' +
            '<div class="f7v-cd"><span class="k">Vault opens in</span><span class="v" role="timer"></span></div></div>' +
          '<img class="f7v-host" alt="" width="560" height="1259">' +
        '</div>' +
        '<div class="f7v-score"><div><b data-f="locks"></b><span>locks cracked</span></div><div><b data-f="count"></b><span>your count · fewer wins</span></div><div class="f7v-tier"></div></div>' +
      '</div>' +
      '<div class="f7v-main">' +
        '<div class="f7v-card" aria-live="polite" hidden></div>' +
        '<div class="f7v-lp">' +
          '<div class="f7v-top"><div><div class="f7v-label" data-f="lab"></div><h3 data-f="name"></h3><div class="f7v-sub" data-f="sub"></div></div>' +
            '<div class="f7v-tries"><b data-f="try"></b><button class="f7v-help" type="button" data-act="help">How to play</button></div></div>' +
          '<div class="f7v-keys" role="group" aria-label="Symbols of this lock"></div>' +
          '<div class="f7v-rep" hidden>Symbols may repeat in this code</div>' +
          '<p class="f7v-note">Each symbol shows the best you know: green · in place, gold · elsewhere, gray · not in the code.</p>' +
          '<div class="f7v-drums"></div>' +
          '<div class="f7v-acts"><button class="f7v-btn ghost" type="button" data-act="erase">Erase</button><button class="f7v-btn grow" type="button" data-act="turn">Turn the handle</button></div>' +
          '<p class="f7v-msg" aria-live="polite"></p>' +
          '<div class="f7v-butler" hidden><div class="f7v-bph" role="img" aria-label="The butler"></div><div>' +
            '<p>Ring for the butler? He will reveal one symbol in its place. <b>+2 to this lock.</b></p>' +
            '<button class="f7v-btn" type="button" data-act="butler">Ring · +2</button></div></div>' +
          '<div class="f7v-hist"></div>' +
          '<div class="f7v-tut" role="dialog" aria-modal="true" aria-label="How to crack a lock" tabindex="-1" hidden></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // ---------- состояние ----------
  function now() { return WH.now ? WH.now() : Date.now(); }
  function root() { return document.getElementById('vault'); }
  function q(sel) { var el = root(); return el && el.querySelector(sel); }
  function lockOf(i) { return S.view && S.view.locks[i]; }
  function openAt(i) { return S.view && now() >= S.view.opens[i]; }
  function openCount() { var n = 0; if (S.view) S.view.opens.forEach(function (t) { if (now() >= t) n++; }); return n; }
  function revealAt() {
    var v = S.view || {}, p = (S.c && S.c.params) || {};
    return v.reveal || p.reveal || (v.close + REVEAL_AFTER_CLOSE);
  }
  // running — замки ещё можно ломать; closed — 23:30…полночь; revealed — сейф открыт
  function phase() { var t = now(); return t < S.view.close ? 'running' : t < revealAt() ? 'closed' : 'revealed'; }
  function attemptActive() { return Boolean(S.c && S.c.open && S.a && S.a.status === 'active'); }
  function canPlay(i) {
    var L = lockOf(i);
    return Boolean(L && !S.busy && attemptActive() && phase() === 'running' && openAt(i) && L.status === 'open');
  }
  function symIdx(L, k) { var j = IDS.indexOf(L.symbols[k]); return j < 0 ? k : j; }
  function nameOf(L, k) { return NAMES[symIdx(L, k)]; }
  function lit() { return S.view.locks.filter(function (L) { return L.status === 'solved'; }).length; }
  function count() {
    var t = S.view.total;
    if (t && typeof t.score === 'number') return t.score;
    return S.view.locks.reduce(function (s, L) { return s + (L.score || 0); }, 0);
  }
  function allDone() { return S.view.locks.every(function (L) { return L.status !== 'open'; }); }
  // лучшее, что известно о символе: 2 — на месте, 1 — есть, но не там, 0 — нет в коде
  function knowledge(L) {
    var k = {};
    L.guesses.forEach(function (h) { h.guess.forEach(function (s, i) { var v = h.fb[i]; if (k[s] === undefined || v > k[s]) k[s] = v; }); });
    if (L.butler) k[L.butler.sym] = 2;
    return k;
  }
  function progress(v) { return v.locks.reduce(function (s, L) { return s + L.guesses.length + (L.butler ? 1 : 0); }, 0); }
  function timeEt(ms) { return WH.timeEt ? WH.timeEt(ms) : new Date(ms).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }); }
  function tries(n) { return n === 1 ? '1 try' : n + ' tries'; }
  function money(x) { return '$' + Number(x).toFixed(2); }
  function offerText(o) { return o ? o.name + ' · ' + money(o.price) + (o.was ? ' instead of ' + money(o.was) : '') + ' · +' + o.extra + '%' : ''; }

  // ---------- сборка панели ----------
  function mount() {
    if (S.built) return;
    S.built = true;
    if (!document.getElementById('f7v-sprite')) {
      var sp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sp.setAttribute('id', 'f7v-sprite'); sp.setAttribute('aria-hidden', 'true'); sp.setAttribute('width', '0'); sp.setAttribute('height', '0');
      sp.style.position = 'absolute';
      sp.innerHTML = SPRITE;
      document.body.insertBefore(sp, document.body.firstChild);
    }
    var el = root();
    if (!el) {
      el = document.createElement('div');
      el.id = 'vault'; el.hidden = true;
      var dock = $('#dock'), fl = $('#flash');
      if (dock) dock.insertBefore(el, fl && fl.parentNode === dock ? fl : null);
      else document.body.appendChild(el);
    }
    el.className = 'f7v';
    el.setAttribute('aria-label', 'Crack the 777 Vault');
    el.style.setProperty('--f7v-vault', 'url("' + BASE + 'vault.png")');
    el.style.setProperty('--f7v-butler', 'url("' + BASE + 'butler.png")');
    el.style.setProperty('--f7v-safe-art', 'url("' + BASE + 'art/safe-winter.jpg")');
    el.innerHTML = TEMPLATE;
    el.querySelector('.f7v-host').src = BASE + 'android.png';
    el.addEventListener('click', onClick);
    var probe = new Image(); probe.onload = function () { S.art = true; render(true); }; probe.src = BASE + 'art/sym-seven.jpg';
    var probeSafe = new Image(); probeSafe.onload = function () { el.querySelector('.f7v-safe').classList.add('art'); }; probeSafe.src = BASE + 'art/safe-winter.jpg';
    setInterval(tick, 1000);
  }

  function setGate(show) { // итог/«следующий конкурс» хаба не нужен, пока на экране сейф
    var g = $('#gate');
    if (g) g.hidden = !show;
    S.gateHidden = !show;
  }

  // ---------- выбор замка и ввод ----------
  function pickLock() {
    // первый открытый и ещё не взломанный замок (плейтест AG 18.11: открывался VII вместо I); все решены — последний открытый
    var n = openCount(), i;
    for (i = 0; i < n; i++) if (S.view.locks[i].status === 'open') return i;
    return Math.max(0, n - 1);
  }
  function resetInput() {
    var L = lockOf(S.cur);
    S.input = [null, null, null, null];
    if (L && L.butler) S.input[L.butler.pos] = L.butler.sym;
    S.cursor = nextFree(-1);
  }
  function isFixed(p) { var L = lockOf(S.cur); return Boolean(L && L.butler && L.butler.pos === p); }
  function nextFree(from) {
    for (var k = 1; k <= LEN; k++) { var p = (from + k + LEN) % LEN; if (S.input[p] === null && !isFixed(p)) return p; }
    return -1;
  }
  function say(t) { var m = q('.f7v-msg'); if (m) m.textContent = t; }

  function selectLock(i) {
    S.cur = i; resetInput(); render(true);
    var L = lockOf(i), n = ROMAN[i];
    if (L.status === 'solved') say('Lock ' + n + ' is open. Seven ' + n + ' is lit.');
    else if (L.status === 'jammed') say('Lock ' + n + ' has jammed. Its seven stays dark.');
    else if (phase() !== 'running') say('The locks are closed. Your vault opens at midnight.');
    else if (L.guesses.length) say('Try ' + (L.guesses.length + 1) + ' of ' + L.tries + '.');
    else say('Lock ' + n + ' · ' + L.name + '. Pick four symbols.' + (L.repeats ? ' A symbol may appear more than once in this code.' : ''));
  }

  function put(sym) {
    var L = lockOf(S.cur);
    if (!canPlay(S.cur)) return;
    if (!L.repeats) {
      if (L.butler && L.butler.sym === sym) { say('The butler has already placed the ' + nameOf(L, sym).toLowerCase() + '.'); return; }
      var at = S.input.indexOf(sym);
      if (at >= 0 && !isFixed(at)) S.input[at] = null; // замок без повторов: символ переезжает, а не дублируется
    }
    var p = S.cursor;
    if (p < 0 || S.input[p] !== null || isFixed(p)) p = nextFree(-1);
    if (p < 0) { say('All four dials are set. Tap a dial to change it.'); return; }
    S.input[p] = sym; S.cursor = nextFree(p);
    render(true);
  }
  function erase() {
    if (!canPlay(S.cur)) return;
    for (var p = LEN - 1; p >= 0; p--) if (S.input[p] !== null && !isFixed(p)) { S.input[p] = null; S.cursor = p; break; }
    render(true);
  }
  function moveCursor(d) {
    for (var k = 1; k <= LEN; k++) { var p = (S.cursor + d * k + LEN * 4) % LEN; if (!isFixed(p)) { S.cursor = p; break; } }
    render(true);
  }

  // ---------- ходы ----------
  var ERR = {
    too_fast: 'One moment. The dials are still turning.',
    slow_down: 'One moment. The dials are still turning.',
    repeat_symbol: 'Each symbol appears only once in this code.',
    bad_guess: 'Set all four dials first.',
    closed: 'The locks are closed. Your vault opens at midnight.',
    finished: 'This lock is already finished.',
    butler_unavailable: 'The butler is not available for this lock.',
    bad_lock: 'Something went wrong. Try again.',
  };
  function onError(r, i) {
    var e = r.error;
    if (e === 'lock_not_open') { say('Lock ' + ROMAN[i] + ' opens at ' + timeEt(S.view.opens[i]) + ' ET.'); return; }
    if (ERR[e]) {
      say(ERR[e]);
      if (e === 'closed' || e === 'finished' || e === 'bad_lock') WH.load();
      return;
    }
    WH.handleError(r); // вход, аппрув, чужой бренд и прочее — как во всех играх хаба
  }
  function apply(r) {
    if (!r.attempt) return false;
    WH.st.attempt = r.attempt; S.a = r.attempt; S.view = r.attempt.view;
    return true;
  }
  function send(input, done) {
    var i = S.cur;
    S.busy = true; render(true);
    WH.move(input).then(function (r) {
      S.busy = false;
      var got = apply(r);
      if (r.error) { render(true); onError(r, i); return; }
      if (!got) { render(true); WH.lost(); return; }
      done(lockOf(i), i);
      if (r.attempt.status !== 'active') WH.load(); // все 7 замков закончены — хаб подтянет итог, панель остаётся
    }).catch(function () { S.busy = false; render(true); WH.lost(); });
  }
  function turn() {
    if (!canPlay(S.cur)) return;
    var g = S.input.slice();
    if (g.some(function (x) { return x === null; })) { say(ERR.bad_guess); return; }
    send({ lock: S.cur, guess: g }, function (L, i) {
      S.spin += 60;
      var n = ROMAN[i], last = L.guesses[L.guesses.length - 1], fb = last ? last.fb : [];
      resetInput();
      if (L.status === 'solved') { S.justLit = i; render(true); say('Click. Lock ' + n + ' is open. Seven ' + n + ' is lit.'); return; }
      render(true);
      var drums = q('.f7v-drums');
      if (drums) Array.prototype.forEach.call(drums.children, function (x) { x.classList.add('spin'); });
      if (L.status === 'jammed') { say('Lock ' + n + ' has jammed. Its seven stays dark.'); return; }
      var gr = fb.filter(function (x) { return x === 2; }).length, ye = fb.filter(function (x) { return x === 1; }).length;
      say(gr + ' in place · ' + ye + ' elsewhere. ' + tries(L.tries - L.guesses.length) + ' left.');
    });
  }
  function ringButler() {
    var L = lockOf(S.cur);
    if (!canPlay(S.cur) || !L.butlerAvailable) return;
    send({ lock: S.cur, butler: true }, function (L2) {
      if (!L2.butler) { render(true); return; }
      var b = L2.butler;
      if (!L2.repeats) { var at = S.input.indexOf(b.sym); if (at >= 0) S.input[at] = null; }
      S.input[b.pos] = b.sym; S.cursor = nextFree(-1);
      render(true);
      say('The butler leans in: dial ' + (b.pos + 1) + ' is the ' + nameOf(L2, b.sym).toLowerCase() + '.');
    });
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-lock],[data-sym],[data-pos]');
    if (!t || t.disabled) return;
    if (t.hasAttribute('data-lock')) {
      var i = Number(t.getAttribute('data-lock'));
      if (!openAt(i)) { say('Lock ' + ROMAN[i] + ' opens at ' + timeEt(S.view.opens[i]) + ' ET.'); return; }
      selectLock(i); return;
    }
    if (t.hasAttribute('data-sym')) { put(Number(t.getAttribute('data-sym'))); return; }
    if (t.hasAttribute('data-pos')) {
      var p = Number(t.getAttribute('data-pos'));
      if (!canPlay(S.cur) || isFixed(p)) return;
      S.input[p] = null; S.cursor = p; render(true); return;
    }
    var act = t.getAttribute('data-act');
    if (act === 'erase') erase();
    else if (act === 'turn') turn();
    else if (act === 'butler') ringButler();
    else if (act === 'help') showTut(0);
    else if (act === 'tut-next') { if (S.tut >= TUT.length - 1) hideTut(); else showTut(S.tut + 1); }
    else if (act === 'tut-back') showTut(S.tut - 1);
    else if (act === 'tut-skip') hideTut();
    else if (act === 'claim') claim(e);
  }

  // ---------- отрисовка ----------
  function render(force) {
    var el = root();
    if (!S.view || !el || el.hidden) return;
    if (S.cur < 0 || S.cur >= S.view.locks.length || !openAt(S.cur)) { S.cur = pickLock(); resetInput(); }
    var ph = phase(), sig = JSON.stringify([S.view, S.cur, S.input, S.cursor, S.busy, ph, openCount(), S.art, attemptActive()]);
    if (!force && sig === S.sig) return;
    S.sig = sig; S.phase = ph; S.openN = openCount();
    renderTabs(); renderSafe(ph); renderPanel(ph); renderCard(ph); renderLog();
    if (ph === 'running' && attemptActive() && S.tut < 0 && !tutSeen()) showTut(0);
  }

  function renderTabs() {
    var html = '';
    S.view.locks.forEach(function (L, i) {
      var open = openAt(i), s;
      if (!open) s = timeEt(S.view.opens[i]).replace(':00', '');
      else if (L.status === 'solved') s = '✓ ' + L.score;
      else if (L.status === 'jammed') s = 'Jammed';
      else if (phase() !== 'running') s = 'Closed';
      else s = L.guesses.length ? 'Try ' + (L.guesses.length + 1) : 'Open';
      var cls = 'f7v-tab' + (open ? (L.status === 'open' ? ' open' : ' ' + L.status) : ' locked') + (i === S.cur ? ' cur' : '');
      html += '<button type="button" role="tab" class="' + cls + '" data-lock="' + i + '" aria-selected="' + (i === S.cur) + '" aria-label="Lock ' + ROMAN[i] + ', ' + esc(L.name) + ', ' + esc(s) + '">' +
        '<span class="rn">' + ROMAN[i] + '</span><span class="nm">' + esc(L.name) + '</span><span class="st">' + esc(s) + '</span></button>';
    });
    q('.f7v-tabs').innerHTML = html;
  }

  function renderSafe(ph) {
    var html = '';
    S.view.locks.forEach(function (L, i) {
      var on = L.status === 'solved';
      html += '<div class="f7v-sv' + (on ? ' on' : '') + (i === S.justLit ? ' pop' : '') + '"><span><svg viewBox="22 -2 75 83" aria-hidden="true"><use href="#f7v-s7"/></svg></span><b>' + ROMAN[i] + '</b></div>';
    });
    S.justLit = -1;
    var n = lit(), sv = q('.f7v-sevens');
    sv.innerHTML = html;
    sv.setAttribute('aria-label', n + ' of 7 sevens lit');
    var inn = q('.f7v-in').style;
    inn.setProperty('--inb', (0.3 + n * 0.1).toFixed(2)); inn.setProperty('--ins', (0.5 + n * 0.07).toFixed(2));
    q('.f7v-safe').classList.toggle('midnight', ph === 'revealed');
    q('.f7v-dial').style.transform = 'rotate(' + S.spin + 'deg)';
    q('[data-f="locks"]').textContent = n + ' of 7';
    q('[data-f="count"]').textContent = count();
    q('.f7v-tier').innerHTML = n ? 'In your vault so far: <em>' + REST.discount + '% off your private offer</em>' : 'No sevens lit yet.';
    countdown();
  }
  function countdown() {
    if (!S.view) return;
    var left = (revealAt() - now()) / 1000, cd = q('.f7v-cd');
    if (!cd) return;
    cd.querySelector('.k').textContent = left > 0 ? 'Vault opens in' : 'Your vault';
    var v = left > 0 ? WH.clockText(left) : 'is open';
    var el = cd.querySelector('.v'); if (el.textContent !== v) el.textContent = v;
    var big = q('.f7v-big'); if (big && big.textContent !== v) big.textContent = left > 0 ? v : '';
  }

  function renderPanel(ph) {
    var i = S.cur, L = lockOf(i), k = knowledge(L), play = canPlay(i), used = L.guesses.length, n = L.symbols.length;
    q('[data-f="lab"]').textContent = 'Lock ' + ROMAN[i];
    q('[data-f="name"]').textContent = L.name;
    q('[data-f="sub"]').textContent = 'From ' + timeEt(S.view.opens[i]) + ' ET · ' + n + ' symbols · ' + (L.repeats ? 'may repeat' : 'each once');
    q('[data-f="try"]').textContent = L.status === 'open' ? 'Try ' + Math.min(used + 1, L.tries) + ' of ' + L.tries
      : L.status === 'solved' ? 'Open in ' + tries(used) + (L.butler ? ' + 2' : '') : 'Jammed';
    var html = '';
    for (var s = 0; s < n; s++) {
      var st = k[s] === 2 ? ' g' : k[s] === 1 ? ' y' : k[s] === 0 ? ' x' : '';
      var inUse = !L.repeats && S.input.indexOf(s) >= 0;
      var what = k[s] === 2 ? ', in place' : k[s] === 1 ? ', in the code elsewhere' : k[s] === 0 ? ', not in the code' : '';
      html += '<button type="button" class="f7v-key' + st + (inUse ? ' used' : '') + '" data-sym="' + s + '"' + (play ? '' : ' disabled') +
        ' aria-label="' + nameOf(L, s) + what + (s < 9 ? ' (key ' + (s + 1) + ')' : '') + '"><span class="ic">' + ic(symIdx(L, s), true) + '</span><small>' + nameOf(L, s) + '</small></button>';
    }
    q('.f7v-keys').innerHTML = html;
    q('.f7v-rep').hidden = !(L.repeats && L.status === 'open' && ph === 'running');
    // барабаны: у законченного замка — его код (сервер отдаёт secret только законченному замку)
    var show = L.status !== 'open' && L.secret ? L.secret : S.input, dh = '';
    for (var p = 0; p < LEN; p++) {
      var fixed = isFixed(p), v = show[p];
      var cls = 'f7v-drum' + (fixed ? ' fixed' : '') + (p === S.cursor && play && !fixed ? ' cur' : '') + (L.status !== 'open' ? ' done ' + L.status : '');
      dh += '<button type="button" class="' + cls + '" data-pos="' + p + '"' + (play ? '' : ' disabled') +
        ' aria-label="Dial ' + (p + 1) + ': ' + (v === null || v === undefined ? 'empty' : nameOf(L, v)) + (fixed ? ', set by the butler' : '') + '">' +
        '<span class="pos">' + (p + 1) + (fixed ? ' · butler' : '') + '</span>' + (v === null || v === undefined ? '' : '<span class="ic">' + ic(symIdx(L, v), true) + '</span>') + '</button>';
    }
    q('.f7v-drums').innerHTML = dh;
    var full = S.input.every(function (x) { return x !== null; });
    q('[data-act="turn"]').disabled = !play || !full;
    q('[data-act="erase"]').disabled = !play;
    q('.f7v-acts').hidden = L.status !== 'open' || ph !== 'running';
    // история, свежая сверху (на телефоне последние попытки сразу под барабанами)
    var hh = '';
    for (var j = used - 1; j >= 0; j--) {
      var g = L.guesses[j], gr = 0, ye = 0, row = '';
      g.guess.forEach(function (sym, x) {
        var f = g.fb[x], c = f === 2 ? 'g' : f === 1 ? 'y' : 'x';
        if (f === 2) gr++; else if (f === 1) ye++;
        row += '<span class="t ' + c + '" title="' + nameOf(L, sym) + '">' + ic(symIdx(L, sym)) + '</span>';
      });
      hh += '<div class="f7v-hrow" aria-label="Try ' + (j + 1) + ': ' + gr + ' in place, ' + ye + ' elsewhere"><span class="no">#' + (j + 1) + '</span>' + row +
        '<span class="sum">' + gr + ' in place · ' + ye + ' elsewhere</span></div>';
    }
    q('.f7v-hist').innerHTML = hh;
    q('.f7v-butler').hidden = !(play && L.butlerAvailable);
    var lp = q('.f7v-lp');
    lp.classList.toggle('busy', S.busy);
  }

  function prize() {
    var v = S.view, n = lit();
    if (v.prize) return v.prize; // сервер: vault-event.prizeFor(...) после вскрытия
    var o = OFFERS.filter(function (t) { return n >= t.min && n <= t.max; })[0];
    var ro = o ? { name: o.offer.name, price: o.offer.sale, was: o.offer.price, discount: REST.discount, extra: o.offer.extra, hours: o.offer.hours } : null;
    return n ? { kind: 'rest', discount: REST.discount, offer: ro, cracked: n } : { kind: 'none', cracked: 0 };
  }
  function renderCard(ph) {
    var card = q('.f7v-card'), n = lit(), html = '';
    if (ph === 'revealed') {
      var pz = prize();
      html = revealMedia() + '<div class="f7v-label">Midnight · Christmas is over</div><h4>Your vault is open.</h4><p class="lead">' + n + ' of 7 sevens are lit.</p>';
      if (pz.kind === 'top') {
        html += '<p>You are among the three steadiest hands of Christmas night. Your prize: <b>' + esc((pz.bonus && pz.bonus.sc) || '') + ' SC</b>.</p>';
      } else if (pz.kind === 'rest') {
        html += '<p>Your gift: <b>' + (pz.discount || REST.discount) + '% off your private offer</b>. The code is in your messages, no claim needed.</p>';
      }
      if (pz.kind !== 'none') {
        html += '<div class="f7v-row"><span>Your count</span><b>' + count() + '</b></div>';
        if (pz.offer) html += '<p class="offer">A private offer for your vault: <b>' + esc(offerText(pz.offer)) + '</b>. Valid for 48 hours. Buying it never changes your count.</p>';
        html += '<div class="f7v-acts">' + (pz.kind === 'top' ? claimButton() : '') + offerButton(pz.offer) + '</div>';
        if (pz.kind === 'rest') html += '<p class="fine">The top three will be announced after the house checks the count, later today.</p>';
      } else {
        html += '<p>No sevens were lit this time. Thank you for spending Christmas with us.</p>';
      }
    } else if (ph === 'closed' || allDone()) {
      html = '<div class="f7v-label">' + (ph === 'closed' ? 'The locks are closed' : 'All seven locks are done') + '</div>' +
        '<h4>Your vault opens at midnight.</h4><div class="f7v-big" role="timer"></div>' +
        '<p>' + n + ' of 7 sevens lit · your count is ' + count() + '. ' + (ph === 'closed' ? 'Your count is final.' : 'Fewer tries wins.') + '</p>';
    }
    card.innerHTML = html;
    card.hidden = !html;
    root().classList.toggle('f7v-after', ph !== 'running');
    countdown();
  }
  // клип «андроид открывает сейф» (F7V_CONFIG.revealVideo, напр. BASE+'art/clip-16x9.mp4') с постером android-midnight.jpg;
  // без клипа — только стоп-кадр; если картинки нет, onerror прячет блок
  function revealMedia() {
    var poster = BASE + 'art/android-midnight.jpg';
    if (CFG.revealVideo) {
      return '<div class="f7v-media"><video src="' + esc(CFG.revealVideo) + '" poster="' + esc(poster) +
        '" autoplay muted playsinline controls preload="metadata"></video></div>';
    }
    return '<div class="f7v-media"><img src="' + esc(poster) + '" alt="The golden android opens your vault" onerror="this.parentNode.remove()"></div>';
  }
  function claimButton() {
    if (typeof CFG.onClaim === 'function') return '<button class="f7v-btn grow" type="button" data-act="claim">Claim prize</button>';
    var url = CFG.claimUrl || (WH.st && WH.st.brand && WH.st.brand.discord);
    return url ? '<a class="f7v-btn grow" href="' + esc(url) + '" target="_blank" rel="noopener">Claim prize</a>' : '';
  }
  function offerButton(o) {
    if (!o || !CFG.offerUrl) return '';
    var url = typeof CFG.offerUrl === 'function' ? CFG.offerUrl(o) : CFG.offerUrl;
    return url ? '<a class="f7v-btn ghost" href="' + esc(url) + '" target="_blank" rel="noopener">See the offer</a>' : '';
  }
  function claim() { // ХУК: вызывается, если задан F7V_CONFIG.onClaim
    CFG.onClaim({ prize: prize(), view: S.view, brand: WH.st && WH.st.brand });
  }

  // журнал слева внизу в хабе: по строке на открытый замок
  function renderLog() {
    if (!$('#log') || !WH.logRows) return;
    var rows = [];
    S.view.locks.forEach(function (L, i) {
      if (!openAt(i)) return;
      var v = L.status === 'solved' ? '✓ ' + tries(L.guesses.length) + (L.butler ? ' + 2' : '')
        : L.status === 'jammed' ? 'jammed' : L.guesses.length ? 'try ' + (L.guesses.length + 1) + ' of ' + L.tries : 'not started';
      rows.push(['<b>' + ROMAN[i] + '</b> ' + esc(L.name), esc(v)]);
    });
    if (rows.length) WH.logRows(rows); else WH.logEmpty('Your locks show up here.');
  }

  // раз в секунду: отсчёт, открытие нового замка, 23:30 и полночь
  function tick() {
    var el = root();
    if (!S.view || !el || el.hidden) return;
    countdown();
    var ph = phase(), n = openCount();
    if (n !== S.openN && ph === 'running') {
      var L = lockOf(S.cur), fresh = n - 1;
      if (n > S.openN && S.openN > 0 && (!L || L.status !== 'open') && S.view.locks[fresh].status === 'open') {
        S.cur = fresh; resetInput(); render(true);
        say('Lock ' + ROMAN[fresh] + ' · ' + S.view.locks[fresh].name + ' is open. Pick four symbols.');
      } else render(true);
    }
    if (ph !== S.phase) {
      render(true);
      if (ph === 'closed') say('The locks are closed. Your vault opens at midnight.');
      if (ph === 'revealed' && !S.revealLoad) { S.revealLoad = true; setTimeout(WH.load, 1500 + Math.random() * 2500); } // приз приходит с сервера
    }
  }

  // ---------- обучение при первом входе (TEXTS.md §14) ----------
  function tile(sym, c) { return '<span class="t ' + c + '">' + ic(sym) + '</span>'; }
  var TUT = [
    function () {
      return '<div class="step">Step 1 of 3</div><h4>Every lock hides a code of four symbols</h4>' +
        '<div class="demo-keys"><span>' + ic(0) + '</span><span>' + ic(3) + '</span><span>' + ic(6) + '</span><span>' + ic(4) + '</span></div>' +
        '<p>Tap the symbols above and they fill the dials in order. Tap a dial to change it.</p>' +
        '<p>When all four are set, <b>turn the handle</b>. No rush between tries, and speed does not count.</p>';
    },
    function () {
      return '<div class="step">Step 2 of 3</div><h4>The dials will tell you</h4>' +
        '<div class="f7v-hrow"><span class="no">#1</span>' + tile(0, 'g') + tile(3, 'y') + tile(6, 'x') + tile(4, 'x') + '<span class="sum">1 in place · 1 elsewhere</span></div>' +
        '<div class="leg">' +
          '<div><span class="sw g"></span><span><b>Green</b> — right symbol, right place. Keep it.</span></div>' +
          '<div><span class="sw y"></span><span><b>Gold</b> — the symbol is in the code, but somewhere else. Move it.</span></div>' +
          '<div><span class="sw x"></span><span><b>Gray</b> — this symbol is not in the code. Leave it out.</span></div>' +
        '</div><p>The symbols above change colour too, so you always see what you already know.</p>';
    },
    function () {
      return '<div class="step">Step 3 of 3</div><h4>Every lock is harder than the last</h4>' +
        '<p>More symbols and fewer tries: <b>eight</b> on the first lock, <b>five</b> on the last. From <b>Lock IV</b>, a symbol may appear more than once.</p>' +
        '<p>When <b>three tries</b> are left, you may ring for the butler. He reveals one symbol in its place, and adds <b>2</b> to your count.</p>' +
        '<p>Your count is the sum of your tries. More locks and fewer tries put you higher.</p>';
    },
  ];
  function tutSeen() { try { return localStorage.getItem('f7v-tut') === '1'; } catch (e) { return true; } }
  function tutMark() { try { localStorage.setItem('f7v-tut', '1'); } catch (e) { /* приватный режим */ } }
  function showTut(i) {
    var el = q('.f7v-tut'), last = i === TUT.length - 1, dots = '';
    if (!el) return;
    S.tut = i;
    for (var k = 0; k < TUT.length; k++) dots += '<i' + (k === i ? ' class="on"' : '') + '></i>';
    el.innerHTML = TUT[i]() + '<div class="foot"><div class="dots" aria-hidden="true">' + dots + '</div><div class="btns">' +
      (i > 0 ? '<button class="f7v-btn ghost" type="button" data-act="tut-back">Back</button>' : '<button class="f7v-btn ghost" type="button" data-act="tut-skip">Skip</button>') +
      '<button class="f7v-btn" type="button" data-act="tut-next">' + (last ? 'Got it, to the lock' : 'Next') + '</button></div></div>';
    el.hidden = false;
    var nx = el.querySelector('[data-act="tut-next"]'); if (nx) nx.focus({ preventScroll: true });
  }
  // обучение по кнопке (в т.ч. до Start, когда панели сейфа ещё нет): панель показывается только с окном обучения
  function tutorial() {
    mount();
    var r = root(); if (!r) return;
    if (r.hidden) { r.hidden = false; r.classList.add('f7v-tutonly'); }
    showTut(0);
  }
  function hideTut() {
    var el = q('.f7v-tut'); if (el) el.hidden = true;
    var r = root();
    if (r && r.classList.contains('f7v-tutonly')) { r.classList.remove('f7v-tutonly'); if (!S.view) r.hidden = true; }
    S.tut = -1; tutMark();
    var h = q('[data-act="help"]'); if (h) h.focus({ preventScroll: true });
  }

  // ---------- контракт WH ----------
  function sync(c, a) {
    mount();
    var v = a && a.view, el = root();
    S.c = c; S.a = a;
    if (!v || !v.locks) { if (S.tut < 0) el.hidden = true; if (S.gateHidden) setGate(true); return; }
    if (S.key !== c.id) { S.key = c.id; S.view = null; S.cur = -1; S.sig = ''; S.revealLoad = false; }
    // ответ опроса мог уйти до хода и прийти после — более старый вид не берём
    if (!S.busy && (!S.view || progress(v) >= progress(S.view))) S.view = v;
    // хаб прячет панель, когда попытка закончена или конкурс закрыт; сейф с отсчётом и призом показываем сами
    el.hidden = false;
    setGate(a.status === 'active' && c.open);
    render(false);
  }

  var GAME = {
    id: 'vault',
    mechanics: ['vault777'],
    panel: '#vault',
    logTitle: 'Your vault',
    rules: function () {
      return 'Seven locks open on Christmas Day, one every hour from 12 PM ET, and all stay open until 11:30 PM ET. ' +
        'Each lock hides a code of four symbols. After every try each dial lights up: green, right place; gold, in the code but elsewhere; gray, not in the code. ' +
        'Every cracked lock lights a seven on your door. Fewer tries wins. Your vault opens at midnight.';
    },
    puzzle: function () { return false; }, // барабаны 3D-сейфа хаба не нужны: свои на панели
    off: function () { if (S.gateHidden) setGate(true); },
    sync: sync,
    key: function (e) {
      var el = root();
      if (!el || el.hidden || !S.view) return false;
      if (e.target.closest && e.target.closest('input,textarea,select,a')) return false;
      if (S.tut >= 0) { if (e.key === 'Escape') { hideTut(); return true; } return false; }
      if (!canPlay(S.cur)) return false;
      var n = lockOf(S.cur).symbols.length;
      if (/^[1-8]$/.test(e.key) && Number(e.key) <= n) put(Number(e.key) - 1);
      else if (e.key === 'Backspace') { e.preventDefault(); erase(); }
      else if (e.key === 'Enter' && !e.target.closest('button')) turn();
      else if (e.key === 'ArrowLeft') moveCursor(-1);
      else if (e.key === 'ArrowRight') moveCursor(1);
      else return false;
      return true;
    },
    doneText: function (r) {
      return 'Your vault: ' + (r.cracked || 0) + ' of 7 sevens lit · count ' + (r.score || 0) + '. It opens at midnight.';
    },
    result: function (r) {
      return {
        title: r.cracked ? 'Your vault is set' : 'Your sevens are dark',
        stats: [[(r.cracked || 0) + ' / 7', 'Sevens lit'], [r.score || 0, 'Your count']],
        good: Boolean(r.cracked),
        note: 'Your vault opens at midnight.',
        reveal: '',
      };
    },
  };

  mount(); // панель нужна хабу сразу: renderDock() прячет/показывает её по id
  WH.register(GAME);
  window.F7V = { state: S, render: render, tutorial: tutorial }; // для preview.html и отладки
})();
