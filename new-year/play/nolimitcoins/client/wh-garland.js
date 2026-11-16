// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js,
// shared/garland.js, tree.js и garland-game.js. Хаб: <div id="garland" class="panel" hidden></div>.
// Если общий слой поменяет контракт WH, менять только этот файл: игра (garland-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;

  function sync(c, a) {
    var panel = WH.$('#garland');
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) return; // опрос хаба каждые несколько секунд — игру не пересоздаём
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = GarlandGame.mount(panel, {
      move: function (input) { return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; }); },
      onDone: function () { var att = WH.st.attempt; game.destroy(); game = null; WH.finishWith(att, '#garland', false); WH.load(); }
    });
    game.load(a);
  }

  WH.register({
    id: 'garland',
    mechanics: ['garland'],
    panel: '#garland',
    logTitle: 'This tier',
    rules: function () {
      return 'Drag from light to light to hang the garland. Make one loop that passes through every light once, with no crossings. ' +
        'Any loop that does it counts. No timer, no race. Coiny\'s hints are free.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r && r.solved ? 'Lit!' : 'Still dark'; },
    result: function (r) {
      return {
        title: r && r.solved ? 'The tier is lit' : 'Still dark',
        stats: r && r.solved ? [[r.toggles, 'Moves'], [r.hints || 0, 'Hints']] : [],
        good: Boolean(r && r.solved),
        note: 'You earn a reward at 2, 4 and 6 tiers, and for the Infinity Star. Hit Claim prize to get your code.'
      };
    }
  });
})();
