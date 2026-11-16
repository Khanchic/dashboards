/**
 * Экран одного дома Light Up Christmas. От хаба не зависит: работает от move(input) → Promise<{ attempt } | { error }>.
 *   var game = LightUp.mount(panel, { move, onChange, onDone, assets: { golem: '../../stormrush/assets/golem-battery.png' } });
 *   game.load(attempt);   // attempt = { status, view }
 *   game.destroy();
 * Нужен shared/grid.js (window.LightGrid) — тот же расчёт тока, что на сервере, для мгновенной подсветки.
 * Нажатия крутятся сразу у игрока и уходят на сервер пачкой раз в ~0,3 с; засчитывает дом сервер.
 */
(function () {
  'use strict';
  var G = window.LightGrid;
  var FLUSH_MS = 300, MAX_WAIT_MS = 1500, PEEK_MS = 1500;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function lines(m) {
    var s = '';
    if (m & 1) s += '<line x1="50" y1="50" x2="50" y2="0"/>';
    if (m & 2) s += '<line x1="50" y1="50" x2="100" y2="50"/>';
    if (m & 4) s += '<line x1="50" y1="50" x2="50" y2="100"/>';
    if (m & 8) s += '<line x1="50" y1="50" x2="0" y2="50"/>';
    return s;
  }
  var BAT = '<svg class="lu-ov" viewBox="0 0 100 100" aria-hidden="true"><rect class="lu-bat" x="22" y="30" width="52" height="40" rx="7"/><rect class="lu-bat" x="74" y="42" width="6" height="16" rx="2"/><path class="lu-boltp" d="M53 34 L39 53 L49 53 L44 66 L59 46 L49 46 Z"/></svg>';
  var BULB = '<svg class="lu-ov" viewBox="0 0 100 100" aria-hidden="true"><circle class="lu-bl" cx="50" cy="50" r="17"/></svg>';
  var STAR = '<svg class="lu-ov" viewBox="0 0 100 100" aria-hidden="true"><polygon class="lu-stp" points="50,24 56.5,42 76,42 60,53.5 66,72 50,61 34,72 40,53.5 24,42 43.5,42"/></svg>';

  var MSG = {
    start: 'Tap a piece of wire to turn it. Get the power from Golem\'s battery to every bulb.',
    tree: 'The big one. The star on top is the last bulb.',
    checking: 'All bulbs on! Checking...',
    golem: 'Golem set one piece in place and is holding it there.',
    sparky: 'Sparky ran along the wire to a dark bulb. Remember the path!',
    lit: 'The house is lit. There\'s a gift in the window!',
    treeLit: 'The Christmas tree is lit. Merry Christmas!',
    trainingLit: 'Nice! That\'s how it works. Your street opens on Christmas Eve.',
    closed: 'The event is over. The lights went out.',
    error: 'Connection hiccup. Your turns are saved, try again in a moment.'
  };

  function mount(panel, opts) {
    var root = el('div', 'lu');
    panel.innerHTML = ''; panel.appendChild(root);
    var V = null, cells = [], at = {}, base = [], masks = [], angle = [], els = [], locked = {};
    var pending = [], inflight = null, timer = null, dead = false, done = false, peekTimer = null, firstAt = 0;

    root.innerHTML =
      '<div class="lu-head"><span class="lu-title"></span><span class="lu-meta"></span></div>' +
      '<div class="lu-grid" role="grid"></div>' +
      '<p class="lu-status" aria-live="polite"></p>' +
      '<div class="lu-help">' +
        (opts.assets && opts.assets.golem ? '<img class="lu-golem" src="' + opts.assets.golem + '" alt="">' : '') +
        '<div class="lu-hb"><button type="button" class="lu-act lu-g"></button><button type="button" class="lu-act lu-s"></button>' +
        '<small>Hints are free and don\'t change your prize.</small></div>' +
      '</div>';
    var $ = function (s) { return root.querySelector(s); };
    var grid = $('.lu-grid'), status = $('.lu-status'), bG = $('.lu-g'), bS = $('.lu-s');

    function say(t) { status.textContent = t; }

    function build(view) {
      V = view; cells = view.tiles; at = G.indexOf(cells);
      base = cells.map(function (t) { return t.m; }); masks = base.slice(); angle = cells.map(function () { return 0; });
      locked = {}; cells.forEach(function (t, i) { if (t.lock) locked[i] = true; });
      grid.innerHTML = ''; els = [];
      grid.style.setProperty('--c', view.C);
      grid.style.gridTemplateColumns = 'repeat(' + view.C + ',minmax(0,1fr))';
      for (var r = 0; r < view.R; r++) for (var c = 0; c < view.C; c++) {
        var i = at[r + ',' + c];
        if (i === undefined) { grid.appendChild(el('div', 'lu-void')); continue; }
        var t = cells[i], b = el('button', 'lu-tile' + (t.src ? ' lu-src' : ''));
        b.type = 'button';
        b.setAttribute('aria-label', t.src ? 'Battery' : t.star ? 'Star' : t.bulb ? 'Bulb' : 'Wire');
        b.innerHTML = '<svg class="lu-w" viewBox="0 0 100 100" aria-hidden="true">' + lines(base[i]) + (t.bulb || t.src ? '' : '<circle class="lu-hub" cx="50" cy="50" r="8"/>') + '</svg>' +
          '<svg class="lu-gh" viewBox="0 0 100 100" aria-hidden="true"></svg>' + (t.src ? BAT : t.star ? STAR : t.bulb ? BULB : '');
        (function (i) { b.addEventListener('click', function () { tap(i); }); })(i);
        els[i] = b; grid.appendChild(b);
      }
      $('.lu-title').textContent = view.title;
      paint();
    }

    function setMask(i, m) { // сервер прислал маску — повернуть картинку вперёд до неё (без прокрутки назад)
      for (var k = 0; k < 4; k++) if (G.rot(base[i], angle[i] + k) === m) { angle[i] += k; break; }
      masks[i] = m;
    }

    function paint() {
      var pw = G.power(cells, masks, V.src === undefined ? srcIndex() : V.src, at), lit = 0, bulbs = 0;
      cells.forEach(function (t, i) {
        var e = els[i];
        e.classList.toggle('on', !!pw.on[i]);
        e.classList.toggle('lu-lock', !!locked[i]);
        e.firstChild.style.transform = 'rotate(' + (angle[i] * 90) + 'deg)';
        if (t.bulb) { bulbs++; if (pw.on[i]) lit++; }
      });
      $('.lu-meta').innerHTML = V.size + ' · bulbs lit <b>' + lit + '</b> of ' + bulbs;
      bG.textContent = 'Golem: set a piece · ' + V.golemLeft;
      bS.textContent = 'Sparky: show a path · ' + V.sparkyLeft;
      bG.disabled = done || V.golemLeft < 1; bS.disabled = done || V.sparkyLeft < 1;
      grid.classList.toggle('lu-done', done);
      return pw;
    }
    function srcIndex() { for (var i = 0; i < cells.length; i++) if (cells[i].src) return i; return 0; }

    function tap(i) {
      if (dead || done || locked[i]) return;
      masks[i] = G.rot(masks[i], 1); angle[i] += 1;
      pending.push(i);
      var pw = paint();
      if (!firstAt) firstAt = Date.now();
      if (pw.solved) { say(MSG.checking); flush(); }
      else if (Date.now() - firstAt > MAX_WAIT_MS) flush(); // жмёт без пауз — всё равно сохраняем прогресс
      else { clearTimeout(timer); timer = setTimeout(flush, FLUSH_MS); }
    }

    function apply(view) {
      V = view;
      view.tiles.forEach(function (t, i) { setMask(i, t.m); if (t.lock) locked[i] = true; });
      // нажатия, сделанные пока шёл запрос, накладываем поверх ответа сервера
      pending.forEach(function (i) { if (!locked[i]) { masks[i] = G.rot(masks[i], 1); angle[i] += 1; } });
      if (view.solved) finish(view);
      paint();
    }

    function send(input) {
      var p = Promise.resolve(opts.move(input)).then(function (r) {
        if (dead) return r;
        if (r && r.attempt && r.attempt.view) apply(r.attempt.view);
        else if (r && r.error && r.error !== 'finished') say(MSG.error);
        return r;
      }, function () { if (!dead) say(MSG.error); });
      return p;
    }

    function flush() {
      clearTimeout(timer);
      if (inflight) return inflight.then(flush);
      if (!pending.length) return Promise.resolve();
      var batch = pending; pending = []; firstAt = 0;
      inflight = send({ do: 'turns', t: batch }).then(function (r) {
        inflight = null;
        if (r && r.error && r.error !== 'finished') pending = batch.concat(pending); // повторим
        if (opts.onChange) opts.onChange(V);
        return r;
      });
      return inflight;
    }

    function hint(kind) {
      if (done) return;
      bG.disabled = bS.disabled = true;
      flush().then(function () { return send({ do: kind }); }).then(function (r) {
        if (!r || r.error) { paint(); return; }
        if (kind === 'golem') say(MSG.golem);
        if (kind === 'sparky' && V.peek) {
          say(MSG.sparky);
          V.peek.cells.forEach(function (i, n) { var gh = els[i].querySelector('.lu-gh'); gh.innerHTML = lines(V.peek.masks[n]); els[i].classList.add('lu-peek'); });
          clearTimeout(peekTimer);
          peekTimer = setTimeout(function () { els.forEach(function (e) { if (e) e.classList.remove('lu-peek'); }); }, PEEK_MS);
        }
        if (opts.onChange) opts.onChange(V);
      });
    }
    bG.addEventListener('click', function () { hint('golem'); });
    bS.addEventListener('click', function () { hint('sparky'); });

    function finish(view) {
      if (done) return;
      done = true;
      cells.forEach(function (t, i) { locked[i] = false; }); // замки после победы не рисуем
      say(view.tree ? MSG.treeLit : view.training ? MSG.trainingLit : MSG.lit);
      if (opts.onDone) setTimeout(function () { if (!dead) opts.onDone(view); }, 900);
    }

    return {
      load: function (attempt) {
        var v = attempt.view; done = false;
        build(v);
        if (v.solved) { done = true; say(v.tree ? MSG.treeLit : MSG.lit); paint(); }
        else if (attempt.status === 'expired') { done = true; say(MSG.closed); paint(); }
        else say(v.tree ? MSG.tree : MSG.start);
      },
      flush: flush,
      destroy: function () { dead = true; clearTimeout(timer); clearTimeout(peekTimer); if (pending.length) flush(); panel.innerHTML = ''; }
    };
  }

  window.LightUp = { mount: mount };
})();
