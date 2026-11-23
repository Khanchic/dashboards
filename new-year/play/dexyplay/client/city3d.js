/**
 * 3D-улица Tag the City (DexyPlay, Dexy's Holiday Stream) — ПРЕМИУМ на ядре _3d/ny3d.js (конвейер зала Witching Hours:
 * bloom, мокрая улица-зеркало, нарисованный задник, неоновые трубки). Тот же интерфейс, что у 2D city.js:
 *   TagCity3D.render(el, walls, { current, onOpen(id, wall) })   — первый вызов строит сцену, дальше только обновляет
 *   TagCity3D.flick(el, id)                                       — стену только что расписали: неон проявляется, брызги краски
 *   TagCity3D.supported()                                         — есть ли WebGL (иначе страница рисует 2D TagCity)
 * Сюжет: город посерел, у Dexy баллончики. Ночная улица мегаполиса в снегу, по сторонам кирпичные дома с пожарными
 * лестницами и баками на крышах, на фасаде каждого — стена-холст с сеткой головоломки. Расписанная стена горит неоновой
 * пиксель-картинкой (та, что игрок решил), дом возвращает цвет, неон по карнизу и окна загораются. Через улицу гирлянды
 * (по одной на каждые 2 стены), в конце — большой дом с муралом под прожекторами, за ним город: чем больше стен, тем больше
 * окон горит. Dexy стоит у текущей стены. Вывески — только абстрактные формы, без букв и цифр.
 */
