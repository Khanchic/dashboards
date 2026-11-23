/**
 * 3D-улица Light Up Christmas (Storm Rush) на ядре _3d/ny3d.js — ПРЕМИУМ (конвейер зала Witching Hours, 16.11).
 * Тот же интерфейс, что у 2D street.js:
 *   Street3D.render(box, levels, { current, onOpen(levelId, level) })   — первый вызов строит сцену, дальше только обновляет
 *   Street3D.flick(box, id, levels)                                     — вспышка, когда дом загорелся
 *   Street3D.supported()                                                — есть ли WebGL (иначе страница рисует 2D LightStreet)
 * Сюжет: буря унесла свет. Ночная заснеженная улица, мокрая обледенелая дорога (зеркало), дома по обе стороны, в конце
 * площадь с большой ёлкой, позади грозовое небо (задник WH) с молниями. Зажжённый дом — окна за шторами, гирлянда по крыше,
 * дым из трубы, тёплый свет на снег. 4+ дома — ёлка ждёт (звезда пульсирует); вся улица (6) — фонари, тучи расходятся,
 * звёзды. Golem стоит в начале улицы, Sparky летает у текущего дома.
 * Свет держим тёмным (ночь), ярким — только светящееся (лампочки, окна, звезда, молния): bloom WH цепляет именно их.
 */
