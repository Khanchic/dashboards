// Полночный салют: canvas 2D, без синхронизации — каждый клиент рисует его сам из списка ракет.
//   var s = Salute.create(canvasEl);   s.fire(rockets, { me: 'nick' });   rockets: [{ nick, tier: 'spark'|'red'|'blue'|'gold' }]
// Ники подписываются у золотых, у своей ракеты и у каждой третьей остальной (иначе при 100+ ракетах каша).
window.Salute = (function () {
  'use strict';
  var KIND = {
    spark: { pal: ['#ffffff', '#fff3b0', '#FFDA0A'], n: 28, sp: 0.7, trail: 'rgba(255,243,176,.8)' },
    red:   { pal: ['#FF2B39', '#ff6a73', '#ffffff'], n: 60, sp: 1, trail: 'rgba(255,43,57,.85)' },
    blue:  { pal: ['#01C9FF', '#7fe4ff', '#ffffff'], n: 80, sp: 1.12, trail: 'rgba(1,201,255,.85)' },
    gold:  { pal: ['#FFDA0A', '#BCAA74', '#fff3b0'], n: 130, sp: 1.3, trail: 'rgba(255,218,10,.9)' }
  };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function create(cv) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, DPR = Math.min(2, window.devicePixelRatio || 1);
    var rockets = [], parts = [], labels = [], running = false;
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(cv); else addEventListener('resize', size);

    function launch(x, kind, label, delay, y0, mine) {
      rockets.push({ x: x, y: y0 == null ? H * 0.92 : y0, vx: (Math.random() - 0.5) * 0.6, vy: -(8 + Math.random() * 2.4) * (H / 700 + 0.3),
        ty: H * (0.1 + Math.random() * 0.3), kind: KIND[kind] ? kind : 'red', label: label, wait: delay || 0, trail: [], mine: mine });
      if (!running) { running = true; requestAnimationFrame(frame); }
    }
    function burst(r) {
      var K = KIND[r.kind], n = reduce ? Math.round(K.n / 2) : K.n, boost = r.mine ? 1.3 : 1;
      for (var i = 0; i < n * boost; i++) {
        var a = Math.random() * Math.PI * 2, sp = K.sp * boost * (1.2 + Math.random() * 3.6);
        parts.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 0.008 + Math.random() * 0.012, c: K.pal[i % K.pal.length], g: r.kind === 'gold' });
      }
      if (r.label) labels.push({ x: r.x, y: r.y - 12, t: r.label, life: 1, gold: r.kind === 'gold', mine: r.mine });
    }
    function frame() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = rockets.length - 1; i >= 0; i--) {
        var r = rockets[i];
        if (r.wait > 0) { r.wait--; continue; }
        r.trail.push([r.x, r.y]); if (r.trail.length > 10) r.trail.shift();
        r.x += r.vx; r.y += r.vy; r.vy *= 0.985;
        ctx.strokeStyle = KIND[r.kind].trail; ctx.lineWidth = r.kind === 'gold' || r.mine ? 3 : 2.2; ctx.beginPath();
        for (var j = 0; j < r.trail.length; j++) { var p = r.trail[j]; if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
        ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r.x, r.y, 2.4, 0, 7); ctx.fill();
        if (r.y <= r.ty || r.vy > -1.2) { burst(r); rockets.splice(i, 1); }
      }
      for (var k = parts.length - 1; k >= 0; k--) {
        var q = parts[k];
        q.px = q.x; q.py = q.y; q.vx *= 0.975; q.vy = q.vy * 0.975 + 0.045; q.x += q.vx; q.y += q.vy; q.life -= q.decay;
        if (q.life <= 0) { parts.splice(k, 1); continue; }
        ctx.strokeStyle = q.c; ctx.globalAlpha = Math.max(0, q.g ? q.life * (0.6 + 0.4 * Math.random()) : q.life); ctx.lineWidth = q.g ? 2.2 : 1.8;
        ctx.beginPath(); ctx.moveTo(q.px, q.py); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      for (var m = labels.length - 1; m >= 0; m--) {
        var L = labels[m]; L.life -= 0.005; L.y -= 0.15;
        if (L.life <= 0) { labels.splice(m, 1); continue; }
        ctx.globalAlpha = Math.min(1, L.life * 1.6);
        ctx.font = (L.mine ? '900 15px' : '800 13px') + ' Raleway, system-ui, sans-serif'; ctx.textAlign = 'center';
        var tw = ctx.measureText(L.t).width + 16;
        ctx.fillStyle = L.mine ? 'rgba(255,218,10,.9)' : 'rgba(0,19,26,.75)'; ctx.fillRect(L.x - tw / 2, L.y - 15, tw, 22);
        ctx.fillStyle = L.mine ? '#1d1600' : L.gold ? '#FFDA0A' : '#ffffff'; ctx.fillText(L.t, L.x, L.y + 1);
      }
      ctx.globalAlpha = 1;
      if (rockets.length || parts.length || labels.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, W, H); }
    }

    return {
      launch: launch,
      // все ракеты волнами: сначала искры, потом красные и голубые, золотые и своя — в конце
      fire: function (list, o) {
        o = o || {};
        var order = { spark: 0, red: 1, blue: 2, gold: 3 }, cap = reduce ? 30 : 160;
        var others = list.filter(function (r) { return r.nick !== o.me; }).sort(function (a, b) { return order[a.tier] - order[b.tier]; });
        if (others.length > cap) others = others.slice(others.length - cap); // показываем самые крупные
        var gap = Math.max(3, Math.round(420 / Math.max(1, others.length)));
        others.forEach(function (r, i) {
          var label = r.tier === 'gold' || i % 3 === 0 ? r.nick : '';
          launch(W * (0.06 + Math.random() * 0.88), r.tier, label, i * gap + Math.floor(Math.random() * 8));
        });
        var mine = list.filter(function (r) { return r.nick === o.me; })[0];
        if (mine) launch(W * 0.5, mine.tier, mine.nick + ' · you', others.length * gap + 30, null, true);
      }
    };
  }
  return { create: create };
})();
