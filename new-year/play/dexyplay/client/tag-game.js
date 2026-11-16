/**
 * Экран одной стены Dexy's Holiday Stream: Tag the City. От хаба не зависит: работает от move(input) → Promise<{ attempt } | { error }>.
 *   var game = TagWall.mount(panel, { move, onChange, onDone });
 *   game.load(attempt);   // attempt = { status, view }
 *   game.destroy();
 * Нужен shared/picross.js (window.Picross) — та же проверка цифр, что на сервере, для гаснущих цифр и «проверяю...».
 * Клик/протяжка рисуют сразу у игрока; изменения уходят на сервер пачкой раз в ~0,3 с; засчитывает стену сервер.
 * Окно эфира: LIVE-плашка, личный чат с репликами Dexy (только на действия этого игрока, общих лент нет).
 */
(function () {
  'use strict';
  var P = window.Picross;
  var FLUSH_MS = 300, MAX_WAIT_MS = 1500;

  // Реплики Dexy (EN, как увидят игроки). Голос: стримерша, строчными, коротко.
  var CHAT = {
    hello: ['we’re LIVE 🎄 the city went grey, let’s fix it', 'ok chat, spray cans ready'],
    rules: 'numbers on the edges = how many squares to paint in a row, in order. a gap between groups. ✕ marks a square you know is empty.',
    practice: 'this one’s practice, no pressure. the real walls drop on Christmas',
    mural: 'the mural. biggest wall in the city, take your time 👀',
    open: ['ooh, a fresh wall', 'blank wall, my favorite', 'let’s see what’s hiding here'],
    tagged: ['CLEAN. that one’s glowing', 'ok you’re actually good at this', 'chat look at this 😭', 'neon secured ✨', 'that’s art. framing it'],
    hint: ['chat says this row looks like this 👇', 'ok ok, one row on me'],
    noHints: 'out of hints on this wall. you got it though',
    closed: 'that’s a wrap, stream’s over. check your DMs 💜',
    error: 'connection hiccup. your paint is saved, try again in a sec'
  };
  var NEON = { pink: '#F939E3', yellow: '#FFE733', green: '#33FF8F' };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function any(x) { return Array.isArray(x) ? x[Math.floor(Math.random() * x.length)] : x; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function mount(panel, opts) {
    var root = el('div', 'tg');
    panel.innerHTML = ''; panel.appendChild(root);
    root.innerHTML =
      '<div class="tg-top"><span class="tg-live">LIVE</span><span class="tg-title"></span><span class="tg-meta"></span></div>' +
      '<div class="tg-body">' +
        '<div class="tg-stage">' +
          '<div class="tg-board"></div>' +
          '<div class="tg-tools">' +
            '<div class="tg-mode" role="group" aria-label="Mode"><button type="button" data-m="1" aria-pressed="true">🎨 Paint</button><button type="button" data-m="2" aria-pressed="false">✕ Empty</button></div>' +
            '<button type="button" class="tg-btn tg-hint"></button>' +
            '<button type="button" class="tg-btn tg-clear">Clear</button>' +
          '</div>' +
          '<div class="tg-alert" aria-hidden="true"></div>' +
        '</div>' +
        '<aside class="tg-chat"><h4><span>Stream chat</span><span>just you</span></h4><ul aria-live="polite"></ul></aside>' +
      '</div>';
    var $ = function (s) { return root.querySelector(s); };
    var board = $('.tg-board'), chat = $('.tg-chat ul'), bHint = $('.tg-hint'), bClear = $('.tg-clear');
    var V = null, grid = [], cl = null, cellEls = [], rcEls = [], ccEls = [], lockedRow = {};
    var mode = 1, pending = {}, pendN = 0, inflight = null, timer = null, firstAt = 0, dead = false, done = false, drag = null, alertT = null;

    function say(text, kind) {
      var li = el('li', kind || 'dx');
      if (kind === 'sy' || kind === 'al') li.textContent = text;
      else { li.innerHTML = '<b>Dexy</b> '; li.appendChild(document.createTextNode(text)); }
      chat.appendChild(li); chat.scrollTop = chat.scrollHeight;
    }

    function cellSize() {
      var avail = Math.min(board.clientWidth || panel.clientWidth || 340, 560);
      var maxClue = 0; cl.rows.forEach(function (r) { maxClue = Math.max(maxClue, r.length || 1); });
      var clueW = 10 + maxClue * 15;
      return Math.max(20, Math.min(40, Math.floor((avail - clueW) / cl.W)));
    }

    function build(view) {
      V = view; cl = { W: view.W, H: view.H, rows: view.clues.rows, cols: view.clues.cols };
      grid = view.grid.slice(); lockedRow = {}; view.lockedRows.forEach(function (y) { lockedRow[y] = true; });
      board.innerHTML = ''; cellEls = []; rcEls = []; ccEls = [];
      var pz = el('div', 'tg-pz');
      pz.style.setProperty('--c', cellSize() + 'px');
      pz.style.setProperty('--neon', NEON[view.neon] || NEON.pink);
      pz.style.gridTemplateColumns = 'auto repeat(' + cl.W + ', var(--c))';
      pz.appendChild(el('span'));
      for (var x = 0; x < cl.W; x++) { var cc = el('span', 'tg-cc', (cl.cols[x].length ? cl.cols[x] : [0]).join('<br>')); ccEls.push(cc); pz.appendChild(cc); }
      for (var y = 0; y < cl.H; y++) {
        var rc = el('span', 'tg-rc', (cl.rows[y].length ? cl.rows[y] : [0]).map(function (n) { return '<span>' + n + '</span>'; }).join(''));
        rcEls.push(rc); pz.appendChild(rc);
        for (var x2 = 0; x2 < cl.W; x2++) {
          var b = el('button', 'tg-cell' + (x2 && x2 % 5 === 0 ? ' b5' : '') + (y && y % 5 === 0 ? ' t5' : ''));
          b.type = 'button'; b.dataset.i = y * cl.W + x2;
          b.setAttribute('aria-label', 'row ' + (y + 1) + ', column ' + (x2 + 1));
          cellEls.push(b); pz.appendChild(b);
        }
      }
      board.appendChild(pz);
      bindPaint(pz);
      $('.tg-title').textContent = view.title;
      paint();
    }

    function paint() {
      var st = P.lineStatus(grid, cl);
      cellEls.forEach(function (b, i) {
        var v = grid[i];
        b.classList.toggle('f', v === 1); b.classList.toggle('x', v === 2);
        b.classList.toggle('lk', !!lockedRow[Math.floor(i / cl.W)]);
        b.setAttribute('aria-pressed', v === 1);
      });
      rcEls.forEach(function (e, y) { e.classList.toggle('ok', st.rows[y]); });
      ccEls.forEach(function (e, x) { e.classList.toggle('ok', st.cols[x]); });
      $('.tg-meta').textContent = V.size + (V.practice ? ' · practice' : '');
      bHint.textContent = 'Ask chat for a row · ' + V.hintsLeft;
      bHint.disabled = done || V.hintsLeft < 1; bClear.disabled = done;
      root.classList.toggle('tg-solved', done && V.solved);
      root.classList.toggle('tg-over', done && !V.solved);
      $('.tg-live').textContent = done && !V.solved ? 'OFFLINE' : 'LIVE';
    }

    // ---------- рисование: клик и протяжка, мышь и тач, правый клик = ✕ ----------
    function set(i, v) {
      if (done || lockedRow[Math.floor(i / cl.W)] || grid[i] === v) return false;
      grid[i] = v; pending[i] = v; pendN++;
      return true;
    }
    function changed() {
      paint();
      if (!firstAt) firstAt = Date.now();
      if (P.check(grid, cl)) { say('checking...', 'sy'); flush(); }
      else if (Date.now() - firstAt > MAX_WAIT_MS) flush();
      else { clearTimeout(timer); timer = setTimeout(flush, FLUSH_MS); }
    }
    function bindPaint(pz) {
      pz.addEventListener('contextmenu', function (e) { if (e.target.closest('.tg-cell')) e.preventDefault(); });
      pz.addEventListener('pointerdown', function (e) {
        var b = e.target.closest('.tg-cell'); if (!b || done) return;
        e.preventDefault();
        var i = +b.dataset.i, m = e.button === 2 ? 2 : mode;
        drag = { val: grid[i] === m ? 0 : m };
        if (set(i, drag.val)) paint();
        try { pz.setPointerCapture(e.pointerId); } catch (_) {}
      });
      pz.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var t = document.elementFromPoint(e.clientX, e.clientY);
        if (!t || !t.classList || !t.classList.contains('tg-cell') || !pz.contains(t)) return;
        if (set(+t.dataset.i, drag.val)) paint();
      });
      function end() { if (drag) { drag = null; if (pendN) changed(); } }
      pz.addEventListener('pointerup', end);
      pz.addEventListener('pointercancel', end);
      pz.addEventListener('keydown', function (e) {
        var b = e.target.closest('.tg-cell'); if (!b || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        var i = +b.dataset.i;
        if (set(i, grid[i] === mode ? 0 : mode)) changed();
      });
    }
    root.querySelectorAll('.tg-mode button').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = +b.dataset.m;
        root.querySelectorAll('.tg-mode button').forEach(function (o) { o.setAttribute('aria-pressed', o === b); });
      });
    });

    // ---------- сервер ----------
    function apply(view) {
      V = view;
      grid = view.grid.slice();
      view.lockedRows.forEach(function (y) { lockedRow[y] = true; });
      // то, что игрок нарисовал, пока шёл запрос, — поверх ответа сервера
      Object.keys(pending).forEach(function (i) { if (!lockedRow[Math.floor(i / cl.W)]) grid[i] = pending[i]; });
      if (view.solved) finish(view);
      paint();
    }
    function send(input) {
      return Promise.resolve(opts.move(input)).then(function (r) {
        if (dead) return r;
        if (r && r.attempt && r.attempt.view) apply(r.attempt.view);
        if (r && r.error === 'closed') { done = true; say(CHAT.closed); paint(); }
        else if (r && r.error && r.error !== 'finished' && r.error !== 'no_hints') say(CHAT.error, 'sy');
        return r;
      }, function () { if (!dead) say(CHAT.error, 'sy'); });
    }
    function flush() {
      clearTimeout(timer);
      if (inflight) return inflight.then(flush);
      if (!pendN) return Promise.resolve();
      var batch = pending; pending = {}; pendN = 0; firstAt = 0;
      var c = Object.keys(batch).map(function (i) { return [+i, batch[i]]; });
      inflight = send({ do: 'cells', c: c }).then(function (r) {
        inflight = null;
        if (r && r.error && r.error !== 'finished' && r.error !== 'closed') { // повторим
          Object.keys(batch).forEach(function (i) { if (!(i in pending)) { pending[i] = batch[i]; pendN++; } });
        }
        if (opts.onChange) opts.onChange(V);
        return r;
      });
      return inflight;
    }
    bHint.addEventListener('click', function () {
      if (done) return;
      bHint.disabled = true;
      flush().then(function () { return send({ do: 'hint' }); }).then(function (r) {
        if (r && r.error === 'no_hints') say(CHAT.noHints);
        else if (r && !r.error) say(any(CHAT.hint));
        paint();
        if (opts.onChange) opts.onChange(V);
      });
    });
    bClear.addEventListener('click', function () {
      if (done) return;
      flush().then(function () { return send({ do: 'clear' }); });
    });

    function finish(view) {
      if (done) return;
      done = true;
      var head = view.practice ? 'Practice done' : view.mural ? 'Mural tagged!' : view.title + ' tagged!';
      var a = $('.tg-alert');
      a.innerHTML = esc(head) + '<small>' + esc(view.name || '') + ' · glowing now</small>';
      a.classList.add('on'); clearTimeout(alertT);
      alertT = setTimeout(function () { a.classList.remove('on'); }, 2200);
      say('🎨 you tagged ' + (view.practice ? 'the practice wall' : view.mural ? 'the mural' : view.title) + ' · ' + (view.name || ''), 'al');
      say(view.practice ? 'nice, you got it. the real walls drop on Christmas 🎄' : any(CHAT.tagged));
      if (opts.onDone) setTimeout(function () { if (!dead) opts.onDone(view); }, 1400);
    }

    function onResize() { if (!V) return; var pz = board.querySelector('.tg-pz'); if (pz) pz.style.setProperty('--c', cellSize() + 'px'); }
    window.addEventListener('resize', onResize);

    return {
      load: function (attempt) {
        var v = attempt.view; done = false; chat.innerHTML = '';
        build(v);
        if (v.solved) { done = true; say('🎨 already tagged · ' + (v.name || ''), 'al'); paint(); return; }
        if (attempt.status === 'expired') { done = true; say(CHAT.closed); paint(); return; }
        say(v.practice ? CHAT.practice : v.mural ? CHAT.mural : any(CHAT.open));
        say(CHAT.rules, 'sy');
      },
      flush: flush,
      destroy: function () { dead = true; clearTimeout(timer); clearTimeout(alertT); window.removeEventListener('resize', onResize); if (pendN) { dead = false; flush(); dead = true; } panel.innerHTML = ''; }
    };
  }

  window.TagWall = { mount: mount, CHAT: CHAT };
})();
