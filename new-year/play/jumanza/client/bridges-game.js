/*
 * Экран карты 2 «Safari Bridges»: река, камни-островки с числами, брёвна между соседними камнями.
 * Bridges.mount(el, { move(input) → Promise<{attempt, error}>, onDone(view), sprites: '../../jumanza/assets/sprites/' }) → { load(attempt), destroy() }
 * Управление: тап по камню, потом по соседнему (или свайп от камня в сторону соседа) → 1 бревно → 2 → убрать.
 * Тап по уже лежащему бревну — то же самое. Ход применяется у игрока сразу, сервер проверяет и сам решает «переправа готова».
 * Нужен shared/bridges.js (window.Hashi).
 */
(function (root) {
  function mount(el, opts) {
    var H = root.Hashi;
    var sprites = opts.sprites || '../../jumanza/assets/sprites/';
    var V = null, P = [], cur = {}, sel = -1, sets = 0;
    var inflight = 0, q = Promise.resolve(), dead = false, won = false, peekTimer = null, flashTimer = null;

    el.innerHTML =
      '<div class="brg">' +
      '  <div class="brg-head"><div><h4 class="brg-title"></h4><small class="brg-zone"></small></div><div class="brg-count"></div></div>' +
      '  <div class="brg-board"><div class="brg-water"></div><div class="brg-field"><div class="brg-logs"></div><div class="brg-rocks"></div></div></div>' +
      '  <div class="brg-tip"></div>' +
      '  <div class="brg-tools">' +
      '    <button type="button" class="brg-btn brg-lion"><img alt="" src="' + sprites + 'lion-peek.webp"><span>Ask the lion</span><i></i></button>' +
      '    <button type="button" class="brg-btn ghost brg-reset">Start over</button>' +
      '  </div>' +
      '</div>';
    var $ = function (s) { return el.querySelector(s); };
    var board = $('.brg-board'), field = $('.brg-field'), logs = $('.brg-logs'), rocks = $('.brg-rocks');

    var DEFAULT_TIP = 'Tap a rock, then the rock next to it to lay a log. Tap again for two logs, once more to clear. Every number shows how many logs touch that rock, logs never cross, and all rocks link up.';
    function tip(t) { $('.brg-tip').innerHTML = t || DEFAULT_TIP; }

    var key = function (a, b) { return a < b ? a + ':' + b : b + ':' + a; };
    function list() { var out = []; Object.keys(cur).forEach(function (k) { if (cur[k] > 0) { var p = k.split(':'); out.push([+p[0], +p[1], cur[k]]); } }); return out; }
    function pairOf(a, b) { for (var i = 0; i < P.length; i++) if ((P[i].a === a && P[i].b === b) || (P[i].a === b && P[i].b === a)) return P[i]; return null; }
    function puzzle() { return { w: V.w, h: V.h, islands: V.islands }; }

    function send(input) {
      inflight++;
      q = q.then(function () { return opts.move(input); }).then(function (r) {
        inflight--;
        if (dead) return r;
        if (r && r.attempt) {
          var v = r.attempt.view;
          if (r.error && r.error !== 'finished') { setView(v); tip(r.error === 'cross' ? 'Logs can\'t cross each other.' : 'That log didn\'t go through, the river is back in sync.'); }
          else if (!inflight) setView(v);
          if (v.peek) showPeek(v.peek);
          if (v.solved) win();
        } else if (r && r.error) tip(r.error === 'closed' ? 'The river crossings are closed now.' : 'Something went wrong: ' + r.error);
        return r;
      }, function () { inflight--; tip('Connection hiccup. Your last log may not have saved, reload to check.'); });
      return q;
    }

    function setView(v) {
      V = v;
      P = H.pairs(puzzle());
      cur = {};
      v.bridges.forEach(function (e) { cur[key(e[0], e[1])] = e[2]; });
      sets = v.sets;
      draw();
    }

    function pct(x, n) { return ((x + 0.5) / n * 100) + '%'; }

    function draw() {
      $('.brg-title').textContent = V.summit ? 'The summit' : V.title;
      $('.brg-zone').textContent = V.zone;
      var L = list(), deg = H.degrees(puzzle(), L), done = 0;
      V.islands.forEach(function (s, i) { if (deg[i] === s.n) done++; });
      $('.brg-count').innerHTML = 'Rocks <b>' + done + '/' + V.islands.length + '</b><small>logs laid: ' + L.reduce(function (s, e) { return s + e[2]; }, 0) + '</small>';
      var lion = $('.brg-lion');
      lion.querySelector('i').textContent = V.hintsLeft;
      lion.disabled = V.hintsLeft < 1 || V.done;
      $('.brg-reset').disabled = V.done;
      board.style.setProperty('--w', V.w); board.style.setProperty('--h', V.h);
      board.style.aspectRatio = V.w + ' / ' + V.h;
      board.classList.toggle('won', Boolean(V.done && V.solved));

      logs.innerHTML = '';
      L.forEach(function (e) {
        var A = V.islands[e[0]], B = V.islands[e[1]];
        var d = document.createElement('div');
        var hor = A.y === B.y;
        d.className = 'brg-log ' + (hor ? 'h' : 'v') + (e[2] === 2 ? ' dbl' : '');
        d.setAttribute('data-k', key(e[0], e[1]));
        if (hor) { d.style.left = pct(Math.min(A.x, B.x), V.w); d.style.width = (Math.abs(B.x - A.x) / V.w * 100) + '%'; d.style.top = (A.y / V.h * 100) + '%'; d.style.height = (100 / V.h) + '%'; }
        else { d.style.top = pct(Math.min(A.y, B.y), V.h); d.style.height = (Math.abs(B.y - A.y) / V.h * 100) + '%'; d.style.left = (A.x / V.w * 100) + '%'; d.style.width = (100 / V.w) + '%'; }
        d.innerHTML = '<span></span>' + (e[2] === 2 ? '<span></span>' : '');
        if (!V.done) d.addEventListener('click', function () { var p = d.getAttribute('data-k').split(':'); cycle(+p[0], +p[1]); });
        logs.appendChild(d);
      });

      rocks.innerHTML = '';
      var nbs = sel >= 0 ? P.filter(function (p) { return p.a === sel || p.b === sel; }).map(function (p) { return p.a === sel ? p.b : p.a; }) : [];
      V.islands.forEach(function (s, i) {
        var r = document.createElement('button');
        r.type = 'button';
        r.className = 'brg-rock' + (deg[i] === s.n ? ' ok' : deg[i] > s.n ? ' over' : '') + (i === sel ? ' sel' : '') + (nbs.indexOf(i) >= 0 ? ' nb' : '');
        r.setAttribute('data-i', i);
        r.setAttribute('aria-label', 'rock ' + s.n);
        r.style.left = pct(s.x, V.w); r.style.top = pct(s.y, V.h);
        r.innerHTML = '<b>' + s.n + '</b>';
        if (!V.done) r.addEventListener('pointerdown', down);
        rocks.appendChild(r);
      });
    }

    function cycle(a, b) {
      if (won || V.done) return;
      var p = pairOf(a, b);
      if (!p) { tip('Logs only go straight across to the next rock in the same row or column.'); return; }
      var k = cur[key(a, b)] || 0, next = (k + 1) % 3;
      if (next > 0 && k === 0) {
        var hit = H.crossesAny(puzzle(), p.a, p.b, list());
        if (hit) { flash(hit); tip('Logs can\'t cross each other. Clear the other log first.'); return; }
      }
      cur[key(a, b)] = next; sets++;
      sel = -1;
      hidePeek();
      draw();
      send({ do: 'bridges', s: [[p.a, p.b, next]] });
      var L = list();
      if (H.check(puzzle(), L).ok) tip('Checking the crossing…');
      else tip();
    }

    function flash(pr) {
      var n = logs.querySelector('[data-k="' + key(pr[0], pr[1]) + '"]');
      if (!n) return;
      n.classList.add('bad');
      clearTimeout(flashTimer); flashTimer = setTimeout(function () { n.classList.remove('bad'); }, 900);
    }

    // тап / свайп от камня
    function down(e) {
      if (won || V.done) return;
      e.preventDefault();
      var i = +e.currentTarget.getAttribute('data-i');
      var x0 = e.clientX, y0 = e.clientY;
      var cell = field.getBoundingClientRect().width / V.w;
      function up(ev) {
        document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel);
        var dx = ev.clientX - x0, dy = ev.clientY - y0, far = Math.max(Math.abs(dx), Math.abs(dy)) > cell * 0.45;
        var hitEl = document.elementFromPoint(ev.clientX, ev.clientY);
        var rock = hitEl && hitEl.closest ? hitEl.closest('.brg-rock') : null;
        var j = rock && el.contains(rock) ? +rock.getAttribute('data-i') : -1;
        if (far) {
          if (j < 0 || j === i) j = dirNeighbor(i, dx, dy);
          if (j >= 0 && j !== i) { cycle(i, j); return; }
          sel = -1; draw(); return;
        }
        // тап
        if (sel >= 0 && sel !== i) {
          if (pairOf(sel, i)) { cycle(sel, i); return; }
          sel = i; draw(); tip('Now tap a highlighted rock next to it.'); return;
        }
        sel = sel === i ? -1 : i;
        draw();
        if (sel >= 0) tip('Now tap a highlighted rock next to it.'); else tip();
      }
      function cancel() { document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', cancel); }
      document.addEventListener('pointerup', up); document.addEventListener('pointercancel', cancel);
    }

    function dirNeighbor(i, dx, dy) {
      var s = V.islands[i], best = -1;
      P.forEach(function (p) {
        if (p.a !== i && p.b !== i) return;
        var j = p.a === i ? p.b : p.a, t = V.islands[j];
        if (Math.abs(dx) >= Math.abs(dy)) { if (t.y === s.y && Math.sign(t.x - s.x) === Math.sign(dx)) best = j; }
        else if (t.x === s.x && Math.sign(t.y - s.y) === Math.sign(dy)) best = j;
      });
      return best;
    }

    function showPeek(pk) {
      var n = logs.querySelector('[data-k="' + key(pk.a, pk.b) + '"]');
      if (n) n.classList.add('hint');
      [pk.a, pk.b].forEach(function (i) { var r = rocks.querySelector('[data-i="' + i + '"]'); if (r) r.classList.add('hint'); });
      tip('<b>The lion:</b> ' + (pk.k === 0 ? 'that log was in the wrong place, I took it away.' : pk.k === 2 ? 'two logs go right here.' : 'one log goes right here.') +
        (pk.left > 0 ? ' ' + pk.left + (pk.left === 1 ? ' change' : ' changes') + ' to go.' : ''));
      clearTimeout(peekTimer); peekTimer = setTimeout(hidePeek, 4000);
    }
    function hidePeek() {
      Array.prototype.forEach.call(el.querySelectorAll('.hint'), function (n) { n.classList.remove('hint'); });
    }

    function win() {
      if (won) return; won = true;
      hidePeek(); sel = -1; draw();
      tip(V.summit ? '🎄 The gifts made it to the top of Kilimanjaro!' : V.training ? 'That\'s it! On Christmas the real river opens.' : '🐾 River crossed! The 4x4 rolls on up the mountain.');
      setTimeout(function () { if (!dead && opts.onDone) opts.onDone(V); }, 900);
    }

    $('.brg-lion').onclick = function () { if (!V.done && V.hintsLeft > 0) { sel = -1; send({ do: 'hint' }); } };
    $('.brg-reset').onclick = function () { if (!V.done) { hidePeek(); sel = -1; send({ do: 'reset' }).then(function (r) { if (r && r.attempt) { setView(r.attempt.view); tip(); } }); } };
    tip();

    return {
      load: function (attempt) { won = Boolean(attempt.view.solved); sel = -1; setView(attempt.view); if (attempt.view.done) tip(attempt.view.solved ? 'Crossed. Pick the next stop on the mountain.' : 'This river closed before the 4x4 got across.'); },
      destroy: function () { dead = true; clearTimeout(peekTimer); clearTimeout(flashTimer); el.innerHTML = ''; },
    };
  }

  root.Bridges = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
