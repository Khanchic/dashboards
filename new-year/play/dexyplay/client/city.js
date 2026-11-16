/**
 * Улица игрока Tag the City: тренировочная стена, стены 1–6, мурал. От хаба не зависит.
 *   TagCity.render(el, walls, { current, onOpen(id, wall) })
 * walls[i] = { id, title, size, practice, mural, status: 'new'|'active'|'tagged'|'expired', can: { ok, error, opensAt, need },
 *              tagged?: { name, W, H, grid, neon } }   ← расписанная стена горит мини-картинкой
 */
(function () {
  'use strict';
  var NEON = { pink: '#F939E3', yellow: '#FFE733', green: '#33FF8F' };
  var STYLE =
    '.tc{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px;margin:0 0 16px}' +
    '.tc-w{position:relative;display:grid;gap:4px;align-content:start;min-height:118px;padding:10px;border:0;cursor:pointer;text-align:left;color:#fff;font:inherit;' +
      'background:linear-gradient(180deg,#2a2433,#1c1824);box-shadow:inset 0 0 0 1px rgba(118,69,186,.45)}' +
    '.tc-w b{font-weight:800;font-style:italic;text-transform:uppercase;font-size:14px;line-height:1.1}' +
    '.tc-w small{font-size:12px;color:#8E7FA8}' +
    '.tc-w.cur{box-shadow:inset 0 0 0 2px #FFE733}' +
    '.tc-w.tagged{background:linear-gradient(180deg,#1d0f30,#0C0713)}' +
    '.tc-w.tagged small{color:#33FF8F}' +
    '.tc-w.locked{opacity:.5}' +
    '.tc-w.flick{animation:tcf .9s ease-out}' +
    '@keyframes tcf{0%{filter:brightness(2.4)}100%{filter:none}}' +
    '.tc-mini{display:grid;gap:1px;justify-self:start;margin-top:4px}' +
    '.tc-mini i{display:block;width:5px;height:5px}' +
    '.tc-mini i.f{background:var(--n);box-shadow:0 0 4px var(--n)}' +
    '.tc-grey{margin-top:4px;height:34px;background:repeating-linear-gradient(90deg,#3a3445 0 12px,#332d3d 12px 13px),#3a3445;opacity:.6}' +
    '.tc-w:focus-visible{outline:2px solid #33FF8F;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.tc-w.flick{animation:none}}';

  function once() {
    if (document.getElementById('tc-style')) return;
    var s = document.createElement('style'); s.id = 'tc-style'; s.textContent = STYLE; document.head.appendChild(s);
  }
  function fmt(ms) { return new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  function sub(w) {
    if (w.status === 'tagged') return '✓ ' + (w.tagged && w.tagged.name ? w.tagged.name : 'tagged');
    if (w.status === 'expired') return 'stream over';
    if (w.status === 'active') return w.size + ' · in progress';
    var c = w.can || { ok: true };
    if (c.ok) return w.size + (w.practice ? ' · no prize' : '');
    if (c.error === 'need_walls') return '🔒 tag ' + c.need + ' more ' + (c.need === 1 ? 'wall' : 'walls');
    if (c.error === 'not_open' && c.opensAt) return '🔒 opens ' + fmt(c.opensAt);
    if (c.error === 'closed') return 'stream over';
    return '🔒';
  }

  function mini(t) {
    var g = document.createElement('span'); g.className = 'tc-mini';
    g.style.gridTemplateColumns = 'repeat(' + t.W + ',5px)';
    g.style.setProperty('--n', NEON[t.neon] || NEON.pink);
    t.grid.forEach(function (v) { var i = document.createElement('i'); if (v === 1) i.className = 'f'; g.appendChild(i); });
    return g;
  }

  function render(el, walls, o) {
    once(); o = o || {};
    el.innerHTML = '';
    var box = document.createElement('div'); box.className = 'tc';
    walls.forEach(function (w) {
      var locked = w.status === 'new' && w.can && !w.can.ok;
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.id = w.id;
      b.className = 'tc-w' + (w.status === 'tagged' ? ' tagged' : '') + (locked ? ' locked' : '') + (o.current === w.id ? ' cur' : '');
      b.innerHTML = '<b></b><small></small>';
      b.firstChild.textContent = w.practice ? 'Practice' : w.mural ? 'Mural' : w.title;
      b.lastChild.textContent = sub(w);
      if (w.status === 'tagged' && w.tagged && w.tagged.grid) b.appendChild(mini(w.tagged));
      else { var gr = document.createElement('span'); gr.className = 'tc-grey'; b.appendChild(gr); }
      b.addEventListener('click', function () { if (o.onOpen) o.onOpen(w.id, w); });
      box.appendChild(b);
    });
    el.appendChild(box);
  }

  /** Вспышка на только что расписанной стене. */
  function flick(el, id) {
    var b = el.querySelector('.tc-w[data-id="' + id + '"]');
    if (b) { b.classList.remove('flick'); void b.offsetWidth; b.classList.add('flick'); }
  }

  window.TagCity = { render: render, flick: flick };
})();
