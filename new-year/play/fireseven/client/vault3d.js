/**
 * Fire Seven · Crack the 777 Vault — 3D-зал за игрой (фон .stage → #gl) на ядре _3d/ny3d.js.
 * Сцена по утверждённому арту (../../fireseven/assets/art/android-midnight.jpg): салон с изумрудным бархатом и гирляндами,
 * чёрный сейф с бархатной дверцей и золотым штурвалом, над штурвалом 7 ламп — по одной на замок.
 *   замок ещё не открылся — лампа тёмная; открыт — красная, дышит (текущий — ярче); взломан — золотая; заклинило — тусклая.
 *   все 7 взломаны — дверца приоткрывается, из щели золотой свет; полночь (reveal) — дверца открыта, внутри монеты и бриллианты.
 * Состояние берёт сам из window.F7V.state (vault.js) каждый кадр — vault.js и игру не трогает.
 * Клик по лампе = клик по вкладке замка в панели. Нет WebGL — ничего не делает, остаётся 2D-фон .stage.
 *   Vault3D.mount(box)   box = #gl внутри .stage
 *   ?ny3d=lit — все 7 взломаны и сейф открыт (для скриншотов), ?ny3d=info — кадры/камера.
 */
(function () {
  'use strict';
  var C = { gold: 0xd39045, goldHi: 0xe9c78f, red: 0xd71434, redHi: 0xff163d, velvet: 0x0e6e46, warm: 0xffc46b, fire: 0xff7a1a };
  // 7 из логотипа (тот же путь, что S7 в vault.js; SVG-координаты, y вниз)
  var S7 = [[60.902, 33.0804], [78.795, 33.0804], [94.816, 0], [36.355, 0], [24.578, 23.4692], [52.667, 23.4692], [27.856, 79.096], [58.229, 79.096], [77.022, 37.0507], [60.904, 33.0814]];
  // кадры камеры по пропорциям блока: телефон до старта (портрет), десктоп (весь экран под панелями), полоса над игрой на телефоне
  var FRAMES = [
    { a: 0.7, pos: [0, 4.4, 20.5], look: [0, 3.0, 0], fov: 46 },
    { a: 1.15, pos: [0, 4.6, 17.5], look: [0, 2.4, 0], fov: 42 },
    { a: 1.75, pos: [0, 4.6, 15.5], look: [0, 1.7, 0], fov: 38 },
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
      bg: 0x020806, fog: [0x03120c, 20, 48], exposure: 1.3, fixedZoom: true, parallax: 0.6,
      env: [0x3a2408, 0xffd08a, 0x0a2a1c, 0x050403], cam: { pos: FRAMES[2].pos, look: FRAMES[2].look, fov: 38 },
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, V = { k: k, sig: '', solvedN: -1, door: 0, doorTo: 0, burst: 0 };
    box._v3d = V;

    // ---------- материалы ----------
    var velvetTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#7f8f88'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) { var v = 110 + Math.random() * 60 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.25)'; g.fillRect(Math.random() * w, Math.random() * h, 1, 3); }
    });
    velvetTex.wrapS = velvetTex.wrapT = T.RepeatWrapping;
    var gold = new T.MeshStandardMaterial({ color: 0xffb540, metalness: 1, roughness: 0.3 });
    var goldDim = new T.MeshStandardMaterial({ color: 0xc8862e, metalness: 1, roughness: 0.4 });
    var steel = new T.MeshStandardMaterial({ color: 0x0c0d0e, metalness: 0.6, roughness: 0.38 });
    var velvet = new T.MeshStandardMaterial({ color: 0x07603a, roughness: 0.95, map: velvetTex });

    // ---------- свет ----------
    scene.add(new T.HemisphereLight(0x2c6a4c, 0x080403, 0.6));
    var key = new T.SpotLight(0xffe6c0, 1.7, 40, 0.42, 0.7, 1.1); key.position.set(0, 13, 11); key.target.position.set(0, 3, 0); scene.add(key, key.target);
    [-1, 1].forEach(function (sd) { var p = new T.PointLight(0xffa040, 0.9, 15, 1.7); p.position.set(sd * 8, 0.6, -4.8); scene.add(p); });
    var fill = new T.PointLight(0xffc070, 1.1, 18, 1.5); fill.position.set(0, 7, 2); scene.add(fill);
    var inLight = new T.PointLight(0xffbb44, 0, 9, 1.4); inLight.position.set(0, 3.2, 0.9); scene.add(inLight);

    // ---------- пол, ковёр ----------
    var floor = new T.Mesh(new T.PlaneGeometry(70, 40), new T.MeshStandardMaterial({ color: 0x060707, metalness: 0.45, roughness: 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.position.z = 4; scene.add(floor);
    var carpetTex = k.tex(128, 512, function (g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8b45c'; g.fillRect(6, 0, 5, h); g.fillRect(w - 11, 0, 5, h);
      g.fillStyle = 'rgba(232,180,92,.5)'; g.fillRect(16, 0, 2, h); g.fillRect(w - 18, 0, 2, h);
    });
    var carpet = new T.Mesh(new T.PlaneGeometry(4.2, 16), new T.MeshStandardMaterial({ color: 0x5e0614, map: carpetTex, roughness: 0.95 }));
    carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.01, 9.5); scene.add(carpet);

    // ---------- бархатный занавес со складками + гирлянды ----------
    var cg = new T.PlaneGeometry(46, 19, 260, 1), cp = cg.attributes.position;
    for (var ci = 0; ci < cp.count; ci++) { var x = cp.getX(ci); cp.setZ(ci, Math.sin(x * 2.1) * 0.32 + Math.sin(x * 0.63 + 1) * 0.22); }
    cg.computeVertexNormals();
    var curtainTex = velvetTex.clone(); curtainTex.needsUpdate = true; curtainTex.repeat.set(14, 3);
    var curtain = new T.Mesh(cg, new T.MeshStandardMaterial({ color: 0x0a6a40, roughness: 0.95, map: curtainTex }));
    curtain.position.set(0, 9.5, -7); scene.add(curtain);
    // боковые кулисы ближе к камере
    [-1, 1].forEach(function (sd) {
      var g2 = new T.PlaneGeometry(6, 19, 60, 1), p2 = g2.attributes.position;
      for (var j = 0; j < p2.count; j++) { var xx = p2.getX(j); p2.setZ(j, Math.sin(xx * 2.6) * 0.3); }
      g2.computeVertexNormals();
      var m = new T.Mesh(g2, new T.MeshStandardMaterial({ color: 0x0c5c3a, roughness: 0.9, map: curtainTex, side: T.DoubleSide }));
      m.position.set(sd * 12.5, 9.5, -2.5); m.rotation.y = -sd * 0.55; scene.add(m);
      // золотой подхват
      var tie = new T.Mesh(new T.TorusGeometry(0.55, 0.09, 8, 24), gold); tie.position.set(sd * 12.2, 3.6, -2.2); tie.rotation.y = -sd * 0.55; scene.add(tie);
    });
    // гирлянды: вертикальные нити тёплых огоньков на занавесе (3 общих материала — мерцают по очереди)
    // огоньки — Points (6 вызовов отрисовки на ~900 огоньков): ядро + ореол, 3 группы мерцают по очереди
    var dotTex = k.tex(64, 64, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.8)'); gr.addColorStop(0.45, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });
    var fairyPts = [[], [], []];
    for (var sx = -21; sx <= 21; sx += 1.75) {
      var sag = Math.random() * 0.4;
      for (var by = 0.5; by < 17; by += 0.62) {
        fairyPts[(Math.random() * 3) | 0].push(sx + Math.sin(by * 0.9 + sx) * (0.15 + sag), by, -6.42 + Math.sin(sx * 2.1) * 0.32);
      }
    }
    var twinkle = fairyPts.map(function (arr) {
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(arr, 3));
      var mats = [[0.75, 0xffe7b0], [0.2, 0xffd890]].map(function (p) {
        var m = new T.PointsMaterial({ size: p[0], map: dotTex, color: p[1], transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
        scene.add(new T.Points(geo, m)); return m;
      });
      mats[0].color.setHex(0xffa83a);
      return mats;
    });

    // ---------- сейф ----------
    var W = 4.6, H = 5.0, D = 3.2, y0 = 0.7, OW = 3.6, OH = 4.0, yc = y0 + H / 2, fz = D / 2;
    var plinth = new T.Mesh(new T.BoxGeometry(5.4, y0, 3.9), steel); plinth.position.set(0, y0 / 2, 0); scene.add(plinth);
    var trim = new T.Mesh(new T.BoxGeometry(5.46, 0.07, 3.96), gold); trim.position.set(0, y0 - 0.06, 0); scene.add(trim);
    var safe = new T.Group(); scene.add(safe);
    function slab(w, h, d, x, y, z, mat) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat || steel); m.position.set(x, y, z); safe.add(m); return m; }
    slab(W, H, 0.3, 0, yc, -fz + 0.15);
    slab((W - OW) / 2, H, D, -(W + OW) / 4, yc, 0); slab((W - OW) / 2, H, D, (W + OW) / 4, yc, 0);
    slab(OW, (H - OH) / 2, D, 0, y0 + H - (H - OH) / 4, 0); slab(OW, (H - OH) / 2, D, 0, y0 + (H - OH) / 4, 0);
    // золотые кромки корпуса
    [[W + 0.04, 0.06, 0, y0 + H], [W + 0.04, 0.06, 0, y0]].forEach(function (e) { slab(e[0], e[1], D + 0.04, e[2], e[3], 0, gold); });
    // внутри: золотистая ниша, полка, монеты, бриллианты
    var inner = new T.Mesh(new T.BoxGeometry(OW - 0.02, OH - 0.02, D - 0.32), new T.MeshStandardMaterial({ color: 0x4a2e0c, metalness: 0.6, roughness: 0.5, side: T.BackSide }));
    inner.position.set(0, yc, 0.15); safe.add(inner);
    slab(OW - 0.05, 0.08, D - 0.4, 0, yc - 0.15, 0.1, goldDim);
    var coin = new T.CylinderGeometry(0.3, 0.3, 0.07, 28);
    function stack(x, y, z, n) { for (var s = 0; s < n; s++) { var c = new T.Mesh(coin, gold); c.position.set(x + (Math.random() - 0.5) * 0.04, y + 0.035 + s * 0.072, z); c.rotation.y = Math.random(); safe.add(c); } }
    [[-1.3, -0.4, 9], [-0.6, -0.2, 13], [0.15, -0.5, 7], [0.85, -0.25, 11], [1.35, -0.6, 6], [-1.1, 0.4, 5], [0.6, 0.5, 4]].forEach(function (s) { stack(s[0], y0 + (H - OH) / 2, s[1] + 0.2, s[2]); });
    [[-1.2, -0.3, 6], [-0.4, -0.5, 9], [0.4, -0.2, 5], [1.25, -0.4, 8]].forEach(function (s) { stack(s[0], yc - 0.11, s[1] + 0.2, s[2]); });
    var diaMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.15, roughness: 0.04, envMapIntensity: 2.4, flatShading: true, emissive: 0x6aa8ff, emissiveIntensity: 0.12 });
    var gems = [];
    [[-0.2, yc + 0.32, 0.4, 0.42], [1.05, yc + 0.28, 0.1, 0.34], [-1.05, y0 + 0.95, 0.55, 0.38], [0.55, y0 + 1.0, 0.7, 0.3]].forEach(function (d) {
      var m = new T.Mesh(new T.OctahedronGeometry(d[3], 0), diaMat); m.scale.y = 1.25; m.position.set(d[0], d[1], d[2]); safe.add(m);
      var sp = k.glow(0xdff0ff, d[3] * 2.4); sp.position.copy(m.position); sp.position.z += 0.25; sp.material.opacity = 0; safe.add(sp);
      gems.push({ m: m, sp: sp, ph: Math.random() * 6 });
    });
    var mouthGlow = k.glow(0xffb43a, 6.5); mouthGlow.position.set(0, yc, fz + 0.4); mouthGlow.material.opacity = 0; safe.add(mouthGlow);

    // дверца на петлях слева
    var hinge = new T.Group(); hinge.position.set(-OW / 2, 0, fz + 0.02); safe.add(hinge);
    var door = new T.Group(); door.position.set(OW / 2, 0, 0); hinge.add(door);
    var slabD = new T.Mesh(new T.BoxGeometry(OW, OH, 0.32), steel); slabD.position.set(0, yc, 0.16); door.add(slabD);
    var dz = 0.33;
    var panelH = 2.9, panelY = yc - 0.32;
    var vel = new T.Mesh(new T.PlaneGeometry(2.86, panelH), velvet); vel.position.set(0, panelY, dz + 0.005); door.add(vel);
    [[2.98, 0.07, 0, panelY + panelH / 2 + 0.03], [2.98, 0.07, 0, panelY - panelH / 2 - 0.03], [0.07, panelH + 0.12, -1.46, panelY], [0.07, panelH + 0.12, 1.46, panelY]].forEach(function (e) {
      var m = new T.Mesh(new T.BoxGeometry(e[0], e[1], 0.06), gold); m.position.set(e[2], e[3], dz + 0.03); door.add(m);
    });
    // штурвал
    var wheel = new T.Group(); wheel.position.set(0, panelY, dz + 0.2); door.add(wheel);
    var rim = new T.Mesh(new T.TorusGeometry(0.86, 0.075, 12, 48), gold); wheel.add(rim);
    for (var sp6 = 0; sp6 < 3; sp6++) { // 3 диаметра = 6 спиц
      var spoke = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 1.72, 10), gold); spoke.rotation.z = sp6 * Math.PI / 3; wheel.add(spoke);
    }
    var hub = new T.Mesh(new T.CylinderGeometry(0.26, 0.3, 0.22, 32), gold); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    var stem = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.25, 16), goldDim); stem.rotation.x = Math.PI / 2; stem.position.z = -0.14; wheel.add(stem);
    var sh = new T.Shape();
    S7.forEach(function (p, i) { var x = (p[0] - 60) / 79 * 0.36, y = -(p[1] - 40) / 79 * 0.36; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); });
    var seven = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }), new T.MeshStandardMaterial({ color: 0xc8102e, emissive: 0xd0001a, emissiveIntensity: 0.12, roughness: 0.4, metalness: 0.1 }));
    seven.position.set(0, 0, 0.115); wheel.add(seven);
    // петли
    [yc + 1.4, yc, yc - 1.4].forEach(function (y) { var p = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.5, 14), gold); p.position.set(-OW / 2 - 0.02, y, 0.18); door.add(p); });
    // 7 ламп над бархатом
    var lamps = [], lampGeo = new T.SphereGeometry(0.14, 20, 14), bezelGeo = new T.TorusGeometry(0.18, 0.035, 8, 24);
    for (var li = 0; li < 7; li++) {
      var lx = -1.35 + li * 0.45, ly = yc + OH / 2 - 0.33;
      var lm = new T.MeshStandardMaterial({ color: 0x140103, emissive: C.redHi, emissiveIntensity: 0, roughness: 0.55, metalness: 0 });
      var lamp = new T.Mesh(lampGeo, lm); lamp.position.set(lx, ly, dz + 0.06); door.add(lamp);
      var bez = new T.Mesh(bezelGeo, gold); bez.position.set(lx, ly, dz + 0.04); door.add(bez);
      var lg = k.glow(C.redHi, 0.9); lg.position.set(lx, ly, dz + 0.25); lg.material.opacity = 0; door.add(lg);
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

    // ---------- канделябры с огнём по бокам ----------
    var flames = [];
    // язык пламени: капля, снизу жёлто-белое ядро, вверх — оранжевый и красный в прозрачность
    var flameTex = k.tex(64, 128, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h * 0.78, 2, w / 2, h * 0.62, h * 0.62);
      gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.18, 'rgba(255,210,90,.95)'); gr.addColorStop(0.45, 'rgba(255,110,20,.7)'); gr.addColorStop(0.75, 'rgba(200,30,10,.25)'); gr.addColorStop(1, 'rgba(120,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(w / 2, 0);
      g.bezierCurveTo(w * 0.62, h * 0.3, w * 0.98, h * 0.55, w * 0.9, h * 0.78); g.bezierCurveTo(w * 0.82, h * 0.98, w * 0.18, h * 0.98, w * 0.1, h * 0.78);
      g.bezierCurveTo(w * 0.02, h * 0.55, w * 0.38, h * 0.3, w / 2, 0); g.fill();
    });
    [-1, 1].forEach(function (sd) {
      var g = new T.Group(); g.position.set(sd * 3.55, 0, 2.1); scene.add(g);
      var base = new T.Mesh(new T.CylinderGeometry(0.42, 0.55, 0.25, 24), gold); base.position.y = 0.12; g.add(base);
      var col = new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 2.6, 16), gold); col.position.y = 1.5; g.add(col);
      [0.9, 1.9].forEach(function (y) { var r = new T.Mesh(new T.TorusGeometry(0.14, 0.04, 8, 18), gold); r.rotation.x = Math.PI / 2; r.position.y = y; g.add(r); });
      var bowl = new T.Mesh(new T.CylinderGeometry(0.42, 0.16, 0.32, 24, 1, true), new T.MeshStandardMaterial({ color: 0xffc35a, metalness: 1, roughness: 0.3, side: T.DoubleSide })); bowl.position.y = 2.95; g.add(bowl);
      var f1 = new T.Sprite(new T.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      var f2 = new T.Sprite(new T.SpriteMaterial({ map: flameTex, color: 0xffe0a0, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 }));
      var f3 = k.glow(0xff5a10, 3.2);
      f1.center.set(0.5, 0.08); f2.center.set(0.5, 0.08); f1.position.y = 3.0; f2.position.y = 3.02; f3.position.y = 3.6; f3.material.opacity = 0.45; g.add(f3, f1, f2);
      var pl = new T.PointLight(0xff8a2a, 1.3, 10, 1.5); pl.position.y = 3.5; g.add(pl);
      flames.push({ f1: f1, f2: f2, f3: f3, pl: pl, ph: sd * 2.3 });
    });

    // ---------- ёлка справа ----------
    var tree = new T.Group(); tree.position.set(-6.3, 0, -1.2); tree.scale.setScalar(0.86); scene.add(tree); // звезда не лезет в шапку на 16:9
    var needle = new T.MeshStandardMaterial({ color: 0x075a32, roughness: 0.85, flatShading: true });
    [[2.1, 2.4, 1.5], [1.75, 2.2, 2.9], [1.35, 2.0, 4.2], [0.9, 1.7, 5.4]].forEach(function (t) { var c = new T.Mesh(new T.ConeGeometry(t[0], t[1], 10), needle); c.position.y = t[2]; tree.add(c); });
    var trunk = new T.Mesh(new T.CylinderGeometry(0.22, 0.28, 0.6, 10), new T.MeshStandardMaterial({ color: 0x3a2418 })); trunk.position.y = 0.3; tree.add(trunk);
    var baubleRed = new T.MeshStandardMaterial({ color: 0xe0142e, metalness: 0.6, roughness: 0.2 });
    var treeBulbs = [];
    for (var tb = 0; tb < 34; tb++) {
      var tt = tb / 34, yy = 0.9 + tt * 5.0, rr = 2.0 * (1 - tt) + 0.25, aa = tt * Math.PI * 11 + 0.4;
      if (tb % 3 === 0) { var bl = new T.Mesh(new T.SphereGeometry(0.15, 14, 10), tb % 2 ? gold : baubleRed); bl.position.set(Math.cos(aa) * rr, yy, Math.sin(aa) * rr); tree.add(bl); }
      else { var tg = k.glow(0xffb040, 0.34); tg.position.set(Math.cos(aa) * rr, yy, Math.sin(aa) * rr); tree.add(tg); treeBulbs.push({ g: tg, ph: tb }); }
    }
    var starSh = new T.Shape();
    for (var s5 = 0; s5 < 10; s5++) { var an = Math.PI / 2 + s5 * Math.PI / 5, rad = s5 % 2 ? 0.2 : 0.48; if (s5) starSh.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); else starSh.moveTo(Math.cos(an) * rad, Math.sin(an) * rad); }
    var star = new T.Mesh(new T.ExtrudeGeometry(starSh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), new T.MeshStandardMaterial({ color: 0xffc35a, emissive: 0xffb02a, emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.25 }));
    star.position.set(0, 6.55, 0); tree.add(star);
    var starGlow = k.glow(0xffc04a, 2.6); starGlow.position.set(0, 6.6, 0.2); tree.add(starGlow);

    // подарки: у ёлки и у ног андроида (закрывают обрез PNG снизу)
    function gift(x, z, s, col, rot) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot || 0; scene.add(g);
      var bx = new T.Mesh(new T.BoxGeometry(s, s * 0.8, s), new T.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.15 })); bx.position.y = s * 0.4; g.add(bx);
      [[s + 0.02, s * 0.8 + 0.02, 0.1], [0.1, s * 0.8 + 0.02, s + 0.02]].forEach(function (r) { var m = new T.Mesh(new T.BoxGeometry(r[0], r[1], r[2]), gold); m.position.y = s * 0.4; g.add(m); });
      var bow = new T.Mesh(new T.TorusGeometry(s * 0.14, s * 0.05, 8, 16), gold); bow.position.y = s * 0.82; bow.rotation.y = 0.6; g.add(bow);
      return g;
    }
    gift(-5.0, 0.6, 0.9, 0xc8102e, 0.3); gift(-6.4, 1.0, 0.7, 0x0d7a46, -0.4); gift(-7.5, 0.2, 1.0, 0x111111, 0.2); gift(-5.7, 1.7, 0.55, 0xd39045, 0.9);
    gift(5.05, 2.6, 1.15, 0xc8102e, 0.25); gift(6.2, 2.4, 0.9, 0x0f0f10, -0.35); gift(5.6, 3.35, 0.6, 0xd39045, -0.7);

    // ---------- андроид справа (на десктопе это свободная колонка под лидербордом; низ PNG обрезан — ноги за подарками) ----------
    var android = k.billboard(BASE + 'android.png', 6.4);
    android.position.set(5.6, -0.75, 1.5); scene.add(android);

    // ---------- золотые искры в воздухе ----------
    k.snow({ n: 240, area: [30, 13, 16], center: [0, 0, 1], speed: 0.22, size: 0.085, color: 0xffd27a, opacity: 0.75 });

    // ---------- камера под пропорции ----------
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !V.frame || Math.abs(F.key - V.frame.key) > 0.02;
      V.frame = F; k.camera.fov = F.fov; k.camera.updateProjectionMatrix();
      if (changed) k.look(F.pos, F.look, V.started ? 0.5 : 0.01);
      V.started = true;
    });

    // ---------- анимация ----------
    var LAMP = { solved: 0xff9a14, open: 0xff0a1a, jammed: 0x4a0a06 };
    k.onFrame(function (t, dt) { try { step(t, dt); } catch (e) { if (!V.err) { V.err = e; console.error('vault3d', e); } } }); // сбой сцены не ломает игру
    function step(t, dt) {
      var R = read(k);
      // новые взломанные замки — вспышка и пол-оборота штурвала
      if (V.solvedN >= 0 && R.solved > V.solvedN) { V.burst = 1; V.spin = (V.spin || 0) + Math.PI / 3; }
      V.solvedN = R.solved;
      V.burst = Math.max(0, V.burst - dt * 1.2);
      wheel.rotation.z += ((V.spin || 0) - wheel.rotation.z) * Math.min(1, dt * 2.5);
      lamps.forEach(function (o, i) {
        var st = R.locks[i], cur = i === R.cur && st === 'open';
        if (st !== o.st) { if (st === 'solved' && o.st !== 'idle') o.pop = 1; o.st = st; }
        o.pop = Math.max(0, o.pop - dt * 1.5);
        var target, col;
        if (st === 'solved') { target = 1.0; col = LAMP.solved; }
        else if (st === 'open') { target = cur ? 0.85 + Math.sin(t * 5) * 0.3 : 0.5 + Math.sin(t * 2.2 + i) * 0.15; col = LAMP.open; }
        else if (st === 'jammed') { target = 0.2; col = LAMP.jammed; }
        else if (st === 'idle') { target = 0.28 + Math.sin(t * 1.3 + i * 0.6) * 0.12; col = LAMP.open; }
        else { target = 0.04; col = LAMP.open; }
        o.m.emissive.setHex(col); o.gl.material.color.setHex(col);
        o.v += (target - o.v) * Math.min(1, dt * 6);
        o.m.emissiveIntensity = o.v;
        o.gl.material.opacity = Math.min(0.75, o.v * 0.7) * (st === 'jammed' ? 0.2 : 1);
        var s = 0.6 + Math.min(1, o.v) * 0.5 + o.pop * 1.6 + o.hov * 0.3; o.gl.scale.set(s, s, 1);
        o.lamp.scale.setScalar(1 + o.hov * 0.15 + o.pop * 0.25);
      });
      // дверца: все 7 — приоткрыта, полночь — открыта
      V.doorTo = R.phase === 'revealed' ? 1 : R.solved >= 7 ? 0.14 : 0;
      V.door += (V.doorTo - V.door) * Math.min(1, dt * (V.doorTo > V.door ? 0.9 : 3));
      if (k.debug('lit')) V.door = V.doorTo; // скриншот: сразу открыт
      hinge.rotation.y = -V.door * 0.95; // не шире ~55°, чтобы 7 ламп на дверце оставались в кадре
      var glowIn = Math.min(1, V.door * 3);
      inLight.intensity = glowIn * 1.1;
      mouthGlow.material.opacity = glowIn * 0.3 + V.burst * 0.25;
      gems.forEach(function (g) { g.sp.material.opacity = glowIn * (0.35 + 0.35 * Math.max(0, Math.sin(t * 2 + g.ph))); g.m.rotation.y = t * 0.3 + g.ph; });
      // огонь, гирлянды, ёлка
      flames.forEach(function (f) {
        var n = Math.sin(t * 13 + f.ph) * 0.5 + Math.sin(t * 7.3 + f.ph * 2) * 0.5;
        f.f1.scale.set(0.62 + n * 0.06, 1.25 + n * 0.22, 1); f.f2.scale.set(0.34 + n * 0.04, 0.62 + n * 0.12, 1);
        f.f1.material.rotation = Math.sin(t * 3.1 + f.ph) * 0.06;
        f.pl.intensity = 1.2 + n * 0.25 + V.burst * 1.5;
      });
      for (var g = 0; g < 3; g++) { var tw = 0.55 + 0.45 * Math.sin(t * 1.7 + g * 2.1); twinkle[g][0].opacity = tw * 0.7; twinkle[g][1].opacity = 0.5 + tw * 0.5; }
      treeBulbs.forEach(function (b) { b.g.material.opacity = 0.55 + 0.45 * Math.sin(t * 3 + b.ph); });
      starGlow.material.opacity = 0.7 + 0.3 * Math.sin(t * 2);
      key.intensity = 2.4 + V.burst * 1.2;
    }

    return V;
  }

  window.Vault3D = { mount: mount, supported: supported };
})();
