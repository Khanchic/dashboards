/**
 * Экран яруса Infinity Garland. Зависит от shared/garland.js (window.Garland). От хаба не зависит.
 *   var g = GarlandGame.mount(el, { move: fn(input) → Promise<{attempt}|{error,attempt}>, onDone: fn() });
 *   g.load(attempt); g.destroy();
 * Управление: провести пальцем/мышью от лампочки к соседней — гирлянда тянется (повторный проход по связи стирает её);
 * тап по лампочке — стереть её связи. Рисуем у себя сразу, на сервер — пачками раз в 0,3 с (не реже 1,5 с).
 * Решено или нет — решает сервер.
 */
(function () {
  'use strict';
  var G = window.Garland;
  var NS = 'http://www.w3.org/2000/svg';
  var S = 40; // размер клетки в единицах viewBox
  var COLORS = ['#FDC010', '#00B4EB', '#EB1F6A', '#8B3BD1'];

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function mount(root, opts) {
    var v = null, links = {}, locked = {}, bulb = [], R = 0, C = 0;
    var queue = [], inflight = false, firstQueued = 0, timer = null, dead = false, solvedShown = false;
    root.innerHTML =
      '<div class="gg">' +
      '  <div class="gg-head"><b class="gg-title"></b><span class="gg-count"></span></div>' +
      '  <div class="gg-board"><svg class="gg-svg" role="img" aria-label="Garland grid"></svg></div>' +
      '  <p class="gg-msg" aria-live="polite"></p>' +
      '  <div class="gg-ctrl"><button type="button" class="gg-hint"></button><button type="button" class="gg-clear">Clear</button></div>' +
      '  <p class="gg-help">Drag from light to light. One loop through every light, no crossings. Drag over a strand again to remove it, tap a light to clear it.</p>' +
      '</div>';
    var $ = function (s) { return root.querySelector(s); };
    var svg = $('.gg-svg'), gCells, gLinks, gBulbs;

    function deg(x) { var n = 0; for (var k in links) { var p = G.unkey(k); if (p[0] === x || p[1] === x) n++; } return n; }

    function draw() {
      if (!v) return;
      svg.setAttribute('viewBox', '0 0 ' + C * S + ' ' + R * S);
      svg.innerHTML = '';
      gCells = el('g', {}, svg); gLinks = el('g', { class: 'gg-links' }, svg); gBulbs = el('g', {}, svg);
      var chk = G.check({ R: R, C: C, bulb: bulb }, links);
      var solved = v.solved;
      for (var i = 0; i < R * C; i++) {
        if (!bulb[i]) continue;
        var r = Math.floor(i / C), c = i % C;
        el('rect', { x: c * S + 2, y: r * S + 2, width: S - 4, height: S - 4, rx: 9, class: 'gg-cell' }, gCells);
      }
      Object.keys(links).forEach(function (k, n) {
        var p = G.unkey(k), a = p[0], b = p[1];
        el('line', {
          x1: (a % C + 0.5) * S, y1: (Math.floor(a / C) + 0.5) * S, x2: (b % C + 0.5) * S, y2: (Math.floor(b / C) + 0.5) * S,
          class: 'gg-link' + (locked[k] ? ' locked' : '') + (solved ? ' lit' : ''),
          style: solved ? '--d:' + (n * 0.03).toFixed(2) + 's' : ''
        }, gLinks);
      });
      var dg = G.degrees(R * C, links), j = 0;
      for (var x = 0; x < R * C; x++) {
        if (!bulb[x]) continue;
        var on = dg[x] === 2;
        el('circle', {
          cx: (x % C + 0.5) * S, cy: (Math.floor(x / C) + 0.5) * S, r: on ? 7 : 5,
          class: 'gg-bulb' + (on ? ' on' : '') + (solved ? ' lit' : ''),
          style: (on || solved ? 'fill:' + COLORS[j++ % COLORS.length] + ';' : '') + (solved ? '--d:' + (j * 0.04).toFixed(2) + 's' : '')
        }, gBulbs);
      }
      $('.gg-count').textContent = (chk.onLoop || 0) + ' / ' + chk.bulbs + ' lights';
      var msg = '';
      if (solved) msg = v.practice ? 'The bauble is glowing. You\'re ready for Christmas.' : v.star ? 'The Infinity Star is lit!' : 'This tier is lit!';
      else if (v.done) msg = 'The garlands are out for this year.';
      else if (chk.loops > 1) msg = 'Two separate loops. It has to be one garland.';
      else if (chk.loops === 1 && chk.onLoop < chk.bulbs) msg = 'Nice loop, but ' + (chk.bulbs - chk.onLoop) + ' lights are still off it.';
      $('.gg-msg').textContent = msg;
      $('.gg-msg').classList.toggle('good', Boolean(solved));
      var hb = $('.gg-hint');
      hb.textContent = 'Coiny\'s hint (' + v.hintsLeft + ')';
      hb.disabled = v.done || v.hintsLeft < 1;
      $('.gg-clear').disabled = Boolean(v.done);
      root.querySelector('.gg').classList.toggle('solved', Boolean(solved));
    }

    // ---------- сеть ----------
    function apply(r) {
      if (dead || !r || !r.attempt) return;
      if (queue.length || inflight) return; // локальные ходы ещё летят — сервер догонит
      take(r.attempt);
      draw();
      if (r.attempt.view.solved && !solvedShown) { solvedShown = true; setTimeout(function () { if (!dead) opts.onDone && opts.onDone(); }, 1800); }
    }
    function send(input) {
      inflight = true;
      return opts.move(input).then(function (r) { inflight = false; apply(r); if (queue.length) schedule(); return r; }, function () { inflight = false; if (queue.length) schedule(); });
    }
    function flush() {
      timer = null;
      if (inflight || !queue.length) { if (queue.length) schedule(); return; }
      var t = queue.splice(0, 600);
      send({ do: 'links', t: t });
    }
    function schedule() {
      if (timer) return;
      var wait = Math.max(0, Math.min(300, 1500 - (Date.now() - firstQueued)));
      timer = setTimeout(flush, wait);
    }
    function toggle(a, b) {
      var k = G.key(a, b);
      if (locked[k]) return false;
      if (links[k]) delete links[k];
      else if (deg(a) < 2 && deg(b) < 2) links[k] = 1;
      else return false;
      if (!queue.length) firstQueued = Date.now();
      queue.push([a, b]);
      schedule();
      return true;
    }

    // ---------- ввод ----------
    var drag = null;
    function cellAt(ev) {
      var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      var c = Math.floor(p.x / S), r = Math.floor(p.y / S);
      if (r < 0 || c < 0 || r >= R || c >= C) return -1;
      return r * C + c;
    }
    function step(from, to) { // одна клетка в сторону to
      var fr = Math.floor(from / C), fc = from % C, tr = Math.floor(to / C), tc = to % C;
      if (Math.abs(tr - fr) >= Math.abs(tc - fc)) return from + (tr > fr ? C : -C);
      return from + (tc > fc ? 1 : -1);
    }
    function down(ev) {
      if (!v || v.done) return;
      var x = cellAt(ev);
      if (x < 0 || !bulb[x]) return;
      ev.preventDefault();
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* синтетические события QA */ }
      drag = { last: x, start: x, moved: false };
    }
    function moveP(ev) {
      if (!drag) return;
      var x = cellAt(ev);
      if (x < 0 || x === drag.last) return;
      var changed = false, guard = 0;
      while (drag.last !== x && guard++ < 40) {
        var n = step(drag.last, x);
        if (!bulb[n]) break;
        if (toggle(drag.last, n)) changed = true;
        drag.last = n; drag.moved = true;
      }
      if (changed) draw();
    }
    function up() {
      if (!drag) return;
      if (!drag.moved) { // тап — стереть связи лампочки
        var x = drag.start, any = false;
        Object.keys(links).forEach(function (k) { var p = G.unkey(k); if ((p[0] === x || p[1] === x) && !locked[k]) { toggle(p[0], p[1]); any = true; } });
        if (any) draw();
      }
      drag = null;
    }
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', moveP);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('lostpointercapture', up);

    $('.gg-hint').addEventListener('click', function () {
      if (!v || v.done) return;
      flushNow().then(function () { return send({ do: 'coiny' }); });
    });
    $('.gg-clear').addEventListener('click', function () {
      if (!v || v.done) return;
      Object.keys(links).forEach(function (k) { if (!locked[k]) delete links[k]; });
      draw();
      flushNow().then(function () { return send({ do: 'clear' }); });
    });
    function flushNow() {
      clearTimeout(timer); timer = null;
      var t = queue.splice(0, 600);
      var p = inflightWait();
      return p.then(function () { return t.length ? opts.move({ do: 'links', t: t }) : null; });
    }
    function inflightWait() {
      return new Promise(function (res) { (function w() { if (!inflight) res(); else setTimeout(w, 50); })(); });
    }

    function take(a) {
      v = a.view; R = v.R; C = v.C;
      bulb = v.bulb.split('').map(Number);
      links = {}; v.links.forEach(function (k) { links[k] = 1; });
      locked = {}; v.locked.forEach(function (k) { locked[k] = 1; });
      $('.gg-title').textContent = v.title;
    }

    return {
      load: function (a) { take(a); solvedShown = Boolean(a.view.solved); draw(); },
      destroy: function () { dead = true; clearTimeout(timer); root.innerHTML = ''; }
    };
  }

  window.GarlandGame = { mount: mount };
})();
