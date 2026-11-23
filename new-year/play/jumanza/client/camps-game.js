/*
 * Экран карты 3 «Kilimanjaro Camps»: снежное поле N×N, ёлки, по палатке к каждой ёлке.
 * CampsGame.mount(el, { move(input) → Promise<{attempt, error}>, onDone(view), sprites: '../../jumanza/assets/sprites/' }) → { load(attempt), destroy() }
 * Тап по клетке: пусто → снег ✕ → палатка → пусто. Протянуть пальцем с ✕ — засыпать снегом несколько клеток.
 * Пометки применяются у игрока сразу, сервер хранит их и сам решает, что лагерь собран. Нужен shared/camps.js (window.Camps).
 */
(function (root) {
  var TREE = '<svg viewBox="0 0 40 44" aria-hidden="true"><ellipse cx="20" cy="41" rx="12" ry="2.6" fill="rgba(16,1,40,.18)"/>' +
    '<rect x="17.5" y="33" width="5" height="8" rx="1.2" fill="#6b3a1c"/>' +
    '<path d="M20 2 L33 18 H27 L36 30 H28 L38 37 H2 L12 30 H4 L13 18 H7 Z" fill="#1f7a3a"/>' +
    '<path d="M20 2 L33 18 H27 L36 30 H28 L38 37 H20 Z" fill="#165c2b"/>' +
    '<path d="M20 2 L27 11 Q23 13 20 10 Q17 13 13 11 Z" fill="#f4f8ff"/>' +
    '<path d="M11 19 Q16 22 20 19 Q24 22 29 19 L27 18 H13 Z" fill="#e8f0fc"/>' +
    '<path d="M7 31 Q13 34 20 31 Q27 34 33 31 L28 30 H12 Z" fill="#e8f0fc"/></svg>';
  var TENT = '<svg viewBox="0 0 44 40" aria-hidden="true"><ellipse cx="22" cy="36.5" rx="19" ry="2.8" fill="rgba(16,1,40,.22)"/>' +
    '<path d="M22 4 L41 35 H3 Z" fill="#F1D627"/><path d="M22 4 L41 35 H22 Z" fill="#d1b40e"/>' +
    '<path d="M22 13 L30 35 H14 Z" fill="#100128"/><path d="M22 13 L26 35 H22 Z" fill="#5C05E5" opacity=".55"/>' +
    '<path d="M22 4 V0.5" stroke="#512410" stroke-width="1.6"/><path d="M22 0.8 L29 3 L22 5.2 Z" fill="#49F623"/>' +
    '<path d="M3 35 L22 4 L41 35" fill="none" stroke="#8a6a00" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<circle cx="22" cy="25" r="1.6" fill="#F1D627"/></svg>';
  var SNOW = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5 L15 15 M15 5 L5 15" stroke="#7d93bf" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var BIG = '<svg viewBox="0 0 80 88" aria-hidden="true"><ellipse cx="40" cy="84" rx="26" ry="3.6" fill="rgba(16,1,40,.22)"/>' +
    '<rect x="35" y="72" width="10" height="12" rx="2" fill="#6b3a1c"/>' +
    '<path d="M40 8 L64 36 H54 L70 58 H58 L76 76 H4 L22 58 H10 L26 36 H16 Z" fill="#1f7a3a"/>' +
    '<path d="M40 8 L64 36 H54 L70 58 H58 L76 76 H40 Z" fill="#165c2b"/>' +
    '<path d="M22 40 Q40 52 60 38" fill="none" stroke="#F1D627" stroke-width="2"/><path d="M14 62 Q40 76 66 60" fill="none" stroke="#F1D627" stroke-width="2"/>' +
    '<circle cx="30" cy="46" r="3" fill="#ff4d6d"/><circle cx="48" cy="43" r="3" fill="#49F623"/><circle cx="40" cy="30" r="2.6" fill="#7fd3ff"/>' +
    '<circle cx="24" cy="66" r="3.2" fill="#7fd3ff"/><circle cx="44" cy="68" r="3.2" fill="#ff4d6d"/><circle cx="58" cy="63" r="3.2" fill="#F1D627"/>' +
    '<path d="M40 0 L42.6 6 L49 6.4 L44 10.4 L45.8 16.6 L40 13 L34.2 16.6 L36 10.4 L31 6.4 L37.4 6 Z" fill="#F1D627" stroke="#fff6a8" stroke-width=".8"/></svg>';

  function mount(el, opts) {
    var C = root.Camps;
    var sprites = opts.sprites || '../../jumanza/assets/sprites/';
    var V = null, marks = [], fixed = {}, inflight = 0, q = Promise.resolve(), dead = false, won = false, peekTimer = null;

    el.innerHTML =
      '<div class="cg">' +
      '  <div class="cg-head"><div><h4 class="cg-title"></h4><small class="cg-zone"></small></div><div class="cg-count"></div></div>' +
      '  <div class="cg-board"><div class="cg-grid"></div></div>' +
      '  <div class="cg-tip"></div>' +
      '  <div class="cg-tools">' +
      '    <button type="button" class="tg-btn cg-lion"><img alt="" src="' + sprites + 'lion-peek.webp"><span>Ask the lion</span><i></i></button>' +
      '    <button type="button" class="tg-btn ghost cg-reset">Start over</button>' +
      '  </div>' +
      '</div>';
    var $ = function (s) { return el.querySelector(s); };
    var grid = $('.cg-grid');

    function tip(t) {
      $('.cg-tip').innerHTML = t || 'Pitch one tent next to every tree: above, below, left or right. Tents never touch, not even at the corners. ' +
        'The numbers show how many tents go in each row and column. Tap once for snow <b>✕</b>, twice for a tent.';
    }

    function send(input) {
      inflight++;
      q = q.then(function () { return opts.move(input); }).then(function (r) {
        inflight--;
        if (dead) return r;
        if (r && r.attempt) {
          var v = r.attempt.view;
          if (r.error && r.error !== 'finished') { setView(v); tip('That didn\'t go through, the board is back in sync.'); }
          else if (!inflight) setView(v, input.do === 'set');
          if (v.peek) showPeek(v.peek);
          if (v.solved) win();
        } else if (r && r.error) tip(r.error === 'closed' ? 'The camps are closed now.' : 'Something went wrong: ' + r.error);
        return r;
      }, function () { inflight--; tip('Connection hiccup. Your last mark may not have saved, reload to check.'); });
      return q;
    }

    function setView(v, keepLocal) {
      V = v;
      fixed = {};
      v.trees.forEach(function (i) { fixed[i] = 'tree'; });
      v.blocked.forEach(function (i) { fixed[i] = 'big'; });
      if (!keepLocal || marks.length !== v.N * v.N) marks = v.marks.slice();
      build();
    }

    function build() {
      var N = V.N;
      $('.cg-title').textContent = V.summit ? 'The summit' : V.title;
      $('.cg-zone').textContent = V.zone;
      var board = $('.cg-board');
      board.style.setProperty('--n', N);
      board.classList.toggle('summit', V.summit);
      var html = '<div class="cg-corner"></div>';
      for (var c = 0; c < N; c++) html += '<div class="cg-clue col" data-c="' + c + '"><span>' + V.cols[c] + '</span></div>';
      for (var r = 0; r < N; r++) {
        html += '<div class="cg-clue row" data-r="' + r + '"><span>' + V.rows[r] + '</span></div>';
        for (c = 0; c < N; c++) {
          var i = r * N + c, f = fixed[i];
          if (f === 'big') {
            if (i === V.blocked[0]) html += '<div class="cg-big" style="grid-row:' + (r + 2) + '/span 2;grid-column:' + (c + 2) + '/span 2">' + BIG + '</div>';
            continue;
          }
          html += '<div class="cg-cell' + (f ? ' tree' : '') + '" data-i="' + i + '" style="grid-row:' + (r + 2) + ';grid-column:' + (c + 2) + '">' + (f ? TREE : '') + '</div>';
        }
      }
      grid.innerHTML = html;
      paint();
      var lion = $('.cg-lion');
      lion.querySelector('i').textContent = V.hintsLeft;
      lion.disabled = V.hintsLeft < 1 || V.done;
      $('.cg-reset').disabled = V.done;
      board.classList.toggle('done', V.done);
    }

    /** Обновить пометки, подсветку чисел и конфликтов без перестройки поля. */
    function paint() {
      var N = V.N, pz = { N: N, rows: V.rows, cols: V.cols, trees: V.trees, blocked: V.blocked };
      var ls = C.lineState(pz, marks), bad = {}, tents = 0;
      C.touching(pz, marks).forEach(function (i) { bad[i] = 1; });
      Array.prototype.forEach.call(grid.querySelectorAll('.cg-cell'), function (d) {
        var i = +d.getAttribute('data-i');
        if (fixed[i] === 'tree') {
          d.classList.toggle('has', C.orth(N, i).some(function (n) { return marks[n] === 2; }));
          return;
        }
        var m = marks[i] || 0;
        if (m === 2) tents++;
        if (d.getAttribute('data-m') !== String(m)) {
          d.setAttribute('data-m', m);
          d.innerHTML = m === 2 ? TENT : m === 1 ? SNOW : '';
          if (m === 2) { d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); }
        }
        d.classList.toggle('bad', Boolean(bad[i]));
      });
      Array.prototype.forEach.call(grid.querySelectorAll('.cg-clue'), function (d) {
        var isRow = d.classList.contains('row'), k = +d.getAttribute(isRow ? 'data-r' : 'data-c');
        var st = isRow ? ls.rows[k] : ls.cols[k];
        d.classList.toggle('ok', st === 'ok');
        d.classList.toggle('over', st === 'over');
      });
      $('.cg-count').innerHTML = 'Tents <b>' + tents + '</b><small>of ' + V.trees.length + '</small>';
    }

    // ---------- ввод: тап циклом, протяжка снегом ----------
    var paintMode = null, batch = [];
    function cellAt(x, y) {
      var n = document.elementFromPoint(x, y);
      while (n && n !== grid && !(n.classList && n.classList.contains('cg-cell'))) n = n.parentNode;
      return n && n !== grid && !n.classList.contains('tree') ? n : null;
    }
    function setMark(i, v) {
      if (marks[i] === v) return;
      marks[i] = v; batch.push([i, v]);
    }
    grid.addEventListener('pointerdown', function (e) {
      if (won || !V || V.done) return;
      var d = cellAt(e.clientX, e.clientY);
      if (!d) return;
      e.preventDefault();
      hidePeek();
      var i = +d.getAttribute('data-i'), nv = ((marks[i] || 0) + 1) % 3;
      setMark(i, nv);
      paintMode = nv === 1 ? 1 : null;
      paint();
      if (paintMode) { try { grid.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
      else flush();
    });
    grid.addEventListener('pointermove', function (e) {
      if (!paintMode) return;
      var d = cellAt(e.clientX, e.clientY);
      if (!d) return;
      var i = +d.getAttribute('data-i');
      if ((marks[i] || 0) === 0) { setMark(i, 1); paint(); }
    });
    function end() { if (paintMode) { paintMode = null; flush(); } }
    grid.addEventListener('pointerup', end);
    grid.addEventListener('pointercancel', end);
    function flush() {
      if (!batch.length) return;
      var s = batch; batch = [];
      send({ do: 'set', s: s });
    }

    function showPeek(pk) {
      var d = grid.querySelector('[data-i="' + pk.cell + '"]');
      if (d) d.classList.add(pk.kind === 'wrong' ? 'peek-bad' : 'peek');
      tip(pk.kind === 'wrong'
        ? '<b>The lion:</b> that tent was in the wrong spot, I covered it with snow.'
        : '<b>The lion:</b> a tent goes here. And no tents around it, I marked that snow for you.');
      clearTimeout(peekTimer); peekTimer = setTimeout(hidePeek, 4000);
    }
    function hidePeek() {
      Array.prototype.forEach.call(grid.querySelectorAll('.peek,.peek-bad'), function (n) { n.classList.remove('peek'); n.classList.remove('peek-bad'); });
    }

    function win() {
      if (won) return; won = true;
      hidePeek();
      $('.cg-board').classList.add('won');
      tip(V.summit ? '🎄 Camp is set under the big tree. The gifts made it to the top of Kilimanjaro!' : V.training ? 'That\'s it! On Christmas morning the real camps open.' : '⛺ Camp is set! The 4x4 climbs on.');
      setTimeout(function () { if (!dead && opts.onDone) opts.onDone(V); }, 900);
    }

    $('.cg-lion').onclick = function () { if (!V.done && V.hintsLeft > 0) { flush(); send({ do: 'hint' }); } };
    $('.cg-reset').onclick = function () {
      if (V.done) return;
      hidePeek(); batch = [];
      send({ do: 'reset' }).then(function (r) { if (r && r.attempt) setView(r.attempt.view); });
    };
    tip();

    return {
      load: function (attempt) {
        won = Boolean(attempt.view.solved);
        setView(attempt.view);
        if (won) $('.cg-board').classList.add('won');
        if (attempt.view.done) tip(attempt.view.solved ? 'Camp is set. Pick the next stop on the mountain.' : 'This camp closed before it was set up.');
      },
      destroy: function () { dead = true; clearTimeout(peekTimer); el.innerHTML = ''; },
    };
  }

  root.CampsGame = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
