/*
 * Экран тропы: поле 6×6, животные двигаются перетаскиванием по своей оси, safari 4x4 выезжает вправо.
 * Trail.mount(el, { move(input) → Promise<{attempt, error}>, onDone(), sprites: '/assets/sprites/' }) → { load(attempt), destroy() }
 * Ход применяется у игрока сразу, сервер проверяет каждый сдвиг и сам решает, что 4x4 проехал.
 * Нужен shared/jam.js (window.Jam).
 */
(function (root) {
  var SPRITE = { car: 'jeep', zebra: 'zebra', hippo: 'hippo', rhino: 'rhino', elephant: 'elephant', log: 'log', giraffe: 'giraffe', flamingo: 'flamingo' };

  function mount(el, opts) {
    var J = root.Jam;
    var sprites = opts.sprites || '/assets/sprites/';
    var V = null;          // последний view с сервера
    var pieces = [], pos = [], slides = 0;
    var inflight = 0, q = Promise.resolve(), dead = false, won = false, peekTimer = null;

    el.innerHTML =
      '<div class="tg">' +
      '  <div class="tg-head"><div><h4 class="tg-title"></h4><small class="tg-zone"></small></div><div class="tg-moves"></div></div>' +
      '  <div class="tg-board"><div class="tg-exit"><span>🎄</span></div><div class="tg-field"><div class="tg-ghost" hidden></div><div class="tg-cells"></div></div></div>' +
      '  <div class="tg-tip"></div>' +
      '  <div class="tg-tools">' +
      '    <button type="button" class="tg-btn tg-lion"><img alt="" src="' + sprites + 'lion-peek.webp"><span>Ask the lion</span><i></i></button>' +
      '    <button type="button" class="tg-btn ghost tg-reset">Start over</button>' +
      '  </div>' +
      '</div>';
    var $ = function (s) { return el.querySelector(s); };
    var board = $('.tg-board'), cells = $('.tg-cells'), ghost = $('.tg-ghost');

    function tip(t) { $('.tg-tip').innerHTML = t || 'Drag the animals along their path to clear the road. Get the 4x4 with the gifts out on the right.'; }

    function send(input) {
      inflight++;
      q = q.then(function () { return opts.move(input); }).then(function (r) {
        inflight--;
        if (dead) return r;
        if (r && r.attempt) {
          var v = r.attempt.view;
          if (r.error && r.error !== 'finished') { setView(v); tip('That move didn\'t go through, the board is back in sync.'); }
          else if (!inflight) setView(v, true);
          if (v.peek) showPeek(v.peek);
          if (v.solved) win();
        } else if (r && r.error) tip(r.error === 'closed' ? 'The trails are closed now.' : 'Something went wrong: ' + r.error);
        return r;
      }, function () { inflight--; tip('Connection hiccup. Your last move may not have saved, reload to check.'); });
      return q;
    }

    function setView(v, keepLocal) {
      V = v;
      pieces = v.pieces.map(function (p) { return { o: p.o, len: p.len, fix: p.fix, kind: p.kind }; });
      if (!keepLocal || !pos.length) { pos = v.pieces.map(function (p) { return p.pos; }); slides = v.slides; }
      draw();
    }

    function place(node, p, x) {
      var W = V.W;
      if (p.o === 'h') { node.style.left = (x / W * 100) + '%'; node.style.top = (p.fix / W * 100) + '%'; node.style.width = (p.len / W * 100) + '%'; node.style.height = (100 / W) + '%'; }
      else { node.style.left = (p.fix / W * 100) + '%'; node.style.top = (x / W * 100) + '%'; node.style.width = (100 / W) + '%'; node.style.height = (p.len / W * 100) + '%'; }
    }

    function draw() {
      $('.tg-title').textContent = V.summit ? 'The summit' : V.title;
      $('.tg-zone').textContent = V.zone;
      $('.tg-moves').innerHTML = 'Moves <b>' + slides + '</b><small>best possible: ' + V.par + '</small>';
      var lion = $('.tg-lion');
      lion.querySelector('i').textContent = V.hintsLeft;
      lion.disabled = V.hintsLeft < 1 || V.done;
      $('.tg-reset').disabled = V.done;
      board.style.setProperty('--exit', V.exitRow);
      board.classList.toggle('summit', V.summit);
      cells.innerHTML = '';
      pieces.forEach(function (p, i) {
        var d = document.createElement('div');
        d.className = 'tg-pc ' + p.o + ' k-' + p.kind + (i === 0 ? ' car' : '');
        d.setAttribute('data-i', i);
        var img = document.createElement('img');
        img.alt = ''; img.draggable = false; img.src = sprites + SPRITE[p.kind] + '.webp';
        if (p.o === 'v' && p.kind === 'log') { img.className = 'rot'; img.style.width = (p.len * 100) + '%'; img.style.height = (100 / p.len) + '%'; }
        d.appendChild(img);
        if (i === 0) { var g = document.createElement('span'); g.className = 'gift'; g.textContent = '🎁'; d.appendChild(g); }
        place(d, p, pos[i]);
        if (!V.done) d.addEventListener('pointerdown', drag);
        cells.appendChild(d);
      });
      if (V.done && V.solved) { var car = cells.querySelector('.car'); if (car) car.classList.add('out'); }
    }

    function drag(e) {
      if (won || V.done) return;
      e.preventDefault();
      var node = e.currentTarget, i = +node.getAttribute('data-i'), p = pieces[i];
      var r = cells.getBoundingClientRect(), cell = r.width / V.W;
      var rg = J.range(pieces, pos, i), start = p.o === 'h' ? e.clientX : e.clientY, x = pos[i];
      node.classList.add('drag');
      node.setPointerCapture(e.pointerId);
      function mv(ev) {
        var d = ((p.o === 'h' ? ev.clientX : ev.clientY) - start) / cell;
        x = Math.max(rg[0], Math.min(rg[1], pos[i] + d));
        place(node, p, x);
      }
      function up() {
        node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up);
        node.classList.remove('drag');
        var to = Math.round(x);
        if (to !== pos[i]) {
          pos[i] = to; slides++;
          send({ do: 'slides', s: [[i, to]] });
          hidePeek();
        }
        draw();
      }
      node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    }

    function showPeek(pk) {
      var p = pieces[pk.i];
      var node = cells.querySelector('[data-i="' + pk.i + '"]');
      if (node) node.classList.add('hint');
      ghost.hidden = false; place(ghost, p, pk.to);
      tip('<b>The lion:</b> move this one here. ' + (pk.left === 1 ? 'That\'s the last move!' : pk.left + ' moves to go from here.'));
      clearTimeout(peekTimer); peekTimer = setTimeout(hidePeek, 4000);
    }
    function hidePeek() {
      ghost.hidden = true;
      Array.prototype.forEach.call(cells.querySelectorAll('.hint'), function (n) { n.classList.remove('hint'); });
    }

    function win() {
      if (won) return; won = true;
      hidePeek();
      var car = cells.querySelector('.car');
      if (car) car.classList.add('out');
      tip(V.summit ? '🎄 The gifts made it to the top of Kilimanjaro!' : V.training ? 'That\'s it! On Christmas morning the real trails open.' : '🐾 Trail cleared! The 4x4 is on its way up.');
      setTimeout(function () { if (!dead && opts.onDone) opts.onDone(V); }, 900);
    }

    $('.tg-lion').onclick = function () { if (!V.done && V.hintsLeft > 0) send({ do: 'hint' }); };
    $('.tg-reset').onclick = function () { if (!V.done) { hidePeek(); send({ do: 'reset' }).then(function (r) { if (r && r.attempt) setView(r.attempt.view); }); } };
    tip();

    return {
      load: function (attempt) { won = Boolean(attempt.view.solved); setView(attempt.view); if (attempt.view.done) tip(attempt.view.solved ? 'Cleared. Pick the next trail on the mountain.' : 'This trail closed before the 4x4 got through.'); },
      destroy: function () { dead = true; clearTimeout(peekTimer); el.innerHTML = ''; },
    };
  }

  root.Trail = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
