/**
 * 3D-улица Tag the City (DexyPlay, Dexy's Holiday Stream) на ядре _3d/ny3d.js. Тот же интерфейс, что у 2D city.js:
 *   TagCity3D.render(el, walls, { current, onOpen(id, wall) })   — первый вызов строит сцену, дальше только обновляет
 *   TagCity3D.flick(el, id)                                       — стену только что расписали: неон проявляется, брызги краски
 *   TagCity3D.supported()                                         — есть ли WebGL (иначе страница рисует 2D TagCity)
 * Сюжет: город посерел, у Dexy баллончики. Ночная улица, по сторонам кирпичные дома, на фасаде каждого — пустая стена-холст
 * с сеткой головоломки. Расписанная стена горит неоновой пиксель-картинкой (та, что игрок решил), дом возвращает цвет,
 * неоновая полоса по карнизу и окна загораются. Через улицу гирлянды (по одной на каждые 2 стены), в конце улицы — большой
 * дом с муралом, за ним город: чем больше стен, тем больше окон горит. Dexy стоит у текущей стены.
 */
(function () {
  'use strict';
  var NEON = { pink: 0xf939e3, yellow: 0xffe733, green: 0x33ff8f };
  var NEON_CSS = { pink: '#F939E3', yellow: '#FFE733', green: '#33FF8F' };
  var WALL_NEON = { practice: 'pink', w1: 'pink', w2: 'yellow', w3: 'green', w4: 'yellow', w5: 'green', w6: 'pink', mural: 'yellow' };
  // кирпич домов: насыщенные цвета бренда (фиолетовый, малиновый, синий, бирюзовый); нерасписанный дом — приглушённый
  var BRICKS = [0x6a2fa0, 0xa02a6a, 0x2f3fa8, 0x1f7f8a, 0x8a2fa8, 0xb03a50, 0x3a2fa0, 0x7a2fa0];
  // места: [x, z, поворот] — слева практика и чётные стены, справа нечётные, мурал в конце улицы
  var SPOTS = { practice: [-6.9, 4.6, 0.85], w1: [6.9, 0.4, -0.85], w2: [-6.9, -4.6, 0.85], w3: [6.9, -9.6, -0.85], w4: [-6.9, -14.6, 0.85], w5: [6.9, -19.6, -0.85], w6: [-6.9, -24.6, 0.85], mural: [0, -33, 0] };
  var CAM = { pos: [0, 20.5, 27], look: [0, 0, -8.5] };
  var CAM_TALL = { pos: [0, 27, 15], look: [0, 0, -12.5] };
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
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 42 + 16 * t, zoom: Math.max(0.74, Math.min(0.9, a / 1.6)) }; // средние пропорции — чуть шире, чтобы мурал и Dexy влезали
  }
  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function css() {
    if (document.getElementById('c3d-css')) return;
    var s = document.createElement('style'); s.id = 'c3d-css';
    s.textContent =
      '.c3d{height:clamp(520px,86vh,980px);margin:0 0 16px;background:#0C0713;box-shadow:inset 0 0 0 1px rgba(118,69,186,.45)}' +
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
      bg: 0x0c0713, fog: [0x1a0b2c, 36, 92], exposure: 1.0,
      env: [0x2a1450, 0xf939e3, 0x1a3a7a, 0x0c0713], cam: { pos: CAM.pos, look: CAM.look, fov: 42 }, designAspect: 2, minZoom: 0.42, parallax: 0.9,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, walls: {}, litN: 0, t: 0 };
    var tmpC = new T.Color();

    // ---------- небо: фиолетовая ночь, у горизонта розовое зарево города ----------
    scene.background = k.tex(4, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#04020a'); gr.addColorStop(0.5, '#160a30'); gr.addColorStop(0.82, '#3a1258'); gr.addColorStop(1, '#6a1f6e');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });

    // ---------- свет ----------
    scene.add(new T.HemisphereLight(0x6a58e0, 0x1a0a28, 0.46));
    var moon = new T.DirectionalLight(0xa89aff, 0.42); moon.position.set(-14, 24, 12); scene.add(moon);

    // ---------- земля, дорога, тротуары ----------
    var snowTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#d6d4ec'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { var v = 196 + Math.random() * 59 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 4) + ',' + (v + 14) + ',.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping; snowTex.repeat.set(10, 10);
    var ground = new T.Mesh(new T.PlaneGeometry(170, 170), new T.MeshStandardMaterial({ color: 0x302a78, map: snowTex, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground);
    // мокрый асфальт: отражает фиолетово-розовое окружение
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#2a2236'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 4000; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = 'rgba(255,231,51,.55)'; for (var y = 0; y < h; y += 64) g.fillRect(w / 2 - 4, y, 8, 34); // разметка
      var e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(214,212,236,.95)'); e.addColorStop(0.1, 'rgba(214,212,236,0)'); e.addColorStop(0.9, 'rgba(214,212,236,0)'); e.addColorStop(1, 'rgba(214,212,236,.95)');
      g.fillStyle = e; g.fillRect(0, 0, w, h);
    });
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 4);
    var road = new T.Mesh(new T.PlaneGeometry(7.4, 50), new T.MeshStandardMaterial({ map: roadTex, roughness: 0.32, metalness: 0.35 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -12); scene.add(road);
    var curbMat = new T.MeshStandardMaterial({ color: 0x4a4068, roughness: 0.8 });
    [-1, 1].forEach(function (sd) { var c = new T.Mesh(new T.BoxGeometry(0.35, 0.16, 50), curbMat); c.position.set(sd * 3.85, 0.08, -12); scene.add(c); });

    // ---------- город на горизонте: окна загораются с прогрессом ----------
    var winTexCity = k.tex(128, 256, function (g, w, h) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      var cols = ['#ffe9b0', '#ffe733', '#f939e3', '#7fe9ff', '#ffffff'];
      for (var y = 8; y < h - 8; y += 14) for (var x = 6; x < w - 6; x += 12) {
        if (Math.random() < 0.2) { g.fillStyle = cols[Math.random() * cols.length | 0]; g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillRect(x, y, 7, 8); }
      }
      g.globalAlpha = 1;
    });
    var skyline = [];
    for (var i = 0; i < 22; i++) {
      var bw = 5 + Math.random() * 7, bh = 12 + Math.random() * 22, bd = 5 + Math.random() * 4;
      var tx = winTexCity.clone(); tx.needsUpdate = true; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(Math.max(1, bw / 6), Math.max(1, bh / 12));
      var m = new T.MeshStandardMaterial({ color: [0x1c1438, 0x221034, 0x141a3c][i % 3], emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.25, roughness: 0.8 });
      var b = new T.Mesh(new T.BoxGeometry(bw, bh, bd), m);
      var x = -50 + i * 4.8 + (Math.random() - 0.5) * 2, z = -62 - Math.random() * 16;
      if (Math.abs(x) < 9) z -= 6; // за муралом — дальше, чтобы не спорили
      b.position.set(x, bh / 2, z); scene.add(b);
      skyline.push(m);
    }
    var signs = []; // вывески и неоновые полосы — общая анимация
    // второй ряд домов за улицей: квартал, а не пустой снег (окна загораются с прогрессом, как горизонт)
    var blockTex = winTexCity.clone(); blockTex.needsUpdate = true; blockTex.wrapS = blockTex.wrapT = T.RepeatWrapping;
    var blockCols = [0x2a1a5a, 0x3a1650, 0x1a2a60, 0x2a1240, 0x22204e];
    var BACK = [[-14, 9, 6, 5], [-15, 1, 7, 8], [-13.5, -7, 6, 8], [-15, -15, 7, 15], [-13.5, -23, 6, 10], [-12, -31, 7, 16],
                [14, 6, 6, 6], [15, -2, 7, 7], [13.5, -10, 6, 14], [15, -18, 7, 9], [13.5, -26, 6, 13], [12, -32, 7, 18], [-20.5, -3, 6, 12], [20.5, -12, 6, 20], [-21, -20, 6, 16], [21, 2, 6, 8]];
    BACK.forEach(function (p, i) {
      var tx = blockTex.clone(); tx.needsUpdate = true; tx.repeat.set(1, Math.max(1, p[3] / 8));
      var m = new T.MeshStandardMaterial({ color: blockCols[i % blockCols.length], map: brickTex, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.3, roughness: 0.85 });
      var b = new T.Mesh(new T.BoxGeometry(p[2], p[3], 6), m); b.position.set(p[0], p[3] / 2, p[1]); scene.add(b);
      var cap = new T.Mesh(new T.BoxGeometry(p[2] + 0.2, 0.2, 6.2), new T.MeshStandardMaterial({ color: 0x3a3474, roughness: 0.9 })); cap.position.set(p[0], p[3] + 0.1, p[1]); scene.add(cap);
      skyline.push(m);
      // неоновая полоса по углу некоторых домов (абстрактно, без букв)
      if (i % 3 === 0) {
        var col = [NEON.pink, NEON.green, NEON.yellow][(i / 3) % 3 | 0];
        var nm = new T.MeshStandardMaterial({ color: 0x110818, emissive: col, emissiveIntensity: 0.5 });
        var bar = new T.Mesh(new T.BoxGeometry(0.16, p[3] * 0.6, 0.16), nm); bar.position.set(p[0] + (p[0] < 0 ? p[2] / 2 : -p[2] / 2), p[3] * 0.55, p[1] + 3.02); scene.add(bar);
        var gl = k.glow(col, 3); gl.position.copy(bar.position); gl.position.z += 0.3; gl.material.opacity = 0.2; scene.add(gl);
        signs.push({ m: nm, gl: gl, ph: i });
      }
    });

    // абстрактные неоновые вывески на крышах (полосы и кольца, без букв)
    [[-30, 26, -66, 0], [-14, 22, -72, 1], [18, 28, -68, 2], [34, 20, -64, 0], [-40, 18, -62, 2], [8, 31, -78, 1]].forEach(function (p, i) {
      var col = [NEON.pink, NEON.yellow, NEON.green][p[3]];
      var mat = new T.MeshStandardMaterial({ color: 0x110818, emissive: col, emissiveIntensity: 0.4 });
      var g = new T.Group();
      if (i % 2) { var r = new T.Mesh(new T.TorusGeometry(1.4, 0.16, 8, 32), mat); g.add(r); }
      else for (var j = 0; j < 3; j++) { var bar = new T.Mesh(new T.BoxGeometry(4.2 - j * 1.1, 0.26, 0.2), mat); bar.position.y = j * 0.7; g.add(bar); }
      var gl = k.glow(col, 7); gl.material.opacity = 0.25; g.add(gl);
      g.position.set(p[0], p[1], p[2]); scene.add(g);
      signs.push({ m: mat, gl: gl, ph: i * 1.3 });
    });

    // ---------- текстуры домов ----------
    var brickTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#8a8496'; g.fillRect(0, 0, w, h);
      var bh = 16, bw = 42;
      for (var y = 0, r = 0; y < h; y += bh, r++) for (var x = (r % 2) * -bw / 2; x < w; x += bw) {
        var v = 205 + Math.random() * 50 | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      }
    });
    brickTex.wrapS = brickTex.wrapT = T.RepeatWrapping; brickTex.repeat.set(2.5, 3.2);
    var winTex = k.tex(64, 64, function (g, w, h) {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#000'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h / 2 - 3, w, 6); g.lineWidth = 6; g.strokeRect(0, 0, w, h);
    });
    var snowMat = new T.MeshStandardMaterial({ color: 0x5a529a, roughness: 0.9, flatShading: true });
    var darkMetal = new T.MeshStandardMaterial({ color: 0x1c1428, metalness: 0.7, roughness: 0.4 });
    var trimMat = new T.MeshStandardMaterial({ color: 0x2a2038, roughness: 0.7 });

    // пустая стена: серый бетон, мелом размечена сетка головоломки
    function blankTex(W, H) {
      var px = 40, cw = W * px, ch = H * px;
      return k.tex(cw + 16, ch + 16, function (g, w, h) {
        g.fillStyle = '#5a5468'; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 1400; i++) { var v = 70 + Math.random() * 40 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + (v + 10) + ',.5)'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
        g.strokeStyle = 'rgba(240,236,255,.32)'; g.lineWidth = 2;
        for (var x = 0; x <= W; x++) { g.beginPath(); g.moveTo(8 + x * px, 8); g.lineTo(8 + x * px, 8 + ch); g.stroke(); }
        for (var y = 0; y <= H; y++) { g.beginPath(); g.moveTo(8, 8 + y * px); g.lineTo(8 + cw, 8 + y * px); g.stroke(); }
      });
    }
    // расписанная стена: неоновые клетки по решённой сетке; reveal 0..1 — сколько клеток уже «прокрашено»
    function paint(o, reveal) {
      var t = o.tag; if (!t) return;
      var c = o.paintCanvas, g = c.getContext('2d'), px = o.px, W = t.W, H = t.H, col = NEON_CSS[t.neon] || NEON_CSS.pink;
      g.fillStyle = '#140a20'; g.fillRect(0, 0, c.width, c.height);
      g.strokeStyle = 'rgba(201,188,221,.12)'; g.lineWidth = 2;
      for (var x = 0; x <= W; x++) { g.beginPath(); g.moveTo(8 + x * px, 8); g.lineTo(8 + x * px, 8 + H * px); g.stroke(); }
      for (var y = 0; y <= H; y++) { g.beginPath(); g.moveTo(8, 8 + y * px); g.lineTo(8 + W * px, 8 + y * px); g.stroke(); }
      var filled = []; t.grid.forEach(function (v, i) { if (v === 1) filled.push(i); });
      var n = Math.round(filled.length * reveal);
      for (var f = 0; f < n; f++) {
        var i2 = filled[f], cx = 8 + (i2 % W) * px, cy = 8 + Math.floor(i2 / W) * px;
        g.fillStyle = col; g.fillRect(cx + 3, cy + 3, px - 6, px - 6);
        g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(cx + px * 0.34, cy + px * 0.34, px * 0.32, px * 0.32);
      }
      o.paintTex.needsUpdate = true;
    }

    var poolTex = k.tex(128, 128, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    function prism(r, len, mat, sy) { var geo = new T.CylinderGeometry(r, r, len, 3, 1); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI); var m = new T.Mesh(geo, mat); m.scale.y = sy; return m; }

    // ---------- дом со стеной-холстом ----------
    function building(id, W, H, v) {
      var mural = id === 'mural';
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var bw = mural ? 13 : 4.8 + (v % 2) * 0.4, bh = mural ? 12.2 : 5.8 + (v % 3) * 0.7, bd = mural ? 4.5 : 3.8;
      var full = new T.Color(BRICKS[v % BRICKS.length]), grey = full.clone().lerp(new T.Color(0x5a5866), 0.55);
      var bodyMat = new T.MeshStandardMaterial({ color: grey.clone(), map: brickTex, roughness: 0.88 });
      var body = new T.Mesh(new T.BoxGeometry(bw, bh, bd), bodyMat); body.position.y = bh / 2; inner.add(body);
      // карниз + снег на крыше
      var ledge = new T.Mesh(new T.BoxGeometry(bw + 0.3, 0.3, bd + 0.3), trimMat); ledge.position.y = bh + 0.15; inner.add(ledge);
      var roofSnow = new T.Mesh(new T.BoxGeometry(bw + 0.2, 0.18, bd + 0.2), snowMat); roofSnow.position.y = bh + 0.38; inner.add(roofSnow);
      // на крыше: бак для воды или вентиляция
      if (!mural && v % 2 === 0) {
        var tank = new T.Group();
        var cyl = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 1.3, 14), new T.MeshStandardMaterial({ color: 0x6a4a3a, roughness: 0.85 })); cyl.position.y = 1.55; tank.add(cyl);
        var cone = new T.Mesh(new T.ConeGeometry(0.85, 0.6, 14), snowMat); cone.position.y = 2.5; tank.add(cone);
        [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(function (q) { var leg = new T.Mesh(new T.BoxGeometry(0.1, 0.9, 0.1), darkMetal); leg.position.set(q[0], 0.45, q[1]); tank.add(leg); });
        tank.position.set(-bw * 0.22, bh + 0.45, -bd * 0.15); inner.add(tank);
      } else if (!mural) {
        var ac = new T.Mesh(new T.BoxGeometry(1.1, 0.6, 0.9), new T.MeshStandardMaterial({ color: 0x8a8aa0, roughness: 0.5, metalness: 0.4 })); ac.position.set(bw * 0.2, bh + 0.75, -bd * 0.1); inner.add(ac);
      }
      // холст на фасаде (+z)
      var pw, ph, py;
      if (mural) { ph = 8.8; pw = ph * W / H; py = 0.9 + ph / 2; } else { pw = ph = 3.2; py = 0.75 + ph / 2; }
      var fz = bd / 2 + 0.02;
      var panelMat = new T.MeshStandardMaterial({ map: blankTex(W, H), color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.75 });
      var panel = new T.Mesh(new T.PlaneGeometry(pw, ph), panelMat); panel.position.set(0, py, fz); inner.add(panel);
      // рамка холста: цвет по состоянию (готова / в работе / расписана)
      var frameMat = new T.MeshStandardMaterial({ color: 0x1a1024, emissive: 0x7645ba, emissiveIntensity: 0.3, roughness: 0.5 });
      [[0, ph / 2 + 0.07, pw + 0.28, 0.14], [0, -ph / 2 - 0.07, pw + 0.28, 0.14], [-pw / 2 - 0.07, 0, 0.14, ph], [pw / 2 + 0.07, 0, 0.14, ph]].forEach(function (f) {
        var bar = new T.Mesh(new T.BoxGeometry(f[2], f[3], 0.08), frameMat); bar.position.set(f[0], py + f[1], fz + 0.03); inner.add(bar);
      });
      // окна: над холстом (у мурала — по бокам)
      var winMat = new T.MeshStandardMaterial({ color: 0x1a1428, emissive: 0xffd08a, emissiveMap: winTex, emissiveIntensity: 0.15, roughness: 0.3, metalness: 0.2 });
      var wins = [];
      if (mural) { for (var r = 0; r < 4; r++) [-1, 1].forEach(function (sd) { wins.push([sd * (bw / 2 - 1.3), 2.2 + r * 2.6]); }); }
      else { var top = py + ph / 2 + 0.55; for (var r2 = 0; top + 0.5 + r2 * 1.2 < bh - 0.2; r2++) [-0.95, 0.95].forEach(function (xx) { wins.push([xx, top + 0.45 + r2 * 1.2]); }); }
      wins.forEach(function (p) { var w = new T.Mesh(new T.PlaneGeometry(0.75, 0.85), winMat); w.position.set(p[0], p[1], fz); inner.add(w); });
      // пожарная лестница сбоку (обычные дома)
      if (!mural) {
        var sx = (v % 2 ? -1 : 1) * (bw / 2 + 0.01);
        for (var fl = 0; fl < 2; fl++) {
          var plat = new T.Mesh(new T.BoxGeometry(0.05, 0.06, 1.8), darkMetal); plat.position.set(sx + (sx > 0 ? 0.45 : -0.45), 2.6 + fl * 2, 0); inner.add(plat);
          var plat2 = new T.Mesh(new T.BoxGeometry(0.9, 0.06, 1.8), darkMetal); plat2.position.set(sx + (sx > 0 ? 0.45 : -0.45), 2.6 + fl * 2, 0); inner.add(plat2);
          var rail = new T.Mesh(new T.BoxGeometry(0.04, 0.6, 1.8), darkMetal); rail.position.set(sx + (sx > 0 ? 0.88 : -0.88), 2.9 + fl * 2, 0); inner.add(rail);
        }
      }
      // неоновая полоса по карнизу (горит, когда стена расписана)
      var neonMat = new T.MeshStandardMaterial({ color: 0x1a1024, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.4 });
      var tube = new T.Mesh(new T.BoxGeometry(bw + 0.34, 0.1, 0.1), neonMat); tube.position.set(0, bh - 0.05, bd / 2 + 0.17); inner.add(tube);
      var tubeGlows = [];
      for (var tg = 0; tg < (mural ? 7 : 3); tg++) { var gl = k.glow(0xffffff, mural ? 3.4 : 2.4); gl.position.set(-bw / 2 + (bw * (tg + 0.5)) / (mural ? 7 : 3), bh - 0.05, bd / 2 + 0.3); gl.material.opacity = 0; inner.add(gl); tubeGlows.push(gl); }
      // свечение неона на снег перед стеной + цветной свет
      var spill = new T.Mesh(new T.PlaneGeometry(mural ? 13 : 6.4, mural ? 7 : 4.4), new T.MeshBasicMaterial({ map: poolTex, color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
      spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.04, fz + (mural ? 3 : 2)); inner.add(spill); // неон на снегу перед стеной
      var panelGlow = k.glow(0xffffff, mural ? 11 : 5.2); panelGlow.position.set(0, py, fz + 0.5); panelGlow.material.opacity = 0; inner.add(panelGlow);
      var light = new T.PointLight(0xffffff, 0, mural ? 20 : 11, 2); light.position.set(0, py, fz + 2.2); inner.add(light);
      // кольцо «текущая стена»
      var ring = new T.Mesh(new T.RingGeometry(mural ? 4.4 : 2.5, mural ? 4.7 : 2.75, 48), new T.MeshBasicMaterial({ color: 0xffe733, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.05, bd / 2 + (mural ? 3.2 : 1.9)); g.add(ring);
      return {
        g: g, inner: inner, id: id, mural: mural, W: W, H: H, full: full, grey: grey, bodyMat: bodyMat, panel: panel, panelMat: panelMat, frameMat: frameMat,
        winMat: winMat, neonMat: neonMat, tubeGlows: tubeGlows, spill: spill, panelGlow: panelGlow, light: light, ring: ring,
        front: [0, py, fz], pw: pw, ph: ph, h: bh + 0.5, lit: 0, target: 0, reveal: 1, hover: 0, tag: null, tagKey: '',
      };
    }

    // расписанная стена: своя текстура-холст с неоном
    function setTag(o, tag) {
      var key = tag ? tag.W + 'x' + tag.H + ':' + tag.grid.join('') + ':' + tag.neon : '';
      if (key === o.tagKey) return;
      o.tagKey = key; o.tag = tag;
      if (!tag) { o.panelMat.map = blankTex(o.W, o.H); o.panelMat.emissiveMap = null; o.panelMat.needsUpdate = true; return; }
      var px = 40;
      if (!o.paintCanvas || o.px !== px || o.paintW !== tag.W || o.paintH !== tag.H) {
        o.paintCanvas = document.createElement('canvas'); o.paintCanvas.width = tag.W * px + 16; o.paintCanvas.height = tag.H * px + 16;
        o.paintTex = new T.CanvasTexture(o.paintCanvas); if (T.sRGBEncoding) o.paintTex.encoding = T.sRGBEncoding;
        o.px = px; o.paintW = tag.W; o.paintH = tag.H;
      }
      paint(o, o.reveal);
      o.panelMat.map = o.paintTex; o.panelMat.emissiveMap = o.paintTex; o.panelMat.needsUpdate = true;
      var col = NEON[tag.neon] || NEON.pink;
      o.neonMat.emissive.setHex(col); o.light.color.setHex(col); o.spill.material.color.setHex(col); o.panelGlow.material.color.setHex(col);
      o.tubeGlows.forEach(function (gl) { gl.material.color.setHex(col); });
    }

    // ---------- гирлянды через улицу: одна на каждые 2 расписанные стены ----------
    var strands = [];
    [[3.0, 2], [-7.2, 4], [-17.2, 6]].forEach(function (s, si) {
      var bulbs = [], n = 15, cols = [NEON.pink, NEON.yellow, NEON.green];
      var wire = []; for (var i = 0; i <= n; i++) { var t = i / n, x = -4.6 + 9.2 * t, y = 6.2 - Math.sin(t * Math.PI) * 1.1; wire.push(new T.Vector3(x, y, s[0])); }
      var line = new T.Line(new T.BufferGeometry().setFromPoints(wire), new T.LineBasicMaterial({ color: 0x0c0713 })); scene.add(line);
      [-1, 1].forEach(function (sd) { var pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 6.4, 8), darkMetal); pole.position.set(sd * 4.6, 3.2, s[0]); scene.add(pole); });
      for (var b = 1; b < n; b++) {
        var p = wire[b], col = cols[(b + si) % 3];
        var mat = new T.MeshStandardMaterial({ color: 0x1a1024, emissive: col, emissiveIntensity: 0.1, roughness: 0.4 });
        var m = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), mat); m.position.set(p.x, p.y - 0.15, p.z); scene.add(m);
        var gl = k.glow(col, 1.1); gl.position.copy(m.position); gl.material.opacity = 0; scene.add(gl);
        bulbs.push({ m: mat, gl: gl, i: b });
      }
      strands.push({ need: s[1], bulbs: bulbs, on: 0 });
    });

    // ---------- фонари вдоль тротуаров (тёплые, горят всегда) ----------
    [6.5, -2.5, -12, -21.5].forEach(function (z, i) {
      var sd = i % 2 ? 1 : -1, g = new T.Group();
      var pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 4, 8), darkMetal); pole.position.y = 2; g.add(pole);
      var head = new T.Mesh(new T.BoxGeometry(0.7, 0.12, 0.3), darkMetal); head.position.set(-sd * 0.3, 4, 0); g.add(head);
      var gl = k.glow(0xffc9a0, 2.4); gl.position.set(-sd * 0.5, 3.85, 0); gl.material.opacity = 0.8; g.add(gl);
      var pool = k.glow(0xff9ad8, 4); pool.position.set(-sd * 0.8, 0.2, 0); pool.material.opacity = 0.18; g.add(pool);
      g.position.set(sd * 4.3, 0, z); scene.add(g);
    });

    // мусорные баки и баллончики — улица граффити (без надписей)
    function canSet(x, z, rot) {
      var g = new T.Group(), cols = [NEON.pink, NEON.yellow, NEON.green, 0x7645ba, 0x2eaaff];
      for (var i = 0; i < 4; i++) {
        var can = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.46, 12), new T.MeshStandardMaterial({ color: cols[(i + (x > 0 ? 2 : 0)) % cols.length], metalness: 0.5, roughness: 0.3 }));
        var cap = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.1, 10), new T.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 }));
        var a = i * 1.7, r = 0.18 + (i % 2) * 0.25;
        can.position.set(Math.cos(a) * r, 0.23, Math.sin(a) * r); cap.position.set(can.position.x, 0.5, can.position.z);
        if (i === 3) { can.rotation.z = Math.PI / 2; can.position.y = 0.12; cap.position.set(can.position.x + 0.27, 0.12, can.position.z); cap.rotation.z = Math.PI / 2; }
        g.add(can); g.add(cap);
      }
      g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g); return g;
    }
    var bin = new T.Mesh(new T.BoxGeometry(1.4, 1.1, 0.9), new T.MeshStandardMaterial({ color: 0x1f5a4a, roughness: 0.6, metalness: 0.3 }));
    bin.position.set(5.2, 0.55, -5.4); bin.rotation.y = -0.5; scene.add(bin);
    var binSnow = new T.Mesh(new T.BoxGeometry(1.45, 0.12, 0.95), snowMat); binSnow.position.set(5.2, 1.15, -5.4); binSnow.rotation.y = -0.5; scene.add(binSnow);

    k.snow({ n: 1100, area: [46, 22, 54], center: [0, 0, -12], speed: 1.0, size: 0.17 });

    // ---------- Dexy (настоящий PNG бренда) с баллончиками ----------
    var dexy = k.billboard('../../dexyplay/assets/dexy-full.png', 4.3);
    dexy.position.set(-2.1, 0, 7.6); scene.add(dexy);
    var dexyCans = canSet(-1.2, 7.9, 0.4);
    var dexyGlow = k.glow(NEON.pink, 4.2); dexyGlow.position.y = 0.25; dexyGlow.material.opacity = 0.35; dexy.add(dexyGlow);
    var dexyTo = dexy.position.clone();
    canSet(4.9, -27.5, 1.2);

    // ---------- брызги краски (вспышка при расписанной стене) ----------
    var drops = [];
    function spray(o) {
      var col = NEON[(o.tag && o.tag.neon) || 'pink'] || NEON.pink, wp = new T.Vector3().fromArray(o.front); o.inner.localToWorld(wp);
      var dir = new T.Vector3(0, 0, 1).applyAxisAngle(new T.Vector3(0, 1, 0), o.g.rotation.y);
      for (var i = 0; i < 26; i++) {
        var s = k.glow(col, 0.5 + Math.random() * 0.7); s.position.copy(wp).add(new T.Vector3((Math.random() - 0.5) * o.pw, (Math.random() - 0.5) * o.ph, 0).applyAxisAngle(new T.Vector3(0, 1, 0), o.g.rotation.y));
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
        o.lab = k.label(o.g, o.mural ? [0, o.h + 1.0, 0] : [0, 0.45, o.front[2] + 1.2], '', openIt); // у основания стены: дальние подписи не наползают
        k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
        S.walls[w.id] = o;
      }
      return o;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      S.t = t;
      var prog = S.litN / 6;
      skyline.forEach(function (m, i) { m.emissiveIntensity = 0.18 + prog * 0.55 + (S.allLit ? 0.08 * Math.sin(t * 1.5 + i) : 0); });
      signs.forEach(function (sg) { var on = 0.35 + prog * 1.6 + 0.25 * Math.sin(t * 2.2 + sg.ph); sg.m.emissiveIntensity = on; sg.gl.material.opacity = Math.min(0.85, 0.12 + prog * 0.6); });
      strands.forEach(function (st) {
        st.on += ((S.litN >= st.need ? 1 : 0) - st.on) * Math.min(1, dt * 2);
        st.bulbs.forEach(function (b) { var v = st.on * (0.7 + 0.3 * Math.sin(t * 3 + b.i * 1.1)); b.m.emissiveIntensity = 0.1 + v * 2.4; b.gl.material.opacity = v * 0.9; });
      });
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
        o.panelMat.emissiveIntensity = o.tag ? buzz * 1.7 : 0;
        o.neonMat.emissiveIntensity = buzz * 2.6;
        o.tubeGlows.forEach(function (gl) { gl.material.opacity = buzz * 0.75; });
        o.spill.material.opacity = o.lit * 0.34;
        o.panelGlow.material.opacity = o.lit * 0.32;
        o.light.intensity = o.lit * (o.mural ? 2.6 : 1.6);
        o.winMat.emissiveIntensity = 0.15 + o.lit * 1.1;
        // рамка: в работе — жёлтая пульсирует; готова — фиолетовая; расписана — неон
        var fCol = o.state === 'active' ? NEON.yellow : o.tag ? (NEON[o.tag.neon] || NEON.pink) : 0x7645ba;
        o.frameMat.emissive.setHex(fCol);
        o.frameMat.emissiveIntensity = o.state === 'active' ? 1.2 + 0.8 * Math.sin(t * 5) : o.tag ? buzz * 1.6 : o.open ? 0.55 : 0.12;
      });
      for (var i = drops.length - 1; i >= 0; i--) {
        var d = drops[i]; d.life -= dt * 0.8; d.v.y -= dt * 3; d.s.position.addScaledVector(d.v, dt);
        d.s.material.opacity = Math.max(0, d.life);
        if (d.life <= 0) { scene.remove(d.s); drops.splice(i, 1); }
      }
      dexy.position.lerp(dexyTo, Math.min(1, dt * 1.4));
      dexyCans.position.set(dexy.position.x + 0.9, 0, dexy.position.z + 0.3);
      dexyGlow.material.opacity = 0.3 + 0.1 * Math.sin(t * 2);
    });
    S.dexyTarget = function (x, z) { dexyTo.set(x, 0, z); };
    S._setTag = setTag;

    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F;
      k.camera.fov = F.fov;
      if (F.t > 0) k.camera.zoom = F.zoom;
      k.camera.updateProjectionMatrix();
      if (!S.camKey) { k.look(F.pos, F.look, 0.01); S.camKey = 'all'; } // сразу в план под пропорции, без перелёта
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
      if (tagged && w.tagged && w.tagged.grid) setTagOn(S, o, w.tagged);
      else if (!tagged && o.tag) setTagOn(S, o, null);
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
        if (cur.mural) S.k.look([0, 9, p.z + 22], [0, 5.2, p.z], 1.6);
        else S.k.look([p.x * 0.4 + front.x * 1.3, 6.4, p.z + 11.5], [p.x * 0.8, 2.4, p.z - 1], 1.6);
      }
      var side = p.x < 0 ? 1 : p.x > 0 ? -1 : 0;
      S.dexyTarget(p.x + front.x * 1.15 + side * 1.6, p.z + front.z * 1.15 + (cur.mural ? 0 : 0.6));
    } else {
      if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.6); }
      S.dexyTarget(-2.1, 7.6);
    }
    return S;
  }
  function setTagOn(S, o, tag) { S._setTag(o, tag); } // setTag живёт внутри build (нужны k и текстуры)
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
