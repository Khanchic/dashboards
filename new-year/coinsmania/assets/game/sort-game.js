// Экран одной банки Coin Sort (CoinsMania · Merry Coinsmas). Не зависит от хаба: хаб/стенд даёт move(input) → Promise
// с { attempt } или { error, attempt }, и onDone(). Нужен shared/coins.js (window.Coins).
// Ход применяется у себя сразу (те же правила, что на сервере), сервер подтверждает; при расхождении — берём его вид.
(function (root) {
  'use strict';
  var C = root.Coins;

  // Цвет → символ: цвет различим и без цвета (дальтонизм). viewBox 0 0 20 20, белая заливка поверх монеты.
  var SYM = [
    '<polygon points="10,2.5 12.2,7.4 17.5,7.8 13.4,11.2 14.7,16.4 10,13.6 5.3,16.4 6.6,11.2 2.5,7.8 7.8,7.4"/>',               // 0 gold · star
    '<path d="M10 16.5 3.6 10.3A3.7 3.7 0 0 1 10 5.6a3.7 3.7 0 0 1 6.4 4.7z"/>',                                                    // 1 pink · heart
    '<polygon points="10,2.5 14.5,8.5 12.3,8.5 16,13.5 11.2,13.5 11.2,17 8.8,17 8.8,13.5 4,13.5 7.7,8.5 5.5,8.5"/>',                 // 2 green · tree
    '<g stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M10 3v14M3.9 6.5l12.2 7M3.9 13.5l12.2-7"/></g>',            // 3 blue · snowflake
    '<path d="M10 3.2c-3 0-4.6 2.4-4.6 5.4v3.2L4 14h12l-1.4-2.2V8.6c0-3-1.6-5.4-4.6-5.4zM8.3 15a1.7 1.7 0 0 0 3.4 0z"/>',           // 4 red · bell
    '<polygon points="10,2.5 16.5,10 10,17.5 3.5,10"/>',                                                                            // 5 purple · diamond
    '<path d="M12.5 3a7 7 0 1 0 4.5 11.4A6 6 0 0 1 12.5 3z"/>',                                                                     // 6 silver · moon
    '<path d="M4 8h12v8.5H4zM3 5.5h14V8H3zM9 5.5h2v11H9z"/>',                                                                       // 7 orange · gift
    '<g fill="none" stroke="#fff" stroke-width="2.2"><circle cx="10" cy="10" r="5.6"/></g>'                                          // 8 cyan · ring
  ];
  function coinHtml(c, extra) {
    return '<span class="cs-coin cs-c' + c + (extra || '') + '"><svg viewBox="0 0 20 20" fill="#fff" aria-hidden="true">' + SYM[c % SYM.length] + '</svg></span>';
  }

  var TALK = {
    start: 'Tap a jar to pick up its top coins, then tap where they go. Same color on same color, or into an empty jar.',
    stuck: 'No moves left. Undo a few steps or start over, your hints still work.',
    hint: 'Try this one ↓',
    rewound: function (n) { return 'That path was a dead end, so I rolled back ' + n + ' move' + (n > 1 ? 's' : '') + '. Now try this ↓'; },
    noHints: 'No hints left for this jar. Undo is free though!',
    solved: 'Sorted! Coins are flying into your piggy 🐷'
  };

  function mount(panel, opts) {
    var el = document.createElement('div');
    el.className = 'cs';
    el.innerHTML =
      '<div class="cs-head"><div><b class="cs-title"></b> <small class="cs-size"></small></div><div class="cs-count"></div></div>' +
      '<div class="cs-talk" aria-live="polite"></div>' +
      '<div class="cs-jars" role="group"></div>' +
      '<div class="cs-tools">' +
      '<button type="button" class="cs-btn" data-do="undo">↶ Undo</button>' +
      '<button type="button" class="cs-btn" data-do="restart">⟲ Start over</button>' +
      '<button type="button" class="cs-btn cs-hint" data-do="hint">💡 Hint <span></span></button>' +
      '</div>';
    panel.innerHTML = '';
    panel.appendChild(el);
    var $ = function (s) { return el.querySelector(s); };

    var view = null, jars = null, sel = -1, queue = Promise.resolve(), pending = 0, dead = false, doneFired = false, hintMark = null;

    function say(t) { $('.cs-talk').textContent = t || ''; }

    function render() {
      if (!view) return;
      $('.cs-title').textContent = view.title;
      $('.cs-size').textContent = view.colors + ' colors';
      $('.cs-count').textContent = view.pours + ' pour' + (view.pours === 1 ? '' : 's');
      $('.cs-hint span').textContent = '(' + view.hintsLeft + ')';
      el.classList.toggle('cs-golden', view.golden);
      el.classList.toggle('cs-solved', view.solved);
      var html = '';
      for (var i = 0; i < jars.length; i++) {
        var j = jars[i];
        var run = i === sel ? C.runLen(j) : 0;
        var full = j.length === view.cap && C.uniform(j);
        var cls = 'cs-jar' + (i === sel ? ' sel' : '') + (full ? ' full' : '') +
          (hintMark && hintMark.from === i ? ' hint-from' : '') + (hintMark && hintMark.to === i ? ' hint-to' : '');
        html += '<button type="button" class="' + cls + '" data-i="' + i + '" style="--cap:' + view.cap + '" aria-label="Jar ' + (i + 1) + ', ' + j.length + ' coins">';
        for (var k = 0; k < j.length; k++) html += coinHtml(j[k], k >= j.length - run ? ' lift' : '');
        html += '</button>';
      }
      var box = $('.cs-jars');
      box.style.setProperty('--cols', jars.length <= 7 ? jars.length : Math.ceil(jars.length / 2)); // ровные ряды
      box.innerHTML = html;
      var busy = view.solved || dead;
      $('[data-do=undo]').disabled = busy || !view.canUndo;
      $('[data-do=restart]').disabled = busy || !view.canUndo;
      $('[data-do=hint]').disabled = busy || view.hintsLeft < 1;
    }

    function fromServer(a) {
      if (!a || !a.view) return;
      view = a.view;
      if (!pending) { jars = C.clone(view.jars); }
      if (view.solved && !doneFired) {
        doneFired = true; sel = -1; jars = C.clone(view.jars); render(); say(TALK.solved);
        setTimeout(function () { if (!dead && opts.onDone) opts.onDone(); }, 1500);
        return;
      }
      if (!pending && view.stuck) say(TALK.stuck);
      render();
    }

    function send(input) {
      pending += 1;
      queue = queue.then(function () {
        return opts.move(input).then(function (r) {
          pending -= 1;
          if (dead || !r) return r;
          if (r.error && r.attempt) { pending = 0; sel = -1; hintMark = null; jars = C.clone(r.attempt.view.jars); }
          if (r.attempt) fromServer(r.attempt);
          return r;
        }, function () { pending -= 1; });
      });
      return queue;
    }

    function tap(i) {
      if (!view || view.solved) return;
      if (sel < 0) {
        if (!jars[i].length) return;
        sel = i; render(); return;
      }
      if (sel === i) { sel = -1; render(); return; }
      var from = sel;
      var n = C.pour(jars, view.cap, from, i);
      if (!n) {
        // не влезает — выбираем эту банку, если в ней есть монеты
        sel = jars[i].length ? i : -1;
        var b = $('.cs-jar[data-i="' + i + '"]');
        render();
        b = $('.cs-jar[data-i="' + i + '"]');
        if (b && sel < 0) { b.classList.add('nope'); setTimeout(function () { b.classList.remove('nope'); }, 350); }
        return;
      }
      sel = -1; hintMark = null;
      view.pours += 1; view.canUndo = true;
      say(C.isDone(jars, view.cap) ? '' : C.hasMoves(jars, view.cap) ? '' : TALK.stuck);
      render();
      var dst = $('.cs-jar[data-i="' + i + '"]');
      if (dst) dst.classList.add('drop');
      send({ do: 'pour', from: from, to: i });
    }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('.cs-jar');
      if (b) { tap(Number(b.dataset.i)); return; }
      var t = e.target.closest('[data-do]');
      if (!t || t.disabled) return;
      var what = t.dataset.do;
      sel = -1; hintMark = null;
      if (what === 'restart' && !confirm('Start this jar over? Your hints stay used.')) return;
      if (what === 'hint') {
        send({ do: 'hint' }).then(function (r) {
          if (!r || dead) return;
          if (r.error === 'no_hints') { say(TALK.noHints); return; }
          var h = r.attempt && r.attempt.hint;
          if (h) { hintMark = h; say(h.rewound ? TALK.rewound(h.rewound) : TALK.hint); render(); }
        });
        return;
      }
      say('');
      send({ do: what });
    });

    return {
      load: function (a) { fromServer(a); if (view && !view.solved) say(view.stuck ? TALK.stuck : view.pours ? '' : TALK.start); },
      destroy: function () { dead = true; if (el.parentNode) el.parentNode.removeChild(el); }
    };
  }

  root.CoinSort = { mount: mount, coinHtml: coinHtml, SYM: SYM };
})(typeof self !== 'undefined' ? self : this);
