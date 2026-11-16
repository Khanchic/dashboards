/**
 * 3D-улица Light Up Christmas (Storm Rush) на ядре _3d/ny3d.js. Тот же интерфейс, что у 2D street.js:
 *   Street3D.render(box, levels, { current, onOpen(levelId, level) })   — первый вызов строит сцену, дальше только обновляет
 *   Street3D.flick(box, id, levels)                                     — вспышка, когда дом загорелся
 *   Street3D.supported()                                                — есть ли WebGL (иначе страница рисует 2D LightStreet)
 * Сюжет сцены: буря унесла свет. Заснеженная улица, дома по обе стороны, в конце площадь с ёлкой, над улицей тучи.
 * Зажжённый дом — окна и гирлянда на фасаде горят. 4+ дома — на площади загорается ёлка-ожидание; вся улица (6) —
 * фонари включаются, тучи расходятся, появляются звёзды. Golem стоит в начале улицы, Sparky летает у текущего дома.
 */
(function () {
  'use strict';
  var BRAND = { g: 0x00cc7e, g2: 0x41f999, cy: 0x2eeaff, y: 0xf5f100, warm: 0xffc46b };
  var BULBS = [0x41f999, 0x2eeaff, 0xf5f100];
  // насыщенная «пряничная» палитра: цветные фасады, яркие крыши (16.11 — было слишком серо)
  var FACADES = [0x2d6f9a, 0x9a4632, 0x2f8a5e, 0xa8812e, 0x6c3f92, 0x23858c, 0x963a5c];
  var ROOFS = [0xd02a3e, 0x12b066, 0x2f5fe0, 0xe8901c, 0x10b4c4, 0xc42c94, 0x62bc2c];

  // места: [x, z, поворот] — слева тренировка и чётные дома, справа нечётные, ёлка в конце улицы
  var SPOTS = { training: [-6.6, 4.5, 0.95], 1: [6.6, 0.5, -0.95], 2: [-6.6, -4.5, 0.95], 3: [6.6, -9.5, -0.95], 4: [-6.6, -14.5, 0.95], 5: [6.6, -19.5, -0.95], 6: [-6.6, -24.5, 0.95], tree: [0, -31, 0] };
  var CAM = { pos: [0, 17, 21], look: [0, 0.5, -10] };
  var CAM_TALL = { pos: [0, 21, 13], look: [0, 0, -12] }; // телефон: улица сверху, вдоль экрана (fov шире)

  // общий план под пропорции блока: широкий (≥1.9) — CAM, узкий (≤0.9) — CAM_TALL, между ними плавно
  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 42 + 16 * t, zoom: Math.max(0.68, Math.min(1, a / 0.95)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function css() {
    if (document.getElementById('s3d-css')) return;
    var s = document.createElement('style'); s.id = 's3d-css';
    s.textContent =
      '.s3d{height:clamp(520px,86vh,980px);margin:0 0 6px;background:#04080a}' +
      '.s3d .ny3d-label{font:600 13px/1.1 "Kanit",system-ui,sans-serif;font-style:italic;text-transform:uppercase;letter-spacing:.03em;color:#F3F6F5;' +
      'background:rgba(8,16,12,.78);border:1px solid rgba(65,249,153,.35);padding:5px 10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;backdrop-filter:blur(4px)}' +
      '.s3d .ny3d-label small{font:400 11px/1 "Kanit",system-ui,sans-serif;font-style:normal;text-transform:none;letter-spacing:0;color:rgba(243,246,245,.66)}' +
      '.s3d .ny3d-label.lit{border-color:#F5F100;box-shadow:0 0 14px rgba(245,241,0,.35)} .s3d .ny3d-label.lit small{color:#F5F100}' +
      '.s3d .ny3d-label.ready{border-color:#2EEAFF} .s3d .ny3d-label.ready small{color:#2EEAFF}' +
      '.s3d .ny3d-label.locked{opacity:.62}' +
      '.s3d .ny3d-label.cur{background:#00CC7E;color:#0C130F;border-color:#41F999} .s3d .ny3d-label.cur small{color:#0C130F}' +
      '.s3d .ny3d-label:focus-visible{outline:2px solid #2EEAFF;outline-offset:2px}' +
      '.s3d-title{position:absolute;left:0;top:0;padding:18px 20px;pointer-events:none;z-index:2}' +
      '.s3d-title h1{font-size:clamp(1.6rem,4.2vw,3rem);text-shadow:0 2px 18px rgba(0,0,0,.7)}' +
      '@media (max-width:600px){.s3d .ny3d-label{font-size:11px;padding:4px 7px}.s3d .ny3d-label small{font-size:10px}}';
    document.head.appendChild(s);
  }

  function dateEt(ms) { try { return new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); } catch (e) { return ''; } }
  function status(L) {
    if (L.status === 'lit') return 'lit';
    if (L.status === 'expired') return 'dark';
    var c = L.can || { ok: true };
    if (c.ok) return L.status === 'active' ? 'in progress' : L.size || 'ready';
    if (c.error === 'need_houses') return c.need + ' more ' + (c.need === 1 ? 'house' : 'houses');
    if (c.error === 'not_open') return c.opensAt ? 'opens ' + dateEt(c.opensAt) : 'soon';
    if (c.error === 'closed') return 'lights out';
    return '';
  }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      bg: 0x05090b, fog: [0x0a1614, 30, 72], exposure: 0.95,
      env: [0x0c1a17, 0x2a2418, 0x0e2a33, 0x040908], cam: { pos: CAM.pos, look: CAM.look, fov: 42 }, designAspect: 16 / 8, minZoom: 0.42, parallax: 0.9,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, houses: {}, tree: null, litN: 0, allLit: false, t: 0, flash: 0 };

    // ---------- небо ----------
    scene.background = k.tex(4, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#02040e'); gr.addColorStop(0.55, '#08203a'); gr.addColorStop(1, '#0c4a4e');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var skyCol = scene.background;
    // звёзды (видны, когда тучи ушли)
    var starN = 500, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = Math.random() * Math.PI - Math.PI, el = 0.15 + Math.random() * 0.9, R = 120; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.6 + 8; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 30; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ color: 0xdffcff, size: 0.55, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(stars);

    // ---------- свет ----------
    var hemi = new T.HemisphereLight(0x4a7ad0, 0x0a1a24, 0.46); scene.add(hemi);
    var moon = new T.DirectionalLight(0x7fb2ff, 0.4); moon.position.set(-12, 22, 10); scene.add(moon);
    var squareLight = new T.PointLight(0xffd27a, 0, 30, 2); squareLight.position.set(0, 6, -28); scene.add(squareLight);

    // ---------- земля, дорога, сугробы ----------
    var snowTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#cfdbe2'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { var v = 200 + Math.random() * 55 | 0; g.fillStyle = 'rgba(' + v + ',' + (v + 6) + ',' + (v + 12) + ',.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping; snowTex.repeat.set(10, 10);
    var ground = new T.Mesh(new T.PlaneGeometry(160, 160), new T.MeshStandardMaterial({ color: 0x6f92c4, map: snowTex, roughness: 0.95, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground);
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#2a3034'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 5000; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.06) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      // колеи в снегу
      g.fillStyle = 'rgba(210,225,232,.55)'; [0.2, 0.36, 0.64, 0.8].forEach(function (x) { g.fillRect(x * w - 7, 0, 14, h); });
      // края дороги занесены
      var e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(220,232,238,.95)'); e.addColorStop(0.12, 'rgba(220,232,238,0)'); e.addColorStop(0.88, 'rgba(220,232,238,0)'); e.addColorStop(1, 'rgba(220,232,238,.95)');
      g.fillStyle = e; g.fillRect(0, 0, w, h);
    });
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 4);
    var road = new T.Mesh(new T.PlaneGeometry(7, 46), new T.MeshStandardMaterial({ map: roadTex, roughness: 0.75, metalness: 0.05 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -10); scene.add(road);
    var square = new T.Mesh(new T.CircleGeometry(9, 48), new T.MeshStandardMaterial({ color: 0x9ab8de, roughness: 0.9, map: snowTex }));
    square.rotation.x = -Math.PI / 2; square.position.set(0, 0.02, -31); scene.add(square);
    // сугробы вдоль улицы
    var drift = new T.MeshStandardMaterial({ color: 0x86a8d6, roughness: 1 });
    for (var d = 0; d < 26; d++) {
      var side = d % 2 ? 1 : -1, m = new T.Mesh(new T.SphereGeometry(1, 12, 8), drift);
      m.scale.set(0.55 + Math.random() * 0.4, 0.25 + Math.random() * 0.2, 1.1 + Math.random() * 1.2);
      m.position.set(side * (4.2 + Math.random() * 0.5), 0, 8 - d * 1.5 - Math.random()); scene.add(m);
    }
    // ели по краям сцены
    var pineMat = new T.MeshStandardMaterial({ color: 0x0e5c3c, roughness: 0.9, flatShading: true });
    var pineSnow = new T.MeshStandardMaterial({ color: 0xa6c6ec, roughness: 1, flatShading: true });
    function pine(x, z, s) {
      var g = new T.Group();
      for (var j = 0; j < 3; j++) {
        var c = new T.Mesh(new T.ConeGeometry(1.4 - j * 0.35, 1.6, 7), pineMat); c.position.y = 1 + j * 0.9; g.add(c);
        var cap = new T.Mesh(new T.ConeGeometry((1.4 - j * 0.35) * 0.55, 0.7, 7), pineSnow); cap.position.y = 1.5 + j * 0.9; g.add(cap);
      }
      g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    }
    for (var p = 0; p < 16; p++) { var sd = p % 2 ? 1 : -1; pine(sd * (12 + Math.random() * 8), 6 - p * 3.2, 1 + Math.random() * 0.9); }

    // ---------- фонари (горят, когда вся улица зажжена) ----------
    var lamps = [];
    var poleMat = new T.MeshStandardMaterial({ color: 0x1c2427, metalness: 0.7, roughness: 0.35 });
    [6, -2, -10, -18, -26].forEach(function (z, i) {
      [-1, 1].forEach(function (sd) {
        var g = new T.Group();
        var pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 3.6, 8), poleMat); pole.position.y = 1.8; g.add(pole);
        var arm = new T.Mesh(new T.BoxGeometry(0.6, 0.06, 0.06), poleMat); arm.position.set(-sd * 0.25, 3.55, 0); g.add(arm);
        var bulbMat = new T.MeshStandardMaterial({ color: 0x223036, emissive: BRAND.cy, emissiveIntensity: 0 });
        var bulb = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), bulbMat); bulb.position.set(-sd * 0.5, 3.4, 0); g.add(bulb);
        var gl = k.glow(BRAND.cy, 2.2); gl.position.copy(bulb.position); gl.material.opacity = 0; g.add(gl);
        g.position.set(sd * 4.4, 0, z + (sd > 0 ? 2 : 0)); scene.add(g);
        lamps.push({ m: bulbMat, gl: gl, ph: i * 0.7 + (sd > 0 ? 0.3 : 0) });
      });
    });

    // ---------- тучи ----------
    var cloudTex = k.tex(256, 128, function (g, w, h) {
      for (var i = 0; i < 26; i++) {
        var x = w * (0.15 + Math.random() * 0.7), y = h * (0.35 + Math.random() * 0.35), r = 20 + Math.random() * 34;
        var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    var clouds = [];
    for (var c = 0; c < 9; c++) {
      var cm = new T.SpriteMaterial({ map: cloudTex, color: 0x34413f, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
      var cs = new T.Sprite(cm); var sc = 18 + Math.random() * 14; cs.scale.set(sc, sc * 0.45, 1);
      cs.position.set(-30 + c * 7.5 + Math.random() * 3, 13 + Math.random() * 5, -22 - Math.random() * 18); scene.add(cs);
      clouds.push({ s: cs, x0: cs.position.x, sp: 0.25 + Math.random() * 0.35, y0: cs.position.y });
    }
    var flashLight = new T.DirectionalLight(0x7fe6ff, 0); flashLight.position.set(5, 30, -20); scene.add(flashLight);

    k.snow({ n: 1100, area: [44, 22, 50], center: [0, 0, -12], speed: 1.1, size: 0.18 });

    // ---------- дом ----------
    var winTex = k.tex(64, 64, function (g, w, h) {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#000'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h / 2 - 3, w, 6);
      g.lineWidth = 6; g.strokeRect(0, 0, w, h);
    });
    var trimMat = new T.MeshStandardMaterial({ color: 0xeef2f0, roughness: 0.6 });
    var snowMat = new T.MeshStandardMaterial({ color: 0xb6d0f0, roughness: 0.9, flatShading: true });
    var doorMat = new T.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.7 });
    var bulbGeo = new T.SphereGeometry(0.09, 8, 6);

    function prism(r, len, mat, sy) {
      var geo = new T.CylinderGeometry(r, r, len, 3, 1); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI);
      var m = new T.Mesh(geo, mat); m.scale.y = sy; return m;
    }

    function house(v) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var w = 3.2 + (v % 3) * 0.35, h = 2.3 + ((v * 7) % 3) * 0.35, dp = 3.0, sy = 0.62;
      var body = new T.Mesh(new T.BoxGeometry(w, h, dp), new T.MeshStandardMaterial({ color: FACADES[v % FACADES.length], roughness: 0.85 }));
      body.position.y = h / 2; inner.add(body);
      var r = (w + 0.6) / Math.sqrt(3);
      var roof = prism(r, dp + 0.5, new T.MeshStandardMaterial({ color: ROOFS[v % ROOFS.length], roughness: 0.7, flatShading: true }), sy);
      roof.position.y = h + 0.5 * r * sy; inner.add(roof);
      var rs = r * 0.5, cap = prism(rs, dp + 0.62, snowMat, sy);
      cap.position.y = roof.position.y + (r - rs) * sy + 0.04; inner.add(cap);
      var chim = new T.Mesh(new T.BoxGeometry(0.45, 1.1, 0.45), new T.MeshStandardMaterial({ color: 0x5a3a30, roughness: 0.9 }));
      chim.position.set(w * 0.22, h + r * sy * 0.9, -dp * 0.2); inner.add(chim);
      var chimSnow = new T.Mesh(new T.BoxGeometry(0.55, 0.12, 0.55), snowMat); chimSnow.position.set(chim.position.x, chim.position.y + 0.6, chim.position.z); inner.add(chimSnow);
      // окна и дверь на фасаде (+z)
      var winMat = new T.MeshStandardMaterial({ color: 0x14202a, emissive: BRAND.warm, emissiveMap: winTex, emissiveIntensity: 0, roughness: 0.3, metalness: 0.2 });
      var fz = dp / 2 + 0.01, ww = w * 0.22, wh = h * 0.32;
      [[-w * 0.29, h * 0.58], [w * 0.29, h * 0.58]].forEach(function (p) {
        var win = new T.Mesh(new T.PlaneGeometry(ww, wh), winMat); win.position.set(p[0], p[1], fz); inner.add(win);
        var sill = new T.Mesh(new T.BoxGeometry(ww + 0.2, 0.08, 0.18), trimMat); sill.position.set(p[0], p[1] - wh / 2 - 0.04, fz + 0.06); inner.add(sill);
        var sillSnow = new T.Mesh(new T.BoxGeometry(ww + 0.16, 0.07, 0.16), snowMat); sillSnow.position.set(p[0], p[1] - wh / 2 + 0.02, fz + 0.06); inner.add(sillSnow);
      });
      var attic = new T.Mesh(new T.CircleGeometry(0.28, 20), winMat); attic.position.set(0, h + r * sy * 0.35, fz + 0.26); inner.add(attic);
      var door = new T.Mesh(new T.BoxGeometry(0.75, h * 0.5, 0.08), doorMat); door.position.set(0, h * 0.25, fz); inner.add(door);
      var wreath = new T.Mesh(new T.TorusGeometry(0.17, 0.06, 6, 14), new T.MeshStandardMaterial({ color: 0x1e6a3a, roughness: 0.8 })); wreath.position.set(0, h * 0.38, fz + 0.06); inner.add(wreath);
      // гирлянда по фронтону и карнизу
      var bulbs = [], baseY = h + 0.06, apexY = h + 1.5 * r * sy, half = w / 2 + 0.28, zb = (dp + 0.5) / 2 + 0.03;
      var pts = [];
      for (var b = 0; b <= 12; b++) { var t = b / 12; pts.push(t <= 0.5 ? [-half + (half * 2) * t, baseY + (apexY - baseY - 0.25) * (t * 2)] : [-half + (half * 2) * t, baseY + (apexY - baseY - 0.25) * ((1 - t) * 2)]); }
      for (var e = 0; e < 8; e++) pts.push([-w / 2 + 0.2 + (w - 0.4) * (e / 7), h - 0.12]);
      pts.forEach(function (p, i) {
        var col = BULBS[i % 3];
        var mat = new T.MeshStandardMaterial({ color: 0x1a2226, emissive: col, emissiveIntensity: 0, roughness: 0.4 });
        var bm = new T.Mesh(bulbGeo, mat); bm.position.set(p[0], p[1], i < 13 ? zb : fz + 0.08); inner.add(bm);
        var gl = k.glow(col, 0.7); gl.position.copy(bm.position); gl.material.opacity = 0; inner.add(gl);
        bulbs.push({ m: mat, gl: gl, i: i });
      });
      // тёплое свечение окон
      var winGlow = [];
      [[-w * 0.29, h * 0.58, 1.5], [w * 0.29, h * 0.58, 1.5], [0, h + r * sy * 0.35, 0.9]].forEach(function (p) {
        var gw = k.glow(BRAND.warm, p[2]); gw.position.set(p[0], p[1], fz + 0.35); gw.material.opacity = 0; inner.add(gw); winGlow.push(gw);
      });
      // свет из окон на снег
      var spill = k.glow(BRAND.warm, 3.4); spill.position.set(0, 0.9, dp / 2 + 0.9); spill.material.opacity = 0; inner.add(spill);
      // кольцо «текущий дом»
      var ring = new T.Mesh(new T.RingGeometry(2.4, 2.65, 48), new T.MeshBasicMaterial({ color: BRAND.g2, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.04, 0.6); g.add(ring);
      return { g: g, inner: inner, win: winMat, winGlow: winGlow, bulbs: bulbs, spill: spill, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, h: h + r * sy * 1.5 };
    }

    function treeObj() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var needle = new T.MeshStandardMaterial({ color: 0x0f6a40, roughness: 0.85, flatShading: true });
      var tiers = [[3.4, 3.2, 1.6], [2.8, 2.9, 3.4], [2.1, 2.6, 5.0], [1.4, 2.2, 6.4]];
      tiers.forEach(function (t) {
        var c = new T.Mesh(new T.ConeGeometry(t[0], t[1], 9), needle); c.position.y = t[2]; inner.add(c);
        var cap = new T.Mesh(new T.ConeGeometry(t[0] * 0.45, t[1] * 0.4, 9), snowMat); cap.position.y = t[2] + t[1] * 0.32; inner.add(cap);
      });
      var trunk = new T.Mesh(new T.CylinderGeometry(0.35, 0.45, 1, 10), doorMat); trunk.position.y = 0.3; inner.add(trunk);
      var starShape = new T.Shape();
      for (var s = 0; s < 10; s++) { var ang = Math.PI / 2 + s * Math.PI / 5, rr = s % 2 ? 0.3 : 0.72; var x = Math.cos(ang) * rr, y = Math.sin(ang) * rr; if (s) starShape.lineTo(x, y); else starShape.moveTo(x, y); }
      var starMat = new T.MeshStandardMaterial({ color: 0x4a4a20, emissive: BRAND.y, emissiveIntensity: 0, metalness: 0.6, roughness: 0.3 });
      var star = new T.Mesh(new T.ExtrudeGeometry(starShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }), starMat);
      star.position.set(0, 8.05, -0.08); inner.add(star);
      var starGlow = k.glow(BRAND.y, 5); starGlow.position.set(0, 8.1, 0.2); starGlow.material.opacity = 0; inner.add(starGlow);
      var bulbs = [];
      for (var i = 0; i < 46; i++) {
        var tt = i / 46, y = 0.9 + tt * 6.3, rad = 3.2 * (1 - tt) + 0.25, a = tt * Math.PI * 9;
        var mat = new T.MeshStandardMaterial({ color: 0x1a2226, emissive: BULBS[i % 3], emissiveIntensity: 0, roughness: 0.4 });
        var bm = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), mat); bm.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad); inner.add(bm);
        var gl = k.glow(BULBS[i % 3], 0.9); gl.position.copy(bm.position); gl.material.opacity = 0; inner.add(gl);
        bulbs.push({ m: mat, gl: gl, i: i });
      }
      // подарки
      [[1.6, 0.9, 0x00cc7e], [-1.8, 0.6, 0x2eeaff], [0.4, 2.0, 0xf5f100], [-0.9, 1.9, 0xff4d6d]].forEach(function (p, i) {
        var s2 = 0.6 + (i % 2) * 0.25, box = new T.Mesh(new T.BoxGeometry(s2, s2, s2), new T.MeshStandardMaterial({ color: p[2], roughness: 0.5 }));
        box.position.set(p[0], s2 / 2, p[1]); box.rotation.y = i; inner.add(box);
        var rib = new T.Mesh(new T.BoxGeometry(s2 + 0.02, s2 + 0.02, 0.1), trimMat); rib.position.copy(box.position); rib.rotation.y = i; inner.add(rib);
      });
      var ring = new T.Mesh(new T.RingGeometry(4.2, 4.5, 64), new T.MeshBasicMaterial({ color: BRAND.g2, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
      return { g: g, inner: inner, win: null, bulbs: bulbs, star: starMat, starGlow: starGlow, spill: null, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, h: 8.9, tree: true };
    }

    // ---------- персонажи (настоящие PNG бренда) ----------
    var golem = k.billboard('../../stormrush/assets/golem-xmas.png', 4.4); // полный голем с батареей (golem.png обрезан справа)
    golem.position.set(-2.3, 0, 6.2); scene.add(golem);
    var sparky = k.billboard('../../stormrush/assets/sparky.png', 1.6, { bob: 0.18 });
    sparky.position.set(0.2, 4.3, 6.4); scene.add(sparky);
    var sparkyGlow = k.glow(BRAND.cy, 3.2); sparkyGlow.position.y = 0.75; sparky.add(sparkyGlow);
    var sparkyTo = sparky.position.clone();
    S.sparkyTarget = function (x, y, z) { sparkyTo.set(x, y, z); };

    S.place = function (L, hn) {
      var key = L.tree ? 'tree' : L.training ? 'training' : hn;
      var o = S.houses[L.id];
      if (!o) {
        o = L.tree ? treeObj() : house(L.training ? 0 : hn);
        var sp = SPOTS[key] || [0, 0, 0];
        o.g.position.set(sp[0], 0, sp[1]); o.g.rotation.y = sp[2];
        if (L.training) o.g.scale.setScalar(0.82);
        scene.add(o.g);
        o.lab = k.label(o.g, [0, o.h + 0.9, 0], '', function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); });
        k.pick(o.g, function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); }, function (on) { o.hover = on ? 1 : 0; });
        o.id = L.id;
        S.houses[L.id] = o;
      }
      return o;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      S.t = t;
      var cloudGo = S.allLit ? 1 : 0;
      S.cloudK = (S.cloudK || 0) + (cloudGo - (S.cloudK || 0)) * Math.min(1, dt * 0.6);
      clouds.forEach(function (c, i) {
        c.s.position.x = c.x0 + Math.sin(t * 0.05 * c.sp + i) * 3 + S.cloudK * (c.x0 < 0 ? -40 : 40);
        c.s.material.opacity = 0.9 * (1 - S.cloudK);
      });
      stars.material.opacity = 0.9 * S.cloudK;
      // молния, пока улица не зажжена
      if (!S.allLit && !k.reduced && Math.random() < dt * 0.08) S.flash = 1;
      S.flash = Math.max(0, S.flash - dt * 3.2);
      flashLight.intensity = S.flash * S.flash * 1.5;
      // фонари
      lamps.forEach(function (L) {
        var on = S.allLit ? 1 : (S.litN >= 3 && Math.sin(t * 7 + L.ph * 9) > 0.92 ? 0.35 : 0);
        L.m.emissiveIntensity += (on * 2.2 - L.m.emissiveIntensity) * Math.min(1, dt * 4);
        L.gl.material.opacity = L.m.emissiveIntensity / 2.2 * 0.8;
      });
      // дома и ёлка
      Object.keys(S.houses).forEach(function (id) {
        var o = S.houses[id];
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        o.chase = Math.max(0, o.chase - dt * 0.6);
        var cur = S.current === id;
        o.ring.material.opacity += ((cur ? 0.85 : o.hover ? 0.4 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.03);
        var sc = 1 + o.hover * 0.03; o.inner.scale.x += (sc - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        if (o.win) {
          var flick = o.state === 'active' ? 0.25 + 0.15 * Math.sin(t * 13 + o.g.position.z) : 0;
          o.win.emissiveIntensity = o.lit * 1.6 + flick + (S.flash * 0.15);
          o.spill.material.opacity = o.lit * 0.55;
          o.winGlow.forEach(function (gw) { gw.material.opacity = Math.min(1, o.lit * 0.75 + flick * 0.6); });
        }
        var n = o.bulbs.length;
        o.bulbs.forEach(function (b) {
          var on;
          if (o.chase > 0) on = ((1 - o.chase) * 1.6 * n > b.i) ? 1 : 0;
          else on = o.lit * (0.75 + 0.25 * Math.sin(t * 2.6 + b.i * 1.3));
          if (o.state === 'active' && o.lit < 0.5) on = b.i % 4 === 0 ? 0.6 : 0;
          b.m.emissiveIntensity = on * 2.4;
          b.gl.material.opacity = on * 0.85;
        });
        if (o.tree) {
          o.star.emissiveIntensity = o.lit * 3 + (S.litN >= 4 ? 0.4 + 0.3 * Math.sin(t * 2) : 0);
          o.starGlow.material.opacity = Math.min(1, o.star.emissiveIntensity / 3);
          o.g.children[0].rotation.y = 0;
          squareLight.intensity = o.lit * 1.4;
        }
      });
      // Sparky летит к текущему дому
      sparky.position.lerp(sparkyTo, Math.min(1, dt * 1.6));
      sparkyGlow.material.opacity = 0.55 + 0.25 * Math.sin(t * 4);
    });

    S.k = k;
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F;
      k.camera.fov = F.fov;
      if (F.t > 0) k.camera.zoom = F.zoom; // иначе зум ставит ядро по designAspect
      k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') S.k.look(F.pos, F.look, 0.4);
    });
    return S;
  }

  // ======================================================================================================
  function render(box, levels, opts) {
    opts = opts || {};
    var S = box._s3d;
    if (!S) {
      if (!supported()) return window.LightStreet ? LightStreet.render(box, levels, opts) : null;
      css();
      box.classList.add('s3d');
      Array.prototype.slice.call(box.children).forEach(function (c) { if (!c.classList.contains('s3d-title')) box.removeChild(c); });
      S = build(box);
      if (!S) { box.classList.remove('s3d'); return window.LightStreet ? LightStreet.render(box, levels, opts) : null; }
      box._s3d = S;
    }
    if (S.k.debug('lit')) levels = levels.map(function (L) { return Object.assign({}, L, { status: 'lit' }); });
    S.levels = levels; S.onOpen = opts.onOpen; S.current = opts.current || null;
    var hn = 0, litN = 0;
    levels.forEach(function (L) {
      var num = L.tree || L.training ? 0 : ++hn;
      var o = S.place(L, num);
      var open = L.status === 'lit' || (L.can && L.can.ok);
      o.state = L.status;
      o.target = L.status === 'lit' ? 1 : 0;
      if (L.status === 'lit' && !L.training && !L.tree) litN++;
      var name = L.tree ? 'Tree' : L.training ? 'Training' : 'House ' + num;
      o.lab.set(name + '<small>' + status(L) + '</small>');
      o.lab.el.setAttribute('aria-label', L.title + ': ' + status(L));
      o.lab.cls('lit', L.status === 'lit'); o.lab.cls('locked', !open); o.lab.cls('ready', open && L.status !== 'lit'); o.lab.cls('cur', S.current === L.id);
    });
    S.litN = litN; S.allLit = litN >= 6;
    // камера и Sparky — к текущему дому, иначе общий план
    var T = S.k.T, cur = S.current && S.houses[S.current];
    if (cur) {
      var p = cur.g.position, front = new T.Vector3(0, 0, 3.2).applyAxisAngle(new T.Vector3(0, 1, 0), cur.g.rotation.y);
      var key = 'cur:' + S.current;
      if (S.camKey !== key) {
        S.camKey = key;
        var far = cur.tree ? 15 : 11;
        S.k.look([p.x * 0.45 + front.x * 1.2, cur.tree ? 7.5 : 6.2, p.z + far], [p.x * 0.8, cur.tree ? 4 : 1.6, p.z - 1], 1.6);
      }
      S.sparkyTarget(p.x + front.x + (p.x < 0 ? 1.4 : -1.4), cur.h * 0.75, p.z + front.z);
    } else {
      if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.6); }
      S.sparkyTarget(0.2, 4.3, 6.4);
    }
    return S;
  }

  function flick(box, id) {
    var S = box && box._s3d;
    if (!S) return window.LightStreet ? LightStreet.flick.apply(null, arguments) : null;
    var o = S.houses[id]; if (!o) return;
    o.chase = 1; o.target = 1;
    S.k.bloom(1.8); setTimeout(function () { S.k.bloom(1.05); }, 700);
  }

  window.Street3D = { render: render, flick: flick, supported: supported };
})();
