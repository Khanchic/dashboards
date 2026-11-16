/**
 * Ёлка игрока: 6 ярусов сверху вниз (1 — верхушка), звезда ∞ над ёлкой, тренировочный шар сбоку.
 *   GarlandTree.render(el, levels, { current, onOpen(id, level) })
 * levels — из /api/me: { id, n, title, status: new|active|lit|expired, can: { ok, error, opensAt, need } }.
 */
(function () {
  'use strict';
  var COLORS = ['#FDC010', '#00B4EB', '#EB1F6A', '#8B3BD1'];
  var W = 320, TOP = 70, H = 52;

  function tierPath(n) { // трапеция яруса n (1..6)
    var y0 = TOP + (n - 1) * (H - 8), y1 = y0 + H;
    var tw = 18 + (n - 1) * 17, bw = 46 + (n - 1) * 20, cx = W / 2;
    return { d: 'M' + (cx - tw) + ' ' + y0 + ' L' + (cx + tw) + ' ' + y0 + ' L' + (cx + bw) + ' ' + y1 + ' L' + (cx - bw) + ' ' + y1 + ' Z', y0: y0, y1: y1, tw: tw, bw: bw };
  }
  function lights(n, lit) { // гирлянда-провис на ярусе
    var t = tierPath(n), cx = W / 2, y = t.y1 - 12, half = t.bw - 12, k = 4 + n, out = '';
    var pts = [];
    for (var i = 0; i <= k; i++) { var x = cx - half + (2 * half) * i / k; pts.push([x, y - Math.sin(Math.PI * i / k) * -6]); }
    out += '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + '" class="gt-wire' + (lit ? ' lit' : '') + '"/>';
    pts.forEach(function (p, i) { out += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (lit ? 4.2 : 3) + '" class="gt-dot' + (lit ? ' lit' : '') + '" style="' + (lit ? 'fill:' + COLORS[(i + n) % 4] + ';--d:' + (i * 0.12).toFixed(2) + 's' : '') + '"/>'; });
    return out;
  }
  var INF = 'M-22 0 C-22 -14 -6 -14 0 0 C6 14 22 14 22 0 C22 -14 6 -14 0 0 C-6 14 -22 14 -22 0 Z';
  var when = function (ms) { return new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }); };

  function render(root, levels, o) {
    o = o || {};
    var byId = {}; levels.forEach(function (l) { byId[l.id] = l; });
    var bottom = tierPath(6).y1;
    var svg = '<svg class="gt-svg" viewBox="0 0 ' + W + ' ' + (bottom + 40) + '" role="img" aria-label="Your Christmas tree">';
    svg += '<rect x="' + (W / 2 - 14) + '" y="' + bottom + '" width="28" height="30" rx="3" class="gt-trunk"/>';
    for (var n = 6; n >= 1; n--) {
      var L = byId['g' + n], t = tierPath(n);
      var st = L.status === 'lit' ? 'lit' : (L.can && L.can.ok) || L.status === 'active' ? 'open' : 'locked';
      svg += '<g class="gt-tier ' + st + (o.current === L.id ? ' cur' : '') + '" data-id="' + L.id + '" tabindex="0" role="button" aria-label="' + L.title + ', ' + st + '">';
      svg += '<path d="' + t.d + '" class="gt-shape"/>' + lights(n, st === 'lit');
      svg += '<text x="' + (W / 2) + '" y="' + (t.y0 + H / 2 + 2) + '" class="gt-num">' + n + '</text></g>';
    }
    var S = byId.star, sst = S.status === 'lit' ? 'lit' : (S.can && S.can.ok) || S.status === 'active' ? 'open' : 'locked';
    svg += '<g class="gt-star ' + sst + (o.current === 'star' ? ' cur' : '') + '" data-id="star" tabindex="0" role="button" aria-label="Infinity Star, ' + sst + '" transform="translate(' + W / 2 + ' 40)">';
    svg += '<circle r="30" class="gt-halo"/><path d="' + INF + '" class="gt-inf"/></g>';
    var P = byId.practice, pst = P.status === 'lit' ? 'lit' : 'open';
    svg += '<g class="gt-bauble ' + pst + (o.current === 'practice' ? ' cur' : '') + '" data-id="practice" tabindex="0" role="button" aria-label="Practice bauble" transform="translate(42 132)">';
    svg += '<line x1="0" y1="-26" x2="0" y2="-14" class="gt-string"/><circle r="15" class="gt-ball"/><text y="34" class="gt-cap">practice</text></g>';
    svg += '</svg>';

    // подпись под ёлкой: что откроется и когда
    var note = '';
    var lock = levels.filter(function (l) { return l.status === 'new' && l.can && !l.can.ok; });
    var nx = lock.filter(function (l) { return l.can.error === 'not_open'; }).sort(function (a, b) { return a.can.opensAt - b.can.opensAt; })[0];
    if (S.status === 'new' && S.can && S.can.error === 'need_tiers') note = 'Light ' + S.can.need + ' more ' + (S.can.need === 1 ? 'tier' : 'tiers') + ' to unlock the Infinity Star.';
    else if (nx) note = (nx.star ? 'The Infinity Star' : nx.id === 'practice' ? 'Practice' : 'Next tiers') + ' open ' + when(nx.can.opensAt) + '.';
    root.innerHTML = '<div class="gt">' + svg + (note ? '<p class="gt-note">' + note + '</p>' : '') + '</div>';

    root.querySelectorAll('[data-id]').forEach(function (g) {
      var go = function () { o.onOpen && o.onOpen(g.getAttribute('data-id'), byId[g.getAttribute('data-id')]); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  window.GarlandTree = { render: render };
})();
