/**
 * 3D-гора Christmas on Kilimanjaro (Jumanza) на ядре _3d/ny3d.js, ПРЕМИУМ-режим (конвейер зала Witching Hours).
 * Тот же интерфейс, что у 2D mountain.js:
 *   Mountain3D.render(el, levels, { current, onOpen(id, level), route })  — первый вызов строит сцену, дальше только обновляет
 *   Mountain3D.cheer(el, id)                                               — вспышка на только что пройденной тропе
 *   Mountain3D.supported()                                                 — есть ли WebGL (иначе страница рисует 2D Mountain)
 * Сюжет (по арту bg-kilimanjaro.jpg / 02-summit-tree.jpg): закат над саванной, гора поясами (саванна → дождевой лес →
 * вереск → пустошь → альпийская пустыня → ледник), промоины со снегом, облако-шапка над вершиной, облака у подножия,
 * водопой отражает закат. Тропа серпантином, на ней лагеря-уровни. Пройденная тропа — костёр с искрами и светом,
 * гирлянда, флаг с лапой, участок тропы светится. Вершина: ёлка; открыта (4 тропы) — звезда мерцает, пройдена — ёлка
 * горит, звери собираются вокруг. Сафари-джип едет к текущему лагерю, лев ждёт в базовом лагере.
 *
 * Маршрут (форма горы, пояса, точки лагерей, камера) — данные в ROUTES, код сцены от них не зависит:
 * следующая карта = ещё один ключ в ROUTES и opts.route при вызове render.
 */
