// Свин-копилка + список банок (CoinsMania · Merry Coinsmas). Свин наполняется золотом по числу разобранных банок 1–6,
// золотая банка — сияние и звезда. CoinPiggy.render(el, jars, { current, onOpen, progress }), CoinPiggy.flick(el, id).
// jars — массив из /api/me (id, title, colors, practice, golden, status: new|active|sorted|expired, can: { ok, error, need, opensAt }).
(function (root) {
  'use strict';

  // Силуэт копилки, viewBox 0 0 220 160. Одна форма для заливки (clipPath) и для контура.
  var PIG = 'M40 70C40 42 70 24 112 24c10 0 20 1.4 29 4l17-15 5 25c14 10 24 24 26 32h11c5 0 8 3 8 8v18c0 5-3 8-8 8h-12' +
    'c-5 12-14 22-26 28v18c0 3-2 5-5 5h-14c-3 0-5-2-5-5v-11c-8 2-16 3-25 3s-17-1-25-3v11c0 3-2 5-5 5H69c-3 0-5-2-5-5v-19' +
    'C49 112 40 92 40 70z';
  var uid = 0;

  function pigSvg(p, golden) {
    var id = 'cpg' + (++uid);
    var frac = Math.max(0, Math.min(1, p.jars / 6));
    var top = 162 - 140 * frac; // уровень золота: 0 банок — ниже копыт, 6 — до спины
    return '<svg class="pig-svg' + (golden ? ' is-golden' : '') + '" viewBox="0 0 220 160" role="img" aria-label="Piggy bank ' + p.jars + ' of 6 jars">' +
      '<defs><clipPath id="' + id + '"><path d="' + PIG + '"/></clipPath>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE97A"/><stop offset="1" stop-color="#E9A400"/></linearGradient>' +
      '<pattern id="' + id + 'c" width="22" height="12" patternUnits="userSpaceOnUse"><ellipse cx="11" cy="6" rx="9" ry="4" fill="none" stroke="rgba(160,98,0,.35)" stroke-width="1.4"/></pattern></defs>' +
      '<path d="' + PIG + '" class="pig-body"/>' +
      '<g clip-path="url(#' + id + ')"><rect class="pig-gold" x="0" y="' + top + '" width="220" height="160" fill="url(#' + id + 'g)"/>' +
      '<rect x="0" y="' + top + '" width="220" height="160" fill="url(#' + id + 'c)"/></g>' +
      '<path d="' + PIG + '" class="pig-line"/>' +
      '<rect x="96" y="30" width="34" height="6" rx="3" class="pig-slot"/>' +
      '<circle cx="166" cy="62" r="4.5" class="pig-eye"/>' +
      '<ellipse cx="203" cy="86" rx="3" ry="5" class="pig-nose"/><ellipse cx="193" cy="86" rx="3" ry="5" class="pig-nose"/>' +
      '<path d="M40 64c-14-2-22 6-18 14s14 4 10-4" class="pig-tail"/>' +
      // рождественский колпак на макушке
      '<path d="M128 30C132 8 158-6 190 6l-6 10c-18-6-30 0-36 18z" class="pig-hat"/>' +
      '<path d="M124 34c10-8 26-6 30 2" class="pig-hat-band"/><circle cx="190" cy="9" r="7" class="pig-hat-pom"/>' +
      (golden ? '<polygon class="pig-star" points="112,0 116,10 127,10 118,16 121,27 112,20 103,27 106,16 97,10 108,10"/>' : '') +
      '</svg>';
  }

  var ICON = { sorted: '✓', active: '•', expired: '–' };
  function fmtT(ms) { return new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  function render(el, jars, opts) {
    opts = opts || {};
    var p = opts.progress || { jars: 0, golden: false };
    var chips = jars.map(function (j) {
      var locked = j.status === 'new' && j.can && !j.can.ok;
      var st = locked ? 'locked' : j.status;
      var sub = j.practice ? 'warm-up, no prize' : j.golden ? (locked && j.can.error === 'need_jars' ? 'sort ' + j.can.need + ' more' : 'gold · ' + j.colors + ' colors') : j.colors + ' colors';
      if (locked && j.can.error === 'not_open' && j.can.opensAt) sub = 'opens ' + fmtT(j.can.opensAt);
      if (locked && j.can.error === 'closed') sub = 'closed';
      return '<button type="button" class="pj pj-' + st + (j.golden ? ' pj-golden' : '') + (j.practice ? ' pj-practice' : '') + (opts.current === j.id ? ' cur' : '') + '" data-id="' + j.id + '">' +
        '<i>' + (locked ? '🔒' : ICON[j.status] || (j.golden ? '★' : j.practice ? 'P' : j.title.replace(/\D/g, ''))) + '</i>' +
        '<b>' + j.title + '</b><small>' + sub + '</small></button>';
    }).join('');
    el.innerHTML = '<div class="piggy"><div class="pig-wrap">' + pigSvg(p, p.golden) +
      '<div class="pig-meter"><b>' + p.jars + '</b>/6 jars' + (p.golden ? ' · <span>Golden ✓</span>' : '') + '</div></div>' +
      '<div class="pj-list">' + chips + '</div></div>';
    el.onclick = function (e) {
      var b = e.target.closest('.pj');
      if (!b || !opts.onOpen) return;
      var j = jars.filter(function (x) { return x.id === b.dataset.id; })[0];
      opts.onOpen(b.dataset.id, j);
    };
  }

  /** Монеты падают в свина (после разобранной банки). */
  function flick(el) {
    var w = el.querySelector('.pig-wrap');
    if (!w) return;
    for (var i = 0; i < 6; i++) {
      var c = document.createElement('span');
      c.className = 'pig-drop';
      c.style.left = (42 + Math.random() * 16) + '%';
      c.style.animationDelay = (i * 0.09) + 's';
      w.appendChild(c);
      setTimeout(function (n) { return function () { if (n.parentNode) n.parentNode.removeChild(n); }; }(c), 1600);
    }
    w.classList.remove('bump'); void w.offsetWidth; w.classList.add('bump');
  }

  root.CoinPiggy = { render: render, flick: flick, pigSvg: pigSvg };
})(typeof self !== 'undefined' ? self : this);
