/**
 * 3D-сцена Merry Coinsmas (CoinsMania) на ядре _3d/ny3d.js. Тот же интерфейс, что у 2D piggy.js:
 *   CoinPiggy3D.render(el, jars, { current, onOpen(id, jar), progress: { jars, golden } }) — первый вызов строит сцену
 *   CoinPiggy3D.flick(el, id)                                                            — монеты летят из банки в копилку
 *   CoinPiggy3D.supported()                                                              — есть ли WebGL (иначе 2D CoinPiggy)
 * Сюжет (как на ключевом арте): ночное синее небо, облачный остров с еловой гирляндой. В центре — розовая копилка в
 * колпаке; по мере разобранных банок 1–6 она снизу вверх покрывается золотом. Банки с монетами стоят дугой вокруг,
 * разобранная банка — ровные одноцветные стопки и золотое свечение. Сзади на высоком облаке — Золотая банка,
 * за облаками — Piggins (настоящий PNG бренда). На монетах нет ни цифр, ни букв.
 */
(function () {
  'use strict';
  var BR = { y: 0xfdd717, b: 0x1818f5, pk: 0xff4fa3, gr: 0x27c93f };
  // цвета монет — те же, что в игре (sort-game.css .cs-c0…c8)
  var COINS = [0xfdd717, 0xff4fa3, 0x27c93f, 0x3d6bff, 0xff4136, 0x9b5cff, 0xc9d1e3, 0xff8a1f, 0x22d3ee];
  var PIGGINS = '../../coinsmania/assets/piggins-cut.png';

  // места банок: [x, z] — дуга перед копилкой; практика слева спереди, золотая — сзади справа на высоком облаке
  var SPOTS = { practice: [-3.9, -3.0], j1: [-6.7, 2.6], j2: [-4.05, 4.3], j3: [-1.36, 5.2], j4: [1.36, 5.2], j5: [4.05, 4.3], j6: [6.7, 2.6], golden: [5.6, -5.2] };
  var PIG_AT = [0, 0, -0.6];
  var CAM = { pos: [0, 8.6, 20.5], look: [0, 2.3, -0.5] };
  var CAM_TALL = { pos: [0, 20, 13.5], look: [0, 1.4, -0.8] }; // телефон: сверху и ближе — банки ±6.7 по ширине, края острова за кадром

  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 40 + 18 * t, zoom: Math.max(0.8, Math.min(1, a / 0.7)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function css() {
    if (document.getElementById('c3d-css')) return;
    var s = document.createElement('style'); s.id = 'c3d-css';
    s.textContent =
      '.c3d{height:clamp(520px,86vh,980px);padding:0!important;overflow:hidden;background:#1418a8}' +
      '.c3d .ny3d-label{font:800 13px/1.05 "Kanit",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#fff;' +
      'background:rgba(20,18,122,.86);border:2px solid rgba(170,190,255,.55);border-radius:999px;padding:5px 13px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 3px 0 rgba(8,6,60,.6)}' +
      '.c3d .ny3d-label small{font:400 11px/1 "Kanit",system-ui,sans-serif;text-transform:none;letter-spacing:0;color:#C8CCF5}' +
      '.c3d .ny3d-label.sorted{border-color:#FDD717;box-shadow:0 3px 0 #B88A00,0 0 16px rgba(253,215,23,.45)} .c3d .ny3d-label.sorted small{color:#FDD717}' +
      '.c3d .ny3d-label.ready{border-color:#fff}' +
      '.c3d .ny3d-label.active small{color:#FF9CCB}' +
      '.c3d .ny3d-label.locked{opacity:.66}' +
      '.c3d .ny3d-label.gold{background:linear-gradient(180deg,#5a3f00,#2a1d72);border-color:#FDD717}' +
      '.c3d .ny3d-label.cur{background:#FDD717;color:#14127A;border-color:#fff;box-shadow:0 3px 0 #B88A00} .c3d .ny3d-label.cur small{color:#14127A}' +
      '.c3d .ny3d-label:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
      '.c3d .ny3d-label.meter{cursor:default;background:rgba(10,9,56,.82);border-color:#FDD717;padding:6px 16px 7px;font-size:15px}' +
      '.c3d .ny3d-label.meter b{color:#FDD717;font-size:22px;line-height:1}' +
      '.c3d .ny3d-label.meter small{color:#FDD717}' +
      '.c3d-title{position:absolute;left:0;top:0;padding:16px 20px;pointer-events:none;z-index:2}' +
      '.c3d-title h1{text-shadow:0 3px 22px rgba(10,9,56,.85)}' +
      '@media (max-width:600px){.c3d .ny3d-label{font-size:11px;padding:4px 9px 5px}.c3d .ny3d-label small{font-size:10px}.c3d .ny3d-label.meter{font-size:12px}.c3d .ny3d-label.meter b{font-size:18px}.c3d-title h1{font-size:2rem}}';
    document.head.appendChild(s);
  }

  function fmtT(ms) { try { return new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric' }); } catch (e) { return ''; } }
  function locked(j) { return j.status === 'new' && j.can && !j.can.ok; }
  function sub(j) {
    if (j.status === 'sorted') return 'sorted';
    if (j.status === 'expired') return 'closed';
    if (j.status === 'active') return 'in progress';
    if (locked(j)) {
      if (j.can.error === 'need_jars') return 'sort ' + j.can.need + ' more';
      if (j.can.error === 'not_open') return j.can.opensAt ? 'opens ' + fmtT(j.can.opensAt) : 'soon';
      if (j.can.error === 'closed') return 'closed';
      return 'locked';
    }
    return j.practice ? 'warm-up' : j.colors + ' colors';
  }

  // детерминированный «случайный» генератор, чтобы банки выглядели одинаково между перерисовками
  function rng(seed) { var x = seed * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      bg: 0x1418a8, fog: [0x4a4fd8, 34, 90], exposure: 0.9,
      // окружение тёмное и цветное: светлое окружение даёт сильный рассеянный свет и выбеливает цвета
      env: [0x23289a, 0x7a6438, 0x7a2a6c, 0x0a0a40], cam: { pos: CAM.pos, look: CAM.look, fov: 40 }, designAspect: 2, minZoom: 0.42, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, jars: {}, t: 0, fill: 0, fillTo: 0, golden: 0, flyers: [] };
    k.renderer.localClippingEnabled = true;

    // ---------- небо ----------
    scene.background = k.tex(4, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#2a0b78'); gr.addColorStop(0.32, '#2214b8'); gr.addColorStop(0.62, '#1b38e6'); gr.addColorStop(0.85, '#4a6af2'); gr.addColorStop(1, '#8d8ef5');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // звёзды-точки
    var starN = 420, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = -Math.PI * 0.95 + Math.random() * Math.PI * 0.9, el = 0.12 + Math.random() * 0.85, R = 110; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.55 + 4; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xfff6d0, size: 0.5, transparent: true, opacity: 0.85, fog: false, depthWrite: false })));
    // крупные мерцающие звёздочки (как на арте)
    var starTex = k.tex(64, 64, function (g, w) {
      var c = w / 2; g.translate(c, c);
      var gr = g.createRadialGradient(0, 0, 0, 0, 0, c); gr.addColorStop(0, 'rgba(255,240,160,.9)'); gr.addColorStop(0.3, 'rgba(255,215,40,.35)'); gr.addColorStop(1, 'rgba(255,215,40,0)');
      g.fillStyle = gr; g.fillRect(-c, -c, w, w);
      g.fillStyle = '#fff4b0'; g.beginPath();
      for (var s = 0; s < 10; s++) { var an = -Math.PI / 2 + s * Math.PI / 5, r = s % 2 ? 6 : 15; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
      g.closePath(); g.fill();
    });
    var twinkles = [];
    for (var tw = 0; tw < 16; tw++) {
      var ts = new T.Sprite(new T.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
      var tsz = 1.2 + Math.random() * 1.6; ts.scale.set(tsz, tsz, 1);
      ts.position.set(-40 + Math.random() * 80, 12 + Math.random() * 20, -30 - Math.random() * 30); scene.add(ts);
      twinkles.push({ s: ts, ph: Math.random() * 6.3, sp: 1 + Math.random() * 2 });
    }

    // ---------- свет ----------
    scene.add(new T.HemisphereLight(0x9f8cff, 0x24247a, 0.5));
    var key = new T.DirectionalLight(0xfff0d6, 0.95); key.position.set(-8, 16, 14); scene.add(key);
    var rim = new T.DirectionalLight(0xff5fc8, 0.5); rim.position.set(10, 8, -14); scene.add(rim);
    var fill = new T.DirectionalLight(0x5f7cff, 0.3); fill.position.set(12, 5, 10); scene.add(fill);
    var pigLight = new T.PointLight(0xffd34a, 0, 14, 2); pigLight.position.set(PIG_AT[0], 3.6, PIG_AT[2] + 3); scene.add(pigLight);

    // ---------- облака ----------
    var cloudMats = [0xd2c8ff, 0xb8b0ff, 0xf0b8ff, 0xa8b8ff].map(function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0 }); });
    var puffGeo = new T.SphereGeometry(1, 18, 12);
    function puff(x, y, z, sx, sy, sz, mi) {
      var m = new T.Mesh(puffGeo, cloudMats[mi % cloudMats.length]); m.position.set(x, y, z); m.scale.set(sx, sy, sz); scene.add(m); return m;
    }
    // остров: плоская «подушка» и пухлые края
    var r1 = rng(7);
    puff(0, -1.6, 0.4, 13, 1.6, 8.6, 0); // верх «подушки» — y = 0
    for (var c = 0; c < 46; c++) {
      var ang = (c / 46) * Math.PI * 2, front = Math.sin(ang) > 0.3, rx = 12.4 + r1() * 1.2, rz = 8.0 + r1() * 0.8, s = (front ? 1.0 : 1.4) + r1() * 1.2;
      puff(Math.cos(ang) * rx, -0.9 - (front ? 0.3 : 0) + r1() * 0.3, 0.4 + Math.sin(ang) * rz, s * 1.3, s * (front ? 0.5 : 0.7), s, c);
    }
    // невысокие «кочки» между банками
    [[-3.2, 2.6], [3.2, 2.6], [0, 8.2], [-9.6, -1.6], [9.4, -1.2], [-2.8, -4.6], [2.4, -6.2], [9.6, 4.6]].forEach(function (d, i6) {
      puff(d[0], -0.25, d[1], 1.3 + (i6 % 3) * 0.4, 0.45, 1.1 + (i6 % 2) * 0.4, i6 + 1);
    });
    // облачное море ниже острова — заполняет низ кадра (особенно на телефоне)
    var r4 = rng(11);
    for (var cs2 = 0; cs2 < 26; cs2++) {
      var sx2 = -26 + (cs2 % 9) * 6.5 + r4() * 2, sz2 = 10 + Math.floor(cs2 / 9) * 5 + r4() * 2;
      puff(sx2, -3.4 - r4() * 0.8, sz2, 4 + r4() * 2.5, 1.4 + r4() * 0.6, 3 + r4() * 1.5, cs2);
    }
    // высокое облако под Золотой банкой
    var gx = SPOTS.golden[0], gz = SPOTS.golden[1], GOLD_Y = 1.7;
    puff(gx, GOLD_Y - 0.9, gz, 2.6, 1.1, 2.2, 2); puff(gx - 1.8, GOLD_Y - 1.4, gz + 0.4, 1.6, 1.0, 1.5, 0); puff(gx + 1.9, GOLD_Y - 1.5, gz - 0.2, 1.5, 0.9, 1.4, 1);
    puff(gx, 0.2, gz + 0.6, 2.2, 1.2, 1.8, 3);
    // облачное море внизу и дальние облака — мягкие спрайты
    var softTex = k.tex(256, 128, function (g, w, h) {
      for (var i2 = 0; i2 < 30; i2++) {
        // круги целиком внутри текстуры — иначе у спрайта виден прямой край
        var r = 14 + Math.random() * 22, x = r + 4 + Math.random() * (w - 2 * r - 8), y = h * 0.5 + (Math.random() - 0.5) * (h - 2 * r - 8) * 0.6;
        var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    var farClouds = [];
    [[0xb9b2ff, -34, -2, -46, 40], [0xf0b8ff, 26, 0, -50, 36], [0x9fb4ff, -6, -4, -58, 52], [0xd6c6ff, -44, 6, -60, 30], [0xffc6ec, 44, 7, -64, 30],
     [0xc4c8ff, -24, -7, -14, 34], [0xd8c8ff, 26, -7, -12, 34], [0xaab8ff, 0, -9, -30, 60]].forEach(function (d) {
      var cs = new T.Sprite(new T.SpriteMaterial({ map: softTex, color: d[0], transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      cs.scale.set(d[4], d[4] * 0.42, 1); cs.position.set(d[1], d[2], d[3]); scene.add(cs);
      farClouds.push({ s: cs, x0: d[1], sp: 0.2 + Math.random() * 0.3 });
    });

    // ---------- монеты (общие) ----------
    var coinGeo = new T.CylinderGeometry(0.2, 0.2, 0.09, 24);
    var faceCache = {};
    function coinMats(col) {
      if (faceCache[col]) return faceCache[col];
      var hex = '#' + ('000000' + col.toString(16)).slice(-6);
      var face = k.tex(64, 64, function (g, w) {
        var c0 = w / 2, gr = g.createRadialGradient(c0 * 0.7, c0 * 0.6, 2, c0, c0, c0);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, hex); gr.addColorStop(1, hex);
        g.fillStyle = gr; g.fillRect(0, 0, w, w);
        g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 4; g.beginPath(); g.arc(c0, c0, c0 - 9, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(c0, c0, c0 - 14, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
      });
      var side = new T.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: col === 0xfdd717 ? 0.6 : 0.15 });
      var top = new T.MeshStandardMaterial({ map: face, roughness: 0.3, metalness: col === 0xfdd717 ? 0.5 : 0.1 });
      return (faceCache[col] = [side, top, top]);
    }
    // парящие монеты в небе
    var skyCoins = [];
    var bigCoinGeo = new T.CylinderGeometry(1, 1, 0.22, 36);
    [[0xfdd717, -15, 10, -14, 1.4], [0xff4fa3, 14, 12, -18, 1.2], [0x27c93f, 19, 6, -10, 1.0], [0xfdd717, -21, 15, -26, 1.6], [0x3d6bff, -9, 16, -28, 0.9],
     [0xfdd717, 9, 17, -30, 1.1], [0x9b5cff, 25, 15, -32, 1.2], [0xff8a1f, -26, 7, -20, 0.9]].forEach(function (d, i3) {
      var m = new T.Mesh(bigCoinGeo, coinMats(d[0])); m.scale.setScalar(d[4]); m.position.set(d[1], d[2], d[3]);
      m.rotation.set(Math.PI / 2 - 0.3, 0, i3); scene.add(m);
      var gl = k.glow(d[0], d[4] * 4.2); gl.material.opacity = 0.35; gl.position.copy(m.position); scene.add(gl);
      skyCoins.push({ m: m, y0: d[2], ph: i3 * 1.7 });
    });

    // ---------- гирлянда из еловых лап по краю острова ----------
    var garPts = [];
    for (var gp = 0; gp <= 24; gp++) { var u = gp / 24, ga = Math.PI * (1.05 - u * 1.1); garPts.push(new T.Vector3(Math.cos(ga) * 12.4, 0.55 + Math.sin(u * Math.PI * 6) * 0.25, 0.4 + Math.sin(ga) * 8.3)); }
    var garCurve = new T.CatmullRomCurve3(garPts);
    // еловая гирлянда: тёмный «канат» + сотни тонких иголок, торчащих во все стороны
    var needleMat = new T.MeshStandardMaterial({ color: 0x0b5a2a, roughness: 0.85, metalness: 0, envMapIntensity: 0.3 });
    var rope = new T.Mesh(new T.TubeGeometry(garCurve, 120, 0.28, 8, false), new T.MeshStandardMaterial({ color: 0x0a4a22, roughness: 0.9, envMapIntensity: 0.3 }));
    scene.add(rope);
    var needleGeo = new T.ConeGeometry(0.06, 0.42, 4); needleGeo.translate(0, 0.3, 0);
    var garBulbs = [], bulbGeo = new T.SphereGeometry(0.11, 10, 8);
    var nUp = new T.Vector3(0, 1, 0), nDir = new T.Vector3();
    var NN = k.mobile ? 900 : 1600;
    var needles = new T.InstancedMesh(needleGeo, needleMat, NN), nm = new T.Matrix4(), nq = new T.Quaternion();
    for (var gn = 0; gn < NN; gn++) {
      var pp = garCurve.getPoint(gn / NN);
      nDir.set(Math.random() - 0.5, Math.random() * 0.9 - 0.2, Math.random() - 0.5).normalize();
      nq.setFromUnitVectors(nUp, nDir);
      nm.compose(pp, nq, new T.Vector3(1, 0.8 + Math.random() * 0.5, 1)); needles.setMatrixAt(gn, nm);
    }
    scene.add(needles);
    var BULB_COLS = [0xffd36b, 0xffd36b, 0xff4fa3, 0xffd36b, 0x22d3ee, 0xffd36b];
    for (var gb = 0; gb < 46; gb++) {
      var bp = garCurve.getPoint((gb + 0.5) / 46), col = BULB_COLS[gb % BULB_COLS.length];
      var bm = new T.MeshStandardMaterial({ color: 0x302010, emissive: col, emissiveIntensity: 2 });
      var b = new T.Mesh(bulbGeo, bm); b.position.copy(bp).add(new T.Vector3(0, 0.28, 0.25)); scene.add(b);
      var gl2 = k.glow(col, 0.95); gl2.position.copy(b.position); scene.add(gl2);
      garBulbs.push({ m: bm, gl: gl2, ph: gb * 0.9 });
    }
    // шары на гирлянде
    [0.16, 0.33, 0.5, 0.67, 0.84].forEach(function (u2, i4) {
      var bp2 = garCurve.getPoint(u2), bc = [0xff4136, 0xfdd717, 0x3d6bff, 0xfdd717, 0xff4136][i4];
      var ball = new T.Mesh(new T.SphereGeometry(0.34, 20, 14), new T.MeshStandardMaterial({ color: bc, roughness: 0.15, metalness: 0.6 }));
      ball.position.copy(bp2).add(new T.Vector3(0, -0.1, 0.55)); scene.add(ball);
    });

    k.snow({ n: 500, area: [44, 22, 34], center: [0, 0, -2], speed: 0.6, size: 0.14, opacity: 0.7 });

    // ---------- копилка ----------
    var pig = new T.Group(); pig.position.fromArray(PIG_AT); pig.rotation.y = -0.55; scene.add(pig);
    var pink = new T.MeshStandardMaterial({ color: 0xff6aa8, roughness: 0.38, metalness: 0, envMapIntensity: 0.6 });
    var pinkDeep = new T.MeshStandardMaterial({ color: 0xe8407f, roughness: 0.45 });
    var dark = new T.MeshStandardMaterial({ color: 0x3a0a1e, roughness: 0.3 });
    var white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    var red = new T.MeshStandardMaterial({ color: 0xd8121f, roughness: 0.7, envMapIntensity: 0.4 });
    // золото — копия формы, обрезанная плоскостью «уровня»: свин снизу вверх покрывается золотом
    var fillPlane = new T.Plane(new T.Vector3(0, -1, 0), 0);
    var goldMat = new T.MeshStandardMaterial({ color: 0xffd84a, metalness: 0.85, roughness: 0.22, emissive: 0x8a5a00, emissiveIntensity: 0.8, clippingPlanes: [fillPlane] });
    var goldParts = [];
    function part(geo, mat, x, y, z, sx, sy, sz, rx, ry, rz, gilded) {
      var m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx || 0, ry || 0, rz || 0); pig.add(m);
      if (gilded) { var gm = new T.Mesh(geo, goldMat); gm.position.copy(m.position); gm.scale.copy(m.scale).multiplyScalar(1.012); gm.rotation.copy(m.rotation); pig.add(gm); goldParts.push(gm); }
      return m;
    }
    var sph = new T.SphereGeometry(1, 48, 32);
    part(sph, pink, 0, 2.05, 0, 2.15, 1.62, 1.68, 0, 0, 0, true); // тело
    part(new T.CylinderGeometry(0.62, 0.7, 0.62, 36), pink, 2.15, 2.1, 0, 1, 1, 1, 0, 0, Math.PI / 2, true); // пятачок
    part(new T.CylinderGeometry(0.6, 0.6, 0.04, 36), pinkDeep, 2.47, 2.1, 0, 1, 1, 1, 0, 0, Math.PI / 2, false);
    part(sph, dark, 2.5, 2.16, 0.2, 0.04, 0.16, 0.1); part(sph, dark, 2.5, 2.16, -0.2, 0.04, 0.16, 0.1);
    [-1, 1].forEach(function (sd) {
      part(new T.ConeGeometry(0.48, 0.85, 4), pink, 1.05, 3.5, sd * 0.85, 1, 1, 0.55, sd * 0.35, 0, -0.5, true); // уши
      part(sph, dark, 1.86, 2.75, sd * 0.62, 0.13, 0.17, 0.13); // глаза
      part(sph, white, 1.96, 2.82, sd * 0.6, 0.04, 0.05, 0.04);
      part(sph, pinkDeep, 1.75, 2.25, sd * 0.98, 0.32, 0.22, 0.12); // румянец
      [-1, 1].forEach(function (fb) { part(new T.CylinderGeometry(0.36, 0.4, 0.95, 20), pink, fb * 1.05, 0.48, sd * 0.78, 1, 1, 1, 0, 0, 0, true); }); // ноги
    });
    part(new T.TorusGeometry(0.22, 0.07, 10, 20, Math.PI * 1.6), pinkDeep, -2.2, 2.35, 0, 1, 1, 1, 0, Math.PI / 2, 0.4, true); // хвост
    part(new T.BoxGeometry(1.0, 0.1, 0.16), dark, -0.35, 3.66, 0, 1, 1, 1); // прорезь для монет
    // колпак
    var hat = new T.Group(); hat.position.set(0.95, 3.55, 0); hat.rotation.z = 0.55; pig.add(hat);
    var cone = new T.Mesh(new T.ConeGeometry(0.75, 1.7, 28), red); cone.position.y = 0.85; cone.rotation.z = 0.25; hat.add(cone);
    var brim = new T.Mesh(new T.TorusGeometry(0.72, 0.2, 12, 30), white); brim.rotation.x = Math.PI / 2; brim.position.y = 0.05; hat.add(brim);
    var pom = new T.Mesh(new T.SphereGeometry(0.26, 16, 12), white); pom.position.set(-0.42, 1.68, 0); hat.add(pom);
    // звезда над копилкой (Золотая банка разобрана)
    var starShape = new T.Shape();
    for (var st = 0; st < 10; st++) { var an2 = Math.PI / 2 + st * Math.PI / 5, rr = st % 2 ? 0.34 : 0.8; if (st) starShape.lineTo(Math.cos(an2) * rr, Math.sin(an2) * rr); else starShape.moveTo(Math.cos(an2) * rr, Math.sin(an2) * rr); }
    var starGeo = new T.ExtrudeGeometry(starShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 1 });
    var pigStarMat = new T.MeshStandardMaterial({ color: 0xffd21a, emissive: 0xfdd717, emissiveIntensity: 0, metalness: 0.7, roughness: 0.25 });
    var pigStar = new T.Mesh(starGeo, pigStarMat); pigStar.position.set(PIG_AT[0], 6.4, PIG_AT[2]); pigStar.visible = false; scene.add(pigStar);
    var pigStarGlow = k.glow(0xfdd717, 5); pigStarGlow.position.copy(pigStar.position); pigStarGlow.material.opacity = 0; scene.add(pigStarGlow);
    var pigHalo = k.glow(0xffd34a, 9); pigHalo.position.set(PIG_AT[0], 2.2, PIG_AT[2] + 1); pigHalo.material.opacity = 0; scene.add(pigHalo);
    // кучка монет у копыт растёт вместе с прогрессом
    var pile = [];
    var r2 = rng(3);
    for (var pc = 0; pc < 30; pc++) {
      var pa = r2() * Math.PI * 2, prr = 2.4 + r2() * 1.4;
      var cm = new T.Mesh(coinGeo, coinMats(0xfdd717)); cm.position.set(PIG_AT[0] + Math.cos(pa) * prr * 1.1, 0.06 + (pc % 3) * 0.08, PIG_AT[2] + 1.0 + Math.sin(pa) * prr * 0.55);
      cm.rotation.set((r2() - 0.5) * 0.5, r2() * 6, (r2() - 0.5) * 0.5); cm.visible = false; scene.add(cm); pile.push(cm);
    }
    S.meter = k.label(pig, [0, 5.0, 0], '', null); S.meter.cls('meter', true);

    // ---------- Piggins (настоящий PNG; низ спрятан в облаках, края растушёваны) ----------
    var piggins = new T.Group(); piggins.position.set(-6.8, -0.6, -7.6); scene.add(piggins);
    k.image(PIGGINS, function (t0, img) {
      var cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      var g = cv.getContext('2d'); g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      var fb = g.createLinearGradient(0, cv.height * 0.8, 0, cv.height); fb.addColorStop(0, 'rgba(0,0,0,0)'); fb.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = fb; g.fillRect(0, cv.height * 0.8, cv.width, cv.height * 0.2);
      var fr = g.createLinearGradient(cv.width * 0.93, 0, cv.width, 0); fr.addColorStop(0, 'rgba(0,0,0,0)'); fr.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = fr; g.fillRect(cv.width * 0.93, 0, cv.width * 0.07, cv.height);
      var tx = new T.CanvasTexture(cv); if (T.sRGBEncoding) tx.encoding = T.sRGBEncoding;
      var H = 8.2, Wd = H * img.width / img.height;
      var m = new T.Mesh(new T.PlaneGeometry(Wd, H), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.03, depthWrite: true, toneMapped: false, fog: false }));
      m.position.y = H / 2; piggins.add(m); S.pigginsMesh = m;
    });
    // облака перед Piggins (прячут срез PNG по поясу)
    puff(-6.8, 0.2, -6.0, 3.4, 1.3, 1.6, 0); puff(-9.4, 0.0, -6.4, 2.4, 1.1, 1.4, 2); puff(-4.4, -0.1, -6.2, 2.4, 1.0, 1.4, 1); puff(-7.2, 1.0, -5.4, 2.0, 0.9, 1.1, 3);

    // ---------- банка ----------
    var glassGeo = new T.CylinderGeometry(0.72, 0.72, 1.9, 40, 1, true);
    var glassBottom = new T.CircleGeometry(0.72, 40);
    var lidGeo = new T.CylinderGeometry(0.78, 0.78, 0.26, 40);
    var neckGeo = new T.TorusGeometry(0.72, 0.06, 8, 40);
    var shineGeo = new T.CylinderGeometry(0.735, 0.735, 1.6, 12, 1, true, 0.5, 0.35);
    var goldLid = new T.MeshStandardMaterial({ color: 0xffe066, metalness: 0.8, roughness: 0.28, emissive: 0xc08400, emissiveIntensity: 0.75 });
    var silverLid = new T.MeshStandardMaterial({ color: 0x6f7ab8, metalness: 0.8, roughness: 0.4 });
    var jarCoinGeo = new T.CylinderGeometry(0.27, 0.27, 0.12, 28);
    var GLASS = { lock: new T.Color(0x8f9ad8).convertSRGBToLinear(), gold: new T.Color(0xffe27a).convertSRGBToLinear(), norm: new T.Color(0xdfe8ff).convertSRGBToLinear() };
    var shineMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, side: T.DoubleSide });

    function jarObj(J) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var golden = !!J.golden;
      var glass = new T.MeshStandardMaterial({ color: golden ? 0xffe27a : 0xdfe8ff, transparent: true, opacity: golden ? 0.32 : 0.2, roughness: 0.04, metalness: 0.1, side: T.DoubleSide, depthWrite: false });
      var body = new T.Mesh(glassGeo, glass); body.position.y = 0.95; body.renderOrder = 2; inner.add(body);
      var bot = new T.Mesh(glassBottom, glass); bot.rotation.x = -Math.PI / 2; bot.position.y = 0.02; inner.add(bot);
      var shine = new T.Mesh(shineGeo, shineMat); shine.position.y = 1.0; shine.renderOrder = 3; inner.add(shine);
      var neck = new T.Mesh(neckGeo, glass); neck.rotation.x = Math.PI / 2; neck.position.y = 1.9; inner.add(neck);
      var lid = new T.Group(); lid.position.y = 2.02; inner.add(lid);
      var lidM = new T.Mesh(lidGeo, goldLid); lid.add(lidM);
      var lidRim = new T.Mesh(new T.TorusGeometry(0.78, 0.05, 8, 40), goldLid); lidRim.rotation.x = Math.PI / 2; lidRim.position.y = -0.1; lid.add(lidRim);
      if (golden) { var ls = new T.Mesh(starGeo, pigStarMat); ls.scale.setScalar(0.5); ls.position.set(0, 0.55, -0.05); lid.add(ls); }
      // монеты: 3 стопки внутри
      var stacks = [], seed = rng((J.n || 0) * 13 + 5);
      for (var s2 = 0; s2 < 3; s2++) {
        var aa = s2 * Math.PI * 2 / 3 + 0.5, st2 = [];
        for (var h = 0; h < 11; h++) {
          var cmesh = new T.Mesh(jarCoinGeo, coinMats(COINS[0])); cmesh.position.set(Math.cos(aa) * 0.36 + (seed() - 0.5) * 0.03, 0.09 + h * 0.135, Math.sin(aa) * 0.36);
          cmesh.rotation.set((seed() - 0.5) * 0.08, seed() * 6, (seed() - 0.5) * 0.08); inner.add(cmesh); st2.push(cmesh);
        }
        stacks.push(st2);
      }
      var glow = k.glow(golden ? 0xffd34a : 0xfdd717, golden ? 5.2 : 3.4); glow.position.y = 1.1; glow.material.opacity = 0; g.add(glow);
      var ring = new T.Mesh(new T.RingGeometry(1.0, 1.2, 40), new T.MeshBasicMaterial({ color: BR.y, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
      return { g: g, inner: inner, glass: glass, lid: lid, stacks: stacks, glow: glow, ring: ring, golden: golden, seed: (J.n || 0) * 7 + 3, look: '', hover: 0, sorted: 0, h: 2.4 };
    }
    // раскраска монет по состоянию: разобрана — каждая стопка своего цвета; иначе — перемешано
    function paint(o, J, sorted) {
      var key2 = (sorted ? 's' : 'm') + J.colors;
      if (o.look === key2) return; o.look = key2;
      var r = rng(o.seed), nc = Math.max(3, Math.min(COINS.length, J.colors || 3));
      o.stacks.forEach(function (st3, si) {
        st3.forEach(function (cm2) {
          var col = o.golden && sorted ? COINS[0] : sorted ? COINS[(o.seed + si * 2) % nc] : COINS[Math.floor(r() * nc)];
          cm2.material = coinMats(col);
        });
      });
    }

    // Цвета в коде — sRGB (как в макетах), а рендер с outputEncoding = sRGB считает их линейными и высветляет:
    // всё выходит пастельным. Переводим цвета материалов в линейные один раз (спрайты-свечения не трогаем — им нужна яркость).
    S.linearize = function () {
      if (T.ColorManagement && T.ColorManagement.legacyMode === false) return; // ядро уже читает hex как sRGB
      scene.traverse(function (o) {
        if (!o.isMesh) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) {
          if (!m || m.userData.lin) return; m.userData.lin = true;
          if (m.color) m.color.convertSRGBToLinear();
          if (m.emissive) m.emissive.convertSRGBToLinear();
        });
      });
    };

    // ---------- подарки на облаках (цвет бренда) ----------
    [[-2.6, 1.6, 0xff4fa3, 0xfdd717, 0.75], [2.9, 1.2, 0x27c93f, 0xff4136, 0.62], [-8.6, 0.4, 0x3d6bff, 0xfdd717, 0.85], [8.9, 0.0, 0x9b5cff, 0xfdd717, 0.7],
     [3.8, -1.6, 0xfdd717, 0xff4fa3, 0.55], [-1.2, -2.6, 0x22d3ee, 0xff4136, 0.5], [7.2, -2.8, 0xff4136, 0xfdd717, 0.6]].forEach(function (d, i7) {
      var s3 = d[4], gift = new T.Group(); gift.position.set(d[0], s3 / 2, d[1]); gift.rotation.y = i7 * 0.7; scene.add(gift);
      gift.add(new T.Mesh(new T.BoxGeometry(s3, s3, s3), new T.MeshStandardMaterial({ color: d[2], roughness: 0.45, envMapIntensity: 0.5 })));
      var ribMat = new T.MeshStandardMaterial({ color: d[3], roughness: 0.3, metalness: 0.4 });
      gift.add(new T.Mesh(new T.BoxGeometry(s3 + 0.02, s3 + 0.02, s3 * 0.18), ribMat));
      gift.add(new T.Mesh(new T.BoxGeometry(s3 * 0.18, s3 + 0.02, s3 + 0.02), ribMat));
      [-1, 1].forEach(function (sd2) { var bow = new T.Mesh(new T.TorusGeometry(s3 * 0.2, s3 * 0.06, 8, 16), ribMat); bow.position.set(sd2 * s3 * 0.16, s3 * 0.58, 0); bow.rotation.set(0, Math.PI / 2, sd2 * 0.6); gift.add(bow); });
    });

    S.paint = paint;
    S.place = function (J) {
      var o = S.jars[J.id];
      if (!o) {
        o = jarObj(J);
        var spt = SPOTS[J.id] || [0, 8];
        o.g.position.set(spt[0], J.golden ? GOLD_Y : 0, spt[1]);
        if (J.practice) o.g.scale.setScalar(0.78);
        if (J.golden) o.g.scale.setScalar(1.35);
        scene.add(o.g);
        var open = function () { if (S.onOpen) S.onOpen(J.id, S.list.find(function (x) { return x.id === J.id; })); };
        o.lab = k.label(o.g, [0, o.h + 0.75, 0], '', open);
        k.pick(o.g, open, function (on) { o.hover = on ? 1 : 0; });
        S.jars[J.id] = o;
      }
      return o;
    };

    // ---------- монеты летят в копилку ----------
    var slotWorld = new T.Vector3();
    S.fly = function (from) {
      pig.updateWorldMatrix(true, true);
      slotWorld.set(-0.35, 3.7, 0).applyMatrix4(pig.matrixWorld);
      for (var f = 0; f < 8; f++) {
        var m = new T.Mesh(coinGeo, coinMats(0xfdd717)); m.scale.setScalar(1.4); scene.add(m);
        S.flyers.push({ m: m, a: from.clone().add(new T.Vector3((Math.random() - 0.5) * 0.4, 2.4, 0)), b: slotWorld.clone(), t: -f * 0.11 });
      }
      S.bump = 1;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      S.t = t;
      twinkles.forEach(function (w) { var v = 0.5 + 0.5 * Math.sin(t * w.sp + w.ph); w.s.material.opacity = 0.35 + 0.65 * v; });
      farClouds.forEach(function (c3) { c3.s.position.x = c3.x0 + Math.sin(t * 0.04 * c3.sp + c3.x0) * 4; });
      skyCoins.forEach(function (sc) { sc.m.rotation.z += dt * 0.5; sc.m.position.y = sc.y0 + Math.sin(t * 0.8 + sc.ph) * 0.4; });
      garBulbs.forEach(function (gb2) { var v2 = 0.65 + 0.35 * Math.sin(t * 2.4 + gb2.ph); gb2.m.emissiveIntensity = 2.2 * v2; gb2.gl.material.opacity = 0.75 * v2; });
      // золото в копилке
      S.fill += (S.fillTo - S.fill) * Math.min(1, dt * 1.6);
      fillPlane.constant = PIG_AT[1] + 0.02 + S.fill * 3.72;
      goldParts.forEach(function (gm2) { gm2.visible = S.fill > 0.004; });
      S.golden += ((S.goldenTo || 0) - S.golden) * Math.min(1, dt * 1.5);
      pigStar.visible = S.golden > 0.02;
      pigStar.rotation.y = t * 0.9; pigStar.scale.setScalar(0.4 + 0.6 * S.golden);
      pigStarMat.emissiveIntensity = 0.6 + S.golden * 1.6;
      pigStarGlow.material.opacity = S.golden * (0.75 + 0.2 * Math.sin(t * 2.2));
      pigHalo.material.opacity = S.fill * 0.22 + S.golden * 0.25;
      pigLight.intensity = S.fill * 1.2 + S.golden * 1.2;
      pile.forEach(function (cm3, i5) { cm3.visible = i5 < Math.round(S.fill * pile.length); });
      S.bump = Math.max(0, (S.bump || 0) - dt * 1.6);
      var bs = 1 + Math.sin(S.bump * Math.PI) * 0.06; pig.scale.set(bs, 1 / bs * 0.98 + 0.02 * bs, bs);
      // банки
      Object.keys(S.jars).forEach(function (id) {
        var o = S.jars[id], cur = S.current === id;
        o.sorted += ((o.state === 'sorted' ? 1 : 0) - o.sorted) * Math.min(1, dt * 2);
        o.glow.material.opacity = o.sorted * (0.5 + 0.15 * Math.sin(t * 2 + o.seed)) + (o.golden && o.ready ? 0.35 + 0.25 * Math.sin(t * 3) : 0);
        o.ring.material.opacity += ((cur ? 0.9 : o.hover ? 0.45 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
        var active = o.state === 'active' || cur;
        o.lid.position.y = 2.02 + (active ? 0.35 + Math.sin(t * 3) * 0.06 : 0);
        o.lid.rotation.z = active ? 0.35 : 0;
        o.inner.position.y = cur ? Math.abs(Math.sin(t * 2.4)) * 0.12 : 0;
        var sc2 = 1 + o.hover * 0.05; o.inner.scale.x += (sc2 - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        o.glass.opacity = o.locked ? 0.4 : o.golden ? 0.24 : 0.12;
        o.glass.color.copy(o.locked ? GLASS.lock : o.golden ? GLASS.gold : GLASS.norm);
      });
      // летящие монеты
      for (var q = S.flyers.length - 1; q >= 0; q--) {
        var F = S.flyers[q]; F.t += dt * 0.9;
        var u3 = Math.max(0, Math.min(1, F.t));
        F.m.visible = F.t > 0;
        F.m.position.lerpVectors(F.a, F.b, u3); F.m.position.y += Math.sin(u3 * Math.PI) * 3.2;
        F.m.rotation.x += dt * 9;
        if (F.t >= 1) { scene.remove(F.m); S.flyers.splice(q, 1); }
      }
    });

    S.k = k;
    k.onResize(function (w, h) {
      var Fr = frame(w / h), changed = !S.frame || Math.abs(Fr.t - S.frame.t) > 0.02;
      S.frame = Fr;
      k.camera.fov = Fr.fov;
      if (Fr.t > 0) k.camera.zoom = Fr.zoom;
      k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') k.look(Fr.pos, Fr.look, 0.4);
    });
    return S;
  }

  // ======================================================================================================
  function render(el, jars, opts) {
    opts = opts || {};
    var S = el._c3d;
    if (!S) {
      if (!supported()) return window.CoinPiggy ? CoinPiggy.render(el, jars, opts) : null;
      css();
      el.classList.add('c3d');
      el.onclick = null;
      Array.prototype.slice.call(el.children).forEach(function (c) { if (!c.classList.contains('c3d-title')) el.removeChild(c); });
      S = build(el);
      if (!S) { el.classList.remove('c3d'); return window.CoinPiggy ? CoinPiggy.render(el, jars, opts) : null; }
      el._c3d = S;
    }
    var p = opts.progress || { jars: 0, golden: false };
    if (S.k.debug('lit')) {
      jars = jars.map(function (j) { return Object.assign({}, j, { status: 'sorted', can: { ok: true } }); });
      p = { jars: 6, golden: true };
    }
    S.list = jars; S.onOpen = opts.onOpen; S.current = opts.current || null;
    jars.forEach(function (J) {
      var o = S.place(J), lk = locked(J);
      o.state = J.status; o.locked = lk; o.ready = J.golden && !lk && J.status !== 'sorted';
      S.paint(o, J, J.status === 'sorted');
      o.lab.set((J.golden ? 'Golden Jar' : J.title) + '<small>' + sub(J) + '</small>');
      o.lab.el.setAttribute('aria-label', J.title + ': ' + sub(J));
      o.lab.cls('sorted', J.status === 'sorted'); o.lab.cls('active', J.status === 'active'); o.lab.cls('locked', lk);
      o.lab.cls('ready', !lk && J.status === 'new'); o.lab.cls('gold', !!J.golden); o.lab.cls('cur', S.current === J.id);
    });
    S.fillTo = Math.max(0, Math.min(1, (p.jars || 0) / 6)); S.goldenTo = p.golden ? 1 : 0;
    // первый показ — сразу в текущем состоянии; анимируются только изменения после разобранной банки
    if (!S.inited) {
      S.inited = true; S.fill = S.fillTo; S.golden = S.goldenTo;
      Object.keys(S.jars).forEach(function (id) { S.jars[id].sorted = S.jars[id].state === 'sorted' ? 1 : 0; });
    }
    S.linearize();
    S.meter.set('<span><b>' + (p.jars || 0) + '</b>/6 jars</span>' + (p.golden ? '<small>Golden ✓</small>' : '<small>piggy bank</small>'));
    // камера: к текущей банке, иначе общий план
    var cur = S.current && S.jars[S.current];
    if (cur) {
      var key = 'cur:' + S.current;
      if (S.camKey !== key) {
        S.camKey = key;
        var q = cur.g.position, tall = S.frame && S.frame.t > 0.5;
        S.k.look([q.x * 0.55, q.y + (tall ? 9 : 6.2), q.z + (tall ? 14 : 11.5)], [q.x * 0.7, q.y + 1.6, q.z - 1.5], 1.6);
      }
    } else if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.6); }
    return S;
  }

  function flick(el, id) {
    var S = el && el._c3d;
    if (!S) return window.CoinPiggy ? CoinPiggy.flick(el) : null;
    var o = S.jars[id || S.current]; if (!o) { S.bump = 1; return; }
    var w = o.g.position.clone(); w.y += 1.4;
    S.fly(w);
  }

  window.CoinPiggy3D = { render: render, flick: flick, supported: supported };
})();
