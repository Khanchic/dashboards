// Игра «акт шоу Мага» (механика 'stripact'), клиент. Не зависит от хаба: хаб/стенд передаёт move() и колбэки.
//   var g = StripGame.mount(rootEl, {
//     move: function (input) { return Promise<{ attempt: { status, view } } | { error }> },
//     onRound: function (view, gain) {},   // раунд закончен (очки обновились)
//     onDone: function (view) {},          // акт закончен, игрок нажал «See my rocket»
//     assets: { magician: url, harlequin: url }
//   });
//   g.load(attempt)   — показать попытку (в т.ч. после перезагрузки посреди раунда)
//   g.destroy()
// Ответ знает только сервер. Перестановки и расклад приходят ровно тогда, когда нужны для анимации.
window.StripGame = (function () {
  'use strict';
  var COLORS = { red: '#FF2B39', blue: '#01C9FF', gold: '#FFDA0A', white: '#f2f2f2', purple: '#9b6bff' };
  var SYM = {
    star: { c: '#01C9FF', name: 'the star' }, diamond: { c: '#FF2B39', name: 'the diamond' }, chip: { c: '#7B5F33', name: 'the circle' },
    triangle: { c: '#06303F', name: 'the triangle' }, hexagon: { c: '#7a4bd6', name: 'the hexagon' }, plus: { c: '#FF2B39', name: 'the plus' },
    bolt: { c: '#e0a800', name: 'the bolt' }, square: { c: '#01C9FF', name: 'the square' }
  };
  function roman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n] || String(n); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function swatch(c) { return '<span class="sg-cl" style="--c:' + COLORS[c] + '"></span>'; }
  function symIcon(k) { return '<i class="sg-sym ' + k + '" style="--c:' + SYM[k].c + ';display:inline-block;width:1.1em;vertical-align:-3px;margin:0 2px"></i>'; }
  function clueText(cl) {
    var C = cl.c ? swatch(cl.c) + '<b>' + cl.c + '</b>' : '';
    switch (cl.k) {
      case 'not': return 'The chip is <b>not</b> under the ' + C + ' hat.';
      case 'left': return 'The ' + C + ' hat is somewhere to the <b>left</b> of the chip.';
      case 'right': return 'The ' + C + ' hat is somewhere to the <b>right</b> of the chip.';
      case 'near': return 'The chip is <b>right next to</b> the ' + C + ' hat.';
      case 'edge': return 'The chip is under one of the <b>two end</b> hats.';
      case 'middle': return 'The chip is <b>not</b> under an end hat.';
    }
    return '';
  }

  function mount(root, opts) {
    root.classList.add('sg');
    root.innerHTML =
      '<div class="sg-head"><div class="sg-host"><span class="sg-av" aria-hidden="true"></span><div><div class="sg-sub"></div><div class="sg-title"></div></div></div><div class="sg-dots" aria-label="Rounds"></div></div>' +
      '<div class="sg-felt"></div><div class="sg-say" aria-live="polite"></div><button type="button" class="sg-go"></button>';
    var q = function (s) { return root.querySelector(s); };
    var felt = q('.sg-felt'), say = q('.sg-say'), go = q('.sg-go');
    var v = null, items = [], slotOf = [], busy = false, mode = '', timers = [], goAction = null, dead = false;

    // Паузы игры не сокращаем даже при prefers-reduced-motion: время показа карт и тасовки — это сама игра,
    // и сервер не примет ответ раньше (too_early).
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function wait(ms) { return new Promise(function (r) { later(r, ms); }); }
    function setSay(main, sub) { say.innerHTML = main + (sub ? '<small>' + sub + '</small>' : ''); }
    function setGo(text, action) { go.hidden = false; go.textContent = text; goAction = action; go.disabled = !action; }
    function hideGo() { go.hidden = true; goAction = null; }
    function who() { return v && v.host === 'harlequin' ? 'Harlequin' : 'The Magician'; }

    go.addEventListener('click', function () {
      if (!goAction || busy) return;
      var a = goAction; goAction = null; go.disabled = true; a();
    });
    felt.addEventListener('click', function (e) {
      var b = e.target.closest('.sg-item');
      if (b && !b.disabled && mode === 'pick' && !busy) pick(b);
    });
    function onResize() { if (v && v.trick && v.trick.type !== 'cards' && items.length) hatSize(items.length); }
    addEventListener('resize', onResize);

    // ---------- сервер ----------
    function send(input, retried) {
      return opts.move(input).then(function (r) {
        if (dead) return null;
        if (r && r.attempt) return r.attempt.view;
        var err = r && r.error;
        // сервер считает время показа по своим часам: если клик пришёл на долю секунды раньше — повторяем
        if ((err === 'too_early' || err === 'too_fast') && !retried) return wait(err === 'too_early' ? 600 : 300).then(function () { return send(input, true); });
        busy = false;
        if (err === 'closed' || err === 'finished') { // акт закрылся по расписанию или уровень уже забран
          mode = ''; lockAll();
          setSay('This act is closed.', 'The rounds you finished still count toward your rocket.');
          setGo('Back to the show', function () { if (opts.onDone) opts.onDone(v); });
          return null;
        }
        setSay('Something went wrong (' + (err || 'network') + ').', 'Reload the page — your progress is saved.');
        return null;
      }, function () {
        busy = false;
        if (!dead) setSay('Connection lost.', 'Try again in a moment — your progress is saved.');
        return null;
      });
    }

    // ---------- шапка ----------
    function head(roundShown) {
      q('.sg-av').style.backgroundImage = 'url(' + (v.host === 'harlequin' ? opts.assets.harlequin : opts.assets.magician) + ')';
      q('.sg-sub').textContent = 'Act ' + roman(v.act) + ' · Round ' + Math.min(roundShown + 1, v.of) + ' of ' + v.of;
      q('.sg-title').textContent = v.title;
      dots();
    }
    function dots() {
      var html = '';
      for (var i = 0; i < v.of; i++) {
        var g = v.gains[i];
        html += '<span class="sg-dot' + (g == null ? (i === v.gains.length && v.phase !== 'done' ? ' cur' : '') : ' g' + g) + '">' + (g == null ? i + 1 : g ? '+' + g : '0') + '</span>';
      }
      q('.sg-dots').innerHTML = html;
    }

    // ---------- раскладка ----------
    function btn(i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'sg-item'; b.setAttribute('data-i', i); b.disabled = true; return b; }
    function hatSize(n) { felt.style.setProperty('--hw', Math.round(Math.min(100, ((felt.clientWidth || 360) / n) * 0.84)) + 'px'); }
    function build() {
      var t = v.trick, n = t.n;
      felt.innerHTML = ''; items = []; slotOf = []; felt.classList.remove('pickable');
      if (t.type === 'cards') {
        var grid = document.createElement('div'); grid.className = 'sg-grid';
        grid.style.setProperty('--cols', n <= 4 ? n : n <= 6 ? 3 : 4);
        grid.style.setProperty('--cw', n > 4 ? '62px' : '72px');
        grid.style.setProperty('--ch', n > 4 ? '88px' : '104px');
        felt.appendChild(grid);
        for (var i = 0; i < n; i++) {
          var c = btn(i);
          c.innerHTML = '<span class="sg-card"><span class="b"></span><span class="f"></span></span>';
          c.setAttribute('aria-label', 'Card ' + (i + 1));
          grid.appendChild(c); items.push(c); slotOf.push(i);
        }
        return;
      }
      hatSize(n); // до вставки шляп, иначе они «разъезжаются» из левого угла
      for (var j = 0; j < n; j++) {
        var h = btn(j), col = t.type === 'riddle' ? t.colors[j] : null;
        h.innerHTML = '<span class="sg-chip"></span><span class="sg-hat"' + (col ? ' style="--band:' + COLORS[col] + '"' : '') + '><span class="cr"></span><span class="bd"></span><span class="br"></span></span>';
        h.setAttribute('aria-label', col ? cap(col) + ' hat' : 'Hat ' + (j + 1));
        h.style.width = (100 / n) + '%'; h.style.left = (j * 100 / n) + '%';
        felt.appendChild(h); items.push(h); slotOf.push(j);
      }
    }
    function itemAt(slot) { return items[slotOf.indexOf(slot)]; }
    function face(b, sym) { b.querySelector('.f').innerHTML = sym ? '<i class="sg-sym ' + sym + '" style="--c:' + SYM[sym].c + '"></i>' : ''; }
    function enablePick() {
      mode = 'pick'; felt.classList.add('pickable');
      items.forEach(function (b, i) { b.disabled = v.misses.indexOf(slotOf[i]) > -1; });
    }
    function lockAll() { felt.classList.remove('pickable'); items.forEach(function (b) { b.disabled = true; }); }
    function markMisses() {
      var t = v.trick;
      v.misses.forEach(function (slot) {
        var b = itemAt(slot); if (!b) return;
        b.classList.add('miss');
        if (t.type === 'cards') {
          var r = (t.revealed || []).filter(function (x) { return x.slot === slot; })[0];
          if (r) face(b, r.symbol);
          b.classList.add('flip');
        } else b.classList.add('lift');
      });
    }

    // ---------- раунд ----------
    function setupRound() {
      if (v.phase === 'done') { summary(); return; }
      mode = ''; head(v.round); build();
      var t = v.trick;
      if (t.type === 'shell') {
        if (v.phase === 'ready') {
          itemAt(t.start).classList.add('lift', 'chip');
          setSay('The chip is under the raised hat. Keep your eye on it.', 'Two tries per round: 3 points for the first, 1 for the second.');
          setGo('Shuffle!', startShell);
        } else { // перезагрузка во время или после тасовки
          placeAfterSwaps(t); markMisses(); enablePick(); hideGo();
          setSay(v.misses.length ? 'Not there. One more try, worth 1 point.' : 'Where is the chip?', 'Tap a hat.');
        }
      } else if (t.type === 'cards') {
        if (v.phase === 'ready') {
          setSay(who() + ' shows every card for ' + Math.round(t.showMs / 1000) + ' seconds.', 'Remember where each one is — then you’ll be asked about one of them.');
          setGo('Show me', startCards);
        } else if (v.phase === 'show') { hideGo(); showCards(v.trick); }
        else { hideGo(); askCards(); }
      } else {
        if (v.phase === 'ready') {
          setSay('The chip is hidden under one of these hats.', who() + ' gives you clues. Work out which hat.');
          setGo('Get the clues', startRiddle);
        } else { hideGo(); markMisses(); clues(v.misses.length > 0); enablePick(); }
      }
    }

    function startShell() {
      busy = true;
      send({ do: 'start' }).then(function (nv) {
        if (!nv) return;
        v = nv; var t = v.trick;
        hideGo();
        items.forEach(function (b) { b.classList.remove('lift', 'chip'); });
        setSay('Watch closely…', '');
        felt.style.setProperty('--sw', t.ms + 'ms');
        var seq = wait(450);
        t.swaps.forEach(function (s) { seq = seq.then(function () { return swap(s[0], s[1], t.ms); }); });
        seq.then(function () { busy = false; enablePick(); setSay('Where is the chip?', 'Tap a hat.'); });
      });
    }
    function swap(a, b, ms) {
      var n = items.length, ia = slotOf.indexOf(a), ib = slotOf.indexOf(b);
      slotOf[ia] = b; slotOf[ib] = a;
      items[ia].style.left = (b * 100 / n) + '%'; items[ib].style.left = (a * 100 / n) + '%';
      items[ia].classList.add('up'); items[ib].classList.add('down');
      return wait(ms + 40).then(function () { items[ia].classList.remove('up'); items[ib].classList.remove('down'); });
    }
    function placeAfterSwaps(t) {
      var n = items.length;
      t.swaps.forEach(function (s) { var ia = slotOf.indexOf(s[0]), ib = slotOf.indexOf(s[1]); slotOf[ia] = s[1]; slotOf[ib] = s[0]; });
      items.forEach(function (b, i) { b.style.transition = 'none'; b.style.left = (slotOf[i] * 100 / n) + '%'; void b.offsetWidth; b.style.transition = ''; });
    }

    function startCards() {
      busy = true;
      send({ do: 'start' }).then(function (nv) { if (!nv) return; v = nv; hideGo(); showCards(v.trick); });
    }
    function showCards(t) {
      busy = true;
      items.forEach(function (b, i) { face(b, t.layout[i]); b.classList.add('flip'); });
      var seq = wait(300);
      for (var s = Math.round(t.showMs / 1000); s > 0; s--) {
        (function (s) { seq = seq.then(function () { setSay('Remember… ' + s, ''); return wait(1000); }); })(s);
      }
      seq.then(function () { items.forEach(function (b) { b.classList.remove('flip'); }); return wait(450); })
        .then(function () { items.forEach(function (b) { face(b, null); }); return send({ do: 'ask' }); }) // расклад убираем и из DOM
        .then(function (nv) { if (!nv) return; v = nv; busy = false; askCards(); });
    }
    function askCards() {
      markMisses(); enablePick();
      setSay((v.misses.length ? 'Not that one. One more try, worth 1 point.<br>' : '') + 'Where was ' + SYM[v.trick.ask].name + symIcon(v.trick.ask) + '?', 'Tap a card.');
    }

    function startRiddle() {
      busy = true;
      send({ do: 'start' }).then(function (nv) { if (!nv) return; v = nv; busy = false; hideGo(); clues(false); enablePick(); });
    }
    function clues(missed) {
      setSay((missed ? 'Not there. One more try, worth 1 point.' : 'Where is the chip? ' + who() + '’s clues:') +
        '<br><ol><li>' + v.trick.clues.map(clueText).join('</li><li>') + '</li></ol>',
        '“Left” means anywhere to the left, not only right next to it.');
    }

    function pick(b) {
      var slot = slotOf[Number(b.getAttribute('data-i'))], prev = v;
      busy = true; lockAll();
      send({ do: 'pick', slot: slot }).then(function (nv) {
        if (!nv) { enablePick(); return; }
        v = nv;
        if (nv.gains.length === prev.gains.length) { // мимо, есть вторая попытка
          busy = false;
          if (prev.trick.type === 'cards') askCards();
          else { b.classList.add('lift', 'miss'); enablePick(); if (prev.trick.type === 'riddle') clues(true); else setSay('Not there. One more try, worth 1 point.', 'Tap another hat.'); }
          return;
        }
        reveal(prev.trick, nv.last, b);
      });
    }
    function reveal(t, last, b) {
      mode = '';
      var gain = last.gain;
      if (t.type === 'cards') {
        items.forEach(function (x, i) { face(x, last.layout[i]); x.classList.add('flip'); });
        itemAt(last.answer).classList.add('right');
        if (!gain) b.classList.add('miss');
      } else {
        if (!gain) b.classList.add('lift', 'miss');
        var a = itemAt(last.answer); a.classList.remove('miss'); a.classList.add('lift', 'chip');
      }
      dots();
      if (opts.onRound) opts.onRound(v, gain, a || itemAt(last.answer));
      setSay(gain ? '<span class="sg-gain">+' + gain + ' ' + (gain === 1 ? 'point' : 'points') + '</span> · ' + (last.tries === 1 ? 'Clean, first try!' : 'Got it on the second try.')
                  : who() + ' was quicker this time. No points.',
             'This act: ' + v.points + ' of ' + v.of * 3 + ' points.');
      busy = false;
      if (v.phase === 'done') setGo('See my rocket', function () { if (opts.onDone) opts.onDone(v); });
      else setGo('Next round', setupRound);
    }
    function summary() {
      head(v.of - 1); felt.innerHTML = ''; items = [];
      setSay('Act ' + roman(v.act) + ' complete: <span class="sg-gain">' + v.points + ' of ' + v.of * 3 + ' points</span>.', 'Every point makes your rocket bigger.');
      setGo('Back to the show', function () { if (opts.onDone) opts.onDone(v); });
    }

    return {
      load: function (attempt) { v = attempt.view; busy = false; setupRound(); },
      destroy: function () { dead = true; timers.forEach(clearTimeout); removeEventListener('resize', onResize); root.innerHTML = ''; }
    };
  }

  return { mount: mount, clueText: clueText };
})();
