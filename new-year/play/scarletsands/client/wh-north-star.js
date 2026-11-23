// Обёртка игры для хаба Witching Hours (public/games/*.js → WH.register). Подключать после hub-core.js и north-star-game.js.
// Хаб: <div id="northstar" class="panel" hidden></div>. Если общий слой поменяет контракт WH, менять только этот файл:
// игра (north-star-game.js) от хаба не зависит.
(function () {
  'use strict';
  var game = null, key = null;
  // Арт карты: файлы из scarletsands\assets\map\ положить в хаб как /assets/scarletsands/map/*; размеры — assets\map\icons.json.
  var ASSETS = { parchment: '../../scarletsands/assets/scarletsands/map/parchment.jpg', icons: '../../scarletsands/assets/scarletsands/map/',
    sizes: {"camp":[256,208],"obelisk":[207,256],"well":[202,256],"temple":[256,233],"dunes":[256,131],"cactus":[193,256],"lake":[256,169],"sphinx":[256,187],"caravan":[237,256],"pyramid":[256,197],"oasis":[256,199],"golden":[256,251]} };

  function sync(c, a) {
    var panel = WH.$('#northstar');
    if (!a) { if (game) { game.destroy(); game = null; } key = null; return; }
    var k = c.id + ':' + a.startedAt;
    if (key === k && game) { game.load(a); return; }   // опрос хаба: обновляем замки глав/котов, игру не пересоздаём
    key = k;
    WH.fresh(c);
    if (game) game.destroy();
    panel.hidden = false;
    game = NorthStar.mount(panel, {
      assets: ASSETS,
      move: function (input) { return WH.move(input).then(function (r) { if (r && r.attempt) WH.st.attempt = r.attempt; return r; }); }
    });
    game.load(a);
  }

  WH.register({
    id: 'northstar',
    mechanics: ['northstar'],
    panel: '#northstar',
    logTitle: 'My expedition',
    rules: function () {
      return 'Every explorer has their own map and their own six finds. Read the diary page, tap the square where it points. ' +
        'Three tries per find (three lanterns), with hot and cold after a miss. Saffron\'s hints are in the Watchers chat. No timer, no race.';
    },
    sync: sync,
    off: function () { if (game) { game.destroy(); game = null; } key = null; },
    doneText: function (r) { return r && r.stamps != null ? r.stamps + ' stamps' : 'Practice'; },
    result: function (r) {
      return {
        title: r && r.golden ? 'Golden Compass found' : r && r.oasis ? 'Oasis found' : 'Expedition complete',
        stats: r && r.stamps != null ? [[r.stamps, 'Stamps'], [r.found, 'Finds'], [r.paws, 'Paw prints']] : [],
        good: Boolean(r && r.stamps >= 3),
        note: 'Rewards at 3 and 6 stamps and for the oasis. Hit Claim prize to get your codes. The Golden Compass draw is on Dec 27.'
      };
    }
  });
})();
