// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js,
// shared/picross.js, city.js и tag-game.js. Хаб: <div id="tagwall" class="panel" hidden></div>.
// Если общий слой поменяет контракт WH, менять только этот файл: игра (tag-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;

  function sync(c, a) {
    var panel = WH.$('#tagwall');
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) return;   // опрос хаба каждые несколько секунд — игру не пересоздаём
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = TagWall.mount(panel, {
      move: function (input) { return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; }); },
      onDone: function () { var att = WH.st.attempt; game.destroy(); game = null; WH.finishWith(att, '#tagwall', false); WH.load(); }
    });
    game.load(a);
  }

  WH.register({
    id: 'tagwall',
    mechanics: ['tagwall'],
    panel: '#tagwall',
    logTitle: 'This wall',
    rules: function () {
      return 'The numbers on the edges tell you how many squares to paint in a row, in order, with a gap between groups. ' +
        'Paint the right squares and the wall lights up neon. No timer, no race. Hints are free.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r && r.solved ? 'Tagged: ' + r.name : 'Still grey'; },
    result: function (r) {
      return {
        title: r && r.solved ? 'Wall tagged · ' + r.name : 'Still grey',
        stats: r && r.solved ? [[r.hints || 0, 'Hints']] : [],
        good: Boolean(r && r.solved),
        note: 'You earn a reward at 2, 4 and 6 walls, and for the mural. Hit Claim prize to get your code.'
      };
    }
  });
})();
