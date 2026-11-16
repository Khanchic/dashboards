/**
 * Улица Light Up Christmas: тренировочный дом, 6 домов и ёлка карточками-кнопками (SVG, без картинок).
 *   LightStreet.render(container, levels, { current, onOpen(levelId) })
 *   levels[i] = { id, title, size, tree, training, status: 'new'|'active'|'lit'|'expired', can: { ok, error, need, opensAt } }
 * Стили — street.css.
 */
(function () {
  'use strict';
  var HV = [{ w: 60, h: 36, rh: 26 }, { w: 72, h: 42, rh: 30 }, { w: 64, h: 50, rh: 26 }, { w: 78, h: 38, rh: 34 }, { w: 68, h: 46, rh: 28 }, { w: 74, h: 44, rh: 32 }, { w: 66, h: 52, rh: 24 }];

  function house(v) {
    var V = HV[v] || HV[1], gy = 100, x = (100 - V.w) / 2, yb = gy - V.h, ax = 50, ay = yb - V.rh, s = '';
    s += '<rect class="ls-chim" x="' + (50 + V.w * 0.2) + '" y="' + (yb - V.rh * 0.85) + '" width="8" height="' + (V.rh * 0.7) + '"/>';
    s += '<rect class="ls-body" x="' + x + '" y="' + yb + '" width="' + V.w + '" height="' + V.h + '"/>';
    s += '<polygon class="ls-roof" points="' + (x - 5) + ',' + yb + ' ' + ax + ',' + ay + ' ' + (x + V.w + 5) + ',' + yb + '"/>';
    s += '<polyline class="ls-snow" points="' + (x - 5) + ',' + (yb - 1) + ' ' + ax + ',' + ay + ' ' + (x + V.w + 5) + ',' + (yb - 1) + '"/>';
    for (var b = 0; b < 9; b++) {
      var t = (b + 0.5) / 9, px, py, u;
      if (t < 0.5) { u = t * 2; px = (x - 3) + (ax - (x - 3)) * u; py = (yb + 4) + ((ay + 8) - (yb + 4)) * u; }
      else { u = (t - 0.5) * 2; px = ax + ((x + V.w + 3) - ax) * u; py = (ay + 8) + ((yb + 4) - (ay + 8)) * u; }
      s += '<circle class="ls-bulb c' + (b % 3) + '" cx="' + px.toFixed(1) + '" cy="' + (py + 2).toFixed(1) + '" r="2.4" style="animation-delay:' + (b * 0.21).toFixed(2) + 's"/>';
    }
    var ww = V.w * 0.22, wh = V.h * 0.3, wy = yb + V.h * 0.22;
    s += '<rect class="ls-win" x="' + (x + V.w * 0.12) + '" y="' + wy + '" width="' + ww + '" height="' + wh + '"/>';
    s += '<rect class="ls-win" x="' + (x + V.w * 0.88 - ww) + '" y="' + wy + '" width="' + ww + '" height="' + wh + '"/>';
    s += '<circle class="ls-win" cx="50" cy="' + (yb - V.rh * 0.36) + '" r="3.6"/>';
    s += '<rect class="ls-door" x="44" y="' + (gy - V.h * 0.45) + '" width="12" height="' + (V.h * 0.45) + '"/>';
    s += '<rect class="ls-win" x="46.5" y="' + (gy - V.h * 0.4) + '" width="7" height="4"/>';
    s += '<ellipse class="ls-ground" cx="50" cy="' + (gy + 4) + '" rx="56" ry="7"/>';
    return '<svg viewBox="0 0 100 110" aria-hidden="true">' + s + '</svg>';
  }
  function tree() {
    var s = '<rect class="ls-trunk" x="45" y="90" width="10" height="12"/>';
    s += '<polygon class="ls-tr" points="50,16 24,48 76,48"/><polygon class="ls-tr" points="50,32 16,70 84,70"/><polygon class="ls-tr" points="50,50 8,92 92,92"/>';
    s += '<polygon class="ls-star" points="50,3 52.9,10.9 61.4,11 54.7,16.2 57.1,24.4 50,19.6 42.9,24.4 45.3,16.2 38.6,11 47.1,10.9"/>';
    [[44, 38, 0], [56, 42, 1], [38, 58, 2], [52, 60, 0], [64, 56, 1], [30, 80, 1], [44, 78, 2], [58, 82, 0], [72, 78, 2], [50, 46, 2], [26, 64, 0], [78, 66, 1]]
      .forEach(function (p, i) { s += '<circle class="ls-bulb c' + p[2] + '" cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" style="animation-delay:' + (i * 0.17).toFixed(2) + 's"/>'; });
    s += '<ellipse class="ls-ground" cx="50" cy="104" rx="56" ry="7"/>';
    return '<svg viewBox="0 0 100 110" aria-hidden="true">' + s + '</svg>';
  }
  function dateEt(ms) {
    try { return new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); } catch (e) { return ''; }
  }
  function label(L) {
    if (L.status === 'lit') return 'lit';
    if (L.status === 'expired') return 'dark';
    var c = L.can || { ok: true };
    if (c.ok) return L.status === 'active' ? 'in progress' : L.size;
    if (c.error === 'need_houses') return c.need + ' more ' + (c.need === 1 ? 'house' : 'houses');
    if (c.error === 'not_open') return c.opensAt ? 'opens ' + dateEt(c.opensAt) : 'soon';
    if (c.error === 'closed') return 'lights out';
    return '';
  }

  function render(box, levels, opts) {
    opts = opts || {};
    box.classList.add('ls');
    box.innerHTML = '';
    var hn = 0;
    levels.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button';
      var open = L.status === 'lit' || (L.can && L.can.ok);
      b.className = 'ls-house' + (L.status === 'lit' ? ' lit' : '') + (open ? '' : ' locked') + (opts.current === L.id ? ' cur' : '') + (L.training ? ' training' : '');
      b.innerHTML = (L.tree ? tree() : house(L.training ? 0 : ++hn)) +
        '<span class="ls-hl">' + (L.tree ? 'Tree' : L.training ? 'Training' : 'House ' + hn) + '</span><span class="ls-hs">' + label(L) + '</span>';
      b.setAttribute('aria-label', L.title + ': ' + label(L));
      b.addEventListener('click', function () { if (opts.onOpen) opts.onOpen(L.id, L); });
      box.appendChild(b);
    });
  }
  /** Короткая вспышка при зажигании дома. */
  function flick(box, id, levels) {
    var i = levels.findIndex(function (l) { return l.id === id; });
    var b = box.children[i]; if (!b) return;
    b.classList.add('flick'); setTimeout(function () { b.classList.remove('flick'); }, 600);
  }

  window.LightStreet = { render: render, flick: flick, house: house, tree: tree };
})();
