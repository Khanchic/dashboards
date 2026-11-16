/**
 * 3D-мир The North Star Expedition (Scarlet Sands) на ядре _3d/ny3d.js. Игра (north-star-game.js, карта-пазл) не меняется:
 * эта сцена — путь экспедиции вокруг неё. Ночь в алых дюнах с инеем, лагерь (палатка с гирляндой, ёлка, костёр,
 * исследовательница и кот), тропа к Северной звезде: 6 находок → оазис → Golden Compass на дюне под звездой.
 * Отпечатки лап кота — у тропы. Пройденное загорается: фонарь у находки, золотые следы на тропе, вода оазиса,
 * луч звезды на компас. Клик по объекту/подписи — выбрать эту цель в игре.
 *
 *   NorthStar3D.render(box, { expedition: view|null, training: view|null }, { kind, current, onSelect(kind, key) })
 *   NorthStar3D.supported()   — есть ли WebGL (иначе мира нет, игра работает как раньше)
 *   ?ny3d=lit — всё как пройдено (для скриншотов).
 */
(function () {
  'use strict';
  var B = { crimson: 0xff2058, cta: 0xdb0037, gold: 0xffe229, sand: 0xe4b473, warm: 0xffb45a, night: 0x0b0b20, ice: 0xbfd2ff };
  // тропа: лагерь → находки 1–6 → оазис → компас. [x, z]
  var WAY = { camp: [-1.2, 6.2], s1: [3.6, 1.4], s2: [-3.4, -3.6], s3: [3.9, -8.6], s4: [-3.3, -13.6], s5: [3.4, -18.6], s6: [-2.9, -23.4], oasis: [0.6, -28.6], super: [0, -35.5] };
  var PAWS = { c1: [7.6, -1.4], c2: [-8.8, -8.4], c3: [8.2, -16.2], c4: [-8.4, -20.6] };
  var CAM = { pos: [0, 13, 28], look: [0, 0.5, -12] };
  var CAM_TALL = { pos: [0, 22, 17.5], look: [0, 0, -12.5] };

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.45 - a) / 0.85)); // десктоп-блок ~1.2–1.5, телефон ~0.5
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 44 + 14 * t, zoom: Math.max(0.66, Math.min(1, a / 0.95)) };
  }

  function css() {
    if (document.getElementById('scs3d-css')) return;
    var s = document.createElement('style'); s.id = 'scs3d-css';
    s.textContent =
      '.scs3d{height:clamp(520px,86vh,980px);margin:0 0 14px;background:#0b0b20;border:1px solid rgba(228,180,115,.22);border-radius:4px}' +
      '.scs3d .ny3d-label{font:400 12px/1.1 "Archivo Black",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#F3E6D2;' +
      'background:rgba(11,11,32,.8);border:1px solid rgba(228,180,115,.5);border-radius:3px;padding:5px 9px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;backdrop-filter:blur(4px)}' +
      '.scs3d .ny3d-label small{font:500 10.5px/1 "DM Mono",monospace;text-transform:none;letter-spacing:0;color:#B9A58C}' +
      '.scs3d .ny3d-label.lit{border-color:#FFE229;box-shadow:0 0 14px rgba(255,226,41,.35)} .scs3d .ny3d-label.lit small{color:#FFE229}' +
      '.scs3d .ny3d-label.ready{border-color:#FF2058} .scs3d .ny3d-label.ready small{color:#FF6F8F}' +
      '.scs3d .ny3d-label.miss small{color:#9aa6c8}' +
      '.scs3d .ny3d-label.locked{opacity:.6}' +
      '.scs3d .ny3d-label.cur{background:#DB0037;color:#fff;border-color:#FF2058} .scs3d .ny3d-label.cur small{color:#FFE229}' +
      '.scs3d .ny3d-label.paw{padding:3px 7px 4px;font-size:11px}' +
      '.scs3d .ny3d-label:focus-visible{outline:2px solid #FFE229;outline-offset:2px}' +
      '.scs3d-title{position:absolute;left:0;top:0;padding:16px 18px;pointer-events:none;z-index:2}' +
      '.scs3d-title h1{margin:0;font:400 clamp(1.3rem,3.4vw,2.4rem)/1.05 "Archivo Black",sans-serif;color:#FFE229;text-transform:uppercase;text-shadow:0 2px 18px rgba(0,0,0,.75)}' +
      '.scs3d-title p{margin:6px 0 0;font:500 12px "DM Mono",monospace;color:#F3E6D2;text-shadow:0 1px 8px rgba(0,0,0,.8)}' +
      '.scs3d-all{position:absolute;right:12px;top:12px;z-index:3;background:rgba(11,11,32,.8);color:#E4B473;border:1px solid rgba(228,180,115,.5);border-radius:3px;padding:7px 11px;font:500 11px "DM Mono",monospace;text-transform:uppercase;cursor:pointer}' +
      '.scs3d-all[hidden]{display:none}' +
      '@media (max-width:600px){.scs3d .ny3d-label.paw small{display:none}.scs3d .ny3d-label{font-size:10px;padding:4px 6px}.scs3d .ny3d-label small{font-size:9.5px}.scs3d-title h1{font-size:1.15rem}}';
    document.head.appendChild(s);
  }

  // ---------- рельеф: дюны, у тропы ровнее, под компасом — высокая дюна ----------
  function pathX(z) {
    // плавная кривая через точки тропы (для «коридора» в рельефе)
    var keys = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = WAY[keys[i]], b = WAY[keys[i + 1]];
      if (z <= a[1] && z >= b[1]) { var t = (a[1] - z) / (a[1] - b[1]); t = t * t * (3 - 2 * t); return a[0] + (b[0] - a[0]) * t; }
    }
    return z > WAY.camp[1] ? WAY.camp[0] : 0;
  }
  function H(x, z) {
    var d = 0.95 * Math.sin(x * 0.21 + z * 0.08) + 0.7 * Math.sin(x * 0.08 - z * 0.19 + 1.3) + 0.35 * Math.sin(x * 0.43 + z * 0.31 + 2.1);
    d = d * 0.8 + 0.6;
    var off = Math.abs(x - pathX(z)), flat = Math.min(1, Math.max(0, (off - 2.2) / 5));
    flat = flat * flat * (3 - 2 * flat);
    var h = d * (0.18 + 0.82 * flat) + Math.max(0, off - 9) * 0.16;
    var dz = z - WAY.super[1], dx = x - WAY.super[0];
    h += 2.6 * Math.exp(-(dx * dx + dz * dz) / 26);           // дюна компаса
    if (z < -40) h += (-40 - z) * 0.22;                         // дальние гряды
    var cz = z - WAY.camp[1], cx = x - WAY.camp[0];
    h *= 1 - 0.85 * Math.exp(-(cx * cx + cz * cz) / 30);        // ровная площадка лагеря
    var oz = z - WAY.oasis[1], ox = x - WAY.oasis[0];
    h -= 0.45 * Math.exp(-(ox * ox + oz * oz) / 9);              // чаша оазиса
    return h;
  }

  function build(box) {
    var k = NY3D.create(box, {
      bg: 0x0b0b20, fog: [0x2a1442, 46, 115], exposure: 1.2,
      env: [0x0c0e2a, 0x4a2418, 0x260a1c, 0x05050f], cam: { pos: CAM.pos, look: CAM.look, fov: 42 }, designAspect: 2, minZoom: 0.42, parallax: 0.8,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, obj: {}, lit: false, t: 0 };

    // ---------- небо ----------
    scene.background = k.tex(4, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#060a2a'); gr.addColorStop(0.45, '#14226a'); gr.addColorStop(0.78, '#3a2a78'); gr.addColorStop(1, '#7a2c62');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    var starN = 900, sp = new Float32Array(starN * 3), sc = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var a = -Math.PI * (0.08 + Math.random() * 0.84), el = 0.06 + Math.random() * 0.95, R = 140;
      sp[i * 3] = Math.cos(a) * Math.cos(el) * R; sp[i * 3 + 1] = Math.sin(el) * R * 0.55 + 4; sp[i * 3 + 2] = Math.sin(a) * Math.cos(el) * R - 20;
      var c = new T.Color(Math.random() < 0.15 ? 0xffe9a8 : Math.random() < 0.2 ? 0xffb0c8 : 0xdfe8ff); sc[i * 3] = c.r; sc[i * 3 + 1] = c.g; sc[i * 3 + 2] = c.b;
    }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('color', new T.BufferAttribute(sc, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
    scene.add(stars);
    // Северная звезда: четырёхлучевая, как на арте бренда
    var starTex = k.tex(256, 256, function (g, w) {
      var c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c);
      gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(0.12, 'rgba(255,226,120,.85)'); gr.addColorStop(0.4, 'rgba(255,190,80,.18)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
      g.translate(c, c); g.fillStyle = 'rgba(255,244,200,.95)';
      [[1, 0.06], [0.62, 0.045]].forEach(function (r, j) {
        g.save(); g.rotate(j * Math.PI / 4); g.beginPath();
        for (var s = 0; s < 8; s++) { var ang = s * Math.PI / 4, rr = s % 2 ? c * r[1] : c * r[0]; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
        g.closePath(); g.globalAlpha = j ? 0.55 : 1; g.fill(); g.restore();
      });
    });
    var nstar = new T.Sprite(new T.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    nstar.position.set(21, 16.5, -64); nstar.scale.set(17, 17, 1); scene.add(nstar);
    var nhalo = k.glow(0xffc46b, 34); nhalo.material.fog = false; nhalo.material.opacity = 0.35; nhalo.position.copy(nstar.position); scene.add(nhalo);

    // ---------- свет ----------
    var hemi = new T.HemisphereLight(0x7a7ad8, 0x4a1020, 0.8); scene.add(hemi);
    var moon = new T.DirectionalLight(0x9eb2ff, 0.75); moon.position.set(-14, 20, 8); scene.add(moon);
    var starLight = new T.DirectionalLight(0xffb060, 0.7); starLight.position.set(21, 16, -60); scene.add(starLight);
    var fire = new T.PointLight(0xff8a3a, 3.2, 16, 2); scene.add(fire);

    // ---------- дюны ----------
    var geo = new T.PlaneGeometry(150, 150, 150, 150); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -20);
    var P = geo.attributes.position, col = new Float32Array(P.count * 3);
    var cLow = new T.Color(0x4a0a26), cMid = new T.Color(0xa0162e), cHi = new T.Color(0xe03042), cSnow = new T.Color(0xc4d0f6), tmp = new T.Color();
    for (i = 0; i < P.count; i++) {
      var x = P.getX(i), z = P.getZ(i), h = H(x, z); P.setY(i, h);
      var hn = Math.max(0, Math.min(1, h / 2.2));
      tmp.copy(cLow).lerp(cMid, Math.min(1, hn * 1.6)); if (hn > 0.55) tmp.lerp(cHi, (hn - 0.55) * 1.8);
      var frost = (Math.sin(x * 0.37 + z * 0.11) + Math.sin(x * 0.13 - z * 0.29 + 2) + Math.sin(x * 0.71 + z * 0.53 + 4)) / 3 + (Math.min(h, 2.4) - 1.2) * 0.45; // иней пятнами на гребнях, без регулярной сетки
      if (frost > 0.5) tmp.lerp(cSnow, Math.min(0.55, (frost - 0.5) * 1.3));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    var sandTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      for (var j = 0; j < 7000; j++) { var v = 190 + Math.random() * 65 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.5)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
      g.strokeStyle = 'rgba(150,150,150,.25)'; g.lineWidth = 2;   // рябь песка
      for (j = 0; j < 22; j++) { g.beginPath(); var y0 = j * h / 22; g.moveTo(0, y0); for (var xx = 0; xx <= w; xx += 16) g.lineTo(xx, y0 + Math.sin(xx * 0.05 + j) * 4); g.stroke(); }
    });
    sandTex.wrapS = sandTex.wrapT = T.RepeatWrapping; sandTex.repeat.set(26, 26);
    var ground = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, map: sandTex, roughness: 0.95, metalness: 0 }));
    scene.add(ground);

    // ---------- тропа: следы, загораются золотом ----------
    var order = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    var curve = new T.CatmullRomCurve3(order.map(function (key) { var p = WAY[key]; return new T.Vector3(p[0], H(p[0], p[1]), p[1]); }), false, 'catmullrom', 0.4);
    // следы — одна геометрия (кружки) + одно облако точек-свечений: дёшево даже для телефона
    var N = 170, steps = [], SEG = 8, fpPos = [], fpCol = [], glPos = new Float32Array((N - 1) * 3), glCol = new Float32Array((N - 1) * 3);
    var cDark = new T.Color(0x3a0c1e), cGold = new T.Color(0xffd34a);
    for (i = 1; i < N; i++) {
      var u = i / N, p = curve.getPointAt(u), tg = curve.getTangentAt(u), side = (i % 2 ? 1 : -1) * 0.16;
      var sx = p.x + tg.z * side, sz = p.z - tg.x * side, sy = H(sx, sz) + 0.04;
      for (var q = 0; q < SEG; q++) {
        var a0 = q / SEG * Math.PI * 2, a1 = (q + 1) / SEG * Math.PI * 2;
        fpPos.push(sx, sy, sz, sx + Math.cos(a1) * 0.13, sy, sz + Math.sin(a1) * 0.13, sx + Math.cos(a0) * 0.13, sy, sz + Math.sin(a0) * 0.13);
        for (var r3 = 0; r3 < 3; r3++) fpCol.push(cDark.r, cDark.g, cDark.b);
      }
      glPos[(i - 1) * 3] = sx; glPos[(i - 1) * 3 + 1] = sy + 0.1; glPos[(i - 1) * 3 + 2] = sz;
      steps.push({ u: u, on: 0, lit: -1 });
    }
    var fpGeo = new T.BufferGeometry(); fpGeo.setAttribute('position', new T.Float32BufferAttribute(fpPos, 3)); fpGeo.setAttribute('color', new T.Float32BufferAttribute(fpCol, 3));
    var fpMesh = new T.Mesh(fpGeo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 })); scene.add(fpMesh);
    var dotTex = k.tex(64, 64, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    var glGeo = new T.BufferGeometry(); glGeo.setAttribute('position', new T.BufferAttribute(glPos, 3)); glGeo.setAttribute('color', new T.BufferAttribute(glCol, 3));
    var glPts = new T.Points(glGeo, new T.PointsMaterial({ size: 0.75, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(glPts);
    // доля тропы до каждой точки
    var uAt = {}; order.forEach(function (key) {
      var p = WAY[key], best = 0, bd = 1e9;
      for (var j = 0; j <= 400; j++) { var q = curve.getPointAt(j / 400), dd = (q.x - p[0]) * (q.x - p[0]) + (q.z - p[1]) * (q.z - p[1]); if (dd < bd) { bd = dd; best = j / 400; } }
      uAt[key] = best;
    });

    // ---------- материалы ----------
    var stoneMat = new T.MeshStandardMaterial({ color: 0xc89a6a, roughness: 0.9, flatShading: true });
    var stoneDark = new T.MeshStandardMaterial({ color: 0x8a5a44, roughness: 0.95, flatShading: true });
    var woodMat = new T.MeshStandardMaterial({ color: 0x6a3a22, roughness: 0.85 });
    var frostMat = new T.MeshStandardMaterial({ color: 0xe6ecff, roughness: 0.8, flatShading: true });
    function at(obj, x, z, dy) { obj.position.set(x, H(x, z) + (dy || 0), z); scene.add(obj); return obj; }

    // ---------- декор: ориентиры пустыни (как на карте) ----------
    function pyramid(x, z, s) {
      var g = new T.Group();
      var m = new T.Mesh(new T.ConeGeometry(1, 1, 4), new T.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.85, flatShading: true })); m.rotation.y = Math.PI / 4; m.position.y = 0.5; g.add(m);
      var cap = new T.Mesh(new T.ConeGeometry(0.24, 0.24, 4), frostMat); cap.rotation.y = Math.PI / 4; cap.position.y = 0.89; g.add(cap);
      g.scale.set(s, s * 0.8, s); return at(g, x, z, -0.2);
    }
    pyramid(-15, -24, 7); pyramid(-9.5, -31, 3.6); pyramid(16, -34, 5);
    (function obelisk(x, z) {
      var g = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(0.22, 0.42, 4.2, 4), stoneMat); m.rotation.y = Math.PI / 4; m.position.y = 2.1; g.add(m);
      var tip = new T.Mesh(new T.ConeGeometry(0.3, 0.5, 4), new T.MeshStandardMaterial({ color: 0xffd36a, metalness: 0.7, roughness: 0.3 })); tip.rotation.y = Math.PI / 4; tip.position.y = 4.45; g.add(tip);
      g.rotation.z = 0.06; at(g, x, z, -0.1);
    })(10.5, -6);
    (function temple(x, z) {
      var g = new T.Group();
      var base = new T.Mesh(new T.BoxGeometry(5, 0.4, 2.6), stoneMat); base.position.y = 0.2; g.add(base);
      [-2, -0.7, 0.7, 2].forEach(function (cx, j) { var h = j === 2 ? 1.4 : 2.6; var c = new T.Mesh(new T.CylinderGeometry(0.22, 0.26, h, 10), stoneMat); c.position.set(cx, 0.4 + h / 2, 0); g.add(c); });
      var lin = new T.Mesh(new T.BoxGeometry(3.2, 0.35, 0.8), stoneMat); lin.position.set(-1.35, 3.15, 0); lin.rotation.z = -0.04; g.add(lin);
      g.rotation.y = 0.5; at(g, x, z, -0.1);
    })(-11.5, -5.5);
    function cactus(x, z, s) {
      var g = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0x2f8a52, roughness: 0.7 });
      var t = new T.Mesh(new T.CapsuleGeometry(0.26, 1.6, 4, 10), mat); t.position.y = 1.05; g.add(t);
      [[-1, 0.9, 0.55], [1, 1.25, 0.45]].forEach(function (a) {
        var arm = new T.Mesh(new T.CapsuleGeometry(0.16, a[2], 4, 8), mat); arm.position.set(a[0] * 0.48, a[1] + 0.3, 0); g.add(arm);
        var j = new T.Mesh(new T.CapsuleGeometry(0.15, 0.22, 4, 8), mat); j.rotation.z = Math.PI / 2; j.position.set(a[0] * 0.3, a[1], 0); g.add(j);
      });
      var fl = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), new T.MeshStandardMaterial({ color: B.crimson, emissive: B.cta, emissiveIntensity: 0.4 })); fl.position.y = 1.95; g.add(fl);
      g.scale.setScalar(s); g.rotation.y = x; return at(g, x, z, -0.05);
    }
    cactus(7.2, 4.2, 1); cactus(-8.6, -15.5, 1.15); cactus(9.5, -21.5, 0.9); cactus(-6.8, 1.2, 0.8);
    (function well(x, z) {
      var g = new T.Group();
      var ring = new T.Mesh(new T.CylinderGeometry(0.85, 0.95, 0.7, 14, 1, true), stoneMat); ring.material = stoneMat; ring.position.y = 0.35; g.add(ring);
      var water = new T.Mesh(new T.CircleGeometry(0.8, 14), new T.MeshStandardMaterial({ color: 0x0a1a3a, roughness: 0.2 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.5; g.add(water);
      [-0.8, 0.8].forEach(function (px) { var post = new T.Mesh(new T.BoxGeometry(0.12, 1.6, 0.12), woodMat); post.position.set(px, 1.1, 0); g.add(post); });
      var beam = new T.Mesh(new T.BoxGeometry(1.9, 0.12, 0.12), woodMat); beam.position.y = 1.9; g.add(beam);
      at(g, x, z, -0.05);
    })(10.5, -26.5);

    // ---------- лагерь: палатка с гирляндой, ёлка, костёр, ковёр ----------
    var camp = new T.Group(); at(camp, WAY.camp[0], WAY.camp[1], 0);
    var canvasMat = new T.MeshStandardMaterial({ color: 0xd8a868, roughness: 0.85, side: T.DoubleSide, flatShading: true });
    var tentGeo = new T.CylinderGeometry(1.75, 1.75, 3.4, 3, 1, true); tentGeo.rotateX(Math.PI / 2); tentGeo.rotateZ(Math.PI); // треугольная призма коньком вверх
    var tent = new T.Mesh(tentGeo, canvasMat); tent.position.set(-3.2, 0.875, -0.6);
    var tentG = new T.Group(); tentG.add(tent); tentG.rotation.y = 0.55; camp.add(tentG);
    var floor = new T.Mesh(new T.PlaneGeometry(3.0, 3.4), new T.MeshStandardMaterial({ color: 0x5a2a1a, roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(-3.2, 0.02, -0.6); tentG.add(floor);
    var door = new T.Mesh(new T.CircleGeometry(0.9, 3), new T.MeshStandardMaterial({ color: 0x2a0c08, emissive: B.warm, emissiveIntensity: 0.55, side: T.DoubleSide }));
    door.rotation.z = Math.PI / 2; door.position.set(-3.2, 0.62, 1.12); tentG.add(door);
    var tentGlow = k.glow(B.warm, 3); tentGlow.position.set(-3.2, 0.8, 1.6); tentG.add(tentGlow);
    var campBulbs = [];
    for (i = 0; i <= 14; i++) {   // гирлянда по коньку и скатам
      var tt = i / 14, bx = -3.2 + (tt < 0.5 ? -1.5 + tt * 2 * 1.5 : 1.5 - (tt - 0.5) * 2 * 1.5) * 1, by = 0.05 + (tt < 0.5 ? tt * 2 : (1 - tt) * 2) * 2.55;
      var bulb = k.glow(i % 3 === 0 ? B.crimson : i % 3 === 1 ? B.gold : B.warm, 0.55); bulb.position.set(bx, by, 1.25); tentG.add(bulb); campBulbs.push(bulb);
    }
    for (i = 0; i < 9; i++) { var rb = k.glow(i % 2 ? B.gold : B.warm, 0.5); rb.position.set(-3.2, 2.62, 1.0 - i * 0.38); tentG.add(rb); campBulbs.push(rb); }
    // ёлочка
    var xtree = new T.Group();
    [[0.75, 1.0, 0.75], [0.58, 0.85, 1.35], [0.38, 0.7, 1.85]].forEach(function (t) { var c = new T.Mesh(new T.ConeGeometry(t[0], t[1], 9), new T.MeshStandardMaterial({ color: 0x1f7a44, roughness: 0.8, flatShading: true })); c.position.y = t[2]; xtree.add(c); });
    var pot = new T.Mesh(new T.CylinderGeometry(0.32, 0.25, 0.45, 12), new T.MeshStandardMaterial({ color: 0xb4532e, roughness: 0.7 })); pot.position.y = 0.22; xtree.add(pot);
    var baubles = [];
    for (i = 0; i < 12; i++) {
      var ty = 0.75 + (i / 12) * 1.4, tr = 0.72 * (1 - (ty - 0.5) / 1.9) + 0.06, ta = i * 2.3;
      var bm = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshStandardMaterial({ color: i % 2 ? 0xd4002e : 0xffc83a, metalness: 0.6, roughness: 0.25, emissive: i % 2 ? 0x5a0010 : 0x6a4a00, emissiveIntensity: 0.6 }));
      bm.position.set(Math.cos(ta) * tr, ty, Math.sin(ta) * tr); xtree.add(bm); baubles.push(bm);
    }
    var tstar = k.glow(B.gold, 0.9); tstar.position.y = 2.32; xtree.add(tstar);
    xtree.position.set(-5.6, 0, 0.8); camp.add(xtree);
    // ковёр
    var rug = new T.Mesh(new T.PlaneGeometry(2.6, 1.6), new T.MeshStandardMaterial({ roughness: 0.9, map: k.tex(256, 160, function (g, w, h) {
      g.fillStyle = '#7a1424'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e4b473'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
      g.fillStyle = '#d4a04a'; for (var j = 0; j < 5; j++) { g.save(); g.translate(40 + j * 44, h / 2); g.rotate(Math.PI / 4); g.fillRect(-12, -12, 24, 24); g.restore(); }
      g.fillStyle = '#2a3a7a'; g.fillRect(14, 30, w - 28, 6); g.fillRect(14, h - 36, w - 28, 6);
    }) }));
    rug.rotation.x = -Math.PI / 2; rug.rotation.z = 0.15; rug.position.set(1.6, 0.03, 1.2); camp.add(rug);
    // костёр
    var fireG = new T.Group(); fireG.position.set(-0.3, 0, 1.9); camp.add(fireG);
    for (i = 0; i < 8; i++) { var stn = new T.Mesh(new T.DodecahedronGeometry(0.17, 0), stoneDark); var aa = i / 8 * Math.PI * 2; stn.position.set(Math.cos(aa) * 0.48, 0.1, Math.sin(aa) * 0.48); fireG.add(stn); }
    for (i = 0; i < 3; i++) { var lg = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.8, 6), woodMat); lg.rotation.z = Math.PI / 2; lg.rotation.y = i * 1.05; lg.position.y = 0.12; fireG.add(lg); }
    var flames = [];
    [[0, 0.62, 0.26, 0xffd23a], [0.1, 0.48, 0.2, 0xff8a1a], [-0.1, 0.5, 0.2, 0xff5a1a]].forEach(function (f, j) {
      var fl = new T.Mesh(new T.ConeGeometry(f[2], f[1], 7), new T.MeshBasicMaterial({ color: f[3], transparent: true, opacity: 0.92 }));
      fl.position.set(f[0], 0.18 + f[1] / 2, j ? 0.05 : 0); fireG.add(fl); flames.push(fl);
    });
    var fireGlow = k.glow(0xff8a2a, 2.6); fireGlow.position.y = 0.55; fireG.add(fireGlow);
    var fireSpill = k.glow(0xff6a1a, 6); fireSpill.position.y = 0.1; fireSpill.material.opacity = 0.45; fireG.add(fireSpill);
    fire.position.set(camp.position.x - 0.3, camp.position.y + 1.1, camp.position.z + 1.9);
    // рюкзак
    var pack = new T.Mesh(new T.BoxGeometry(0.5, 0.62, 0.32), new T.MeshStandardMaterial({ color: 0x8a7a4a, roughness: 0.85 })); pack.position.set(-4.5, 0.31, 2.2); pack.rotation.y = 0.4; camp.add(pack);

    // ---------- персонажи: настоящие PNG бренда ----------
    var girl = k.billboard('../../scarletsands/assets/mascot-2.png', 2.75);
    girl.position.set(camp.position.x + 2.3, camp.position.y, camp.position.z + 1.6); scene.add(girl);
    // кот: у mascot-3.png поля шляпы срезаны по правому краю → мягко гасим последние пиксели, чтобы не было «ступеньки»
    var cat = new T.Group(), catMat = new T.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: T.DoubleSide, toneMapped: false, fog: false });
    var catMesh = new T.Mesh(new T.PlaneGeometry(1, 1), catMat); catMesh.visible = false; cat.add(catMesh);
    (function () {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'), w = img.width, h = img.height, pad = 18; c.width = w + pad; c.height = h;
        var g = c.getContext('2d'); g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'destination-out';
        var gr = g.createLinearGradient(w - 26, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr; g.fillRect(w - 26, 0, 26 + pad, h);
        var t = new T.CanvasTexture(c); if (T.sRGBEncoding) t.encoding = T.sRGBEncoding;
        catMat.map = t; catMat.needsUpdate = true;
        var hh = 1.05; catMesh.scale.set(hh * c.width / h, hh, 1); catMesh.position.y = hh / 2; catMesh.visible = true;
      };
      img.src = '../../scarletsands/assets/mascot-3.png';
    })();
    cat.position.set(camp.position.x + 1.0, camp.position.y, camp.position.z + 2.7); scene.add(cat);

    // ---------- точки тропы ----------
    var pinGeo = new T.CylinderGeometry(0.035, 0.035, 2.0, 6);
    function find(key, num) {
      var p = WAY[key], g = new T.Group(); at(g, p[0], p[1], 0);
      var cairn = new T.Group(); g.add(cairn);
      [[0, 0.2, 0.42], [0.06, 0.55, 0.32], [-0.03, 0.83, 0.22]].forEach(function (c, j) { var s = new T.Mesh(new T.DodecahedronGeometry(c[2], 0), j % 2 ? stoneDark : stoneMat); s.position.set(c[0], c[1], 0); s.rotation.set(j, j * 2, 0); cairn.add(s); });
      var pole = new T.Mesh(pinGeo, woodMat); pole.position.set(0.32, 1.0, 0); g.add(pole);
      var flagMat = new T.MeshStandardMaterial({ color: B.cta, emissive: B.cta, emissiveIntensity: 0.25, side: T.DoubleSide, roughness: 0.6 });
      var flag = new T.Mesh(new T.PlaneGeometry(0.8, 0.5, 6, 1), flagMat); flag.position.set(0.72, 1.72, 0); g.add(flag);
      var fp = flag.geometry.attributes.position, fx0 = [];
      for (var j = 0; j < fp.count; j++) fx0.push(fp.getX(j));
      var lantern = new T.Mesh(new T.BoxGeometry(0.22, 0.3, 0.22), new T.MeshStandardMaterial({ color: 0x3a2a1a, emissive: B.warm, emissiveIntensity: 0, roughness: 0.4 }));
      lantern.position.set(-0.45, 0.2, 0.25); g.add(lantern);
      var lg = k.glow(B.warm, 2.2); lg.position.set(-0.45, 0.35, 0.3); lg.material.opacity = 0; g.add(lg);
      var spill = k.glow(0xffa040, 4.2); spill.position.set(0, 0.15, 0.2); spill.material.opacity = 0; g.add(spill);
      var ring = new T.Mesh(new T.RingGeometry(1.25, 1.42, 40), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
      var o = { key: key, g: g, flag: flag, flagMat: flagMat, fp: fp, fx0: fx0, lantern: lantern.material, lg: lg, spill: spill, ring: ring, lit: 0, target: 0, labY: 2.45, hover: 0 };
      return o;
    }
    function paw(key, num) {
      var p = WAY[key] || PAWS[key], g = new T.Group(); at(g, p[0], p[1], 0.05);
      var pawTex = k.tex(128, 128, function (gg, w) {
        gg.fillStyle = '#fff'; gg.beginPath(); gg.ellipse(64, 80, 26, 21, 0, 0, Math.PI * 2); gg.fill();
        [[32, 48], [52, 32], [76, 32], [96, 48]].forEach(function (q) { gg.beginPath(); gg.ellipse(q[0], q[1], 11, 13, 0, 0, Math.PI * 2); gg.fill(); });
      });
      var mat = new T.MeshBasicMaterial({ map: pawTex, color: 0x6a1a2a, transparent: true, depthWrite: false });
      var m = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = num * 0.7; g.add(m);
      var gl = k.glow(B.crimson, 2.4); gl.position.y = 0.3; gl.material.opacity = 0; g.add(gl);
      var hit = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.6, 10), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.3; g.add(hit);
      return { key: key, g: g, pawMat: mat, gl: gl, lit: 0, target: 0, labY: 1.0, paw: true, hover: 0, ring: null };
    }
    function oasis() {
      var p = WAY.oasis, g = new T.Group(); at(g, p[0], p[1], 0);
      var water = new T.Mesh(new T.CircleGeometry(2.4, 40), new T.MeshStandardMaterial({ color: 0x0e4a7a, emissive: 0x18c8e0, emissiveIntensity: 0, roughness: 0.15, metalness: 0.3 }));
      water.rotation.x = -Math.PI / 2; water.scale.set(1, 0.7, 1); water.position.y = 0.06; g.add(water);
      var shore = new T.Mesh(new T.RingGeometry(2.3, 2.9, 40), new T.MeshStandardMaterial({ color: 0x3a8a4a, roughness: 0.9, side: T.DoubleSide })); shore.rotation.x = -Math.PI / 2; shore.scale.set(1, 0.7, 1); shore.position.y = 0.04; g.add(shore);
      var palms = [];
      [[-2.3, -0.6, 2.9, 0.25], [2.5, -0.2, 3.4, -0.3], [1.3, -1.7, 2.4, -0.12], [-1.2, 1.5, 2.0, 0.18]].forEach(function (q) {
        var pg = new T.Group(); pg.position.set(q[0], 0, q[1]);
        var trunk = new T.Mesh(new T.CylinderGeometry(0.1, 0.17, q[2], 7), new T.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.9, flatShading: true })); trunk.position.y = q[2] / 2; trunk.rotation.z = q[3]; pg.add(trunk);
        var top = new T.Group(); top.position.set(-Math.sin(q[3]) * q[2] * 0.5, q[2], 0); pg.add(top);
        for (var j = 0; j < 7; j++) {
          var lgp = new T.Group(); lgp.rotation.y = j / 7 * Math.PI * 2 + q[0]; top.add(lgp);
          var lgeo = new T.ConeGeometry(0.26, 1.7, 4); lgeo.translate(0, 0.85, 0);
          var leaf = new T.Mesh(lgeo, new T.MeshStandardMaterial({ color: j % 2 ? 0x1f9a4a : 0x34c060, roughness: 0.7, flatShading: true }));
          leaf.scale.set(1, 1, 0.28); leaf.rotation.z = -(1.75 + (j % 3) * 0.12); lgp.add(leaf);
        }
        g.add(pg); palms.push(pg);
      });
      var lanterns = [];
      for (var j = 0; j < 8; j++) { var a = j / 8 * Math.PI * 2, lgw = k.glow(j % 2 ? B.gold : 0x5ae8ff, 1.1); lgw.position.set(Math.cos(a) * 2.75, 0.35, Math.sin(a) * 1.95); lgw.material.opacity = 0; g.add(lgw); lanterns.push(lgw); }
      var wglow = k.glow(0x3ae0ff, 7); wglow.position.y = 0.3; wglow.material.opacity = 0; g.add(wglow);
      var ring = new T.Mesh(new T.RingGeometry(3.1, 3.3, 48), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; g.add(ring);
      return { key: 'oasis', g: g, water: water.material, lanterns: lanterns, wglow: wglow, ring: ring, lit: 0, target: 0, labY: 3.9, hover: 0 };
    }
    function compass() {
      var p = WAY.super, g = new T.Group(); at(g, p[0], p[1], 0);
      var ped = new T.Mesh(new T.CylinderGeometry(0.75, 0.95, 0.9, 8), stoneMat); ped.position.y = 0.45; g.add(ped);
      var gold = new T.MeshStandardMaterial({ color: 0xffc83a, metalness: 0.9, roughness: 0.22, emissive: 0x6a4a00, emissiveIntensity: 0.15 });
      var cg = new T.Group(); cg.position.y = 1.65; g.add(cg);
      var rim = new T.Mesh(new T.TorusGeometry(0.62, 0.11, 12, 40), gold); cg.add(rim);
      var face = new T.Mesh(new T.CircleGeometry(0.56, 32), new T.MeshStandardMaterial({ color: 0xf3e6d2, roughness: 0.5, emissive: 0xffe9b0, emissiveIntensity: 0.1 })); face.position.z = -0.01; cg.add(face);
      var needle = new T.Mesh(new T.ConeGeometry(0.1, 0.9, 4), new T.MeshStandardMaterial({ color: B.cta, emissive: B.cta, emissiveIntensity: 0.4 })); needle.position.set(0, 0.0, 0.03); needle.scale.z = 0.3; cg.add(needle);
      var back = new T.Mesh(new T.CircleGeometry(0.58, 32), gold); back.rotation.y = Math.PI; back.position.z = -0.03; cg.add(back);
      var lockG = new T.Group(); g.add(lockG);
      var lockBody = new T.Mesh(new T.BoxGeometry(0.42, 0.34, 0.16), new T.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.6, roughness: 0.4 })); lockBody.position.set(0, 1.0, 0.85); lockG.add(lockBody);
      var shack = new T.Mesh(new T.TorusGeometry(0.14, 0.04, 8, 16, Math.PI), lockBody.material); shack.position.set(0, 1.17, 0.85); lockG.add(shack);
      var gl = k.glow(B.gold, 3.2); gl.position.y = 1.65; gl.material.opacity = 0.15; g.add(gl);
      // звёздная дорожка от компаса к Северной звезде: искры летят вверх (мягче, чем сплошной луч)
      var from = g.position.clone().add(new T.Vector3(0, 1.65 * 1.45, 0)), beam = [];
      for (var j = 0; j < 26; j++) { var sp2 = k.glow(j % 3 ? 0xffe08a : 0xffffff, 1); sp2.material.fog = false; sp2.material.opacity = 0; scene.add(sp2); beam.push(sp2); }
      beam.from = from; beam.to = nstar.position.clone();
      var ring = new T.Mesh(new T.RingGeometry(1.4, 1.58, 40), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
      g.scale.setScalar(1.45);
      return { key: 'super', g: g, cg: cg, gold: gold, gl: gl, beam: beam, lockG: lockG, ring: ring, lit: 0, target: 0, labY: 3.0, hover: 0 };
    }

    function attach(o, kindKey) {
      o.lab = k.label(o.g, [0, o.labY, 0], '', function () { if (S.onSelect) S.onSelect(kindKey, o.key); });
      if (o.paw) o.lab.cls('paw', true);
      k.pick(o.g, function () { if (S.onSelect) S.onSelect(kindKey, o.key); }, function (on) { o.hover = on ? 1 : 0; });
      S.obj[o.key] = o;
    }
    ['s1', 's2', 's3', 's4', 's5', 's6'].forEach(function (key, j) { attach(find(key, j + 1), 'expedition'); });
    ['c1', 'c2', 'c3', 'c4'].forEach(function (key, j) { attach(paw(key, j + 1), 'expedition'); });
    attach(oasis(), 'expedition');
    attach(compass(), 'expedition');
    var campO = { key: 't', g: camp, lit: 0, target: 0, labY: 3.6, hover: 0, ring: null, camp: true };
    campO.lab = k.label(camp, [-2.4, 3.9, 0], '', function () { if (S.onSelect) S.onSelect('training', 't'); });
    k.pick(tentG, function () { if (S.onSelect) S.onSelect('training', 't'); }, function (on) { campO.hover = on ? 1 : 0; });
    S.obj.t = campO;

    // лёгкий иней в воздухе (Рождество в пустыне)
    k.snow({ n: 500, area: [46, 16, 50], center: [0, 0, -14], speed: 0.5, size: 0.14, opacity: 0.65, color: 0xdfe6ff });

    // ---------- анимация ----------
    var dbgN = 0, dbgOn = k.debug('info');
    if (dbgOn) k.renderer.domElement.addEventListener('webglcontextlost', function () { box.setAttribute('data-lost', 'frame ' + dbgN); });
    k.onFrame(function (t, dt) { try { frameFn(t, dt); } catch (e) { if (dbgOn) box.setAttribute('data-err', String(e && e.stack || e).slice(0, 300)); throw e; } });
    function frameFn(t, dt) {
      S.t = t;
      if (dbgOn) { dbgN++; var c = k.camera; box.setAttribute('data-cam', dbgN + ' pos ' + c.position.toArray().map(function (v) { return v.toFixed(1); }) + ' t ' + t.toFixed(1)); }
      var f = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
      fire.intensity = 3.2 * f; fireGlow.material.opacity = 0.75 * f;
      flames.forEach(function (fl, j) { fl.scale.set(1, 0.85 + 0.25 * Math.sin(t * (9 + j * 3) + j), 1); fl.rotation.y = t * (1 + j); });
      campBulbs.forEach(function (b, j) { b.material.opacity = 0.6 + 0.4 * Math.sin(t * 2.2 + j * 1.3); });
      tstar.material.opacity = 0.7 + 0.3 * Math.sin(t * 3);
      var tw = 0.9 + 0.1 * Math.sin(t * 1.3);
      nstar.material.rotation = Math.sin(t * 0.2) * 0.04; nstar.scale.setScalar(17 * tw * (1 + 0.12 * S.prog)); nhalo.material.opacity = 0.25 + 0.25 * S.prog;
      stars.material.opacity = 0.75 + 0.15 * Math.sin(t * 0.7);
      // следы на тропе
      var fc = fpGeo.attributes.color, recol = false;
      steps.forEach(function (s, j) {
        var on = s.u <= S.trailU ? 1 : 0; s.on += (on - s.on) * Math.min(1, dt * 3);
        var e = s.on * 0.85 * (0.6 + 0.4 * Math.sin(t * 3 - s.u * 30));
        glCol[j * 3] = cGold.r * e; glCol[j * 3 + 1] = cGold.g * e; glCol[j * 3 + 2] = cGold.b * e;
        var L = s.on > 0.5 ? 1 : 0;
        if (L !== s.lit) { s.lit = L; recol = true; var c2 = L ? cGold : cDark; for (var q = 0; q < SEG * 3; q++) fc.setXYZ(j * SEG * 3 + q, c2.r, c2.g, c2.b); }
      });
      glGeo.attributes.color.needsUpdate = true; if (recol) fc.needsUpdate = true;
      Object.keys(S.obj).forEach(function (key) {
        var o = S.obj[key]; o.lit += (o.target - o.lit) * Math.min(1, dt * 2.4);
        var cur = S.current === key;
        if (o.ring) { o.ring.material.opacity += ((cur ? 0.9 : o.hover ? 0.45 : o.ready ? 0.28 + 0.18 * Math.sin(t * 3) : 0) - o.ring.material.opacity) * Math.min(1, dt * 6); o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.03); }
        if (o.flag) {
          o.flag.visible = o.state !== 'locked';
          o.flagMat.color.setHex(o.state === 'miss' ? 0x6a7aa8 : B.cta); o.flagMat.emissive.setHex(o.state === 'miss' ? 0x101828 : B.cta);
          for (var j = 0; j < o.fp.count; j++) { var x0 = o.fx0[j] + 0.4; o.fp.setZ(j, Math.sin(t * 4 + x0 * 5 + o.g.position.z) * 0.07 * x0); }
          o.fp.needsUpdate = true;
          o.lantern.emissiveIntensity = o.lit * (1.6 + 0.3 * Math.sin(t * 9 + o.g.position.x));
          o.lg.material.opacity = o.lit * 0.9; o.spill.material.opacity = o.lit * 0.45;
          o.g.scale.setScalar(1 + o.hover * 0.06);
        }
        if (o.paw) {
          o.pawMat.color.setHex(o.state === 'locked' ? 0x4a1424 : o.lit > 0.5 ? 0xffd34a : B.crimson);
          o.pawMat.opacity = o.state === 'locked' ? 0.5 : 0.95;
          o.gl.material.opacity = o.lit * (0.6 + 0.3 * Math.sin(t * 2.5 + o.g.position.x)) + (o.state === 'ready' ? 0.25 : 0);
          o.g.scale.setScalar(1 + o.hover * 0.12);
        }
        if (o.water) {
          o.water.emissiveIntensity = 0.12 + o.lit * (0.75 + 0.12 * Math.sin(t * 1.8));
          o.wglow.material.opacity = o.lit * 0.42;
          o.lanterns.forEach(function (l, j) { l.material.opacity = o.lit * (0.6 + 0.4 * Math.sin(t * 2 + j)); });
        }
        if (o.cg) {
          o.cg.rotation.y = t * (0.4 + o.lit * 0.6); o.cg.position.y = 1.65 + Math.sin(t * 1.5) * 0.08 * (0.3 + o.lit);
          o.gold.emissiveIntensity = 0.15 + o.lit * 0.9; o.gl.material.opacity = 0.15 + o.lit * 0.75;
          o.beam.forEach(function (b, j) { var u = ((j / o.beam.length) + t * 0.06) % 1; b.position.lerpVectors(o.beam.from, o.beam.to, u); b.scale.setScalar(0.6 + u * 2.4); b.material.opacity = o.lit * Math.sin(u * Math.PI) * 0.85; });
          o.lockG.visible = o.state === 'locked';
        }
      });
    }

    S.frame = frame(16 / 9);
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F;
      k.camera.fov = F.fov;
      k.camera.zoom = F.zoom; // зум свой: designAspect ядра (2) мельчит сцену в десктоп-блоке 1.2–1.5
      k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') k.look(F.pos, F.look, 0.4);
    });
    S.prog = 0; S.trailU = 0;
    return S;
  }

  // ---------- статусы ----------
  var CH_TIME = ['11 AM', '3 PM', '7 PM'];
  function state(t) {
    if (!t) return 'locked';
    if (t.done) return 'lit';
    if (t.revealed) return 'miss';
    if (t.lock) return 'locked';
    return 'ready';
  }
  function small(t, key, ch) {
    var s = state(t);
    if (s === 'lit') return key === 'super' ? 'found!' : key[0] === 'c' ? 'paw print' : key === 'oasis' ? 'found' : 'stamped';
    if (s === 'miss') return 'no tries left';
    if (s === 'locked') {
      var l = t && t.lock || {};
      if (l.why === 'not_open' && ch) return 'Dec 25 · ' + CH_TIME[ch - 1] + ' ET';
      if (l.why === 'not_open' && key === 'oasis') return 'Dec 26 · 11 AM ET';
      if (l.why === 'not_released') return 'watch the chat';
      if (l.why === 'need_stamps') return l.need + ' more stamps';
      if (l.why === 'need_finds') return 'finds first';
      if (l.why === 'need_all') return 'find everything';
      if (l.why === 'lost') return 'out of reach';
      if (l.why === 'closed') return 'over';
      return 'locked';
    }
    return (t.tries || 0) + ' / ' + (t.max || 0) + ' pins';
  }

  function render(box, data, opts) {
    opts = opts || {}; data = data || {};
    var S = box._ns3d;
    if (!S) {
      if (!supported()) { box.hidden = true; return null; }
      css();
      box.classList.add('scs3d');
      Array.prototype.slice.call(box.children).forEach(function (c) { if (!c.classList.contains('scs3d-title')) box.removeChild(c); });
      S = build(box);
      if (!S) { box.classList.remove('scs3d'); box.hidden = true; return null; }
      box._ns3d = S;
      var all = document.createElement('button'); all.type = 'button'; all.className = 'scs3d-all'; all.textContent = 'Whole route'; all.hidden = true;
      all.onclick = function () { S.focus = null; S.camKey = null; all.hidden = true; apply(S); };
      box.appendChild(all); S.allBtn = all;
    }
    var lit = S.k.debug('lit');
    var v = data.expedition, tv = data.training;
    if (lit) {
      var D = { done: true, tries: 1, max: 3 };
      v = { tasks: ['s1', 's2', 's3', 's4', 's5', 's6'].map(function (s, i) { return Object.assign({ slot: s, chapter: 1 + (i >> 1) }, D); }), cats: ['c1', 'c2', 'c3', 'c4'].map(function (c) { return Object.assign({ key: c }, D); }), oasis: D, super: D, progress: { stamps: 10, oasis: true, golden: true } };
      tv = { target: D };
    }
    var prev = S.current;
    S.onSelect = opts.onSelect; S.kind = opts.kind || 'expedition';
    S.current = S.kind === 'training' ? 't' : (opts.current || null);
    // цели экспедиции
    var tasks = v && v.tasks || [], doneN = 0, lastDone = 'camp';
    ['s1', 's2', 's3', 's4', 's5', 's6'].forEach(function (key, i) {
      var t = tasks.filter(function (x) { return x.slot === key; })[0] || tasks[i] || null;
      var o = S.obj[key], st = v ? state(t) : 'locked';
      o.state = st; o.target = st === 'lit' ? 1 : 0; o.ready = st === 'ready';
      if (st === 'lit' || st === 'miss') { doneN++; lastDone = key; }
      var ch = t && t.chapter || 1 + (i >> 1);
      setLab(o, 'Find ' + (i + 1), v ? small(t, key, ch) : 'Dec 25 · ' + CH_TIME[ch - 1] + ' ET', st, t && t.item ? 'Find ' + (i + 1) + ': ' + t.item : 'Find ' + (i + 1));
    });
    var cats = v && v.cats || [];
    ['c1', 'c2', 'c3', 'c4'].forEach(function (key, i) {
      var t = cats.filter(function (x) { return x.key === key; })[0] || cats[i] || null, o = S.obj[key], st = v ? state(t) : 'locked';
      o.state = st; o.target = st === 'lit' ? 1 : 0; o.ready = st === 'ready';
      setLab(o, 'Paw ' + (i + 1), v ? small(t, key) : 'soon', st, 'Paw print ' + (i + 1));
    });
    [['oasis', 'Oasis'], ['super', 'Golden Compass']].forEach(function (q) {
      var t = v && v[q[0]], o = S.obj[q[0]], st = v ? state(t) : 'locked';
      o.state = st; o.target = st === 'lit' ? 1 : 0; o.ready = st === 'ready';
      if (st === 'lit') lastDone = q[0];
      setLab(o, q[1], v ? small(t, q[0]) : q[0] === 'oasis' ? 'Dec 26 · 11 AM ET' : 'Dec 26', st, q[1]);
    });
    // лагерь = страница-тренировка
    var ts = tv ? state(tv.target) : 'ready', camp = S.obj.t;
    camp.state = ts; camp.target = ts === 'lit' ? 1 : 0;
    setLab(camp, 'Camp', ts === 'lit' ? 'practice done' : 'practice page', ts, 'Camp: practice page');
    // золотые следы — до последней пройденной точки по порядку
    var order = ['s1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'], reach = 'camp';
    for (var i = 0; i < order.length; i++) { var st2 = S.obj[order[i]].state; if (st2 === 'lit' || st2 === 'miss') reach = order[i]; else break; }
    var keys = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    S.trailU = reach === 'camp' ? 0 : keys.indexOf(reach) / (keys.length - 1) + 0.002;
    S.prog = v && v.progress ? Math.min(1, (v.progress.stamps || 0) / 10 + (v.progress.golden ? 0.3 : 0)) : 0;
    // камера: общий план; к цели — только когда игрок сам переключился (не при первой загрузке)
    if (prev && S.current && prev !== S.current) S.focus = S.current;
    apply(S);
    if (S.k.debug('info')) { var c = S.k.camera; box.setAttribute('data-cam', 'pos ' + c.position.toArray().map(function (q) { return q.toFixed(1); }) + ' fov ' + c.fov.toFixed(1) + ' zoom ' + c.zoom.toFixed(2) + ' asp ' + c.aspect.toFixed(2) + ' frame ' + JSON.stringify(S.frame)); }
    return S;
  }
  function setLab(o, title, sub, st, aria) {
    o.lab.set(title + '<small>' + sub + '</small>');
    o.lab.el.setAttribute('aria-label', aria + ': ' + sub);
    o.lab.cls('lit', st === 'lit'); o.lab.cls('ready', st === 'ready'); o.lab.cls('locked', st === 'locked'); o.lab.cls('miss', st === 'miss');
  }
  function apply(S) {
    Object.keys(S.obj).forEach(function (key) { S.obj[key].lab.cls('cur', S.current === key); });
    var o = S.focus && S.obj[S.focus];
    if (o) {
      var key = 'f:' + S.focus;
      if (S.camKey !== key) {
        S.camKey = key;
        var p = o.g.position, tall = S.frame.t > 0.5, far = o.key === 'super' ? 12 : o.camp ? 11 : 10;
        S.k.look([p.x * 0.35, p.y + (tall ? 11 : 6.5), p.z + far], [p.x * 0.7, p.y + 0.8, p.z - 2], 1.5);
      }
      S.allBtn.hidden = false;
    } else if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.4); S.allBtn.hidden = true; }
  }

  window.NorthStar3D = { render: render, supported: supported };
})();
