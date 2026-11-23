/**
 * 3D-бульвар Countdown on the Strip (Vegas Way) на ядре _3d/ny3d.js, ПРЕМИУМ-режим (конвейер зала Witching Hours:
 * зеркальный мокрый бульвар, bloom, нарисованный задник, неоновые трубки). Мир вокруг лобби; игра (StripGame) не меняется.
 *   Strip3D.render(box, me, { onOpen(act) })  — me = ответ /api/me; первый вызов строит сцену, дальше только обновляет
 *   Strip3D.launch(box)                        — полночь: ракета игрока взлетает, шар над театром опускается
 *   Strip3D.supported()                        — есть ли WebGL (иначе страница остаётся как была: сетка актов)
 * Сюжет: ночь 31.12 на Стрипе. Вдоль бульвара пять казино-шоу-румов Мага (акты I–V) и театр Арлекины в конце (акт VI).
 * Сыгранный акт — марки бегут огнями, неон горит в полную силу, все окна башни светятся. Открытый — марки мигают,
 * неон «дышит». Закрытый — неон еле тлеет. Посередине площадка с ракетой игрока: цвет и размер = уровень.
 * Неон — только абстрактные формы (ромбы, звёзды, стрелы, волны), никаких букв и цифр.
 * Подключение: three.min.js + цепочка EffectComposer/UnrealBloomPass + Reflector.js из /3d/vendor (см. dev/index.html).
 */
