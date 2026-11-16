/**
 * 3D-ёлка Infinity Garland (NoLimitCoins) на ядре _3d/ny3d.js. Тот же интерфейс, что у 2D tree.js:
 *   Tree3D.render(box, levels, { current, onOpen(levelId, level) })  — первый вызов строит сцену, дальше только обновляет
 *   Tree3D.supported()                                               — есть ли WebGL (иначе страница рисует 2D GarlandTree)
 * Сцена: ночная заснеженная площадь, огромная ёлка из 6 ярусов (1 — верхушка). Каждый ярус — свой уровень: гирлянда-петля
 * на ярусе загорается, когда ярус пройден. Над ёлкой звезда ∞ (лемниската); когда она горит — вокруг ёлки неоновые
 * кольца (как на арте 03). Слева Coiny (PNG из утверждённого арта), справа гора подарков, тренировочный шар висит
 * на золотой арке слева. Ярус загорелся (status → lit между рендерами) — гирлянда «бежит» по кругу.
 */
(function () {
  'use strict';
  var C = { gold: 0xfdc010, blue: 0x00b4eb, pink: 0xeb1f6a, purple: 0x8b3bd1, warm: 0xffc46b };
  var BULBS = [C.gold, C.blue, C.pink, C.purple];
  var CAM = { pos: [0, 6.2, 19.5], look: [0, 4.7, 0] };       // широкий блок
  var CAM_TALL = { pos: [0, 6.6, 24], look: [0, 4.4, 0] };   // телефон: ёлка + Coiny впереди (см. S.layout)

  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 40 + 14 * t, zoom: Math.max(0.62, Math.min(1, a / 0.9)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function css() {
    if (document.getElementById('t3d-css')) return;
    var s = document.createElement('style'); s.id = 't3d-css';
    s.textContent =
      '.t3d{height:clamp(520px,86vh,980px);margin:0 0 18px;border-radius:14px;background:#070a24}' +
      '.t3d .ny3d-label{font:900 13px/1.05 "Work Sans",system-ui,sans-serif;font-style:italic;letter-spacing:-.01em;color:#F2F1FA;' +
      'background:rgba(12,13,40,.8);border:1px solid rgba(0,180,235,.45);border-radius:999px;padding:5px 12px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;backdrop-filter:blur(4px)}' +
      '.t3d .ny3d-label small{font:600 10.5px/1 "Work Sans",system-ui,sans-serif;font-style:normal;color:rgba(242,241,250,.66)}' +
      '.t3d .ny3d-label.lit{border-color:#FDC010;box-shadow:0 0 14px rgba(253,192,16,.4)} .t3d .ny3d-label.lit small{color:#FDC010}' +
      '.t3d .ny3d-label.ready{border-color:#00B4EB} .t3d .ny3d-label.ready small{color:#00B4EB}' +
      '.t3d .ny3d-label.locked{opacity:.6}' +
      '.t3d .ny3d-label.cur{background:#FDC010;color:#0C0D13;border-color:#FFE27A} .t3d .ny3d-label.cur small{color:#0C0D13}' +
      '.t3d .ny3d-label.star{font-size:15px;padding:6px 14px 7px}' +
      '.t3d .ny3d-label:focus-visible{outline:2px solid #00B4EB;outline-offset:2px}' +
      '.t3d-title{position:absolute;left:0;top:0;padding:18px 22px;pointer-events:none;z-index:2}' +
      '.t3d-title h1{text-shadow:none;filter:drop-shadow(0 2px 14px rgba(0,0,0,.6))}' +
      '.t3d-note{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:2;margin:0;max-width:calc(100% - 32px);text-align:center;' +
      'font:600 13px/1.35 "Work Sans",system-ui,sans-serif;color:#F2F1FA;background:rgba(12,13,40,.78);border:1px solid rgba(253,192,16,.35);border-radius:999px;padding:7px 14px;pointer-events:none}' +
      '@media (max-width:600px){.t3d .ny3d-label{font-size:11.5px;padding:4px 9px 5px}.t3d .ny3d-label small{font-size:9.5px}.t3d-title{padding:14px 16px}.t3d-note{font-size:12px;border-radius:12px}}';
    document.head.appendChild(s);
  }

  var when = function (ms) { return new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }); };
  function stOf(L) { return L.status === 'lit' ? 'lit' : (L.can && L.can.ok) || L.status === 'active' ? 'open' : 'locked'; }
  function status(L) {
    if (L.status === 'lit') return 'lit';
    if (L.status === 'expired') return 'dark';
    if (L.status === 'active') return 'in progress';
    var c = L.can || { ok: true };
    if (c.ok) return 'ready';
    if (c.error === 'need_tiers') return c.need + ' more ' + (c.need === 1 ? 'tier' : 'tiers');
    if (c.error === 'not_open') return c.opensAt ? 'opens ' + when(c.opensAt) : 'soon';
    if (c.error === 'closed') return 'lights out';
    return '';
  }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      bg: 0x070a24, fog: [0x0b0f36, 34, 80], exposure: 1.0,
      env: [0x1a1650, 0x5a3a10, 0x08405a, 0x0a0820], cam: { pos: CAM.pos, look: CAM.look, fov: 40 }, designAspect: 1.9, minZoom: 0.5, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, objs: {}, litN: 0, starLit: false, starK: 0, frames: 0, pending: null };
    // перелёт камеры — только после пары кадров (см. dt < 0 в onFrame: твин ядра на первом кадре улетает)
    S.look = function (pos, target, sec) { if (S.frames >= 3) k.look(pos, target, sec); else S.pending = [pos, target, sec]; };

    // ---------- небо: тёмно-синее → фиолетовое у горизонта ----------
    scene.background = k.tex(4, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#03041a'); gr.addColorStop(0.5, '#0c1050'); gr.addColorStop(0.8, '#2a1866'); gr.addColorStop(1, '#3a1a6a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var starN = 600, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = Math.random() * Math.PI - Math.PI, el = 0.08 + Math.random() * 0.9, R = 110; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.55 + 4; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 20; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xe8e6ff, size: 0.45, transparent: true, opacity: 0.85, fog: false, depthWrite: false })));
    // неоновые волны в небе (как на арте 04): мягкие ленты
    var waveTex = k.tex(512, 128, function (g, w, h) {
      [[C.blue, 0.55, 0.0], [C.purple, 0.45, 1.7], [C.pink, 0.3, 3.1]].forEach(function (p) {
        var col = '#' + p[0].toString(16).padStart(6, '0');
        g.strokeStyle = col; g.globalAlpha = p[1]; g.lineWidth = 7; g.shadowColor = col; g.shadowBlur = 18;
        g.beginPath();
        for (var x = 0; x <= w; x += 4) { var y = h * 0.5 + Math.sin(x / w * Math.PI * 2 + p[2]) * h * 0.28; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      });
    });
    var wave = new T.Mesh(new T.PlaneGeometry(120, 22), new T.MeshBasicMaterial({ map: waveTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    wave.position.set(0, 21, -46); scene.add(wave);

    // ---------- свет ----------
    var hemi = new T.HemisphereLight(0x6a6ae0, 0x140a30, 0.55); scene.add(hemi);
    var moon = new T.DirectionalLight(0x9aa8ff, 0.45); moon.position.set(-10, 20, 12); scene.add(moon);
    var treeLight = new T.PointLight(C.gold, 0, 26, 2); treeLight.position.set(0, 5, 5); scene.add(treeLight);
    var starLight = new T.PointLight(C.gold, 0, 30, 2); starLight.position.set(0, 10.5, 2); scene.add(starLight);

    // ---------- земля и площадь ----------
    var snowTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#d6dcf4'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { var v = 205 + Math.random() * 50 | 0; g.fillStyle = 'rgba(' + v + ',' + (v + 4) + ',255,.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      for (var j = 0; j < 260; j++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
    });
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping; snowTex.repeat.set(12, 12);
    var ground = new T.Mesh(new T.PlaneGeometry(180, 180), new T.MeshStandardMaterial({ color: 0x7a86d8, map: snowTex, roughness: 0.92 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground);
    // мягкие сугробы
    var drift = new T.MeshStandardMaterial({ color: 0x8e98e6, roughness: 1 });
    for (var d = 0; d < 22; d++) {
      var ang = d / 22 * Math.PI * 2, rr = 9 + Math.random() * 6, m = new T.Mesh(new T.SphereGeometry(1, 14, 8), drift);
      m.scale.set(1.4 + Math.random() * 1.4, 0.3 + Math.random() * 0.3, 1.0 + Math.random() * 0.8);
      m.position.set(Math.cos(ang) * rr * 1.3, 0, Math.sin(ang) * rr * 0.7 - 2); if (m.position.z > 4) continue; scene.add(m);
    }

    // ---------- дома по краям площади (как на арте 03) ----------
    var winTex = k.tex(64, 64, function (g, w, h) {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#000'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h / 2 - 3, w, 6); g.lineWidth = 6; g.strokeRect(0, 0, w, h);
    });
    var roofMat = new T.MeshStandardMaterial({ color: 0xc8d0f4, roughness: 0.9, flatShading: true });
    var FAC = [0x3a2c5c, 0x2a3466, 0x4a2a52, 0x283a5c, 0x40305e];
    var windows = [];
    function house(x, z, ry, w, h, v) {
      var g = new T.Group();
      var body = new T.Mesh(new T.BoxGeometry(w, h, 3.4), new T.MeshStandardMaterial({ color: FAC[v % FAC.length], roughness: 0.85 })); body.position.y = h / 2; g.add(body);
      var geo = new T.CylinderGeometry((w + 0.6) / Math.sqrt(3), (w + 0.6) / Math.sqrt(3), 3.9, 3, 1); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI);
      var roof = new T.Mesh(geo, roofMat); roof.scale.y = 0.7; roof.position.y = h + 0.5 * (w + 0.6) / Math.sqrt(3) * 0.7; g.add(roof);
      var wm = new T.MeshStandardMaterial({ color: 0x1a1430, emissive: C.warm, emissiveMap: winTex, emissiveIntensity: 1.3, roughness: 0.4 });
      var cols = Math.max(2, Math.round(w / 1.4)), rows = Math.max(1, Math.round((h - 0.8) / 1.5));
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        if ((r * 7 + c * 3 + v) % 5 === 0) continue; // часть окон тёмные
        var win = new T.Mesh(new T.PlaneGeometry(0.62, 0.8), wm); win.position.set(-w / 2 + (c + 0.5) * (w / cols), 1.2 + r * 1.5, 1.71); g.add(win);
        var gl = k.glow(C.warm, 1.3); gl.material.opacity = 0.35; gl.position.set(win.position.x, win.position.y, 2.0); g.add(gl);
      }
      windows.push(wm);
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    }
    [[-15, -9, 0.55, 4.6, 4.2], [-19.5, -2.5, 0.95, 4.2, 3.4], [-10.5, -15, 0.25, 5, 5], [15, -9, -0.55, 4.6, 4.6], [19.5, -2.5, -0.95, 4.2, 3.6], [10.5, -15, -0.25, 5.2, 5.4], [-3.5, -22, 0, 5, 6.2], [3.8, -23, 0, 4.4, 5.2]]
      .forEach(function (p, i) { house(p[0], p[1], p[2], p[3], p[4], i); });

    // ели по краям
    var pineMat = new T.MeshStandardMaterial({ color: 0x0f5a4a, roughness: 0.9, flatShading: true });
    var pineSnow = new T.MeshStandardMaterial({ color: 0xc8d0f4, roughness: 1, flatShading: true });
    function pine(x, z, s) {
      var g = new T.Group();
      for (var j = 0; j < 3; j++) {
        var c = new T.Mesh(new T.ConeGeometry(1.4 - j * 0.35, 1.6, 7), pineMat); c.position.y = 1 + j * 0.9; g.add(c);
        var cap = new T.Mesh(new T.ConeGeometry((1.4 - j * 0.35) * 0.55, 0.7, 7), pineSnow); cap.position.y = 1.5 + j * 0.9; g.add(cap);
      }
      g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    }
    [[-12, 1, 1.3], [-9, -5, 1.1], [12.5, 0.5, 1.4], [9.5, -5.5, 1.05], [-22, -12, 1.8], [22, -12, 1.7], [-7, -12, 1.2], [7.5, -13, 1.3], [-14.5, 6, 1.1], [14.5, 6.5, 1.2]]
      .forEach(function (p) { pine(p[0], p[1], p[2]); });

    k.snow({ n: 1200, area: [46, 24, 40], center: [0, 0, -4], speed: 0.9, size: 0.16 });

    // ---------- ёлка: 6 ярусов ----------
    var needleMat = function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, emissive: 0x3a2a08, emissiveIntensity: 0 }); };
    var snowMat = new T.MeshStandardMaterial({ color: 0xe6eaff, roughness: 0.9, flatShading: true });
    var trunk = new T.Mesh(new T.CylinderGeometry(0.55, 0.75, 1.4, 10), new T.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.9 })); trunk.position.y = 0.6; scene.add(trunk);
    var tree = new T.Group(); scene.add(tree);
    var bulbGeo = new T.SphereGeometry(0.11, 10, 8);
    function tier(n) { // n: 1 — верхушка … 6 — низ
      var i = 6 - n, rb = 4.4 - i * 0.55, rt = rb * 0.42, hh = 1.9, y0 = 1.05 + i * 1.28;
      var g = new T.Group(), inner = new T.Group(); g.add(inner); g.position.y = y0;
      var mat = needleMat(0x0a4a3c), dark = new T.Color(0x0a4a3c), bright = new T.Color([0x0c8c4c, 0x0e9452, 0x0b8a4a, 0x10985a, 0x0c8848, 0x0e9050][i]);
      var body = new T.Mesh(new T.CylinderGeometry(rt, rb, hh, 14, 1, true), mat); body.position.y = hh / 2; inner.add(body);
      var under = new T.Mesh(new T.CircleGeometry(rb, 14), mat); under.rotation.x = Math.PI / 2; inner.add(under);
      // снежная кромка по нижнему краю и шапка сверху
      var rim = new T.Mesh(new T.TorusGeometry(rb * 0.98, 0.13, 6, 28), snowMat); rim.rotation.x = Math.PI / 2; rim.position.y = 0.08; rim.scale.z = 0.6; inner.add(rim);
      var cap = new T.Mesh(new T.CylinderGeometry(rt * 0.95, rt * 1.25, 0.22, 14), snowMat); cap.position.y = hh - 0.02; inner.add(cap);
      // гирлянда-петля: провисающие «фестоны» вокруг яруса
      var nb = 16 + i * 4, bulbs = [], pts = [], swag = 5 + i;
      for (var b = 0; b <= nb * 3; b++) {
        var u = b / (nb * 3), an = u * Math.PI * 2, yy = 0.42 + Math.abs(Math.sin(u * Math.PI * swag)) * 0.38 - 0.38;
        var rad = rb - (rb - rt) * ((yy + 0.38 + 0.04) / hh) + 0.08;
        pts.push(new T.Vector3(Math.cos(an) * rad, 0.38 + yy, Math.sin(an) * rad));
      }
      var curve = new T.CatmullRomCurve3(pts, true);
      var wireMat = new T.MeshStandardMaterial({ color: 0x24264a, emissive: C.gold, emissiveIntensity: 0, roughness: 0.5 });
      var wire = new T.Mesh(new T.TubeGeometry(curve, nb * 6, 0.025, 4, true), wireMat); inner.add(wire);
      for (var q = 0; q < nb; q++) {
        var col = BULBS[(q + n) % 4], p = curve.getPointAt((q + 0.5) / nb);
        var bm = new T.MeshStandardMaterial({ color: 0x2a2a48, emissive: col, emissiveIntensity: 0, roughness: 0.35 });
        var mesh = new T.Mesh(bulbGeo, bm); mesh.position.copy(p); inner.add(mesh);
        var gl = k.glow(col, 0.75); gl.position.copy(p); gl.material.opacity = 0; inner.add(gl);
        bulbs.push({ m: bm, gl: gl, i: q, a: Math.atan2(p.z, p.x) });
      }
      // кольцо «текущий ярус»
      var ring = new T.Mesh(new T.TorusGeometry(rb + 0.18, 0.05, 6, 48), new T.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0, fog: false }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
      tree.add(g);
      return { g: g, inner: inner, mat: mat, dark: dark, bright: bright, wire: wireMat, bulbs: bulbs, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, labelAt: [0, hh * 0.5, rb * 0.62 + 0.4], n: n };
    }

    // ---------- звезда ∞ ----------
    function starObj() {
      var g = new T.Group(); g.position.set(0, 10.25, 0.1);
      var pts = [];
      for (var s = 0; s < 120; s++) { var t = s / 120 * Math.PI * 2, den = 1 + Math.sin(t) * Math.sin(t); pts.push(new T.Vector3(1.05 * Math.cos(t) / den, 1.05 * Math.sin(t) * Math.cos(t) / den, 0.12 * Math.sin(t))); }
      var curve = new T.CatmullRomCurve3(pts, true);
      var mat = new T.MeshStandardMaterial({ color: 0x8a6a10, emissive: C.gold, emissiveIntensity: 0, metalness: 0.7, roughness: 0.25 });
      var tube = new T.Mesh(new T.TubeGeometry(curve, 160, 0.17, 10, true), mat); g.add(tube);
      var post = new T.Mesh(new T.CylinderGeometry(0.06, 0.1, 0.9, 8), new T.MeshStandardMaterial({ color: 0x8a6a10, metalness: 0.7, roughness: 0.3 })); post.position.y = -0.75; g.add(post);
      var gl = k.glow(C.gold, 4.6); gl.material.opacity = 0; g.add(gl);
      var halo = k.glow(C.gold, 9); halo.material.opacity = 0; g.add(halo);
      // неоновые кольца вокруг ёлки (появляются, когда звезда горит)
      var rings = [[C.pink, 6.2, 0.35, 0.2, 6.6], [C.blue, 5.6, -0.3, 1.9, 5.2], [C.purple, 6.8, 0.2, 3.6, 3.4]].map(function (r) {
        var m = new T.Mesh(new T.TorusGeometry(r[1], 0.06, 6, 120, 4.4), new T.MeshBasicMaterial({ color: r[0], transparent: true, opacity: 0, fog: false, blending: T.AdditiveBlending, depthWrite: false }));
        m.rotation.set(Math.PI / 2 + r[2], 0, r[3]); m.position.y = r[4]; scene.add(m);
        var soft = new T.Mesh(new T.TorusGeometry(r[1], 0.22, 6, 120, 4.4), new T.MeshBasicMaterial({ color: r[0], transparent: true, opacity: 0, fog: false, blending: T.AdditiveBlending, depthWrite: false }));
        m.add(soft);
        return { m: m, soft: soft, sp: 0.12 + Math.random() * 0.1 };
      });
      scene.add(g);
      return { g: g, inner: g, mat: mat, glow: gl, halo: halo, rings: rings, bulbs: [], lit: 0, target: 0, chase: 0, hover: 0, labelAt: [0, 1.2, 0], star: true };
    }

    // ---------- тренировочный шар на золотой арке ----------
    function baubleObj() {
      var g = new T.Group(); g.position.set(-8.6, 0, 1.8);
      var gold = new T.MeshStandardMaterial({ color: 0xd8a020, metalness: 0.85, roughness: 0.3 });
      var post = new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 4.4, 10), gold); post.position.y = 2.2; g.add(post);
      var arc = new T.Mesh(new T.TorusGeometry(0.7, 0.07, 8, 24, Math.PI), gold); arc.position.set(0.7, 4.4, 0); g.add(arc);
      var str = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.7, 4), gold); str.position.set(1.4, 4.05, 0); g.add(str);
      var mat = new T.MeshStandardMaterial({ color: C.purple, emissive: C.purple, emissiveIntensity: 0.05, metalness: 0.35, roughness: 0.15 });
      var ball = new T.Mesh(new T.SphereGeometry(0.62, 28, 20), mat); ball.position.set(1.4, 3.1, 0); g.add(ball);
      var capm = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.18, 12), gold); capm.position.set(1.4, 3.75, 0); g.add(capm);
      // золотая лента ∞ по шару
      var band = new T.Mesh(new T.TorusGeometry(0.63, 0.04, 6, 40), gold); band.position.copy(ball.position); band.rotation.x = Math.PI / 2; g.add(band);
      var gl = k.glow(C.purple, 2.6); gl.position.copy(ball.position); gl.material.opacity = 0; g.add(gl);
      var ring = new T.Mesh(new T.RingGeometry(1.3, 1.45, 40), new T.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0.7, 0.04, 0); g.add(ring);
      scene.add(g);
      return { g: g, inner: g, mat: mat, glow: gl, ring: ring, ball: ball, bulbs: [], lit: 0, target: 0, chase: 0, hover: 0, labelAt: [1.4, 2.05, 0.4], bauble: true };
    }

    // ---------- подарки справа и у ствола ----------
    var GIFT = [[C.pink, C.gold], [C.blue, C.gold], [C.gold, C.pink], [C.purple, C.gold], [0x12b066, C.pink], [C.pink, C.blue], [C.blue, C.pink]];
    function gift(x, z, s, v, ry) {
      var c = GIFT[v % GIFT.length], g = new T.Group();
      var bx = new T.Mesh(new T.BoxGeometry(s, s * 0.9, s), new T.MeshStandardMaterial({ color: c[0], roughness: 0.35, metalness: 0.1 })); bx.position.y = s * 0.45; g.add(bx);
      var rib = new T.MeshStandardMaterial({ color: c[1], roughness: 0.3, metalness: 0.5 });
      var r1 = new T.Mesh(new T.BoxGeometry(s + 0.02, s * 0.9 + 0.02, s * 0.16), rib); r1.position.y = s * 0.45; g.add(r1);
      var r2 = new T.Mesh(new T.BoxGeometry(s * 0.16, s * 0.9 + 0.02, s + 0.02), rib); r2.position.y = s * 0.45; g.add(r2);
      var bow = new T.Mesh(new T.TorusGeometry(s * 0.16, s * 0.06, 6, 12), rib); bow.position.y = s * 0.95; g.add(bow);
      var bow2 = bow.clone(); bow2.rotation.y = Math.PI / 2; g.add(bow2);
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    }
    [[5.4, 3.4, 1.15, 0, 0.3], [6.7, 2.4, 0.9, 1, -0.4], [6.1, 4.6, 0.75, 2, 0.8], [7.6, 3.9, 1.0, 3, 0.1], [5.0, 5.2, 0.6, 4, -0.7], [8.3, 2.0, 0.7, 5, 0.5],
      [2.6, 3.5, 0.8, 6, 0.2], [-2.4, 3.6, 0.7, 2, -0.3], [3.4, 2.2, 0.6, 3, 0.9], [-3.2, 2.4, 0.85, 0, 0.4], [1.2, 4.2, 0.55, 5, -0.2]]
      .forEach(function (p) { gift(p[0], p[1], p[2], p[3], p[4]); });

    // ---------- Coiny (PNG из утверждённого арта 04) ----------
    var coiny = k.billboard('../../nolimitcoins/assets/coiny-wave.png', 3.1);
    coiny.position.set(-4.1, 0, 6.2); scene.add(coiny);
    var coinyGlow = k.glow(C.purple, 3.4); coinyGlow.position.set(0, 1.4, -0.3); coinyGlow.material.opacity = 0.35; coiny.add(coinyGlow);

    // ---------- уровни → объекты ----------
    S.place = function (L) {
      var o = S.objs[L.id];
      if (o) return o;
      o = L.id === 'star' ? starObj() : L.id === 'practice' ? baubleObj() : tier(L.n || +String(L.id).replace(/\D/g, '') || 1);
      var openIt = function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); };
      o.lab = k.label(o.star ? o.g : o.g, o.labelAt, '', openIt);
      if (o.star) o.lab.cls('star', true);
      k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
      o.id = L.id; S.objs[L.id] = o;
      return o;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      dt = Math.max(0, dt); // ядро может отдать dt < 0 на первом кадре (rAF-штамп раньше performance.now()) — без этого lerp разлетается
      if (++S.frames === 3 && S.pending) { k.look.apply(null, S.pending); S.pending = null; }
      var tierLit = 0;
      Object.keys(S.objs).forEach(function (id) {
        var o = S.objs[id], cur = S.current === id;
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        o.chase = Math.max(0, o.chase - dt * 0.45);
        var sc = 1 + o.hover * 0.025; o.inner.scale.x += (sc - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        if (o.ring) o.ring.material.opacity += ((cur ? 0.95 : o.hover ? 0.45 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        if (o.star) {
          var open = o.state === 'open';
          o.mat.emissiveIntensity = o.lit * 2.6 + (open ? 0.18 + 0.14 * Math.sin(t * 2.4) : 0.02) + (cur || o.hover ? 0.3 : 0);
          o.glow.material.opacity = Math.min(1, o.lit * 0.95 + (open ? 0.1 + 0.06 * Math.sin(t * 2.4) : 0));
          o.halo.material.opacity = o.lit * 0.45;
          o.g.rotation.y = Math.sin(t * 0.6) * 0.25;
          starLight.intensity = o.lit * 2.2;
          o.rings.forEach(function (r, i) { r.m.rotation.z += dt * r.sp * (i % 2 ? -1 : 1); r.m.material.opacity = o.lit * 0.85; r.soft.material.opacity = o.lit * 0.22; });
          return;
        }
        if (o.bauble) {
          o.mat.emissiveIntensity = 0.05 + o.lit * 0.9 + (o.state === 'open' ? 0.12 + 0.08 * Math.sin(t * 2) : 0);
          o.glow.material.opacity = o.lit * 0.75 + (o.state === 'open' ? 0.15 : 0);
          o.ball.position.x = 1.4 + Math.sin(t * 1.2) * 0.05; o.glow.position.x = o.ball.position.x;
          return;
        }
        if (o.state === 'lit') tierLit++;
        // тёмный ярус — глубокая хвоя; зажжённый — сочнее и с тёплым отсветом гирлянды
        o.mat.color.copy(o.dark).lerp(o.bright, o.lit);
        o.mat.emissiveIntensity = o.lit * 0.5;
        o.wire.emissiveIntensity = o.lit * 0.9;
        var n = o.bulbs.length, run = (t * 0.35) % 1; // «ищущий» огонёк по открытому ярусу
        o.bulbs.forEach(function (b) {
          var on;
          if (o.chase > 0) on = ((1 - o.chase) * 1.5 * n > b.i) ? 1 : 0.1;
          else on = o.lit * (0.72 + 0.28 * Math.sin(t * 2.4 + b.i * 1.1));
          if (o.lit < 0.5 && !o.chase) {
            if (o.state === 'active') on = Math.max(on, b.i % 3 === 0 ? 0.5 : 0);
            else if (o.state === 'open') { var dd = Math.abs(b.i / n - run); dd = Math.min(dd, 1 - dd); on = Math.max(on, dd < 0.03 ? 0.8 : 0); }
          }
          b.m.emissiveIntensity = on * 1.7; // выше — тонмаппинг выжигает цвет лампочек в белый
          b.gl.material.opacity = on * 0.7;
        });
      });
      treeLight.intensity = tierLit / 6 * 1.6;
      coiny.children.length && (coinyGlow.material.opacity = 0.3 + 0.1 * Math.sin(t * 2));
      wave.material.opacity = 0.38 + 0.12 * Math.sin(t * 0.4);
    });

    // узкий кадр (телефон): Coiny выходит вперёд на пустой снег внизу, арка с шаром ближе к центру — иначе обрезаны
    S.layout = function () {
      var tall = S.frame && S.frame.t > 0.6;
      if (tall) coiny.position.set(-1.9, 0, 10.2); else coiny.position.set(-4.1, 0, 6.2);
      var b = S.objs.practice; if (b) { if (tall) b.g.position.set(-5.9, 0, 4.2); else b.g.position.set(-8.6, 0, 1.8); }
    };
    S.k = k;
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F; S.layout();
      k.camera.fov = F.fov;
      if (F.t > 0) k.camera.zoom = F.zoom;
      k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') S.look(F.pos, F.look, 0.4);
    });
    return S;
  }

  // ======================================================================================================
  function render(box, levels, opts) {
    opts = opts || {};
    var S = box._t3d;
    if (!S) {
      if (!supported()) return window.GarlandTree ? GarlandTree.render(box, levels, opts) : null;
      css();
      box.classList.add('t3d');
      Array.prototype.slice.call(box.children).forEach(function (c) { if (!c.classList.contains('t3d-title')) box.removeChild(c); });
      S = build(box);
      if (!S) { box.classList.remove('t3d'); return window.GarlandTree ? GarlandTree.render(box, levels, opts) : null; }
      box._t3d = S;
      S.note = document.createElement('p'); S.note.className = 't3d-note'; S.note.hidden = true; box.appendChild(S.note);
    }
    if (S.k.debug('lit')) levels = levels.map(function (L) { return Object.assign({}, L, { status: 'lit' }); });
    var prev = S.levels, fresh = !S.objs.practice;
    S.levels = levels; S.onOpen = opts.onOpen; S.current = opts.current || null;
    levels.forEach(function (L) {
      var o = S.place(L), st = stOf(L);
      var was = prev && prev.find(function (x) { return x.id === L.id; });
      if (was && was.status !== 'lit' && L.status === 'lit') o.chase = 1; // только что зажгли — гирлянда бежит
      o.state = st; o.target = st === 'lit' ? 1 : 0;
      var name = L.id === 'star' ? '∞ Infinity Star' : L.id === 'practice' ? 'Practice' : 'Tier ' + (L.n || L.id.replace(/\D/g, ''));
      o.lab.set(name + '<small>' + status(L) + '</small>');
      o.lab.el.setAttribute('aria-label', (L.title || name) + ': ' + status(L));
      o.lab.cls('lit', st === 'lit'); o.lab.cls('locked', st === 'locked'); o.lab.cls('ready', st === 'open'); o.lab.cls('cur', S.current === L.id);
    });
    if (fresh) S.layout();
    // подпись под ёлкой: что откроется и когда (как в 2D)
    var star = levels.find(function (l) { return l.id === 'star'; }), note = '';
    var nx = levels.filter(function (l) { return l.status === 'new' && l.can && !l.can.ok && l.can.error === 'not_open'; }).sort(function (a, b) { return a.can.opensAt - b.can.opensAt; })[0];
    if (star && star.status === 'new' && star.can && star.can.error === 'need_tiers') note = 'Light ' + star.can.need + ' more ' + (star.can.need === 1 ? 'tier' : 'tiers') + ' to unlock the Infinity Star.';
    else if (nx) note = (nx.id === 'star' ? 'The Infinity Star' : nx.id === 'practice' ? 'Practice' : 'Next tiers') + ' open ' + when(nx.can.opensAt) + '.';
    S.note.textContent = note; S.note.hidden = !note;

    // камера: к текущему ярусу/звезде/шару, иначе общий план
    var cur = S.current && S.objs[S.current], k = S.k;
    if (cur) {
      var key = 'cur:' + S.current;
      if (S.camKey !== key) {
        S.camKey = key;
        var wp = new k.T.Vector3(); cur.g.getWorldPosition(wp);
        var tall = S.frame && S.frame.t > 0.5;
        var bx = cur.g.position.x + 1.4;
        if (cur.bauble) S.look([bx + 2.8, 4.4, cur.g.position.z + 9 + (tall ? 4 : 0)], [bx, 2.8, cur.g.position.z], 1.5);
        else if (cur.star) S.look([0, 9.6, 11 + (tall ? 5 : 0)], [0, 8.6, 0], 1.5);
        else S.look([0, wp.y + 2.4, 12.5 + (tall ? 5 : 0) + (6 - cur.n) * 0.5], [0, wp.y + 0.6, 0], 1.5);
      }
    } else if (S.camKey !== 'all') { S.camKey = 'all'; S.look(S.frame.pos, S.frame.look, 1.5); }
    return S;
  }

  window.Tree3D = { render: render, supported: supported };
})();
