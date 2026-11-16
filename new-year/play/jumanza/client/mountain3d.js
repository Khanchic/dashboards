/**
 * 3D-гора Christmas on Kilimanjaro (Jumanza) на ядре _3d/ny3d.js. Тот же интерфейс, что у 2D mountain.js:
 *   Mountain3D.render(el, levels, { current, onOpen(id, level), route })  — первый вызов строит сцену, дальше только обновляет
 *   Mountain3D.cheer(el, id)                                               — вспышка на только что пройденной тропе
 *   Mountain3D.supported()                                                 — есть ли WebGL (иначе страница рисует 2D Mountain)
 * Сюжет: сумерки над саванной, гора поясами (саванна → дождевой лес → вереск → пустошь → альпийская пустыня → ледник),
 * тропа серпантином, на ней лагеря-уровни. Пройденная тропа — костёр, фонарики, зелёный флаг, участок тропы светится.
 * Вершина: ёлка; открыта (4 тропы) — звезда мерцает, пройдена — ёлка горит, звери собираются вокруг.
 * Сафари-джип едет к текущему лагерю, лев ждёт в базовом лагере.
 *
 * Маршрут (форма горы, пояса, точки лагерей, камера) — данные в ROUTES, код сцены от них не зависит:
 * следующая карта = ещё один ключ в ROUTES и opts.route при вызове render.
 */
