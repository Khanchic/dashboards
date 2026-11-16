// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js,
// shared/coins.js, piggy.js и sort-game.js. Хаб: <div id="coinsort" class="panel" hidden></div>.
// Если общий слой поменяет контракт WH, менять только этот файл: игра (sort-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;

  function sync(c, a) {
    var panel = WH.$('#coinsort');
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) return;   // опрос хаба каждые несколько секунд — игру не пересоздаём
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = CoinSort.mount(panel, {
      move: function (input) { return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; }); },
      onDone: function () { var att = WH.st.attempt; game.destroy(); game = null; WH.finishWith(att, '#coinsort', false); WH.load(); }
    });
    game.load(a);
  }

  WH.register({
    id: 'coinsort',
    mechanics: ['coinsort'],
    panel: '#coinsort',
    logTitle: 'This jar',
    rules: function () {
      return 'Tap a jar to pick up its top coins, then tap where they go: onto the same color or into an empty jar. ' +
        'Sort every stack to one color and the coins fly into your piggy. No timer, no race. Undo is free, hints too.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r && r.solved ? 'Sorted in ' + r.pours + ' pours' : 'Still mixed'; },
    result: function (r) {
      return {
        title: r && r.solved ? 'Jar sorted!' : 'Still mixed',
        stats: r && r.solved ? [[r.pours, 'Pours'], [r.hints || 0, 'Hints']] : [],
        good: Boolean(r && r.solved),
        note: 'You earn a reward at 2, 4 and 6 jars, and for the Golden Jar. Hit Claim prize to get your code.'
      };
    }
  });
})();