(function () {
  'use strict';
  var BRAND = { y: 0xf1d627, g: 0x49f623, p: 0x5c05e5, bg: 0x100128, fire: 0xff8a2a, warm: 0xffc46b };
  var FIRE = [[0.62, 0.14, 0.02], [1.0, 0.5, 0.1], [1.0, 0.92, 0.6]]; // пламя костров: от края к сердцевине

  // ====================================================================================================
  // МАРШРУТЫ. Лагерь: [угол вокруг горы (0 — к зрителю, + вправо), высота, вынос наружу от склона].
  var ROUTES = {
    kili: {
      peak: 18, base: 31, top: 5.6, power: 1.3,          // высота, радиус подножия, радиус плато, «вогнутость» склона
      // пояса снизу вверх: до какой высоты, два тона пояса (смешиваются шумом), декор
      zones: [
        { to: 3.2, cols: [0xb8742a, 0xd99a44], decor: 'acacia' },
        { to: 6.4, cols: [0x175c2e, 0x2a8a3e], decor: 'forest' },
        { to: 9.2, cols: [0x6e2490, 0xa244b0], decor: 'heather' },
        { to: 11.8, cols: [0x356e5a, 0x5a8e6a], decor: 'senecio' },
        { to: 14.4, cols: [0x7a3e2c, 0xa45a3c], decor: 'rocks' },
        { to: 99, cols: [0xf4f6ff, 0xcfdcff], decor: 'ice' },
      ],
      camps: {
        practice: [-0.3, 0, 4.2],
        t1: [0.2, 1.7, 0.2], t2: [-0.28, 4.6, 0.2], t3: [0.4, 7.6, 0.2],
        t4: [-0.44, 10.4, 0.2], t5: [0.42, 13.0, 0.2], t6: [-0.36, 15.6, 0.2],
        summit: [0, 18, 0],
      },
      order: ['practice', 't1', 't2', 't3', 't4', 't5', 't6', 'summit'],
      tents: [0xf1d627, 0xff6a2a, 0x7a2ae0, 0x2fbc29, 0xff3d7f, 0x1ec8ff, 0xffb000],
      pond: [-21, 37, 6, 2.4],                             // водопой: x, z, радиус по x, по z
      // камера общего плана: широкий блок (aspect ≥ 1.9) и узкий (≤ 0.6), между ними плавно; гора — герой кадра
      cam: { wide: { pos: [0, 6.5, 80], look: [0, 10, 0], fov: 26 }, tall: { pos: [0, 44, 142], look: [0, 8, 0], fov: 33 } },
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
      // виньетка поверх кадра — как в зале WH: края темнее, взгляд к горе
      '.k3d::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:inherit;background:radial-gradient(ellipse 75% 70% at 50% 45%,transparent 55%,rgba(10,0,30,.55) 100%)}' +
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

  // ---------- шум (детерминированный): рельеф, переходы поясов, мазки ----------
  function hash3(x, y, z) { var s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y, z) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
    function l(a, b, t) { return a + (b - a) * t; }
    return l(l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux), uy),
      l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux), uy), uz);
  }
  function fbm(x, y, z) { var v = 0, a = 0.5; for (var i = 0; i < 4; i++) { v += a * vnoise(x, y, z); x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; } return v / 0.9375; }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // ====================================================================================================
  function build(box, R) {
    var k = NY3D.create(box, {
      premium: true, bloom: [0.85, 0.5, 0.8],               // порог выше, чем в зале: свечение только у огней, не у закатного неба
      bg: BRAND.bg, fogExp: [0x7a3e66, 0.0052],             // закатная дымка: дальние хребты и край саванны тонут в мауве
      env: [0xff9a5a, 0x6a4ad0, 0xffd0a0, 0x3a1a6a, 0x3a2010], // слева закат, справа сумерки, сверху тёплый, сзади фиолет, пол
      cam: { pos: R.cam.wide.pos, look: R.cam.wide.look, fov: R.cam.wide.fov },
      fixedZoom: true, parallax: 1.2,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, S = { k: k, R: R, camps: {}, t: 0, cleared: 0 };
    var ASSETS = '../../jumanza/assets/';
    // картинка есть? (k.image ошибку загрузки не ловит) — для графики Flow с фолбэком на старые спрайты
    function probe(url, cb) { var im = new Image(); im.onload = function () { cb(true); }; im.onerror = function () { cb(false); }; im.src = url; }
    // билборд из url; если файла нет — та же фигура из fb (подменяем текстуру и размер, объект и его место те же)
    function art(url, fb, h, o) {
      var b = k.billboard(url, h, o);
      probe(url, function (ok) {
        if (ok || !fb) return;
        k.image(fb, function (t, img) { var m = b.children[0]; m.material.map = t; m.material.needsUpdate = true; m.scale.set(h * img.width / img.height, h, 1); m.position.y = h / 2; m.visible = true; });
      });
      return b;
    }
    var rnd = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(7);
    var mobile = k.mobile;
    // графика Flow batch 2 (18.11): атласы на альфе, прямоугольники [x0, y0, x1, y1] в пикселях исходника
    var GEN2 = {
      acacia: { src: ASSETS + 'gen/acacia.png', rects: [[24, 187, 659, 614], [701, 180, 1356, 615]] },
      clouds: { src: ASSETS + 'gen/clouds-sunset.png', rects: [[65, 44, 813, 345], [650, 183, 1331, 465], [132, 427, 985, 701]] },
      flag: { src: ASSETS + 'gen/flag-paw.png', rect: [261, 128, 1110, 686] },
      tent: ASSETS + 'gen/tent-safari.png', rock: ASSETS + 'gen/rock-snow.jpg',
    };
    // кусок атласа → своя текстура; pm — премультипликация при загрузке (мягкие края без каймы хромакея)
    // iso: оставить только связную фигуру у центра — рамки облаков в атласе перекрываются, иначе в угол попадает кусок соседа
    function isolate(cv) {
      var w = cv.width, h = cv.height, g = cv.getContext('2d'), d = g.getImageData(0, 0, w, h), a = d.data, keep = new Uint8Array(w * h), st = [], best = -1, bd = 1e9;
      for (var y = 0; y < h; y += 2) for (var x = 0; x < w; x += 2) { if (a[(y * w + x) * 4 + 3] > 128) { var dd = (x - w / 2) * (x - w / 2) + (y - h / 2) * (y - h / 2); if (dd < bd) { bd = dd; best = y * w + x; } } }
      if (best < 0) return;
      keep[best] = 1; st.push(best);
      while (st.length) {
        var p = st.pop(), px = p % w, py = (p - px) / w;
        for (var k2 = 0; k2 < 4; k2++) {
          var nx = px + (k2 === 0 ? 1 : k2 === 1 ? -1 : 0), ny = py + (k2 === 2 ? 1 : k2 === 3 ? -1 : 0);
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          var q = ny * w + nx; if (!keep[q] && a[q * 4 + 3] > 0) { keep[q] = 1; st.push(q); }
        }
      }
      for (var i = 0; i < w * h; i++) if (!keep[i]) a[i * 4 + 3] = 0;
      g.putImageData(d, 0, 0);
    }
    function cutTex(img, r, pm, iso) {
      var cv = document.createElement('canvas'); cv.width = r[2] - r[0]; cv.height = r[3] - r[1];
      cv.getContext('2d').drawImage(img, r[0], r[1], cv.width, cv.height, 0, 0, cv.width, cv.height);
      if (iso) { try { isolate(cv); } catch (e) { /* канва «заражена» (file://) — без изоляции */ } }
      var t = new T.CanvasTexture(cv); t.anisotropy = k.aniso; if (pm) t.premultiplyAlpha = true;
      if (T.sRGBEncoding && !k.premium) t.encoding = T.sRGBEncoding;
      t.aspect = cv.height / cv.width; return t;
    }
    function pmBlend(m) { m.blending = T.CustomBlending; m.blendSrc = T.OneFactor; m.blendDst = T.OneMinusSrcAlphaFactor; m.needsUpdate = true; return m; }
    function gen2(src, fn) { probe(src, function (ok) { if (ok) k.image(src, fn); }); }

    // ---------- форма горы: радиус склона на высоте y под углом a (одна функция для склона, тропы и лагерей) ----------
    function prof(y) { var u = Math.min(1, Math.max(0, y / R.peak)); return R.top + (R.base - R.top) * Math.pow(1 - u, R.power); }
    // хребты-промоины от вершины вниз (на арте — снег в промоинах), к вершине резче
    function ridge(a, y) {
      return 0.55 * Math.pow(Math.abs(Math.sin(a * 7 + y * 0.05)), 0.7) + 0.3 * Math.pow(Math.abs(Math.sin(a * 13 + 1.3 - y * 0.04)), 0.8) + 0.15 * Math.abs(Math.sin(a * 29 + 2.1));
    }
    function bump(a, y) {
      var u = Math.min(1, Math.max(0, y / R.peak));
      var n = fbm(Math.cos(a) * 2.2 + 5, y * 0.16, Math.sin(a) * 2.2 + 5) - 0.5;
      return (0.045 + 0.09 * u) * (ridge(a, y) - 0.5) * 1.6 + 0.07 * n * (1 - u * 0.6) + 0.014 * Math.sin(y * 2.3 + a * 3);
    }
    function rad(a, y) { return prof(y) * (1 + bump(a, y)); }
    function onSlope(a, y, out) { var r = rad(a, y) + (out || 0); return new T.Vector3(Math.sin(a) * r, y, Math.cos(a) * r); }
    S.onSlope = onSlope;
    var Z = R.zones;

    // ---------- небо: нарисованный закат (фиолетовый зенит → маджента → оранжевый горизонт), облака-мазки ----------
    // купол неба: градиент по высоте над горизонтом; облака нарисованы в полосе, которая попадает в кадр
    var skyTex = k.tex(2048, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0a0226'); gr.addColorStop(0.3, '#1d0a62'); gr.addColorStop(0.5, '#3e1a9a');
      gr.addColorStop(0.62, '#7a2aa8'); gr.addColorStop(0.72, '#c2408e'); gr.addColorStop(0.79, '#ff6a52'); gr.addColorStop(0.84, '#ff9a48'); gr.addColorStop(0.88, '#ffc070'); gr.addColorStop(1, '#ffc070');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // звёзды в верхней части
      for (var i = 0; i < 900; i++) { var sy = rnd() * h * 0.5; g.fillStyle = 'rgba(255,246,214,' + (0.25 + rnd() * 0.6) * (1 - sy / (h * 0.5)) + ')'; g.fillRect(rnd() * w, sy, 1.4, 1.4); }
      // облака-мазки: редкие, рваные, тёмно-фиолетовые; нижняя кромка подсвечена закатом (как на bg-kilimanjaro)
      function puff(x, y, rx, ry, rot, col) { var gr2 = g.createRadialGradient(x, y, 0, x, y, rx); gr2.addColorStop(0, col); gr2.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr2; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore(); }
      for (var c = 0; c < 16; c++) {
        var cx = rnd() * w, cy = h * (0.6 + rnd() * 0.2), cw = 90 + rnd() * 260, rot = (rnd() - 0.5) * 0.08, lit = (cy / h - 0.55) * 2.5;
        for (var p = 0; p < 14; p++) {
          var t = p / 13, px = cx + (t - 0.5) * cw, taper = Math.sin(t * Math.PI), py = cy + (rnd() - 0.5) * 6 + t * cw * rot;
          var rx = cw * (0.08 + rnd() * 0.08) * (0.4 + taper), ry = rx * (0.18 + rnd() * 0.12);
          puff(px, py, rx, ry, rot, 'rgba(' + (44 + rnd() * 24 | 0) + ',' + (18 + rnd() * 14 | 0) + ',' + (74 + rnd() * 36 | 0) + ',' + (0.55 + rnd() * 0.3) + ')');
          puff(px + rx * 0.1, py + ry * 0.55, rx * 0.8, ry * 0.4, rot, 'rgba(255,' + (130 + rnd() * 60 | 0) + ',' + (80 + rnd() * 40 | 0) + ',' + Math.min(0.85, 0.3 + lit * 0.5) + ')');
        }
      }
    }, HQ);
    skyTex.wrapS = T.RepeatWrapping;
    var DOME = 300; // купол едет с камерой (радиус меньше дальней плоскости 400), рисуется первым и ничего не перекрывает
    var dome = new T.Mesh(new T.SphereGeometry(DOME, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.62), new T.MeshBasicMaterial({ map: skyTex, side: T.BackSide, fog: false, depthWrite: false, depthTest: false, toneMapped: false }));
    (function () { var uv = dome.geometry.attributes.uv, ps = dome.geometry.attributes.position; for (var i = 0; i < uv.count; i++) { var e = Math.max(0, ps.getY(i) / DOME); uv.setY(i, 1 - Math.pow(1 - e, 1.6) * 0.86); } uv.needsUpdate = true; })();
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    k.onFrame(function () { dome.position.set(k.camera.position.x, -8, k.camera.position.z); });

    // низкое солнце у горизонта справа, наполовину за дальним хребтом
    var sunDisc = new T.Mesh(new T.CircleGeometry(7, 40), new T.MeshBasicMaterial({ color: 0xfff0c8, fog: false, toneMapped: false }));
    sunDisc.position.set(82, 7, -236); sunDisc.lookAt(0, 9, 80); scene.add(sunDisc);
    var sunHalo = k.glow(0xff9a4a, 130); sunHalo.material.opacity = 0.6; sunHalo.material.fog = false; sunHalo.position.set(82, 8, -234); scene.add(sunHalo);

    // дальние хребты: три слоя силуэтов в дымке (нарисованные панорамы ядра) — глубина как на арте
    function ridgeLayer(r, h, top, col, haze, seed) {
      var t = k.tex(2048, 256, function (g, w, H) {
        var base = H * (1 - top);
        var gr = g.createLinearGradient(0, base - H * 0.3, 0, H); gr.addColorStop(0, haze); gr.addColorStop(1, col);
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
        for (var x = 0; x <= w; x += 8) {
          var u = x / w, yy = base - H * 0.4 * (0.5 * vnoise(u * 16 + seed, seed, 1) + 0.32 * vnoise(u * 41 + seed, 2, seed) + 0.18 * vnoise(u * 97, seed, 3));
          g.lineTo(x, yy);
        }
        g.lineTo(w, H); g.closePath(); g.fill();
      }, HQ);
      var m = k.panorama({ texture: t, r: r, h: h, span: 3.0, y0: -3, z: 0, repeat: 2 });
      m.material.alphaTest = 0.5; m.material.needsUpdate = true;
      return m;
    }
    ridgeLayer(250, 40, 0.42, '#4a2a5e', '#a86a8a', 3);   // дальний — светлее (воздушная перспектива), ближний — темнее
    ridgeLayer(190, 28, 0.36, '#2e1a48', '#7a4a78', 11);
    ridgeLayer(140, 18, 0.3, '#1e0e34', '#4e2a56', 19);

    // ---------- свет: тёплый закат справа-сзади (кромки горы, как на арте), холодная сумеречная заливка спереди ----------
    scene.add(new T.HemisphereLight(0x9a80ff, 0x6a3418, 0.48));
    var sun = new T.DirectionalLight(0xff9a50, 1.65); sun.position.set(60, 26, 10); scene.add(sun);
    var fill = new T.DirectionalLight(0x7a6aff, 0.45); fill.position.set(-40, 18, 60); scene.add(fill);
    var rim = new T.DirectionalLight(0xff6a8a, 0.5); rim.position.set(-30, 12, -60); scene.add(rim);

    // ---------- земля саванны: мазки золотой травы ----------
    var grassTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#a8682a'; g.fillRect(0, 0, w, h);
      // крупные пятна: тени, проплешины земли, тёмные кусты — равнина не однотонная
      for (var b = 0; b < 26; b++) { var bx = rnd() * w, by = rnd() * h, br2 = 20 + rnd() * 60, gb = g.createRadialGradient(bx, by, 0, bx, by, br2), dk = rnd() < 0.6; gb.addColorStop(0, dk ? 'rgba(70,34,20,.45)' : 'rgba(230,170,90,.35)'); gb.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gb; g.fillRect(bx - br2, by - br2, br2 * 2, br2 * 2); }
      for (var i = 0; i < 1600; i++) { var v = rnd(); g.fillStyle = v < 0.35 ? 'rgba(232,170,80,.35)' : v < 0.7 ? 'rgba(120,64,24,.3)' : 'rgba(255,206,120,.3)'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 18, 2 + rnd() * 4, 0, 0, Math.PI * 2); g.fill(); }
      for (var j = 0; j < 4000; j++) { g.strokeStyle = rnd() < 0.5 ? 'rgba(255,214,140,.35)' : 'rgba(110,60,20,.35)'; g.lineWidth = 1; var x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 4 - rnd() * 6); g.stroke(); }
    }, HQ);
    grassTex.wrapS = grassTex.wrapT = T.RepeatWrapping; grassTex.repeat.set(30, 30);
    var ground = new T.Mesh(new T.CircleGeometry(420, 72), new T.MeshStandardMaterial({ color: 0xc89a7a, map: grassTex, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
    // нарисованная трава саванны (Flow 18.11) вместо процедурной; пока нет — процедурная
    probe(ASSETS + 'gen/savanna-grass.jpg', function (ok) {
      if (!ok) return;
      k.image(ASSETS + 'gen/savanna-grass.jpg', function (t0) {
        var t = t0.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(42, 42); t.anisotropy = k.aniso;
        ground.material.map = t; ground.material.color.set(0xd8b090); ground.material.needsUpdate = true;
      });
    });

    // ---------- гора: гладкий рельеф, пояса перетекают, снег по хребтам, мазковая фактура ----------
    var detailTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#e0e0e0'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) {
        var x = rnd() * w, y = rnd() * h, l = 6 + rnd() * 22, v = rnd();
        g.strokeStyle = v < 0.5 ? 'rgba(255,255,255,' + (0.15 + rnd() * 0.25) + ')' : 'rgba(80,60,90,' + (0.1 + rnd() * 0.2) + ')';
        g.lineWidth = 1 + rnd() * 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 4, y + l); g.stroke(); // мазки вдоль склона
      }
    }, HQ);
    detailTex.wrapS = detailTex.wrapT = T.RepeatWrapping;
    function mountainMesh() {
      var rows = mobile ? 70 : 96, cols = mobile ? 140 : 200, pos = [], col = [], uv = [], idx = [];
      var c = new T.Color(), c2 = new T.Color(), snowC = new T.Color(Z[Z.length - 1].cols[0]), zc = Z.map(function (z) { return [new T.Color(z.cols[0]), new T.Color(z.cols[1])]; });
      for (var iy = 0; iy <= rows; iy++) for (var ia = 0; ia <= cols; ia++) {
        var a = (ia / cols) * Math.PI * 2 - Math.PI, y = (iy / rows) * R.peak, p = onSlope(a, y, 0);
        pos.push(p.x, p.y, p.z); uv.push(ia / cols * 10, y / R.peak * 5);
        var n = fbm(Math.cos(a) * 3 + 9, y * 0.22, Math.sin(a) * 3 + 9), rg = ridge(a, y), u = y / R.peak;
        var yy = y + (n - 0.5) * 2.4; // рваные, но мягкие границы поясов
        // пояса: плавный переход через каждую границу
        var n2 = vnoise(Math.cos(a) * 6, y * 0.6, Math.sin(a) * 6);
        c.copy(zc[0][0]).lerp(zc[0][1], n2);
        for (var zi = 0; zi < Z.length - 1; zi++) {
          var t = sstep(Z[zi].to - 0.45, Z[zi].to + 0.45, yy);
          if (t <= 0) break;
          c2.copy(zc[zi + 1][0]).lerp(zc[zi + 1][1], n2); c.lerp(c2, t);
        }
        // снег: ниже по хребтам, выше в промоинах — полосы, как на арте
        var sn = sstep(Z[4].to - 1.6, Z[4].to + 0.4, y + (rg - 0.5) * 6.5 * u + (n - 0.5) * 1.6);
        c.lerp(snowC, sn);
        // глубина промоин: гребни светлее, промоины темнее — читается рельеф, как мазки на арте
        c.multiplyScalar(0.7 + 0.45 * rg);
        col.push(c.r, c.g, c.b);
      }
      var W = cols + 1;
      for (iy = 0; iy < rows; iy++) for (ia = 0; ia < cols; ia++) {
        var A = iy * W + ia, B = A + 1, C = A + W, D = C + 1;
        idx.push(A, B, D, A, D, C);
      }
      // плато вершины
      var top = pos.length / 3; pos.push(0, R.peak + 0.2, 0); uv.push(0.5, 5); col.push(snowC.r, snowC.g, snowC.b);
      for (ia = 0; ia < cols; ia++) idx.push(rows * W + ia, rows * W + ia + 1, top);
      var geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx); geo.computeVertexNormals();
      return new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, map: detailTex, roughness: 0.93, metalness: 0, envMapIntensity: 0.4 }));
    }
    var mtn = mountainMesh(); scene.add(mtn);
    // нарисованные скалы со снегом (Flow rock-snow.jpg) в поясах «альпийская пустыня» и «ледник»: смешиваются с цветами вершин
    // по высоте; граница рваная — порог сдвигается яркостью самой текстуры. Нет файла — пояса как были
    gen2(GEN2.rock, function (t0) {
      var rt = t0.clone(); rt.needsUpdate = true; rt.wrapS = rt.wrapT = T.RepeatWrapping; rt.anisotropy = k.aniso;
      var f = function (v) { return v.toFixed(2); }, lo = Z[3].to - 0.4, hi = Z[3].to + 1.1, ice = Z[4].to;
      mtn.material.onBeforeCompile = function (sh) {
        sh.uniforms.rockMap = { value: rt };
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D rockMap;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n' +
            // 20.11: крупнее (раньше 16 повторов по кругу — с общего плана сливалось в серую кашу), контрастнее,
            // рельеф хребтов из цветов вершин сохраняется (sh), вес выше
            '{ float hY = vUv.y * ' + f(R.peak / 5) + '; vec3 rk = texture2D(rockMap, vUv * vec2(0.45, 0.55)).rgb;' +
            ' float lum = dot(rk, vec3(0.333));' +
            ' rk = clamp((rk - 0.5) * 1.35 + 0.5, 0.0, 1.0);' +
            ' float sh = clamp(0.62 + 0.4 * dot(vColor.rgb, vec3(0.333)), 0.68, 0.9);' + // снег текстуры не выше порога bloom
            ' float w = smoothstep(' + f(lo) + ', ' + f(hi) + ', hY + (lum - 0.5) * 1.6) * (1.0 - 0.45 * smoothstep(' + f(ice) + ', ' + f(R.peak) + ', hY));' +
            ' diffuseColor.rgb = mix(diffuseColor.rgb, rk * vec3(0.86, 0.75, 0.72) * sh, w * 0.95); }');
      };
      mtn.material.needsUpdate = true;
    });

    // облако-шапка над вершиной (линза) — главный силуэт арта: нарисованная мазками, тёплый верх, лиловый низ
    var capTex = k.tex(512, 160, function (g, w, h) {
      function blob(x, y, rx, ry, col) { var gr2 = g.createRadialGradient(x, y, 0, x, y, rx); gr2.addColorStop(0, col); gr2.addColorStop(0.7, col.replace(/[\d.]+\)$/, '0.35)')); gr2.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr2; g.beginPath(); g.arc(x, y, rx, 0, Math.PI * 2); g.fill(); g.restore(); }
      // яркость держим ниже порога bloom (0.8): шапка должна быть мягкой, а не светиться диском
      for (var i = 0; i < 40; i++) { var t = i / 39, x = w * (0.08 + 0.84 * t), taper = Math.sin(t * Math.PI); blob(x, h * 0.62, w * 0.08 * (0.5 + taper), h * 0.16 * (0.4 + taper), 'rgba(170,112,160,0.32)'); }
      for (i = 0; i < 40; i++) { t = i / 39; x = w * (0.12 + 0.76 * t); taper = Math.sin(t * Math.PI); blob(x, h * 0.5, w * 0.07 * (0.5 + taper), h * 0.13 * (0.4 + taper), 'rgba(232,160,150,0.36)'); }
      for (i = 0; i < 24; i++) { t = i / 23; x = w * (0.25 + 0.5 * t); taper = Math.sin(t * Math.PI); blob(x, h * 0.42, w * 0.05 * (0.4 + taper), h * 0.08 * (0.4 + taper), 'rgba(246,196,172,0.4)'); }
    }, HQ);
    var cap1 = new T.Sprite(new T.SpriteMaterial({ map: capTex, transparent: true, depthWrite: false, fog: false }));
    cap1.scale.set(30, 9.4, 1); cap1.position.set(0, R.peak + 4.4, -4); scene.add(cap1);
    var cap2 = new T.Sprite(new T.SpriteMaterial({ map: capTex, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
    cap2.scale.set(20, 5, 1); cap2.position.set(2, R.peak + 6.4, -6); scene.add(cap2);

    // ---------- тропа серпантином: дорожка с бортиками, пройденный участок светится ----------
    var order = R.order, P2 = order.map(function (id) { var c = R.camps[id]; return new T.Vector3(c[0], c[1], c[2]); });
    var curve2 = new T.CatmullRomCurve3(P2, false, 'catmullrom', 0.3);
    function trailPoint(t) { var q = curve2.getPoint(t); return onSlope(q.x, Math.min(R.peak, q.y), q.z + 0.12); }
    var segs = [], trailPts = [], trailCol = new T.Color(0xd8b88a), trailLit = new T.Color(BRAND.y), UP = new T.Vector3(0, 1, 0);
    var borderMat = new T.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 1 });
    for (var s = 0; s < order.length - 1; s++) {
      var pts = [];
      for (var j = 0; j <= 28; j++) { var p = trailPoint((s + j / 28) / (order.length - 1)); pts.push(p); trailPts.push(p); }
      // лента дорожки: по обе стороны от оси, чуть над склоном
      var vs = [], ix = [], L = [], Rr = [];
      for (j = 0; j < pts.length; j++) {
        var tg = pts[Math.min(pts.length - 1, j + 1)].clone().sub(pts[Math.max(0, j - 1)]).normalize();
        var side = new T.Vector3().crossVectors(tg, UP).normalize().multiplyScalar(0.36);
        var outv = new T.Vector3(pts[j].x, 0, pts[j].z).normalize().multiplyScalar(0.05).add(new T.Vector3(0, 0.05, 0));
        var l = pts[j].clone().add(side).add(outv), r = pts[j].clone().sub(side).add(outv);
        vs.push(l.x, l.y, l.z, r.x, r.y, r.z); L.push(l.clone().add(outv)); Rr.push(r.clone().add(outv));
        if (j) { var b = (j - 1) * 2; ix.push(b, b + 1, b + 3, b, b + 3, b + 2); }
      }
      var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(vs, 3)); rg.setIndex(ix); rg.computeVertexNormals();
      var mat = new T.MeshStandardMaterial({ color: 0xd8b88a, emissive: BRAND.y, emissiveIntensity: 0, roughness: 1, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
      scene.add(new T.Mesh(rg, mat));
      // бортики из камней
      [L, Rr].forEach(function (edge) { scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(edge), 48, 0.06, 5, false), borderMat)); });
      // огоньки вдоль пройденного участка
      var dots = [];
      for (var d = 2; d < 28; d += 4) { var gl = k.glow(BRAND.y, 1.1); gl.position.copy(pts[d]).y += 0.3; gl.material.opacity = 0; scene.add(gl); dots.push(gl); }
      segs.push({ to: order[s + 1], mat: mat, dots: dots, lit: 0 });
    }

    // ---------- декор поясов (InstancedMesh: один вызов отрисовки на тип) ----------
    var campPts = order.map(function (id) { var c = R.camps[id]; return onSlope(c[0], c[1], c[2]); });
    var pond = R.pond;
    function clearSpot(p, r) {
      for (var i = 0; i < campPts.length; i++) if (campPts[i].distanceTo(p) < r + 1.6) return false;
      for (var j = 0; j < trailPts.length; j += 2) if (trailPts[j].distanceTo(p) < r + 0.5) return false;
      if (pond && Math.pow((p.x - pond[0]) / (pond[2] + 1.2), 2) + Math.pow((p.z - pond[1]) / (pond[3] + 1.2), 2) < 1) return false;
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
      items.forEach(function (it, i) {
        var o = fn(it, i); if (o.q) Q.copy(o.q); else { E.set(o.rx || 0, o.ry || 0, o.rz || 0); Q.setFromEuler(E); }
        M4.compose(o.p, Q, V3.set(o.s[0], o.s[1], o.s[2])); m.setMatrixAt(i, M4); if (o.c != null) m.setColorAt(i, C.setHex(o.c));
      });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      scene.add(m); return m;
    }
    function jitter(geo, amt, seed) { var p = geo.attributes.position; for (var i = 0; i < p.count; i++) { var f = 1 + (hash3(p.getX(i) * 7 + seed, p.getY(i) * 7, p.getZ(i) * 7) - 0.5) * amt; p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f); } geo.computeVertexNormals(); return geo; }
    var leafMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    var barkMat = new T.MeshStandardMaterial({ color: 0x2a1608, roughness: 1 });

    // акации: зонтичная крона на изогнутом стволе — силуэты саванны (как на арте)
    var acaciaPts = [];
    for (var q = 0; q < 60; q++) { var aa = (rnd() - 0.5) * 2.4, rr = R.base * (0.95 + rnd() * 1.6), p0 = new T.Vector3(Math.sin(aa) * rr, 0, Math.cos(aa) * rr); if (clearSpot(p0, 1.5) && Math.abs(p0.x) > 4) acaciaPts.push({ p: p0, s: 0.9 + rnd() * 0.9, r: rnd() * 6 }); }
    scatter(12, 0.4, Z[0].to - 0.4, 1.0).forEach(function (it) { acaciaPts.push({ p: it.p, s: 0.6 + rnd() * 0.3, r: rnd() * 6 }); });
    var trunkGeo = new T.CylinderGeometry(0.07, 0.13, 1.5, 6); trunkGeo.translate(0, 0.75, 0);
    var acaciaMeshes = [];
    acaciaMeshes.push(instanced(trunkGeo, barkMat, acaciaPts, function (it) { return { p: it.p.clone(), s: [it.s, it.s, it.s], rz: 0.12, ry: it.r }; }));
    var crownGeo = jitter(new T.IcosahedronGeometry(1, 2), 0.25, 1);
    acaciaMeshes.push(instanced(crownGeo, leafMat, acaciaPts, function (it, i) { return { p: new T.Vector3(it.p.x, it.p.y + 1.55 * it.s, it.p.z), s: [1.7 * it.s, 0.3 * it.s, 1.45 * it.s], ry: it.r, c: [0x3e5a1c, 0x4c6a22, 0x35501a][i % 3] }; }));
    acaciaMeshes.push(instanced(crownGeo, leafMat, acaciaPts, function (it, i) { return { p: new T.Vector3(it.p.x + 0.5 * it.s, it.p.y + 1.75 * it.s, it.p.z - 0.2 * it.s), s: [1.0 * it.s, 0.22 * it.s, 0.9 * it.s], ry: it.r + 1, c: [0x5a7a26, 0x4a6e22][i % 2] }; }));
    // нарисованные акации Flow (acacia.png, 2 дерева) — спрайты на тех же местах; процедурные прячем. Нет файла — процедурные
    gen2(GEN2.acacia.src, function (t0, img) {
      var cuts = GEN2.acacia.rects.map(function (r) { return cutTex(img, r, true); });
      var mats = cuts.map(function (tx) { return pmBlend(new T.SpriteMaterial({ map: tx, color: 0xe6d2c8, alphaTest: 0.35, depthWrite: true, transparent: false })); });
      acaciaPts.forEach(function (it, i) {
        var tx = cuts[i % 2], sp = new T.Sprite(mats[i % 2]), H = 2.15 * it.s;
        sp.center.set(0.5, 0.03); sp.scale.set(H / tx.aspect, H, 1); sp.position.copy(it.p); scene.add(sp);
      });
      acaciaMeshes.forEach(function (m) { m.visible = false; });
    });

    // кочки сухой травы на переднем плане: скрещенные плоскости с нарисованными стеблями
    var tuftTex = k.tex(128, 128, function (g, w, h) {
      for (var i = 0; i < 46; i++) {
        var x0 = w * (0.2 + rnd() * 0.6), bend = (rnd() - 0.5) * 40, top = h * (0.05 + rnd() * 0.45);
        g.strokeStyle = ['#f0b860', '#d89040', '#ffd48a', '#b87030'][i % 4]; g.lineWidth = 1.5 + rnd() * 1.5;
        g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + bend * 0.3, h * 0.6, x0 + bend, top); g.stroke();
      }
    }, HQ);
    var tuftGeo = (function () {
      var gg = new T.BufferGeometry(), P = [], U = [], I = [];
      [0, Math.PI / 2].forEach(function (rot, n) {
        var c = Math.cos(rot) * 0.5, s = Math.sin(rot) * 0.5, b = n * 4;
        P.push(-c, 0, -s, c, 0, s, c, 1, s, -c, 1, -s); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(b, b + 1, b + 2, b, b + 2, b + 3);
      });
      gg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); gg.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); gg.setIndex(I); gg.computeVertexNormals(); return gg;
    })();
    var tufts = [];
    for (var tq = 0; tq < (mobile ? 420 : 900); tq++) {
      var ta = (rnd() - 0.5) * 1.9, tr = R.base * 1.02 + Math.pow(rnd(), 0.8) * 70, tp = new T.Vector3(Math.sin(ta) * tr, 0, Math.cos(ta) * tr);
      if (!clearSpot(tp, 0.4)) continue; tufts.push({ p: tp, s: (0.7 + rnd() * 1.3) * (0.8 + (tr - R.base) / 50), r: rnd() * 3 }); // ближе к камере — крупнее
    }
    instanced(tuftGeo, new T.MeshStandardMaterial({ map: tuftTex, alphaTest: 0.35, side: T.DoubleSide, roughness: 1, emissive: 0x7a3a10, emissiveIntensity: 0.55 }), tufts, function (it) { return { p: it.p, s: [it.s * 1.4, it.s, it.s * 1.4], ry: it.r }; });

    // дождевой лес: густые кроны + редкие высокие деревья
    var forest = scatter(mobile ? 120 : 180, Z[0].to + 0.1, Z[1].to - 0.1, 1.15);
    var bushGeo = jitter(new T.IcosahedronGeometry(0.62, 1), 0.3, 2);
    instanced(bushGeo, leafMat, forest, function (it, i) { var s = 0.8 + rnd() * 0.7; return { p: it.p.clone().setY(it.p.y + 0.35), s: [s, s * 1.15, s], ry: i, c: [0x0f5a2a, 0x177a36, 0x2a9a3e, 0x0c4a24][i % 4] }; });
    // вереск: розово-фиолетовые кусты
    var heather = scatter(mobile ? 110 : 150, Z[1].to + 0.1, Z[2].to - 0.1, 1.2);
    instanced(jitter(new T.IcosahedronGeometry(0.34, 1), 0.35, 3), leafMat, heather, function (it, i) { var s = 0.8 + rnd() * 0.8; return { p: it.p.clone().setY(it.p.y + 0.15), s: [s, s * 0.75, s], ry: i, c: [0xc04ac0, 0x9a30c8, 0xe070c8, 0x7a24b0][i % 4] }; });
    // пустошь: «сенецио» — ствол и розетка
    var sen = scatter(34, Z[2].to + 0.2, Z[3].to - 0.2, 1.1);
    instanced(new T.CylinderGeometry(0.07, 0.1, 1.2, 6), barkMat, sen, function (it) { return { p: it.p.clone().setY(it.p.y + 0.55), s: [1, 1, 1] }; });
    var rosGeo = new T.ConeGeometry(0.42, 0.5, 9, 1, true); rosGeo.rotateX(Math.PI);
    instanced(rosGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: T.DoubleSide }), sen, function (it, i) { return { p: it.p.clone().setY(it.p.y + 1.3), s: [1, 1, 1], c: [0x5aa848, 0x3a9a6a][i % 2] }; });
    // альпийская пустыня: камни
    var rocks = scatter(50, Z[3].to + 0.1, Z[4].to - 0.1, 1.1);
    instanced(jitter(new T.IcosahedronGeometry(0.32, 1), 0.45, 4), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), rocks, function (it, i) { var s = 0.7 + rnd(); return { p: it.p.clone(), s: [s, s * 0.7, s], rx: i, ry: i * 2, c: [0x6a3428, 0x8a4a30, 0x4a2a24][i % 3] }; });
    // ледник: льдины
    var ice = scatter(30, Z[4].to + 0.1, R.peak - 0.6, 1.0);
    instanced(new T.OctahedronGeometry(0.3, 0), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1, envMapIntensity: 1.2, flatShading: true }), ice, function (it, i) { var s = 0.8 + rnd() * 0.8; return { p: it.p.clone().setY(it.p.y + 0.12), s: [s, s * 1.5, s], ry: i, c: [0xbfe8ff, 0x9fd8ff, 0xe8f6ff][i % 3] }; });

    // ---------- водопой: вода-зеркало отражает закат и гору ----------
    if (pond) {
      var shore = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshStandardMaterial({ color: 0x5a3418, roughness: 1 }));
      shore.rotation.x = -Math.PI / 2; shore.scale.set(pond[2] + 0.9, pond[3] + 0.6, 1); shore.position.set(pond[0], 0.005, pond[1]); scene.add(shore);
      var tint = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: 0x2a1450, transparent: true, opacity: 0.32, depthWrite: false }));
      var water = k.mirror(new T.CircleGeometry(1, 48), { res: mobile ? 384 : 640, color: 0x9a8aa8, hide: [tint] });
      [water, tint].forEach(function (m, i) { if (!m) return; m.rotation.x = -Math.PI / 2; m.scale.set(pond[2], pond[3], 1); m.position.set(pond[0], 0.02 + i * 0.01, pond[1]); scene.add(m); });
      if (!water) tint.material.opacity = 0.85;
    }

    // облака у подножия, тёплые сверху (закат), фиолетовые снизу
    var cloudTex = k.tex(256, 128, function (g, w, h) {
      for (var i = 0; i < 30; i++) {
        var r = 12 + rnd() * 22, x = r + 4 + rnd() * (w - 2 * r - 8), y = h * 0.55 + (rnd() - 0.5) * (h * 0.5 - r);
        var gr = g.createRadialGradient(x, y - r * 0.3, 0, x, y, r); gr.addColorStop(0, 'rgba(255,226,206,.85)'); gr.addColorStop(0.6, 'rgba(206,150,190,.5)'); gr.addColorStop(1, 'rgba(120,80,150,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    }, HQ);
    var clouds = [];
    [[-30, 5.5, 2, 30, 0.3], [-44, 7, -14, 34, 0.26], [33, 6.2, -4, 30, 0.28], [48, 8.5, -22, 36, 0.24], [-62, 13, -70, 50, 0.2], [70, 15, -84, 54, 0.2]].forEach(function (c, i) {
      var m = new T.SpriteMaterial({ map: cloudTex, color: 0xb894a8, transparent: true, opacity: 0.75, depthWrite: false });
      var spr = new T.Sprite(m); spr.scale.set(c[3], c[3] * c[4], 1); spr.position.set(c[0], c[1], c[2]); scene.add(spr);
      clouds.push({ s: spr, x0: c[0], ph: i, w: c[3] });
    });
    // нарисованные закатные облака Flow (clouds-sunset.png, 3 штуки) вместо процедурных; нет файла — процедурные
    gen2(GEN2.clouds.src, function (t0, img) {
      var cuts = GEN2.clouds.rects.map(function (r) { return cutTex(img, r, true, true); });
      clouds.forEach(function (c, i) {
        var tx = cuts[i % cuts.length], m = c.s.material, op = 0.9;
        // fog выкл.: при премульт. смешивании туман добавился бы и к пустым пикселям — прямоугольник вокруг облака
        m.map = tx; m.opacity = op; m.fog = false; m.color.set(0xd8c4d0).multiplyScalar(op); pmBlend(m);
        c.s.scale.set(c.w * 0.85, c.w * 0.85 * tx.aspect, 1);
      });
    });

    k.snow({ n: 260, area: [26, 9, 20], center: [0, 13, 0], speed: 0.6, size: 0.16, opacity: 0.7 });

    // ---------- лагерь ----------
    var dotTex = k.tex(32, 32, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    var flagTex = k.tex(128, 80, function (g, w, h) {
      g.fillStyle = '#5c05e5'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f1d627'; // лапа Jumanza: подушечка + 4 пальца, без букв
      g.beginPath(); g.ellipse(w * 0.5, h * 0.64, w * 0.15, h * 0.17, 0, 0, Math.PI * 2); g.fill();
      [[0.33, 0.42, -0.3], [0.44, 0.3, -0.1], [0.56, 0.3, 0.1], [0.67, 0.42, 0.3]].forEach(function (t) { g.beginPath(); g.ellipse(w * t[0], h * t[1], w * 0.055, h * 0.09, t[2], 0, Math.PI * 2); g.fill(); });
      g.strokeStyle = '#f1d627'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
    }, HQ);
    var tentTex = k.tex(128, 128, function (g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(i * w / 6, 0, 2, h); } // швы
      for (var j = 0; j < 400; j++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.05 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    }, HQ);
    tentTex.wrapS = tentTex.wrapT = T.RepeatWrapping; tentTex.repeat.set(0.7, 0.7);
    var tentShape = new T.Shape(); tentShape.moveTo(-0.78, 0); tentShape.quadraticCurveTo(-0.42, 0.52, 0, 1.15); tentShape.quadraticCurveTo(0.42, 0.52, 0.78, 0); tentShape.lineTo(-0.78, 0);
    var tentGeo = new T.ExtrudeGeometry(tentShape, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 10 }); tentGeo.translate(0, 0, -0.75);
    var doorShape = new T.Shape(); doorShape.moveTo(-0.3, 0); doorShape.quadraticCurveTo(-0.15, 0.32, 0, 0.66); doorShape.quadraticCurveTo(0.15, 0.32, 0.3, 0); doorShape.lineTo(-0.3, 0);
    var doorGeo = new T.ShapeGeometry(doorShape, 8);
    var stoneMat = new T.MeshStandardMaterial({ color: 0x5a3a26, roughness: 1, flatShading: true });
    var platMat = new T.MeshStandardMaterial({ color: 0x7a5434, roughness: 1 });
    var poleMat = new T.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.8 });
    var logMat = new T.MeshStandardMaterial({ color: 0x3a2010, roughness: 1 });
    var stoneGeo = jitter(new T.IcosahedronGeometry(0.1, 0), 0.4, 5), logGeo = new T.CylinderGeometry(0.05, 0.06, 0.55, 6);
    var wireMat = new T.MeshBasicMaterial({ color: 0x1a0e08 });
    var BULB_C = [BRAND.y, BRAND.g, 0xff3d7f, 0x1ec8ff];
    // флаг с лапой — нарисованный Flow (flag-paw.png): ткань с тенями складок; лагеря могут появиться раньше картинки
    var flagMats = [], flagGen = null;
    function useFlag(m) { m.map = flagGen; m.emissiveMap = flagGen; m.alphaTest = 0.5; m.needsUpdate = true; }
    gen2(GEN2.flag.src, function (t0, img) { flagGen = cutTex(img, GEN2.flag.rect, false); flagMats.forEach(useFlag); });
    // палатки базового лагеря (Flow tent-safari.png) у подножия, рядом со львом и джипом; нет файла — без них
    gen2(GEN2.tent, function (t0, img) {
      var tx = cutTex(img, [39, 208, 985, 843], true), tm = pmBlend(new T.SpriteMaterial({ map: tx, alphaTest: 0.3, depthWrite: true, transparent: false, fog: false }));
      var b0 = R.camps[R.order[0]], bp = onSlope(b0[0], b0[1], b0[2]);
      [[-4.6, -1.8, 1.7], [4.4, -2.6, 1.5], [-7.4, 0.6, 1.35]].forEach(function (d) {
        var sp = new T.Sprite(tm); sp.center.set(0.5, 0.08); sp.scale.set(d[2] / tx.aspect, d[2], 1);
        sp.position.copy(bp).add(new T.Vector3(d[0], 0, d[1])); scene.add(sp);
      });
    });
    function camp(i, isPractice) {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var plat = new T.Mesh(new T.CylinderGeometry(1.35, 1.5, 0.45, 24), platMat); plat.position.y = -0.18; inner.add(plat); // вытоптанная площадка
      var tentCol = R.tents[i % R.tents.length];
      var tentMat = new T.MeshStandardMaterial({ color: tentCol, map: tentTex, roughness: 0.85, emissive: BRAND.warm, emissiveIntensity: 0 });
      var tent = new T.Mesh(tentGeo, tentMat); tent.position.set(-0.4, 0, -0.25); tent.rotation.y = 0.25; inner.add(tent);
      var doorMat = new T.MeshStandardMaterial({ color: 0x1a0c06, emissive: 0xffb050, emissiveIntensity: 0, roughness: 1 });
      var door = new T.Mesh(doorGeo, doorMat); door.position.set(0, 0.01, 0.79); tent.add(door);
      // флаг с лапой: плоскость с сегментами, развевается
      var pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 2.2, 6), poleMat); pole.position.set(0.95, 1.1, -0.35); inner.add(pole);
      var flagGeo = new T.PlaneGeometry(0.72, 0.45, 8, 1); flagGeo.translate(0.36, 0, 0);
      var flagMat = new T.MeshStandardMaterial({ map: flagTex, emissiveMap: flagTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8, side: T.DoubleSide });
      flagMats.push(flagMat); if (flagGen) useFlag(flagMat);
      var flag = new T.Mesh(flagGeo, flagMat); flag.position.set(0.97, 1.95, -0.35); inner.add(flag);
      // костёр: кольцо камней, поленья, живое пламя (шейдер WH), искры, тёплый свет на палатку
      var fire = new T.Group(); fire.position.set(0.55, 0.05, 0.75); inner.add(fire);
      for (var st = 0; st < 8; st++) { var sm = new T.Mesh(stoneGeo, stoneMat), sa = st / 8 * Math.PI * 2; sm.position.set(Math.cos(sa) * 0.3, 0.03, Math.sin(sa) * 0.3); sm.rotation.y = sa; fire.add(sm); }
      for (var l = 0; l < 3; l++) { var log = new T.Mesh(logGeo, logMat); log.rotation.order = 'YXZ'; log.rotation.set(Math.PI / 2 - 0.35, l * 2.09, 0); log.position.y = 0.08; fire.add(log); }
      var fh = new T.Group(); fire.add(fh); // держатель пламени: fire поворачиваем против склона, чтобы ядро ставило пламя лицом к камере
      var flame = k.flame(FIRE, 0); flame.scale.set(0.5, 0.85, 1); flame.position.y = 0.04; flame.visible = false; fh.add(flame);
      var fireGlow = k.glow(BRAND.fire, 2.6); fireGlow.position.y = 0.3; fireGlow.material.opacity = 0; fire.add(fireGlow);
      var light = new T.PointLight(0xff8a3a, 0, 5.5, 2); light.position.y = 0.6; fire.add(light);
      var EN = 12, ep = new Float32Array(EN * 3), ev = [];
      for (var e = 0; e < EN; e++) { ev.push({ y: rnd(), x: (rnd() - 0.5) * 0.3, z: (rnd() - 0.5) * 0.3, s: 0.5 + rnd() }); }
      var eg = new T.BufferGeometry(); eg.setAttribute('position', new T.BufferAttribute(ep, 3));
      var embers = new T.Points(eg, new T.PointsMaterial({ map: dotTex, color: 0xffb050, size: 0.09, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      embers.frustumCulled = false; fire.add(embers);
      // гирлянда-фонарики от палатки к флагштоку: провод + лампочки (светятся через bloom)
      var wpts = [];
      for (var b = 0; b <= 10; b++) { var t = b / 10; wpts.push(new T.Vector3(-0.4 + (0.95 + 0.4) * t, 1.18 + (1.85 - 1.18) * t - Math.sin(t * Math.PI) * 0.32, -0.25 + (-0.35 + 0.25) * t)); }
      inner.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(wpts), 20, 0.012, 4, false), wireMat));
      var bulbs = [];
      for (b = 1; b < 10; b++) {
        var bc = BULB_C[b % 4], bm = new T.MeshBasicMaterial({ color: 0x241a2a });
        var bulb = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), bm); bulb.position.copy(wpts[b]).y -= 0.05; inner.add(bulb);
        bulbs.push({ m: bm, c: new T.Color(bc) });
      }
      // кольцо «текущий лагерь»
      var ring = new T.Mesh(new T.RingGeometry(1.85, 2.1, 48), new T.MeshBasicMaterial({ color: BRAND.g, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; g.add(ring);
      var burst = k.glow(BRAND.g, 6); burst.position.y = 1.2; burst.material.opacity = 0; g.add(burst);
      if (isPractice) inner.scale.setScalar(1.15);
      return { s0: isPractice ? 1.15 : 1, g: g, inner: inner, fire: fire, tent: tentMat, door: doorMat, flag: flag, flagGeo: flagGeo, flagMat: flagMat, flame: flame, fireGlow: fireGlow, light: light,
        embers: embers, ep: ep, ev: ev, bulbs: bulbs, ring: ring, burst: burst, lit: 0, target: 0, hover: 0, cheer: 0, h: 2.3 };
    }

    // ---------- вершина: снежный холм, ёлка из веток, огоньки, звезда, подарки, звери ----------
    var snowMat = new T.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.85, envMapIntensity: 0.5 });
    function gift(w, colHex, ribHex) {
      var gg = new T.Group(), m = new T.MeshStandardMaterial({ color: colHex, roughness: 0.45, envMapIntensity: 0.8 }), rm = new T.MeshStandardMaterial({ color: ribHex, roughness: 0.3, metalness: 0.4 });
      var bx = new T.Mesh(new T.BoxGeometry(w, w * 0.85, w), m); bx.position.y = w * 0.425; gg.add(bx);
      var r1 = new T.Mesh(new T.BoxGeometry(w * 1.02, w * 0.87, w * 0.14), rm); r1.position.y = w * 0.425; gg.add(r1);
      var r2 = new T.Mesh(new T.BoxGeometry(w * 0.14, w * 0.87, w * 1.02), rm); r2.position.y = w * 0.425; gg.add(r2);
      [-1, 1].forEach(function (sd) { var bow = new T.Mesh(new T.TorusGeometry(w * 0.16, w * 0.045, 6, 14), rm); bow.position.set(sd * w * 0.13, w * 0.9, 0); bow.rotation.set(0, Math.PI / 2, sd * 0.6); gg.add(bow); });
      return gg;
    }
    function summitObj() {
      var g = new T.Group(), inner = new T.Group(); g.add(inner);
      var mound = new T.Mesh(jitter(new T.SphereGeometry(3.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.06, 6), snowMat); mound.scale.y = 0.22; mound.position.y = -0.2; inner.add(mound);
      // ёлка: тёмное ядро + сотни веток (одна отрисовка) + снег на кончиках
      var core = new T.Mesh(new T.ConeGeometry(1.5, 4.4, 12), new T.MeshStandardMaterial({ color: 0x0a3a1e, roughness: 1 })); core.position.y = 2.6; inner.add(core);
      var trunk = new T.Mesh(new T.CylinderGeometry(0.18, 0.24, 0.7, 8), logMat); trunk.position.y = 0.35; inner.add(trunk);
      var br = [], tips = [], up = new T.Vector3(0, 1, 0);
      for (var y = 0.7; y < 4.7; y += 0.16) {
        var r = 1.95 * (1 - (y - 0.7) / 4.1) + 0.12, n = Math.round(6 + r * 10);
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2 + y * 1.7 + rnd() * 0.3, dir = new T.Vector3(Math.cos(a), -0.42 - rnd() * 0.15, Math.sin(a)).normalize();
          var q = new T.Quaternion().setFromUnitVectors(up, dir), len = r * (0.85 + rnd() * 0.3);
          br.push({ p: new T.Vector3(Math.cos(a) * r * 0.35, y, Math.sin(a) * r * 0.35), q: q, len: len, c: [0x14682e, 0x1a7a36, 0x0f5626, 0x228a3e][(i + (y * 10 | 0)) % 4] });
          if (rnd() < 0.28) tips.push(new T.Vector3(Math.cos(a) * r * 0.9, y - len * 0.35, Math.sin(a) * r * 0.9));
        }
      }
      var brGeo = new T.ConeGeometry(0.16, 1, 5); brGeo.translate(0, 0.5, 0);
      var brM = new T.InstancedMesh(brGeo, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), br.length);
      br.forEach(function (b, i) { M4.compose(b.p, b.q, V3.set(1, b.len, 1)); brM.setMatrixAt(i, M4); brM.setColorAt(i, C.setHex(b.c)); });
      brM.instanceMatrix.needsUpdate = true; brM.instanceColor.needsUpdate = true; inner.add(brM);
      var snM = new T.InstancedMesh(new T.SphereGeometry(0.1, 6, 4), snowMat, tips.length);
      tips.forEach(function (p, i) { M4.compose(p, Q.identity(), V3.set(1.3, 0.55, 1.3)); snM.setMatrixAt(i, M4); }); snM.instanceMatrix.needsUpdate = true; inner.add(snM);
      // огоньки спиралью: тёплые как на арте + цветные бренда
      var BN = 70, bulbM = new T.InstancedMesh(new T.SphereGeometry(0.065, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), BN), bulbC = [];
      var BC = [0xffd27a, 0xffe6a0, 0xffd27a, BRAND.y, 0xff3d7f, BRAND.g, 0x1ec8ff];
      for (i = 0; i < BN; i++) {
        var tt = i / BN, by = 0.75 + tt * 3.9, rr2 = 1.95 * (1 - (by - 0.7) / 4.1) + 0.2, ba = tt * Math.PI * 9;
        M4.compose(new T.Vector3(Math.cos(ba) * rr2, by, Math.sin(ba) * rr2), Q.identity(), V3.set(1, 1, 1)); bulbM.setMatrixAt(i, M4);
        bulbC.push(new T.Color(BC[i % BC.length])); bulbM.setColorAt(i, C.setHex(0x221a20));
      }
      bulbM.instanceMatrix.needsUpdate = true; inner.add(bulbM);
      var shape = new T.Shape();
      for (var s = 0; s < 10; s++) { var ang = Math.PI / 2 + s * Math.PI / 5, rr = s % 2 ? 0.21 : 0.5, x = Math.cos(ang) * rr, yy = Math.sin(ang) * rr; if (s) shape.lineTo(x, yy); else shape.moveTo(x, yy); }
      var starMat = new T.MeshStandardMaterial({ color: 0x8a6a10, emissive: 0xffd84a, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.25 });
      var sgeo = new T.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); sgeo.center();
      var star = new T.Mesh(sgeo, starMat); star.position.set(0, 5.0, 0); inner.add(star);
      var starGlow = k.glow(BRAND.y, 4.2); starGlow.position.set(0, 5.0, 0.2); starGlow.material.opacity = 0; inner.add(starGlow);
      [[1.2, 0.9, 0xff3d7f, 0xffe08a, 0.55], [-1.3, 0.7, 0x5c05e5, 0xf1d627, 0.6], [0.4, 1.6, 0xf1d627, 0xff3d7f, 0.48], [-0.6, 1.5, 0x2fbc29, 0xfff4d0, 0.5], [1.6, -0.2, 0x1ec8ff, 0xffffff, 0.42], [-1.8, -0.4, 0xff8a2a, 0x5c05e5, 0.45], [0.9, 1.9, 0xffffff, 0xff3d7f, 0.36]].forEach(function (p, i) {
        var gf = gift(p[4], p[2], p[3]); gf.position.set(p[0], 0.08, p[1]); gf.rotation.y = i * 0.7; inner.add(gf);
      });
      var treeLight = new T.PointLight(0xffd27a, 0, 14, 2); treeLight.position.set(0, 2.5, 1.5); inner.add(treeLight);
      var halo = k.glow(BRAND.warm, 9); halo.position.y = 2.6; halo.material.opacity = 0; inner.add(halo);
      var ring = new T.Mesh(new T.RingGeometry(2.6, 2.9, 64), new T.MeshBasicMaterial({ color: BRAND.g, transparent: true, opacity: 0, side: T.DoubleSide, fog: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.3; g.add(ring);
      var burst = k.glow(BRAND.y, 10); burst.position.y = 3; burst.material.opacity = 0; g.add(burst);
      // звери выходят к ёлке, когда подарки доставлены
      // праздничные звери (Flow 18.11: жираф в колпаке, слон с гирляндой, зебра в шарфе, лев с подарком); нет файла — спрайты бренда
      var crew = [['gen/giraffe-hat.png', 'sprites/giraffe.webp', 2.7, 1.9, -0.6], ['gen/elephant-lights.png', 'sprites/elephant.webp', 1.9, -2.4, -0.2],
        ['gen/zebra-scarf.png', 'sprites/zebra.webp', 1.35, 2.3, 1.1], ['gen/lion-gift.png', 'sprites/lion.webp', 1.3, -1.6, 1.4]].map(function (c) {
        var b = art(S.base + c[0], S.base + c[1], c[2]); b.position.set(c[3], 0.1, c[4]); b.visible = false; inner.add(b); return b;
      });
      return { g: g, inner: inner, star: starMat, starMesh: star, starGlow: starGlow, bulbM: bulbM, bulbC: bulbC, light: treeLight, halo: halo, ring: ring, burst: burst, crew: crew, lit: 0, target: 0, hover: 0, cheer: 0, h: 5.6, summit: true };
    }

    // ---------- персонажи: настоящие PNG бренда ----------
    S.base = '../../jumanza/assets/';
    var jeep = art(S.base + 'gen/jeep-gifts.png', S.base + 'safari-4x4.png', 1.55); scene.add(jeep); // джип с подарками (Flow)
    var jeepTo = new T.Vector3(); S.jeepTo = jeepTo;
    var bc0 = R.camps[R.order[0]], baseP = onSlope(bc0[0], bc0[1], bc0[2]);
    jeep.position.copy(baseP).add(new T.Vector3(2.2, 0, 1.2)); jeepTo.copy(jeep.position);
    var lion = k.billboard(S.base + 'sprites/lion.webp', 1.7); lion.position.copy(baseP).add(new T.Vector3(-2.3, 0, 0.9)); scene.add(lion);
    // звери на равнине: жираф и зебры у водопоя, слон справа — передний план по краям
    [['sprites/giraffe.webp', 4.2, -15, 38], ['sprites/zebra.webp', 1.7, -23.5, 41], ['sprites/elephant.webp', 3.0, 16, 30], ['sprites/zebra.webp', 1.9, 11, 33]].forEach(function (a) {
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
        o.fire.rotation.y = -c[0]; // пламя ядро ставит лицом к камере по повороту родителя: снимаем поворот лагеря
      }
      scene.add(o.g);
      var openIt = function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); };
      o.lab = k.label(o.g, [0, o.h + 0.6, 0], '', openIt);
      k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
      o.id = L.id; S.camps[L.id] = o;
      return o;
    };

    // ---------- анимация ----------
    var cTmp = new T.Color(), DARK = new T.Color(0x241a2a);
    k.onFrame(function (t, dt) {
      S.t = t;
      clouds.forEach(function (c) { c.s.position.x = c.x0 + Math.sin(t * 0.04 + c.ph) * 2.5; });
      cap1.position.x = Math.sin(t * 0.05) * 0.8; cap2.position.x = 2 + Math.sin(t * 0.07 + 1) * 1.2;
      segs.forEach(function (sg) {
        var on = S.camps[sg.to] && S.camps[sg.to].target ? 1 : 0;
        sg.lit += (on - sg.lit) * Math.min(1, dt * 2);
        sg.mat.emissiveIntensity = sg.lit * 0.9;
        sg.mat.color.copy(trailCol).lerp(trailLit, sg.lit * 0.6);
        sg.dots.forEach(function (d, i) { d.material.opacity = sg.lit * (0.45 + 0.3 * Math.sin(t * 3 + i)); });
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
          var open = o.open ? 0.35 + 0.25 * Math.sin(t * 2.4) : 0.1;
          o.star.emissiveIntensity = o.lit * 2.4 + (1 - o.lit) * open * 1.4;
          o.starMesh.rotation.y = Math.sin(t * 0.6) * 0.35;
          o.starGlow.material.opacity = Math.min(1, o.lit * 0.9 + (1 - o.lit) * open * 0.6);
          o.starGlow.scale.setScalar(4.2 + Math.sin(t * 2) * 0.3);
          o.light.intensity = o.lit * 2.2;
          o.halo.material.opacity = o.lit * (0.35 + 0.08 * Math.sin(t * 1.7));
          for (var bi = 0; bi < o.bulbC.length; bi++) { var tw = o.lit * (0.65 + 0.35 * Math.sin(t * 4 + bi * 1.7)); o.bulbM.setColorAt(bi, cTmp.copy(DARK).lerp(o.bulbC[bi], tw).multiplyScalar(1 + tw * 0.6)); }
          o.bulbM.instanceColor.needsUpdate = true;
          o.crew.forEach(function (b) { b.visible = o.lit > 0.5; });
          return;
        }
        var act = o.state === 'active' ? 0.55 + 0.3 * Math.sin(t * 9 + o.g.position.y) : 0;
        var f = Math.max(o.lit, act);
        o.flame.visible = f > 0.03; o.flame.material.uniforms.uI.value = f * 0.95;
        o.flame.scale.set(0.5, 0.8 + 0.12 * Math.sin(t * 7 + o.g.position.x), 1);
        o.fireGlow.material.opacity = f * (0.5 + 0.12 * Math.sin(t * 11));
        o.light.intensity = f * (1.3 + 0.25 * Math.sin(t * 13 + o.g.position.x));
        o.door.emissiveIntensity = o.lit * 1.3;
        o.tent.emissiveIntensity = o.lit * 0.08;
        o.flagMat.emissiveIntensity = o.lit * 0.55;
        // флаг развевается
        var fp = o.flagGeo.attributes.position;
        for (var vi = 0; vi < fp.count; vi++) { var fx = fp.getX(vi); fp.setZ(vi, Math.sin(t * 3.2 - fx * 7 + o.g.position.y) * 0.07 * (fx / 0.72)); }
        fp.needsUpdate = true;
        // искры костра
        o.embers.material.opacity = f * 0.9;
        if (f > 0.03) { for (var ei = 0; ei < o.ev.length; ei++) { var E1 = o.ev[ei]; E1.y += dt * 0.6 * E1.s; if (E1.y > 1) { E1.y = 0; E1.x = (Math.random() - 0.5) * 0.3; E1.z = (Math.random() - 0.5) * 0.3; } o.ep[ei * 3] = E1.x + Math.sin(t * 2 + ei) * 0.05 * E1.y; o.ep[ei * 3 + 1] = 0.2 + E1.y * 1.3; o.ep[ei * 3 + 2] = E1.z; } o.embers.geometry.attributes.position.needsUpdate = true; }
        o.bulbs.forEach(function (b, i) { var tw = o.lit * (0.7 + 0.3 * Math.sin(t * 3.5 + i * 1.3)); b.m.color.copy(DARK).lerp(b.c, tw).multiplyScalar(1 + tw * 0.5); });
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