(function () {
  'use strict';
  var C = { red: 0xff2b39, cy: 0x01c9ff, gold: 0xd9b25a, bulb: 0xffd36a, night: 0x02060e, warm: 0xffc46b, mag: 0xff3fae, white: 0xfff3dc };
  var NEON = [C.cy, C.red, C.mag, C.cy, C.red];
  var FACADES = [0x0d3a5c, 0x5c0f22, 0x2a1660, 0x0b4a44, 0x152a6a];
  var TIER = { spark: { c: 0xfff3b0, s: 0.55 }, red: { c: C.red, s: 0.68 }, blue: { c: C.cy, s: 0.82 }, gold: { c: 0xffc23a, s: 0.95 } };
  // места: [x, z, поворот]; акт VI — театр в конце бульвара
  var SPOTS = { 1: [-8.8, -3, 0.62], 2: [8.8, -8.5, -0.62], 3: [-8.8, -14, 0.62], 4: [8.8, -19.5, -0.62], 5: [-8.8, -25, 0.62], 6: [0, -33, 0] };
  // кадр: ниже и ближе, глубина улицы к театру; телефон — выше, чтобы бульвар читался сверху вниз
  var CAM = { pos: [0, 7.2, 21], look: [0, 4.2, -18] };
  var CAM_TALL = { pos: [0, 8.2, 15.5], look: [0, 5.4, -18] };

  var CAM_SQ = { pos: [0, 8.6, 23.5], look: [0, 3.6, -16] }; // почти квадратный блок (1920×1080 и т. п.): площадка ракеты целиком
  // три опорных кадра: широкий (≥1.6) → квадрат (1.0) → телефон (≤0.6), между ними плавно
  function frame(a) {
    var A = a >= 1 ? { p: CAM, q: CAM_SQ, s: Math.max(0, Math.min(1, (1.6 - a) / 0.6)), f0: 46, f1: 52 }
      : { p: CAM_SQ, q: CAM_TALL, s: Math.max(0, Math.min(1, (1.0 - a) / 0.4)), f0: 52, f1: 66 };
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * A.s; }); }
    var t = Math.max(0, Math.min(1, (1.6 - a) / 1.0));
    return { t: t, pos: mix(A.p.pos, A.q.pos), look: mix(A.p.look, A.q.look), fov: A.f0 + (A.f1 - A.f0) * A.s, zoom: Math.max(0.74, Math.min(1, a / 0.7)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function roman(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function css() {
    if (document.getElementById('v3d-css')) return;
    var s = document.createElement('style'); s.id = 'v3d-css';
    s.textContent =
      '.v3d{height:clamp(520px,86vh,980px);margin:0 0 18px;border-radius:16px;background:#02060E;box-shadow:0 0 0 1px rgba(188,170,116,.28),0 30px 80px rgba(0,0,0,.5)}' +
      '.v3d .ny3d-label{font:900 13px/1.05 Raleway,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#fff;' +
      'background:rgba(2,8,16,.78);border:1px solid rgba(1,201,255,.35);border-radius:999px;padding:6px 13px 7px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;backdrop-filter:blur(6px)}' +
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
      premium: true, bg: 0x08142e, fogExp: [0x050b1c, 0.0125],
      env: [C.cy, C.red, 0xe8f6ff, 0x7a1030, 0x102040], // слева, справа, сверху, сзади, пол — как зал Vegas в WH
      cam: { pos: CAM.pos, look: CAM.look, fov: 46 }, fixedZoom: true, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, S = { k: k, venues: {}, launchT: -1, neon: [], bulbSets: [] };
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };

    // ---------- материалы (как в зале WH: золото / хром / чёрный лак с усиленным окружением) ----------
    var gold = new T.MeshStandardMaterial({ color: C.gold, metalness: 0.95, roughness: 0.24, envMapIntensity: 1.5 });
    var chrome = new T.MeshStandardMaterial({ color: 0xdfe4ec, metalness: 1, roughness: 0.14, envMapIntensity: 1.6 });
    var lacquer = new T.MeshStandardMaterial({ color: 0x0c0b12, metalness: 0.45, roughness: 0.2, envMapIntensity: 1.1 });
    var stone = new T.MeshStandardMaterial({ color: 0xd8d2c6, metalness: 0.1, roughness: 0.3, envMapIntensity: 0.9 });

    // ---------- задник: нарисованный бульвар Вегаса (тот же, что в зале WH) + звёзды ----------
    // небо НГ из Flow (batch 2: вымышленный скайлайн + салют, без реальных отелей); нет файла — прежний бульвар WH
    // сверху картинка продлена её же верхней строкой и уходит в цвет фона — на телефоне камера смотрит выше и края неба не видно
    (function () {
      var url = '../../vegasway/assets/gen/sky-nye.jpg', p = new Image();
      p.onerror = function () { k.panorama({ src: '../../vegasway/assets/scenes/vegasway-boulevard.webp', r: 95, h: 74, span: 2.4, y0: -33, z: -6, repeat: 2, color: 0x9a9aa6 }); };
      p.src = url;
      k.image(url, function (t, img) {
        var EXT = 0.55, W = 1376, H0 = Math.round(W * img.height / img.width), H = Math.round(H0 * (1 + EXT)), top = H - H0;
        var tx = k.tex(W, H, function (g) {
          g.drawImage(img, 0, top, W, H0);
          g.drawImage(img, 0, 0, img.width, 3, 0, 0, W, top + 2);
          var gr = g.createLinearGradient(0, 0, 0, top + 40); gr.addColorStop(0, 'rgba(8,20,46,1)'); gr.addColorStop(0.55, 'rgba(8,20,46,.6)'); gr.addColorStop(1, 'rgba(8,20,46,0)');
          g.fillStyle = gr; g.fillRect(0, 0, W, top + 40);
        });
        k.panorama({ texture: tx, r: 95, h: 64 * (1 + EXT), span: 2.4, y0: -8, z: -6, repeat: 2, color: 0xb4b4c0 });
      });
    })();
    var starN = 360, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = rnd(-Math.PI, 0), el = rnd(0.3, 1.1), R = 90; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.6 + 18; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 20; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xdffcff, size: 0.35, transparent: true, opacity: 0.7, fog: false, depthWrite: false })));

    // ---------- свет: ключевой тёплый спереди, контровой красный от театра, цветные боковые ----------
    scene.add(new T.HemisphereLight(0x2a3466, 0x0a0408, 0.6));
    var key = new T.SpotLight(0xffe0b8, 1.5, 70, 0.62, 0.65, 1.1); key.position.set(2, 13, 15); key.target.position.set(0, 2, -6); scene.add(key, key.target);
    var back = new T.PointLight(C.red, 2.2, 34, 1.5); back.position.set(0, 9, -29); scene.add(back);
    [[C.cy, -7, -3], [C.red, 7, -9], [C.mag, -7, -15], [C.cy, 7, -21], [C.red, -7, -27]].forEach(function (p) {
      var L = new T.PointLight(p[0], 1.4, 18, 1.6); L.position.set(p[1], 4.5, p[2]); scene.add(L);
    });
    var padLight = new T.PointLight(C.warm, 1.0, 11, 1.6); padLight.position.set(0, 3.2, 7); scene.add(padLight);

    // ---------- графика из assets/gen (Flow, 18.11): нет файла — остаётся процедурное/прежнее ----------
    var GEN = '../../vegasway/assets/gen/';
    function genMiss(url, fn) { var p = new Image(); p.onerror = fn; p.src = url; }
    function genTile(url, apply) { k.image(url, function (t, img) { var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.RepeatWrapping; c.anisotropy = k.aniso; apply(c, img); }); }
    function board(url, fb, h, o) {
      var b = k.billboard(url, h, o);
      genMiss(url, function () { var m = b.children[0]; k.image(fb, function (t, img) { m.material.map = t; m.material.needsUpdate = true; m.scale.set(h * img.width / img.height, h, 1); m.position.y = h / 2; m.visible = true; }); });
      return b;
    }

    // ---------- мокрый бульвар: зеркало под полупрозрачным асфальтом и плиткой ----------
    var floorMeshes = [];
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#05070c'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.3)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      for (var p = 0; p < 26; p++) { var gx = Math.random() * w, gy = Math.random() * h, gr = g.createRadialGradient(gx, gy, 0, gx, gy, rnd(20, 60)); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } // лужи — темнее, отражение ярче
      g.fillStyle = '#ffcf3a'; for (var y = 0; y < h; y += 64) { g.fillRect(w / 2 - 8, y, 5, 38); g.fillRect(w / 2 + 3, y, 5, 38); }
      g.fillStyle = 'rgba(240,240,255,.7)'; g.fillRect(8, 0, 4, h); g.fillRect(w - 12, 0, 4, h);
    }, HQ);
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 5);
    var road = new T.Mesh(new T.PlaneGeometry(9, 70), new T.MeshStandardMaterial({ map: roadTex, emissive: 0xffffff, emissiveMap: roadTex, emissiveIntensity: 0.18, roughness: 0.22, metalness: 0.2, transparent: true, opacity: 0.8 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.006, -14); scene.add(road); floorMeshes.push(road);
    // мокрый асфальт из Flow + наша разметка поверх (двойная жёлтая, белые кромки); тайл ~4.5 ед. квадратом
    k.image(GEN + 'asphalt-wet.jpg', function (t, img) {
      var at = k.tex(256, 1024, function (g, w, h) {
        var tw = 4.5 * w / 9, th = 4.5 * h / 14;
        for (var y = 0; y < h; y += th) for (var x = 0; x < w; x += tw) g.drawImage(img, x, y, tw, th);
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#ffcf3a'; for (var yy = 0; yy < h; yy += 64) { g.fillRect(w / 2 - 8, yy, 5, 38); g.fillRect(w / 2 + 3, yy, 5, 38); }
        g.fillStyle = 'rgba(240,240,255,.7)'; g.fillRect(8, 0, 4, h); g.fillRect(w - 12, 0, 4, h);
      }, HQ);
      at.wrapT = T.RepeatWrapping; at.repeat.set(1, 5);
      road.material.map = at; road.material.emissiveMap = at; road.material.needsUpdate = true;
    });
    var walkTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#0d0a1a'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2500; i++) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.strokeStyle = 'rgba(217,178,90,.22)'; g.lineWidth = 1.5;
      for (var x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
      g.beginPath(); g.moveTo(32, 0); g.lineTo(32 + 192, 256); g.globalAlpha = 0.2; g.stroke(); g.globalAlpha = 1;
    }, HQ);
    walkTex.wrapS = walkTex.wrapT = T.RepeatWrapping; walkTex.repeat.set(2, 13);
    var walkMat = new T.MeshStandardMaterial({ map: walkTex, emissive: 0xffffff, emissiveMap: walkTex, emissiveIntensity: 0.12, roughness: 0.18, metalness: 0.25, transparent: true, opacity: 0.78 });
    [-1, 1].forEach(function (sd) {
      var wk = new T.Mesh(new T.PlaneGeometry(6, 70), walkMat); wk.rotation.x = -Math.PI / 2; wk.position.set(sd * 7.5, 0.008, -14); scene.add(wk); floorMeshes.push(wk);
    });
    var plazaTex = k.tex(512, 512, function (g, w) {
      var c = w / 2; g.fillStyle = '#0a0612'; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(217,178,90,.6)'; g.lineWidth = 3;
      [0.46, 0.4, 0.26].forEach(function (r) { g.beginPath(); g.arc(c, c, r * w, 0, Math.PI * 2); g.stroke(); });
      for (var i = 0; i < 16; i++) { var an = i / 16 * Math.PI * 2; g.beginPath(); g.moveTo(c + Math.cos(an) * 0.26 * w, c + Math.sin(an) * 0.26 * w); g.lineTo(c + Math.cos(an) * 0.46 * w, c + Math.sin(an) * 0.46 * w); g.stroke(); }
    }, HQ);
    var plaza = new T.Mesh(new T.CircleGeometry(10, 64), new T.MeshStandardMaterial({ map: plazaTex, emissive: 0xffffff, emissiveMap: plazaTex, emissiveIntensity: 0.25, roughness: 0.18, metalness: 0.3, transparent: true, opacity: 0.8 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.01, -30); scene.add(plaza); floorMeshes.push(plaza);
    var mirror = k.mirror(new T.PlaneGeometry(21, 72), { hide: floorMeshes }); // только под бульваром: вне его зеркало ловило задник под острым углом (рябь)
    if (mirror) { mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, 0, -14); scene.add(mirror); }
    else floorMeshes.forEach(function (m) { m.material.transparent = false; m.material.opacity = 1; });
    var ground = new T.Mesh(new T.PlaneGeometry(240, 240), new T.MeshStandardMaterial({ color: 0x04060c, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -40); scene.add(ground);

    // ---------- конструкторы ----------
    // скруглённый блок (фаски, как у дорогой модели): основание на y = 0, по центру x/z
    function rbox(w, h, d, r) {
      r = Math.min(r || 0.08, w / 2 - 0.01, h / 2 - 0.01);
      var b = Math.min(0.05, d / 4), s = new T.Shape(), x0 = -w / 2 + b, x1 = w / 2 - b, y0 = b, y1 = h - b, rr = Math.max(0.001, r - b);
      s.moveTo(x0 + rr, y0); s.lineTo(x1 - rr, y0); s.quadraticCurveTo(x1, y0, x1, y0 + rr); s.lineTo(x1, y1 - rr); s.quadraticCurveTo(x1, y1, x1 - rr, y1);
      s.lineTo(x0 + rr, y1); s.quadraticCurveTo(x0, y1, x0, y1 - rr); s.lineTo(x0, y0 + rr); s.quadraticCurveTo(x0, y0, x0 + rr, y0);
      var geo = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
      geo.translate(0, 0, -(d - 2 * b) / 2); geo.computeVertexNormals();
      return geo;
    }
    // неоновая трубка по ломаной (MeshBasic ярче порога bloom → светится); уровень яркости задаёт setNeon
    function neon(parent, pts, col, closed, r, list) {
      var path = new T.CurvePath();
      for (var i = 0; i < pts.length - (closed ? 0 : 1); i++) path.add(new T.LineCurve3(pts[i], pts[(i + 1) % pts.length]));
      var mat = new T.MeshBasicMaterial({ color: col }); mat.userData.base = new T.Color(col);
      var m = new T.Mesh(new T.TubeGeometry(path, Math.max(12, pts.length * 10), r || 0.045, 6, false), mat);
      parent.add(m); (list || S.neon).push(mat);
      return m;
    }
    function neonRing(parent, r, tube, col, list) {
      var mat = new T.MeshBasicMaterial({ color: col }); mat.userData.base = new T.Color(col);
      var m = new T.Mesh(new T.TorusGeometry(r, tube, 8, 64), mat); parent.add(m); (list || S.neon).push(mat); return m;
    }
    function setNeon(list, lvl) { for (var i = 0; i < list.length; i++) list[i].color.copy(list[i].userData.base).multiplyScalar(lvl); }
    // абстрактные знаки в 2D (u, v ∈ −1..1) → точки на плоскости
    var SHAPES = {
      diamond: [[0, 1], [0.66, 0], [0, -1], [-0.66, 0]],
      star: (function () { var p = []; for (var s2 = 0; s2 < 10; s2++) { var an = Math.PI / 2 + s2 * Math.PI / 5, rr = s2 % 2 ? 0.42 : 1; p.push([Math.cos(an) * rr, Math.sin(an) * rr]); } return p; })(),
      arrow: [[-1, 0.22], [0.25, 0.22], [0.25, 0.6], [1, 0], [0.25, -0.6], [0.25, -0.22], [-1, -0.22]],
      star4: (function () { var p = []; for (var s2 = 0; s2 < 8; s2++) { var an = Math.PI / 2 + s2 * Math.PI / 4, rr = s2 % 2 ? 0.28 : 1; p.push([Math.cos(an) * rr, Math.sin(an) * rr]); } return p; })(),
    };
    function shapeOn(parent, name, size, map, col, list) { // map(u, v) → Vector3
      return neon(parent, SHAPES[name].map(function (q) { return map(q[0] * size, q[1] * size); }), col, true, 0.04, list);
    }
    // вырезка из общей картинки Flow: [u0, v0, u1, v1] (v снизу вверх, как в UV)
    function genCrop(url, r, apply) {
      k.image(url, function (t) { var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.ClampToEdgeWrapping; c.anisotropy = k.aniso; c.repeat.set(r[2] - r[0], r[3] - r[1]); c.offset.set(r[0], r[1]); apply(c); });
    }
    // 6 неоновых вывесок на чёрном (neon-signs.png): звезда, ромб, стрелка, полумесяц, волна, сердце. Полумесяц (с профилем лица) не берём
    var SIGN_UV = [[0.045, 0.205, 0.215, 0.79], [0.225, 0.205, 0.355, 0.79], [0.365, 0.205, 0.495, 0.79], null, [0.655, 0.205, 0.795, 0.79], [0.805, 0.205, 0.955, 0.79]];
    var SIGN_OF = { 1: 0, 2: 5, 3: 1, 4: 4, 5: 2 };
    // ряды лампочек: InstancedMesh, цвет каждой лампы задаётся в кадре (бегущие огни)
    var bulbGeo = new T.SphereGeometry(0.075, 10, 8), bulbMatBase = new T.MeshBasicMaterial({ color: 0xffffff });
    function bulbs(parent, pts, col) {
      var im = new T.InstancedMesh(bulbGeo, bulbMatBase, pts.length), M = new T.Matrix4(), c0 = new T.Color(col);
      pts.forEach(function (p, i) { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); im.setColorAt(i, c0); });
      im.frustumCulled = false; parent.add(im);
      var set = { im: im, n: pts.length, base: c0, tmp: new T.Color() };
      S.bulbSets.push(set);
      return set;
    }
    function lightBulbs(set, fn) { for (var i = 0; i < set.n; i++) { set.tmp.copy(set.base).multiplyScalar(fn(i)); set.im.setColorAt(i, set.tmp); } set.im.instanceColor.needsUpdate = true; }
    function lineOf(a, b, n) { var out = []; for (var i = 0; i <= n; i++) out.push(a.clone().lerp(b, i / n)); return out; }

    // фасад: стекло в латунных импостах + карта горящих окон (одни и те же ячейки)
    function facade(cols, rows, base) {
      var lit = [];
      for (var i = 0; i < cols * rows; i++) { var r = Math.random(); lit.push(r < 0.62 ? (r < 0.07 ? 'c' : r < 0.1 ? 'm' : 'w') : ''); }
      var W = 256, H = 512, cw = W / cols, ch = H / rows;
      var map = k.tex(W, H, function (g) {
        g.fillStyle = base; g.fillRect(0, 0, W, H);
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var x = c * cw + cw * 0.14, y = r * ch + ch * 0.16, ww = cw * 0.72, hh = ch * 0.62;
          var gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#24406a'); gr.addColorStop(0.5, '#0b1428'); gr.addColorStop(1, '#16284a');
          g.fillStyle = gr; g.fillRect(x, y, ww, hh);
        }
        g.fillStyle = 'rgba(217,178,90,.85)';
        for (var c2 = 0; c2 <= cols; c2 += 2) g.fillRect(c2 * cw - 2, 0, 4, H);
      }, HQ);
      var emi = k.tex(W, H, function (g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
          var L = lit[r * cols + c]; if (!L) continue;
          var x = c * cw + cw * 0.14, y = r * ch + ch * 0.16, ww = cw * 0.72, hh = ch * 0.62;
          var gr = g.createLinearGradient(0, y, 0, y + hh), col = L === 'c' ? ['#bff0ff', '#3fb8e8'] : L === 'm' ? ['#ffc0e8', '#e0409a'] : ['#fff0c8', '#e8a24a'];
          gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]); g.fillStyle = gr; g.fillRect(x, y, ww, hh);
        }
      }, HQ);
      return new T.MeshStandardMaterial({ map: map, emissive: 0xffffff, emissiveMap: emi, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.5, envMapIntensity: 1.3 });
    }

    // ---------- скульптуры шоу (на крыше подиума) ----------
    var cardBack = k.tex(128, 192, function (g, w, h) {
      g.fillStyle = '#f4f0e6'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b8102a'; g.fillRect(9, 9, w - 18, h - 18);
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.6;
      for (var i = -h; i < w + h; i += 11) { g.beginPath(); g.moveTo(i, 9); g.lineTo(i + h, h - 9); g.stroke(); g.beginPath(); g.moveTo(i + h, 9); g.lineTo(i, h - 9); g.stroke(); }
      g.strokeStyle = '#e8c060'; g.lineWidth = 3; g.strokeRect(15, 15, w - 30, h - 30);
    }, HQ);
    var cardFace = new T.MeshStandardMaterial({ map: cardBack, roughness: 0.35, metalness: 0.1 });
    function topHat(s) {
      var g = new T.Group();
      var prof = [[0, 0], [1.25, 0], [1.3, 0.05], [1.2, 0.1], [0.78, 0.12], [0.74, 0.5], [0.78, 1.4], [0.8, 1.48], [0, 1.48]].map(function (p) { return new T.Vector2(p[0] * s, p[1] * s); });
      g.add(new T.Mesh(new T.LatheGeometry(prof, 40), lacquer));
      var band = new T.Mesh(new T.CylinderGeometry(0.77 * s, 0.755 * s, 0.24 * s, 40, 1, true), new T.MeshStandardMaterial({ color: 0xa0101e, metalness: 0.3, roughness: 0.35, side: T.DoubleSide })); band.position.y = 0.26 * s; g.add(band);
      return g;
    }
    function card(w, h) { var g = new T.Mesh(rbox(w, h, 0.05, 0.08), [cardFace, gold]); return g; }
    function sculpture(v, list) {
      var g = new T.Group();
      if (v === 1) { var h1 = topHat(0.95); h1.rotation.z = -0.14; g.add(h1); var wand = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.2, 10), lacquer); wand.position.set(1.0, 1.0, 0.3); wand.rotation.z = -0.9; g.add(wand); var tip = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.35, 10), chrome); tip.position.set(1.85, 1.6, 0.3); tip.rotation.z = -0.9; g.add(tip); }
      if (v === 2) { var c2 = card(1.7, 2.5); c2.position.set(0, 0, 0); c2.rotation.y = 0.35; c2.rotation.z = 0.1; g.add(c2); var c2b = card(1.7, 2.5); c2b.position.set(0.6, 0, -0.3); c2b.rotation.y = 0.1; c2b.rotation.z = -0.18; g.add(c2b); }
      if (v === 3) {
        var stand = new T.Mesh(new T.LatheGeometry([[0, 0], [0.75, 0], [0.7, 0.12], [0.45, 0.3], [0.5, 0.55], [0, 0.55]].map(function (p) { return new T.Vector2(p[0], p[1]); }), 32), gold); g.add(stand);
        var ballMat = new T.MeshPhysicalMaterial({ color: 0x9fe8ff, metalness: 0, roughness: 0.02, transmission: 0, transparent: true, opacity: 0.55, envMapIntensity: 2, clearcoat: 1 });
        var ball = new T.Mesh(new T.SphereGeometry(1.0, 40, 28), ballMat); ball.position.y = 1.5; g.add(ball);
        var core = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), new T.MeshBasicMaterial({ color: new T.Color(C.cy).multiplyScalar(0.6) })); core.position.y = 1.5; g.add(core);
        list.push({ core: core.material, base: new T.Color(C.cy) });
      }
      if (v === 4) { [-1.5, -0.5, 0.5, 1.5].forEach(function (x, i) { var hh = topHat(0.48); hh.position.set(x, i % 2 ? 0.12 : 0, 0); hh.rotation.z = (i - 1.5) * 0.12; g.add(hh); }); }
      if (v === 5) { for (var c = 0; c < 5; c++) { var cc = card(1.0, 1.5); cc.geometry.translate(0, 0.0, 0); cc.position.set(0, 0.1, c * 0.03); cc.rotation.z = (c - 2) * 0.32; g.add(cc); } }
      return g;
    }

    // ---------- казино-шоу-рум (акты I–V): подиум с марки, ар-деко башня ступенями, неоновое лезвие ----------
    function venue(v) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var col = NEON[v - 1], ph = 4.2, w = 6.2, d = 4.6, th = 7 + (v % 3) * 1.6;
      var neonList = [], winMats = [];
      var shell = new T.MeshStandardMaterial({ color: FACADES[v - 1], metalness: 0.35, roughness: 0.3, envMapIntensity: 1.2 });
      // подиум
      inner.add(new T.Mesh(rbox(w, ph, d, 0.18), shell));
      var podWin = facade(16, 2, '#0a0f1c'); winMats.push(podWin);
      var pw = new T.Mesh(new T.PlaneGeometry(w - 0.6, 1.3), podWin); pw.position.set(0, 3.15, d / 2 + 0.02); inner.add(pw);
      var band = new T.Mesh(rbox(w + 0.25, 0.28, d + 0.25, 0.1), gold); band.position.y = ph; inner.add(band);
      // башня ступенями (ар-деко) с пилястрами
      var tower = new T.Group(); tower.position.set(0, ph + 0.28, -0.5); inner.add(tower);
      var tw = 4.4, td = 3.4;
      tower.add(new T.Mesh(rbox(tw, th, td, 0.22), shell));
      var tWin = facade(12, 30, '#0a0f1c'); winMats.push(tWin);
      // фасад ар-деко из Flow (6 окон × 5 этажей на тайл): светлые окна светятся через emissiveMap; сдвиг — башни не одинаковые
      genTile(GEN + 'facade-artdeco.jpg', function (c) {
        c.repeat.set(1, (th - 0.6) / 3.9); c.offset.set((v * 0.37) % 1, (v * 0.23) % 1);
        tWin.map = c; tWin.emissiveMap = c; tWin.metalness = 0.35; tWin.needsUpdate = true;
      });
      var tf = new T.Mesh(new T.PlaneGeometry(tw - 0.5, th - 0.6), tWin); tf.position.set(0, th / 2, td / 2 + 0.02); tower.add(tf);
      [-tw / 2 + 0.12, -0.75, 0.75, tw / 2 - 0.12].forEach(function (x) { var p = new T.Mesh(rbox(0.16, th, 0.16, 0.05), gold); p.position.set(x, 0, td / 2 + 0.05); tower.add(p); });
      var t2 = new T.Mesh(rbox(tw - 1.1, 1.3, td - 0.8, 0.15), shell); t2.position.y = th; tower.add(t2);
      var t3 = new T.Mesh(rbox(tw - 2.2, 0.9, td - 1.6, 0.12), shell); t3.position.y = th + 1.3; tower.add(t3);
      var spire = new T.Mesh(new T.ConeGeometry(0.22, 2.4, 12), gold); spire.position.y = th + 2.2 + 1.2; tower.add(spire);
      // неон по кромкам ступеней
      [[tw / 2 + 0.03, th, td / 2 + 0.03], [(tw - 1.1) / 2 + 0.03, th + 1.3, (td - 0.8) / 2 + 0.03], [(tw - 2.2) / 2 + 0.03, th + 2.2, (td - 1.6) / 2 + 0.03]].forEach(function (q, i) {
        neon(tower, [V(-q[0], q[1], q[2]), V(q[0], q[1], q[2]), V(q[0], q[1], -q[2]), V(-q[0], q[1], -q[2])], i % 2 ? C.white : col, true, 0.045, neonList);
      });
      // вход и марки-козырёк
      var fz = d / 2;
      var doorMat = new T.MeshStandardMaterial({ color: 0x1a120a, emissive: C.warm, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.4 });
      var door = new T.Mesh(new T.PlaneGeometry(2.2, 1.9), doorMat); door.position.set(0, 0.95, fz + 0.02); inner.add(door);
      [-1.2, 1.2].forEach(function (x) { var jamb = new T.Mesh(rbox(0.18, 2.0, 0.18, 0.05), gold); jamb.position.set(x, 0, fz + 0.06); inner.add(jamb); });
      var cz = fz + 0.95, cw2 = w * 0.84;
      var canopy = new T.Mesh(rbox(cw2, 0.34, 1.9, 0.12), chrome); canopy.position.set(0, 2.15, cz - 0.05); inner.add(canopy);
      var canopyUnder = new T.Mesh(new T.PlaneGeometry(cw2 - 0.3, 1.6), new T.MeshBasicMaterial({ color: new T.Color(C.warm).multiplyScalar(0.55) })); canopyUnder.rotation.x = Math.PI / 2; canopyUnder.position.set(0, 2.14, cz - 0.05); inner.add(canopyUnder);
      var bpts = lineOf(V(-cw2 / 2 + 0.15, 2.32, cz + 0.92), V(cw2 / 2 - 0.15, 2.32, cz + 0.92), 22)
        .concat(lineOf(V(-cw2 / 2 + 0.15, 2.0, cz + 0.92), V(cw2 / 2 - 0.15, 2.0, cz + 0.92), 22));
      var mBulbs = bulbs(inner, bpts, C.bulb);
      // табло над козырьком: чёрное стекло с неоновыми ромбами
      var board = new T.Mesh(rbox(cw2 - 0.2, 0.95, 0.16, 0.1), lacquer); board.position.set(0, 2.42, cz + 0.62); inner.add(board);
      var boardShapes = [];
      for (var dx = -2; dx <= 2; dx++) boardShapes.push(shapeOn(inner, dx % 2 ? 'diamond' : 'star4', 0.3, function (u, vv) { return V(dx * 0.95 + u, 2.9 + vv, cz + 0.72); }, dx % 2 ? col : C.white, neonList));
      var tpts = lineOf(V(-cw2 / 2 + 0.2, 3.42, cz + 0.62), V(cw2 / 2 - 0.2, 3.42, cz + 0.62), 18);
      var tBulbs = bulbs(inner, tpts, C.bulb);
      // марки из Flow (marquee.png: хром, три ряда ламп, ромбы и звёзды без текста) вместо табло; яркость — от состояния акта
      var marq = null;
      genCrop(GEN + 'marquee.png', [0.054, 0.272, 0.946, 0.732], function (c) {
        marq = new T.MeshBasicMaterial({ map: c, color: 0x555555, toneMapped: false });
        var mq = new T.Mesh(new T.PlaneGeometry(cw2 - 0.15, (cw2 - 0.15) / 3.45), marq); mq.position.set(0, 2.42 + (cw2 - 0.15) / 3.45 / 2, cz + 0.72); inner.add(mq);
        boardShapes.forEach(function (m) { m.visible = false; }); tBulbs.im.visible = false;
        res.marq = marq;
      });
      // вертикальная неоновая вывеска на фасаде башни со стороны бульвара (чёрная подложка + аддитивный неон)
      var side = v % 2 ? 1 : -1, sw = 1.2, sh = 2.9;
      var signBack = new T.Mesh(rbox(sw + 0.18, sh + 0.2, 0.1, 0.06), lacquer); signBack.position.set(side * 1.42, th * 0.5, td / 2 + 0.2); signBack.visible = false; tower.add(signBack);
      genCrop(GEN + 'neon-signs.png', SIGN_UV[SIGN_OF[v]], function (c) {
        var sm = new T.MeshBasicMaterial({ map: c, color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
        sm.userData.base = new T.Color(1.15, 1.15, 1.15); neonList.push(sm);
        var s = new T.Mesh(new T.PlaneGeometry(sw, sh), sm); s.position.set(side * 1.42, th * 0.5 + sh / 2 + 0.1, td / 2 + 0.27); tower.add(s);
        signBack.visible = true;
      });
      // вертикальное лезвие-вывеска на углу к дороге: чёрный лак, неон по контуру и знаки на обеих сторонах
      var bh = ph + 4.2, bx = w / 2 + 0.35;
      var blade = new T.Mesh(rbox(0.32, bh, 1.5, 0.1), lacquer); blade.position.set(bx, 1.4, fz - 0.6); inner.add(blade);
      [1, -1].forEach(function (s2) {
        var x = bx + s2 * 0.19;
        neon(inner, [V(x, 1.55, fz - 1.3), V(x, 1.4 + bh - 0.15, fz - 1.3), V(x, 1.4 + bh - 0.15, fz + 0.1), V(x, 1.55, fz + 0.1)], col, true, 0.04, neonList);
        ['star', 'diamond', 'arrow', 'diamond'].forEach(function (nm, j) {
          shapeOn(inner, nm, 0.42, function (u, vv) { return V(x, 1.4 + bh - 1.0 - j * 1.75 + vv, fz - 0.6 + u * s2); }, j % 2 ? C.white : col, neonList);
        });
      });
      // скульптура на крыше подиума
      var sglow = [];
      var sc = sculpture(v, sglow); sc.position.set(-w / 2 + 1.25, ph + 0.28, d / 2 - 0.9); inner.add(sc);
      // тёплый свет из входа на тротуар
      var spill = k.glow(C.warm, 5.5); spill.position.set(0, 0.5, cz + 1.4); spill.material.opacity = 0; inner.add(spill);
      setNeon(neonList, 0.1);
      var res = { g: g, inner: inner, neonList: neonList, winMats: winMats, door: doorMat, spill: spill, sglow: sglow, mBulbs: mBulbs, tBulbs: tBulbs, marq: marq, lit: 0, ready: 0, hover: 0, labY: 2.9, labZ: d / 2 + 2.3 };
      return res;
    }

    // ---------- театр Арлекины (акт VI, финал): герой кадра ----------
    var harlTex = k.tex(256, 256, function (g, w, h) {
      var n = 6, cw = w / n, ch = h / 4;
      for (var r = -1; r < 5; r++) for (var c = -1; c <= n; c++) {
        var x = c * cw + (r % 2 ? cw / 2 : 0), y = r * ch;
        var gr = g.createLinearGradient(x, y, x + cw, y + ch);
        if ((r + c) % 2) { gr.addColorStop(0, '#d8142e'); gr.addColorStop(1, '#7a0616'); } else { gr.addColorStop(0, '#1a1024'); gr.addColorStop(1, '#06030a'); }
        g.fillStyle = gr; g.beginPath(); g.moveTo(x + cw / 2, y); g.lineTo(x + cw, y + ch / 2); g.lineTo(x + cw / 2, y + ch); g.lineTo(x, y + ch / 2); g.closePath(); g.fill();
        g.strokeStyle = '#e8c060'; g.lineWidth = 2.5; g.stroke();
      }
    }, HQ);
    harlTex.wrapS = harlTex.wrapT = T.RepeatWrapping; harlTex.repeat.set(3, 1.6);
    var velvet = k.tex(64, 512, function (g, W, H) {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a020c'); gr.addColorStop(0.18, '#b0102a'); gr.addColorStop(0.75, '#8a0a20'); gr.addColorStop(1, '#2a0208');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 400; i++) { g.fillStyle = 'rgba(255,255,255,.02)'; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    });
    var marbleTex = k.tex(128, 512, function (g, W, H) {
      g.fillStyle = '#e4e0d8'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 14; i++) { g.strokeStyle = 'rgba(120,128,140,' + rnd(0.15, 0.4).toFixed(2) + ')'; g.lineWidth = rnd(0.6, 2); g.beginPath(); var x = Math.random() * W, y = 0; g.moveTo(x, y); while (y < H) { x += rnd(-12, 12); y += rnd(10, 30); g.lineTo(x, y); } g.stroke(); }
    }, HQ);
    var marble = new T.MeshStandardMaterial({ map: marbleTex, color: 0xb8bcc4, metalness: 0.1, roughness: 0.16, envMapIntensity: 1.1 });

    function theatre() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var w = 15, h = 8.2, d = 6.5, neonList = [];
      var harlMat = new T.MeshStandardMaterial({ map: harlTex, emissive: 0xffffff, emissiveMap: harlTex, emissiveIntensity: 0.12, roughness: 0.25, metalness: 0.35, envMapIntensity: 1.1 });
      // бархатные ромбы из Flow: по Y шов с размытием (верх ~20% картинки) → берём только чистую полосу без повтора по Y, по X тайл
      k.image(GEN + 'harlequin-diamonds.jpg', function (t) {
        var c = t.clone(); c.needsUpdate = true; c.wrapS = T.RepeatWrapping; c.wrapT = T.ClampToEdgeWrapping; c.anisotropy = k.aniso;
        c.repeat.set(1.42, 0.74); c.offset.set(0, 0.05);
        harlMat.map = c; harlMat.emissiveMap = c; harlMat.roughness = 0.55; harlMat.metalness = 0.15; harlMat.needsUpdate = true;
      });
      inner.add(new T.Mesh(rbox(w, h, d, 0.25), lacquer));
      var front = new T.Mesh(new T.PlaneGeometry(w - 0.6, h - 0.6), harlMat); front.position.set(0, h / 2, d / 2 + 0.02); inner.add(front);
      var cornice = new T.Mesh(rbox(w + 0.6, 0.45, d + 0.6, 0.15), gold); cornice.position.y = h; inner.add(cornice);
      var plinth = new T.Mesh(rbox(w + 0.4, 0.5, d + 0.4, 0.12), gold); inner.add(plinth);
      // портал-арка: золотая рама с аркой, внутри бархатный занавес со складками
      var fz = d / 2 + 0.05, aw = 3.1, ah = 4.0, ar = 3.1, fw = 0.55;
      var outer = new T.Shape(); outer.moveTo(-aw - fw, 0); outer.lineTo(-aw - fw, ah); outer.absarc(0, ah, ar + fw, Math.PI, 0, true); outer.lineTo(aw + fw, 0); outer.lineTo(-aw - fw, 0);
      var hole = new T.Path(); hole.moveTo(-aw, 0); hole.lineTo(aw, 0); hole.lineTo(aw, ah); hole.absarc(0, ah, ar, 0, Math.PI, false); hole.lineTo(-aw, 0); outer.holes.push(hole);
      var arch = new T.Mesh(new T.ExtrudeGeometry(outer, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 40 }), gold);
      arch.position.set(0, 0.5, fz); inner.add(arch);
      var cgeo = new T.PlaneGeometry(aw * 2 + 0.2, ah + ar + 0.2, 90, 6), pos = cgeo.attributes.position;
      for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), y = pos.getY(i), deep = 0.75 + 0.25 * (1 - (y + 3.6) / 7.2); pos.setZ(i, (Math.sin(x * 6.2) * 0.2 + Math.sin(x * 14.7 + 1.3) * 0.06) * deep); }
      cgeo.computeVertexNormals();
      var curtainMat = new T.MeshStandardMaterial({ map: velvet, roughness: 0.8, metalness: 0.05, emissive: C.red, emissiveIntensity: 0.04, side: T.DoubleSide });
      genTile(GEN + 'velvet-red.jpg', function (c) { c.repeat.set(2.4, 1.2); curtainMat.map = c; curtainMat.needsUpdate = true; });
      var curtain = new T.Mesh(cgeo, curtainMat); curtain.position.set(0, 0.5 + (ah + ar) / 2, fz - 0.15); inner.add(curtain);
      // лампы по внутренней кромке арки
      var apts = [];
      for (var q = 0; q <= 10; q++) apts.push(V(-aw - 0.2, 0.9 + q * (ah - 0.4) / 10, fz + 0.5));
      for (var q2 = 1; q2 < 30; q2++) { var an = Math.PI - q2 / 30 * Math.PI; apts.push(V(Math.cos(an) * (ar + 0.2), 0.5 + ah + Math.sin(an) * (ar + 0.2), fz + 0.5)); }
      for (var q3 = 10; q3 >= 0; q3--) apts.push(V(aw + 0.2, 0.9 + q3 * (ah - 0.4) / 10, fz + 0.5));
      var archBulbs = bulbs(inner, apts, C.bulb);
      // ступени и красная дорожка
      for (var st = 0; st < 3; st++) { var step = new T.Mesh(rbox(9 - st * 0.8, 0.22, 1.2, 0.06), marble); step.position.set(0, st * 0.22, fz + 2.4 - st * 0.7); inner.add(step); }
      var carpet = new T.Mesh(new T.PlaneGeometry(2.6, 6), new T.MeshStandardMaterial({ color: 0x9a0a20, roughness: 0.75 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.012, fz + 5.2); inner.add(carpet);
      // барабан и луковичный купол с золотыми рёбрами
      var drum = new T.Mesh(new T.CylinderGeometry(3.2, 3.3, 1.3, 48), lacquer); drum.position.y = h + 0.45 + 0.65; inner.add(drum);
      var drumBand = new T.Mesh(new T.TorusGeometry(3.25, 0.08, 8, 64), gold); drumBand.rotation.x = Math.PI / 2; drumBand.position.y = h + 1.75; inner.add(drumBand);
      var dpts = []; for (var dq = 0; dq < 40; dq++) { var da = dq / 40 * Math.PI * 2; dpts.push(V(Math.cos(da) * 3.28, h + 1.1, Math.sin(da) * 3.28)); }
      var drumBulbs = bulbs(inner, dpts, C.bulb);
      var prof = [[3.1, 0], [3.2, 0.4], [3.1, 1.3], [2.6, 2.2], [1.85, 2.9], [1.05, 3.5], [0.5, 4.1], [0.22, 4.7], [0, 5.0]];
      var domeMat = new T.MeshStandardMaterial({ color: 0x8a0a1e, metalness: 0.55, roughness: 0.22, envMapIntensity: 1.3 });
      var dome = new T.Mesh(new T.LatheGeometry(prof.map(function (p) { return new T.Vector2(p[0], p[1]); }), 64), domeMat); dome.position.y = h + 1.8; inner.add(dome);
      for (var rb = 0; rb < 12; rb++) {
        var ra = rb / 12 * Math.PI * 2;
        var curve = new T.CatmullRomCurve3(prof.map(function (p) { return V(Math.cos(ra) * (p[0] + 0.03), h + 1.8 + p[1], Math.sin(ra) * (p[0] + 0.03)); }));
        inner.add(new T.Mesh(new T.TubeGeometry(curve, 40, 0.06, 6, false), gold));
      }
      var finial = new T.Mesh(new T.LatheGeometry([[0, 0], [0.3, 0.1], [0.38, 0.4], [0.12, 0.7], [0.14, 1.0], [0, 1.6]].map(function (p) { return new T.Vector2(p[0], p[1]); }), 24), gold); finial.position.y = h + 6.8; inner.add(finial);
      // мачта и полуночный зеркальный шар
      var mast = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 4.2, 12), chrome); mast.position.y = h + 8.4 + 2.1; inner.add(mast);
      var ballMat = new T.MeshStandardMaterial({ color: 0xe8f6ff, metalness: 1, roughness: 0.08, flatShading: true, envMapIntensity: 2.2, emissive: C.cy, emissiveIntensity: 0.12 });
      var ball = new T.Mesh(new T.IcosahedronGeometry(1.25, 3), ballMat); ball.position.y = h + 13.4; inner.add(ball);
      var ballGlow = k.glow(C.cy, 7); ballGlow.position.copy(ball.position); ballGlow.material.opacity = 0.3; inner.add(ballGlow);
      // две белые мраморные колонны с неоновыми кольцами (как колоннада зала Vegas в WH) и звёздами-навершиями
      var stars = [];
      [-1, 1].forEach(function (sd) {
        var cx = sd * (w / 2 + 1.1), colH = 12.5;
        var colm = new T.Mesh(new T.CylinderGeometry(0.75, 0.85, colH, 40), marble); colm.position.set(cx, colH / 2, 1.2); inner.add(colm);
        var cap = new T.Mesh(new T.LatheGeometry([[0, 0], [0.9, 0], [1.15, 0.25], [1.2, 0.5], [0, 0.5]].map(function (p) { return new T.Vector2(p[0], p[1]); }), 40), gold); cap.position.set(cx, colH, 1.2); inner.add(cap);
        var base2 = new T.Mesh(new T.CylinderGeometry(1.1, 1.2, 0.5, 40), gold); base2.position.set(cx, 0.25, 1.2); inner.add(base2);
        [2.8, 5.8, 8.8, 11.4].forEach(function (y, j) { var rg = neonRing(inner, 0.86, 0.05, (j + (sd > 0 ? 1 : 0)) % 2 ? C.red : C.cy, neonList); rg.rotation.x = Math.PI / 2; rg.position.set(cx, y, 1.2); });
        var sp2 = new T.Group(); sp2.position.set(cx, colH + 1.6, 1.2); inner.add(sp2);
        shapeOn(sp2, 'star4', 0.95, function (u, vv) { return V(u, vv, 0); }, sd < 0 ? C.cy : C.red, neonList);
        var sgw = k.glow(sd < 0 ? C.cy : C.red, 4.5); sp2.add(sgw); stars.push({ g: sp2, gl: sgw });
      });
      // неоновые линии по фасаду: золото-белая окантовка карниза и ромбы над порталом
      neon(inner, [V(-w / 2 + 0.2, h - 0.25, d / 2 + 0.08), V(w / 2 - 0.2, h - 0.25, d / 2 + 0.08)], C.white, false, 0.05, neonList);
      neon(inner, [V(-w / 2 + 0.2, 0.75, d / 2 + 0.08), V(w / 2 - 0.2, 0.75, d / 2 + 0.08)], C.red, false, 0.05, neonList);
      [-5.6, -4.3, 4.3, 5.6].forEach(function (x, j) { shapeOn(inner, j % 3 ? 'diamond' : 'star', 0.5, function (u, vv) { return V(x + u, 5.6 + vv, d / 2 + 0.1); }, j % 2 ? C.cy : C.red, neonList); });
      // прожекторы в небо (как за бульваром в зале WH)
      var bt = k.tex(64, 256, function (g2, W, H) { var gr = g2.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, W, H); });
      var beams = [];
      [-1, 1].forEach(function (sd) {
        var geo = new T.CylinderGeometry(2.8, 0.2, 40, 24, 1, true); geo.translate(0, 20, 0);
        var m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: bt, color: sd < 0 ? 0x9fe8ff : 0xff8a94, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
        m.position.set(sd * 5.5, h, -1); inner.add(m); beams.push({ m: m, sd: sd });
      });
      var spill = k.glow(C.warm, 9); spill.position.set(0, 1.2, fz + 2.2); spill.material.opacity = 0; inner.add(spill);
      setNeon(neonList, 0.25);
      return { g: g, inner: inner, final: true, neonList: neonList, harl: harlMat, curtain: curtainMat, archBulbs: archBulbs, drumBulbs: drumBulbs, ball: ball, ballMat: ballMat, ballGlow: ballGlow, ballY: ball.position.y, beams: beams, stars: stars, spill: spill, lit: 0, ready: 0, hover: 0, labY: ah + ar + 1.6, labZ: d / 2 + 1.0 };
    }

    // ---------- пальмы: изогнутый ствол с кольцами коры, перистые листья-текстуры, подсветка снизу ----------
    var frondTex = k.tex(128, 512, function (g, W, H) {
      g.clearRect(0, 0, W, H);
      var gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#0d4a2a'); gr.addColorStop(1, '#2fae62');
      g.strokeStyle = gr; g.fillStyle = gr; g.lineCap = 'round';
      g.lineWidth = 6; g.beginPath(); g.moveTo(W / 2, H); g.lineTo(W / 2, 6); g.stroke();
      for (var y = H - 20; y > 14; y -= 9) {
        var t = 1 - y / H, len = (W / 2 - 4) * Math.sin(Math.min(1, (1 - t) * 1.25) * Math.PI * 0.55 + 0.25);
        g.lineWidth = 4.5;
        g.beginPath(); g.moveTo(W / 2, y); g.quadraticCurveTo(W / 2 - len * 0.6, y - 4, W / 2 - len, y + 14); g.stroke();
        g.beginPath(); g.moveTo(W / 2, y); g.quadraticCurveTo(W / 2 + len * 0.6, y - 4, W / 2 + len, y + 14); g.stroke();
      }
    }, HQ);
    var frondMat = new T.MeshStandardMaterial({ map: frondTex, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.55, metalness: 0.05, color: 0xcfe8d8 });
    var frondGeo = new T.PlaneGeometry(1.15, 3.6, 1, 12); frondGeo.translate(0, 1.8, 0);
    (function () { var p = frondGeo.attributes.position; for (var i = 0; i < p.count; i++) { var y = p.getY(i); p.setZ(i, 0.11 * y * y); } frondGeo.computeVertexNormals(); })();
    var barkMat = new T.MeshStandardMaterial({ color: 0x7a5636, roughness: 0.8, metalness: 0.05 });
    function palm(x, z, s, ringCol) {
      var g = new T.Group(), lean = rnd(-0.35, 0.35);
      var curve = new T.CatmullRomCurve3([V(0, 0, 0), V(lean * 0.3, 2.2, 0), V(lean * 0.9, 4.4, 0), V(lean * 1.6, 6.2, 0)]);
      g.add(new T.Mesh(new T.TubeGeometry(curve, 24, 0.17, 10, false), barkMat));
      for (var r = 0; r < 11; r++) { var p = curve.getPointAt(r / 11 + 0.02); var ring = new T.Mesh(new T.TorusGeometry(0.19 - r * 0.004, 0.035, 6, 16), barkMat); ring.position.copy(p); ring.rotation.x = Math.PI / 2; g.add(ring); }
      var top = curve.getPointAt(1);
      for (var l = 0; l < 10; l++) {
        var f = new T.Mesh(frondGeo, frondMat); f.position.copy(top); f.rotation.order = 'YXZ';
        f.rotation.y = l / 10 * Math.PI * 2 + rnd(-0.15, 0.15); f.rotation.x = rnd(0.55, 1.15); f.scale.setScalar(rnd(0.85, 1.1)); g.add(f);
      }
      var nut = new T.Mesh(new T.SphereGeometry(0.28, 12, 10), barkMat); nut.position.copy(top); g.add(nut);
      neonRing(g, 0.32, 0.04, ringCol, []).rotation.x = Math.PI / 2;
      g.children[g.children.length - 1].position.set(0, 0.12, 0);
      var up = k.glow(ringCol, 3.2); up.position.set(lean * 0.3, 1.2, 0); up.material.opacity = 0.35; g.add(up);
      g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
    }
    [6, 0, -6, -12, -18, -24].forEach(function (z, i) { palm(-4.9, z - 0.6, 1.0, i % 2 ? C.cy : C.red); palm(4.9, z + 0.6, 1.0, i % 2 ? C.red : C.cy); });

    // ---------- конфетти (вместо снега: Вегас, канун НГ) ----------
    [[C.red, 0], [C.cy, 1], [C.bulb, 2]].forEach(function (q) { k.snow({ n: 120, area: [30, 16, 46], center: [0, 0, -10], speed: 0.5, size: 0.14, color: q[0], opacity: 0.9 }); });

    // ---------- площадка с ракетой ----------
    var pad = new T.Group(); pad.position.set(0, 0, 6.2); pad.scale.setScalar(0.85); scene.add(pad);
    var padProf = [[0, 0], [2.1, 0], [2.2, 0.12], [2.0, 0.26], [1.65, 0.3], [1.55, 0.48], [0, 0.48]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    pad.add(new T.Mesh(new T.LatheGeometry(padProf, 64), chrome));
    var padTop = new T.Mesh(new T.CircleGeometry(1.55, 48), lacquer); padTop.rotation.x = -Math.PI / 2; padTop.position.y = 0.481; pad.add(padTop);
    var padNeon = neonRing(pad, 2.16, 0.045, C.cy, []); padNeon.rotation.x = Math.PI / 2; padNeon.position.y = 0.14;
    var ppts = []; for (var pb = 0; pb < 28; pb++) { var aa = pb / 28 * Math.PI * 2; ppts.push(V(Math.cos(aa) * 1.82, 0.31, Math.sin(aa) * 1.82)); }
    var padBulbs = bulbs(pad, ppts, C.bulb);
    var rocket = new T.Group(); rocket.position.y = 0.48; pad.add(rocket);
    var rkMat = new T.MeshPhysicalMaterial({ color: C.red, metalness: 0.35, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5 });
    var rprof = [[0, 0], [0.34, 0], [0.44, 0.15], [0.52, 0.6], [0.54, 1.4], [0.52, 2.0], [0.44, 2.5], [0.3, 2.95], [0.13, 3.3], [0, 3.45]].map(function (p) { return new T.Vector2(p[0], p[1]); });
    var rBody = new T.Mesh(new T.LatheGeometry(rprof, 48), rkMat); rBody.position.y = 0.35; rocket.add(rBody);
    var rBand = new T.Mesh(new T.TorusGeometry(0.535, 0.05, 10, 48), gold); rBand.rotation.x = Math.PI / 2; rBand.position.y = 0.35 + 2.0; rocket.add(rBand);
    var rBand2 = new T.Mesh(new T.TorusGeometry(0.5, 0.04, 10, 48), gold); rBand2.rotation.x = Math.PI / 2; rBand2.position.y = 0.35 + 0.6; rocket.add(rBand2);
    var port = new T.Mesh(new T.TorusGeometry(0.17, 0.035, 10, 32), gold); port.position.set(0, 0.35 + 1.55, 0.53); rocket.add(port);
    var portGlass = new T.Mesh(new T.CircleGeometry(0.15, 24), new T.MeshBasicMaterial({ color: new T.Color(C.cy).multiplyScalar(1.1) })); portGlass.position.set(0, 0.35 + 1.55, 0.54); rocket.add(portGlass);
    var tip = new T.Mesh(new T.SphereGeometry(0.08, 12, 10), gold); tip.position.y = 0.35 + 3.45; rocket.add(tip);
    var finShape = new T.Shape(); finShape.moveTo(0, 0); finShape.lineTo(0.55, -0.3); finShape.quadraticCurveTo(0.68, 0.2, 0.5, 0.45); finShape.lineTo(0.05, 1.0); finShape.lineTo(0, 1.0); finShape.lineTo(0, 0);
    var finGeo = new T.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }); finGeo.translate(0, 0, -0.025);
    for (var f = 0; f < 4; f++) { var fin = new T.Mesh(finGeo, gold); var fa = f / 4 * Math.PI * 2 + Math.PI / 4; fin.position.set(Math.sin(fa) * 0.46, 0.35, Math.cos(fa) * 0.46); fin.rotation.y = fa - Math.PI / 2; rocket.add(fin); }
    var exhaust = k.flame([[0.8, 0.15, 0.05], [1.0, 0.6, 0.15], [1.0, 0.96, 0.75]], 0);
    exhaust.rotation.z = Math.PI; exhaust.scale.set(0.9, 2.2, 1); exhaust.position.y = 0.4; rocket.add(exhaust);
    var rGlow = k.glow(C.red, 3.4); rGlow.position.y = 1.8; rocket.add(rGlow);
    var trail = [];
    for (var tr = 0; tr < 12; tr++) { var tg = k.glow(tr % 2 ? C.bulb : 0xfff3b0, 1.3); tg.material.opacity = 0; scene.add(tg); trail.push(tg); }
    var bursts = [];
    S.rocketLab = k.label(rocket, [0, 4.5, 0], '');

    // ---------- персонажи (настоящие PNG бренда) ----------
    // новогодние позы из Flow (жест вверх к ракете / скипетр в небо); нет файла — прежние PNG
    var mag = board(GEN + 'magician-up.png', '../../vegasway/assets/magician.png', 4.2); mag.position.set(-3.6, 0, 7.6); scene.add(mag);
    var harl = board(GEN + 'harlequin-up.png', '../../vegasway/assets/harlequin.png', 3.9); harl.position.set(3.7, 0, 7.4); scene.add(harl);
    var magGlow = k.glow(C.cy, 6); magGlow.position.set(-3.6, 2.2, 6.8); magGlow.material.opacity = 0.22; scene.add(magGlow);
    var harlGlow = k.glow(C.red, 6); harlGlow.position.set(3.7, 2.1, 6.6); harlGlow.material.opacity = 0.24; scene.add(harlGlow);

    var PHONE_DY = { 1: 0, 2: 0, 3: -0.5, 4: -0.5, 5: 1.0, 6: 0 };
    S.labPos = function (o) {
      var ph = S.frame ? Math.max(0, Math.min(1, (0.75 - (S.aspect || 1)) / 0.25)) : 0; // 0 — шире 0.75, 1 — телефон 0.5
      o.anchor.position.set(0, o.labY + PHONE_DY[o.act] * ph, o.labZ + (o.final ? 0 : 2.6 * ph));
    };
    S.place = function (a) {
      var o = S.venues[a.act];
      if (!o) {
        o = a.act === 6 ? theatre() : venue(a.act);
        var sp3 = SPOTS[a.act];
        o.g.position.set(sp3[0], 0, sp3[1]); o.g.rotation.y = sp3[2];
        if (o.final) o.g.scale.setScalar(1.18); // театр — герой кадра в конце бульвара
        scene.add(o.g);
        var open = function () { if (S.onOpen && o.canOpen) S.onOpen(a.act); };
        // подпись на якоре: на телефоне якорь уезжает к центру улицы и разносится по высоте (AG 18.11: ACT I за краем, V на III)
        o.anchor = new T.Object3D(); o.g.add(o.anchor); o.act = a.act; S.labPos(o);
        o.lab = k.label(o.anchor, [0, 0, 0], '', open);
        k.pick(o.g, open, function (on) { o.hover = on && o.canOpen ? 1 : 0; });
        S.venues[a.act] = o;
      }
      return o;
    };

    S.setRocket = function (tier, total) {
      var T0 = tier ? TIER[tier.id] : null;
      var col = T0 ? T0.c : 0x8a96a8; // без уровня — серебристый силуэт, не призрак
      rkMat.color.setHex(col);
      rkMat.metalness = T0 ? 0.35 : 0.9; rkMat.roughness = T0 ? 0.18 : 0.3;
      rGlow.material.color.setHex(col); rGlow.material.opacity = T0 ? 0.4 : 0.1;
      S.rocketScale = T0 ? T0.s : 0.6;
      S.rocketLab.set((tier ? tier.name : 'Your rocket') + '<small>' + total + ' of 54 points</small>');
    };

    S.launch = function () { S.launchT = 0; };

    // ---------- анимация ----------
    var tmpV = new T.Vector3();
    k.onFrame(function (t, dt) {
      if (!(dt > 0)) dt = 0;
      var flash = S.launchT >= 0 && S.launchT < 4 ? 0.5 + 0.5 * Math.sin(t * 18) : 0;
      Object.keys(S.venues).forEach(function (id) {
        var o = S.venues[id], n = Number(id);
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        var r = o.ready ? 0.5 + 0.5 * Math.sin(t * 3.2 + n) : 0;
        var hv = o.hover * 0.03; o.inner.scale.x += (1 + hv - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        // марки: сыграно — бегущие огни; открыто — мигают через одну; закрыто — еле тлеют
        var bulbFn = function (i) {
          var on;
          if (o.lit > 0.5) on = 0.35 + 0.65 * ((((i - t * 10) % 4) + 4) % 4 < 2 ? 1 : 0);
          else if (o.ready) on = (i % 2 ? r : 1 - r) * 0.85;
          else on = 0.06;
          return Math.max(on, flash) * 1.5;
        };
        var neonLvl = Math.max(o.lit * (1.25 + 0.06 * Math.sin(t * 40 + n)), o.ready ? 0.35 + r * 0.45 : o.final ? 0.3 : 0.1);
        setNeon(o.neonList, neonLvl);
        o.spill.material.opacity = o.lit * 0.5 + r * 0.18;
        if (o.final) {
          lightBulbs(o.archBulbs, bulbFn); lightBulbs(o.drumBulbs, function (i) { return bulbFn(i + 1) * 0.9; });
          o.harl.emissiveIntensity = 0.12 + o.lit * 0.22;
          o.curtain.emissiveIntensity = 0.04 + o.lit * 0.25 + r * 0.12;
          o.beams.forEach(function (B) { B.m.rotation.z = B.sd * (0.28 + Math.sin(t * 0.35 + B.sd) * 0.18); B.m.rotation.x = -0.12 + Math.sin(t * 0.27 + B.sd * 2) * 0.06; B.m.material.opacity = 0.12 + o.lit * 0.16; });
          o.stars.forEach(function (s, j) { s.g.rotation.y = t * 0.6 + j; s.gl.material.opacity = 0.2 + neonLvl * 0.35; });
          o.ballMat.emissiveIntensity = 0.12 + o.lit * 0.5 + 0.15 * Math.sin(t * 2);
          o.ball.rotation.y = t * 0.4;
        } else {
          lightBulbs(o.mBulbs, bulbFn); lightBulbs(o.tBulbs, function (i) { return bulbFn(i + 2); });
          o.winMats.forEach(function (m) { m.emissiveIntensity = 0.22 + o.lit * 0.85 + r * 0.15; });
          o.door.emissiveIntensity = 0.2 + o.lit * 1.2 + r * 0.5;
          o.sglow.forEach(function (sg2) { sg2.core.color.copy(sg2.base).multiplyScalar(0.4 + o.lit * 1.0); });
          if (o.marq) o.marq.color.setScalar(Math.max(0.32 + o.lit * 0.68 + r * 0.25, flash * 0.9));
        }
      });
      // площадка и ракета
      lightBulbs(padBulbs, function (i) { return (0.35 + 0.65 * (((i + t * 7) % 28) < 7 ? 1 : 0.25)) * 1.4; });
      var sTarget = S.rocketScale || 0.6;
      rocket.scale.x += (sTarget - rocket.scale.x) * Math.min(1, dt * 3); rocket.scale.y = rocket.scale.z = rocket.scale.x;
      var ex = exhaust.material.uniforms.uI;
      if (S.launchT >= 0) {
        S.launchT += dt;
        var L = S.launchT;
        if (L < 0.8) { rocket.position.y = 0.48 + Math.sin(L * 60) * 0.03; ex.value = L / 0.8 * 0.9; }
        else if (L < 4.2) { var u = L - 0.8; rocket.position.y = 0.48 + u * u * 4.2; ex.value = 1.2; exhaust.scale.y = 2.4 + Math.sin(t * 40) * 0.3; }
        if (L >= 0.8 && L < 4.2) { rocket.getWorldPosition(tmpV); var tg2 = trail[Math.floor(L * 20) % trail.length]; tg2.position.copy(tmpV); tg2.material.opacity = 0.9; }
        if (L >= 4.2 && !S.burst) { S.burst = true; rocket.visible = false; rocket.getWorldPosition(tmpV); burst(tmpV); }
        if (L > 9) { S.launchT = -1; S.burst = false; rocket.visible = true; rocket.position.y = 0.48; ex.value = 0; }
        var th = S.venues[6]; if (th) th.ball.position.y = th.ballY - Math.min(1, L / 3.5) * 3.4;
      } else {
        var th2 = S.venues[6]; if (th2) th2.ball.position.y += (th2.ballY - th2.ball.position.y) * Math.min(1, dt);
        rocket.position.y = 0.48 + Math.sin(t * 1.3) * 0.05; ex.value = 0;
        rocket.rotation.y = t * 0.25;
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
      for (var i2 = 0; i2 < 80; i2++) {
        var s = k.glow(cols[i2 % cols.length], 0.9 + Math.random() * 0.6); s.position.copy(at);
        var v = new T.Vector3(Math.random() - 0.5, Math.random() - 0.4, Math.random() - 0.5).normalize().multiplyScalar(7 + Math.random() * 5);
        scene.add(s); bursts.push({ s: s, v: v, life: 2.4 });
      }
    }

    S.k = k;
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F; S.aspect = w / h;
      k.camera.fov = F.fov; k.camera.zoom = F.t > 0 ? F.zoom : 1;
      mag.scale.setScalar(1 + 0.3 * F.t); harl.scale.setScalar(1 + 0.3 * F.t); // на телефоне ведущие крупнее
      // узкий телефон: ведущие ближе к ракете, иначе их режут края кадра (AG 18.11)
      var ph = Math.max(0, Math.min(1, (0.75 - w / h) / 0.25));
      mag.position.x = -3.6 + 1.7 * ph; harl.position.x = 3.7 - 1.3 * ph; // у Мага поза с поднятой рукой шире — сдвиг больше
      magGlow.position.x = mag.position.x; harlGlow.position.x = harl.position.x;
      Object.keys(S.venues).forEach(function (id) { if (S.venues[id].anchor) S.labPos(S.venues[id]); });
      k.camera.updateProjectionMatrix();
      if (changed) k.look(F.pos, F.look, S.looked ? 0.5 : 0); // первый раз — сразу в кадр (ядро: look(..., 0))
      S.looked = true;
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
