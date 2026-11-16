// Общее для страницы ивента: утилиты, реестр игр и помощники, которыми пользуются файлы игр (public/games/*.js).
// Порядок загрузки: hub-core.js → games/*.js (регистрируются) → hub.js (страница: опрос сервера, панели, итог).
// hub.js дописывает в WH живые части страницы: st, game, hall, api, move, load, flash, handleError, showResult, now.
//
// Игра — объект, который передаётся в WH.register:
//   id, mechanics: [...]          какие механики сервера она показывает
//   panel: '#id'                  её панель в нижнем доке (видна только во время попытки)
//   logTitle                      заголовок журнала слева внизу
//   rules(params, mechanic)       текст правил в левой панели
//   sync(contest, attempt)        состояние с сервера → экран (вызывается после каждого опроса)
//   doneText(result, mechanic)    строка итога в доке после попытки (место дописывает hub.js)
//   result(result, view, mech)    экран итога: { title, stats: [[значение, подпись], …], good, note, reveal }
//   необязательно: info(contest), puzzle(mechanic) — нужны ли барабаны сейфа в 3D, off() — игра больше не текущая,
//   key(event) — клавиатура (вернуть true, если клавиша обработана), dialClick(i) — клик по барабану в 3D.
window.WH = (function () {
  'use strict';
  var WH = { games: {}, byMech: {} };
  var TZ = 'America/New_York';

  WH.$ = function (s) { return document.querySelector(s); };
  // для таймеров, которые обновляются каждый кадр: текст меняем, только если он другой (иначе лишний пересчёт вёрстки)
  WH.setText = function (s, v) { var el = WH.$(s); if (el && el.textContent !== v) el.textContent = v; };
  WH.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  WH.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : many); };
  WH.timeEt = function (ms, short) {
    var o = { timeZone: TZ, hour: 'numeric' };
    if (!short) o.minute = '2-digit';
    return new Date(ms).toLocaleTimeString('en-US', o);
  };
  WH.clockText = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? h + ':' + mm + ':' + ss : mm + ':' + ss;
  };
  WH.roman = function (n) {
    var map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], out = '';
    map.forEach(function (p) { while (n >= p[0]) { out += p[1]; n -= p[0]; } });
    return out;
  };

  WH.register = function (game) {
    WH.games[game.id] = game;
    game.mechanics.forEach(function (m) { WH.byMech[m] = game; });
  };
  WH.gameFor = function (mechanic) { return WH.byMech[mechanic] || null; };

  // ---------- журнал слева внизу ----------
  WH.logEmpty = function (text, long) {
    var log = WH.$('#log');
    log.classList.toggle('long', Boolean(long));
    log.innerHTML = '<li class="empty">' + text + '</li>';
  };
  // строки «подпись — значение» (прогресс игр без списка ходов)
  WH.logRows = function (rows) {
    var log = WH.$('#log');
    log.classList.remove('long');
    log.innerHTML = rows.map(function (r) { return '<li><span class="n"></span><span>' + r[0] + '</span><span class="pegs">' + r[1] + '</span></li>'; }).join('');
  };

  // ---------- общие действия игр ----------
  WH.lost = function () { WH.flash('Connection lost. Try again.'); };
  // Попытка закончена: спрятать панель игры, при удаче открыть сейф в 3D, затем подтянуть места и показать итог
  WH.finishWith = function (a, panel, unlock) {
    WH.game.endShown = true;
    if (panel) WH.$(panel).hidden = true;
    var after = function () { WH.load().then(function () { WH.showResult(WH.st.attempt || a); }); };
    if (unlock) WH.hall.unlock(after); else after();
  };
  // Новый конкурс (или раунд финала) для этой игры: сбросить общее состояние экрана
  WH.fresh = function (c, extra) {
    var g = WH.game;
    if (g.key === c.id) return false;
    g.key = c.id; g.view = null; g.endShown = false;
    WH.hall.closeVault();
    if (extra) extra(g);
    return true;
  };

  return WH;
})();
