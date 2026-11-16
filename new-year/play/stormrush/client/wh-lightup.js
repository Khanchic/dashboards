// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js,
// shared/grid.js, street.js и lightup-game.js. Хаб: <div id="lightup" class="panel" hidden></div>; ассеты — /assets/stormrush/*.
// Если общий слой поменяет контракт WH, менять только этот файл: игра (lightup-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;
  var ASSETS = { golem: '../../stormrush/assets/stormrush/golem-battery.png' };

  function sync(c, a) {
    var panel = WH.$('#lightup');
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) return;   // опрос хаба каждые несколько секунд — игру не пересоздаём
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = LightUp.mount(panel, {
      assets: ASSETS,
      move: function (input) { return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; }); },
      onDone: function () { var att = WH.st.attempt; game.destroy(); game = null; WH.finishWith(att, '#lightup', false); WH.load(); }
    });
    game.load(a);
  }

  WH.register({
    id: 'lightup',
    mechanics: ['lightup'],
    panel: '#lightup',
    logTitle: 'This house',
    rules: function () {
      return 'Tap a piece of wire to turn it. When the power from Golem\'s battery reaches every bulb, the house lights up. ' +
        'No timer, no race. Hints are free.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r && r.solved ? 'Lit!' : 'Still dark'; },
    result: function (r) {
      return {
        title: r && r.solved ? 'The house is lit' : 'Still dark',
        stats: r && r.solved ? [[r.turns, 'Turns'], [(r.hints.golem + r.hints.sparky) || 0, 'Hints']] : [],
        good: Boolean(r && r.solved),
        note: 'You earn a reward at 2, 4 and 6 houses, and when the tree lights up. Hit Claim prize to get your code.'
      };
    }
  });
})();
