/**
 * 3D-бульвар Countdown on the Strip (Vegas Way) на ядре _3d/ny3d.js. Мир вокруг лобби; игра (StripGame) не меняется.
 *   Strip3D.render(box, me, { onOpen(act) })  — me = ответ /api/me; первый вызов строит сцену, дальше только обновляет
 *   Strip3D.launch(box)                        — полночь: ракета игрока взлетает, шар над театром опускается
 *   Strip3D.supported()                        — есть ли WebGL (иначе страница остаётся как была: сетка актов)
 * Сюжет: ночь 31.12 на Стрипе. Вдоль бульвара шесть шоу-румов Мага (акты I–V) и театр Арлекины в конце (акт VI).
 * Сыгранный акт — марки-лампы бегут, неон на вывеске горит, скульптура на крыше светится. Открытый — лампы мигают,
 * закрытый — темно. Посередине площадка с ракетой игрока: цвет и размер = уровень (искра/красная/голубая/золотая).
 * Неон — только абстрактные формы (ромбы, звёзды, волны), никаких букв и цифр.
 */
(function () {
  'use strict';
  var C = { red: 0xff2b39, cy: 0x01c9ff, gold: 0xbcaa74, bulb: 0xffda0a, night: 0x00131a, warm: 0xffc46b, mag: 0xff3fae };
  var NEON = [C.cy, C.red, C.bulb, C.cy, C.red, C.bulb];
  var FACADES = [0x0b5f86, 0x9c1730, 0x4a2a9c, 0x0d7a62, 0x153f9a, 0x8a1a66];
  var TIER = { spark: { c: 0xfff3b0, s: 0.6 }, red: { c: C.red, s: 0.8 }, blue: { c: C.cy, s: 1 }, gold: { c: C.bulb, s: 1.25 } };
  // места: [x, z, поворот]; акт VI — театр в конце бульвара
  var SPOTS = { 1: [-7.4, 0.5, 0.82], 2: [7.4, -5.5, -0.82], 3: [-7.4, -11.5, 0.82], 4: [7.4, -17.5, -0.82], 5: [-7.4, -23.5, 0.82], 6: [0, -32, 0] };
  var CAM = { pos: [0, 9, 22], look: [0, 3.4, -9] };
  var CAM_TALL = { pos: [0, 15.5, 12.5], look: [0, 0, -13] };

  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 44 + 16 * t, zoom: Math.max(0.5, Math.min(1, a / 1.1)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function roman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || n; }

  function css() {
    if (document.getElementById('v3d-css')) return;
    var s = document.createElement('style'); s.id = 'v3d-css';
    s.textContent =
      '.v3d{height:clamp(520px,86vh,980px);margin:0 0 18px;border-radius:16px;background:#00131A;box-shadow:0 0 0 1px rgba(188,170,116,.28),0 30px 80px rgba(0,0,0,.5)}' +
      '.v3d .ny3d-label{font:900 13px/1.05 Raleway,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#fff;' +
      'background:rgba(0,19,26,.82);border:1px solid rgba(1,201,255,.35);border-radius:999px;padding:6px 13px 7px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;backdrop-filter:blur(4px)}' +
      '.v3d .ny3d-label small{font:700 11px/1 Raleway,system-ui,sans-serif;text-transform:none;letter-spacing:.01em;color:#B9CDD4}' +
      '.v3d .ny3d-label.done{border-color:#FFDA0A;box-shadow:0 0 16px rgba(255,218,10,.4)} .v3d .ny3d-label.done small{color:#FFDA0A}' +
      '.v3d .ny3d-label.ready{border-color:#01C9FF;box-shadow:0 0 14px rgba(1,201,255,.35)} .v3d .ny3d-label.ready small{color:#01C9FF}' +
      '.v3d .ny3d-label.final{border-color:#FF2B39} .v3d .ny3d-label.final.ready small{color:#FF2B39}' +
      '.v3d .ny3d-label.locked{opacity:.66;cursor:default}' +
      '.v3d div.ny3d-label{cursor:default;border-color:rgba(255,218,10,.5)}' +
      '.v3d .ny3d-label:focus-visible{outline:2px solid #01C9FF;outline-offset:2px}' +
      '.v3d-title{position:absolute;left:0;right:0;top:0;padding:16px 18px;pointer-events:none;z-index:2;text-align:center}' +
      '.v3d-title .marquee{margin:0}' +
      '@media (max-width:600px){.v3d .ny3d-label{font-size:11px;padding:5px 9px}.v3d .ny3d-label small{font-size:10px}}';
    document.head.appendChild(s);
  }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      bg: C.night, fog: [0x0a1838, 50, 165], exposure: 1.02,
      env: [0x01c9ff, 0xff2b39, 0xe8f6ff, 0x7a1030, 0x102040], cam: { pos: CAM.pos, look: CAM.look, fov: 44 }, designAspect: 2, minZoom: 0.42, parallax: 0.9,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, venues: {}, launchT: -1 };

    // ---------- небо ----------
    scene.background = k.tex(4, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#01040c'); gr.addColorStop(0.5, '#06203e'); gr.addColorStop(0.82, '#3a0f3e'); gr.addColorStop(1, '#7a1a3a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var starN = 420, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = Math.random() * Math.PI - Math.PI, el = 0.25 + Math.random() * 0.9, R = 140; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.6 + 20; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 40; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xdffcff, size: 0.5, transparent: true, opacity: 0.8, fog: false, depthWrite: false })));

    // ---------- свет: ночь + цветные пятна неона (насыщенность) ----------
    scene.add(new T.HemisphereLight(0x3a6ad0, 0x1a0a20, 0.55));
    var moon = new T.DirectionalLight(0x9fc0ff, 0.35); moon.position.set(-10, 24, 12); scene.add(moon);
    [[C.red, -6, -4], [C.cy, 6, -10], [C.mag, -6, -18], [C.cy, 6, -24], [C.bulb, 0, -27]].forEach(function (p) {
      var L = new T.PointLight(p[0], 1.6, 22, 2); L.position.set(p[1], 4, p[2]); scene.add(L);
    });
    var padLight = new T.PointLight(C.bulb, 0.9, 12, 2); padLight.position.set(0, 3, 5); scene.add(padLight);

    // ---------- бульвар ----------
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#121822'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 4000; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = '#ffda0a'; for (var y = 0; y < h; y += 64) { g.fillRect(w / 2 - 9, y, 6, 36); g.fillRect(w / 2 + 3, y, 6, 36); }
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(10, 0, 5, h); g.fillRect(w - 15, 0, 5, h);
    });
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 5);
    var road = new T.Mesh(new T.PlaneGeometry(8, 60), new T.MeshStandardMaterial({ map: roadTex, roughness: 0.45, metalness: 0.25 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -12); scene.add(road);
    var walkTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#2b2440'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(188,170,116,.35)'; g.lineWidth = 3;
      for (var x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
    });
    walkTex.wrapS = walkTex.wrapT = T.RepeatWrapping; walkTex.repeat.set(2, 20);
    [-1, 1].forEach(function (sd) {
      var wk = new T.Mesh(new T.PlaneGeometry(4, 60), new T.MeshStandardMaterial({ map: walkTex, roughness: 0.6, metalness: 0.15 }));
      wk.rotation.x = -Math.PI / 2; wk.position.set(sd * 6, 0.02, -12); scene.add(wk);
      // бортик-неон вдоль тротуара
      var curb = new T.Mesh(new T.BoxGeometry(0.12, 0.08, 60), new T.MeshStandardMaterial({ color: 0x111111, emissive: sd < 0 ? C.red : C.cy, emissiveIntensity: 1.4 }));
      curb.position.set(sd * 4.05, 0.05, -12); scene.add(curb);
    });
    var ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: 0x0a1426, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -30; scene.add(ground);
    var plaza = new T.Mesh(new T.CircleGeometry(8.5, 48), new T.MeshStandardMaterial({ color: 0x3a1030, roughness: 0.4, metalness: 0.4 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.03, -29); scene.add(plaza);

    // ---------- текстуры: окна, неон, рубашка карты, ромбы Арлекины ----------
    var winTex = k.tex(128, 128, function (g, w, h) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (var y = 10; y < h - 8; y += 22) for (var x = 10; x < w - 8; x += 22) { if (Math.random() < 0.72) { g.fillStyle = Math.random() < 0.5 ? '#ffd890' : '#fff0c8'; g.fillRect(x, y, 12, 14); } }
    });
    winTex.wrapS = winTex.wrapT = T.RepeatWrapping;
    function neonTex(col, seed) {
      var css = '#' + new T.Color(col).getHexString();
      return k.tex(64, 256, function (g, w, h) {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        g.strokeStyle = css; g.fillStyle = css; g.lineWidth = 5; g.shadowColor = css; g.shadowBlur = 10;
        g.strokeRect(5, 5, w - 10, h - 10);
        var shapes = [diamond, star, circle, wave], cy = 34;
        for (var i = 0; i < 4; i++) { shapes[(i + seed) % 4](g, w / 2, cy, 17); cy += 60; }
      });
    }
    function diamond(g, x, y, r) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.75, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.75, y); g.closePath(); g.stroke(); }
    function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.stroke(); }
    function wave(g, x, y, r) { g.beginPath(); for (var i = -r; i <= r; i += 2) { var yy = y + Math.sin(i / r * Math.PI * 2) * r * 0.45; if (i === -r) g.moveTo(x + i, yy); else g.lineTo(x + i, yy); } g.stroke(); }
    function star(g, x, y, r) { g.beginPath(); for (var s = 0; s < 10; s++) { var an = -Math.PI / 2 + s * Math.PI / 5, rr = s % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.stroke(); }
    function boardTex(col) { // марки-табло над входом: ряды точек и ромбов, без букв
      var css = '#' + new T.Color(col).getHexString();
      return k.tex(256, 64, function (g, w, h) {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        g.fillStyle = css; g.strokeStyle = css; g.lineWidth = 4; g.shadowColor = css; g.shadowBlur = 8;
        g.strokeRect(4, 4, w - 8, h - 8);
        for (var x = 26; x < w - 20; x += 34) diamond(g, x, h / 2, 12);
      });
    }
    var cardBack = k.tex(128, 192, function (g, w, h) {
      g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c4122a'; g.fillRect(10, 10, w - 20, h - 20);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
      for (var i = -h; i < w + h; i += 14) { g.beginPath(); g.moveTo(i, 10); g.lineTo(i + h, h - 10); g.stroke(); g.beginPath(); g.moveTo(i + h, 10); g.lineTo(i, h - 10); g.stroke(); }
      g.strokeStyle = '#ffda0a'; g.lineWidth = 3; g.strokeRect(16, 16, w - 32, h - 32);
    });
    var harlTex = k.tex(256, 256, function (g, w, h) {
      var n = 6, cw = w / n, ch = h / 4;
      for (var r = -1; r < 5; r++) for (var c = -1; c <= n; c++) {
        g.fillStyle = (r + c) % 2 ? '#b0102a' : '#12091a';
        var x = c * cw + (r % 2 ? cw / 2 : 0), y = r * ch;
        g.beginPath(); g.moveTo(x + cw / 2, y); g.lineTo(x + cw, y + ch / 2); g.lineTo(x + cw / 2, y + ch); g.lineTo(x, y + ch / 2); g.closePath(); g.fill();
        g.strokeStyle = '#d8b25a'; g.lineWidth = 2; g.stroke();
      }
    });

    // ---------- общие материалы ----------
    var brass = new T.MeshStandardMaterial({ color: 0xbcaa74, metalness: 0.85, roughness: 0.3 });
    var blackGloss = new T.MeshStandardMaterial({ color: 0x0d0d12, metalness: 0.4, roughness: 0.25 });
    var bulbGeo = new T.SphereGeometry(0.085, 8, 6);

    function bulbRow(parent, pts, col, list, size) {
      pts.forEach(function (p) {
        var m = new T.MeshStandardMaterial({ color: 0x2a2416, emissive: col, emissiveIntensity: 0 });
        var b = new T.Mesh(bulbGeo, m); b.position.set(p[0], p[1], p[2]); parent.add(b);
        var gl = k.glow(col, size || 0.55); gl.position.copy(b.position); gl.material.opacity = 0; parent.add(gl);
        list.push({ m: m, gl: gl, i: list.length });
      });
    }

    // ---------- скульптуры на крыше ----------
    function topHat(s) {
      var g = new T.Group();
      var brim = new T.Mesh(new T.CylinderGeometry(1.25 * s, 1.25 * s, 0.12 * s, 28), blackGloss); brim.position.y = 0.06 * s; g.add(brim);
      var crown = new T.Mesh(new T.CylinderGeometry(0.78 * s, 0.72 * s, 1.35 * s, 28), blackGloss); crown.position.y = 0.8 * s; g.add(crown);
      var band = new T.Mesh(new T.CylinderGeometry(0.735 * s, 0.735 * s, 0.24 * s, 28), new T.MeshStandardMaterial({ color: 0x7a0c18, emissive: C.red, emissiveIntensity: 0.3 })); band.position.y = 0.3 * s; g.add(band);
      return g;
    }
    function card(w, h) { return new T.Mesh(new T.BoxGeometry(w, h, 0.06), [brass, brass, brass, brass, new T.MeshStandardMaterial({ map: cardBack, roughness: 0.5 }), new T.MeshStandardMaterial({ map: cardBack, roughness: 0.5 })]); }
    function sculpture(v, glowList) {
      var g = new T.Group();
      if (v === 1) { var h1 = topHat(1); h1.rotation.z = -0.12; g.add(h1); }
      if (v === 2) { var c2 = card(1.7, 2.5); c2.position.y = 1.3; c2.rotation.y = 0.35; c2.rotation.z = 0.12; g.add(c2); }
      if (v === 3) {
        var stand = new T.Mesh(new T.CylinderGeometry(0.45, 0.7, 0.5, 20), brass); stand.position.y = 0.25; g.add(stand);
        var ballMat = new T.MeshStandardMaterial({ color: 0x0a3a6a, emissive: C.cy, emissiveIntensity: 0.4, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.92 });
        var ball = new T.Mesh(new T.SphereGeometry(0.95, 32, 20), ballMat); ball.position.y = 1.35; g.add(ball);
        var gl = k.glow(C.cy, 3.4); gl.position.y = 1.35; g.add(gl); glowList.push({ gl: gl, m: ballMat, base: 0.4 });
      }
      if (v === 4) { [-1.5, -0.5, 0.5, 1.5].forEach(function (x, i) { var hh = topHat(0.5); hh.position.set(x, i % 2 ? 0.15 : 0, 0); hh.rotation.z = (i - 1.5) * 0.12; g.add(hh); }); }
      if (v === 5) { for (var c = 0; c < 5; c++) { var cc = card(1.0, 1.5); cc.geometry.translate(0, 0.75, 0); cc.position.set(0, 0.1, c * 0.02); cc.rotation.z = (c - 2) * 0.32; g.add(cc); } }
      return g;
    }

    // ---------- шоу-рум (акты I–V) ----------
    function venue(v) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var w = 5.2, h = 4.4 + (v % 2) * 0.8, dp = 4, col = NEON[v - 1];
      var wt = winTex.clone(); wt.needsUpdate = true; wt.repeat.set(2, 2);
      var winMat = new T.MeshStandardMaterial({ color: FACADES[v - 1], roughness: 0.55, metalness: 0.25, emissive: C.warm, emissiveMap: wt, emissiveIntensity: 0.15 });
      var body = new T.Mesh(new T.BoxGeometry(w, h, dp), winMat); body.position.y = h / 2; inner.add(body);
      var cornice = new T.Mesh(new T.BoxGeometry(w + 0.3, 0.3, dp + 0.3), brass); cornice.position.y = h + 0.15; inner.add(cornice);
      var base = new T.Mesh(new T.BoxGeometry(w + 0.1, 1.9, 0.1), blackGloss); base.position.set(0, 0.95, dp / 2 + 0.03); inner.add(base);
      // вход: светлые двери
      var doorMat = new T.MeshStandardMaterial({ color: 0x221a10, emissive: C.warm, emissiveIntensity: 0 });
      var door = new T.Mesh(new T.PlaneGeometry(1.6, 1.6), doorMat); door.position.set(0, 0.8, dp / 2 + 0.09); inner.add(door);
      // козырёк-марки с лампами
      var fz = dp / 2, cz = fz + 0.85;
      var canopy = new T.Mesh(new T.BoxGeometry(w * 0.86, 0.34, 1.7), brass); canopy.position.set(0, 2.15, cz - 0.05); inner.add(canopy);
      var bulbs = [];
      var bw = w * 0.43, pts = [];
      for (var b = 0; b <= 14; b++) pts.push([-bw + (bw * 2) * (b / 14), 1.96, cz + 0.82]);
      for (var s2 = 1; s2 <= 3; s2++) { pts.push([-bw, 1.96, cz + 0.82 - s2 * 0.45]); pts.push([bw, 1.96, cz + 0.82 - s2 * 0.45]); }
      bulbRow(inner, pts, C.bulb, bulbs);
      // табло над козырьком
      var boardMat = new T.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: boardTex(col), emissiveIntensity: 0.15 });
      var board = new T.Mesh(new T.BoxGeometry(w * 0.8, 0.85, 0.12), [blackGloss, blackGloss, blackGloss, blackGloss, boardMat, blackGloss]);
      board.position.set(0, 2.78, cz + 0.6); inner.add(board);
      var bpts = []; for (var t2 = 0; t2 <= 12; t2++) bpts.push([-w * 0.4 + w * 0.8 * (t2 / 12), 3.26, cz + 0.68]);
      bulbRow(inner, bpts, C.bulb, bulbs, 0.45);
      // вертикальная неон-вывеска («лезвие») на углу к дороге
      var neonMat = new T.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: neonTex(col, v), emissiveIntensity: 0.12 });
      var blade = new T.Mesh(new T.BoxGeometry(0.3, h + 1.6, 1.25), [neonMat, neonMat, blackGloss, blackGloss, blackGloss, blackGloss]);
      blade.position.set(w / 2 + 0.25, (h + 1.6) / 2 + 0.6, fz - 0.3); inner.add(blade);
      var bladeGlow = k.glow(col, 4.2); bladeGlow.position.set(w / 2 + 0.6, h * 0.6 + 0.6, fz - 0.3); bladeGlow.material.opacity = 0; inner.add(bladeGlow);
      // скульптура на крыше
      var sglow = [];
      var sc = sculpture(v, sglow); sc.position.set(-0.4, h + 0.3, -0.2); inner.add(sc);
      var spot = k.glow(col, 5); spot.position.set(-0.4, h + 1.4, 0.4); spot.material.opacity = 0; inner.add(spot);
      // свет у входа на тротуар
      var spill = k.glow(C.warm, 4.2); spill.position.set(0, 0.6, cz + 1.3); spill.material.opacity = 0; inner.add(spill);
      var topH = h + 0.3 + (v === 2 ? 2.8 : v === 5 ? 1.8 : v === 3 ? 2.3 : 1.6);
      return { g: g, inner: inner, win: winMat, door: doorMat, board: boardMat, neon: neonMat, bladeGlow: bladeGlow, spot: spot, spill: spill, sglow: sglow, bulbs: bulbs, lit: 0, ready: 0, hover: 0, h: Math.max(topH, h + 1.6 + 0.6) };
    }

    // ---------- театр Арлекины (акт VI, финал) ----------
    function theatre() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var w = 10, h = 6.2, dp = 5;
      var harlMat = new T.MeshStandardMaterial({ map: harlTex, roughness: 0.45, metalness: 0.2, emissive: 0xffffff, emissiveMap: harlTex, emissiveIntensity: 0.05 });
      harlTex.wrapS = harlTex.wrapT = T.RepeatWrapping; harlTex.repeat.set(2, 1.2);
      var body = new T.Mesh(new T.BoxGeometry(w, h, dp), [harlMat, harlMat, blackGloss, blackGloss, harlMat, harlMat]); body.position.y = h / 2; inner.add(body);
      var cornice = new T.Mesh(new T.BoxGeometry(w + 0.5, 0.4, dp + 0.5), brass); cornice.position.y = h + 0.2; inner.add(cornice);
      // купол-корона
      var dome = new T.Mesh(new T.SphereGeometry(2.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x9a1028, metalness: 0.5, roughness: 0.3 })); dome.position.y = h + 0.4; inner.add(dome);
      for (var p = 0; p < 7; p++) { var an = p / 7 * Math.PI * 2, spk = new T.Mesh(new T.ConeGeometry(0.22, 1.1, 8), brass); spk.position.set(Math.cos(an) * 2.3, h + 1.0, Math.sin(an) * 2.3); inner.add(spk); }
      // портал и занавес
      var fz = dp / 2 + 0.02;
      var arch = new T.Mesh(new T.BoxGeometry(5.6, 4.4, 0.3), brass); arch.position.set(0, 2.2, fz); inner.add(arch);
      var curtainMat = new T.MeshStandardMaterial({ color: 0xc4122a, roughness: 0.6, emissive: C.red, emissiveIntensity: 0.05 });
      var curtGeo = new T.CylinderGeometry(0.22, 0.22, 3.8, 6);
      for (var c = 0; c < 18; c++) { var cm = new T.Mesh(curtGeo, curtainMat); cm.position.set(-2.4 + c * 0.283, 1.95, fz + 0.2); inner.add(cm); }
      var bulbs = [];
      var pts = []; for (var b = 0; b <= 24; b++) pts.push([-2.95 + 5.9 * (b / 24), 4.55, fz + 0.2]);
      for (var u = 1; u <= 10; u++) { pts.push([-2.95, 4.55 - u * 0.44, fz + 0.2]); pts.push([2.95, 4.55 - u * 0.44, fz + 0.2]); }
      bulbRow(inner, pts, C.bulb, bulbs);
      // две вывески-лезвия по бокам
      var nm = new T.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: neonTex(C.red, 1), emissiveIntensity: 0.12 });
      var nm2 = new T.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: neonTex(C.cy, 3), emissiveIntensity: 0.12 });
      [[-w / 2 + 0.6, nm], [w / 2 - 0.6, nm2]].forEach(function (q) {
        var bl = new T.Mesh(new T.BoxGeometry(1.1, 6.5, 0.35), [blackGloss, blackGloss, blackGloss, blackGloss, q[1], blackGloss]);
        bl.position.set(q[0], 4.6, fz + 0.4); inner.add(bl);
      });
      // мачта и полуночный шар
      var mast = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 7, 10), brass); mast.position.y = h + 2.9 + 3.5; inner.add(mast);
      var ballMat = new T.MeshStandardMaterial({ color: 0xd8f6ff, metalness: 1, roughness: 0.12, flatShading: true, emissive: C.cy, emissiveIntensity: 0.15 });
      var ball = new T.Mesh(new T.IcosahedronGeometry(1.15, 2), ballMat); ball.position.y = h + 9.6; inner.add(ball);
      var ballGlow = k.glow(C.cy, 6); ballGlow.position.copy(ball.position); ballGlow.material.opacity = 0.35; inner.add(ballGlow);
      // прожекторы
      var beams = [];
      [-1, 1].forEach(function (sd) {
        var beamMat = new T.MeshBasicMaterial({ color: sd < 0 ? C.cy : C.red, transparent: true, opacity: 0.0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false });
        var geo = new T.ConeGeometry(2.2, 34, 24, 1, true); geo.translate(0, -17, 0);
        var beam = new T.Mesh(geo, beamMat); beam.position.set(sd * 3.8, h + 0.4, 0); beam.rotation.x = Math.PI; inner.add(beam);
        beams.push({ m: beam, sd: sd });
      });
      var spill = k.glow(C.warm, 7); spill.position.set(0, 1, fz + 1.6); spill.material.opacity = 0; inner.add(spill);
      var neonGlowL = k.glow(C.red, 5), neonGlowR = k.glow(C.cy, 5);
      neonGlowL.position.set(-w / 2 + 0.6, 4.6, fz + 1); neonGlowR.position.set(w / 2 - 0.6, 4.6, fz + 1); neonGlowL.material.opacity = neonGlowR.material.opacity = 0; inner.add(neonGlowL); inner.add(neonGlowR);
      return { g: g, inner: inner, final: true, win: harlMat, curtain: curtainMat, neons: [nm, nm2], neonGlows: [neonGlowL, neonGlowR], ball: ball, ballMat: ballMat, ballGlow: ballGlow, ballY: ball.position.y, beams: beams, spill: spill, bulbs: bulbs, lit: 0, ready: 0, hover: 0, h: h + 1.6 };
    }

    // ---------- пальмы ----------
    var trunkMat = new T.MeshStandardMaterial({ color: 0x6a4a2e, roughness: 0.9, flatShading: true });
    var leafMat = new T.MeshStandardMaterial({ color: 0x0f9a52, roughness: 0.7, flatShading: true, side: T.DoubleSide });
    function palm(x, z, s, ringCol) {
      var g = new T.Group(), y = 0, lean = (Math.random() - 0.5) * 0.25;
      for (var i = 0; i < 6; i++) { var seg = new T.Mesh(new T.CylinderGeometry(0.16 - i * 0.012, 0.2 - i * 0.012, 0.95, 7), trunkMat); seg.position.set(lean * i * i * 0.08, y + 0.47, 0); seg.rotation.z = -lean * i * 0.15; g.add(seg); y += 0.9; }
      var top = new T.Vector3(lean * 25 * 0.08, y, 0);
      for (var l = 0; l < 8; l++) {
        var leaf = new T.Mesh(new T.ConeGeometry(0.32, 2.6, 4, 1), leafMat); leaf.geometry.translate(0, 1.3, 0); leaf.scale.z = 0.25;
        leaf.position.copy(top); leaf.rotation.y = l / 8 * Math.PI * 2; leaf.rotateX(1.9 + (l % 2) * 0.25); g.add(leaf);
      }
      var ring = new T.Mesh(new T.TorusGeometry(0.24, 0.05, 6, 16), new T.MeshStandardMaterial({ color: 0x111111, emissive: ringCol, emissiveIntensity: 1.6 }));
      ring.rotation.x = Math.PI / 2; ring.position.set(lean * 0.3, 1.2, 0); g.add(ring);
      g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    }
    [4, -3, -9, -15, -21, -26].forEach(function (z, i) { palm(-4.6, z - 0.5, 1.15, i % 2 ? C.cy : C.red); palm(4.6, z + 0.5, 1.15, i % 2 ? C.red : C.cy); });

    // ---------- город на горизонте ----------
    var skyWin = k.tex(64, 256, function (g, w, h) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (var y = 4; y < h; y += 8) for (var x = 4; x < w; x += 8) if (Math.random() < 0.38) { g.fillStyle = Math.random() < 0.6 ? '#7fd8ff' : '#ffd890'; g.fillRect(x, y, 4, 4); }
    });
    for (var tw = 0; tw < 22; tw++) {
      var x = -75 + tw * 7 + Math.random() * 3, th = 8 + Math.random() * 20, tz = -78 - Math.random() * 20;
      if (Math.abs(x) < 10) th *= 0.5; // над театром — ниже, чтобы шар и прожекторы читались
      var tm = new T.MeshStandardMaterial({ color: 0x0a1630, roughness: 0.4, metalness: 0.4, emissive: 0xffffff, emissiveMap: skyWin, emissiveIntensity: 0.32 });
      var tw2 = 4.5 + Math.random() * 3;
      var tower = new T.Mesh(new T.BoxGeometry(tw2, th, 4), tm); tower.position.set(x, th / 2, tz); scene.add(tower);
      var crownCol = [C.red, C.cy, C.bulb, C.mag][tw % 4];
      var cr = new T.Mesh(new T.BoxGeometry(tw2 + 0.2, 0.35, 4.2), new T.MeshStandardMaterial({ color: 0x111111, emissive: crownCol, emissiveIntensity: 1.8 })); cr.position.set(x, th + 0.1, tz); scene.add(cr);
      if (tw % 3 === 0) { var sp2 = new T.Mesh(new T.ConeGeometry(0.5, 4, 8), new T.MeshStandardMaterial({ color: 0x111111, emissive: crownCol, emissiveIntensity: 1.2 })); sp2.position.set(x, th + 2, tz); scene.add(sp2); }
    }

    // ---------- конфетти (вместо снега: Вегас, канун НГ) ----------
    [[C.red, 0], [C.cy, 1], [C.bulb, 2]].forEach(function (q) { k.snow({ n: 160, area: [30, 18, 44], center: [0, 0, -10], speed: 0.55, size: 0.2, color: q[0], opacity: 0.9 }); });

    // ---------- площадка с ракетой ----------
    var pad = new T.Group(); pad.position.set(0, 0, 4.2); scene.add(pad);
    var padBase = new T.Mesh(new T.CylinderGeometry(1.5, 1.7, 0.3, 32), brass); padBase.position.y = 0.15; pad.add(padBase);
    var padRing = new T.Mesh(new T.TorusGeometry(1.5, 0.06, 8, 48), new T.MeshStandardMaterial({ color: 0x111111, emissive: C.bulb, emissiveIntensity: 1.6 }));
    padRing.rotation.x = Math.PI / 2; padRing.position.y = 0.31; pad.add(padRing);
    var padBulbs = [], pp = [];
    for (var pb = 0; pb < 16; pb++) { var aa = pb / 16 * Math.PI * 2; pp.push([Math.cos(aa) * 1.62, 0.32, Math.sin(aa) * 1.62]); }
    bulbRow(pad, pp, C.bulb, padBulbs, 0.5);
    var rocket = new T.Group(); rocket.position.y = 0.3; pad.add(rocket);
    var rkMat = new T.MeshStandardMaterial({ color: C.red, metalness: 0.55, roughness: 0.28, emissive: C.red, emissiveIntensity: 0.12 });
    var finMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
    var rBody = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 2.3, 24), rkMat); rBody.position.y = 1.45; rocket.add(rBody);
    var rNose = new T.Mesh(new T.ConeGeometry(0.42, 1.0, 24), rkMat); rNose.position.y = 3.1; rocket.add(rNose);
    var rTip = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), brass); rTip.position.y = 3.62; rocket.add(rTip);
    var rBand = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 0.18, 24), brass); rBand.position.y = 2.35; rocket.add(rBand);
    var rWin = new T.Mesh(new T.CircleGeometry(0.17, 20), new T.MeshStandardMaterial({ color: 0x0a2030, emissive: C.cy, emissiveIntensity: 1.2 })); rWin.position.set(0, 1.85, 0.44); rocket.add(rWin);
    for (var f = 0; f < 3; f++) {
      var fin = new T.Mesh(new T.BoxGeometry(0.06, 0.8, 0.55), finMat); var fa = f / 3 * Math.PI * 2;
      fin.position.set(Math.sin(fa) * 0.55, 0.6, Math.cos(fa) * 0.55); fin.rotation.y = fa; rocket.add(fin);
    }
    var rGlow = k.glow(C.red, 3.2); rGlow.position.y = 1.8; rocket.add(rGlow);
    var flame = k.glow(0xffd27a, 1.6); flame.position.y = 0.1; flame.material.opacity = 0; rocket.add(flame);
    var trail = [];
    for (var tr = 0; tr < 10; tr++) { var tg = k.glow(tr % 2 ? C.bulb : 0xfff3b0, 1.2); tg.material.opacity = 0; scene.add(tg); trail.push(tg); }
    var bursts = [];
    S.rocketLab = k.label(rocket, [0, 4.4, 0], '');

    // ---------- персонажи (настоящие PNG бренда) ----------
    var mag = k.billboard('../../vegasway/assets/magician.png', 4.6); mag.position.set(-3.2, 0, 5.6); scene.add(mag);
    var harl = k.billboard('../../vegasway/assets/harlequin.png', 4.3); harl.position.set(3.3, 0, 5.4); scene.add(harl);
    var magGlow = k.glow(C.cy, 5); magGlow.position.set(-3.2, 2.2, 5.0); magGlow.material.opacity = 0.18; scene.add(magGlow);
    var harlGlow = k.glow(C.red, 5); harlGlow.position.set(3.3, 2.1, 4.8); harlGlow.material.opacity = 0.2; scene.add(harlGlow);

    S.place = function (a) {
      var o = S.venues[a.act];
      if (!o) {
        o = a.act === 6 ? theatre() : venue(a.act);
        var sp = SPOTS[a.act];
        o.g.position.set(sp[0], 0, sp[1]); o.g.rotation.y = sp[2];
        scene.add(o.g);
        var open = function () { if (S.onOpen && o.canOpen) S.onOpen(a.act); };
        o.lab = k.label(o.g, [o.final ? 0 : -0.4, o.h + 0.9, o.final ? 3.4 : 0.6], '', open);
        k.pick(o.g, open, function (on) { o.hover = on && o.canOpen ? 1 : 0; });
        S.venues[a.act] = o;
      }
      return o;
    };

    S.setRocket = function (tier, total) {
      var T0 = tier ? TIER[tier.id] : null;
      var col = T0 ? T0.c : 0x5a6a72;
      rkMat.color.setHex(col); rkMat.emissive.setHex(col); rkMat.emissiveIntensity = T0 ? 0.18 : 0.02;
      rkMat.transparent = !T0; rkMat.opacity = T0 ? 1 : 0.45;
      rGlow.material.color.setHex(col); rGlow.material.opacity = T0 ? 0.55 : 0;
      S.rocketScale = T0 ? T0.s : 0.6;
      S.rocketLab.set((tier ? tier.name : 'Your rocket') + '<small>' + total + ' of 54 points</small>');
    };

    S.launch = function () { S.launchT = 0; };

    // ---------- анимация ----------
    var tmpV = new T.Vector3();
    k.onFrame(function (t, dt) {
      if (!(dt > 0)) dt = 0; // первый кадр ядра может дать dt < 0 — без этого лерпы улетают
      Object.keys(S.venues).forEach(function (id) {
        var o = S.venues[id];
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        var r = o.ready ? 0.5 + 0.5 * Math.sin(t * 3.2 + Number(id)) : 0;
        var hv = o.hover * 0.04; o.inner.scale.x += (1 + hv - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        var flash = S.launchT >= 0 && S.launchT < 4 ? 0.5 + 0.5 * Math.sin(t * 18) : 0;
        var n = o.bulbs.length;
        o.bulbs.forEach(function (b) {
          var on;
          if (o.lit > 0.5) on = 0.45 + 0.55 * (((b.i - t * 9) % 4 + 4) % 4 < 2 ? 1 : 0); // бегущие огни марки
          else if (o.ready) on = (b.i % 2 ? r : 1 - r) * 0.7;
          else on = 0.04;
          on = Math.max(on, flash);
          b.m.emissiveIntensity = on * 2.4; b.gl.material.opacity = on * 0.85;
        });
        var neon = Math.max(o.lit * (0.92 + 0.08 * Math.sin(t * 40 + Number(id))), o.ready ? 0.25 + r * 0.35 : 0.06);
        if (o.final) {
          o.neons.forEach(function (m) { m.emissiveIntensity = neon * 1.6; });
          o.neonGlows.forEach(function (gw) { gw.material.opacity = neon * 0.6; });
          o.win.emissiveIntensity = 0.05 + o.lit * 0.18;
          o.curtain.emissiveIntensity = 0.05 + o.lit * 0.35 + r * 0.15;
          o.spill.material.opacity = o.lit * 0.5 + r * 0.2;
          o.beams.forEach(function (B) { B.m.rotation.z = B.sd * (0.32 + Math.sin(t * 0.6 + B.sd) * 0.22); B.m.rotation.x = Math.PI + Math.sin(t * 0.45 + B.sd * 2) * 0.18; B.m.material.opacity = 0.05 + o.lit * 0.1 + (S.allDone ? 0.05 : 0); });
          o.ballMat.emissiveIntensity = 0.15 + o.lit * 0.6 + 0.2 * Math.sin(t * 2);
          o.ball.rotation.y = t * 0.4;
        } else {
          o.neon.emissiveIntensity = neon * 1.7; o.board.emissiveIntensity = neon * 1.5;
          o.bladeGlow.material.opacity = neon * 0.45;
          o.spot.material.opacity = o.lit * 0.35;
          o.win.emissiveIntensity = 0.12 + o.lit * 0.9 + r * 0.2;
          o.door.emissiveIntensity = o.lit * 1.4 + r * 0.6;
          o.spill.material.opacity = o.lit * 0.55 + r * 0.2;
          o.sglow.forEach(function (sg2) { sg2.m.emissiveIntensity = sg2.base + o.lit * 1.2; sg2.gl.material.opacity = 0.15 + o.lit * 0.6; });
        }
      });
      // площадка и ракета
      padBulbs.forEach(function (b) { var on = 0.4 + 0.6 * (((b.i + t * 6) % 16) < 5 ? 1 : 0.2); b.m.emissiveIntensity = on * 2.2; b.gl.material.opacity = on * 0.8; });
      var sTarget = S.rocketScale || 0.6;
      rocket.scale.x += (sTarget - rocket.scale.x) * Math.min(1, dt * 3); rocket.scale.y = rocket.scale.z = rocket.scale.x;
      if (S.launchT >= 0) {
        S.launchT += dt;
        var L = S.launchT;
        if (L < 0.8) { rocket.position.y = 0.3 + Math.sin(L * 60) * 0.03; flame.material.opacity = L / 0.8; }
        else if (L < 4.2) { var u = L - 0.8; rocket.position.y = 0.3 + u * u * 4.2; flame.material.opacity = 1; flame.scale.set(1.6, 2.6 + Math.sin(t * 40) * 0.4, 1); }
        if (L >= 0.8 && L < 4.2) {
          rocket.getWorldPosition(tmpV);
          var tg2 = trail[Math.floor(L * 20) % trail.length]; tg2.position.copy(tmpV); tg2.material.opacity = 0.9;
        }
        if (L >= 4.2 && !S.burst) { S.burst = true; rocket.visible = false; rocket.getWorldPosition(tmpV); burst(tmpV); }
        if (L > 9) { S.launchT = -1; S.burst = false; rocket.visible = true; rocket.position.y = 0.3; flame.material.opacity = 0; }
        // шар над театром опускается к полуночи
        var th = S.venues[6]; if (th) th.ball.position.y = th.ballY - Math.min(1, L / 3.5) * 3.2;
      } else {
        var th2 = S.venues[6]; if (th2) th2.ball.position.y += (th2.ballY - th2.ball.position.y) * Math.min(1, dt);
        rocket.position.y = 0.3 + Math.sin(t * 1.3) * 0.05;
      }
      trail.forEach(function (g2) { g2.material.opacity = Math.max(0, g2.material.opacity - dt * 1.4); });
      for (var bi = bursts.length - 1; bi >= 0; bi--) {
        var P = bursts[bi]; P.life -= dt;
        P.s.position.addScaledVector(P.v, dt); P.v.y -= dt * 3.2; P.v.multiplyScalar(1 - dt * 0.6);
        P.s.material.opacity = Math.max(0, P.life / 2.4);
        if (P.life <= 0) { scene.remove(P.s); bursts.splice(bi, 1); }
      }
    });
    function burst(at) {
      var cols = [C.red, C.cy, C.bulb, 0xffffff, C.mag];
      for (var i2 = 0; i2 < 70; i2++) {
        var s = k.glow(cols[i2 % cols.length], 0.9 + Math.random() * 0.6); s.position.copy(at);
        var v = new T.Vector3(Math.random() - 0.5, Math.random() - 0.4, Math.random() - 0.5).normalize().multiplyScalar(7 + Math.random() * 5);
        scene.add(s); bursts.push({ s: s, v: v, life: 2.4 });
      }
    }

    S.k = k;
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F;
      k.camera.fov = F.fov;
      if (F.t > 0) k.camera.zoom = F.zoom;
      mag.scale.setScalar(1 + 0.35 * F.t); harl.scale.setScalar(1 + 0.35 * F.t); // на телефоне ведущие крупнее
      k.camera.updateProjectionMatrix();
      if (changed) S.pendingLook = F;
    });
    // камеру переводим из кадра, а не из onResize: в первом кадре ядра dt бывает < 0 (метка rAF раньше create),
    // и look() с коротким временем улетает в бесконечность. Ждём 0.25 с сцены — dt уже нормальный.
    k.onFrame(function (t) {
      if (S.pendingLook && t > 0.25) { var F = S.pendingLook; S.pendingLook = null; k.look(F.pos, F.look, S.looked ? 0.5 : 0.05); S.looked = true; }
    });
    return S;
  }

  // ======================================================================================================
  function left(ms) {
    var s = Math.max(0, Math.round((ms - Date.now()) / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function status(a) {
    if (a.status === 'done') return '★ ' + a.points + ' of 9';
    if (a.status === 'expired') return 'closed · ' + a.points + ' of 9';
    if (a.status === 'active') return a.can && a.can.ok ? 'continue · ' + a.points : 'closed · ' + a.points;
    if (!a.can || a.can.ok) return 'play';
    if (a.can.error === 'not_open') return 'opens in <span data-at="' + a.can.opensAt + '">' + left(a.can.opensAt) + '</span>';
    if (a.can.error === 'claimed') return 'reward taken';
    return 'closed';
  }

  function render(box, me, opts) {
    opts = opts || {};
    var S = box._v3d;
    if (!S) {
      if (!supported()) return null;
      css();
      box.classList.add('v3d');
      Array.prototype.slice.call(box.children).forEach(function (c) { if (!c.classList.contains('v3d-title')) box.removeChild(c); });
      S = build(box);
      if (!S) { box.classList.remove('v3d'); return null; }
      box._v3d = S;
    }
    var acts = me.acts, tier = me.tier, total = me.total;
    if (S.k.debug('lit')) {
      acts = acts.map(function (a) { return Object.assign({}, a, { status: 'done', points: 9, can: { ok: false, error: 'done' } }); });
      tier = { id: 'gold', name: 'Gold Rocket' }; total = 54;
    }
    S.onOpen = opts.onOpen;
    var done = 0;
    acts.forEach(function (a) {
      var o = S.place(a);
      var open = a.status !== 'new' || !a.can || a.can.ok;
      o.canOpen = open && !(a.status === 'expired') && !(a.status === 'active' && a.can && !a.can.ok) && !(a.can && a.can.error === 'claimed' && a.status === 'new');
      if (a.status === 'done') { o.canOpen = true; done++; }
      o.target = a.status === 'done' ? 1 : 0;
      o.ready = a.status !== 'done' && o.canOpen ? 1 : 0;
      var name = a.act === 6 ? 'Final act' : 'Act ' + roman(a.act);
      o.lab.set(name + '<small>' + status(a) + '</small>');
      o.lab.el.setAttribute('aria-label', 'Act ' + roman(a.act) + ', ' + a.title + ': ' + status(a).replace(/<[^>]+>/g, ''));
      o.lab.cls('done', a.status === 'done'); o.lab.cls('ready', !!o.ready); o.lab.cls('locked', !o.canOpen); o.lab.cls('final', a.act === 6);
    });
    S.allDone = done >= acts.length;
    S.setRocket(tier, total);
    return S;
  }

  function launch(box) { var S = box && box._v3d; if (S) S.launch(); }

  window.Strip3D = { render: render, launch: launch, supported: supported };
})();