(function () {
  'use strict';
  var BRAND = { g: 0x00cc7e, g2: 0x41f999, cy: 0x2eeaff, y: 0xf5f100, warm: 0xffc46b };
  var BULBS = [0x41f999, 0x2eeaff, 0xf5f100, 0xff5a7a]; // зелёный, голубой, жёлтый бренда + тёплый розовый
  // «пряничные» фасады и крыши (насыщенные, но тёмные — ночь, свет дают окна)
  var FACADES = [0x2a5f86, 0x8a3e2c, 0x2a7652, 0x947226, 0x5c3684, 0x1f7278, 0x84324f];
  var ROOFS = [0xa8202f, 0x0f8a50, 0x2849b0, 0xb86e14, 0x0d8c98, 0x9c2276, 0x4c9422];
  var DOORS = [0x6a1420, 0x0c4a2e, 0x16285e, 0x5a2a0e, 0x0a4a50, 0x4a1040, 0x2a4a10];

  // места: [x, z, поворот] — слева тренировка и чётные дома, справа нечётные, ёлка в конце улицы
  var SPOTS = { training: [-6.6, 4.5, 0.95], 1: [6.6, 0.5, -0.95], 2: [-6.6, -4.5, 0.95], 3: [6.6, -9.5, -0.95], 4: [-6.6, -14.5, 0.95], 5: [6.6, -19.5, -0.95], 6: [-6.6, -24.5, 0.95], tree: [0, -31, 0] };
  // кадр ниже и ближе, чем v1: глубина улицы к ёлке, а не диорама сверху
  var CAM = { pos: [0, 11.6, 24], look: [0, -0.6, -12] }; // взгляд ниже (AG 18.11): Голем и тренировка не у нижней кромки
  var CAM_TALL = { pos: [0, 17.5, 15.5], look: [0, 0.4, -12.5] }; // телефон: выше, улица вдоль экрана (fov шире)

  // общий план под пропорции блока: широкий (≥1.9) — CAM, узкий (≤0.9) — CAM_TALL, между ними плавно
  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 44 + 16 * t, zoom: Math.max(0.7, Math.min(1, a / 0.95)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function css() {
    if (document.getElementById('s3d-css')) return;
    var s = document.createElement('style'); s.id = 's3d-css';
    s.textContent =
      '.s3d{height:clamp(520px,86vh,980px);margin:0 0 6px;background:#02070a}' +
      '.s3d .ny3d-label{font:600 13px/1.1 "Kanit",system-ui,sans-serif;font-style:italic;text-transform:uppercase;letter-spacing:.03em;color:#F3F6F5;' +
      'background:rgba(6,14,12,.8);border:1px solid rgba(65,249,153,.35);padding:5px 10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;backdrop-filter:blur(4px)}' +
      '.s3d .ny3d-label small{font:400 11px/1 "Kanit",system-ui,sans-serif;font-style:normal;text-transform:none;letter-spacing:0;color:rgba(243,246,245,.66)}' +
      '.s3d .ny3d-label.lit{border-color:#F5F100;box-shadow:0 0 14px rgba(245,241,0,.35)} .s3d .ny3d-label.lit small{color:#F5F100}' +
      '.s3d .ny3d-label.ready{border-color:#2EEAFF} .s3d .ny3d-label.ready small{color:#2EEAFF}' +
      '.s3d .ny3d-label.locked{opacity:.62}' +
      '.s3d .ny3d-label.cur{background:#00CC7E;color:#0C130F;border-color:#41F999} .s3d .ny3d-label.cur small{color:#0C130F}' +
      '.s3d .ny3d-label:focus-visible{outline:2px solid #2EEAFF;outline-offset:2px}' +
      '.s3d-vig{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,4,6,.55) 100%)}' +
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
      premium: true, bg: 0x02070a, fogExp: [0x061a20, 0.0115],
      env: [0x00cc7e, 0x2eeaff, 0xd8fff0, 0x0a4030, 0x102820], // зал WH Storm: слева, справа, сверху, сзади, пол
      cam: { pos: CAM.pos, look: CAM.look, fov: 44 }, designAspect: 16 / 8, minZoom: 0.42, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, S = { k: k, houses: {}, tree: null, litN: 0, allLit: false, t: 0, flash: 0, bolt: null };
    if (!box.querySelector('.s3d-vig')) { var vig = document.createElement('div'); vig.className = 's3d-vig'; box.appendChild(vig); }

    var M4 = new T.Matrix4(), Q = new T.Quaternion(), SC = new T.Vector3(), PO = new T.Vector3(), DIR = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
    // ---------- общие материалы и текстуры ----------
    function rrect(w, h, r) {
      var s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    function bevelBox(w, h, d, r, mat) {
      var g = new T.ExtrudeGeometry(rrect(w - 2 * r, h - 2 * r, r * 0.6), { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 2, curveSegments: 4 });
      g.translate(0, 0, -(d - 2 * r) / 2); return new T.Mesh(g, mat);
    }
    var dotTex = k.tex(64, 64, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.85)'); gr.addColorStop(0.5, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    // вагонка (белая основа — цвет даёт материал): доски с тенью снизу и бликом сверху, волокна
    var clapTex = k.tex(256, 256, function (g, W, H) {
      g.fillStyle = '#d6d6d6'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255,.05' : '0,0,0,.06') + ')'; g.fillRect(Math.random() * W, Math.random() * H, rand(6, 30), 1); }
      for (var y = 0; y < H; y += 21.33) {
        var gr = g.createLinearGradient(0, y, 0, y + 21.33); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(0.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.42)');
        g.fillStyle = gr; g.fillRect(0, y, W, 21.33); g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, y + 20, W, 1.4);
      }
    }, HQ);
    clapTex.wrapS = clapTex.wrapT = T.RepeatWrapping;
    // черепица: ряды со сдвигом, полукруглые низы
    var shingleTex = k.tex(256, 256, function (g, W, H) {
      g.fillStyle = '#cfcfcf'; g.fillRect(0, 0, W, H);
      var rh = 32, cw = 32;
      for (var r = 0; r < H / rh + 1; r++) for (var c = -1; c < W / cw + 1; c++) {
        var x = c * cw + (r % 2 ? cw / 2 : 0), y = r * rh, v = rand(0.85, 1.12);
        var gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, 'rgba(255,255,255,' + (0.1 * v).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(0,0,0,' + (0.35 * v).toFixed(2) + ')');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + cw - 1, y); g.lineTo(x + cw - 1, y + rh * 0.6); g.quadraticCurveTo(x + cw / 2, y + rh * 1.05, x + 1, y + rh * 0.6); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.stroke();
      }
    }, HQ);
    shingleTex.wrapS = shingleTex.wrapT = T.RepeatWrapping;
    var brickTex = k.tex(128, 128, function (g, W, H) {
      g.fillStyle = '#3a3a3a'; g.fillRect(0, 0, W, H);
      for (var r = 0; r < 8; r++) for (var c = -1; c < 4; c++) { var x = c * 32 + (r % 2 ? 16 : 0); g.fillStyle = 'rgb(' + (150 + Math.random() * 50 | 0) + ',' + (140 + Math.random() * 30 | 0) + ',' + (135 + Math.random() * 30 | 0) + ')'; g.fillRect(x + 1.5, r * 16 + 1.5, 29, 13); }
    }, HQ);
    brickTex.wrapS = brickTex.wrapT = T.RepeatWrapping;
    // окно ночью: тёплый свет за шторами, перекрестье рамы (emissiveMap)
    var winTex = k.tex(128, 160, function (g, W, H) {
      var gr = g.createRadialGradient(W / 2, H * 0.55, 4, W / 2, H * 0.55, W * 0.75); gr.addColorStop(0, '#fff1c8'); gr.addColorStop(0.6, '#ffb45a'); gr.addColorStop(1, '#a3501a');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      [0, 1].forEach(function (sd) { // шторы со складками
        var x0 = sd ? W * 0.7 : 0, x1 = sd ? W : W * 0.3;
        for (var x = x0; x < x1; x += 4) { g.fillStyle = 'rgba(120,20,30,' + (0.55 + 0.25 * Math.sin(x * 0.7)).toFixed(2) + ')'; g.fillRect(x, 0, 4, H); }
      });
      g.fillStyle = 'rgba(60,15,20,.75)'; g.fillRect(0, 0, W, 14); // ламбрекен
      g.fillStyle = '#120806'; g.fillRect(W / 2 - 4, 0, 8, H); g.fillRect(0, H * 0.48, W, 8); g.lineWidth = 10; g.strokeStyle = '#120806'; g.strokeRect(0, 0, W, H);
    }, HQ);
    var trimMat = new T.MeshStandardMaterial({ color: 0xb8c4c8, roughness: 0.55 });
    var snowMat = new T.MeshStandardMaterial({ color: 0x9fb8cc, roughness: 0.85, emissive: 0x0b1820, emissiveIntensity: 1 });
    var iceMat = new T.MeshStandardMaterial({ color: 0x9adff0, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x1a6070, emissiveIntensity: 0.6, envMapIntensity: 1.6 });
    var ironMat = new T.MeshStandardMaterial({ color: 0x14181a, metalness: 0.85, roughness: 0.35, envMapIntensity: 1.2 });
    var brassMat = new T.MeshStandardMaterial({ color: 0xc89a4a, metalness: 0.95, roughness: 0.25, envMapIntensity: 1.5 });
    var brickMat = new T.MeshStandardMaterial({ color: 0x8a4a3a, map: brickTex, roughness: 0.9 });

    // ---------- графика из assets/gen (Flow, 18.11): нет файла — остаётся процедурное/прежнее ----------
    var GEN = '../../stormrush/assets/gen/';
    function genMiss(url, fn) { var p = new Image(); p.onerror = fn; p.src = url; }
    function genTile(url, apply) { k.image(url, function (t) { var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.RepeatWrapping; c.anisotropy = k.aniso; apply(c); }); }
    // персонаж: новая поза, если файла нет — прежний PNG (тот же размер в сцене)
    function board(url, fb, h, o) {
      var b = k.billboard(url, h, o);
      genMiss(url, function () { var m = b.children[0]; k.image(fb, function (t, img) { m.material.map = t; m.material.needsUpdate = true; m.scale.set(h * img.width / img.height, h, 1); m.position.y = h / 2; m.visible = true; }); });
      return b;
    }

    // ---------- небо: задник-гроза, звёзды, тучи ----------
    scene.background = k.tex(4, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#01030a'); gr.addColorStop(0.5, '#04121c'); gr.addColorStop(1, '#0a2a30');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var starN = 900, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) { var a = Math.random() * Math.PI - Math.PI, el = 0.12 + Math.random() * 0.95, R = 140; sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.6 + 6; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 20; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ map: dotTex, color: 0xdffcff, size: 0.9, transparent: true, opacity: 0.15, fog: false, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(stars);
    // задник: сгенерированная гроза (../../stormrush/assets/gen, края стыкуются) — нет файла → прежний задник WH
    var storm = k.panorama({ src: GEN + 'sky-storm.jpg', r: 70, h: 62, span: 2.9, y0: -8, z: -10, repeat: 2, mirror: false, color: 0xa4b4b0 });
    storm.material.transparent = true; storm.material.depthWrite = false;
    genMiss(GEN + 'sky-storm.jpg', function () {
      k.image('../../stormrush/assets/scenes/stormrush-clouds.webp', function (t) { var c = t.clone(); c.needsUpdate = true; c.wrapS = T.MirroredRepeatWrapping; c.repeat.x = 2; storm.material.map = c; storm.material.color.setHex(0x7a8c88); stormBase.setHex(0x7a8c88); storm.material.visible = true; storm.material.needsUpdate = true; });
    });
    var stormBase = storm.material.color.clone();
    // горизонт: кромка дальнего леса (силуэты елей) + дымка цвета тумана — прячет стык снега и задника
    var farGeo = new T.ConeGeometry(1, 1, 6); farGeo.translate(0, 0.5, 0);
    var NF = 260, far = new T.InstancedMesh(farGeo, new T.MeshBasicMaterial({ color: 0x03100f }), NF);
    for (var fi = 0; fi < NF; fi++) {
      var fa = Math.PI + (fi / NF - 0.5) * 3.3, fr = rand(50, 60), fh = rand(4, 11);
      M4.compose(PO.set(Math.sin(fa) * fr, -0.5, Math.cos(fa) * fr - 10), Q.identity(), SC.set(fh * 0.28, fh, fh * 0.28)); far.setMatrixAt(fi, M4);
    }
    scene.add(far);
    var hazeTex = k.tex(4, 128, function (g, w, h) { var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(6,26,32,0)'); gr.addColorStop(0.55, 'rgba(6,26,32,.75)'); gr.addColorStop(1, 'rgba(6,26,32,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    var haze = new T.Mesh(new T.CylinderGeometry(48, 48, 16, 72, 1, true, Math.PI - 1.7, 3.4), new T.MeshBasicMaterial({ map: hazeTex, transparent: true, depthWrite: false, side: T.BackSide, fog: false }));
    haze.position.set(0, 5.5, -10); scene.add(haze);

    // молнии: ветвистые трубки цвета бренда, видны только во вспышке (их ловит bloom)
    var boltMat = new T.MeshBasicMaterial({ color: new T.Color(0xc8fff4).multiplyScalar(2.4), transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending });
    function boltPath(x0, y0, z0, x1, y1, n) {
      var pts = [];
      for (var i = 0; i <= n; i++) { var t = i / n; pts.push(new T.Vector3(x0 + (x1 - x0) * t + (i && i < n ? rand(-1.6, 1.6) : 0), y0 + (y1 - y0) * t, z0 + rand(-0.4, 0.4))); }
      return pts;
    }
    var bolts = [];
    [[-24, -46], [19, -50], [-6, -58]].forEach(function (b) {
      var g = new T.Group(), main = boltPath(b[0], 36, b[1], b[0] + rand(-6, 6), 9, 14);
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(main, false, 'catmullrom', 0.1), 60, 0.16, 5), boltMat));
      for (var j = 0; j < 4; j++) { var p = main[3 + j * 2]; var br = boltPath(p.x, p.y, p.z, p.x + rand(-7, 7), p.y - rand(5, 10), 7); g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(br, false, 'catmullrom', 0.1), 30, 0.07, 4), boltMat)); }
      var gl = k.glow(BRAND.cy, 26); gl.position.copy(main[4]); gl.material.opacity = 0; gl.material.fog = false; g.add(gl);
      g.visible = false; scene.add(g); bolts.push({ g: g, gl: gl });
    });
    // низкие тучи перед задником — расходятся, когда вся улица горит
    var cloudTex = k.tex(256, 128, function (g, w, h) {
      for (var i = 0; i < 30; i++) {
        var x = w * (0.12 + Math.random() * 0.76), y = h * (0.35 + Math.random() * 0.35), r = 18 + Math.random() * 36;
        var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    var clouds = [];
    for (var c = 0; c < 10; c++) {
      var cm = new T.SpriteMaterial({ map: cloudTex, color: 0x1d3a3a, transparent: true, opacity: 0.85, depthWrite: false, fog: false });
      var cs = new T.Sprite(cm); var sc = 22 + Math.random() * 16; cs.scale.set(sc, sc * 0.42, 1);
      cs.position.set(-34 + c * 7.6 + Math.random() * 3, 15 + Math.random() * 6, -30 - Math.random() * 16); scene.add(cs);
      clouds.push({ s: cs, x0: cs.position.x, sp: 0.25 + Math.random() * 0.35 });
    }

    // ---------- свет: тёмная ночь, холодная луна, бирюзовый контровой ----------
    var hemi = new T.HemisphereLight(0x4a7a9a, 0x05080a, 0.62); scene.add(hemi);
    var moon = new T.DirectionalLight(0x9fd0ff, 0.5); moon.position.set(-14, 24, -18); scene.add(moon);
    var rim = new T.DirectionalLight(0x2eeaff, 0.3); rim.position.set(12, 8, -30); scene.add(rim);
    var fill = new T.DirectionalLight(0x9ab8d8, 0.16); fill.position.set(0, 10, 25); scene.add(fill);
    var flashLight = new T.DirectionalLight(0x9ff6ff, 0); flashLight.position.set(6, 30, -30); scene.add(flashLight);
    // свет ёлки на площадь: короткий радиус — иначе блик на мокрой дороге + bloom = белое пятно посреди улицы
    var squareLight = new T.PointLight(0xffc070, 0, 9, 2); squareLight.position.set(0, 2.6, -29.5); scene.add(squareLight);

    // ---------- земля: снег с блёстками, мокрая обледенелая дорога-зеркало ----------
    var snowTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#e6eef4'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 40; i++) { var x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(160,185,210,.22)'); gr.addColorStop(1, 'rgba(160,185,210,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (var j = 0; j < 9000; j++) { var v = 205 + Math.random() * 50 | 0; g.fillStyle = 'rgba(' + v + ',' + (v + 4) + ',255,.35)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    }, HQ);
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping; snowTex.repeat.set(12, 12);
    var sparkTex = k.tex(256, 256, function (g, w, h) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); for (var i = 0; i < 260; i++) { g.fillStyle = 'rgba(200,250,255,' + rand(0.4, 1).toFixed(2) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); } });
    sparkTex.wrapS = sparkTex.wrapT = T.RepeatWrapping; sparkTex.repeat.set(16, 16);
    var groundMat = new T.MeshStandardMaterial({ color: 0x7d94aa, map: snowTex, roughness: 0.9, emissive: 0xffffff, emissiveMap: sparkTex, emissiveIntensity: 0.55 });
    genTile(GEN + 'snow-ground.jpg', function (c) { c.repeat.set(26, 26); groundMat.map = c; groundMat.needsUpdate = true; });
    var ground = new T.Mesh(new T.PlaneGeometry(170, 170), groundMat);
    ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground);
    var roadTex = k.tex(256, 1024, function (g, w, h) {
      g.fillStyle = '#20262a'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) { g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05).toFixed(3) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      for (var p = 0; p < 26; p++) { var x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 40, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(180,220,235,.18)'); gr.addColorStop(1, 'rgba(180,220,235,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      g.fillStyle = 'rgba(200,220,232,.45)'; [0.22, 0.37, 0.63, 0.78].forEach(function (x) { for (var y = 0; y < h; y += 3) g.fillRect(x * w - 6 + Math.sin(y * 0.03) * 2, y, 12, 2); });
      var e = g.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(225,236,244,1)'); e.addColorStop(0.11, 'rgba(225,236,244,0)'); e.addColorStop(0.89, 'rgba(225,236,244,0)'); e.addColorStop(1, 'rgba(225,236,244,1)');
      g.fillStyle = e; g.fillRect(0, 0, w, h);
    }, HQ);
    roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 4);
    var road = new T.Mesh(new T.PlaneGeometry(7.4, 46), new T.MeshStandardMaterial({ color: 0x8090a0, map: roadTex, roughness: 0.42, metalness: 0.05, transparent: true, opacity: 0.78 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.012, -10); scene.add(road);
    var plaza = new T.Mesh(new T.CircleGeometry(9, 64), new T.MeshStandardMaterial({ color: 0x5c6c7a, map: roadTex, roughness: 0.5, transparent: true, opacity: 0.72 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.014, -31); scene.add(plaza);
    // в отражении не показываем пол и большие ореолы (звезда, Sparky, свет окон на снегу) — иначе пятна на дороге;
    // лампочки, окна, фонари отражаются. Список пополняется ниже по мере создания объектов.
    var noReflect = [road, plaza];
    var mir = k.mirror(new T.PlaneGeometry(8, 58), { hide: noReflect });
    if (mir) { mir.rotation.x = -Math.PI / 2; mir.position.set(0, 0.006, -14); scene.add(mir); }
    var mir2 = k.mirror(new T.CircleGeometry(9.2, 48), { hide: noReflect, res: k.mobile ? 256 : 512 });
    if (mir2) { mir2.rotation.x = -Math.PI / 2; mir2.position.set(0, 0.007, -31); scene.add(mir2); }
    if (!mir) { road.material.transparent = false; plaza.material.transparent = false; }

    // сугробы вдоль улицы: мягкие холмы с блёстками
    var driftMat = new T.MeshStandardMaterial({ color: 0x8aa2b8, map: snowTex, roughness: 0.9, emissive: 0xffffff, emissiveMap: sparkTex, emissiveIntensity: 0.5 });
    genTile(GEN + 'snow-ground.jpg', function (c) { c.repeat.set(1.5, 1.5); driftMat.map = c; driftMat.needsUpdate = true; });
    for (var d = 0; d < 30; d++) {
      var side = d % 2 ? 1 : -1, m = new T.Mesh(new T.SphereGeometry(1, 20, 12), driftMat);
      m.scale.set(0.6 + Math.random() * 0.45, 0.28 + Math.random() * 0.22, 1.2 + Math.random() * 1.3);
      m.position.set(side * (4.25 + Math.random() * 0.45), -0.05, 8 - d * 1.35 - Math.random()); scene.add(m);
    }
    // следы на снегу вдоль тротуаров
    var stepTex = k.tex(64, 512, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      for (var y = 10; y < h; y += 38) [0, 1].forEach(function (sd) { var x = w / 2 + (sd ? 9 : -9), yy = y + (sd ? 19 : 0); g.fillStyle = 'rgba(60,80,100,.42)'; g.beginPath(); g.ellipse(x, yy, 5, 9, 0, 0, Math.PI * 2); g.fill(); });
    });
    stepTex.wrapT = T.RepeatWrapping; stepTex.repeat.set(1, 5);
    [-5.3, 5.3].forEach(function (x) { var st = new T.Mesh(new T.PlaneGeometry(0.9, 38), new T.MeshBasicMaterial({ map: stepTex, transparent: true, depthWrite: false })); st.rotation.x = -Math.PI / 2; st.position.set(x, 0.02, -10); scene.add(st); });

    // ---------- ели по краям: ветки одним InstancedMesh, снег на ветках вторым ----------
    var brGeo = new T.ConeGeometry(0.22, 1.0, 5); brGeo.translate(0, 0.5, 0);
    var snGeo = new T.ConeGeometry(0.14, 0.7, 5); snGeo.translate(0, 0.35, 0);
    function fir(list, snowList, x, z, H, R0, dens) {
      var lv = Math.round(10 + H * 0.6);
      for (var l = 0; l < lv; l++) {
        var fy = l / (lv - 1), ly = 0.5 + fy * (H - 0.8), lr = R0 * (1 - fy) + 0.12, nb = Math.max(5, Math.round(dens * (1 - fy) + 5));
        for (var b = 0; b < nb; b++) {
          var ab = b / nb * Math.PI * 2 + l * 0.5 + rand(-0.15, 0.15);
          DIR.set(Math.cos(ab), -0.3 - fy * 0.15 + rand(-0.08, 0.08), Math.sin(ab)).normalize();
          Q.setFromUnitVectors(UP, DIR); PO.set(x + Math.cos(ab) * lr * 0.2, ly, z + Math.sin(ab) * lr * 0.2);
          var len = lr * rand(0.85, 1.12) + 0.2, wd = rand(0.9, 1.3) * (0.7 + (1 - fy) * 0.7);
          SC.set(wd, len, wd); M4.compose(PO, Q, SC); list.push(M4.clone());
          if (snowList && (b + l) % 2 === 0) { PO.y += 0.13; SC.set(wd * 0.9, len * 0.8, wd * 0.5); M4.compose(PO, Q, SC); snowList.push(M4.clone()); }
        }
      }
    }
    var pineB = [], pineS = [];
    for (var p = 0; p < 18; p++) { var sd = p % 2 ? 1 : -1; fir(pineB, pineS, sd * (12 + Math.random() * 9), 7 - p * 3.1, rand(5, 8.5), rand(1.6, 2.4), 14); }
    var needle = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true });
    var pines = new T.InstancedMesh(brGeo, needle, pineB.length);
    pineB.forEach(function (m, i) { pines.setMatrixAt(i, m); pines.setColorAt(i, new T.Color(0x0b3a2a).multiplyScalar(rand(0.7, 1.3))); });
    scene.add(pines);
    var pineSnow = new T.InstancedMesh(snGeo, snowMat, pineS.length); pineS.forEach(function (m, i) { pineSnow.setMatrixAt(i, m); }); scene.add(pineSnow);

    // ---------- кованые фонари: горят, когда вся улица зажжена ----------
    var lamps = [];
    var baseGeo = new T.LatheGeometry([[0, 0], [0.22, 0], [0.22, 0.08], [0.14, 0.16], [0.1, 0.45], [0.08, 0.5]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 16);
    [6, -2, -10, -18, -26].forEach(function (z, i) {
      [-1, 1].forEach(function (sdl) {
        var g = new T.Group();
        g.add(new T.Mesh(baseGeo, ironMat));
        var pole = new T.Mesh(new T.CylinderGeometry(0.055, 0.075, 3.4, 10), ironMat); pole.position.y = 2.1; g.add(pole);
        var ring = new T.Mesh(new T.TorusGeometry(0.1, 0.025, 6, 16), ironMat); ring.rotation.x = Math.PI / 2; ring.position.y = 1.2; g.add(ring);
        var arm = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(0, 3.6, 0), new T.Vector3(-sdl * 0.1, 4.05, 0), new T.Vector3(-sdl * 0.62, 3.85, 0)), 12, 0.035, 6), ironMat); g.add(arm);
        var lg = new T.Group(); lg.position.set(-sdl * 0.62, 3.55, 0); g.add(lg);
        var glass = new T.MeshStandardMaterial({ color: 0x0b1416, emissive: BRAND.cy, emissiveIntensity: 0, roughness: 0.2 });
        lg.add(new T.Mesh(new T.CylinderGeometry(0.15, 0.11, 0.34, 6), glass));
        var cap = new T.Mesh(new T.ConeGeometry(0.22, 0.2, 6), ironMat); cap.position.y = 0.27; lg.add(cap);
        var capSnow = new T.Mesh(new T.ConeGeometry(0.19, 0.08, 6), snowMat); capSnow.position.y = 0.36; lg.add(capSnow);
        var gl = k.glow(BRAND.cy, 2.2); gl.material.opacity = 0; lg.add(gl);
        g.position.set(sdl * 4.4, 0, z + (sdl > 0 ? 2 : 0)); scene.add(g);
        lamps.push({ m: glass, gl: gl, ph: i * 0.7 + (sdl > 0 ? 0.3 : 0) });
      });
    });

    k.snow({ n: 1500, area: [46, 24, 54], center: [0, 0, -12], speed: 1.0, size: 0.16, opacity: 0.8 });

    // ---------- гирлянда: лампочки одним InstancedMesh на объект, цвет > 1 — их ловит bloom ----------
    var bulbGeo = new T.SphereGeometry(0.075, 8, 6), tmpC = new T.Color();
    function garland(parent, pts) {
      var mat = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      var im = new T.InstancedMesh(bulbGeo, mat, pts.length);
      pts.forEach(function (q, i) { M4.makeTranslation(q[0], q[1], q[2]); im.setMatrixAt(i, M4); im.setColorAt(i, tmpC.set(0x101418)); });
      parent.add(im);
      // провод с провисом между лампочками
      var wire = []; pts.forEach(function (q, i) { wire.push(new T.Vector3(q[0], q[1] + 0.04, q[2])); if (i < pts.length - 1) { var n = pts[i + 1]; wire.push(new T.Vector3((q[0] + n[0]) / 2, (q[1] + n[1]) / 2 - 0.07, (q[2] + n[2]) / 2)); } });
      if (wire.length > 2) parent.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(wire), wire.length * 3, 0.012, 4), ironMat));
      return { im: im, n: pts.length, cols: pts.map(function (q, i) { return BULBS[i % BULBS.length]; }) };
    }

    // ---------- дом ----------
    function house(v) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var w = 3.3 + (v % 3) * 0.35, h = 2.4 + ((v * 7) % 3) * 0.35, dp = 3.1, oh = 0.32, rh = 1.25 + (v % 2) * 0.25;
      var fac = FACADES[v % FACADES.length], roofC = ROOFS[v % ROOFS.length];
      var wallTex = clapTex.clone(); wallTex.needsUpdate = true; wallTex.repeat.set(w / 1.4, h / 1.4);
      var wallMat = new T.MeshStandardMaterial({ color: fac, map: wallTex, roughness: 0.8 });
      // вагонка из Flow: 10 досок на тайл → тайл ~1.17 ед., как прежние доски; цвет фасада — через color
      genTile(GEN + 'wood-siding.jpg', function (c) { c.repeat.set(w / 1.17, h / 1.17); wallMat.map = c; wallMat.needsUpdate = true; });
      // фундамент из камня, корпус с угловыми досками
      var base = new T.Mesh(new T.BoxGeometry(w + 0.12, 0.34, dp + 0.12), new T.MeshStandardMaterial({ color: 0x55585c, map: brickTex, roughness: 0.95 })); base.position.y = 0.17; inner.add(base);
      var body = new T.Mesh(new T.BoxGeometry(w, h - 0.3, dp), wallMat); body.position.y = 0.3 + (h - 0.3) / 2; inner.add(body);
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (q) { var cb = new T.Mesh(new T.BoxGeometry(0.14, h - 0.3, 0.14), trimMat); cb.position.set(q[0] * w / 2, 0.3 + (h - 0.3) / 2, q[1] * dp / 2); inner.add(cb); });
      var eave = new T.Mesh(new T.BoxGeometry(w + 0.16, 0.14, dp + 0.16), trimMat); eave.position.y = h; inner.add(eave);
      // фронтон (треугольник вагонки) спереди и сзади
      var tri = new T.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh); tri.closePath();
      var gTex = clapTex.clone(); gTex.needsUpdate = true; gTex.repeat.set(1 / 1.4, 1 / 1.4);
      var gableGeo = new T.ShapeGeometry(tri);
      var gableMat = new T.MeshStandardMaterial({ color: fac, map: gTex, roughness: 0.8, side: T.DoubleSide });
      genTile(GEN + 'wood-siding.jpg', function (c) { c.repeat.set(1 / 1.17, 1 / 1.17); gableMat.map = c; gableMat.needsUpdate = true; });
      [1, -1].forEach(function (s) { var gm = new T.Mesh(gableGeo, gableMat); gm.position.set(0, h, s * dp / 2); inner.add(gm); });
      // скаты крыши со свесом: черепица + снежная шапка со скруглённым краем + конёк
      var roofTex = shingleTex.clone(); roofTex.needsUpdate = true;
      var EX = w / 2 + oh, EY = h - oh * rh / (w / 2), RY = h + rh + 0.06, L = Math.hypot(EX, RY - EY), ang = Math.atan2(RY - EY, EX);
      roofTex.repeat.set(L / 0.9, (dp + 2 * oh) / 0.9);
      var roofMat = new T.MeshStandardMaterial({ color: roofC, map: roofTex, roughness: 0.6 });
      [-1, 1].forEach(function (s) {
        var sl = new T.Group(); sl.position.set(s * EX / 2, (EY + RY) / 2, 0); sl.rotation.z = -s * ang; inner.add(sl);
        var slab = new T.Mesh(new T.BoxGeometry(L + 0.05, 0.13, dp + 2 * oh), roofMat); sl.add(slab);
        var cap = bevelBox(L * 0.94, 0.12, dp + 2 * oh - 0.1, 0.05, snowMat); cap.position.set(-s * 0.04, 0.12, 0); sl.add(cap);
        // сосульки вдоль нижнего края ската — висят строго вниз (компенсируем наклон ската)
        var nI = Math.round((dp + 2 * oh) / 0.22), ic = new T.InstancedMesh(new T.ConeGeometry(0.035, 1, 5), iceMat, nI);
        var Z = new T.Vector3(0, 0, 1), qIce = new T.Quaternion().setFromAxisAngle(Z, s * ang).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), Math.PI));
        var down = new T.Vector3(0, -1, 0).applyAxisAngle(Z, s * ang);
        for (var ii = 0; ii < nI; ii++) { var len = rand(0.12, 0.42); PO.set(s * (L / 2 - 0.03), -0.06, -dp / 2 - oh + 0.1 + ii * 0.22).addScaledVector(down, len / 2); M4.compose(PO, qIce, SC.set(1, len, 1)); ic.setMatrixAt(ii, M4); }
        sl.add(ic);
      });
      var ridge = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, dp + 2 * oh, 12), snowMat); ridge.rotation.x = Math.PI / 2; ridge.position.y = RY + 0.08; inner.add(ridge);
      // труба из кирпича + дым
      var chim = new T.Mesh(new T.BoxGeometry(0.46, 1.25, 0.46), brickMat); chim.position.set(w * 0.22, h + rh * 0.55, -dp * 0.18); inner.add(chim);
      var chimCap = new T.Mesh(new T.BoxGeometry(0.58, 0.1, 0.58), ironMat); chimCap.position.set(chim.position.x, chim.position.y + 0.66, chim.position.z); inner.add(chimCap);
      var chimSnow = bevelBox(0.56, 0.1, 0.56, 0.04, snowMat); chimSnow.position.set(chim.position.x, chim.position.y + 0.74, chim.position.z); inner.add(chimSnow);
      var smoke = [];
      for (var si = 0; si < 4; si++) { var sm = new T.Sprite(new T.SpriteMaterial({ map: dotTex, color: 0x8aa0a8, transparent: true, opacity: 0, depthWrite: false })); sm.position.set(chim.position.x, chim.position.y + 0.9, chim.position.z); inner.add(sm); smoke.push({ s: sm, ph: si / 4, x0: chim.position.x, y0: chim.position.y + 0.8 }); }
      // окна: рама, переплёт, тёплый свет за шторами (emissive), ставни, подоконник со снегом
      var winMat = new T.MeshStandardMaterial({ color: 0x07090c, emissive: 0xffc070, emissiveMap: winTex, emissiveIntensity: 0, roughness: 0.15, metalness: 0.3, envMapIntensity: 1.4 });
      var shutMat = new T.MeshStandardMaterial({ color: new T.Color(roofC).multiplyScalar(0.55), map: clapTex, roughness: 0.7 });
      var fz = dp / 2, ww = w * 0.2, wh = h * 0.34, winGlow = [];
      [[-w * 0.29, h * 0.6], [w * 0.29, h * 0.6]].forEach(function (q) {
        var win = new T.Mesh(new T.PlaneGeometry(ww, wh), winMat); win.position.set(q[0], q[1], fz + 0.03); inner.add(win);
        var fr = [[ww + 0.14, 0.08, 0, wh / 2 + 0.03], [ww + 0.14, 0.08, 0, -wh / 2 - 0.03], [0.08, wh + 0.1, -ww / 2 - 0.03, 0], [0.08, wh + 0.1, ww / 2 + 0.03, 0]];
        fr.forEach(function (f) { var b = new T.Mesh(new T.BoxGeometry(f[0], f[1], 0.08), trimMat); b.position.set(q[0] + f[2], q[1] + f[3], fz + 0.05); inner.add(b); });
        [-1, 1].forEach(function (s) { var sh = new T.Mesh(new T.BoxGeometry(ww * 0.42, wh + 0.06, 0.05), shutMat); sh.position.set(q[0] + s * (ww / 2 + ww * 0.24), q[1], fz + 0.05); inner.add(sh); });
        var sill = new T.Mesh(new T.BoxGeometry(ww + 0.26, 0.07, 0.2), trimMat); sill.position.set(q[0], q[1] - wh / 2 - 0.08, fz + 0.1); inner.add(sill);
        var ss = bevelBox(ww + 0.22, 0.07, 0.18, 0.03, snowMat); ss.position.set(q[0], q[1] - wh / 2 - 0.02, fz + 0.1); inner.add(ss);
        var gw = k.glow(0xffb050, 1.6); gw.position.set(q[0], q[1], fz + 0.35); gw.material.opacity = 0; inner.add(gw); winGlow.push(gw);
      });
      var attic = new T.Mesh(new T.CircleGeometry(0.26, 24), winMat); attic.position.set(0, h + rh * 0.42, fz + 0.02); inner.add(attic);
      var atticRim = new T.Mesh(new T.TorusGeometry(0.28, 0.045, 8, 24), trimMat); atticRim.position.copy(attic.position); atticRim.position.z += 0.02; inner.add(atticRim);
      var ag = k.glow(0xffb050, 0.9); ag.position.set(0, attic.position.y, fz + 0.3); ag.material.opacity = 0; inner.add(ag); winGlow.push(ag);
      // крыльцо: дверь с филёнками, латунная ручка, ступень, козырёк на столбиках, венок с бантом, фонарь
      var door = bevelBox(0.78, h * 0.56, 0.1, 0.03, new T.MeshStandardMaterial({ color: DOORS[v % DOORS.length], roughness: 0.45, metalness: 0.1 })); door.position.set(0, 0.34 + h * 0.28, fz + 0.03); inner.add(door);
      var knob = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), brassMat); knob.position.set(0.27, 0.34 + h * 0.26, fz + 0.12); inner.add(knob);
      var step = bevelBox(1.3, 0.16, 0.6, 0.04, new T.MeshStandardMaterial({ color: 0x4c5054, roughness: 0.9 })); step.position.set(0, 0.08, fz + 0.32); inner.add(step);
      var canopy = new T.Mesh(new T.BoxGeometry(1.5, 0.08, 0.8), roofMat); canopy.position.set(0, 0.34 + h * 0.6, fz + 0.4); canopy.rotation.x = 0.18; inner.add(canopy);
      var canSnow = bevelBox(1.42, 0.08, 0.72, 0.035, snowMat); canSnow.position.set(0, canopy.position.y + 0.08, fz + 0.4); canSnow.rotation.x = 0.18; inner.add(canSnow);
      [-1, 1].forEach(function (s) { var post = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.34 + h * 0.6, 8), trimMat); post.position.set(s * 0.68, (0.34 + h * 0.6) / 2, fz + 0.74); inner.add(post); });
      var wreath = new T.Mesh(new T.TorusGeometry(0.17, 0.065, 8, 18), new T.MeshStandardMaterial({ color: 0x0f5a32, roughness: 0.8 })); wreath.position.set(0, 0.34 + h * 0.43, fz + 0.12); inner.add(wreath);
      var bow = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshStandardMaterial({ color: 0xc81e32, roughness: 0.4 })); bow.scale.set(1.6, 0.8, 0.6); bow.position.set(0, wreath.position.y - 0.17, fz + 0.18); inner.add(bow);
      var lanMat = new T.MeshStandardMaterial({ color: 0x0b0c0c, emissive: 0xffb050, emissiveIntensity: 0 });
      var lan = new T.Mesh(new T.CylinderGeometry(0.07, 0.06, 0.18, 6), lanMat); lan.position.set(-0.62, 0.34 + h * 0.4, fz + 0.1); inner.add(lan);
      // гирлянда по фронтону (под свесом) и по карнизу фасада
      var pts = [], apexY = RY - 0.08, zb = fz + oh - 0.02;
      for (var b = 0; b <= 14; b++) { var t = b / 14, x = -EX + 2 * EX * t, y = t <= 0.5 ? EY + (apexY - EY) * t * 2 : EY + (apexY - EY) * (1 - t) * 2; pts.push([x, y - 0.1, zb]); }
      for (var e = 0; e < 9; e++) pts.push([-w / 2 + 0.15 + (w - 0.3) * (e / 8), h - 0.14, fz + 0.12]);
      var gar = garland(inner, pts);
      // тёплый свет из окон на снег + настоящий свет (дешёвый: один на дом)
      var spill = k.glow(0xffa040, 4.2); spill.position.set(0, 0.4, fz + 1.4); spill.material.opacity = 0; inner.add(spill); noReflect.push(spill);
      var pl = new T.PointLight(0xffa850, 0, 7.5, 1.6); pl.position.set(0, h * 0.55, fz + 1.2); inner.add(pl);
      // снег у стен
      var bank = new T.Mesh(new T.SphereGeometry(1, 20, 10), driftMat); bank.scale.set(w * 0.62, 0.24, dp * 0.62); bank.position.y = -0.04; inner.add(bank);
      // кольцо «текущий дом»
      var ring = new T.Mesh(new T.RingGeometry(2.5, 2.72, 64), new T.MeshBasicMaterial({ color: BRAND.g2, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, toneMapped: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.05, 0.8); g.add(ring);
      return { g: g, inner: inner, win: winMat, lan: lanMat, winGlow: winGlow, gar: gar, smoke: smoke, light: pl, spill: spill, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, h: RY + 0.6 };
    }

    // ---------- ёлка на площади — герой кадра ----------
    function treeObj() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var TB = [], TS = [];
      fir(TB, TS, 0, 0, 9.6, 3.6, 34);
      var core = new T.Mesh(new T.ConeGeometry(3.0, 8.8, 24), new T.MeshStandardMaterial({ color: 0x03200f, roughness: 0.95 })); core.position.y = 4.7; inner.add(core);
      var br = new T.InstancedMesh(brGeo, needle, TB.length);
      TB.forEach(function (m, i) { br.setMatrixAt(i, m); br.setColorAt(i, new T.Color(0x0c4a2c).multiplyScalar(rand(0.75, 1.3))); }); inner.add(br);
      var sn = new T.InstancedMesh(snGeo, snowMat, TS.length); TS.forEach(function (m, i) { sn.setMatrixAt(i, m); }); inner.add(sn);
      var trunk = new T.Mesh(new T.CylinderGeometry(0.3, 0.42, 0.8, 12), new T.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 })); trunk.position.y = 0.4; inner.add(trunk);
      // шары с отражениями (одним InstancedMesh, цвет у каждого свой)
      var baubleMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.14, envMapIntensity: 1.8 });
      var BC = [0xc8102e, 0xd9a94e, 0x2eeaff, 0x00cc7e, 0xe8e8f0], NB = 54, bb = new T.InstancedMesh(new T.SphereGeometry(1, 18, 12), baubleMat, NB);
      for (var i = 0; i < NB; i++) {
        var tt = (i + 0.5) / NB, yy = 1.0 + tt * 7.6, rr = (3.6 * (1 - (yy - 0.5) / 9.0) + 0.12) * 0.98, aa = i * 2.399;
        var s = rand(0.13, 0.22); M4.compose(PO.set(Math.cos(aa) * rr, yy, Math.sin(aa) * rr), Q.identity(), SC.set(s, s, s)); bb.setMatrixAt(i, M4); bb.setColorAt(i, tmpC.set(BC[i % BC.length]));
      }
      inner.add(bb);
      // гирлянда спиралью (как у домов — горит по прогрессу)
      var pts = [];
      for (var j = 0; j < 70; j++) { var t = j / 70, y = 0.9 + t * 7.9, r = 3.6 * (1 - (y - 0.5) / 9.0) + 0.2, a = t * Math.PI * 11; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
      var gar = garland(inner, pts);
      // звезда
      var starShape = new T.Shape();
      for (var s5 = 0; s5 < 10; s5++) { var ang = Math.PI / 2 + s5 * Math.PI / 5, rad = s5 % 2 ? 0.32 : 0.78, x = Math.cos(ang) * rad, y5 = Math.sin(ang) * rad; if (s5) starShape.lineTo(x, y5); else starShape.moveTo(x, y5); }
      var starMat = new T.MeshStandardMaterial({ color: 0xfff1a0, emissive: BRAND.y, emissiveIntensity: 0.15, metalness: 0.7, roughness: 0.25 });
      var star = new T.Mesh(new T.ExtrudeGeometry(starShape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }), starMat);
      star.position.set(0, 9.75, -0.09); inner.add(star); noReflect.push(star); // отражение звезды + bloom = пятно на дороге
      var starGlow = k.glow(BRAND.y, 6); starGlow.position.set(0, 9.8, 0.3); starGlow.material.opacity = 0; inner.add(starGlow); noReflect.push(starGlow);
      // подарки с лентами
      [[2.2, 1.4, 0x00cc7e, 0.8], [-2.4, 1.0, 0x2eeaff, 0.7], [0.9, 2.6, 0xf5f100, 0.6], [-1.2, 2.5, 0xc8102e, 0.9], [3.0, -0.2, 0x8a2be2, 0.55], [-3.1, 0.2, 0xd9a94e, 0.65]].forEach(function (q, i) {
        var s2 = q[3], gb = new T.Group(); gb.position.set(q[0], 0, q[1]); gb.rotation.y = i * 0.7; inner.add(gb);
        var bx = bevelBox(s2, s2 * 0.85, s2, 0.04, new T.MeshStandardMaterial({ color: q[2], roughness: 0.45, metalness: 0.1 })); bx.position.y = s2 * 0.425; gb.add(bx);
        [[s2 + 0.02, s2 * 0.85 + 0.02, s2 * 0.14], [s2 * 0.14, s2 * 0.85 + 0.02, s2 + 0.02]].forEach(function (r) { var rb = new T.Mesh(new T.BoxGeometry(r[0], r[1], r[2]), brassMat); rb.position.y = s2 * 0.425; gb.add(rb); });
        [-1, 1].forEach(function (sd) { var lp = new T.Mesh(new T.TorusGeometry(s2 * 0.13, s2 * 0.035, 6, 14), brassMat); lp.position.set(sd * s2 * 0.12, s2 * 0.88, 0); lp.rotation.y = Math.PI / 2; lp.rotation.x = sd * 0.5; gb.add(lp); });
      });
      // кольцо огней вокруг площади
      var ring = new T.Mesh(new T.RingGeometry(4.4, 4.7, 64), new T.MeshBasicMaterial({ color: BRAND.g2, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, toneMapped: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
      return { g: g, inner: inner, win: null, gar: gar, star: starMat, starGlow: starGlow, spill: null, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, h: 10.6, tree: true };
    }

    // ---------- персонажи (настоящие PNG бренда, целиком) ----------
    var golem = board(GEN + 'golem-garland.png', '../../stormrush/assets/golem-xmas.png', 4.4); // Голем с гирляндой (Flow); нет файла — с батареей
    golem.position.set(-2.3, 0, 6.2); scene.add(golem);
    var sparky = board(GEN + 'sparky-hat.png', '../../stormrush/assets/sparky.png', 1.7, { bob: 0.18 }); // Sparky в колпаке
    sparky.position.set(0.2, 4.3, 6.4); scene.add(sparky);
    var sparkyGlow = k.glow(BRAND.cy, 3.2); sparkyGlow.position.y = 0.75; sparky.add(sparkyGlow); noReflect.push(sparkyGlow);
    bolts.forEach(function (b) { noReflect.push(b.gl); });
    var sparkyLight = new T.PointLight(BRAND.cy, 0.9, 6, 1.6); sparkyLight.position.y = 0.8; sparky.add(sparkyLight);
    var sparkyTo = sparky.position.clone();
    S.sparkyTarget = function (x, y, z) { sparkyTo.set(x, y, z); };

    S.place = function (L, hn) {
      var key = L.tree ? 'tree' : L.training ? 'training' : hn;
      var o = S.houses[L.id];
      if (!o) {
        o = L.tree ? treeObj() : house(L.training ? 0 : hn);
        var spot = SPOTS[key] || [0, 0, 0];
        o.g.position.set(spot[0], 0, spot[1]); o.g.rotation.y = spot[2];
        if (L.training) o.g.scale.setScalar(0.82);
        if (L.tree) o.g.scale.setScalar(1.15); // ёлка — герой кадра в конце улицы
        scene.add(o.g);
        // подпись дома — над крыльцом со стороны улицы (а не над коньком): дальние дома не наезжают подписями на ближние
        // дальние дома 5–6 — подпись выше, иначе налипает на 3–4 (AG 18.11)
        var upY = L.id === 'h5' || L.id === 'h6' ? 1.3 : 0;
        o.lab = k.label(o.g, L.tree ? [0, o.h + 0.6, 0] : [0, o.h * 0.82 + upY, 2.1], '', function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); });
        k.pick(o.g, function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); }, function (on) { o.hover = on ? 1 : 0; });
        o.id = L.id;
        S.houses[L.id] = o;
      }
      return o;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      S.t = t;
      S.cloudK = (S.cloudK || 0) + ((S.allLit ? 1 : 0) - (S.cloudK || 0)) * Math.min(1, dt * 0.6);
      clouds.forEach(function (c, i) {
        c.s.position.x = c.x0 + Math.sin(t * 0.05 * c.sp + i) * 3 + S.cloudK * (c.x0 < 0 ? -44 : 44);
        c.s.material.opacity = 0.85 * (1 - S.cloudK);
      });
      stars.material.opacity = 0.15 + 0.8 * S.cloudK;
      // молния, пока улица не зажжена: ветка + вспышка неба
      if (!S.allLit && !k.reduced && S.flash <= 0 && Math.random() < dt * 0.11) { S.flash = 1; S.bolt = bolts[Math.random() * bolts.length | 0]; }
      S.flash = Math.max(0, S.flash - dt * 2.4);
      var fl = S.flash > 0 ? S.flash * (0.6 + 0.4 * Math.sin(t * 60)) : 0;
      bolts.forEach(function (b) { b.g.visible = b === S.bolt && S.flash > 0; });
      boltMat.opacity = fl; if (S.bolt) S.bolt.gl.material.opacity = fl * 0.7;
      flashLight.intensity = fl * fl * 1.3;
      // зеркальный повтор задника: шов уводим к краям (в центре кадра — середина картинки)
      if (storm.material.map && !storm.material.map.userData.off) { storm.material.map.offset.x = 0.5; storm.material.map.userData.off = 1; }
      storm.material.opacity = 1 - S.cloudK * 0.92;
      storm.material.color.copy(stormBase).multiplyScalar(1 + fl * 0.9);
      // фонари
      lamps.forEach(function (L) {
        var on = S.allLit ? 1 : (S.litN >= 3 && Math.sin(t * 7 + L.ph * 9) > 0.92 ? 0.35 : 0);
        L.m.emissiveIntensity += (on * 2.6 - L.m.emissiveIntensity) * Math.min(1, dt * 4);
        L.gl.material.opacity = L.m.emissiveIntensity / 2.6 * 0.8;
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
          o.win.emissiveIntensity = o.lit * 1.9 + flick + S.flash * 0.15;
          o.lan.emissiveIntensity = o.lit * 2.4;
          o.spill.material.opacity = o.lit * 0.5;
          o.light.intensity = o.lit * 1.3;
          o.winGlow.forEach(function (gw) { gw.material.opacity = Math.min(1, o.lit * 0.7 + flick * 0.6); });
          o.smoke.forEach(function (s) {
            var u = (t * 0.18 + s.ph) % 1; s.s.position.y = s.y0 + u * 2.4; s.s.position.x = s.x0 + Math.sin(u * 4 + s.ph * 6) * 0.25 + u * 0.4;
            var sz = 0.5 + u * 1.4; s.s.scale.set(sz, sz, 1); s.s.material.opacity = o.lit * 0.32 * Math.sin(u * Math.PI);
          });
        }
        var G = o.gar, n = G.n;
        for (var i = 0; i < n; i++) {
          var on;
          if (o.chase > 0) on = ((1 - o.chase) * 1.6 * n > i) ? 1 : 0;
          else on = o.lit * (0.7 + 0.3 * Math.sin(t * 2.6 + i * 1.3));
          if (o.state === 'active' && o.lit < 0.5) on = i % 4 === 0 ? 0.6 : 0;
          tmpC.set(G.cols[i]).multiplyScalar(0.05 + on * 2.6); G.im.setColorAt(i, tmpC);
        }
        G.im.instanceColor.needsUpdate = true;
        if (o.tree) {
          o.star.emissiveIntensity = 0.15 + o.lit * 3.2 + (S.litN >= 4 ? 0.5 + 0.35 * Math.sin(t * 2) : 0);
          o.starGlow.material.opacity = Math.min(1, (o.star.emissiveIntensity - 0.15) / 3);
          o.inner.rotation.y = 0;
          squareLight.intensity = o.lit * 2.2 + (S.litN >= 4 ? 0.3 : 0);
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
        var far = cur.tree ? 16 : 10.5;
        S.k.look([p.x * 0.45 + front.x * 1.2, cur.tree ? 6.5 : 4.6, p.z + far], [p.x * 0.8, cur.tree ? 4.6 : 2.0, p.z - 1], 1.6);
      }
      S.sparkyTarget(p.x + front.x + (p.x < 0 ? 1.4 : -1.4), Math.min(cur.h * 0.7, 6), p.z + front.z);
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
    S.k.bloom(1.7); setTimeout(function () { S.k.bloom(0.95); }, 700);
  }

  window.Street3D = { render: render, flick: flick, supported: supported };
})();
