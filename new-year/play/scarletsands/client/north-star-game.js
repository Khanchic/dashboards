/**
 * Экран The North Star Expedition (Scarlet Sands). Не зависит от хаба: всё состояние приходит с сервера (view модуля
 * 'northstar'), каждый пин — ход move({ do:'pin', target, cell }). Ответов клиент не знает.
 *   const g = NorthStar.mount(panel, { move, assets: { cat }, onChange });  g.load(attempt);  g.destroy();
 * Тексты — английские, как увидят игроки.
 */
(function (root) {
  'use strict';
  var COLS = 'ABCDEFGHIJKL', CELL = 100, OX = 40, OY = 40, INK = '#4A1A0C', RED = '#B4002E';
  var NAMES = { camp: 'Camp', obelisk: 'Broken Obelisk', well: 'Scarab Well', temple: 'Sunken Temple', dunes: 'Twin Dunes',
    cactus: 'Cactus Gate', lake: 'Dry Lake', sphinx: 'Sphinx Rock', caravan: 'Old Caravan', pyramid: 'Little Pyramid' };
  var CH_TIME = ['11 AM', '3 PM', '7 PM'], TIER = ['', 'easy', 'medium', 'tricky'];
  var HEAT = { hot: ['Hot', 'right next to it (diagonals count)'], warm: ['Warm', '2–3 squares away'], cold: ['Cold', 'more than 3 squares away'] };
  var PIN = { hit: '#DB0037', hot: '#DB0037', warm: '#C77B1E', cold: '#3B5BA9', miss: '#4A1A0C' };
  var ERR = {
    not_open: 'This page is not open yet.', not_released: 'Saffron hasn\'t shown up yet. Watch the Watchers chat.',
    need_stamps: 'The oasis needs 4 stamps.', need_finds: 'Close finds 1 and 3 first: the oasis is counted from them.',
    need_all: 'The Golden Compass is only for explorers who found everything themselves.', lost: 'The Golden Compass is out of reach this time.',
    same_cell: 'You already tried that square.', target_finished: 'This one is finished.', closed: 'The expedition is over.',
    too_fast: 'Easy, explorer. One pin at a time.', bad_cell: 'That square is not on the map.'
  };
  var at = function (id) { return [COLS.indexOf(id[0]), +id.slice(1) - 1]; };
  var cxy = function (id) { var a = at(id); return [OX + a[0] * CELL + 50, OY + a[1] * CELL + 50]; };
  var inGrid = function (c, r) { return c >= 0 && c < 12 && r >= 0 && r < 9 && !(c >= 10 && r <= 1); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function icon(k, x, y) {
    switch (k) {
      case 'camp': return '<path d="M' + (x - 30) + ' ' + (y + 22) + 'L' + x + ' ' + (y - 24) + 'L' + (x + 30) + ' ' + (y + 22) + 'Z" fill="#E4B473" stroke="' + INK + '" stroke-width="3"/><path d="M' + x + ' ' + (y - 24) + 'L' + (x - 6) + ' ' + (y + 22) + '" stroke="' + INK + '" stroke-width="2"/><path d="M' + (x + 36) + ' ' + (y + 22) + 'q4 -16 10 -6q4 -14 8 0q2 8 -18 6z" fill="' + RED + '"/>';
      case 'obelisk': return '<path d="M' + (x - 12) + ' ' + (y + 28) + 'L' + (x - 8) + ' ' + (y - 30) + 'L' + (x + 6) + ' ' + (y - 20) + 'L' + (x + 2) + ' ' + (y - 12) + 'L' + (x + 12) + ' ' + (y + 28) + 'Z" fill="#D9AF6E" stroke="' + INK + '" stroke-width="3"/>';
      case 'well': return '<ellipse cx="' + x + '" cy="' + (y + 10) + '" rx="26" ry="10" fill="#6b3a1c" stroke="' + INK + '" stroke-width="3"/><path d="M' + (x - 26) + ' ' + (y + 10) + 'v-12M' + (x + 26) + ' ' + (y + 10) + 'v-12M' + (x - 30) + ' ' + (y - 2) + 'h60" stroke="' + INK + '" stroke-width="3" fill="none"/><ellipse cx="' + x + '" cy="' + (y - 18) + '" rx="7" ry="9" fill="' + INK + '"/>';
      case 'temple': return '<path d="M' + (x - 36) + ' ' + (y + 26) + 'h72v-8h-72zM' + (x - 30) + ' ' + (y + 18) + 'v-30M' + (x - 12) + ' ' + (y + 18) + 'v-30M' + (x + 12) + ' ' + (y + 18) + 'v-30M' + (x + 30) + ' ' + (y + 18) + 'v-30M' + (x - 38) + ' ' + (y - 12) + 'h76L' + x + ' ' + (y - 34) + 'Z" fill="#D9AF6E" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case 'dunes': return '<path d="M' + (x - 46) + ' ' + (y + 20) + 'q22 -40 46 0q22 -46 46 0" fill="none" stroke="' + INK + '" stroke-width="3"/>';
      case 'cactus': return [-18, 6].map(function (d) { return '<path d="M' + (x + d) + ' ' + (y + 28) + 'v-48a6 6 0 0 1 12 0v48M' + (x + d) + ' ' + y + 'h-8v-14M' + (x + d + 12) + ' ' + (y - 6) + 'h8v-12" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>'; }).join('');
      case 'lake': return '<ellipse cx="' + x + '" cy="' + (y + 4) + '" rx="44" ry="22" fill="rgba(180,0,46,.08)" stroke="' + INK + '" stroke-width="2" stroke-dasharray="6 6"/>';
      case 'sphinx': return '<path d="M' + (x - 38) + ' ' + (y + 24) + 'h70v-12q-6 -10 -24 -10h-18v-14q0 -16 -14 -16q-14 0 -14 16v36z" fill="#D9AF6E" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case 'caravan': return '<path d="M' + (x - 32) + ' ' + (y + 10) + 'v-12q32 -36 64 0v12z" fill="#EBCB93" stroke="' + INK + '" stroke-width="3"/><rect x="' + (x - 38) + '" y="' + (y + 8) + '" width="76" height="8" fill="#8a5a33" stroke="' + INK + '" stroke-width="2.5"/><circle cx="' + (x - 22) + '" cy="' + (y + 22) + '" r="9" fill="none" stroke="' + INK + '" stroke-width="3"/><circle cx="' + (x + 22) + '" cy="' + (y + 22) + '" r="9" fill="none" stroke="' + INK + '" stroke-width="3"/>';
      case 'pyramid': return '<path d="M' + (x - 36) + ' ' + (y + 26) + 'L' + x + ' ' + (y - 30) + 'L' + (x + 36) + ' ' + (y + 26) + 'Z" fill="#D9AF6E" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case 'oasis': return '<ellipse cx="' + x + '" cy="' + (y + 18) + '" rx="40" ry="14" fill="#3f8fa3" stroke="' + INK + '" stroke-width="2.5"/><path d="M' + (x - 14) + ' ' + (y + 14) + 'q-2 -26 4 -40M' + (x + 14) + ' ' + (y + 14) + 'q2 -22 -6 -34" stroke="' + INK + '" stroke-width="4" fill="none"/><path d="M' + (x - 10) + ' ' + (y - 26) + 'q-22 -2 -30 12M' + (x - 10) + ' ' + (y - 26) + 'q16 -12 30 -2M' + (x + 8) + ' ' + (y - 20) + 'q20 -6 30 8" stroke="#2f6b2a" stroke-width="5" fill="none" stroke-linecap="round"/>';
      case 'golden': return '<circle cx="' + x + '" cy="' + y + '" r="30" fill="#FFE229" stroke="' + INK + '" stroke-width="3"/><path d="M' + x + ' ' + (y - 24) + 'L' + (x + 7) + ' ' + y + 'L' + x + ' ' + (y + 24) + 'L' + (x - 7) + ' ' + y + 'Z" fill="' + RED + '"/>';
      case 'paw': return '<g transform="translate(' + (x - 14) + ' ' + (y + 12) + ') scale(.28)"><ellipse cx="50" cy="60" rx="15" ry="12" fill="' + RED + '"/><circle cx="33" cy="42" r="6" fill="' + RED + '"/><circle cx="44" cy="34" r="6" fill="' + RED + '"/><circle cx="56" cy="34" r="6" fill="' + RED + '"/><circle cx="67" cy="42" r="6" fill="' + RED + '"/></g>';
    }
    return '';
  }

  /** Арт из Flow: assets = { parchment: url, icons: базовый url ('.../icon-<k>.png'), sizes: {k:[w,h]} } (art/process-assets.ps1). */
  function artIcon(assets, k, x, y, box) {
    if (!assets || !assets.icons || !assets.sizes || !assets.sizes[k]) return null;
    var wh = assets.sizes[k], s = box / Math.max(wh[0], wh[1]), w = wh[0] * s, h = wh[1] * s;
    return '<image href="' + assets.icons + 'icon-' + k + '.png" x="' + (x - w / 2).toFixed(1) + '" y="' + (y - h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"/>';
  }
  function baseMap(landmarks, assets) {
    var s = '<rect width="1240" height="940" fill="#EBCB93"/>';
    if (assets && assets.parchment) s += '<image href="' + assets.parchment + '" x="0" y="0" width="1240" height="940" preserveAspectRatio="none"/>';
    else for (var i = 0; i < 9; i++) { var y = 120 + i * 92; s += '<path d="M40 ' + y + ' C 260 ' + (y - 40) + ', 420 ' + (y + 44) + ', 640 ' + y + ' S 1020 ' + (y - 36) + ', 1200 ' + (y + 6) + '" fill="none" stroke="rgba(74,26,12,.13)" stroke-width="2"/>'; }
    for (var c = 0; c <= 12; c++) s += '<line x1="' + (OX + c * CELL) + '" y1="' + OY + '" x2="' + (OX + c * CELL) + '" y2="' + (OY + 900) + '" stroke="rgba(74,26,12,.28)" stroke-dasharray="3 7"/>';
    for (var r = 0; r <= 9; r++) s += '<line x1="' + OX + '" y1="' + (OY + r * CELL) + '" x2="' + (OX + 1200) + '" y2="' + (OY + r * CELL) + '" stroke="rgba(74,26,12,.28)" stroke-dasharray="3 7"/>';
    for (c = 0; c < 12; c++) s += '<text x="' + (OX + c * CELL + 50) + '" y="28" text-anchor="middle" font-family="DM Mono,monospace" font-size="20" fill="' + INK + '" opacity=".7">' + COLS[c] + '</text>';
    for (r = 0; r < 9; r++) s += '<text x="20" y="' + (OY + r * CELL + 57) + '" text-anchor="middle" font-family="DM Mono,monospace" font-size="20" fill="' + INK + '" opacity=".7">' + (r + 1) + '</text>';
    Object.keys(landmarks).forEach(function (k) {
      var p = cxy(landmarks[k]), col = at(landmarks[k])[0];
      var an = col === 0 ? 'start' : col === 11 ? 'end' : 'middle', dx = col === 0 ? -44 : col === 11 ? 44 : 0;
      var img = artIcon(assets, k, p[0], p[1] - 12, 86);
      s += (img || icon(k, p[0], p[1] - 6)) + '<text x="' + (p[0] + dx) + '" y="' + (p[1] + 48) + '" text-anchor="' + an + '" font-family="Caveat,cursive" font-weight="700" font-size="23" fill="' + INK + '" stroke="#F3E2BF" stroke-width="5" stroke-linejoin="round" paint-order="stroke">' + NAMES[k] + '</text>';
    });
    s += '<g transform="translate(1140 150)"><circle r="54" fill="#EBCB93" stroke="' + INK + '" stroke-width="2"/><path d="M0 -62L10 0L0 62L-10 0Z" fill="' + INK + '"/><path d="M-62 0L0 -8L62 0L0 8Z" fill="#D9AF6E" stroke="' + INK + '" stroke-width="2"/><path d="M0 -62L10 0L0 0Z" fill="' + RED + '"/><text y="-72" text-anchor="middle" font-family="Archivo Black,sans-serif" font-size="20" fill="' + RED + '">N</text></g>';
    s += '<g class="ns-route"></g><g class="ns-marks"></g><g class="ns-cells">';
    for (r = 0; r < 9; r++) for (c = 0; c < 12; c++) if (inGrid(c, r)) s += '<rect class="ns-cell" x="' + (OX + c * CELL) + '" y="' + (OY + r * CELL) + '" width="100" height="100" data-id="' + COLS[c] + (r + 1) + '" tabindex="0" role="button" aria-label="Square ' + COLS[c] + (r + 1) + '"/>';
    return s + '</g>';
  }
  function pinSvg(cell, col, head) {
    var p = cxy(cell);
    return '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><path d="M0 2C-4 -10 -16 -18 -16 -32a16 16 0 0 1 32 0C16 -18 4 -10 0 2z" fill="' + col + '" stroke="#2a0d05" stroke-width="2"/><circle cy="-32" r="6" fill="' + head + '"/></g>';
  }
  function dot(cell, label, solid) {
    var p = cxy(cell);
    return solid
      ? '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#DB0037" stroke="#2a0d05" stroke-width="2"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-family="DM Mono,monospace" font-size="13" fill="#FFE229">' + label + '</text>'
      : '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="4 4"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-family="DM Mono,monospace" font-size="13" fill="' + INK + '">' + label + '</text>';
  }

  function mount(panel, opts) {
    var el = document.createElement('div');
    el.className = 'ns';
    el.innerHTML = '<div class="ns-diary"><div class="ns-tabs" role="group" aria-label="Diary pages"></div><div class="ns-date"></div><div class="ns-text"></div><div class="ns-status" aria-live="polite"></div></div>' +
      '<div class="ns-body"><div class="ns-mapbox"><svg class="ns-map" viewBox="0 0 1240 940" role="group" aria-label="Your expedition map"></svg></div>' +
      '<aside class="ns-passport" aria-label="Expedition passport"></aside></div>';
    panel.appendChild(el);
    var $ = function (s) { return el.querySelector(s); };
    var svg = $('.ns-map'), att = null, v = null, cur = null, busy = false, msg = null, mapKey = '';

    function targets() {
      if (!v) return [];
      if (v.mode === 'training') return [{ key: 't', label: 'Practice page', t: v.target, task: v.task }];
      var list = v.tasks.map(function (t) { return { key: t.slot, label: (t.item ? t.item : 'Chapter ' + t.chapter), t: t, ch: t.chapter }; });
      list.push({ key: 'oasis', label: 'Oasis', t: v.oasis });
      v.cats.forEach(function (c, i) { list.push({ key: c.key, label: '🐾 ' + (i + 1), t: c, cat: true }); });
      list.push({ key: 'super', label: '★ Golden Compass', t: v.super });
      return list;
    }
    function find(k) { return targets().filter(function (x) { return x.key === k; })[0]; }
    function pickDefault() {
      var list = targets();
      var open = list.filter(function (x) { return !x.t.lock && !x.t.done && !x.t.revealed; });
      return (open[0] || list[0] || {}).key;
    }

    function renderTabs() {
      $('.ns-tabs').innerHTML = targets().map(function (x, i) {
        var t = x.t, mark = t.done ? ' <span class="ok">✓</span>' : t.revealed ? ' ✗' : t.lock ? ' 🔒' : '';
        var sep = (x.key === 'oasis' || x.key === 'c1' || x.key === 'super') ? '<span class="sep"></span>' : '';
        return sep + '<button type="button" data-k="' + x.key + '" aria-pressed="' + (x.key === cur) + '">' + esc(x.label) + mark + '</button>';
      }).join('');
    }
    function lockText(x) {
      var l = x.t.lock;
      if (!l) return null;
      if (l.why === 'not_open' && x.ch) return 'Chapter ' + x.ch + ' opens on Dec 25 at ' + CH_TIME[x.ch - 1] + ' ET.';
      if (l.why === 'not_open' && x.key === 'oasis') return 'The oasis opens on Dec 26 at 11 AM ET.';
      if (l.why === 'not_released') return 'Saffron hasn\'t shown up yet. His hints appear only in the Watchers chat on the site.';
      if (l.why === 'need_stamps') return 'The oasis opens for you at 4 stamps. ' + l.need + ' to go: finds and paw prints both count.';
      if (l.why === 'need_finds') return 'Close finds ' + l.slots.map(function (s) { return s.slice(1); }).join(' and ') + ' first: the oasis is counted from them.';
      if (l.why === 'need_all') return 'Only for explorers who found everything themselves: finds ' + l.found + '/6, paw prints ' + l.paws + '/4, oasis ' + (l.oasis ? '✓' : '—') + '.';
      if (l.why === 'lost') return 'The Golden Compass is out of reach this time: it needs every find and paw print found without a reveal.';
      if (l.why === 'closed') return 'The expedition is over.';
      return ERR[l.why] || l.why;
    }
    function renderDiary() {
      var x = find(cur); if (!x) return;
      var t = x.t, date = '', text = '';
      if (v.mode === 'training') { date = 'Practice page · no prize'; text = x.task ? x.task.text : ''; }
      else if (x.ch) { date = 'Chapter ' + x.ch + ' · Dec 25 · ' + CH_TIME[x.ch - 1] + ' ET <span class="ns-tier t' + t.tier + '">' + TIER[t.tier] + '</span>'; text = t.text || ''; }
      else if (x.key === 'oasis') { date = 'Dec 26 · from 11 AM ET · 4+ stamps'; text = t.text || ''; }
      else if (x.cat) { date = 'Saffron · drop ' + x.key.slice(1) + ' of 4'; text = t.done ? 'Found him! Paw print in your passport.' : 'Saffron\'s hint is in the <b>Watchers chat</b> on the site. Read it there, then drop your pin here.'; }
      else { date = 'Dec 26 · super game · 2 tries · no hints'; text = t.text || ''; }
      $('.ns-date').innerHTML = date;
      $('.ns-text').innerHTML = text ? (x.cat ? text : '“' + esc(text) + '”') : '';
      var tries = '<span class="ns-tries">' + t.tries + ' / ' + t.max + '</span>', s = '', cls = '';
      var lt = lockText(x);
      if (msg && msg.k === cur) { s = msg.html; cls = msg.cls; }
      else if (lt) s = lt;
      else if (t.done) { s = x.cat ? 'Paw print collected.' : x.key === 'super' ? 'You found the Golden Compass! You\'re in the draw for 50 SC on Dec 27.' : 'Found. Stamp in your passport.'; cls = 'good'; }
      else if (t.revealed) { s = x.cat || x.key === 'super' ? 'No tries left.' : 'No tries left. The spot is marked on your map: no stamp, but it still counts for the oasis.'; cls = 'bad'; }
      else if ((x.task && v.task && v.task.hint) || t.hint) s = 'Margin note: ' + esc(t.hint || v.task.hint);
      else s = x.key === 'super' ? 'Two tries. No hot or cold this time.' : 'Tap the square where the page points.';
      $('.ns-status').className = 'ns-status ' + cls;
      $('.ns-status').innerHTML = tries + '<span>' + s + '</span>';
    }
    function renderMap() {
      var k = JSON.stringify(v.landmarks);
      if (k !== mapKey) { svg.innerHTML = baseMap(v.landmarks, opts.assets); mapKey = k; }
      var big = function (name, cell, dy, box) { var p = cxy(cell); return artIcon(opts.assets, name, p[0], p[1] + dy, box) || icon(name, p[0], p[1] + dy); };
      var s = '', x = find(cur), list = targets();
      list.forEach(function (y) {
        if (y.key === cur || !y.t.cell) return;
        if (y.cat) s += icon('paw', cxy(y.t.cell)[0], cxy(y.t.cell)[1]);
        else if (y.key === 'oasis') s += big('oasis', y.t.cell, -4, 96);
        else if (y.key === 'super') s += big('golden', y.t.cell, 0, 78);
        else if (y.key !== 't') s += dot(y.t.cell, y.key.slice(1), y.t.done);
      });
      if (x) {
        if (x.t.cell && x.key !== 'super' && !x.cat) {
          var p = cxy(x.t.cell);
          if (x.t.revealed) s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="38" fill="none" stroke="#DB0037" stroke-width="3" stroke-dasharray="8 6"/>';
          if (x.key === 'oasis' && x.t.done) s += big('oasis', x.t.cell, -4, 96);
        }
        if (x.key === 'super' && x.t.done) s += big('golden', x.t.cell, 0, 78);
        if (x.cat && x.t.done) s += icon('paw', cxy(x.t.cell)[0], cxy(x.t.cell)[1]);
        x.t.pins.forEach(function (pn) {
          var hit = pn.heat === 'hit' || pn.hit === true;
          if (hit && (x.key === 'oasis' || x.key === 'super' || x.cat)) return;
          s += pinSvg(pn.cell, PIN[pn.heat || (pn.hit ? 'hit' : 'miss')], hit ? '#FFE229' : '#EBCB93');
        });
      }
      svg.querySelector('.ns-marks').innerHTML = s;
      // маршрут: находки по порядку → оазис → Golden Compass
      var r = '';
      if (v.mode === 'expedition' && v.oasis.done) {
        var pts = v.tasks.filter(function (t) { return t.cell; }).map(function (t) { return cxy(t.cell).join(' '); });
        pts.push(cxy(v.oasis.cell).join(' '));
        r = '<path d="M' + pts.join(' L') + '" fill="none" stroke="#DB0037" stroke-width="3.5" stroke-dasharray="10 8" opacity=".7"/>';
        if (v.super.done) r += '<path d="M' + cxy(v.oasis.cell).join(' ') + ' L' + cxy(v.super.cell).join(' ') + '" stroke="#FFE229" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>';
      }
      svg.querySelector('.ns-route').innerHTML = r;
    }
    function renderPassport() {
      if (v.mode === 'training') {
        $('.ns-passport').innerHTML = '<h3>Practice page</h3><p>No prize here. Learn the words: <b>toward the North Star</b> = up, <b>away from the North Star</b> = down, <b>toward sunrise</b> = right, <b>toward sunset</b> = left.</p>' +
          '<button type="button" class="ns-btn" data-do="restart">Try another practice map</button>';
        return;
      }
      var pr = v.progress, stamp = function (t, i) {
        return '<div class="ns-slot' + (t.done ? ' on' : '') + (t.revealed ? ' miss' : '') + '"><span>' + (t.revealed ? '✗' : i) + '</span></div>';
      };
      var tiers = [[pr.stamps >= 3, '3 stamps', '2 FP + 20K GC'], [pr.stamps >= 6, '6 stamps', '3 FP + 30K GC'], [pr.oasis, 'Oasis', '1 SC + 50K GC'], [pr.golden, 'Golden Compass', 'draw for 50 SC']];
      $('.ns-passport').innerHTML = '<h3>Expedition Passport</h3><div class="ns-sub">Stamps: <b>' + pr.stamps + '</b> of 10</div>' +
        '<div class="ns-label">Finds</div><div class="ns-slots">' + v.tasks.map(function (t, i) { return stamp(t, i + 1); }).join('') + '</div>' +
        '<div class="ns-label">Saffron\'s paw prints</div><div class="ns-slots four">' + v.cats.map(function (t, i) { return stamp(t, '🐾'); }).join('') + '</div>' +
        '<div class="ns-big' + (pr.oasis ? ' on' : '') + '">' + (pr.oasis ? '★ Oasis found' : 'Oasis · Dec 26') + '</div>' +
        '<div class="ns-big gold' + (pr.golden ? ' on' : v.superUnlocked ? '' : ' off') + '">' + (pr.golden ? '★ Golden Compass' : v.superUnlocked ? 'Golden Compass is open' : '🔒 Golden Compass') + '</div>' +
        '<ul class="ns-tierlist">' + tiers.map(function (x) { return '<li class="' + (x[0] ? 'on' : '') + '">' + x[1] + ' → <b>' + x[2] + '</b></li>'; }).join('') + '</ul>' +
        '<p class="ns-note">Rewards come with the <b>Claim prize</b> button. Nothing here depends on speed: everything stays open until Dec 26, 11:59 PM ET.</p>';
    }
    function render() {
      if (!v) return;
      if (!find(cur)) cur = pickDefault();
      renderTabs(); renderDiary(); renderMap(); renderPassport();
      if (opts.onChange) opts.onChange(v);
    }
    function feedbackHtml(l) {
      if (!l) return null;
      if (l.hit) return { cls: 'good', html: l.target === 'super' ? l.cell + ': the Golden Compass! You\'re in the draw for 50 SC.' : l.target === 'oasis' ? l.cell + ': the North Star Oasis!' : l.target[0] === 'c' ? l.cell + ': Saffron! Paw print in your passport.' : l.cell + ': found it! Stamp in your passport.' };
      if (l.target === 'super') return { cls: 'bad', html: l.cell + ': nothing here.' };
      var h = HEAT[l.heat];
      return { cls: 'bad', html: '<span class="ns-heat ' + l.heat + '">' + h[0] + '</span> ' + l.cell + ': ' + h[1] + '.' + (l.revealed ? ' That was your last pin.' : '') };
    }
    function act(input) {
      if (busy) return; busy = true;
      opts.move(input).then(function (r) {
        busy = false;
        if (r && r.attempt) { att = r.attempt; v = att.view; }
        if (r && r.error) msg = { k: cur, cls: 'bad', html: ERR[r.error] || lockText({ t: { lock: r.lock || { why: r.error } }, key: cur }) || r.error };
        else if (input.do === 'pin') msg = Object.assign({ k: cur }, feedbackHtml(v.last));
        else msg = null;
        render();
      }, function () { busy = false; msg = { k: cur, cls: 'bad', html: 'Connection hiccup. Try again.' }; render(); });
    }
    function onCell(e) {
      var c = e.target.closest && e.target.closest('.ns-cell'); if (!c || !v) return;
      var x = find(cur); if (!x || x.t.done || x.t.revealed || x.t.lock) { msg = null; render(); return; }
      act({ do: 'pin', target: cur, cell: c.getAttribute('data-id') });
    }
    svg.addEventListener('click', onCell);
    svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCell(e); } });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-k')) { cur = b.getAttribute('data-k'); msg = null; render(); }
      if (b.getAttribute('data-do') === 'restart') act({ do: 'restart' });
    });

    return {
      load: function (a) { att = a; v = a.view; render(); },
      select: function (k) { cur = k; msg = null; render(); },
      view: function () { return v; },
      destroy: function () { el.remove(); }
    };
  }

  root.NorthStar = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