(function () {
  'use strict';
  var BRAND = { y: 0xf1d627, g: 0x49f623, p: 0x5c05e5, bg: 0x100128, fire: 0xff8a2a, warm: 0xffc46b };

  // ====================================================================================================
  // МАРШРУТЫ. Лагерь: [угол вокруг горы (0 — к зрителю, + вправо), высота, вынос наружу от склона].
  var ROUTES = {
    kili: {
      peak: 18, base: 31, top: 5.6, power: 1.3,          // высота, радиус подножия, радиус плато, «вогнутость» склона
      // пояса снизу вверх: до какой высоты, цвета граней (случайно из списка), декор
      zones: [
        { to: 3.2, cols: [0xe39a2e, 0xd4831f, 0xf0ad3c, 0xc9761c], decor: 'acacia' },
        { to: 6.4, cols: [0x15a34a, 0x0e8c3c, 0x22b85a, 0x0b7a35], decor: 'forest' },
        { to: 9.2, cols: [0x6a1fd0, 0x7a2ae0, 0x5a14c0, 0x8c3ae8], decor: 'heather' },
        { to: 11.8, cols: [0x2a9a86, 0x23856f, 0x37ad94, 0x1d7563], decor: 'senecio' },
        { to: 14.4, cols: [0xc8552a, 0xb4471f, 0xd9673a, 0xa33d1a], decor: 'rocks' },
        { to: 99, cols: [0xeef6ff, 0xdcecff, 0xc9e0ff, 0xf6fbff], decor: 'ice' },
      ],
      camps: {
        practice: [-0.3, 0, 4.2],
        t1: [0.2, 1.7, 0.2], t2: [-0.28, 4.6, 0.2], t3: [0.4, 7.6, 0.2],
        t4: [-0.44, 10.4, 0.2], t5: [0.42, 13.0, 0.2], t6: [-0.36, 15.6, 0.2],
        summit: [0, 18, 0],
      },
      order: ['practice', 't1', 't2', 't3', 't4', 't5', 't6', 'summit'],
      tents: [0xf1d627, 0xff6a2a, 0x5c05e5, 0x2fdc09, 0xff3d7f, 0x1ec8ff, 0xffb000],
      // камера общего плана: широкий блок (aspect ≥ 1.9) и узкий (≤ 0.6), между ними плавно
      cam: { wide: { pos: [0, 11, 100], look: [0, 9.2, 0], fov: 22 }, tall: { pos: [0, 44, 140], look: [0, 8, 0], fov: 32 } }, // узкий: сверху-спереди, лагеря расходятся по вертикали
    },
  };

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function css() {
    if (document.getElementById('k3d-css')) return;
    var s = document.createElement('style'); s.id = 'k3d-css';
    s.textContent =
      '.k3d{height:clamp(520px,86vh,980px);border-radius:16px;background:#100128;box-shadow:0 0 0 1px rgba(241,214,39,.25)}' +
      '.k3d .ny3d-label{font:800 16px/1 "Smooch Sans",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.02em;color:#fff;' +
      'background:rgba(16,1,40,.82);border:2px solid #F1D627;border-radius:9px;padding:5px 9px 5px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 4px 12px rgba(0,0,0,.4)}' +
      '.k3d .ny3d-label small{font:500 10px/1.15 "Work Sans",system-ui,sans-serif;text-transform:none;letter-spacing:0;color:rgba(255,255,255,.78)}' +
      '.k3d .ny3d-label.clear{background:#49F623;border-color:#fff;color:#100128} .k3d .ny3d-label.clear small{color:#100128}' +
      '.k3d .ny3d-label.active{background:#F1D627;color:#100128} .k3d .ny3d-label.active small{color:#100128}' +
      '.k3d .ny3d-label.locked{background:rgba(42,26,70,.85);border-color:rgba(255,255,255,.4);opacity:.85}' +
      '.k3d .ny3d-label.summit{font-size:19px;background:#5C05E5;border-color:#F1D627} .k3d .ny3d-label.summit.clear{background:#49F623}' +
      '.k3d .ny3d-label.cur{outline:3px solid #49F623;outline-offset:3px}' +
      '.k3d .ny3d-label.cheer{animation:k3dCheer 1.5s ease}' +
      '@keyframes k3dCheer{30%{box-shadow:0 0 34px 12px rgba(73,246,35,.9);filter:brightness(1.3)}}' + // transform занят позиционированием подписи

      '.k3d .ny3d-label:focus-visible{outline:3px solid #F1D627;outline-offset:2px}' +
      '.k3d-count{position:absolute;right:12px;top:10px;z-index:2;font:800 18px/1 "Smooch Sans",sans-serif;text-transform:uppercase;background:#F1D627;color:#100128;padding:6px 10px;border-radius:8px;pointer-events:none}' +
      '.k3d-z{font-style:normal}' +
      '@media (max-width:640px){.k3d-z{display:none}.k3d .ny3d-label{font-size:13px;padding:3px 6px;border-width:1.5px}.k3d .ny3d-label small{font-size:9px}.k3d .ny3d-label.summit{font-size:15px}.k3d-count{font-size:14px;padding:4px 7px;right:8px;top:6px}}';
    document.head.appendChild(s);
  }

  function dateEt(ms) { try { return new Date(ms).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }); } catch (e) { return ''; } }
  function isLocked(L) { return L.status === 'new' && L.can && !L.can.ok; }
  function status(L) {
    if (L.status === 'clear') return L.summit ? 'gifts delivered' : 'cleared';
    if (L.status === 'expired') return 'closed';
    var c = L.can || { ok: true };
    if (c.ok) return L.status === 'active' ? 'in progress' : 'open';
    if (c.error === 'need_trails') return c.need + ' more ' + (c.need === 1 ? 'trail' : 'trails');
    if (c.error === 'not_open') return c.opensAt ? 'opens ' + dateEt(c.opensAt) : 'soon';
    if (c.error === 'closed') return 'closed';
    return '';
  }

  // ====================================================================================================
  function build(box, R) {
    var k = NY3D.create(box, {
      bg: BRAND.bg, fog: [0xff9a5a, 170, 370], exposure: 1.15, // туман в цвет закатного горизонта — край земли растворяется
      env: [0x3a1a7a, 0xffb36b, 0x6a3ad0, 0x100128], cam: { pos: R.cam.wide.pos, look: R.cam.wide.look, fov: R.cam.wide.fov },
      fixedZoom: true, parallax: 1.2,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, S = { k: k, R: R, camps: {}, t: 0, cleared: 0 };
    var rnd = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(7);

    // ---------- форма горы: радиус склона на высоте y под углом a (одна функция для склона, тропы и лагерей) ----------
    function prof(y) { var u = Math.min(1, Math.max(0, y / R.peak)); return R.top + (R.base - R.top) * Math.pow(1 - u, R.power); }
    function bump(a, y) {
      var amp = 0.075 * (1 - Math.min(1, y / R.peak) * 0.55);
      return amp * (0.6 * Math.sin(5 * a + 0.3 * y) + 0.3 * Math.sin(11 * a - 0.7 * y + 1) + 0.25 * Math.sin(19 * a + 2.1 + 0.2 * y));
    }
    function rad(a, y) { return prof(y) * (1 + bump(a, y)); }
    function onSlope(a, y, out) { var r = rad(a, y) + (out || 0); return new T.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); }
    function zoneAt(y) { for (var i = 0; i < R.zones.length; i++) if (y < R.zones[i].to) return i; return R.zones.length - 1; }
    S.onSlope = onSlope;

    // ---------- небо: сумерки как на арте (фиолетовый → маджента → оранжевый горизонт), звёзды ----------
    // купол неба: градиент по высоте над горизонтом (не по экрану — иначе оранжевый горизонт прячется за землёй)
    var skyTex = k.tex(4, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0b0228'); gr.addColorStop(0.3, '#1e0870'); gr.addColorStop(0.52, '#4a17b0');
      gr.addColorStop(0.66, '#9a32b0'); gr.addColorStop(0.76, '#ff5f5a'); gr.addColorStop(0.84, '#ff9a48'); gr.addColorStop(0.9, '#ffc870'); gr.addColorStop(1, '#ffc870');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // купол едет вместе с камерой (радиус меньше дальней плоскости камеры 400), рисуется первым и ничего не перекрывает
    var DOME = 300;
    var dome = new T.Mesh(new T.SphereGeometry(DOME, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false, depthWrite: false, depthTest: false, toneMapped: false }));
    // v: 1 у зенита → горизонт (высота 0) попадает в оранжевую часть градиента
    (function () { var uv = dome.geometry.attributes.uv, ps = dome.geometry.attributes.position; for (var i = 0; i < uv.count; i++) { var e = Math.max(0, ps.getY(i) / DOME); uv.setY(i, 1 - Math.pow(1 - e, 1.6) * 0.86); } uv.needsUpdate = true; })();
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    k.onFrame(function () { dome.position.set(k.camera.position.x, -8, k.camera.position.z); }); // горизонт неба = горизонт мира
    var starN = 700, sp = new Float32Array(starN * 3);
    for (var i = 0; i < starN; i++) {
      var a0 = (rnd() - 0.5) * Math.PI * 1.3, el = 0.22 + rnd() * 0.75, Rs = 150;
      sp[i * 3] = Math.sin(a0) * Math.cos(el) * Rs; sp[i * 3 + 1] = Math.sin(el) * Rs * 0.7 + 10; sp[i * 3 + 2] = -Math.cos(a0) * Math.cos(el) * Rs;
    }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    var stars = new T.Points(sg, new T.PointsMaterial({ color: 0xfff6d0, size: 0.7, transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
    scene.add(stars);
    // луна в верхнем углу — заполняет пустое небо
    var moonDisc = new T.Mesh(new T.CircleGeometry(4.2, 40), new T.MeshBasicMaterial({ color: 0xfff1c4, fog: false, toneMapped: false }));
    moonDisc.position.set(-50, 36, -120); moonDisc.lookAt(0, 10, 100); scene.add(moonDisc);
    var moonHalo = k.glow(0xffe6a8, 26); moonHalo.material.opacity = 0.5; moonHalo.material.fog = false; moonHalo.position.copy(moonDisc.position); scene.add(moonHalo);

    // ---------- свет: тёплый закат слева, холодная луна справа, фиолетовое небо ----------
    scene.add(new T.HemisphereLight(0xa88cff, 0x4a2410, 0.95));
    var sun = new T.DirectionalLight(0xffa060, 1.15); sun.position.set(-40, 18, 30); scene.add(sun);
    var moon = new T.DirectionalLight(0x7fa8ff, 0.45); moon.position.set(35, 30, 10); scene.add(moon);

    // ---------- земля саванны ----------
    var grassTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#c98a2c'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) {
        var v = rnd(); g.fillStyle = v < 0.4 ? 'rgba(240,180,70,.5)' : v < 0.75 ? 'rgba(150,90,20,.35)' : 'rgba(255,214,120,.35)';
        g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 6 + rnd() * 8);
      }
    });
    grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(24, 24);
    var ground = new T.Mesh(new T.CircleGeometry(420, 64), new T.MeshStandardMaterial({ color: 0xffffff, map: grassTex, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);

    // ---------- гора: низкополигональная, грани окрашены поясами ----------
    function mountainMesh() {
      var rows = 44, cols = 84, pos = [], col = [], c = new T.Color();
      function V(ia, iy) {
        var a = (ia / cols) * Math.PI * 2 - Math.PI, y = (iy / rows) * R.peak;
        if (iy === rows + 1) return [0, R.peak + 0.12, 0, a, R.peak];
        var p = onSlope(a, y, 0); return [p.x, p.y, p.z, a, y];
      }
      function face(A, B, C) {
        pos.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
        var y = (A[4] + B[4] + C[4]) / 3, a = (A[3] + B[3] + C[3]) / 3;
        // рваные границы поясов + языки снега по гребням
        var yy = y + (rnd() - 0.5) * 0.9 + 1.4 * Math.max(0, Math.sin(a * 9 + 0.5)) * (y > R.zones[3].to ? 1 : 0);
        var z = R.zones[zoneAt(yy)];
        c.setHex(z.cols[(rnd() * z.cols.length) | 0]); // hex = sRGB, перевод в линейный делает ядро (ColorManagement)
        var sh = 0.9 + rnd() * 0.2; c.multiplyScalar(sh);
        for (var q = 0; q < 3; q++) col.push(c.r, c.g, c.b);
      }
      for (var iy = 0; iy <= rows; iy++) for (var ia = 0; ia < cols; ia++) {
        var a = V(ia, iy), b = V(ia + 1, iy), up = iy === rows ? V(ia, rows + 1) : null;
        if (up) { face(a, b, up); continue; }
        var c2 = V(ia, iy + 1), d = V(ia + 1, iy + 1);
        face(a, b, d); face(a, d, c2);
      }
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      return new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true }));
    }
    scene.add(mountainMesh());
    // снежная шапка на плато
    var snowMat = new T.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.85, flatShading: true });
    var cap = new T.Mesh(new T.CylinderGeometry(R.top * 1.08, R.top * 1.12, 0.3, 18), snowMat); cap.position.y = R.peak; scene.add(cap);

    // соседний пик (Мавензи) и дальние хребты — заполняют пустые края кадра
    function cone(r, h, colHex, x, z, seg) {
      var m = new T.Mesh(new T.ConeGeometry(r, h, seg || 9, 3), new T.MeshStandardMaterial({ color: colHex, roughness: 1, flatShading: true }));
      m.position.set(x, h / 2 - 0.05, z); scene.add(m); return m;
    }
    cone(17, 12, 0x3a2470, 38, -34, 8); var mcap = cone(4.2, 3.2, 0xd8e2ff, 38, -34, 8); mcap.position.y = 12 - 1.55;
    cone(22, 11, 0x2a1858, -48, -52, 7); cone(26, 13, 0x24144e, 64, -76, 7); cone(30, 10, 0x2e1a62, -14, -100, 7); cone(26, 9, 0x26165a, -80, -30, 7);

    // ---------- тропа серпантином: те же (угол, высота, вынос), что у лагерей ----------
    var order = R.order, P2 = order.map(function (id) { var c = R.camps[id]; return new T.Vector3(c[0], c[1], c[2]); });
    var curve2 = new T.CatmullRomCurve3(P2, false, 'catmullrom', 0.3);
    function trailPoint(t) { var q = curve2.getPoint(t); return onSlope(q.x, Math.min(R.peak, q.y), q.z + 0.18); }
    var segs = [], trailPts = [], trailCol = new T.Color(0xffe9b8), trailLit = new T.Color(BRAND.y);
    for (var s = 0; s < order.length - 1; s++) {
      var pts = [];
      for (var j = 0; j <= 24; j++) { var p = trailPoint((s + j / 24) / (order.length - 1)); pts.push(p); trailPts.push(p); }
      var mat = new T.MeshStandardMaterial({ color: 0xffe9b8, emissive: BRAND.y, emissiveIntensity: 0, roughness: 0.7 });
      var tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 0.2, 6, false), mat);
      scene.add(tube);
      // огоньки вдоль пройденного участка
      var dots = [];
      for (var d = 2; d < 24; d += 3) { var gl = k.glow(BRAND.y, 1.5); gl.position.copy(pts[d]).y += 0.25; gl.material.opacity = 0; scene.add(gl); dots.push(gl); }
      segs.push({ to: order[s + 1], mat: mat, dots: dots, lit: 0 });
    }

    // ---------- декор поясов (InstancedMesh: один вызов отрисовки на тип) ----------
    var campPts = order.map(function (id) { var c = R.camps[id]; return onSlope(c[0], c[1], c[2]); });
    function clearSpot(p, r) {
      for (var i = 0; i < campPts.length; i++) if (campPts[i].distanceTo(p) < r + 1.4) return false;
      for (var j = 0; j < trailPts.length; j += 2) if (trailPts[j].distanceTo(p) < r + 0.35) return false;
      return true;
    }
    function scatter(n, y0, y1, aRange, place) {
      var out = [], tries = 0;
      while (out.length < n && tries++ < n * 30) {
        var a = (rnd() - 0.5) * 2 * aRange, y = y0 + rnd() * (y1 - y0), p = onSlope(a, y, -0.1);
        if (!clearSpot(p, 0.6)) continue;
        out.push({ a: a, y: y, p: p }); if (place) place(out[out.length - 1]);
      }
      return out;
    }
    var M4 = new T.Matrix4(), Q = new T.Quaternion(), V3 = new T.Vector3(), E = new T.Euler(), C = new T.Color();
    function instanced(geo, mat, items, fn) {
      var m = new T.InstancedMesh(geo, mat, items.length);
      items.forEach(function (it, i) { var o = fn(it, i); E.set(o.rx || 0, o.ry || 0, o.rz || 0); Q.setFromEuler(E); M4.compose(o.p, Q, V3.set(o.s[0], o.s[1], o.s[2])); m.setMatrixAt(i, M4); if (o.c != null) m.setColorAt(i, C.setHex(o.c)); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      scene.add(m); return m;
    }
    var Z = R.zones;
    // саванна: акации на равнине и нижнем склоне
    var acaciaPts = [];
    for (var q = 0; q < 46; q++) { var aa = (rnd() - 0.5) * 2.6, rr = R.base * (0.9 + rnd() * 1.4), p0 = new T.Vector3(Math.sin(aa) * rr, 0, Math.cos(aa) * rr); if (clearSpot(p0, 1.5) && Math.abs(p0.x) > 3.5) acaciaPts.push({ p: p0, s: 0.8 + rnd() * 0.7 }); }
    scatter(10, 0.4, Z[0].to - 0.4, 1.0).forEach(function (it) { acaciaPts.push({ p: it.p, s: 0.55 + rnd() * 0.3 }); });
    instanced(new T.CylinderGeometry(0.09, 0.14, 1.3, 5), new T.MeshStandardMaterial({ color: 0x2a160a, roughness: 1 }), acaciaPts, function (it) { return { p: V3.clone().copy(it.p).setY(it.p.y + 0.65 * it.s), s: [it.s, it.s, it.s] }; });
    instanced(new T.SphereGeometry(1, 9, 5), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), acaciaPts, function (it, i) {
      return { p: new T.Vector3(it.p.x, it.p.y + 1.35 * it.s, it.p.z), s: [1.45 * it.s, 0.34 * it.s, 1.25 * it.s], ry: i, c: [0x2f7a1e, 0x3d8f22, 0x4f9a1a][i % 3] };
    });
    // дождевой лес: густые кроны
    var forest = scatter(140, Z[0].to + 0.1, Z[1].to - 0.1, 1.15);
    instanced(new T.IcosahedronGeometry(0.62, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }), forest, function (it, i) {
      var s = 0.8 + rnd() * 0.7; return { p: it.p.clone().setY(it.p.y + 0.35), s: [s, s * 1.1, s], ry: i, c: [0x0c8a3a, 0x16b04c, 0x2fdc09, 0x0a6e30][i % 4] };
    });
    // вереск: розово-фиолетовые кусты
    var heather = scatter(120, Z[1].to + 0.1, Z[2].to - 0.1, 1.2);
    instanced(new T.IcosahedronGeometry(0.34, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), heather, function (it, i) {
      var s = 0.8 + rnd() * 0.8; return { p: it.p.clone().setY(it.p.y + 0.15), s: [s, s * 0.8, s], ry: i, c: [0xe05ad8, 0xb03ae0, 0xff7ad0, 0x8a2ad0][i % 4] };
    });
    // пустошь: «сенецио» — ствол и розетка
    var sen = scatter(34, Z[2].to + 0.2, Z[3].to - 0.2, 1.1);
    instanced(new T.CylinderGeometry(0.08, 0.11, 1.2, 5), new T.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 1 }), sen, function (it) { return { p: it.p.clone().setY(it.p.y + 0.55), s: [1, 1, 1] }; });
    instanced(new T.IcosahedronGeometry(0.34, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), sen, function (it, i) { return { p: it.p.clone().setY(it.p.y + 1.22), s: [1.2, 0.7, 1.2], c: [0x6ad84a, 0x3ac07a][i % 2] }; });
    // альпийская пустыня: камни
    var rocks = scatter(46, Z[3].to + 0.1, Z[4].to - 0.1, 1.1);
    instanced(new T.DodecahedronGeometry(0.32, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), rocks, function (it, i) { var s = 0.7 + rnd(); return { p: it.p.clone(), s: [s, s * 0.7, s], rx: i, ry: i * 2, c: [0x7a3a2a, 0x9a4a2e, 0x5a2c22][i % 3] }; });
    // ледник: льдины
    var ice = scatter(30, Z[4].to + 0.1, R.peak - 0.6, 1.0);
    instanced(new T.OctahedronGeometry(0.3, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1, flatShading: true }), ice, function (it, i) { var s = 0.8 + rnd() * 0.8; return { p: it.p.clone().setY(it.p.y + 0.12), s: [s, s * 1.5, s], ry: i, c: [0xbfe8ff, 0x8fd4ff, 0xe8f6ff][i % 3] }; });

    // облака по бокам горы, тёплые от заката
    var cloudTex = k.tex(256, 128, function (g, w, h) {
      for (var i = 0; i < 26; i++) { // пятна целиком внутри холста — иначе у спрайта видны прямые края
        var r = 14 + rnd() * 22, x = r + 4 + rnd() * (w - 2 * r - 8), y = h / 2 + (rnd() - 0.5) * (h - 2 * r - 8);
        var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    });
    var clouds = [];
    // [x, y, z, ширина, цвет, сплющенность] — шапка-линза за вершиной как на арте + полосы у подножия
    [[0, 22.5, -14, 38, 0xffd0e0, 0.16], [-34, 6.5, -20, 34, 0xffb08a, 0.22], [36, 8, -26, 36, 0xff9ac0, 0.2], [-60, 14, -70, 50, 0xb07aff, 0.18], [64, 17, -80, 54, 0xa070ff, 0.18]].forEach(function (c, i) {
      var m = new T.SpriteMaterial({ map: cloudTex, color: c[4], transparent: true, opacity: 0.7, depthWrite: false, fog: false });
      var spr = new T.Sprite(m); spr.scale.set(c[3], c[3] * c[5], 1); spr.position.set(c[0], c[1], c[2]); scene.add(spr);
      clouds.push({ s: spr, x0: c[0], ph: i });
    });

    k.snow({ n: 700, area: [44, 16, 34], center: [0, 9, 4], speed: 0.8, size: 0.2, opacity: 0.8 });

    // ---------- лагерь ----------
    var stoneMat = new T.MeshStandardMaterial({ color: 0x7a4e2a, roughness: 1, flatShading: true });
    var poleMat = new T.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.8 });
    var logMat = new T.MeshStandardMaterial({ color: 0x4a2a14, roughness: 1 });
    function camp(i, isPractice) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var plat = new T.Mesh(new T.CylinderGeometry(1.3, 1.4, 0.5, 12), stoneMat); plat.position.y = -0.2; inner.add(plat); // вытоптанная площадка, почти вся в склоне
      var tentCol = R.tents[i % R.tents.length];
      var tentMat = new T.MeshStandardMaterial({ color: tentCol, roughness: 0.75, flatShading: true, emissive: BRAND.warm, emissiveIntensity: 0 });
      var tent = new T.Mesh(new T.ConeGeometry(0.95, 1.35, 4), tentMat); tent.rotation.y = Math.PI / 4; tent.position.set(-0.35, 0.7, -0.2); inner.add(tent);
      var doorMat = new T.MeshStandardMaterial({ color: 0x2a1408, emissive: BRAND.warm, emissiveIntensity: 0 });
      var door = new T.Mesh(new T.CircleGeometry(0.34, 3), doorMat); door.rotation.z = Math.PI / 2; door.position.set(-0.35, 0.33, 0.47); door.scale.set(1, 0.8, 1); inner.add(door);
      var doorGlow = k.glow(BRAND.warm, 1.4); doorGlow.position.set(-0.35, 0.45, 0.7); doorGlow.material.opacity = 0; inner.add(doorGlow);
      // флаг
      var pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 2.1, 6), poleMat); pole.position.set(0.85, 1.05, -0.35); inner.add(pole);
      var flagMat = new T.MeshStandardMaterial({ color: 0x8a7aa8, roughness: 0.7, side: T.DoubleSide, emissive: BRAND.g, emissiveIntensity: 0 });
      var flag = new T.Mesh(new T.PlaneGeometry(0.62, 0.4, 4, 1), flagMat); flag.position.set(1.17, 1.85, -0.35); inner.add(flag);
      // костёр
      var fire = new T.Group(); fire.position.set(0.5, 0.06, 0.75); inner.add(fire);
      for (var l = 0; l < 3; l++) { var log = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.5, 5), logMat); log.rotation.order = 'YXZ'; log.rotation.set(Math.PI / 2, l * 1.05, 0); fire.add(log); }
      var flameMat = new T.MeshStandardMaterial({ color: 0x401000, emissive: BRAND.fire, emissiveIntensity: 0, transparent: true, opacity: 0.95 });
      var flame = new T.Mesh(new T.ConeGeometry(0.16, 0.45, 6), flameMat); flame.position.y = 0.24; flame.visible = false; fire.add(flame);
      var fireGlow = k.glow(BRAND.fire, 4.2); fireGlow.position.y = 0.35; fireGlow.material.opacity = 0; fire.add(fireGlow);
      // гирлянда-фонарики от палатки к флагштоку
      var bulbs = [], cols = [BRAND.y, BRAND.g, 0xff3d7f, 0x1ec8ff];
      for (var b = 0; b < 6; b++) {
        var t = b / 5, x = -0.35 + (0.85 + 0.35) * t, y = 1.35 + (1.9 - 1.35) * t - Math.sin(t * Math.PI) * 0.3;
        var bm = k.glow(cols[b % 4], 0.9); bm.position.set(x, y, -0.28); bm.material.opacity = 0; inner.add(bm); bulbs.push(bm);
      }
      // кольцо «текущий лагерь»
      var ring = new T.Mesh(new T.RingGeometry(1.85, 2.1, 40), new T.MeshBasicMaterial({ color: BRAND.g, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
      var burst = k.glow(BRAND.g, 6); burst.position.y = 1.2; burst.material.opacity = 0; g.add(burst);
      if (isPractice) inner.scale.setScalar(1.15);
      return { s0: isPractice ? 1.15 : 1, g: g, inner: inner, tent: tentMat, door: doorMat, doorGlow: doorGlow, flag: flag, flagMat: flagMat, flame: flame, flameMat: flameMat, fireGlow: fireGlow, bulbs: bulbs, ring: ring, burst: burst, lit: 0, target: 0, hover: 0, cheer: 0, h: 2.3 };
    }

    // ---------- вершина: ёлка, подарки, звери ----------
    function summitObj() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var needle = new T.MeshStandardMaterial({ color: 0x14904a, roughness: 0.85, flatShading: true });
      [[1.7, 1.9, 1.0], [1.35, 1.7, 2.1], [1.0, 1.5, 3.1], [0.62, 1.2, 4.0]].forEach(function (t) {
        var c = new T.Mesh(new T.ConeGeometry(t[0], t[1], 9), needle); c.position.y = t[2]; inner.add(c);
        var sc = new T.Mesh(new T.ConeGeometry(t[0] * 0.42, t[1] * 0.35, 9), snowMat); sc.position.y = t[2] + t[1] * 0.34; inner.add(sc);
      });
      var trunk = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, 0.6, 8), logMat); trunk.position.y = 0.2; inner.add(trunk);
      var shape = new T.Shape();
      for (var s = 0; s < 10; s++) { var ang = Math.PI / 2 + s * Math.PI / 5, rr = s % 2 ? 0.2 : 0.48, x = Math.cos(ang) * rr, y = Math.sin(ang) * rr; if (s) shape.lineTo(x, y); else shape.moveTo(x, y); }
      var starMat = new T.MeshStandardMaterial({ color: 0x6a5a10, emissive: BRAND.y, emissiveIntensity: 0.15, metalness: 0.5, roughness: 0.3 });
      var star = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }), starMat);
      star.position.set(0, 4.95, -0.06); inner.add(star);
      var starGlow = k.glow(BRAND.y, 4.2); starGlow.position.set(0, 5.0, 0.15); starGlow.material.opacity = 0; inner.add(starGlow);
      var bulbs = [], cols = [BRAND.y, 0xff3d7f, BRAND.g, 0x1ec8ff, 0xff8a2a];
      for (var i = 0; i < 40; i++) {
        var tt = i / 40, y = 0.5 + tt * 4.0, r = 1.75 * (1 - tt) + 0.2, a = tt * Math.PI * 8;
        var bm = k.glow(cols[i % 5], 1.0); bm.position.set(Math.cos(a) * r, y, Math.sin(a) * r); bm.material.opacity = 0; inner.add(bm); bulbs.push(bm);
      }
      [[1.1, 0.8, 0xff3d7f], [-1.2, 0.6, 0x5c05e5], [0.3, 1.5, 0xf1d627], [-0.6, 1.4, 0x2fdc09], [1.5, -0.2, 0x1ec8ff]].forEach(function (p, i) {
        var s2 = 0.42 + (i % 2) * 0.18, box2 = new T.Mesh(new T.BoxGeometry(s2, s2, s2), new T.MeshStandardMaterial({ color: p[2], roughness: 0.5 }));
        box2.position.set(p[0], s2 / 2 + 0.1, p[1]); box2.rotation.y = i; inner.add(box2);
        var rib = new T.Mesh(new T.BoxGeometry(s2 + 0.02, s2 + 0.02, 0.08), new T.MeshStandardMaterial({ color: 0xfff4d0, roughness: 0.5 })); rib.position.copy(box2.position); rib.rotation.y = i; inner.add(rib);
      });
      var treeLight = new T.PointLight(0xffd27a, 0, 14, 2); treeLight.position.y = 3; inner.add(treeLight);
      var halo = k.glow(BRAND.warm, 9); halo.position.y = 2.6; halo.material.opacity = 0; inner.add(halo);
      var ring = new T.Mesh(new T.RingGeometry(2.4, 2.7, 48), new T.MeshBasicMaterial({ color: BRAND.g, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; g.add(ring);
      var burst = k.glow(BRAND.y, 10); burst.position.y = 3; burst.material.opacity = 0; g.add(burst);
      // звери выходят к ёлке, когда подарки доставлены
      var crew = [['sprites/giraffe.webp', 2.6, 1.9, -0.6], ['sprites/elephant.webp', 1.7, -2.3, -0.2], ['sprites/zebra.webp', 1.2, 2.2, 1.1], ['sprites/lion.webp', 1.15, -1.6, 1.4]].map(function (c) {
        var b = k.billboard(S.base + c[0], c[1]); b.position.set(c[2], 0.1, c[3]); b.visible = false; inner.add(b); return b;
      });
      return { g: g, inner: inner, star: starMat, starGlow: starGlow, bulbs: bulbs, light: treeLight, halo: halo, ring: ring, burst: burst, crew: crew, lit: 0, target: 0, hover: 0, cheer: 0, h: 5.6, summit: true };
    }

    // ---------- персонажи: настоящие PNG бренда ----------
    S.base = '../../jumanza/assets/';
    var jeep = k.billboard(S.base + 'safari-4x4.png', 1.35); scene.add(jeep);
    var jeepTo = new T.Vector3(); S.jeepTo = jeepTo;
    var bc = R.camps[R.order[0]], baseP = onSlope(bc[0], bc[1], bc[2]);
    jeep.position.copy(baseP).add(new T.Vector3(2.2, 0, 1.2)); jeepTo.copy(jeep.position);
    var lion = k.billboard(S.base + 'sprites/lion.webp', 1.7); lion.position.copy(baseP).add(new T.Vector3(-2.3, 0, 0.9)); scene.add(lion);
    // звери на равнине — заполняют передний план по краям
    [['sprites/giraffe.webp', 4.2, -17, 22], ['sprites/elephant.webp', 3.0, 15.5, 25], ['sprites/zebra.webp', 1.9, 11, 30.5], ['sprites/zebra.webp', 1.7, -12.5, 31]].forEach(function (a) {
      var b = k.billboard(S.base + a[0], a[1]); b.position.set(a[2], 0, a[3]); scene.add(b);
    });

    S.place = function (L, i) {
      var o = S.camps[L.id];
      if (o) return o;
      var c = R.camps[L.id]; if (!c) return null;
      if (L.summit) { o = summitObj(); o.g.position.set(0, R.peak + 0.15, 0); o.s0 = 1.35; o.inner.scale.setScalar(o.s0); o.h *= o.s0; }
      else {
        o = camp(i, L.training);
        o.g.position.copy(onSlope(c[0], c[1], c[2])); o.g.rotation.y = c[0];
      }
      scene.add(o.g);
      var openIt = function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); };
      o.lab = k.label(o.g, [0, o.h + 0.6, 0], '', openIt);
      k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
      o.id = L.id; S.camps[L.id] = o;
      return o;
    };

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      S.t = t;
      clouds.forEach(function (c) { c.s.position.x = c.x0 + Math.sin(t * 0.04 + c.ph) * 2.5; });
      stars.material.opacity = 0.6 + 0.25 * Math.sin(t * 0.7);
      segs.forEach(function (sg) {
        var on = S.camps[sg.to] && S.camps[sg.to].target ? 1 : 0;
        sg.lit += (on - sg.lit) * Math.min(1, dt * 2);
        sg.mat.emissiveIntensity = sg.lit * 1.6;
        sg.mat.color.copy(trailCol).lerp(trailLit, sg.lit);
        sg.dots.forEach(function (d, i) { d.material.opacity = sg.lit * (0.55 + 0.35 * Math.sin(t * 3 + i)); });
      });
      Object.keys(S.camps).forEach(function (id) {
        var o = S.camps[id], cur = S.current === id;
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        o.cheer = Math.max(0, o.cheer - dt * 0.7);
        o.ring.material.opacity += ((cur ? 0.9 : o.hover ? 0.45 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
        o.burst.material.opacity = Math.sin(o.cheer * Math.PI) * 0.9; o.burst.scale.setScalar((o.summit ? 10 : 6) * (1 + (1 - o.cheer) * 0.8));
        var sc = (o.s0 || 1) * (1 + o.hover * 0.06); o.inner.scale.setScalar(o.inner.scale.x + (sc - o.inner.scale.x) * 0.2);
        if (o.summit) {
          var open = o.open ? 0.35 + 0.25 * Math.sin(t * 2.4) : 0.12;
          o.star.emissiveIntensity = o.lit * 2.6 + (1 - o.lit) * open;
          o.starGlow.material.opacity = Math.min(1, o.lit * 0.95 + (1 - o.lit) * open * 0.6);
          o.starGlow.scale.setScalar(4.2 + Math.sin(t * 2) * 0.3);
          o.light.intensity = o.lit * 2.2;
          o.halo.material.opacity = o.lit * (0.45 + 0.1 * Math.sin(t * 1.7));
          o.bulbs.forEach(function (b, i) { b.material.opacity = o.lit * (0.55 + 0.45 * Math.sin(t * 4 + i * 1.7)); });
          o.crew.forEach(function (b) { b.visible = o.lit > 0.5; });
          return;
        }
        var act = o.state === 'active' ? 0.5 + 0.3 * Math.sin(t * 9 + o.g.position.y) : 0;
        var f = Math.max(o.lit, act);
        o.flame.visible = f > 0.05;
        o.flame.scale.set(1, 0.8 + 0.3 * Math.sin(t * 13 + o.g.position.x) + 0.15 * Math.sin(t * 23), 1);
        o.flameMat.emissiveIntensity = f * 3;
        o.fireGlow.material.opacity = f * (0.75 + 0.15 * Math.sin(t * 11));
        o.door.emissiveIntensity = o.lit * 1.4; o.doorGlow.material.opacity = o.lit * 0.6;
        o.tent.emissiveIntensity = o.lit * 0.12;
        o.flagMat.emissiveIntensity = o.lit * 0.7;
        o.flag.position.y = 1.85 - 0.0 + Math.sin(t * 2 + o.g.position.x) * 0.02;
        o.flag.rotation.y = Math.sin(t * 2.4 + o.g.position.y) * 0.25;
        o.bulbs.forEach(function (b, i) { b.material.opacity = o.lit * (0.6 + 0.4 * Math.sin(t * 3.5 + i * 1.3)); });
      });
      jeep.position.lerp(jeepTo, Math.min(1, dt * 1.4));
    });

    S.k = k;
    // общий план под пропорции блока: широкий ↔ узкий плавно, на телефоне видна вся гора
    function frame(a) {
      var t = Math.max(0, Math.min(1, (1.9 - a) / 1.3)), W = R.cam.wide, Tl = R.cam.tall;
      function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
      return { t: t, pos: mix(W.pos, Tl.pos), look: mix(W.look, Tl.look), fov: W.fov + (Tl.fov - W.fov) * t };
    }
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F; k.camera.fov = F.fov; k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') k.look(F.pos, F.look, 0.4);
    });
    // счётчик троп в углу
    S.count = document.createElement('div'); S.count.className = 'k3d-count'; box.appendChild(S.count);
    return S;
  }

  // ======================================================================================================
  function render(el, levels, opts) {
    opts = opts || {};
    var S = el._k3d;
    if (!S) {
      if (!supported()) return window.Mountain ? Mountain.render(el, levels, opts) : null;
      css();
      var R = ROUTES[opts.route || 'kili'] || ROUTES.kili;
      el.innerHTML = ''; el.classList.add('k3d');
      S = build(el, R);
      if (!S) { el.classList.remove('k3d'); return window.Mountain ? Mountain.render(el, levels, opts) : null; }
      el._k3d = S;
    }
    if (S.k.debug('lit')) levels = levels.map(function (L) { return Object.assign({}, L, { status: 'clear' }); });
    S.levels = levels; S.onOpen = opts.onOpen; S.current = opts.current || null;
    var trails = 0, ti = 0;
    S.R.order.forEach(function (id) {
      var L = levels.find(function (x) { return x.id === id; }); if (!L) return;
      var o = S.place(L, ti++); if (!o) return;
      o.state = L.status; o.target = L.status === 'clear' ? 1 : 0; o.open = !!(L.can && L.can.ok);
      if (L.status === 'clear' && /^t\d$/.test(L.id)) trails++;
      var name = L.summit ? 'Summit' : L.training ? 'Practice' : L.title;
      var zone = L.summit ? 'Christmas tree' : L.zone;
      o.lab.set(esc(name) + '<small><i class="k3d-z">' + esc(zone) + ' · </i>' + esc(status(L)) + '</small>');
      o.lab.el.setAttribute('aria-label', (L.title || name) + ': ' + status(L));
      var locked = isLocked(L);
      o.lab.cls('clear', L.status === 'clear'); o.lab.cls('active', L.status === 'active'); o.lab.cls('locked', locked);
      o.lab.cls('summit', !!L.summit); o.lab.cls('cur', S.current === L.id);
    });
    S.count.textContent = trails + ' / 6 trails';
    // камера и джип — к текущему лагерю, иначе общий план
    var cur = S.current && S.camps[S.current], T = S.k.T;
    if (cur) {
      var key = 'cur:' + S.current;
      var p = cur.g.position, out = new T.Vector3(Math.sin(cur.g.rotation.y), 0, Math.cos(cur.g.rotation.y));
      if (S.camKey !== key) {
        S.camKey = key;
        var far = (cur.summit ? 17 : 15) * (1 + S.frame.t * 0.9);
        S.k.look([p.x + out.x * far, p.y + (cur.summit ? 5 : 4.5), p.z + out.z * far], [p.x, p.y + (cur.summit ? 2.6 : 1.2), p.z], 1.6);
      }
      var side = new T.Vector3(out.z, 0, -out.x);
      S.jeepTo.copy(p).addScaledVector(out, 1.1).addScaledVector(side, cur.summit ? 2.6 : 1.9);
      S.jeepTo.y = p.y + (cur.summit ? 0.1 : 0.02);
    } else if (S.camKey !== 'all') {
      S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.6);
    }
    return S;
  }

  function cheer(el, id) {
    var S = el && el._k3d;
    if (!S) return window.Mountain ? Mountain.cheer(el, id) : null;
    var o = S.camps[id]; if (!o) return;
    o.cheer = 1; o.target = 1;
    o.lab.cls('cheer', true); setTimeout(function () { o.lab.cls('cheer', false); }, 1600);
  }

  window.Mountain3D = { render: render, cheer: cheer, supported: supported, ROUTES: ROUTES };
})();