(function () {
  'use strict';
  var NEON = { pink: 0xf939e3, yellow: 0xffe733, green: 0x33ff8f };
  var NEON_CSS = { pink: '#F939E3', yellow: '#FFE733', green: '#33FF8F' };
  var WALL_NEON = { practice: 'pink', w1: 'pink', w2: 'yellow', w3: 'green', w4: 'yellow', w5: 'green', w6: 'pink', mural: 'yellow' };
  var C = { pink: 0xf939e3, purple: 0x7645ba, teal: 0x2ee6ff, warm: 0xffc98a, yellow: 0xffe733, green: 0x33ff8f };
  // кирпич домов: насыщенные цвета бренда; нерасписанный дом — приглушённый серо-лиловый
  var BRICKS = [0x8a3ac8, 0xc23a86, 0x3a4ec8, 0x24a0b0, 0xa23ac8, 0xd04a62, 0x4a3ac8, 0x9a3ab0];
  // места: [x, z, поворот] — слева практика и чётные стены, справа нечётные, мурал в конце улицы
  var SPOTS = { practice: [-6.9, 4.6, 0.85], w1: [6.9, 0.4, -0.85], w2: [-6.9, -4.6, 0.85], w3: [6.9, -9.6, -0.85], w4: [-6.9, -14.6, 0.85], w5: [6.9, -19.6, -0.85], w6: [-6.9, -24.6, 0.85], mural: [0, -33, 0] };
  // три опорных кадра: широкий (≥1.6) → квадрат (1.0) → телефон (≤0.6); камера низко, улица уходит вглубь к муралу
  // взгляд ниже (AG 18.11): Dexy и Practice не прилипают к нижней кромке, на 1440×900 видны в первом экране
  var CAM = { pos: [0, 7.0, 23.5], look: [0, 2.6, -18] };
  var CAM_SQ = { pos: [0, 8.6, 26], look: [0, 2.5, -16] };
  var CAM_TALL = { pos: [0, 10.8, 25], look: [0, 4.2, -15] };
  // для ?ny3d=lit без решённых стен — картинки из пулов (как у сервера)
  var DEMO = {
    practice: ['.#.#.', '#####', '#####', '.###.', '..#..'],
    w1: ['.#.#.', '..#..', '#####', '#.#.#', '#####'],
    w2: ['..###.', '.##.##', '.#...#', '.##...', '.#....', '.##...'],
    w3: ['...#...', '..###..', '.#####.', '..###..', '.#####.', '#######', '...#...'],
    w4: ['...##...', '..####..', '.######.', '.######.', '.######.', '.######.', '########', '...##...'],
    w5: ['....#....', '..#.#.#..', '...###...', '.#..#..#.', '#########', '.#..#..#.', '...###...', '..#.#.#..', '....#....'],
    w6: ['....##....', '...#..#...', '....##....', '..######..', '.########.', '##########', '#..#..#..#', '##########', '.########.', '..######..'],
    mural: ['....##....', '...####...', '....##....', '...####...', '..######..', '...####...', '..######..', '.########.', '##########', '....##....', '##.####.##', '##.####.##'],
  };

  function frame(a) {
    var A = a >= 1 ? { p: CAM, q: CAM_SQ, s: Math.max(0, Math.min(1, (1.6 - a) / 0.6)), f0: 48, f1: 56 }
      : { p: CAM_SQ, q: CAM_TALL, s: Math.max(0, Math.min(1, (1.0 - a) / 0.4)), f0: 56, f1: 70 };
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * A.s; }); }
    var t = Math.max(0, Math.min(1, (1.6 - a) / 1.0));
    return { t: t, pos: mix(A.p.pos, A.q.pos), look: mix(A.p.look, A.q.look), fov: A.f0 + (A.f1 - A.f0) * A.s, zoom: Math.max(0.74, Math.min(1, a / 0.7)) };
  }
  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function css() {
    if (document.getElementById('c3d-css')) return;
    var s = document.createElement('style'); s.id = 'c3d-css';
    s.textContent =
      '.c3d{height:clamp(520px,86vh,980px);margin:0 0 16px;background:#0C0713;box-shadow:inset 0 0 0 1px rgba(118,69,186,.45),0 30px 80px rgba(0,0,0,.45)}' +
      '.c3d .ny3d-label{font:800 13px/1.05 "Kanit",system-ui,sans-serif;font-style:italic;text-transform:uppercase;letter-spacing:.02em;color:#fff;' +
        'background:rgba(22,12,36,.86);border:0;box-shadow:inset 0 0 0 1px rgba(118,69,186,.7);padding:6px 12px 7px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;' +
        'clip-path:polygon(6px 0,100% 0,calc(100% - 6px) 100%,0 100%);backdrop-filter:blur(4px)}' +
      '.c3d .ny3d-label small{font:400 11px/1 "Kanit",system-ui,sans-serif;font-style:normal;text-transform:none;letter-spacing:0;color:#C9BCDD}' +
      '.c3d .ny3d-label.tagged{box-shadow:inset 0 0 0 2px var(--n,#33FF8F)} .c3d .ny3d-label.tagged small{color:var(--n,#33FF8F)}' +
      '.c3d .ny3d-label.ready{box-shadow:inset 0 0 0 2px #7645BA} .c3d .ny3d-label.ready small{color:#fff}' +
      '.c3d .ny3d-label.locked{opacity:.6}' +
      '.c3d .ny3d-label.cur{background:#FFE733;color:#0C0713;box-shadow:none} .c3d .ny3d-label.cur small{color:#0C0713}' +
      '.c3d .ny3d-label:focus-visible{outline:2px solid #33FF8F;outline-offset:2px}' +
      '.c3d-live{position:absolute;left:14px;top:14px;z-index:2;display:flex;gap:8px;align-items:center;pointer-events:none;font:800 13px/1 "Kanit",system-ui,sans-serif;font-style:italic;text-transform:uppercase}' +
      '.c3d-live b{background:#F939E3;color:#fff;padding:6px 10px 6px 9px;clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%);letter-spacing:.05em}' +
      '.c3d-live b::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#fff;margin-right:6px;vertical-align:1px;animation:c3dblink 1.2s steps(2) infinite}' +
      '.c3d-live span{background:rgba(12,7,19,.78);color:#fff;padding:6px 10px;clip-path:polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)}' +
      '.c3d-live span i{font-style:normal;color:#33FF8F}' +
      '@keyframes c3dblink{50%{opacity:.25}}' +
      '@media (max-width:600px){.c3d .ny3d-label{font-size:11px;padding:4px 8px 5px}.c3d .ny3d-label small{font-size:10px}}' +
      '@media (prefers-reduced-motion:reduce){.c3d-live b::before{animation:none}}';
    document.head.appendChild(s);
  }

  function fmt(ms) { try { return new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function sub(w) {
    if (w.status === 'tagged') return w.tagged && w.tagged.name ? w.tagged.name : 'tagged';
    if (w.status === 'expired') return 'stream over';
    if (w.status === 'active') return w.size + ' · in progress';
    var c = w.can || { ok: true };
    if (c.ok) return w.size + (w.practice ? ' · no prize' : '');
    if (c.error === 'need_walls') return 'tag ' + c.need + ' more ' + (c.need === 1 ? 'wall' : 'walls');
    if (c.error === 'not_open' && c.opensAt) return 'opens ' + fmt(c.opensAt);
    if (c.error === 'closed') return 'stream over';
    return 'locked';
  }
  function dims(w) { var m = /(\d+)\D+(\d+)/.exec(w.size || ''); return m ? [+m[1], +m[2]] : [5, 5]; }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      premium: true, bg: 0x0a0516, fogExp: [0x14082a, 0.0145],
      env: [C.pink, C.purple, 0xfff3c0, 0x3a1060, 0x201030], // слева, справа, сверху, сзади, пол — как зал DexyPlay в WH
      cam: { pos: CAM.pos, look: CAM.look, fov: 48 }, fixedZoom: true, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, S = { k: k, walls: {}, litN: 0, t: 0, neonAll: [] };
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };
    var tmpC = new T.Color();

    // ---------- материалы ----------
    var iron = new T.MeshStandardMaterial({ color: 0x15101e, metalness: 0.8, roughness: 0.38, envMapIntensity: 1.1 });
    var chrome = new T.MeshStandardMaterial({ color: 0xd8dce8, metalness: 1, roughness: 0.18, envMapIntensity: 1.5 });
    var stone = new T.MeshStandardMaterial({ color: 0x4a4258, metalness: 0.05, roughness: 0.7 });
    var trim = new T.MeshStandardMaterial({ color: 0x2c2240, metalness: 0.2, roughness: 0.55, envMapIntensity: 0.8 });
    var snowMat = new T.MeshStandardMaterial({ color: 0xc8c0e8, roughness: 0.92, emissive: 0x2a2050, emissiveIntensity: 0.35 });
    var wood = new T.MeshStandardMaterial({ color: 0x5a3a2c, roughness: 0.85 });

    // ---------- конструкторы ----------
    // скруглённый блок с фасками: основание на y = 0, по центру x/z (как в strip3d.js)
    function rbox(w, h, d, r) {
      r = Math.min(r || 0.08, w / 2 - 0.01, h / 2 - 0.01);
      var b = Math.min(0.05, d / 4), s = new T.Shape(), x0 = -w / 2 + b, x1 = w / 2 - b, y0 = b, y1 = h - b, rr = Math.max(0.001, r - b);
      s.moveTo(x0 + rr, y0); s.lineTo(x1 - rr, y0); s.quadraticCurveTo(x1, y0, x1, y0 + rr); s.lineTo(x1, y1 - rr); s.quadraticCurveTo(x1, y1, x1 - rr, y1);
      s.lineTo(x0 + rr, y1); s.quadraticCurveTo(x0, y1, x0, y1 - rr); s.lineTo(x0, y0 + rr); s.quadraticCurveTo(x0, y0, x0 + rr, y0);
      var geo = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
      geo.translate(0, 0, -(d - 2 * b) / 2); geo.computeVertexNormals();
      return geo;
    }
    function mesh(geo, mat, x, y, z, parent) { var m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); (parent || scene).add(m); return m; }
    function lathe(pts, seg) { return new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 24); }
    // неоновая трубка (MeshBasic ярче порога bloom → светится); уровень яркости — setLvl
    function neon(parent, pts, col, closed, r) {
      var path = new T.CurvePath();
      for (var i = 0; i < pts.length - (closed ? 0 : 1); i++) path.add(new T.LineCurve3(pts[i], pts[(i + 1) % pts.length]));
      var mat = new T.MeshBasicMaterial({ color: col }); mat.userData.base = new T.Color(col);
      parent.add(new T.Mesh(new T.TubeGeometry(path, Math.max(12, pts.length * 10), r || 0.045, 6, false), mat));
      return mat;
    }
    function setLvl(mat, lvl) { mat.color.copy(mat.userData.base).multiplyScalar(lvl); }
    var SHAPES = {
      diamond: [[0, 1], [0.66, 0], [0, -1], [-0.66, 0]],
      star: (function () { var p = []; for (var s2 = 0; s2 < 10; s2++) { var an = Math.PI / 2 + s2 * Math.PI / 5, rr = s2 % 2 ? 0.42 : 1; p.push([Math.cos(an) * rr, Math.sin(an) * rr]); } return p; })(),
      bolt: [[-0.3, 1], [0.4, 1], [0.05, 0.15], [0.55, 0.15], [-0.35, -1], [-0.05, -0.15], [-0.5, -0.15]],
      heart: (function () { var p = []; for (var s2 = 0; s2 < 24; s2++) { var t = s2 / 24 * Math.PI * 2; p.push([Math.pow(Math.sin(t), 3) * 0.95, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); } return p; })(),
    };
    function shapePts(name, cx, cy, z, sx, sy) { return SHAPES[name].map(function (p) { return V(cx + p[0] * sx, cy + p[1] * sy, z); }); }

    // ---------- задник: нарисованный ночной мегаполис (окна загораются с прогрессом) ----------
    var skyWins = []; for (var sw = 0; sw < 2600; sw++) skyWins.push(Math.random());
    var skyDraw = function (g, W, H) {
      var prog = S.litN / 6;
      var gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, '#04020c'); gr.addColorStop(0.35, '#120830'); gr.addColorStop(0.62, '#3a1262'); gr.addColorStop(0.8, '#8a2a86'); gr.addColorStop(1, '#2a0c3a');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(255,240,255,' + rnd(0.15, 0.8).toFixed(2) + ')'; var sx = Math.random() * W, sy = Math.random() * H * 0.45; g.fillRect(sx, sy, 1.4, 1.4); }
      // зарево у горизонта
      var gl = g.createRadialGradient(W / 2, H * 0.8, 10, W / 2, H * 0.8, W * 0.4); gl.addColorStop(0, 'rgba(249,57,227,.2)'); gl.addColorStop(1, 'rgba(249,57,227,0)');
      g.fillStyle = gl; g.fillRect(0, 0, W, H);
      // три ряда силуэтов небоскрёбов: дальний светлее, ближний темнее
      var wi = 0, rows = [[0.62, '#2a1450', 0.5], [0.7, '#1a0c36', 0.75], [0.78, '#0e0620', 1]];
      rows.forEach(function (row, ri) {
        var x = -20, base = H * 0.86;
        while (x < W + 20) {
          var bw = rnd(24, 70) * (1 + ri * 0.2), top = H * row[0] - rnd(0, H * (0.28 - ri * 0.05)) * (Math.random() < 0.15 ? 1.4 : 1);
          g.fillStyle = row[1]; g.fillRect(x, top, bw, base - top);
          if (Math.random() < 0.35) { g.fillRect(x + bw * 0.4, top - rnd(10, 40), bw * 0.2, rnd(10, 40)); g.fillStyle = '#ff3a6a'; g.fillRect(x + bw * 0.48, top - 44, 2.5, 2.5); }
          // окна: часть горит; чем больше расписано стен, тем больше горит
          for (var wy = top + 6; wy < base - 6; wy += 7) for (var wx = x + 4; wx < x + bw - 4; wx += 6) {
            var r = skyWins[wi++ % skyWins.length];
            if (r < 0.12 + prog * 0.42) { g.fillStyle = r < 0.04 ? 'rgba(249,57,227,' + (0.55 * row[2]).toFixed(2) + ')' : r < 0.08 ? 'rgba(46,230,255,' + (0.5 * row[2]).toFixed(2) + ')' : 'rgba(255,214,150,' + (0.6 * row[2]).toFixed(2) + ')'; g.fillRect(wx, wy, 2.6, 3.2); }
          }
          x += bw + rnd(-4, 6);
        }
      });
      // дымка у земли
      var hz = g.createLinearGradient(0, H * 0.7, 0, H); hz.addColorStop(0, 'rgba(60,18,90,0)'); hz.addColorStop(1, 'rgba(60,18,90,.85)');
      g.fillStyle = hz; g.fillRect(0, H * 0.7, W, H * 0.3);
    };
    var skyTex = k.tex(2048, 512, skyDraw, HQ);
    var pano = k.panorama({ texture: skyTex, r: 120, h: 160, span: 2.6, y0: -30, z: -18, repeat: 1, mirror: false, color: 0xffffff });
    // ---------- сгенерированная графика (../../dexyplay/assets/gen, 18.11): пока не загрузилась или нет файла — процедурная ----------
    function genTex(url, cb) { k.image(url, function (t, img) { var c = t.clone(); c.needsUpdate = true; c.anisotropy = k.aniso; cb(c, img); }); }
    function genBoard(url, fb, height, o) {
      var b = k.billboard(url, height, o), probe = new Image();
      probe.onerror = function () {
        if (!fb) return;
        k.image(fb, function (t, img) { var m = b.children[0]; m.material.map = t; m.material.needsUpdate = true; m.scale.set(height * img.width / img.height, height, 1); m.position.y = height / 2; m.visible = true; });
      };
      probe.src = url;
      return b;
    }
    // нарисованный мегаполис (дуга 312 × 160 ≈ пропорции картинки); окна по прогрессу остаются у ближних домов
    genTex('../../dexyplay/assets/gen/sky-city.jpg', function (c) { pano.material.map = c; pano.material.color.setHex(0xd8d0e8); pano.material.needsUpdate = true; });
    scene.background = new T.Color(0x05020c);
    S.redrawSky = function () { skyTex.redraw(skyDraw); };

    // ---------- свет ----------
    scene.add(new T.HemisphereLight(0x5a46a8, 0x0a0414, 0.55));
    var key = new T.SpotLight(0xffd9ec, 1.35, 80, 0.6, 0.7, 1.1); key.position.set(3, 15, 22); key.target.position.set(0, 2, -8); scene.add(key, key.target);
    var back = new T.PointLight(C.pink, 1.5, 42, 1.5); back.position.set(0, 10, -27); scene.add(back);
    [[C.teal, -6, -2], [C.pink, 6, -12], [C.purple, -6, -22]].forEach(function (p) { var L = new T.PointLight(p[0], 1.1, 17, 1.6); L.position.set(p[1], 4.5, p[2]); scene.add(L); });

    // ---------- мокрая улица: зеркало под полупрозрачным асфальтом со слякотью ----------
    var floorMeshes = [];
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#07050c'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.3)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      for (var p = 0; p < 30; p++) { var gx = Math.random() * w, gy = Math.random() * h, gr = g.createRadialGradient(gx, gy, 0, gx, gy, rnd(18, 55)); gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } // лужи — темнее, отражение ярче
      // слякоть у бордюров и в колеях
      [[0, 34], [w - 34, 34]].forEach(function (e) {
        for (var i2 = 0; i2 < 900; i2++) { var sx = e[0] + Math.random() * e[1], sy = Math.random() * h; g.fillStyle = 'rgba(214,206,240,' + rnd(0.2, 0.7).toFixed(2) + ')'; g.beginPath(); g.arc(sx, sy, rnd(1, 4), 0, 7); g.fill(); }
      });
      [0.28, 0.72].forEach(function (x) { for (var i3 = 0; i3 < 260; i3++) { g.fillStyle = 'rgba(200,190,230,' + rnd(0.05, 0.2).toFixed(2) + ')'; g.fillRect(x * w + rnd(-12, 12), Math.random() * h, rnd(2, 6), rnd(4, 14)); } });
      g.fillStyle = '#ffd23a'; for (var y = 0; y < h; y += 64) { g.fillRect(w / 2 - 8, y, 5, 38); g.fillRect(w / 2 + 3, y, 5, 38); }
    }, HQ);
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 4);
    var road = new T.Mesh(new T.PlaneGeometry(8, 64), new T.MeshStandardMaterial({ map: roadTex, emissive: 0xffffff, emissiveMap: roadTex, emissiveIntensity: 0.12, roughness: 0.4, metalness: 0.15, transparent: true, opacity: 0.86 })); // 0.22 давал слепящий блик заднего света вдоль дороги
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.006, -12); scene.add(road); floorMeshes.push(road);
    var walkTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#2a2440'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2500; i++) { g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.strokeStyle = 'rgba(10,6,20,.6)'; g.lineWidth = 3;
      for (var x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke(); }
      for (var j = 0; j < 1400; j++) { g.fillStyle = 'rgba(226,220,250,' + rnd(0.3, 0.85).toFixed(2) + ')'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rnd(1, 3.5), 0, 7); g.fill(); } // свежий снег
    }, HQ);
    walkTex.wrapS = walkTex.wrapT = T.RepeatWrapping; walkTex.repeat.set(1.5, 18);
    var walkMat = new T.MeshStandardMaterial({ map: walkTex, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.9 });
    [-1, 1].forEach(function (sd) {
      var wk = new T.Mesh(new T.PlaneGeometry(3.4, 64), walkMat); wk.rotation.x = -Math.PI / 2; wk.position.set(sd * 5.7, 0.012, -12); scene.add(wk); floorMeshes.push(wk);
      var curb = mesh(rbox(0.3, 0.16, 64, 0.05), stone, sd * 4.1, 0, -12);
    });
    var mirror = k.mirror(new T.PlaneGeometry(15, 64), { hide: floorMeshes });
    if (mirror) { mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, 0, -12); scene.add(mirror); }
    else floorMeshes.forEach(function (m) { m.material.transparent = false; m.material.opacity = 1; });
    var snowTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#b8b0dc'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 12000; i++) { var v = 170 + Math.random() * 85 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + Math.min(255, v + 22) + ',.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    }, HQ);
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping; snowTex.repeat.set(14, 14);
    var ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: 0x5a4c90, map: snowTex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -30); scene.add(ground);
    // сугробы вдоль бордюров (одна отрисовка)
    (function () {
      var n = 70, im = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), snowMat, n), M = new T.Matrix4(), Q = new T.Quaternion(), P = new T.Vector3(), Sc = new T.Vector3();
      for (var i = 0; i < n; i++) {
        var sd = i % 2 ? 1 : -1; P.set(sd * rnd(4.15, 4.6), 0, rnd(-42, 13)); Sc.set(rnd(0.25, 0.45), rnd(0.12, 0.26), rnd(0.5, 1.2));
        Q.setFromAxisAngle(V(0, 1, 0), rnd(-0.3, 0.3)); M.compose(P, Q, Sc); im.setMatrixAt(i, M);
      }
      scene.add(im);
    })();

    // ---------- текстуры домов ----------
    var brickTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#4a4458'; g.fillRect(0, 0, w, h); // раствор
      var bh = 22, bw = 58;
      for (var y = 0, r = 0; y < h; y += bh, r++) for (var x = (r % 2) * -bw / 2; x < w; x += bw) {
        var v = 150 + Math.random() * 80 | 0, tint = Math.random() < 0.12 ? 0.82 : 1;
        g.fillStyle = 'rgb(' + (v * tint | 0) + ',' + ((v - 8) * tint | 0) + ',' + ((v + 4) * tint | 0) + ')'; g.fillRect(x + 2.5, y + 2.5, bw - 5, bh - 5);
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2.5, y + 2.5, bw - 5, 2);   // свет по верхней кромке кирпича
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 2.5, y + bh - 4.5, bw - 5, 2);     // тень по нижней
      }
      for (var i = 0; i < 6000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      // иней в швах
      for (var j = 0; j < 500; j++) { g.fillStyle = 'rgba(230,226,255,.25)'; g.fillRect(Math.random() * w, (Math.round(Math.random() * h / bh) * bh) - 1, rnd(4, 14), 2); }
    }, HQ);
    brickTex.wrapS = brickTex.wrapT = T.RepeatWrapping; brickTex.repeat.set(0.42, 0.42);
    // кирпич из графики: подменяем картинку в той же текстуре — все фасады (map и bumpMap) подхватят сами
    k.image('../../dexyplay/assets/gen/brick-dark.jpg', function (t, img) { brickTex.image = img; brickTex.repeat.set(0.3, 0.3); brickTex.needsUpdate = true; });
    // окно: рама, стекло, шторы; карта свечения — только стекло между шторами
    function winDraw(glow) {
      return function (g, w, h) {
        g.fillStyle = glow ? '#000' : '#120a1c'; g.fillRect(0, 0, w, h);
        if (glow) { var gr = g.createRadialGradient(w / 2, h * 0.55, 2, w / 2, h * 0.55, w * 0.7); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#6a6a6a'); g.fillStyle = gr; g.fillRect(6, 6, w - 12, h - 12); }
        else { var gl = g.createLinearGradient(0, 0, 0, h); gl.addColorStop(0, '#3a3058'); gl.addColorStop(1, '#1a1428'); g.fillStyle = gl; g.fillRect(6, 6, w - 12, h - 12); }
        // шторы по бокам (в карте свечения — тёмные)
        g.fillStyle = glow ? 'rgba(0,0,0,.75)' : '#5a2a6a';
        [[6, w * 0.28], [w - 6 - w * 0.28, w * 0.28]].forEach(function (c) { g.beginPath(); g.moveTo(c[0], 6); g.lineTo(c[0] + c[1], 6); g.quadraticCurveTo(c[0] + c[1] * (c[0] < w / 2 ? 0.3 : 0.7), h * 0.6, c[0] + c[1] * (c[0] < w / 2 ? 0.55 : 0.45), h - 6); g.lineTo(c[0] + (c[0] < w / 2 ? 0 : c[1]), h - 6); g.closePath(); g.fill(); });
        // переплёт
        g.fillStyle = glow ? '#000' : '#0c0814'; g.fillRect(w / 2 - 2, 6, 4, h - 12); g.fillRect(6, h * 0.42, w - 12, 4);
        g.strokeStyle = glow ? '#000' : '#2a2038'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
      };
    }
    var winTex = k.tex(64, 80, winDraw(false), HQ), winGlowTex = k.tex(64, 80, winDraw(true), HQ);
    // пустая стена: загрунтованный серый бетон, мелом размечена сетка, следы старой затёртой краски (без букв)
    // бетон под граффити: gen wall-canvas.jpg (batch 2) под фиолетово-серой вуалью (его меловая сетка не спорит с сеткой пазла);
    // пока картинки нет — процедурный шум. Холсты перерисовываются, когда картинка загрузится
    var wallImg = null, blankTexs = [];
    k.image('../../dexyplay/assets/gen/wall-canvas.jpg', function (t, img) { wallImg = img; blankTexs.forEach(function (bt) { bt.redraw(); }); });
    function blankTex(W, H) {
      var px = 40, cw = W * px, ch = H * px;
      var bt = k.tex(cw + 16, ch + 16, function (g, w, h) {
        g.fillStyle = '#5c566c'; g.fillRect(0, 0, w, h);
        if (wallImg) { var ts = 320; for (var ty = 0; ty < h; ty += ts) for (var tx = 0; tx < w; tx += ts) g.drawImage(wallImg, tx, ty, ts, ts); g.fillStyle = 'rgba(78,70,98,.5)'; g.fillRect(0, 0, w, h); }
        else for (var i = 0; i < 2200; i++) { var v = 70 + Math.random() * 50 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + (v + 12) + ',.45)'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
        for (var s = 0; s < 6; s++) { g.strokeStyle = ['rgba(249,57,227,.12)', 'rgba(51,255,143,.1)', 'rgba(255,231,51,.1)'][s % 3]; g.lineWidth = rnd(6, 16); g.lineCap = 'round'; g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.bezierCurveTo(Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h, Math.random() * w, Math.random() * h); g.stroke(); }
        g.strokeStyle = 'rgba(240,236,255,.4)'; g.lineWidth = 2;
        for (var x = 0; x <= W; x++) { g.beginPath(); g.moveTo(8 + x * px, 8); g.lineTo(8 + x * px, 8 + ch); g.stroke(); }
        for (var y = 0; y <= H; y++) { g.beginPath(); g.moveTo(8, 8 + y * px); g.lineTo(8 + cw, 8 + y * px); g.stroke(); }
      }, HQ);
      blankTexs.push(bt);
      return bt;
    }
    // расписанная стена: неоновые клетки по решённой сетке; reveal 0..1 — сколько клеток уже «прокрашено»
    function paint(o, reveal) {
      var t = o.tag; if (!t) return;
      var c = o.paintCanvas, g = c.getContext('2d'), px = o.px, W = t.W, H = t.H, col = NEON_CSS[t.neon] || NEON_CSS.pink;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#120820'; g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = 'rgba(201,188,221,.14)'; g.lineWidth = 2;
      for (var x = 0; x <= W; x++) { g.beginPath(); g.moveTo(8 + x * px, 8); g.lineTo(8 + x * px, 8 + H * px); g.stroke(); }
      for (var y = 0; y <= H; y++) { g.beginPath(); g.moveTo(8, 8 + y * px); g.lineTo(8 + W * px, 8 + y * px); g.stroke(); }
      var filled = []; t.grid.forEach(function (v, i) { if (v === 1) filled.push(i); });
      var n = Math.round(filled.length * reveal);
      g.shadowColor = col; g.shadowBlur = 14;
      for (var f = 0; f < n; f++) {
        var i2 = filled[f], cx = 8 + (i2 % W) * px, cy = 8 + Math.floor(i2 / W) * px;
        g.fillStyle = col; g.fillRect(cx + 4, cy + 4, px - 8, px - 8);
      }
      g.shadowBlur = 0;
      for (var f2 = 0; f2 < n; f2++) { var i3 = filled[f2], cx2 = 8 + (i3 % W) * px, cy2 = 8 + Math.floor(i3 / W) * px; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(cx2 + px * 0.36, cy2 + px * 0.36, px * 0.28, px * 0.28); }
      o.paintTex.needsUpdate = true;
    }
    var poolTex = k.tex(128, 128, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });

    // ---------- детали крыш ----------
    var slatTex = k.tex(128, 64, function (g, w, h) { g.fillStyle = '#6a4632'; g.fillRect(0, 0, w, h); for (var x = 0; x < w; x += 8) { g.fillStyle = 'rgba(0,0,0,' + rnd(0.15, 0.35).toFixed(2) + ')'; g.fillRect(x, 0, 1.5, h); g.fillStyle = 'rgba(255,220,180,' + rnd(0.02, 0.08).toFixed(2) + ')'; g.fillRect(x + 2, 0, 4, h); } });
    slatTex.wrapS = T.RepeatWrapping; slatTex.repeat.set(2, 1);
    var tankMat = new T.MeshStandardMaterial({ map: slatTex, roughness: 0.85 });
    function waterTank(parent, x, y, z) {
      var g = new T.Group(); g.position.set(x, y, z); parent.add(g);
      mesh(new T.CylinderGeometry(0.78, 0.82, 1.5, 20, 1), tankMat, 0, 1.75, 0, g);
      [1.15, 1.75, 2.35].forEach(function (yy) { var b = mesh(new T.TorusGeometry(0.81, 0.03, 6, 28), iron, 0, yy, 0, g); b.rotation.x = Math.PI / 2; });
      mesh(new T.ConeGeometry(0.9, 0.55, 20), snowMat, 0, 2.78, 0, g);
      [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(function (q) { mesh(new T.CylinderGeometry(0.05, 0.06, 1.0, 6), iron, q[0], 0.5, q[1], g); });
      var x1 = mesh(new T.BoxGeometry(1.2, 0.04, 0.04), iron, 0, 0.55, 0.5, g); x1.rotation.z = 0.7;
      var x2 = mesh(new T.BoxGeometry(1.2, 0.04, 0.04), iron, 0, 0.55, -0.5, g); x2.rotation.z = -0.7;
      return g;
    }
    var grilleTex = k.tex(64, 64, function (g, w, h) { g.fillStyle = '#9aa0b4'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3a4a'; for (var y = 6; y < h - 4; y += 6) g.fillRect(6, y, w - 12, 2.5); });
    var acMat = new T.MeshStandardMaterial({ color: 0xb0b4c4, map: grilleTex, metalness: 0.5, roughness: 0.4 });
    function acUnit(parent, x, y, z, ry) { var m = mesh(rbox(1.1, 0.62, 0.8, 0.06), acMat, x, y, z, parent); m.rotation.y = ry || 0; mesh(rbox(1.15, 0.08, 0.85, 0.03), snowMat, x, y + 0.62, z, parent).rotation.y = ry || 0; return m; }
    var blinkers = [];
    function antenna(parent, x, y, z) {
      mesh(new T.CylinderGeometry(0.03, 0.05, 2.6, 6), iron, x, y + 1.3, z, parent);
      [0.9, 1.5, 2.0].forEach(function (yy, i) { mesh(new T.BoxGeometry(0.8 - i * 0.2, 0.025, 0.025), iron, x, y + yy, z, parent); });
      var m = new T.MeshBasicMaterial({ color: 0xff3a6a }); mesh(new T.SphereGeometry(0.07, 10, 8), m, x, y + 2.65, z, parent); blinkers.push(m);
    }
    var treeMat = new T.MeshStandardMaterial({ color: 0x1f8a52, roughness: 0.8, flatShading: true });
    var miniTrees = [];
    function miniTree(parent, x, y, z) {
      var g = new T.Group(); g.position.set(x, y, z); parent.add(g);
      [[0.55, 0.8, 0.55], [0.42, 0.7, 0.98], [0.28, 0.6, 1.36]].forEach(function (t) { mesh(new T.ConeGeometry(t[0], t[1], 9), treeMat, 0, t[2], 0, g); mesh(new T.ConeGeometry(t[0] * 0.5, t[1] * 0.35, 9), snowMat, 0, t[2] + t[1] * 0.32, 0, g); });
      mesh(new T.CylinderGeometry(0.07, 0.08, 0.3, 6), wood, 0, 0.15, 0, g);
      var pts = []; for (var i = 0; i < 16; i++) { var tt = i / 16, a = tt * Math.PI * 5; pts.push(V(Math.cos(a) * (0.52 - tt * 0.38), 0.4 + tt * 1.1, Math.sin(a) * (0.52 - tt * 0.38))); }
      var im = new T.InstancedMesh(new T.SphereGeometry(0.045, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), pts.length), M = new T.Matrix4(), cols = [C.pink, C.yellow, C.green, C.teal];
      pts.forEach(function (p, i) { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); im.setColorAt(i, new T.Color(cols[i % 4])); });
      g.add(im);
      var star = new T.MeshBasicMaterial({ color: C.yellow }); mesh(new T.OctahedronGeometry(0.1), star, 0, 1.75, 0, g);
      miniTrees.push(im);
      return g;
    }
    function vents(parent, x, y, z) { [[0, 0], [0.4, 0.25]].forEach(function (q) { mesh(new T.CylinderGeometry(0.1, 0.1, 0.6, 10), chrome, x + q[0], y + 0.3, z + q[1], parent); mesh(new T.CylinderGeometry(0.17, 0.12, 0.12, 10), chrome, x + q[0], y + 0.65, z + q[1], parent); }); }

    // ---------- дом со стеной-холстом ----------
    function building(id, W, H, v) {
      var mural = id === 'mural';
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var bw = mural ? 13.5 : 4.8 + (v % 2) * 0.4, bh = mural ? 12.8 : 6.2 + (v % 3) * 0.8, bd = mural ? 4.8 : 3.8;
      var full = new T.Color(BRICKS[v % BRICKS.length]), grey = full.clone().lerp(new T.Color(0x5a5470), 0.6);
      var bodyMat = new T.MeshStandardMaterial({ color: grey.clone(), map: brickTex, bumpMap: brickTex, bumpScale: 0.025, roughness: 0.82 });
      var body = mesh(rbox(bw, bh, bd, 0.1), bodyMat, 0, 0, 0, inner);
      var fz = bd / 2;
      // цоколь, пилястры, карниз в две ступени, снег на крыше
      mesh(rbox(bw + 0.16, 0.7, bd + 0.16, 0.05), stone, 0, 0, 0, inner);
      [-1, 1].forEach(function (sd) { mesh(rbox(0.36, bh - 0.9, 0.16, 0.04), trim, sd * (bw / 2 - 0.2), 0.7, fz + 0.06, inner); });
      mesh(rbox(bw + 0.3, 0.18, bd + 0.3, 0.05), trim, 0, bh - 0.3, 0, inner);
      mesh(rbox(bw + 0.56, 0.24, bd + 0.56, 0.06), trim, 0, bh - 0.12, 0, inner);
      mesh(rbox(bw + 0.5, 0.16, bd + 0.5, 0.06), snowMat, 0, bh + 0.12, 0, inner);
      // сосульки по карнизу
      for (var ic = 0; ic < (mural ? 26 : 10); ic++) { var icl = mesh(new T.ConeGeometry(0.035, rnd(0.15, 0.4), 5), snowMat, -bw / 2 + 0.1 + ic * (bw / (mural ? 26 : 10)), bh - 0.2, fz + 0.27, inner); icl.rotation.x = Math.PI; }
      // крыша: бак, кондиционеры, антенна, мини-ёлка, вентиляция
      var ry = bh + 0.2;
      if (mural) { waterTank(inner, -bw * 0.33, ry, -0.6); acUnit(inner, bw * 0.12, ry, -1.1); antenna(inner, bw * 0.38, ry, -1.2); miniTree(inner, bw * 0.24, ry, 0.9); vents(inner, -bw * 0.08, ry, -1.3); }
      else if (v % 3 === 0) { waterTank(inner, -bw * 0.18, ry, -0.4); vents(inner, bw * 0.24, ry, 0.6); }
      else if (v % 3 === 1) { acUnit(inner, -bw * 0.15, ry, -0.5, 0.3); antenna(inner, bw * 0.28, ry, -0.8); miniTree(inner, bw * 0.12, ry, 0.9); }
      else { miniTree(inner, -bw * 0.2, ry, 0.5); acUnit(inner, bw * 0.2, ry, -0.6); vents(inner, -bw * 0.25, ry, -1.1); }
      // холст на фасаде (+z)
      var pw, ph, py;
      if (mural) { ph = 9.2; pw = ph * W / H; py = 1.0 + ph / 2; } else { pw = ph = 3.2; py = 0.95 + ph / 2; }
      var panelMat = new T.MeshStandardMaterial({ map: blankTex(W, H), color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.78 });
      var panel = mesh(new T.PlaneGeometry(pw, ph), panelMat, 0, py, fz + 0.03, inner);
      // рамка холста — неоновая трубка (готова — фиолетовая, в работе — жёлтая пульсирует, расписана — неон стены)
      var hx = pw / 2 + 0.1, hy = ph / 2 + 0.1, zf = fz + 0.08;
      var frameMat = neon(inner, [V(-hx, py - hy, zf), V(hx, py - hy, zf), V(hx, py + hy, zf), V(-hx, py + hy, zf)], 0xffffff, true, mural ? 0.07 : 0.045);
      // окна над холстом (у мурала — по бокам): шторы, рамы, подоконники со снегом; часть тёплые, часть — неон-акцент
      var accent = [C.pink, C.teal, C.purple][v % 3];
      var winMatA = new T.MeshStandardMaterial({ map: winTex, emissive: C.warm, emissiveMap: winGlowTex, emissiveIntensity: 0.3, roughness: 0.25, metalness: 0.3, envMapIntensity: 1.2 });
      var winMatB = new T.MeshStandardMaterial({ map: winTex, emissive: accent, emissiveMap: winGlowTex, emissiveIntensity: 0.15, roughness: 0.25, metalness: 0.3, envMapIntensity: 1.2 });
      var wins = [];
      if (mural) { for (var r = 0; r < 4; r++) [-1, 1].forEach(function (sd) { wins.push([sd * (bw / 2 - 1.15), 2.3 + r * 2.6]); }); }
      else { var top = py + ph / 2 + 0.55; for (var r2 = 0; top + 0.55 + r2 * 1.35 < bh - 0.5; r2++) [-1.0, 1.0].forEach(function (xx) { wins.push([xx, top + 0.5 + r2 * 1.35]); }); }
      wins.forEach(function (p, i) {
        mesh(new T.PlaneGeometry(0.78, 0.98), (i * 7 + v) % 3 === 0 ? winMatB : winMatA, p[0], p[1], fz + 0.02, inner);
        mesh(rbox(0.96, 0.1, 0.22, 0.03), stone, p[0], p[1] - 0.58, fz + 0.06, inner);
        mesh(rbox(0.92, 0.07, 0.2, 0.03), snowMat, p[0], p[1] - 0.48, fz + 0.07, inner);
        mesh(rbox(0.96, 0.1, 0.1, 0.03), trim, p[0], p[1] + 0.48, fz + 0.04, inner);
      });
      // пожарная лестница сбоку (обычные дома): площадки, перила, лестницы между этажами
      if (!mural) {
        var sx = (v % 2 ? -1 : 1), ex = sx * (bw / 2 + 0.45);
        for (var fl = 0; fl < 3 && 2.4 + fl * 1.9 < bh - 0.6; fl++) {
          var yy = 2.4 + fl * 1.9;
          mesh(new T.BoxGeometry(0.9, 0.05, 2.0), iron, ex, yy, 0, inner);
          mesh(new T.BoxGeometry(0.9, 0.05, 2.0), snowMat, ex, yy + 0.04, 0, inner).scale.set(0.95, 0.6, 0.95);
          [-0.95, 0.95].forEach(function (zz) { mesh(new T.BoxGeometry(0.03, 0.75, 0.03), iron, ex + sx * 0.42, yy + 0.37, zz, inner); });
          mesh(new T.BoxGeometry(0.03, 0.03, 2.0), iron, ex + sx * 0.42, yy + 0.74, 0, inner);
          mesh(new T.BoxGeometry(0.03, 0.03, 2.0), iron, ex + sx * 0.42, yy + 0.4, 0, inner);
          if (fl > 0) { var lad = new T.Group(); lad.position.set(ex, yy - 0.95, 0); lad.rotation.x = 0.55; inner.add(lad); [-0.25, 0.25].forEach(function (lx) { mesh(new T.BoxGeometry(0.03, 2.1, 0.03), iron, lx, 0, 0, lad); }); for (var rg = 0; rg < 7; rg++) mesh(new T.BoxGeometry(0.5, 0.025, 0.025), iron, 0, -0.9 + rg * 0.3, 0, lad); }
        }
      }
      // неон по карнизу (горит, когда стена расписана) + вертикальная вывеска-абстракция на углу
      var tubeMat = neon(inner, [V(-bw / 2 - 0.22, bh - 0.42, fz + 0.32), V(bw / 2 + 0.22, bh - 0.42, fz + 0.32)], 0xffffff, false, 0.05);
      var bladeMat = null;
      if (!mural) {
        var bx = -sxSide(v) * (bw / 2 - 0.1), byc = bh * 0.62;
        mesh(rbox(0.12, 2.2, 0.9, 0.04), iron, bx, byc - 1.1, fz - 0.2, inner).rotation.y = Math.PI / 2;
        var blade = new T.Group(); blade.position.set(bx, byc, fz + 0.3); blade.rotation.y = -sxSide(v) * 0.5; inner.add(blade);
        mesh(rbox(0.9, 1.9, 0.12, 0.08), new T.MeshStandardMaterial({ color: 0x0c0814, metalness: 0.4, roughness: 0.35 }), 0, -0.95, 0, blade);
        bladeMat = neon(blade, shapePts(['star', 'diamond', 'bolt', 'heart'][v % 4], 0, 0, 0.08, 0.32, 0.68), [C.pink, C.teal, C.yellow, C.green][v % 4], true, 0.035);
      }
      // свечение неона на снег перед стеной
      var spill = new T.Mesh(new T.PlaneGeometry(mural ? 14 : 6.4, mural ? 8 : 4.6), new T.MeshBasicMaterial({ map: poolTex, color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.05, fz + (mural ? 3.4 : 2.1)); inner.add(spill);
      var panelGlow = k.glow(0xffffff, mural ? 12 : 5.6); panelGlow.position.set(0, py, fz + 0.6); panelGlow.material.opacity = 0; inner.add(panelGlow);
      // кольцо «текущая стена»
      var ring = new T.Mesh(new T.RingGeometry(mural ? 4.4 : 2.5, mural ? 4.7 : 2.75, 48), new T.MeshBasicMaterial({ color: 0xffe733, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.06, bd / 2 + (mural ? 3.4 : 1.9)); g.add(ring);
      return {
        g: g, inner: inner, id: id, mural: mural, W: W, H: H, full: full, grey: grey, bodyMat: bodyMat, panel: panel, panelMat: panelMat, frameMat: frameMat,
        winMatA: winMatA, winMatB: winMatB, tubeMat: tubeMat, bladeMat: bladeMat, spill: spill, panelGlow: panelGlow, ring: ring,
        front: [0, py, fz], pw: pw, ph: ph, h: bh + 0.5, lit: 0, target: 0, reveal: 1, hover: 0, tag: null, tagKey: '',
      };
    }
    function sxSide(v) { return v % 2 ? -1 : 1; }

    // расписанная стена: своя текстура-холст с неоном
    function setTag(o, tag) {
      var key = tag ? tag.W + 'x' + tag.H + ':' + tag.grid.join('') + ':' + tag.neon : '';
      if (key === o.tagKey) return;
      o.tagKey = key; o.tag = tag;
      if (!tag) { o.panelMat.map = blankTex(o.W, o.H); o.panelMat.emissiveMap = null; o.panelMat.needsUpdate = true; return; }
      var px = 40;
      if (!o.paintCanvas || o.paintW !== tag.W || o.paintH !== tag.H) {
        o.paintCanvas = document.createElement('canvas'); o.paintCanvas.width = tag.W * px + 16; o.paintCanvas.height = tag.H * px + 16;
        o.paintTex = new T.CanvasTexture(o.paintCanvas); o.paintTex.anisotropy = k.aniso;
        if (!k.premium && T.sRGBEncoding) o.paintTex.encoding = T.sRGBEncoding;
        o.px = px; o.paintW = tag.W; o.paintH = tag.H;
      }
      paint(o, o.reveal);
      o.panelMat.map = o.paintTex; o.panelMat.emissiveMap = o.paintTex; o.panelMat.needsUpdate = true;
      var col = NEON[tag.neon] || NEON.pink;
      o.tubeMat.userData.base.setHex(col); o.spill.material.color.setHex(col); o.panelGlow.material.color.setHex(col);
    }

    // ---------- второй ряд домов за улицей: квартал, а не пустой снег ----------
    var blockWinTex = k.tex(128, 256, function (g, w, h) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      var cols = ['#ffd49a', '#ffd49a', '#ffd49a', '#f939e3', '#2ee6ff'];
      for (var y = 10; y < h - 8; y += 16) for (var x = 8; x < w - 8; x += 14) if (Math.random() < 0.4) { g.fillStyle = cols[Math.random() * cols.length | 0]; g.globalAlpha = rnd(0.35, 0.9); g.fillRect(x, y, 8, 9); }
      g.globalAlpha = 1;
    });
    var backMats = [];
    var BACK = [[-14, 9, 6, 7], [-15, 1, 7, 10], [-13.5, -7, 6, 9], [-15, -15, 7, 16], [-13.5, -23, 6, 12], [-12.5, -31, 7, 18],
                [14, 6, 6, 8], [15, -2, 7, 9], [13.5, -10, 6, 15], [15, -18, 7, 11], [13.5, -26, 6, 14], [12.5, -32, 7, 20], [-21, -3, 6, 14], [21, -12, 6, 22], [-21, -20, 6, 18], [21, 2, 6, 10]];
    var backCols = [0x3a2470, 0x4a1e62, 0x22307a, 0x34185a, 0x2c2a6a];
    BACK.forEach(function (p, i) {
      var tx = blockWinTex.clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(p[2] / 6, p[3] / 10);
      var m = new T.MeshStandardMaterial({ color: backCols[i % backCols.length], map: brickTex, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.25, roughness: 0.85 });
      // emissiveMap использует те же UV, что и кирпич: окна по сетке фасада
      mesh(rbox(p[2], p[3], 6, 0.08), m, p[0], 0, p[1]);
      mesh(rbox(p[2] + 0.3, 0.22, 6.3, 0.05), trim, p[0], p[3], p[1]);
      mesh(rbox(p[2] + 0.2, 0.14, 6.2, 0.05), snowMat, p[0], p[3] + 0.22, p[1]);
      backMats.push(m);
      // фасад с окнами из графики: та же картинка и цветом, и свечением (горят окна), оттенок дома — слегка
      (function (m, p, col) {
        genTex('../../dexyplay/assets/gen/windows-apartment.jpg', function (c) {
          // UV у rbox (Extrude) — в мировых единицах: одна картинка окон на 6 × 7 единиц фасада
          c.wrapS = c.wrapT = T.RepeatWrapping; c.repeat.set(1 / 6, 1 / 7);
          m.map = c; m.emissiveMap = c; m.emissiveIntensity = 0.42; m.color.setHex(0xffffff).lerp(new T.Color(col), 0.35); m.needsUpdate = true;
        });
      })(m, p, backCols[i % backCols.length]);
      if (i % 4 === 1) waterTank(scene, p[0] - p[2] * 0.2, p[3] + 0.2, p[1]);
      if (i % 3 === 0) {
        var col = [C.pink, C.green, C.yellow, C.teal][(i / 3) % 4 | 0], ex = p[0] + (p[0] < 0 ? p[2] / 2 + 0.06 : -p[2] / 2 - 0.06);
        var nm = neon(scene, [V(ex, p[3] * 0.25, p[1] + 3.05), V(ex, p[3] * 0.92, p[1] + 3.05)], col, false, 0.06); S.neonAll.push({ m: nm, ph: i });
      }
    });
    // крыши дальнего ряда: реквизит из атласа roof-props.png (gen batch 2) — спрайты, низом на снег; нет файла — крыши как были.
    // регион атласа в px исходника 1376×768 (x0, y0, x1, y1) + высота в мире; 7 — неоновая рама (не приглушаем)
    var ROOF_ATLAS = [[82, 30, 278, 356, 2.6], [382, 64, 658, 342, 1.0], [812, 70, 944, 340, 1.5], [1082, 54, 1328, 338, 2.3],
                      [86, 420, 270, 712, 1.8], [428, 400, 608, 728, 2.0], [744, 420, 976, 722, 1.5], [1058, 438, 1334, 702, 1.3]];
    k.image('../../dexyplay/assets/gen/roof-props.png', function (t, img) {
      var kx = img.width / 1376, ky = img.height / 768;
      var mats = ROOF_ATLAS.map(function (r, j) {
        var c = t.clone(); c.needsUpdate = true;
        c.repeat.set((r[2] - r[0]) / 1376, (r[3] - r[1]) / 768); c.offset.set(r[0] / 1376, 1 - r[3] / 768);
        return new T.SpriteMaterial({ map: c, color: j === 7 ? 0xffffff : (j === 6 || j === 1 ? 0x6a6294 : 0x8078a4) /* тарелка и кондиционер белые — приглушены сильнее */, transparent: true, alphaTest: 0.3, depthWrite: true });
      });
      BACK.forEach(function (p, i) {
        if (i % 4 === 1) return; // там уже 3D-бак
        var a = (i * 3 + 1) % 8, b = (i * 5 + 4) % 8; if (a === 0) a = 5; if (b === a) b = (b + 3) % 8;
        [[a, -0.24, 1.3], [b, 0.26, -0.9]].forEach(function (q) {
          var r = ROOF_ATLAS[q[0]], h = r[4], w = h * ((r[2] - r[0]) * kx) / ((r[3] - r[1]) * ky);
          var sp = new T.Sprite(mats[q[0]]); sp.center.set(0.5, 0); sp.scale.set(w, h, 1);
          sp.position.set(p[0] + p[2] * q[1], p[3] + 0.3, p[1] + q[2]); scene.add(sp);
        });
      });
    });

    // ---------- мурал: прожекторы снизу и абстрактный неоновый билборд на крыше ----------
    var muralSpots = [];
    [-1, 1].forEach(function (sd) {
      var sp = new T.SpotLight(0xfff0ff, 0, 30, 0.42, 0.6, 1.2); sp.position.set(sd * 5.5, 0.5, -26.5); sp.target.position.set(sd * 1.5, 7, -30.5); scene.add(sp, sp.target);
      var lampG = new T.Group(); lampG.position.set(sd * 5.5, 0, -26.5); scene.add(lampG);
      mesh(lathe([[0, 0], [0.35, 0], [0.38, 0.12], [0.1, 0.2], [0, 0.2]]), iron, 0, 0, 0, lampG);
      var head = mesh(new T.CylinderGeometry(0.28, 0.2, 0.55, 16, 1, true), chrome, 0, 0.55, 0, lampG); head.rotation.x = -0.9 * 1; head.rotation.z = -sd * 0.35;
      var beamMat = new T.MeshBasicMaterial({ color: 0xffd9ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false });
      var beamGeo = new T.CylinderGeometry(0.15, 2.4, 11, 24, 1, true); beamGeo.translate(0, 5.5, 0);
      var beam = new T.Mesh(beamGeo, beamMat); beam.position.set(sd * 5.5, 0.6, -26.5); beam.lookAt(sd * 1.5, 7, -30.5); beam.rotateX(Math.PI / 2); scene.add(beam);
      muralSpots.push({ sp: sp, beam: beamMat });
    });

    // ---------- гирлянды через улицу: одна на каждые 2 расписанные стены ----------
    var strands = [], bulbGeo = new T.SphereGeometry(0.11, 10, 8), bulbBase = new T.MeshBasicMaterial({ color: 0xffffff });
    [[3.0, 2], [-7.2, 4], [-17.2, 6]].forEach(function (s, si) {
      var n = 20, cols = [C.pink, C.yellow, C.green, C.teal], wire = [];
      for (var i = 0; i <= n; i++) { var t = i / n; wire.push(V(-4.4 + 8.8 * t, 6.3 - Math.sin(t * Math.PI) * 1.2, s[0])); }
      scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(wire), 40, 0.018, 4, false), iron));
      var im = new T.InstancedMesh(bulbGeo, bulbBase, n - 1), M = new T.Matrix4(), base = [];
      for (var b = 1; b < n; b++) { var p = wire[b]; M.makeTranslation(p.x, p.y - 0.14, p.z); im.setMatrixAt(b - 1, M); var c = new T.Color(cols[(b + si) % 4]); base.push(c); im.setColorAt(b - 1, c); }
      im.frustumCulled = false; scene.add(im);
      strands.push({ need: s[1], im: im, base: base, on: 0, tmp: new T.Color() });
    });

    // ---------- кованые фонари вдоль тротуаров (держат гирлянды) ----------
    var lampHeads = [];
    function lampPost(x, z, sd) {
      var g = new T.Group(); g.position.set(x, 0, z); scene.add(g);
      mesh(lathe([[0, 0], [0.26, 0], [0.26, 0.12], [0.14, 0.25], [0.1, 0.6], [0.07, 0.65], [0, 0.65]]), iron, 0, 0, 0, g);
      mesh(new T.CylinderGeometry(0.06, 0.08, 5.6, 10), iron, 0, 3.4, 0, g);
      [1.2, 3.0, 5.0].forEach(function (yy) { var r = mesh(new T.TorusGeometry(0.09, 0.025, 6, 16), iron, 0, yy, 0, g); r.rotation.x = Math.PI / 2; });
      var arm = new T.CatmullRomCurve3([V(0, 5.7, 0), V(-sd * 0.35, 6.25, 0), V(-sd * 0.8, 6.05, 0)]);
      g.add(new T.Mesh(new T.TubeGeometry(arm, 16, 0.035, 6, false), iron));
      var lg = new T.Group(); lg.position.set(-sd * 0.8, 5.55, 0); g.add(lg);
      mesh(new T.ConeGeometry(0.28, 0.22, 4), iron, 0, 0.5, 0, lg).rotation.y = Math.PI / 4;
      var glass = new T.MeshBasicMaterial({ color: 0xffd8a8 }); mesh(new T.CylinderGeometry(0.15, 0.1, 0.38, 4), glass, 0, 0.22, 0, lg).rotation.y = Math.PI / 4;
      mesh(new T.ConeGeometry(0.3, 0.1, 4), snowMat, 0, 0.63, 0, lg).rotation.y = Math.PI / 4;
      var gl = k.glow(0xffc9a0, 2.6); gl.position.set(-sd * 0.8, 5.75, 0); gl.material.opacity = 0.8; g.add(gl);
      var pool = k.glow(0xff9ad8, 4.5); pool.position.set(-sd * 0.8, 0.2, 0); pool.material.opacity = 0.16; g.add(pool);
      lampHeads.push(glass);
      return g;
    }
    [[3.0], [-7.2], [-17.2]].forEach(function (z) { lampPost(-4.4, z[0], -1); lampPost(4.4, z[0], 1); });
    [[-4.4, 8.5, -1], [4.4, -26.5, 1]].forEach(function (p) { lampPost(p[0], p[1], p[2]); });
    [[-4.4, 3.0], [4.4, -7.2], [-4.4, -17.2], [4.4, 3.0]].forEach(function (p) { var L = new T.PointLight(0xffc49a, 0.9, 10, 1.7); L.position.set(p[0] + (p[0] < 0 ? 0.8 : -0.8), 5.2, p[1]); scene.add(L); });

    // ---------- реквизит улицы: гидранты, баллончики, тележка с едой, мусорные баки, пар из люка ----------
    var red = new T.MeshStandardMaterial({ color: 0xd8203a, metalness: 0.35, roughness: 0.35, envMapIntensity: 1.1 });
    function hydrant(x, z) {
      var g = new T.Group(); g.position.set(x, 0, z); scene.add(g);
      mesh(lathe([[0, 0], [0.24, 0], [0.24, 0.08], [0.17, 0.12], [0.16, 0.62], [0.19, 0.66], [0.19, 0.72], [0.14, 0.78], [0.08, 0.9], [0.03, 0.95], [0, 0.95]], 20), red, 0, 0, 0, g);
      [-1, 1].forEach(function (sd) { var n = mesh(new T.CylinderGeometry(0.07, 0.07, 0.16, 10), red, sd * 0.22, 0.48, 0, g); n.rotation.z = Math.PI / 2; mesh(new T.CylinderGeometry(0.075, 0.075, 0.04, 6), chrome, sd * 0.31, 0.48, 0, g).rotation.z = Math.PI / 2; });
      mesh(new T.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), snowMat, 0, 0.86, 0, g).scale.y = 0.6;
    }
    hydrant(-4.6, 6.2); hydrant(4.7, -13.5);
    var canCols = [C.pink, C.yellow, C.green, C.purple, C.teal];
    function canSet(x, z, rot, n) {
      var g = new T.Group();
      for (var i = 0; i < (n || 5); i++) {
        var cg = new T.Group(), body = new T.MeshStandardMaterial({ color: canCols[(i + (x > 0 ? 2 : 0)) % canCols.length], metalness: 0.65, roughness: 0.22, envMapIntensity: 1.3 });
        mesh(lathe([[0, 0], [0.12, 0], [0.13, 0.02], [0.13, 0.4], [0.11, 0.46], [0.05, 0.5], [0.05, 0.53], [0, 0.53]], 18), body, 0, 0, 0, cg);
        mesh(new T.CylinderGeometry(0.035, 0.04, 0.05, 8), new T.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 }), 0, 0.55, 0, cg);
        var a = i * 1.7, r = 0.2 + (i % 2) * 0.24;
        cg.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        if (i === 3) { cg.rotation.z = Math.PI / 2; cg.position.y = 0.13; }
        g.add(cg);
      }
      g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g;
    }
    // тележка с горячими напитками у мурала (без надписей): полосатый тент, тёплая лампа
    (function cart() {
      var g = new T.Group(); g.position.set(4.9, 0, -26.8); g.rotation.y = -0.6; scene.add(g);
      var body = new T.MeshStandardMaterial({ color: 0xf939e3, metalness: 0.3, roughness: 0.3, envMapIntensity: 1.2 });
      mesh(rbox(1.9, 1.0, 1.0, 0.12), body, 0, 0.42, 0, g);
      mesh(rbox(2.0, 0.08, 1.1, 0.03), chrome, 0, 1.42, 0, g);
      [[-0.75, 0.5], [0.75, 0.5], [-0.75, -0.5], [0.75, -0.5]].forEach(function (q) { var w = mesh(new T.TorusGeometry(0.2, 0.06, 8, 18), iron, q[0], 0.22, q[1], g); });
      [[-0.9, 0.45], [0.9, 0.45], [-0.9, -0.45], [0.9, -0.45]].forEach(function (q) { mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 6), chrome, q[0], 2.0, q[1], g); });
      var stripe = k.tex(128, 32, function (gg, w, h) { for (var x = 0; x < w; x += 16) { gg.fillStyle = (x / 16) % 2 ? '#ffffff' : '#7645ba'; gg.fillRect(x, 0, 16, h); } gg.fillStyle = '#ffffff'; for (var x2 = 0; x2 < w; x2 += 16) { gg.beginPath(); gg.arc(x2 + 8, h, 8, Math.PI, 0); gg.fill(); } });
      var awn = mesh(new T.CylinderGeometry(1.3, 1.3, 2.2, 24, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ map: stripe, side: T.DoubleSide, roughness: 0.7 }), 0, 2.15, 0, g);
      awn.rotation.z = Math.PI / 2; awn.scale.set(0.42, 1, 0.55);
      mesh(new T.CylinderGeometry(1.3, 1.3, 2.2, 24, 1, true, 0, Math.PI), snowMat, 0, 2.2, 0, g).rotation.z = Math.PI / 2;
      g.children[g.children.length - 1].scale.set(0.42, 0.98, 0.45);
      var bulb = new T.MeshBasicMaterial({ color: 0xffd8a0 }); mesh(new T.SphereGeometry(0.09, 10, 8), bulb, 0, 1.7, 0.3, g);
      var gl = k.glow(0xffb070, 3.2); gl.position.set(0, 1.7, 0.4); gl.material.opacity = 0.7; g.add(gl);
      [-0.5, -0.2, 0.15].forEach(function (x, i) { mesh(new T.CylinderGeometry(0.07, 0.055, 0.18, 10), new T.MeshStandardMaterial({ color: [0xffffff, 0xf939e3, 0x2ee6ff][i], roughness: 0.4 }), x, 1.55, 0.2, g); });
    })();
    function bin(x, z, ry) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      mesh(rbox(1.4, 1.1, 0.9, 0.08), new T.MeshStandardMaterial({ color: 0x1f6a54, metalness: 0.45, roughness: 0.4, envMapIntensity: 1 }), 0, 0, 0, g);
      mesh(rbox(1.46, 0.14, 0.96, 0.05), snowMat, 0, 1.1, 0, g);
    }
    bin(5.3, -5.4, -0.5); bin(-5.2, -20.2, 0.6);
    // пар из люков
    var steam = [], steamTex = k.tex(64, 64, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    [[1.2, -2.5], [-1.4, -21]].forEach(function (p) {
      mesh(new T.CylinderGeometry(0.55, 0.55, 0.03, 24), iron, p[0], 0.015, p[1]);
      for (var i = 0; i < 9; i++) {
        var s = new T.Sprite(new T.SpriteMaterial({ map: steamTex, color: 0xd8c8ff, transparent: true, opacity: 0, depthWrite: false }));
        s.position.set(p[0], 0, p[1]); scene.add(s); steam.push({ s: s, x: p[0], z: p[1], ph: i / 9 });
      }
    });

    k.snow({ n: 1300, area: [44, 22, 56], center: [0, 0, -12], speed: 1.0, size: 0.16 });

    // ---------- Dexy (настоящий PNG бренда) с баллончиками — крупно на переднем плане ----------
    var dexy = genBoard('../../dexyplay/assets/gen/dexy-spray.png', '../../dexyplay/assets/dexy-full.png', 5.3); // поза с баллончиком (gen), иначе прежняя
    dexy.position.set(-2.5, 0, 12.0); scene.add(dexy);
    var dexyCans = canSet(-1.5, 10.8, 0.4, 5);
    var dexyGlow = k.glow(NEON.pink, 5); dexyGlow.position.y = 0.25; dexyGlow.material.opacity = 0.35; dexy.add(dexyGlow);
    var dexyTo = dexy.position.clone();
    canSet(4.9, -24.8, 1.2, 4); canSet(-5.0, -9.4, -0.4, 3);

    // ---------- брызги краски (вспышка при расписанной стене) ----------
    var drops = [];
    function spray(o) {
      var col = NEON[(o.tag && o.tag.neon) || 'pink'] || NEON.pink, wp = new T.Vector3().fromArray(o.front); o.inner.localToWorld(wp);
      var dir = new T.Vector3(0, 0, 1).applyAxisAngle(new T.Vector3(0, 1, 0), o.g.rotation.y);
      for (var i = 0; i < 34; i++) {
        var s = k.glow(col, 0.5 + Math.random() * 0.8); s.position.copy(wp).add(new T.Vector3((Math.random() - 0.5) * o.pw, (Math.random() - 0.5) * o.ph, 0).applyAxisAngle(new T.Vector3(0, 1, 0), o.g.rotation.y));
        scene.add(s);
        drops.push({ s: s, v: dir.clone().multiplyScalar(1 + Math.random() * 2.5).add(new T.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 2, (Math.random() - 0.5) * 1.5)), life: 1 });
      }
    }
    S.spray = spray;

    S.place = function (w, idx) {
      var o = S.walls[w.id];
      if (!o) {
        var d = dims(w), sp = SPOTS[w.id] || [idx % 2 ? 6.9 : -6.9, 4.6 - idx * 5, idx % 2 ? -0.85 : 0.85];
        o = building(w.id, d[0], d[1], idx);
        o.g.position.set(sp[0], 0, sp[1]); o.g.rotation.y = sp[2];
        if (w.practice) o.g.scale.setScalar(0.85);
        scene.add(o.g);
        var openIt = function () { if (S.onOpen) S.onOpen(w.id, S.levels.find(function (x) { return x.id === w.id; })); };
        o.lab = k.label(o.g, o.mural ? [0, o.h + 1.2, 0] : [0, 0.5, o.front[2] + 1.25], '', openIt); // у основания стены: дальние подписи не наползают
        k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
        S.walls[w.id] = o;
      }
      return o;
    };

    // ---------- анимация ----------
    var lastSkyN = -1;
    k.onFrame(function (t, dt) {
      S.t = t;
      var prog = S.litN / 6;
      if (S.litN !== lastSkyN) { lastSkyN = S.litN; S.redrawSky(); }
      backMats.forEach(function (m, i) { m.emissiveIntensity = 0.12 + prog * 0.32 + (S.allLit ? 0.04 * Math.sin(t * 1.5 + i) : 0); });
      S.neonAll.forEach(function (n) { setLvl(n.m, 0.35 + prog * 0.75 + 0.15 * Math.sin(t * 2.2 + n.ph)); });
      blinkers.forEach(function (m, i) { m.color.setHex(Math.sin(t * 3 + i) > 0.4 ? 0xff3a6a : 0x2a0810); });
      strands.forEach(function (st) {
        st.on += ((S.litN >= st.need ? 1 : 0) - st.on) * Math.min(1, dt * 2);
        for (var b = 0; b < st.base.length; b++) { var v = 0.06 + st.on * (0.75 + 0.35 * Math.sin(t * 3 + b * 1.1)); st.tmp.copy(st.base[b]).multiplyScalar(v); st.im.setColorAt(b, st.tmp); }
        st.im.instanceColor.needsUpdate = true;
      });
      // прожекторы на мурал — когда он расписан
      var mo = S.walls.mural, ml = mo ? mo.lit : 0;
      muralSpots.forEach(function (m) { m.sp.intensity = 0.4 + ml * 2.2; m.beam.opacity = 0.04 + ml * 0.08; });
      Object.keys(S.walls).forEach(function (id) {
        var o = S.walls[id];
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        if (o.reveal < 1) { o.reveal = Math.min(1, o.reveal + dt * 0.9); paint(o, o.reveal); }
        var cur = S.current === id;
        o.ring.material.opacity += ((cur ? 0.85 : o.hover ? 0.4 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.03);
        var sc = 1 + o.hover * 0.03; o.inner.scale.x += (sc - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        // дом возвращает цвет, когда стена расписана
        tmpC.copy(o.grey).lerp(o.full, o.lit); o.bodyMat.color.copy(tmpC);
        var buzz = o.lit * (0.92 + 0.08 * Math.sin(t * 9 + o.g.position.z));
        o.panelMat.emissiveIntensity = o.tag ? buzz * (o.mural ? 0.5 : 0.75) : 0; // ярче — bloom выжигает пиксель-картинку в пятно
        setLvl(o.tubeMat, 0.05 + buzz * 1.1);
        if (o.bladeMat) setLvl(o.bladeMat, 0.25 + o.lit * 0.85 + 0.1 * Math.sin(t * 2 + o.g.position.z));
        o.spill.material.opacity = o.lit * 0.18;
        o.panelGlow.material.opacity = o.lit * (o.mural ? 0.06 : 0.12);
        o.winMatA.emissiveIntensity = 0.3 + o.lit * 0.55;
        o.winMatB.emissiveIntensity = 0.12 + o.lit * 0.9;
        // рамка: в работе — жёлтая пульсирует; готова — фиолетовая; расписана — неон; закрыта — тусклая
        var fCol = o.state === 'active' ? NEON.yellow : o.tag ? (NEON[o.tag.neon] || NEON.pink) : 0x9a6ae0;
        o.frameMat.userData.base.setHex(fCol);
        setLvl(o.frameMat, o.state === 'active' ? 0.8 + 0.4 * Math.sin(t * 5) : o.tag ? 0.4 + buzz * 0.8 : o.open ? 0.6 : 0.15);
      });
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i]; d.life -= dt * 0.8; d.v.y -= dt * 3; d.s.position.addScaledVector(d.v, dt);
        d.s.material.opacity = Math.max(0, d.life);
        if (d.life <= 0) { scene.remove(d.s); drops.splice(i, 1); }
      }
      steam.forEach(function (st) {
        var u = (t * 0.22 + st.ph) % 1;
        st.s.position.set(st.x + Math.sin(u * 6 + st.ph * 9) * 0.3, 0.2 + u * 3.2, st.z);
        var sz = 0.8 + u * 2.4; st.s.scale.set(sz, sz, 1); st.s.material.opacity = Math.sin(u * Math.PI) * 0.22;
      });
      dexy.position.lerp(dexyTo, Math.min(1, dt * 1.4));
      dexyCans.position.set(dexy.position.x + 1.0, 0, dexy.position.z + 0.4);
      dexyGlow.material.opacity = 0.3 + 0.1 * Math.sin(t * 2);
    });
    S.dexyTarget = function (x, z) { dexyTo.set(x, 0, z); };
    S._setTag = setTag;

    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F;
      k.camera.fov = F.fov; k.camera.zoom = F.t > 0 ? F.zoom : 1;
      dexy.scale.setScalar(1 + 0.2 * F.t); // на телефоне Dexy крупнее
      k.camera.updateProjectionMatrix();
      if (!S.camKey) { k.look(F.pos, F.look, 0); S.camKey = 'all'; } // сразу в план под пропорции, без перелёта
      else if (changed && S.camKey === 'all') k.look(F.pos, F.look, 0.4);
    });

    // плашка эфира поверх сцены
    var live = document.createElement('div'); live.className = 'c3d-live'; live.innerHTML = '<b>Live</b><span></span>';
    box.appendChild(live); S.liveCount = live.lastChild;
    return S;
  }

  // ======================================================================================================
  function render(el, walls, opts) {
    opts = opts || {};
    var S = el._c3d;
    if (!S) {
      if (!supported()) return window.TagCity ? TagCity.render(el, walls, opts) : null;
      css();
      el.innerHTML = '';
      el.classList.add('c3d');
      S = build(el);
      if (!S) { el.classList.remove('c3d'); return window.TagCity ? TagCity.render(el, walls, opts) : null; }
      el._c3d = S;
    }
    if (S.k.debug('lit')) walls = walls.map(function (w) {
      var tg = w.tagged;
      if (!tg) { var rows = DEMO[w.id] || DEMO.w1; tg = { name: 'tagged', W: rows[0].length, H: rows.length, grid: rows.join('').split('').map(function (c) { return c === '#' ? 1 : 0; }), neon: WALL_NEON[w.id] || 'pink' }; }
      return Object.assign({}, w, { status: 'tagged', tagged: tg });
    });
    S.levels = walls; S.onOpen = opts.onOpen; S.current = opts.current || null;
    var litN = 0;
    walls.forEach(function (w, idx) {
      var o = S.place(w, idx);
      var tagged = w.status === 'tagged';
      var open = tagged || w.status === 'active' || !w.can || w.can.ok;
      o.state = w.status; o.open = open;
      o.target = tagged ? 1 : 0;
      if (tagged && w.tagged && w.tagged.grid) S._setTag(o, w.tagged);
      else if (!tagged && o.tag) S._setTag(o, null);
      if (tagged && !w.practice && !w.mural) litN++;
      var name = w.practice ? 'Practice' : w.mural ? 'Mural' : w.title;
      o.lab.set(name + '<small>' + esc(sub(w)) + '</small>');
      o.lab.el.setAttribute('aria-label', (w.title || name) + ': ' + sub(w));
      o.lab.el.style.setProperty('--n', NEON_CSS[(w.tagged && w.tagged.neon) || WALL_NEON[w.id]] || NEON_CSS.green);
      o.lab.cls('tagged', tagged); o.lab.cls('locked', !open); o.lab.cls('ready', open && !tagged); o.lab.cls('cur', S.current === w.id);
    });
    S.litN = litN; S.allLit = litN >= 6;
    S.liveCount.innerHTML = '<i>' + litN + '</i>/6 walls lit';
    // камера и Dexy — к текущей стене, иначе общий план
    var T = S.k.T, cur = S.current && S.walls[S.current];
    if (cur) {
      var p = cur.g.position, front = new T.Vector3(0, 0, 3.4).applyAxisAngle(new T.Vector3(0, 1, 0), cur.g.rotation.y);
      var key = 'cur:' + S.current;
      if (S.camKey !== key) {
        S.camKey = key;
        if (cur.mural) S.k.look([0, 6.5, p.z + 22], [0, 6.0, p.z], 1.6);
        else S.k.look([p.x * 0.4 + front.x * 1.3, 4.6, p.z + 11.5], [p.x * 0.8, 2.8, p.z - 1], 1.6);
      }
      var side = p.x < 0 ? 1 : p.x > 0 ? -1 : 0;
      S.dexyTarget(p.x + front.x * 1.15 + side * 1.6, p.z + front.z * 1.15 + (cur.mural ? 0 : 0.6));
    } else {
      if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.6); }
      S.dexyTarget(-2.5, 12.0);
    }
    return S;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function flick(el, id) {
    var S = el && el._c3d;
    if (!S) return window.TagCity ? TagCity.flick.apply(null, arguments) : null;
    var o = S.walls[id]; if (!o) return;
    o.reveal = 0; o.lit = 0.35; o.target = 1;
    S.spray(o);
  }

  window.TagCity3D = { render: render, flick: flick, supported: supported };
})();
