/*
 * Карта горы: лагеря троп по склону Килиманджаро (фон — assets/bg-kilimanjaro.jpg), вершина с ёлкой.
 * Mountain.render(el, levels, { current, onOpen, bg })  levels — из /api/me (id, n, title, zone, status, can, summit, training)
 * Mountain.cheer(el, id) — вспышка на только что пройденной тропе.
 */
(function (root) {
  // Точки на картинке (проценты), снизу вверх: базовый лагерь в саванне → ... → вершина
  var SPOT = {
    practice: [11, 86], t1: [27, 76], t2: [44, 68], t3: [62, 60], t4: [70, 49],
    t5: [56, 43], t6: [40, 37], summit: [48.5, 27]
  };
  var ORDER = ['practice', 't1', 't2', 't3', 't4', 't5', 't6', 'summit'];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render(el, levels, opts) {
    opts = opts || {};
    var byId = {}; levels.forEach(function (l) { byId[l.id] = l; });
    var pts = ORDER.filter(function (id) { return byId[id]; }).map(function (id) { return SPOT[id]; });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    var done = ORDER.filter(function (id) { return byId[id] && byId[id].status === 'clear'; });
    var html = '<div class="mt" style="background-image:url(' + (opts.bg || '/assets/bg-kilimanjaro.jpg') + ')">' +
      '<svg class="mt-path" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + path + '"/></svg>';
    ORDER.forEach(function (id) {
      var L = byId[id]; if (!L) return;
      var s = SPOT[id];
      var locked = L.status === 'new' && L.can && !L.can.ok;
      var cls = 'mt-node ' + L.status + (locked ? ' locked' : '') + (L.summit ? ' summit' : '') + (L.training ? ' practice' : '') + (opts.current === id ? ' cur' : '');
      var icon = L.status === 'clear' ? (L.summit ? '🎄' : '✓') : locked ? '🔒' : L.summit ? '★' : L.training ? '🐾' : L.n;
      html += '<button type="button" class="' + cls + '" data-id="' + id + '" style="left:' + s[0] + '%;top:' + s[1] + '%">' +
        '<b>' + icon + '</b><span>' + esc(L.summit ? 'Summit' : L.training ? 'Practice' : L.title) + '<small>' + esc(L.zone) + '</small></span></button>';
    });
    html += '<div class="mt-count">' + done.filter(function (id) { return /^t\d$/.test(id); }).length + ' / 6 trails</div></div>';
    el.innerHTML = html;
    Array.prototype.forEach.call(el.querySelectorAll('.mt-node'), function (b) {
      b.onclick = function () { if (opts.onOpen) opts.onOpen(b.getAttribute('data-id'), byId[b.getAttribute('data-id')]); };
    });
  }

  function cheer(el, id) {
    var b = el.querySelector('.mt-node[data-id="' + id + '"]');
    if (!b) return;
    b.classList.add('cheer');
    setTimeout(function () { b.classList.remove('cheer'); }, 1600);
  }

  root.Mountain = { render: render, cheer: cheer, SPOT: SPOT };
})(typeof window !== 'undefined' ? window : this);
