/**
 * Fire Seven · Crack the 777 Vault — 3D-зал за игрой (фон .stage → #gl) на ядре _3d/ny3d.js, ПРЕМИУМ-режим.
 * Уровень — зал Witching Hours (halloween-week/app/public/hall3d.js, тема fireseven): линейный вывод, bloom, зеркальный
 * пол на Reflector, огонь-шейдер, env из 5 панелей. Сдержанная роскошь бренда: изумрудный бархат и золото, красный —
 * только в знаке 7 и в лампах замков (решение 20.10). Сцена по арту assets/art/android-midnight.jpg:
 * бархатные складки с гирляндами, лакированный чёрный сейф с бархатной дверцей и золотым штурвалом, 7 ламп — 7 замков.
 *   замок ещё не открылся — лампа тёмная; открыт — красная, дышит (текущий — ярче); взломан — золотая; заклинило — тусклая.
 *   все 7 взломаны — дверца приоткрывается, из щели золотой свет; полночь (reveal) — дверца открыта, внутри монеты и бриллианты.
 * Состояние берёт сам из window.F7V.state (vault.js) каждый кадр — vault.js и игру не трогает.
 * Клик по лампе = клик по вкладке замка в панели. Нет WebGL — ничего не делает, остаётся 2D-фон .stage.
 *   Vault3D.mount(box)   box = #gl внутри .stage
 *   ?ny3d=lit — все 7 взломаны и сейф открыт (для скриншотов), ?ny3d=info — кадры/камера, ?ny3d=nopremium — старый конвейер.
 * Нужны скрипты: three.min.js, цепочка bloom (CopyShader … UnrealBloomPass), Reflector.js, ny3d.js — см. dev/index.html.
 */
