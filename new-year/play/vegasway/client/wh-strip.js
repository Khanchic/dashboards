// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js и strip-game.js.
// Хаб: <div id="strip" class="panel" hidden></div> в нижнем доке; ассеты маскотов — /assets/vegasway/*.png (поправить под общий слой).
// Если общий слой поменяет контракт WH, менять только этот файл: сама игра (strip-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;
  var ASSETS = { magician: '../../vegasway/assets/vegasway/magician.png', harlequin: '../../vegasway/assets/vegasway/harlequin.png' };
  var TYPE = { shell: 'Follow the chip under the hats', cards: 'Remember where the cards were', riddle: 'Solve the riddle with the clues' };

  function sync(c, a) {
    var panel = WH.$('#strip');
    // опрос хаба приходит каждые несколько секунд: игру пересоздаём только при смене конкурса или первой попытке
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) return;
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = StripGame.mount(panel, {
      assets: ASSETS,
      move: function (input) {
        return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; });
      },
      onRound: function () { WH.load(); }, // очки и ракета в шапке хаба обновятся
      onDone: function () {
        var att = WH.st.attempt; game.destroy(); game = null;
        WH.finishWith(att, '#strip', false);
      }
    });
    game.load(a);
  }

  WH.register({
    id: 'strip',
    mechanics: ['stripact'],
    panel: '#strip',
    logTitle: 'This act',
    rules: function (p) {
      return 'Three rounds. Two tries per round: 3 points for the first, 1 for the second. Speed does not matter. ' +
        'Your points from all six acts decide your rocket and your prize.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r.points + ' of 9 points' + (r.partial ? ' (' + r.gains.length + ' of 3 rounds)' : ''); },
    result: function (r) {
      return {
        title: r.points + ' of 9 points',
        stats: [[r.gains.map(function (g) { return g ? '+' + g : '0'; }).join(' · '), 'Rounds'], [r.points, 'Points']],
        good: r.points > 0,
        note: 'Every point makes your rocket bigger. The salute and your prize open at midnight ET.'
      };
    },
    info: function (c) { return c && c.params ? TYPE[c.params.type] || '' : ''; }
  });
})();