(function () {
  'use strict';
  var C = { gold: 0xd9a94e, red: 0xe3122b, redHi: 0xff163d, warm: 0xffc46b };
  // 7 из логотипа (тот же путь, что S7 в vault.js; SVG-координаты, y вниз)
  var S7 = [[60.902, 33.0804], [78.795, 33.0804], [94.816, 0], [36.355, 0], [24.578, 23.4692], [52.667, 23.4692], [27.856, 79.096], [58.229, 79.096], [77.022, 37.0507], [60.904, 33.0814]];
  // огонь бренда из зала WH (THEMES.fireseven.flame): от края к сердцевине
  var FLAME = [[0.55, 0.12, 0.02], [1.0, 0.62, 0.18], [1.0, 0.95, 0.75]]; // тёплые рождественские свечи (WH-тема была зелёной, «призрачной»)
  // кадры камеры по пропорциям блока: телефон до старта (портрет), десктоп (весь экран под панелями), полоса над игрой на телефоне
  var FRAMES = [
    { a: 0.7, pos: [0, 4.2, 19.5], look: [0, 3.1, 0], fov: 46 },
    { a: 1.15, pos: [0, 4.3, 16.8], look: [0, 2.6, 0], fov: 42 },
    { a: 1.75, pos: [0.6, 4.0, 14.6], look: [0, 2.2, 0], fov: 38 },
    { a: 2.6, pos: [0, 5.2, 9.5], look: [0, 4.2, 0], fov: 32 },
    { a: 4.0, pos: [0, 5.15, 6.4], look: [0, 4.85, 0], fov: 30 },
  ];

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function frame(a) {
    var i = 0; while (i < FRAMES.length - 2 && a > FRAMES[i + 1].a) i++;
    var A = FRAMES[i], B = FRAMES[i + 1], t = Math.max(0, Math.min(1, (a - A.a) / (B.a - A.a)));
    function mix(p, q) { return p.map(function (v, j) { return v + (q[j] - v) * t; }); }
    return { pos: mix(A.pos, B.pos), look: mix(A.look, B.look), fov: A.fov + (B.fov - A.fov) * t, key: i + t };
  }

  function now() { return window.WH && WH.now ? WH.now() : Date.now(); }

  // что показывать: из состояния vault.js
  function read(k) {
    var lit = k.debug('lit');
    var out = { locks: [], cur: -1, phase: 'idle', solved: 0 };
    var S = window.F7V && window.F7V.state, v = S && S.view;
    for (var i = 0; i < 7; i++) {
      var L = v && v.locks[i], st = 'idle';
      if (lit) st = 'solved';
      else if (L) st = now() < v.opens[i] ? 'off' : L.status; // off | open | solved | jammed
      out.locks.push(st);
      if (st === 'solved') out.solved++;
    }
    if (lit) { out.phase = 'revealed'; return out; }
    if (!v) return out;
    out.cur = S.cur;
    var reveal = v.reveal || (S.c && S.c.params && S.c.params.reveal) || v.close + 30 * 60000, t = now();
    out.phase = t < v.close ? 'running' : t < reveal ? 'closed' : 'revealed';
    return out;
  }

  function mount(box, opts) {
    opts = opts || {};
    if (!box || box._v3d || !supported()) return null;
    var BASE = opts.assetBase || '../../fireseven/assets/';
    var k = NY3D.create(box, {
      premium: true, bg: 0x020806, fogExp: [0x03100b, 0.022], fixedZoom: true, parallax: 0.6,
      env: [0x1c8a5a, 0xd39045, 0xfff0d0, 0x0a3a26, 0x0a1410], // зал WH: слева, справа, сверху, сзади, пол
      cam: { pos: FRAMES[2].pos, look: FRAMES[2].look, fov: 38 },
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, V = { k: k, sig: '', solvedN: -1, door: 0, doorTo: 0, burst: 0 };
    box._v3d = V;
    var PHYS = !!T.MeshPhysicalMaterial;
    function rand(a, b) { return a + Math.random() * (b - a); }

    // ---------- материалы (как в зале WH) ----------
    var gold = new T.MeshStandardMaterial({ color: 0xd9a94e, metalness: 0.95, roughness: 0.26, envMapIntensity: 1.5 });
    var goldSoft = new T.MeshStandardMaterial({ color: 0xc8963e, metalness: 0.9, roughness: 0.38, envMapIntensity: 1.3 });
    var goldGlow = new T.MeshStandardMaterial({ color: 0xd9a94e, metalness: 0.9, roughness: 0.3, emissive: 0xffc070, emissiveIntensity: 0.6 });
    var obsidian = new T.MeshStandardMaterial({ color: 0x0f0b0e, metalness: 0.3, roughness: 0.22, envMapIntensity: 0.8 });
    // чёрный лак корпуса: глянец с отражениями зала
    var lacquer = PHYS ? new T.MeshPhysicalMaterial({ color: 0x0b0c0d, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.07, envMapIntensity: 1.2 })
      : new T.MeshStandardMaterial({ color: 0x0b0c0d, metalness: 0.5, roughness: 0.25 });
    // бархат: шум ворса + sheen (блик по краю складки), как у бархата на арте
    var pileTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#9aa69f'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) { var v = 120 + Math.random() * 80 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.22)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3); }
    });
    pileTex.wrapS = pileTex.wrapT = T.RepeatWrapping;
    // ---------- графика из assets/gen (Flow, 18.11): нет файла — остаётся процедурное/прежнее ----------
    var GEN = BASE + 'gen/';
    function genMiss(url, fn, ok) { var p = new Image(); p.onerror = fn; if (ok) p.onload = ok; p.src = url; }
    function genTile(url, apply) { k.image(url, function (t, img) { var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.RepeatWrapping; c.anisotropy = k.aniso; apply(c, img); }); }
    // бархат: процедурный ворс → изумрудный бархат из Flow. Цвет теперь даёт текстура, поэтому color светлеет
    // (сохраняя оттенок материала: тёмный бархат дверцы остаётся темнее занавеса)
    function velvetMat(col, o) {
      o = o || {};
      var p = { color: col, roughness: 0.92, metalness: 0, map: o.map || pileTex, vertexColors: !!o.vc, side: o.side || T.FrontSide };
      var m;
      if (PHYS) { p.sheen = 1; p.sheenColor = new T.Color(o.sheen || 0x6fe0aa); p.sheenRoughness = 0.38; m = new T.MeshPhysicalMaterial(p); }
      else m = new T.MeshStandardMaterial(p);
      var rep = o.rep || [1, 1], dark = new T.Color(col).getHSL({}).l;
      genTile(GEN + 'velvet-emerald.jpg', function (c) { c.repeat.set(rep[0], rep[1]); m.map = c; m.color.setScalar(Math.min(1, 0.38 + dark * 1.6)); m.needsUpdate = true; });
      return m;
    }
    // отражения: тёмный изумрудный салон со свечами и гирляндами (salon-env.jpg, Flow batch 2) вместо панелей WH;
    // нет файла или нет PMREM — остаётся окружение ядра
    k.image(GEN + 'salon-env.jpg', function (t) {
      try {
        var c = t.clone(); c.needsUpdate = true; c.mapping = T.EquirectangularReflectionMapping;
        var pm = new T.PMREMGenerator(k.renderer), rt = pm.fromEquirectangular(c);
        scene.environment = rt.texture; pm.dispose(); V.salonEnv = true;
      } catch (e) { /* оставляем панели */ }
    });

    // ---------- свет (зал WH: тёплый ключ, изумрудный контровой, золото/изумруд сбоку) ----------
    var hemi = new T.HemisphereLight(0x23402f, 0x060403, 0.55); scene.add(hemi);
    var key = new T.SpotLight(0xffd6a8, 1.9, 34, 0.5, 0.6, 1.2); key.position.set(1.5, 11, 10); key.target.position.set(0, 3, 0); scene.add(key, key.target);
    var back = new T.PointLight(0x1c8a5a, 1.5, 26, 1.6); back.position.set(0, 7, -3.5); scene.add(back);
    var sideL = new T.PointLight(0xd39045, 0.9, 16, 1.6); sideL.position.set(-6, 3.5, 2.5); scene.add(sideL);
    var sideR = new T.PointLight(0x2fae74, 0.75, 16, 1.6); sideR.position.set(6, 3.5, 2.5); scene.add(sideR);
    // тёплые пятна снизу на бархате — как подсветка складок на арте
    var wash = [-5.2, 5.2].map(function (x) {
      var s = new T.SpotLight(0xffb860, 2.4, 18, 0.6, 0.85, 1.3); s.position.set(x, 0.2, -5.0); s.target.position.set(x * 1.1, 10, -7.2); scene.add(s, s.target); return s;
    });
    // скользящий свет сбоку по занавесу — вытягивает складки (рельеф бархата как на арте)
    var graze = new T.DirectionalLight(0x6fe8b0, 0.55); graze.position.set(-14, 6, -4); graze.target.position.set(0, 8, -7); scene.add(graze, graze.target);
    var inLight = new T.PointLight(0xffbb44, 0, 9, 1.4); inLight.position.set(0, 3.2, 0.9); scene.add(inLight);

    // ---------- пол: зеркало под полупрозрачным чёрным мрамором с золотыми прожилками ----------
    var FW = k.mobile ? 1024 : 2048;
    var marbleTex = k.tex(FW, FW, function (g, W) {
      var fs = W / 2048;
      g.fillStyle = '#050506'; g.fillRect(0, 0, W, W);
      for (var i = 0; i < 24000 * fs * fs; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.016)' : 'rgba(0,0,0,.25)'; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); }
      g.lineCap = 'round';
      for (var v = 0; v < 46; v++) { // прожилки: ломаные с мягким свечением
        var x = Math.random() * W, y = Math.random() * W, a = Math.random() * Math.PI * 2, n = 14 + Math.random() * 40;
        g.beginPath(); g.moveTo(x, y);
        for (var j = 0; j < n; j++) { a += rand(-0.45, 0.45); x += Math.cos(a) * 16 * fs; y += Math.sin(a) * 16 * fs; g.lineTo(x, y); }
        var gold2 = v % 3 === 0;
        g.strokeStyle = gold2 ? 'rgba(217,169,78,' + rand(0.25, 0.6).toFixed(2) + ')' : 'rgba(150,160,155,' + rand(0.05, 0.14).toFixed(2) + ')';
        g.lineWidth = gold2 ? rand(1, 2.6) * fs * 2 : rand(1, 4) * fs * 2; g.shadowColor = gold2 ? '#d39045' : 'transparent'; g.shadowBlur = gold2 ? 8 : 0; g.stroke();
      }
      g.shadowBlur = 0;
    });
    marbleTex.wrapS = marbleTex.wrapT = T.RepeatWrapping; marbleTex.repeat.set(3, 2);
    var floor = new T.Mesh(new T.PlaneGeometry(80, 50), new T.MeshStandardMaterial({ map: marbleTex, emissive: 0xffffff, emissiveMap: marbleTex, emissiveIntensity: 0.55, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.74 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.004, 4); scene.add(floor);
    // медальон перед сейфом: золотые круги и семь лучей (инкрустация в пол)
    var medTex = k.tex(512, 512, function (g, W) {
      var c = W / 2; g.clearRect(0, 0, W, W);
      g.strokeStyle = 'rgba(217,169,78,.75)'; g.shadowColor = '#d39045'; g.shadowBlur = 6;
      [0.96, 0.9, 0.62].forEach(function (r, i) { g.lineWidth = i === 1 ? 2 : 4; g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.stroke(); });
      for (var s = 0; s < 7; s++) { var a = -Math.PI / 2 + s / 7 * Math.PI * 2; g.lineWidth = 3; g.beginPath(); g.moveTo(c + Math.cos(a) * c * 0.66, c + Math.sin(a) * c * 0.66); g.lineTo(c + Math.cos(a) * c * 0.86, c + Math.sin(a) * c * 0.86); g.stroke();
        g.beginPath(); g.arc(c + Math.cos(a) * c * 0.76, c + Math.sin(a) * c * 0.76, 7, 0, Math.PI * 2); g.fillStyle = 'rgba(217,169,78,.8)'; g.fill(); }
    }, HQ);
    var medallion = new T.Mesh(new T.CircleGeometry(4.3, 96), new T.MeshStandardMaterial({ map: medTex, transparent: true, emissive: 0xffffff, emissiveMap: medTex, emissiveIntensity: 0.55, metalness: 0.6, roughness: 0.35, depthWrite: false }));
    medallion.rotation.x = -Math.PI / 2; medallion.position.set(0, 0.008, 0.8); scene.add(medallion);
    var reflector = k.mirror(new T.PlaneGeometry(80, 50), { hide: [floor, medallion] });
    if (reflector) { reflector.rotation.x = -Math.PI / 2; reflector.position.z = 4; scene.add(reflector); }
    else floor.material.transparent = false;

    // ---------- бархатный занавес: глубокие складки, тени в складках (цвет вершин), sheen ----------
    function drape(w, h, segX, fold, pinch) {
      var geo = new T.PlaneGeometry(w, h, segX, 24), p = geo.attributes.position, col = [], zs = [], zmin = 1e9, zmax = -1e9;
      for (var i = 0; i < p.count; i++) {
        var x = p.getX(i), y = p.getY(i), yy = (y + h / 2) / h; // 0 низ … 1 верх
        var deep = 1 + (1 - yy) * 0.35;                         // к полу складки глубже
        var z = (Math.sin(x * fold) * 0.5 + Math.sin(x * fold * 0.37 + 1.3) * 0.28 + Math.sin(x * fold * 2.3 + 0.6) * 0.08) * deep;
        if (pinch) { // подхват: ткань собрана к точке на высоте pinch.y
          var d = Math.exp(-Math.pow((yy - pinch.y) / 0.16, 2)); p.setX(i, x * (1 - d * pinch.k) + pinch.dx * d); z *= 1 + d * 0.8;
        }
        p.setZ(i, z); zs.push(z); zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
      }
      for (var j = 0; j < p.count; j++) { var s = 0.32 + 0.68 * Math.pow((zs[j] - zmin) / (zmax - zmin || 1), 0.8); col.push(s, s, s); }
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      return geo;
    }
    var curtainMap = pileTex.clone(); curtainMap.needsUpdate = true; curtainMap.repeat.set(16, 4);
    var curtain = new T.Mesh(drape(48, 20, 480, 1.9), velvetMat(0x0c6b42, { vc: true, map: curtainMap, rep: [8, 2.5] }));
    curtain.position.set(0, 9.6, -7); scene.add(curtain);
    // золотой карниз сверху (виден на высоких экранах)
    var rod = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 48, 16), gold); rod.rotation.z = Math.PI / 2; rod.position.set(0, 19.4, -6.6); scene.add(rod);
    // боковые кулисы с подхватами ближе к камере
    var sideMap = pileTex.clone(); sideMap.needsUpdate = true; sideMap.repeat.set(3, 4);
    [-1, 1].forEach(function (sd) {
      var m = new T.Mesh(drape(7, 20, 140, 2.6, { y: 0.3, k: 0.55, dx: -sd * 0.9 }), velvetMat(0x0a5e3a, { vc: true, map: sideMap, side: T.DoubleSide, rep: [1.4, 2.5] }));
      m.position.set(sd * 12.6, 9.6, -2.2); m.rotation.y = -sd * 0.5; scene.add(m);
      // подхват: золотой шнур-кольцо и кисть
      var tie = new T.Group(); tie.position.set(sd * 12.0, 5.6, -1.6); tie.rotation.y = -sd * 0.5; scene.add(tie);
      var cord = new T.Mesh(new T.TorusGeometry(0.62, 0.07, 10, 40), gold); cord.scale.y = 0.5; tie.add(cord);
      var tassel = new T.Mesh(new T.LatheGeometry([[0, 0], [0.14, 0.02], [0.2, 0.3], [0.12, 0.62], [0.06, 0.7], [0, 0.72]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 18), goldSoft);
      tassel.position.set(sd * 0.3, -1.2, 0.2); tie.add(tassel);
    });

    // гирлянды: вертикальные нити тёплых огоньков на занавесе (Points: ядро + ореол, 3 группы мерцают по очереди; bloom даёт сияние)
    var dotTex = k.tex(64, 64, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.85)'); gr.addColorStop(0.5, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    var fairyPts = [[], [], []];
    function zOn(x, yy) { return (Math.sin(x * 1.9) * 0.5 + Math.sin(x * 1.9 * 0.37 + 1.3) * 0.28 + Math.sin(x * 1.9 * 2.3 + 0.6) * 0.08) * (1 + (1 - yy) * 0.35); }
    for (var sx = -21; sx <= 21; sx += 1.6) {
      var sag = Math.random() * 0.35;
      for (var by = 0.4; by < 17.5; by += 0.55) {
        var x0 = sx + Math.sin(by * 0.9 + sx) * (0.12 + sag);
        fairyPts[(Math.random() * 3) | 0].push(x0, by, -7 + zOn(x0, (by - 9.6 + 10) / 20) + 0.12);
      }
    }
    var twinkle = fairyPts.map(function (arr) {
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
      return [[0.42, 0xffa83a], [0.16, 0xfff0c8]].map(function (p) {
        var m = new T.PointsMaterial({ size: p[0], map: dotTex, color: p[1], transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
        scene.add(new T.Points(geo, m)); return m;
      });
    });

    // ---------- геометрия с фасками ----------
    function rrect(w, h, r) {
      var s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    function rpath(w, h, r) { var p = new T.Path(), s = rrect(w, h, r); p.curves = s.curves; return p; }
    // брус w×h×d со скруглёнными рёбрами (по центру)
    function bevelBox(w, h, d, r, mat) {
      var g = new T.ExtrudeGeometry(rrect(w - 2 * r, h - 2 * r, r * 0.6), { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 6 });
      g.translate(0, 0, -(d - 2 * r) / 2); return new T.Mesh(g, mat);
    }
    // рамка (молдинг): внешний w×h, ширина t, глубина d, с фаской
    function moulding(w, h, t, d, mat) {
      var s = rrect(w, h, Math.min(0.12, t)); s.holes.push(rpath(w - 2 * t, h - 2 * t, 0.04));
      var g = new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: d * 0.5, bevelSize: t * 0.25, bevelSegments: 3, curveSegments: 8 });
      return new T.Mesh(g, mat);
    }

    // ---------- сейф-герой ----------
    var W = 4.6, H = 5.0, D = 3.2, y0 = 0.82, OW = 3.6, OH = 4.0, yc = y0 + H / 2, fz = D / 2;
    // ступенчатый постамент из обсидиана с золотыми светящимися кромками (как пьедестал сейфа в зале WH)
    // чёрный мрамор с золотыми прожилками (marble-black.jpg) на ступенях; на полу не тайлим — у картинки мягкие серые пятна по сетке
    var plinthMat = obsidian.clone(); plinthMat.roughness = 0.16;
    genTile(GEN + 'marble-black.jpg', function (c) { c.repeat.set(0.17, 0.17); plinthMat.map = c; plinthMat.color.setHex(0xffffff); plinthMat.needsUpdate = true; });
    var pl1 = bevelBox(6.2, 0.4, 4.6, 0.06, plinthMat); pl1.position.set(0, 0.2, 0); scene.add(pl1);
    var pl2 = bevelBox(5.5, 0.42, 4.0, 0.06, plinthMat); pl2.position.set(0, 0.61, -0.05); scene.add(pl2);
    [[6.24, 4.64, 0.41], [5.54, 4.04, 0.83]].forEach(function (e) { var m = moulding(e[0], e[1], 0.04, 0.02, goldGlow); m.rotation.x = -Math.PI / 2; m.position.set(0, e[2], e[1] === 4.64 ? 0 : -0.05); scene.add(m); });
    // шаровые ножки
    [[-1.9, 1.2], [1.9, 1.2], [-1.9, -1.2], [1.9, -1.2]].forEach(function (f) { var b = new T.Mesh(new T.SphereGeometry(0.17, 20, 14), gold); b.position.set(f[0], y0 - 0.02, f[1]); scene.add(b); });
    var safe = new T.Group(); scene.add(safe);
    // корпус-труба: внешний контур с проёмом под дверцу, вытянут вглубь, со скруглёнными кромками
    var shellShape = rrect(W - 0.24, H - 0.24, 0.16); shellShape.holes.push(rpath(OW + 0.24, OH + 0.24, 0.05));
    var shellGeo = new T.ExtrudeGeometry(shellShape, { depth: D - 0.24, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4, curveSegments: 8 });
    shellGeo.translate(0, 0, -(D - 0.24) / 2);
    var shell = new T.Mesh(shellGeo, lacquer); shell.position.set(0, yc, 0); safe.add(shell);
    var backP = new T.Mesh(new T.BoxGeometry(OW + 0.3, OH + 0.3, 0.12), lacquer); backP.position.set(0, yc, -fz + 0.2); safe.add(backP);
    // золотой кант по фасаду и по проёму
    var edgeOuter = moulding(W + 0.02, H + 0.02, 0.06, 0.03, gold); edgeOuter.position.set(0, yc, fz + 0.06); safe.add(edgeOuter);
    var edgeInner = moulding(OW + 0.42, OH + 0.42, 0.1, 0.04, goldSoft); edgeInner.position.set(0, yc, fz + 0.06); safe.add(edgeInner);
    // внутри: золотистая ниша, полка, монеты, бриллианты
    var inner = new T.Mesh(new T.BoxGeometry(OW + 0.2, OH + 0.2, D - 0.5), new T.MeshStandardMaterial({ color: 0x6a4416, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.4, emissive: 0x2a1604, emissiveIntensity: 0.6, side: T.BackSide }));
    inner.position.set(0, yc, 0.05); safe.add(inner);
    var shelf = bevelBox(OW + 0.1, 0.1, D - 0.6, 0.03, goldSoft); shelf.position.set(0, yc - 0.15, 0.05); safe.add(shelf);
    var coinGeo = new T.CylinderGeometry(0.3, 0.3, 0.07, 32);
    var coinEdge = new T.TorusGeometry(0.3, 0.012, 6, 32);
    function stack(x, y, z, n) { for (var s = 0; s < n; s++) { var c = new T.Mesh(coinGeo, gold); c.position.set(x + rand(-0.03, 0.03), y + 0.035 + s * 0.072, z); c.rotation.y = Math.random(); safe.add(c); if (s === n - 1) { var e = new T.Mesh(coinEdge, goldGlow); e.rotation.x = Math.PI / 2; e.position.set(c.position.x, c.position.y + 0.036, z); safe.add(e); } } }
    [[-1.3, -0.4, 9], [-0.6, -0.2, 13], [0.15, -0.5, 7], [0.85, -0.25, 11], [1.35, -0.6, 6], [-1.1, 0.4, 5], [0.6, 0.5, 4]].forEach(function (s) { stack(s[0], y0 + 0.5, s[1] + 0.2, s[2]); });
    [[-1.2, -0.3, 6], [-0.4, -0.5, 9], [0.4, -0.2, 5], [1.25, -0.4, 8]].forEach(function (s) { stack(s[0], yc - 0.1, s[1] + 0.2, s[2]); });
    // бриллианты огранки «круг»: Lathe на 8 граней, плоское затенение — грани ловят env и bloom
    var briGeo = new T.LatheGeometry([[0, -0.5], [0.5, 0.02], [0.5, 0.07], [0.3, 0.26], [0, 0.26]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 8);
    var diaMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.02, envMapIntensity: 3.2, flatShading: true, emissive: 0x9cc8ff, emissiveIntensity: 0.18 });
    var gems = [];
    [[-0.2, yc + 0.42, 0.4, 0.5], [1.05, yc + 0.36, 0.1, 0.4], [-1.05, y0 + 1.15, 0.55, 0.44], [0.55, y0 + 1.15, 0.7, 0.36]].forEach(function (d) {
      var m = new T.Mesh(briGeo, diaMat); m.scale.setScalar(d[3] * 1.4); m.position.set(d[0], d[1], d[2]); m.rotation.x = 0.35; safe.add(m);
      var sp = k.glow(0xdff0ff, d[3] * 2.2); sp.position.copy(m.position); sp.position.z += 0.25; sp.material.opacity = 0; safe.add(sp);
      gems.push({ m: m, sp: sp, ph: Math.random() * 6 });
    });
    // сокровища из Flow: карточка у задней стенки ниши (монеты гладкие, без цифр) — за стопками, видна при открытии
    // MeshStandard (не Basic): освещается светом ниши, а не светится сам — иначе bloom превращает карточку в белое пятно
    var treasureMat = new T.MeshStandardMaterial({ transparent: true, alphaTest: 0.05, depthWrite: false, roughness: 0.45, metalness: 0.3, color: 0x9a8a70 });
    var treasure = new T.Mesh(new T.PlaneGeometry(1, 1), treasureMat); treasure.visible = false; safe.add(treasure);
    k.image(GEN + 'vault-treasure.png', function (t, img) {
      var tw = OW * 0.8, th = tw * img.height / img.width; // ниже полки
      treasureMat.map = t; treasureMat.needsUpdate = true; // было внутри комментария — карточка шла без картинки
      treasure.scale.set(tw, th, 1); treasure.position.set(0, y0 + 0.5 + th / 2 - 0.05, -fz + 0.45); treasure.visible = true;
    });
    var mouthGlow = k.glow(0xffb43a, 6.5); mouthGlow.position.set(0, yc, fz + 0.4); mouthGlow.material.opacity = 0; safe.add(mouthGlow);

    // хвойная гирлянда из Flow (garland-pine.png, альфа): на крыше сейфа и вдоль карниза занавеса (виден на высоких экранах)
    k.image(GEN + 'garland-pine.png', function (t) {
      var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.ClampToEdgeWrapping; c.anisotropy = k.aniso;
      c.repeat.set(0.94, 0.46); c.offset.set(0.03, 0.27); // кадр 16:9 → сама гирлянда (≈3.7:1)
      var gm = new T.MeshStandardMaterial({ map: c, transparent: true, alphaTest: 0.35, roughness: 0.6, metalness: 0.15, emissive: 0xffffff, emissiveMap: c, emissiveIntensity: 0.22, side: T.DoubleSide });
      function garland(w, x, y, z, ry) { var m = new T.Mesh(new T.PlaneGeometry(w, w / 3.7), gm); m.position.set(x, y, z); m.rotation.y = ry || 0; scene.add(m); return m; }
      garland(4.3, 0, y0 + H + 4.3 / 3.7 / 2 - 0.42, fz + 0.12); // свисает на верхний кант, лампы замков (y ≈ 5.0) открыты
      for (var gx = -21; gx <= 21; gx += 6.0) garland(6.4, gx, 18.9, -6.35);
    });

    // дверца на петлях слева
    var hinge = new T.Group(); hinge.position.set(-OW / 2 - 0.05, 0, fz + 0.02); safe.add(hinge);
    var door = new T.Group(); door.position.set(OW / 2 + 0.05, 0, 0); hinge.add(door);
    var slabD = bevelBox(OW + 0.06, OH + 0.06, 0.34, 0.06, lacquer); slabD.position.set(0, yc, 0.17); door.add(slabD);
    var dz = 0.34;
    var panelW = 2.86, panelH = 2.95, panelY = yc - 0.3;
    var velD = bevelBox(panelW, panelH, 0.06, 0.025, velvetMat(0x064a2c, { sheen: 0x6fe0aa, rep: [0.35, 0.35] })); velD.position.set(0, panelY, dz + 0.02); door.add(velD);
    var panelFrame = moulding(panelW + 0.22, panelH + 0.22, 0.12, 0.05, gold); panelFrame.position.set(0, panelY, dz + 0.01); door.add(panelFrame);
    // штурвал: обод, 6 спиц, ручки-шары за ободом, ступица (Lathe), объёмная красная 7 с золотой фаской
    var wheel = new T.Group(); wheel.position.set(0, panelY, dz + 0.24); door.add(wheel);
    var rim = new T.Mesh(new T.TorusGeometry(0.88, 0.07, 18, 96), gold); wheel.add(rim);
    var rim2 = new T.Mesh(new T.TorusGeometry(0.74, 0.022, 8, 96), goldSoft); wheel.add(rim2);
    for (var sp6 = 0; sp6 < 6; sp6++) {
      var an6 = sp6 * Math.PI / 3, spoke = new T.Mesh(new T.CylinderGeometry(0.038, 0.05, 0.86, 12), gold);
      spoke.position.set(Math.cos(an6) * 0.45, Math.sin(an6) * 0.45, 0); spoke.rotation.z = an6 - Math.PI / 2; wheel.add(spoke);
      var boss = new T.Mesh(new T.SphereGeometry(0.075, 16, 10), gold); // заклёпка на стыке спицы с ободом
      boss.position.set(Math.cos(an6) * 0.88, Math.sin(an6) * 0.88, 0.02); wheel.add(boss);
    }
    var hub = new T.Mesh(new T.LatheGeometry([[0, 0.16], [0.2, 0.15], [0.3, 0.08], [0.32, -0.02], [0.24, -0.12], [0, -0.12]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 40), gold);
    hub.rotation.x = Math.PI / 2; wheel.add(hub);
    var stem = new T.Mesh(new T.CylinderGeometry(0.12, 0.14, 0.3, 20), goldSoft); stem.rotation.x = Math.PI / 2; stem.position.z = -0.16; wheel.add(stem);
    var sh = new T.Shape();
    S7.forEach(function (p, i) { var x = (p[0] - 60) / 79 * 0.36, y = -(p[1] - 40) / 79 * 0.36; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); });
    var emblemMat = new T.MeshStandardMaterial({ color: C.red, emissive: 0x7a0610, emissiveIntensity: 0.7, metalness: 0.4, roughness: 0.35 });
    var seven = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 }), [emblemMat, gold]);
    seven.position.set(0, 0, 0.17); wheel.add(seven);
    // петли (цилиндр с крышками) и заклёпки по краю дверцы, как на арте
    [yc + 1.45, yc - 1.45].forEach(function (y) {
      var p = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.62, 20), gold); p.position.set(-OW / 2 - 0.08, y, 0.2); door.add(p);
      [0.33, -0.33].forEach(function (dy) { var cap = new T.Mesh(new T.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); cap.position.set(-OW / 2 - 0.08, y + dy, 0.2); cap.rotation.x = dy < 0 ? Math.PI : 0; door.add(cap); });
    });
    [yc + 1.25, yc, yc - 1.25].forEach(function (y) {
      var st = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 20), gold); st.rotation.x = Math.PI / 2; st.position.set(-OW / 2 + 0.2, y, dz + 0.02); door.add(st);
      var dome = new T.Mesh(new T.SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold); dome.rotation.x = Math.PI / 2; dome.position.set(-OW / 2 + 0.2, y, dz + 0.05); door.add(dome);
    });
    // 7 ламп над бархатом: камень в золотой оправе (эмиссия → bloom)
    var lamps = [], lampGeo = new T.SphereGeometry(0.13, 24, 16), bezelGeo = new T.TorusGeometry(0.175, 0.04, 10, 32);
    var cupGeo = new T.CylinderGeometry(0.2, 0.2, 0.05, 32);
    for (var li = 0; li < 7; li++) {
      var lx = -1.32 + li * 0.44, ly = yc + OH / 2 - 0.3;
      var lm = new T.MeshStandardMaterial({ color: 0x1a0204, emissive: C.redHi, emissiveIntensity: 0, roughness: 0.18, metalness: 0.1, envMapIntensity: 1.4 });
      var cup = new T.Mesh(cupGeo, obsidian); cup.rotation.x = Math.PI / 2; cup.position.set(lx, ly, dz + 0.02); door.add(cup);
      var lamp = new T.Mesh(lampGeo, lm); lamp.scale.z = 0.7; lamp.position.set(lx, ly, dz + 0.07); door.add(lamp);
      var bez = new T.Mesh(bezelGeo, gold); bez.position.set(lx, ly, dz + 0.06); door.add(bez);
      var lg = k.glow(C.redHi, 0.7); lg.position.set(lx, ly, dz + 0.25); lg.material.opacity = 0; door.add(lg);
      var hit = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.position.copy(lamp.position); door.add(hit);
      var o = { m: lm, gl: lg, lamp: lamp, i: li, st: 'idle', v: 0, hov: 0, pop: 0 };
      lamps.push(o);
      (function (o, hit) {
        k.pick(hit, function () {
          var b = document.querySelector('#vault [data-lock="' + o.i + '"]');
          if (b && !b.disabled) b.click();
        }, function (on) { o.hov = on ? 1 : 0; });
      })(o, hit);
    }

    // ---------- золотые канделябры с живым огнём (шейдер зала WH, огонь бренда) ----------
    var flames = [];
    var stemProfile = [[0, 0], [0.55, 0], [0.56, 0.06], [0.42, 0.14], [0.3, 0.2], [0.14, 0.3], [0.1, 0.5], [0.16, 0.62], [0.1, 0.72], [0.08, 1.4], [0.14, 1.5], [0.08, 1.6], [0.08, 2.3], [0.16, 2.4], [0.1, 2.5], [0, 2.5]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    var cupProfile = [[0, 0], [0.08, 0], [0.1, 0.05], [0.18, 0.1], [0.2, 0.16], [0.17, 0.18], [0.16, 0.12], [0, 0.12]].map(function (q) { return new T.Vector2(q[0], q[1]); });
    var wax = new T.MeshStandardMaterial({ color: 0xf2e8d2, roughness: 0.6, emissive: 0x6a4a20, emissiveIntensity: 0.35 });
    [-1, 1].forEach(function (sd) {
      var g = new T.Group(); g.position.set(sd * 3.75, 0, 2.25); scene.add(g);
      g.add(new T.Mesh(new T.LatheGeometry(stemProfile, 32), goldSoft));
      // три рожка: центр выше, два по бокам на изогнутых рукавах
      [[0, 2.5, 0, 0.62], [-0.62, 2.15, 0, 0.5], [0.62, 2.15, 0, 0.5]].forEach(function (c, ci) {
        if (ci) { var curve = new T.QuadraticBezierCurve3(new T.Vector3(0, 1.62, 0), new T.Vector3(c[0] * 1.15, 1.6, 0), new T.Vector3(c[0], c[1], 0)); g.add(new T.Mesh(new T.TubeGeometry(curve, 20, 0.04, 8), gold)); }
        var cp = new T.Mesh(new T.LatheGeometry(cupProfile, 24), gold); cp.position.set(c[0], c[1], c[2]); g.add(cp);
        var cand = new T.Mesh(new T.CylinderGeometry(0.075, 0.08, c[3], 16), wax); cand.position.set(c[0], c[1] + 0.1 + c[3] / 2, c[2]); g.add(cand);
        var fl = k.flame(FLAME, 0.85); fl.position.set(c[0], c[1] + 0.12 + c[3], c[2]); fl.scale.set(0.24, 0.5, 1); g.add(fl);
        var hg = k.glow(0xffd890, 0.9); hg.position.set(c[0], c[1] + 0.3 + c[3], c[2] + 0.05); hg.material.opacity = 0.55; g.add(hg);
        flames.push({ m: fl, g: hg, ph: Math.random() * 6 });
      });
      var pl = new T.PointLight(0xffb060, 1.2, 9, 1.5); pl.position.set(0, 3.4, 0.2); g.add(pl);
      flames.push({ pl: pl, ph: sd * 2.3 });
    });

    // ---------- ёлка слева: ярусы с рваными ветками, игрушки с отражениями, тёплые огоньки ----------
    var tree = new T.Group(); tree.position.set(-6.5, 0, -1.4); tree.scale.setScalar(0.88); scene.add(tree);
    // тёмное ядро-конус + ~420 веток (InstancedMesh, 1 вызов отрисовки): ветки торчат наружу и вниз — пушистый силуэт
    var needle = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0.05, flatShading: true }); // цвет — у каждой ветки свой (instanceColor)
    var core = new T.Mesh(new T.ConeGeometry(2.0, 5.6, 20), new T.MeshStandardMaterial({ color: 0x052a18, roughness: 0.9 })); core.position.y = 3.2; tree.add(core);
    var brGeo = new T.ConeGeometry(0.2, 1.0, 5); brGeo.translate(0, 0.5, 0); // основание у ствола, кончик наружу
    var BR = [], M4 = new T.Matrix4(), Q = new T.Quaternion(), SC = new T.Vector3(), PO = new T.Vector3(), DIR = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
    for (var lv = 0; lv < 14; lv++) {
      var fy = lv / 13, ly2 = 0.75 + fy * 5.2, lr = 2.25 * (1 - fy) + 0.15, nb = Math.max(5, Math.round(30 * (1 - fy) + 6));
      for (var b = 0; b < nb; b++) {
        var ab = b / nb * Math.PI * 2 + lv * 0.45 + rand(-0.12, 0.12);
        DIR.set(Math.cos(ab), -0.32 - fy * 0.15 + rand(-0.08, 0.08), Math.sin(ab)).normalize();
        Q.setFromUnitVectors(UP, DIR); PO.set(Math.cos(ab) * lr * 0.25, ly2, Math.sin(ab) * lr * 0.25);
        var len = lr * rand(0.85, 1.12) + 0.25; SC.set(rand(0.9, 1.3) * (0.7 + (1 - fy) * 0.6), len, rand(0.9, 1.3) * (0.7 + (1 - fy) * 0.6));
        M4.compose(PO, Q, SC); BR.push(M4.clone());
      }
    }
    var branches = new T.InstancedMesh(brGeo, needle, BR.length);
    BR.forEach(function (m, i) { branches.setMatrixAt(i, m); var c = new T.Color(0x0b4a2c).multiplyScalar(rand(0.75, 1.25)); branches.setColorAt(i, c); });
    tree.add(branches);
    var trunk = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, 0.7, 12), new T.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.9 })); trunk.position.y = 0.35; tree.add(trunk);
    var baubleMats = [gold, new T.MeshStandardMaterial({ color: 0x0f7a4a, metalness: 0.7, roughness: 0.12, envMapIntensity: 1.6 }), new T.MeshStandardMaterial({ color: 0xefe2c4, metalness: 0.8, roughness: 0.18, envMapIntensity: 1.4 })];
    var treeBulbs = [], bulbPos = [];
    for (var tb = 0; tb < 46; tb++) {
      var tt = tb / 46, yy = 0.85 + tt * 5.1, rr = (2.25 * (1 - tt) + 0.15) * 1.02 + 0.12 - (yy - 0.75) * 0.0, aa = tt * Math.PI * 12 + 0.4;
      if (tb % 3 === 0) { var bl = new T.Mesh(new T.SphereGeometry(0.13 + (tb % 2) * 0.04, 18, 12), baubleMats[(tb / 3) % 3 | 0]); bl.position.set(Math.cos(aa) * rr, yy, Math.sin(aa) * rr); tree.add(bl); }
      else bulbPos.push(Math.cos(aa) * (rr + 0.04), yy, Math.sin(aa) * (rr + 0.04));
    }
    var bulbGeo = new T.BufferGeometry(); bulbGeo.setAttribute('position', new T.Float32BufferAttribute(bulbPos, 3));
    var bulbMat = new T.PointsMaterial({ size: 0.3, map: dotTex, color: 0xffc060, transparent: true, depthWrite: false, blending: T.AdditiveBlending }); tree.add(new T.Points(bulbGeo, bulbMat));
    treeBulbs.push(bulbMat);
    var starSh = new T.Shape();
    for (var s5 = 0; s5 < 10; s5++) { var an = Math.PI / 2 + s5 * Math.PI / 5, rad = s5 % 2 ? 0.2 : 0.5; if (s5) starSh.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); else starSh.moveTo(Math.cos(an) * rad, Math.sin(an) * rad); }
    var star = new T.Mesh(new T.ExtrudeGeometry(starSh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), new T.MeshStandardMaterial({ color: 0xffc35a, emissive: 0xffb02a, emissiveIntensity: 1.1, metalness: 0.8, roughness: 0.22 }));
    star.position.set(0, 6.55, -0.05); tree.add(star);
    var starGlow = k.glow(0xffc04a, 2.2); starGlow.position.set(0, 6.6, 0.2); tree.add(starGlow);

    // ---------- подарки: изумрудный бархат, чёрный лак, слоновая кость, золото; атласные ленты и банты ----------
    var giftMats = { velvet: velvetMat(0x0b6a40, { rep: [0.6, 0.6] }), black: lacquer, ivory: new T.MeshStandardMaterial({ color: 0xeee2c8, roughness: 0.5, metalness: 0.05 }), gold: goldSoft };
    function gift(x, z, s, kind, rot, ribbon) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g);
      var hh = s * 0.8, rb = ribbon || gold;
      var bx = bevelBox(s, hh, s, Math.min(0.05, s * 0.06), giftMats[kind]); bx.position.y = hh / 2; g.add(bx);
      [[s + 0.02, hh + 0.02, s * 0.12], [s * 0.12, hh + 0.02, s + 0.02]].forEach(function (r) { var m = new T.Mesh(new T.BoxGeometry(r[0], r[1], r[2]), rb); m.position.y = hh / 2; g.add(m); });
      [-0.6, 0.6].forEach(function (a) { var loop = new T.Mesh(new T.TorusGeometry(s * 0.15, s * 0.045, 10, 24), rb); loop.position.set(Math.sin(a) * s * 0.12, hh + s * 0.11, 0); loop.rotation.set(0, Math.PI / 2, a * 1.4); loop.scale.set(1, 0.8, 1); g.add(loop); });
      var knot = new T.Mesh(new T.SphereGeometry(s * 0.06, 12, 8), rb); knot.position.y = hh + s * 0.03; g.add(knot);
      return g;
    }
    gift(-5.0, 0.7, 0.95, 'velvet', 0.3); gift(-6.4, 1.1, 0.72, 'ivory', -0.4); gift(-7.6, 0.3, 1.05, 'black', 0.2); gift(-5.7, 1.85, 0.55, 'gold', 0.9, goldGlow);
    gift(4.95, 2.7, 1.15, 'black', 0.25); gift(6.25, 2.45, 0.92, 'velvet', -0.35); gift(5.55, 3.45, 0.6, 'ivory', -0.7);

    // ---------- андроид справа: в полный рост (Flow); при открытом сейфе — приглашающий жест ----------
    // нет файла android-full → прежний android.png, низ обрезан — ноги за подарками и в дымке у пола
    var AH = 5.7, android = k.billboard(GEN + 'android-full.png', AH);
    android.position.set(5.8, 0, 0.3); scene.add(android);
    var floorMist = k.glow(0x0a2a1c, 7); floorMist.position.set(5.8, 0.35, 1.2); floorMist.material.blending = T.NormalBlending; floorMist.material.opacity = 0.3; scene.add(floorMist);
    genMiss(GEN + 'android-full.png', function () {
      var m = android.children[0];
      k.image(BASE + 'android.png', function (t, img) { m.material.map = t; m.material.needsUpdate = true; m.scale.set(6.4 * img.width / img.height, 6.4, 1); m.position.y = 3.2; m.visible = true; });
      V.androidOld = true; android.position.set(5.6, -0.75, 1.5); floorMist.position.set(5.6, 0.35, 2.4); floorMist.material.opacity = 0.55;
    });
    var invite = k.billboard(GEN + 'android-invite.png', AH * 1.0); invite.position.copy(android.position); invite.visible = false; scene.add(invite);
    V.inviteOk = false; genMiss(GEN + 'android-invite.png', null, function () { V.inviteOk = true; });
    // дворецкий в полный рост (Flow) слева за ёлкой — только если файл есть
    // стоит перед ёлкой слева (раньше за ней: на десктопе был не виден — ёлка + левая панель)
    var butler = k.billboard(GEN + 'butler-full.png', 5.3); butler.position.set(-6.9, 0, 1.7); scene.add(butler);

    // ---------- золотые искры в воздухе ----------
    k.snow({ n: 220, area: [30, 13, 16], center: [0, 0, 1], speed: 0.2, size: 0.07, color: 0xffd27a, opacity: 0.8 });

    // ---------- виньетка поверх кадра (кино): края темнее, центр — сейф ----------
    if (!box.querySelector('.v3d-vignette')) {
      var vig = document.createElement('div'); vig.className = 'v3d-vignette';
      vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 42%,rgba(0,0,0,0) 55%,rgba(0,4,2,.55) 100%)';
      box.appendChild(vig);
    }

    // ---------- камера под пропорции ----------
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !V.frame || Math.abs(F.key - V.frame.key) > 0.02;
      V.frame = F; k.camera.fov = F.fov; k.camera.updateProjectionMatrix();
      // персонажи ближе к сейфу на узком экране (телефон: андроид уходил за правый край) и на десктопе
      // не за левой панелью игры (дворецкий); full — только для полноразмерного android-full
      var a = w / h, nar = Math.max(0, Math.min(1, (1.2 - a) / 0.6));
      if (!V.androidOld) { android.position.x = 5.8 - 2.2 * nar; invite.position.x = android.position.x; }
      // низкий десктоп (1366×768 и т.п.): чуть глубже в сцену — ступни поднимаются над панелью «Your vault», голова опускается
      var shortK = nar > 0.5 ? 0 : Math.max(0, Math.min(1, (900 - h) / 180));
      butler.position.x = -5.4 + 0.4 * nar - 0.3 * shortK; butler.position.z = 2.2 - 2.4 * nar - 1.5 * shortK; // десктоп: перед подарками слева; телефон: глубже, за канделябром
      // десктоп: голова дворецкого ниже компактной левой панели (~310px от верха) — чем ниже окно, тем он меньше; телефон — как был
      var bs = nar > 0.5 ? 1 : Math.max(0.62, Math.min(1, (0.78 * h - 340) / (0.511 * h)));
      butler.scale.setScalar(bs);
      if (changed) k.look(F.pos, F.look, V.started ? 0.5 : 0);
      V.started = true;
    });

    // ---------- анимация ----------
    var LAMP = { solved: 0xffa020, open: 0xff0a1a, jammed: 0x4a0a06 };
    k.onFrame(function (t, dt) { try { step(t, dt); } catch (e) { if (!V.err) { V.err = e; console.error('vault3d', e); } } }); // сбой сцены не ломает игру
    function step(t, dt) {
      var R = read(k);
      // новые взломанные замки — вспышка и пол-оборота штурвала
      if (V.solvedN >= 0 && R.solved > V.solvedN) { V.burst = 1; V.spin = (V.spin || 0) + Math.PI / 3; if (reflector) reflector.force = true; }
      V.solvedN = R.solved;
      V.burst = Math.max(0, V.burst - dt * 1.2);
      wheel.rotation.z += ((V.spin || 0) - wheel.rotation.z) * Math.min(1, dt * 2.5);
      lamps.forEach(function (o, i) {
        var st = R.locks[i], cur = i === R.cur && st === 'open';
        if (st !== o.st) { if (st === 'solved' && o.st !== 'idle') o.pop = 1; o.st = st; }
        o.pop = Math.max(0, o.pop - dt * 1.5);
        var target, col;
        if (st === 'solved') { target = 0.75 + Math.sin(t * 1.6 + i * 0.9) * 0.07; col = LAMP.solved; }
        else if (st === 'open') { target = cur ? 1.3 + Math.sin(t * 5) * 0.45 : 0.75 + Math.sin(t * 2.2 + i) * 0.2; col = LAMP.open; }
        else if (st === 'jammed') { target = 0.25; col = LAMP.jammed; }
        else if (st === 'idle') { target = 0.4 + Math.sin(t * 1.3 + i * 0.6) * 0.15; col = LAMP.open; }
        else { target = 0.05; col = LAMP.open; }
        o.m.emissive.setHex(col); o.gl.material.color.setHex(col);
        o.v += (target - o.v) * Math.min(1, dt * 6);
        o.m.emissiveIntensity = o.v;
        o.gl.material.opacity = Math.min(0.6, o.v * 0.4) * (st === 'jammed' ? 0.2 : 1);
        var s = 0.5 + Math.min(1.5, o.v) * 0.3 + o.pop * 1.6 + o.hov * 0.3; o.gl.scale.set(s, s, 1);
        o.lamp.scale.set(1 + o.hov * 0.15 + o.pop * 0.25, 1 + o.hov * 0.15 + o.pop * 0.25, 0.7);
      });
      // дверца: все 7 — приоткрыта, полночь — открыта
      V.doorTo = R.phase === 'revealed' ? 1 : R.solved >= 7 ? 0.14 : 0;
      V.door += (V.doorTo - V.door) * Math.min(1, dt * (V.doorTo > V.door ? 0.9 : 3));
      if (k.debug('lit')) V.door = V.doorTo; // скриншот: сразу открыт
      hinge.rotation.y = -V.door * 0.95; // не шире ~55°, чтобы 7 ламп на дверце оставались в кадре
      // андроид: сейф открыт (все 7 или полночь) — приглашающий жест, если картинка есть
      var inv = V.inviteOk && V.doorTo > 0; invite.visible = inv; android.visible = !inv;
      var glowIn = Math.min(1, V.door * 3);
      inLight.intensity = glowIn * 0.6; // было 1.05 — ниша пересвечивалась в белое пятно (bloom)
      inner.material.emissiveIntensity = 0.12 + glowIn * 0.18;
      mouthGlow.material.opacity = glowIn * 0.28 + V.burst * 0.25;
      gems.forEach(function (g) { g.sp.material.opacity = glowIn * (0.3 + 0.35 * Math.max(0, Math.sin(t * 2 + g.ph))); g.m.rotation.y = t * 0.3 + g.ph; });
      // огонь, гирлянды, ёлка
      flames.forEach(function (f) {
        var n = Math.sin(t * 13 + f.ph) * 0.5 + Math.sin(t * 7.3 + f.ph * 2) * 0.5;
        if (f.pl) f.pl.intensity = 1.15 + n * 0.2 + V.burst * 1.5;
        if (f.g) f.g.material.opacity = 0.45 + n * 0.08;
      });
      for (var g = 0; g < 3; g++) { var tw = 0.55 + 0.45 * Math.sin(t * 1.7 + g * 2.1); twinkle[g][0].opacity = tw * 0.75; twinkle[g][1].opacity = 0.55 + tw * 0.45; }
      treeBulbs[0].opacity = 0.75 + 0.25 * Math.sin(t * 3);
      starGlow.material.opacity = 0.55 + 0.25 * Math.sin(t * 2);
      key.intensity = 1.9 + V.burst * 1.2;
      back.intensity = 1.5 + glowIn * 0.3;
    }

    return V;
  }

  window.Vault3D = { mount: mount, supported: supported };
})();
