/**
 * 3D-ёлка Infinity Garland (NoLimitCoins) на ядре _3d/ny3d.js — ПРЕМИУМ (уровень зала Witching Hours, 16.11).
 * Тот же интерфейс, что у 2D tree.js:
 *   Tree3D.render(box, levels, { current, onOpen(levelId, level) })  — первый вызов строит сцену, дальше только обновляет
 *   Tree3D.supported()                                               — есть ли WebGL (иначе страница рисует 2D GarlandTree)
 * Сцена: ночная площадь городка, брусчатка в снегу, вокруг ёлки — каток-зеркало. Огромная пушистая ёлка из 6 ярусов
 * (1 — верхушка), ветки — InstancedMesh, снег на лапах, зеркальные шары. Каждый ярус — уровень: гирлянда яруса горит,
 * когда он пройден. Над ёлкой золотая звезда ∞ (лемниската); горит — вокруг ёлки неоновые кольца. Слева Coiny (PNG
 * из утверждённого арта), тренировочный шар на золотой арке, кованые фонари с живым огнём, подарки в фольге и с ∞.
 * Небо — нарисованная панорама: звёзды, неоновые ленты, зарево у горизонта. ?ny3d=lit — всё пройдено.
 */
(function () {
  'use strict';
  var C = { gold: 0xfdc010, blue: 0x00b4eb, pink: 0xeb1f6a, purple: 0x8b3bd1, warm: 0xffc46b };
  var BULBS = [C.gold, C.blue, C.pink, C.purple];
  var CAM = { pos: [0, 4.3, 18.2], look: [0, 5.2, 0] };       // широкий блок: ниже, ёлка героем
  var CAM_TALL = { pos: [0, 4.4, 21.5], look: [0, 5.6, 0] };  // телефон: ёлка крупно + Coiny впереди (см. S.layout)

  function frame(a) {
    var t = Math.max(0, Math.min(1, (1.9 - a) / 1.0));
    function mix(p, q) { return p.map(function (v, i) { return v + (q[i] - v) * t; }); }
    return { t: t, pos: mix(CAM.pos, CAM_TALL.pos), look: mix(CAM.look, CAM_TALL.look), fov: 42 + 13 * t, zoom: Math.max(0.8, Math.min(1, a / 0.7)) };
  }

  function supported() { return !!(window.NY3D && window.THREE && NY3D.supported()); }

  function css() {
    if (document.getElementById('t3d-css')) return;
    var s = document.createElement('style'); s.id = 't3d-css';
    s.textContent =
      '.t3d{height:clamp(520px,86vh,980px);margin:0 0 18px;border-radius:14px;background:#05061c}' +
      '.t3d .ny3d-label{font:900 13px/1.05 "Work Sans",system-ui,sans-serif;font-style:italic;letter-spacing:-.01em;color:#F2F1FA;' +
      'background:rgba(12,13,40,.8);border:1px solid rgba(0,180,235,.45);border-radius:999px;padding:5px 12px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;backdrop-filter:blur(4px)}' +
      '.t3d .ny3d-label small{font:600 10.5px/1 "Work Sans",system-ui,sans-serif;font-style:normal;color:rgba(242,241,250,.66)}' +
      '.t3d .ny3d-label.lit{border-color:#FDC010;box-shadow:0 0 14px rgba(253,192,16,.4)} .t3d .ny3d-label.lit small{color:#FDC010}' +
      '.t3d .ny3d-label.ready{border-color:#00B4EB} .t3d .ny3d-label.ready small{color:#00B4EB}' +
      '.t3d .ny3d-label.locked{opacity:.6}' +
      '.t3d .ny3d-label.cur{background:#FDC010;color:#0C0D13;border-color:#FFE27A} .t3d .ny3d-label.cur small{color:#0C0D13}' +
      '.t3d .ny3d-label.star{font-size:15px;padding:6px 14px 7px}' +
      '.t3d .ny3d-label:focus-visible{outline:2px solid #00B4EB;outline-offset:2px}' +
      '.t3d-title{position:absolute;left:0;top:0;padding:18px 22px;pointer-events:none;z-index:2}' +
      '.t3d-title h1{text-shadow:none;filter:drop-shadow(0 2px 14px rgba(0,0,0,.6))}' +
      '.t3d-vignette{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:inherit;background:radial-gradient(ellipse 78% 74% at 50% 46%,rgba(0,0,0,0) 56%,rgba(3,2,16,.6) 100%)}' +
      '.t3d-note{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:2;margin:0;max-width:calc(100% - 32px);text-align:center;' +
      'font:600 13px/1.35 "Work Sans",system-ui,sans-serif;color:#F2F1FA;background:rgba(12,13,40,.78);border:1px solid rgba(253,192,16,.35);border-radius:999px;padding:7px 14px;pointer-events:none}' +
      '@media (max-width:600px){.t3d .ny3d-label{font-size:11.5px;padding:4px 9px 5px}.t3d .ny3d-label small{font-size:9.5px}.t3d-title{padding:14px 16px}.t3d-note{font-size:12px;border-radius:12px}}';
    document.head.appendChild(s);
  }

  var when = function (ms) { return new Date(ms).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }); };
  function stOf(L) { return L.status === 'lit' ? 'lit' : (L.can && L.can.ok) || L.status === 'active' ? 'open' : 'locked'; }
  function status(L) {
    if (L.status === 'lit') return 'lit';
    if (L.status === 'expired') return 'dark';
    if (L.status === 'active') return 'in progress';
    var c = L.can || { ok: true };
    if (c.ok) return 'ready';
    if (c.error === 'need_tiers') return c.need + ' more ' + (c.need === 1 ? 'tier' : 'tiers');
    if (c.error === 'not_open') return c.opensAt ? 'opens ' + when(c.opensAt) : 'soon';
    if (c.error === 'closed') return 'lights out';
    return '';
  }

  // ======================================================================================================
  function build(box) {
    var k = NY3D.create(box, {
      premium: true, bg: 0x05061c, fogExp: [0x0b0c30, 0.017],
      env: [0x621b99, 0xfdc010, 0xfff0d8, 0x1a2a6a, 0x0a0820], // зал WH: слева, справа, сверху, сзади, пол
      cam: { pos: CAM.pos, look: CAM.look, fov: 42 }, designAspect: 1.9, minZoom: 0.5, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, TAU = Math.PI * 2;
    var S = { k: k, objs: {}, litN: 0, starLit: false };
    S.look = function (pos, target, sec) { k.look(pos, target, sec); };
    function rand(a, b) { return a + Math.random() * (b - a); }
    var PHYS = !!T.MeshPhysicalMaterial;

    // ---------- материалы (как в зале WH) ----------
    var gold = new T.MeshStandardMaterial({ color: 0xe0b04a, metalness: 0.95, roughness: 0.24, envMapIntensity: 1.5 });
    var goldGlow = new T.MeshStandardMaterial({ color: 0xe0b04a, metalness: 0.9, roughness: 0.3, emissive: 0xffc040, emissiveIntensity: 0.5 });
    var iron = new T.MeshStandardMaterial({ color: 0x17141f, metalness: 0.75, roughness: 0.4, envMapIntensity: 0.9 });
    var snowTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#e8ebfa'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 5000; i++) { var v = 205 + Math.random() * 50 | 0; g.fillStyle = 'rgba(' + v + ',' + (v + 3) + ',255,.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    snowTex.wrapS = snowTex.wrapT = T.RepeatWrapping;
    var sparkTex = k.tex(256, 256, function (g, w, h) { // блёстки снега: светятся через bloom только точками
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + rand(0.5, 1).toFixed(2) + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); }
    });
    sparkTex.wrapS = sparkTex.wrapT = T.RepeatWrapping;
    var snowMat = new T.MeshStandardMaterial({ color: 0xd8dcf6, map: snowTex, roughness: 0.88, metalness: 0, emissive: 0xc8ccff, emissiveMap: sparkTex, emissiveIntensity: 0.2 });
    var snowSoft = new T.MeshStandardMaterial({ color: 0x585e8e, roughness: 1, metalness: 0 }); // 19.11: ещё на ступень темнее — шапки на ёлке выгорали под bloom // AG 18.11: шапки ещё пересвечивались // снег на лапах: темнее, чтобы bloom не выжигал ёлку
    var dotTex = k.tex(64, 64, function (g, w) {
      var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.85)'); gr.addColorStop(0.5, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
    });

    // ---------- геометрия с фасками (как в F7) ----------
    function rrect(w, h, r) {
      var s = new T.Shape(), x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
    }
    function bevelBox(w, h, d, r, mat) {
      var g = new T.ExtrudeGeometry(rrect(w - 2 * r, h - 2 * r, r * 0.6), { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 6 });
      g.translate(0, 0, -(d - 2 * r) / 2); return new T.Mesh(g, mat);
    }
    function lathe(profile, seg, mat) { return new T.Mesh(new T.LatheGeometry(profile.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 24), mat); }

    // ---------- небо: нарисованная панорама (звёзды, неоновые ленты, зарево, силуэт городка) ----------
    var skyTex = k.tex(2048, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#02031a'); gr.addColorStop(0.38, '#0a0e46'); gr.addColorStop(0.62, '#241468'); gr.addColorStop(0.76, '#5a1c78'); gr.addColorStop(0.8, '#1a0c3a'); gr.addColorStop(1, '#0a0620');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      [[0.5, '235,31,106', 0.32], [0.18, '0,180,235', 0.16], [0.82, '139,59,209', 0.22]].forEach(function (p) { // зарево у горизонта
        var hg = g.createRadialGradient(w * p[0], h * 0.8, 0, w * p[0], h * 0.8, w * 0.3); hg.addColorStop(0, 'rgba(' + p[1] + ',' + p[2] + ')'); hg.addColorStop(1, 'rgba(' + p[1] + ',0)');
        g.fillStyle = hg; g.fillRect(0, 0, w, h);
      });
      for (var i = 0; i < 1700; i++) { // звёзды
        var x = Math.random() * w, y = Math.pow(Math.random(), 1.4) * h * 0.74, big = Math.random() < 0.05, r = big ? rand(1.2, 2.1) : rand(0.35, 1);
        g.fillStyle = 'rgba(' + (230 + Math.random() * 25 | 0) + ',' + (230 + Math.random() * 25 | 0) + ',255,' + rand(0.35, 1).toFixed(2) + ')';
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
        if (big) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.moveTo(x, y - 6); g.lineTo(x, y + 6); g.stroke(); }
      }
      [['#00b4eb', 0.4, 0.0, 0.07], ['#8b3bd1', 0.47, 1.7, 0.09], ['#eb1f6a', 0.55, 3.1, 0.06]].forEach(function (p) { // неоновые ленты
        function path() { g.beginPath(); for (var x = 0; x <= w; x += 6) { var y = h * p[1] + Math.sin(x / w * TAU * 2 + p[2]) * h * p[3] + Math.sin(x / w * TAU * 5 + p[2] * 2) * h * 0.015; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
        g.strokeStyle = p[0]; g.shadowColor = p[0]; g.shadowBlur = 34; g.globalAlpha = 0.35; g.lineWidth = 12; path();
        g.shadowBlur = 12; g.globalAlpha = 0.85; g.lineWidth = 3; path();
        g.strokeStyle = '#ffffff'; g.globalAlpha = 0.5; g.lineWidth = 1; g.shadowBlur = 0; path();
        g.globalAlpha = 1;
      });
      // далёкий городок: силуэты крыш с тёплыми окнами
      g.fillStyle = '#0c0828'; var x0 = 0;
      while (x0 < w) {
        var bw = rand(26, 60), bh = rand(10, 34), base = h * 0.8, roof = rand(6, 16);
        g.beginPath(); g.moveTo(x0, base); g.lineTo(x0, base - bh); g.lineTo(x0 + bw / 2, base - bh - roof); g.lineTo(x0 + bw, base - bh); g.lineTo(x0 + bw, base); g.fill();
        for (var wi = 0; wi < 3; wi++) if (Math.random() < 0.55) { g.fillStyle = 'rgba(255,196,107,' + rand(0.4, 0.9).toFixed(2) + ')'; g.fillRect(x0 + rand(4, bw - 8), base - bh + rand(3, bh - 6), 2.5, 3); g.fillStyle = '#0c0828'; }
        x0 += bw + rand(-6, 4);
      }
    });
    var pano = k.panorama({ texture: skyTex, r: 75, h: 96, span: 3.9, y0: -12, z: -4, repeat: 1 });
    // ---------- сгенерированная графика (../../nolimitcoins/assets/gen, 18.11): пока не загрузилась или нет файла — процедурная ----------
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
    // фактура из картинки, у которой цвет задают сами объекты (хвоя — по ярусу/инстансу): приглушённая и светлая
    function detailTex(url, filter, cb) {
      k.image(url, function (t, img) {
        var c = document.createElement('canvas'); c.width = img.width; c.height = img.height; var g = c.getContext('2d');
        g.filter = filter; g.drawImage(img, 0, 0);
        var d = new T.CanvasTexture(c); d.wrapS = d.wrapT = T.RepeatWrapping; d.anisotropy = k.aniso; cb(d);
      });
    }
    // нарисованное небо с лентами: 2 повтора по дуге, сдвиг 0.5 — швы на ±¼ дуги, за краем кадра
    genTex('../../nolimitcoins/assets/gen/sky-ribbons.jpg', function (c) { c.wrapS = T.RepeatWrapping; c.repeat.set(2, 1); c.offset.x = 0.5; pano.material.map = c; pano.material.needsUpdate = true; });
    // мерцающие звёзды поверх панорамы
    var starN = 260, sp = new Float32Array(starN * 3);
    for (var si = 0; si < starN; si++) { var sa = Math.PI + (Math.random() - 0.5) * 3.4, sel = 0.16 + Math.random() * 0.75, SR = 64; sp[si * 3] = Math.sin(sa) * Math.cos(sel) * SR; sp[si * 3 + 1] = Math.sin(sel) * SR * 0.6 + 6; sp[si * 3 + 2] = Math.cos(sa) * Math.cos(sel) * SR - 4; }
    var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    var twinkle = new T.PointsMaterial({ color: 0xf0eeff, size: 0.55, map: dotTex, transparent: true, opacity: 0.9, fog: false, depthWrite: false, blending: T.AdditiveBlending });
    scene.add(new T.Points(sg, twinkle));

    // ---------- свет (схема зала WH: тёплый ключ, фиолетовый контровой, голубой/золотой по бокам) ----------
    scene.add(new T.HemisphereLight(0x4a4ab8, 0x0a0618, 0.55));
    var key = new T.SpotLight(0xffe2b8, 1.9, 44, 0.5, 0.6, 1.2); key.position.set(3, 15, 15); key.target.position.set(0, 4.5, 0); scene.add(key, key.target);
    var back = new T.PointLight(C.purple, 1.6, 30, 1.6); back.position.set(0, 8, -7); scene.add(back);
    var sideL = new T.PointLight(C.blue, 1.0, 20, 1.6); sideL.position.set(-9, 4, 5); scene.add(sideL);
    var sideR = new T.PointLight(C.gold, 0.85, 20, 1.6); sideR.position.set(9, 4, 5); scene.add(sideR);
    var moon = new T.DirectionalLight(0x9aa8ff, 0.3); moon.position.set(-10, 20, 12); scene.add(moon);
    var treeLight = new T.PointLight(C.gold, 0, 26, 2); treeLight.position.set(0, 5, 6); scene.add(treeLight);
    var starLight = new T.PointLight(C.gold, 0, 30, 2); starLight.position.set(0, 10.5, 2.5); scene.add(starLight);

    // ---------- брусчатка в снегу ----------
    var cobTex = k.tex(512, 512, function (g, w, h) {
      g.fillStyle = '#c9cdee'; g.fillRect(0, 0, w, h); // снег в швах
      var rh = 34;
      for (var r = 0; r * rh < h; r++) {
        var off = (r % 2) * 22, x = -off;
        while (x < w) {
          var sw = rand(36, 54), l = 18 + Math.random() * 14 | 0;
          g.fillStyle = 'hsl(' + (232 + Math.random() * 22 | 0) + ',' + (14 + Math.random() * 12 | 0) + '%,' + l + '%)';
          var x1 = x + 3, y1 = r * rh + 3, ww = sw - 6, hh = rh - 6, rr = 7;
          g.beginPath(); g.moveTo(x1 + rr, y1); g.arcTo(x1 + ww, y1, x1 + ww, y1 + hh, rr); g.arcTo(x1 + ww, y1 + hh, x1, y1 + hh, rr); g.arcTo(x1, y1 + hh, x1, y1, rr); g.arcTo(x1, y1, x1 + ww, y1, rr); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1 + rr, y1 + 1.5); g.lineTo(x1 + ww - rr, y1 + 1.5); g.stroke();
          x += sw;
        }
      }
      for (var s = 0; s < 70; s++) { // снежные заносы
        var cx = Math.random() * w, cy = Math.random() * h, cr = rand(14, 46), gr = g.createRadialGradient(cx, cy, 0, cx, cy, cr);
        gr.addColorStop(0, 'rgba(236,238,255,.9)'); gr.addColorStop(1, 'rgba(236,238,255,0)'); g.fillStyle = gr; g.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
      }
    }, HQ);
    cobTex.wrapS = cobTex.wrapT = T.RepeatWrapping; cobTex.repeat.set(26, 26);
    var ground = new T.Mesh(new T.PlaneGeometry(180, 180), new T.MeshStandardMaterial({ map: cobTex, color: 0xb4b8e6, roughness: 0.78, metalness: 0.05 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = -20; scene.add(ground);
    genTex('../../nolimitcoins/assets/gen/cobble-snow.jpg', function (c) { c.wrapS = c.wrapT = T.RepeatWrapping; c.repeat.set(30, 30); ground.material.map = c; ground.material.color.setHex(0xc4c8ee); ground.material.needsUpdate = true; });

    // ---------- каток-зеркало вокруг ёлки ----------
    var RIN = 3.4, ROUT = 9.4;
    var iceTex = k.tex(512, 512, function (g, w, h) {
      g.clearRect(0, 0, w, h); g.lineCap = 'round';
      for (var i = 0; i < 90; i++) { // следы коньков — дуги
        var cx = Math.random() * w, cy = Math.random() * h, r = rand(60, 260), a0 = Math.random() * TAU;
        g.strokeStyle = 'rgba(255,255,255,' + rand(0.05, 0.22).toFixed(2) + ')'; g.lineWidth = rand(0.6, 1.8);
        g.beginPath(); g.arc(cx, cy, r, a0, a0 + rand(0.3, 1.1)); g.stroke();
      }
    }, HQ);
    var ice = new T.Mesh(new T.RingGeometry(RIN, ROUT, 120, 1), new T.MeshStandardMaterial({ color: 0x4a58b0, transparent: true, opacity: 0.32, roughness: 0.06, metalness: 0.2, emissive: 0xdde2ff, emissiveMap: iceTex, emissiveIntensity: 0.45, depthWrite: false }));
    ice.rotation.x = -Math.PI / 2; ice.position.y = 0.014; scene.add(ice);
    var reflector = k.mirror(new T.RingGeometry(RIN, ROUT, 120, 1), { color: 0x8088c8, hide: [ice] });
    if (reflector) { reflector.rotation.x = -Math.PI / 2; reflector.position.y = 0.006; scene.add(reflector); }
    else { ice.material.opacity = 0.85; ice.material.color.set(0x2a3480); }
    // снежные бортики катка и пригорок под ёлкой (комья — один InstancedMesh)
    var lumpGeo = new T.SphereGeometry(1, 12, 8), LM = [], M4 = new T.Matrix4(), Q = new T.Quaternion(), SC = new T.Vector3(), PO = new T.Vector3(), E = new T.Euler();
    function lumpRing(R, n, s) { for (var i = 0; i < n; i++) { var a = i / n * TAU + rand(-0.03, 0.03); PO.set(Math.cos(a) * R, 0.02, Math.sin(a) * R); Q.setFromEuler(E.set(0, -a, 0)); SC.set(s * rand(0.5, 0.8), s * rand(0.22, 0.36), s * rand(0.9, 1.3)); M4.compose(PO, Q, SC); LM.push(M4.clone()); } }
    lumpRing(ROUT + 0.25, 92, 0.75); lumpRing(RIN - 0.05, 36, 0.5);
    for (var dd = 0; dd < 26; dd++) { var da = dd / 26 * TAU, drr = 12 + Math.random() * 5; PO.set(Math.cos(da) * drr * 1.25, 0, Math.sin(da) * drr * 0.75 - 2); if (PO.z > 5) continue; Q.identity(); SC.set(rand(1.4, 2.8), rand(0.3, 0.6), rand(1, 1.8)); M4.compose(PO, Q, SC); LM.push(M4.clone()); }
    var lumps = new T.InstancedMesh(lumpGeo, snowMat, LM.length); LM.forEach(function (m, i) { lumps.setMatrixAt(i, m); }); scene.add(lumps);
    var mound = new T.Mesh(new T.CylinderGeometry(RIN, RIN + 0.25, 0.22, 64), snowMat); mound.position.y = 0.1; scene.add(mound);

    // ---------- дома городка: фасады со штукатуркой, крыши со снегом, окна со шторами, гирлянды, дымоходы ----------
    var plasterTex = k.tex(256, 256, function (g, w, h) {
      g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 7000; i++) { var v = 170 + Math.random() * 70 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.25)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    });
    plasterTex.wrapS = plasterTex.wrapT = T.RepeatWrapping;
    var brickTex = k.tex(128, 128, function (g, w, h) {
      g.fillStyle = '#4a2a2a'; g.fillRect(0, 0, w, h);
      for (var r = 0; r < 8; r++) for (var c = -1; c < 4; c++) { g.fillStyle = 'hsl(' + (4 + Math.random() * 10 | 0) + ',45%,' + (30 + Math.random() * 12 | 0) + '%)'; g.fillRect(c * 32 + (r % 2) * 16 + 2, r * 16 + 2, 28, 12); }
    });
    function drawWindow(cur) {
      return function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, h * 0.7);
        gr.addColorStop(0, '#e89a48'); gr.addColorStop(0.55, '#b8602a'); gr.addColorStop(1, '#5a2414'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,214,140,.85)'; g.beginPath(); g.arc(w * 0.5, h * 0.3, 6, 0, TAU); g.fill(); // лампа в комнате
        [-1, 1].forEach(function (sd) { // шторы, подхваченные к краям
          var x0 = sd < 0 ? 0 : w, xin = sd < 0 ? w * 0.24 : w * 0.76, xt = sd < 0 ? w * 0.1 : w * 0.9;
          var cg = g.createLinearGradient(x0, 0, xin, 0); cg.addColorStop(0, cur); cg.addColorStop(0.6, cur); cg.addColorStop(1, 'rgba(0,0,0,.45)');
          g.fillStyle = cg; g.beginPath(); g.moveTo(x0, 0); g.lineTo(xin, 0); g.quadraticCurveTo(xin * 0.9 + x0 * 0.1, h * 0.35, xt, h * 0.56); g.quadraticCurveTo(xt, h * 0.8, x0 + sd * -0.01, h); g.lineTo(x0, h); g.fill();
          g.fillStyle = '#ffd36a'; g.fillRect(xt - 3, h * 0.55, 6, 4);
        });
        g.fillStyle = cur; g.fillRect(0, 0, w, h * 0.09); // ламбрекен
        g.fillStyle = '#2a2236'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(0, h * 0.5 - 3, w, 6); // переплёт
      };
    }
    var winMats = ['#c8285a', '#7a3ad0', '#2a8ab0'].map(function (c) {
      var t = k.tex(96, 128, drawWindow(c), HQ);
      return new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.3 });
    });
    var frameMat = new T.MeshStandardMaterial({ color: 0xf1eadb, roughness: 0.55 });
    var slate = new T.MeshStandardMaterial({ color: 0x2b2445, roughness: 0.7, metalness: 0.1 });
    var brick = new T.MeshStandardMaterial({ color: 0xffffff, map: brickTex, roughness: 0.9 });
    var stone = new T.MeshStandardMaterial({ color: 0x3a3650, roughness: 0.85 });
    var doorMat = new T.MeshStandardMaterial({ color: 0x3a1430, roughness: 0.45, metalness: 0.1 });
    var wreathMat = new T.MeshStandardMaterial({ color: 0x0e6a3a, roughness: 0.8 });
    var bowMat = new T.MeshStandardMaterial({ color: 0xc8143a, roughness: 0.35, metalness: 0.2 });
    var FAC = [0x5b3a8c, 0x2f4a9a, 0x7a3a7a, 0x2e5c8a, 0x6a4aa0, 0x3a3a8a, 0x8a4a6a, 0x4a3a9a];
    var smokeTex = k.tex(64, 64, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(200,200,230,.55)'); gr.addColorStop(1, 'rgba(200,200,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    var smokes = [], garls = [];
    // боковые стены домов: фасад с окнами из графики facade-windows.jpg (batch 2) — спереди окна уже объёмные, поэтому только бока;
    // цвет фасада тонируется цветом дома, окна чуть светятся. Нет файла — бока штукатурные, как были
    var sideUses = [];
    genTex('../../nolimitcoins/assets/gen/facade-windows.jpg', function (c) {
      sideUses.forEach(function (u) { var t = c.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, u.rep); u.m.map = t; u.m.emissiveMap = t; u.m.needsUpdate = true; u.mesh.forEach(function (ms) { ms.visible = true; }); });
    });
    function house(x, z, ry, w, h, v) {
      var g = new T.Group(), D = 3.4, P = 0.62, hw = w / 2 + 0.35, L = hw / Math.cos(P), rise = hw * Math.tan(P);
      var wallMat = new T.MeshStandardMaterial({ color: FAC[v % FAC.length], map: plasterTex, roughness: 0.88 });
      var body = bevelBox(w, h, D, 0.06, wallMat); body.position.y = h / 2; g.add(body);
      var sideMat = new T.MeshStandardMaterial({ color: new T.Color(FAC[v % FAC.length]).lerp(new T.Color(0xffffff), 0.45), roughness: 0.8, emissive: 0xffd6a0, emissiveIntensity: 0.2 });
      var sideU = { m: sideMat, rep: (h - 0.6) / (D - 0.2), mesh: [] };
      [-1, 1].forEach(function (sd) { var sm2 = new T.Mesh(new T.PlaneGeometry(D - 0.2, h - 0.6), sideMat); sm2.rotation.y = sd * Math.PI / 2; sm2.position.set(sd * (w / 2 + 0.008), (h - 0.6) / 2 + 0.45, 0); sm2.visible = false; g.add(sm2); sideU.mesh.push(sm2); });
      sideUses.push(sideU);
      var plinth = bevelBox(w + 0.14, 0.42, D + 0.14, 0.04, stone); plinth.position.y = 0.21; g.add(plinth);
      var tri = new T.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, (w / 2) * Math.tan(P)); tri.closePath();
      var gab = new T.Mesh(new T.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }), wallMat); gab.position.set(0, h, -D / 2); g.add(gab);
      [-1, 1].forEach(function (sd) {
        var slab = new T.Mesh(new T.BoxGeometry(L + 0.1, 0.16, D + 0.7), slate); slab.rotation.z = -sd * P; slab.position.set(sd * hw / 2, h + rise / 2 + 0.06, 0); g.add(slab);
        var sn = new T.Mesh(new T.BoxGeometry(L + 0.06, 0.2, D + 0.78), snowMat); sn.rotation.z = -sd * P; sn.position.set(sd * hw / 2 + sd * Math.sin(P) * 0.17, h + rise / 2 + 0.06 + Math.cos(P) * 0.17, 0); g.add(sn);
        var lip = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, D + 0.78, 8), snowMat); lip.rotation.x = Math.PI / 2; lip.position.set(sd * (hw + 0.02), h + 0.12, 0); g.add(lip);
      });
      var ridge = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, D + 0.8, 10), snowMat); ridge.rotation.x = Math.PI / 2; ridge.position.set(0, h + rise + 0.24, 0); g.add(ridge);
      // окна: нижний ряд — по краям (в центре дверь), выше — сетка
      var fz = D / 2, cols = Math.max(2, Math.round(w / 1.45)), ww = 0.62, wh = 0.86, wins = [];
      wins.push([-w * 0.3, 1.3], [w * 0.3, 1.3]);
      for (var y = 2.8; y < h - 0.5; y += 1.45) for (var c = 0; c < cols; c++) wins.push([-w / 2 + (c + 0.5) * (w / cols), y]);
      wins.forEach(function (p, i) {
        if ((i * 7 + v * 3) % 6 === 5) return; // часть окон тёмные — так живее
        var fr = bevelBox(ww + 0.16, wh + 0.16, 0.1, 0.03, frameMat); fr.position.set(p[0], p[1], fz + 0.02); g.add(fr);
        var gl = new T.Mesh(new T.PlaneGeometry(ww, wh), winMats[(i + v) % 3]); gl.position.set(p[0], p[1], fz + 0.08); g.add(gl);
        var sill = new T.Mesh(new T.BoxGeometry(ww + 0.3, 0.07, 0.2), frameMat); sill.position.set(p[0], p[1] - wh / 2 - 0.1, fz + 0.12); g.add(sill);
        var ss = new T.Mesh(new T.BoxGeometry(ww + 0.26, 0.07, 0.18), snowMat); ss.position.set(p[0], p[1] - wh / 2 - 0.04, fz + 0.12); g.add(ss);
      });
      var attic = new T.Mesh(new T.CircleGeometry(0.3, 24), winMats[v % 3]); attic.position.set(0, h + rise * 0.42, fz + 0.02); g.add(attic);
      var aring = new T.Mesh(new T.TorusGeometry(0.32, 0.05, 8, 28), frameMat); aring.position.copy(attic.position); g.add(aring);
      // дверь, венок, фонарик над дверью
      var door = bevelBox(0.92, 1.7, 0.14, 0.04, doorMat); door.position.set(0, 1.27, fz + 0.03); g.add(door);
      var wreath = new T.Mesh(new T.TorusGeometry(0.2, 0.07, 8, 18), wreathMat); wreath.position.set(0, 1.62, fz + 0.14); g.add(wreath);
      var bow = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), bowMat); bow.position.set(0, 1.42, fz + 0.18); g.add(bow);
      var dl = k.glow(C.warm, 1.4); dl.position.set(0, 2.35, fz + 0.3); dl.material.opacity = 0.5; g.add(dl);
      // дымоход и дым
      var cx = (v % 2 ? 1 : -1) * w * 0.24, yRoof = h + (hw - Math.abs(cx)) * Math.tan(P);
      var chim = bevelBox(0.55, 1.3, 0.55, 0.04, brick); chim.position.set(cx, yRoof + 0.35, -0.5); g.add(chim);
      var cap = new T.Mesh(new T.BoxGeometry(0.66, 0.14, 0.66), snowMat); cap.position.set(cx, yRoof + 1.06, -0.5); g.add(cap);
      for (var si2 = 0; si2 < 4; si2++) { var sm = new T.Sprite(new T.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 })); sm.position.set(cx, yRoof + 1.2, -0.5); g.add(sm); smokes.push({ s: sm, x: cx, y0: yRoof + 1.2, ph: si2 / 4 + Math.random() * 0.1 }); }
      // гирлянда по фронтону и по низу крыши
      var gp = [], gc = [], col = new T.Color();
      for (var b = 0; b <= 28; b++) {
        var tt = b / 28, xs = -hw + tt * hw * 2, ys = h + 0.04 + (hw - Math.abs(xs)) * Math.tan(P) - 0.06 * Math.sin(tt * Math.PI * 7) ** 2;
        gp.push(xs, ys, fz + 0.4); col.setHex(BULBS[b % 4]); gc.push(col.r, col.g, col.b);
      }
      for (var e = 0; e <= 10; e++) { var xe = -w / 2 + 0.2 + (w - 0.4) * e / 10; gp.push(xe, h - 0.12 - 0.08 * Math.sin(e / 10 * Math.PI * 5) ** 2, fz + 0.06); col.setHex(BULBS[(e + 2) % 4]); gc.push(col.r, col.g, col.b); }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(gp, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(gc, 3));
      var gm = new T.PointsMaterial({ size: 0.3, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
      g.add(new T.Points(geo, gm)); garls.push({ m: gm, ph: v * 1.7 });
      g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    }
    [[-15, -9, 0.55, 4.6, 4.2], [-19.5, -2.5, 0.95, 4.2, 3.4], [-10.5, -15, 0.25, 5, 5], [15, -9, -0.55, 4.6, 4.6], [19.5, -2.5, -0.95, 4.2, 3.6], [10.5, -15, -0.25, 5.2, 5.4], [-3.5, -22, 0, 5, 6.2], [3.8, -23, 0, 4.4, 5.2]]
      .forEach(function (p, i) { house(p[0], p[1], p[2], p[3], p[4], i); });
    // дальний городок за домами: town-backdrop.png (batch 2, зелёная кайма снята despill 19.11) — три полосы дугой,
    // кроп по крышам (без пустых полей картинки), низ уходит в снег. Нет файла — за домами только небо, как было
    genTex('../../nolimitcoins/assets/gen/town-backdrop.png', function (c) {
      c.repeat.set((1272 - 82) / 1376, (646 - 312) / 768); c.offset.set(82 / 1376, 1 - 646 / 768);
      var W2 = 30, H2 = W2 * (646 - 312) / (1272 - 82);
      [[0, -40, 0], [-27, -33, 0.62], [27, -33, -0.62]].forEach(function (q, j) {
        var t = j ? c.clone() : c; if (j) t.needsUpdate = true;
        if (j === 2) { t.wrapS = T.RepeatWrapping; t.repeat.x = -t.repeat.x; t.offset.x = 1272 / 1376; } // зеркально — не повторяется на глаз
        var m = new T.Mesh(new T.PlaneGeometry(W2, H2), new T.MeshBasicMaterial({ map: t, color: 0x8c86bc, transparent: true, alphaTest: 0.06, depthWrite: false, fog: false }));
        m.position.set(q[0], H2 / 2 - 0.5, q[1]); m.rotation.y = q[2]; m.renderOrder = -1; scene.add(m);
      });
    });

    // ---------- пушистые ели (ветки и снег на лапах — общие InstancedMesh) ----------
    var brGeo = new T.ConeGeometry(0.16, 1.0, 5); brGeo.translate(0, 0.5, 0); // основание у ствола, кончик наружу
    var UPV = new T.Vector3(0, 1, 0), DIR = new T.Vector3();
    var needleMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.05, flatShading: true });
    // хвоя из графики (pine-snow) как зерно веток: цвет по-прежнему от инстанса и яруса (тёмный → сочный при свете)
    var needleUses = [needleMat];
    detailTex('../../nolimitcoins/assets/gen/pine-snow.jpg', 'saturate(0.25) brightness(1.55) contrast(1.1)', function (d) {
      d.repeat.set(1.5, 2);
      needleUses.forEach(function (m) { m.map = d; m.needsUpdate = true; });
    });
    var coreMat = new T.MeshStandardMaterial({ color: 0x04241a, roughness: 0.9 });
    var PB = [], PBC = [], PS = [];
    // кладёт ветки конуса: ось x,z, низ y0, высота H, радиус у низа R; out — куда класть; col — базовый цвет хвои
    function branchCone(x, z, y0, H, R, levels, density, out, cols, snows, col, Rt) {
      for (var lv = 0; lv < levels; lv++) {
        var fy = lv / (levels - 1), ly = y0 + fy * H, lr = R * (1 - fy) + (Rt || 0.08) * fy, nb = Math.max(5, Math.round(TAU * lr / density));
        for (var b = 0; b < nb; b++) {
          var ab = b / nb * TAU + lv * 0.45 + rand(-0.12, 0.12);
          DIR.set(Math.cos(ab), -0.34 - fy * 0.12 + rand(-0.08, 0.08), Math.sin(ab)).normalize();
          Q.setFromUnitVectors(UPV, DIR); PO.set(x + Math.cos(ab) * lr * 0.22, ly, z + Math.sin(ab) * lr * 0.22);
          var len = lr * rand(0.82, 1.08) + 0.22, th = rand(0.9, 1.3) * (0.7 + (1 - fy) * 0.6) * Math.max(0.6, R / 3);
          SC.set(th, len, th); M4.compose(PO, Q, SC); out.push(M4.clone());
          cols.push(new T.Color(col).multiplyScalar(rand(0.7, 1.3)));
          if (snows && Math.random() < 0.3) { // снег на лапе: лепёшка сверху у кончика
            var tip = PO.clone().addScaledVector(DIR, len * 0.62); tip.y += 0.06;
            Q.setFromEuler(E.set(0, -ab, 0)); SC.set(len * 0.2, 0.045 + len * 0.02, 0.08 + len * 0.04); M4.compose(tip, Q, SC); snows.push(M4.clone());
          }
        }
      }
    }
    [[-12, 1, 1.3], [-9, -5, 1.1], [12.5, 0.5, 1.4], [9.5, -5.5, 1.05], [-22, -12, 1.8], [22, -12, 1.7], [-7, -12, 1.2], [7.5, -13, 1.3], [-14.5, 6, 1.1], [14.5, 6.5, 1.2]]
      .forEach(function (p) {
        var s = p[2], cm = new T.Mesh(new T.ConeGeometry(0.9 * s, 3.6 * s, 10), coreMat); cm.position.set(p[0], 2.2 * s, p[1]); scene.add(cm);
        branchCone(p[0], p[1], 0.5 * s, 3.3 * s, 1.5 * s, 8, 0.5, PB, PBC, PS, 0x0c5a3c);
      });
    var pineBr = new T.InstancedMesh(brGeo, needleMat, PB.length); PB.forEach(function (m, i) { pineBr.setMatrixAt(i, m); pineBr.setColorAt(i, PBC[i]); }); scene.add(pineBr);

    k.snow({ n: 1200, area: [46, 24, 40], center: [0, 0, -4], speed: 0.9, size: 0.16 });

    // ---------- ёлка: 6 пушистых ярусов ----------
    var bark = new T.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.9 });
    var trunk = new T.Mesh(new T.CylinderGeometry(0.5, 0.72, 1.6, 12), bark); trunk.position.y = 0.8; scene.add(trunk);
    var tree = new T.Group(); scene.add(tree);
    var ballGeo = new T.SphereGeometry(0.18, 22, 16), capGeo = new T.CylinderGeometry(0.05, 0.05, 0.07, 10);
    var ballMats = [gold].concat([C.blue, C.pink, C.purple, 0xe8e8f6].map(function (c) { return new T.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.1, envMapIntensity: 1.7 }); }));
    var bulbGeo = new T.SphereGeometry(0.11, 12, 8);
    var TS = []; // снег на лапах большой ёлки (общий InstancedMesh)
    function tier(n) { // n: 1 — верхушка … 6 — низ
      var i = 6 - n, rb = 4.4 - i * 0.55, rt = rb * 0.42, hh = 1.9, y0 = 1.05 + i * 1.28;
      var g = new T.Group(), inner = new T.Group(); g.add(inner); g.position.y = y0;
      function rAt(f) { return rb - (rb - rt) * f; }
      var core = new T.Mesh(new T.CylinderGeometry(rt * 0.72, rb * 0.72, hh, 18, 1, true), coreMat); core.position.y = hh / 2; inner.add(core);
      // хвоя: цвет яруса = множитель к цвету веток (тёмный → сочный, когда ярус горит)
      var mat = new T.MeshStandardMaterial({ color: 0x7c8a9c, roughness: 0.78, metalness: 0.05, flatShading: true, emissive: 0x3a2a08, emissiveIntensity: 0 });
      var dark = new T.Color(0x7c8a9c), bright = new T.Color(0xffffff);
      needleUses.push(mat); if (needleMat.map) { mat.map = needleMat.map; }
      var arr = [], cols = [], snows = [];
      branchCone(0, 0, 0.12, hh * 0.92, rb, 5, 0.34, arr, cols, snows, [0x0e6a3e, 0x10703f, 0x0d6a40, 0x117446, 0x0e6c3c, 0x107242][i], rt * 0.85);
      var br = new T.InstancedMesh(brGeo, mat, arr.length); arr.forEach(function (m, j) { br.setMatrixAt(j, m); br.setColorAt(j, cols[j]); }); inner.add(br);
      snows.forEach(function (m) { TS.push(new T.Matrix4().makeTranslation(0, y0, 0).multiply(m)); });
      // зеркальные шары
      for (var q = 0; q < 5 + i; q++) {
        var f = rand(0.2, 0.75), a = q / (5 + i) * TAU + rand(-0.25, 0.25), r = rAt(f) + 0.12;
        var ball = new T.Mesh(ballGeo, ballMats[(q + n) % ballMats.length]); ball.position.set(Math.cos(a) * r, hh * f - 0.12, Math.sin(a) * r); ball.scale.setScalar(rand(0.85, 1.25)); inner.add(ball);
        var cp = new T.Mesh(capGeo, gold); cp.position.copy(ball.position); cp.position.y += 0.19 * ball.scale.x; inner.add(cp);
      }
      // гирлянда-петля: провисающие «фестоны» по кончикам веток
      var nb = 16 + i * 4, bulbs = [], pts = [], swag = 5 + i;
      for (var b = 0; b <= nb * 3; b++) {
        var u = b / (nb * 3), an = u * TAU, yy = 0.42 + Math.abs(Math.sin(u * Math.PI * swag)) * 0.38 - 0.38;
        var rad = rAt((yy + 0.38) / hh) + 0.26;
        pts.push(new T.Vector3(Math.cos(an) * rad, 0.38 + yy, Math.sin(an) * rad));
      }
      var curve = new T.CatmullRomCurve3(pts, true);
      var wireMat = new T.MeshStandardMaterial({ color: 0x2a2440, emissive: C.gold, emissiveIntensity: 0, roughness: 0.5, metalness: 0.4 });
      inner.add(new T.Mesh(new T.TubeGeometry(curve, nb * 6, 0.024, 5, true), wireMat));
      for (var qb = 0; qb < nb; qb++) {
        var col = BULBS[(qb + n) % 4], p = curve.getPointAt((qb + 0.5) / nb);
        var bm = new T.MeshStandardMaterial({ color: 0x2a2a48, emissive: col, emissiveIntensity: 0, roughness: 0.3 });
        var mesh = new T.Mesh(bulbGeo, bm); mesh.position.copy(p); inner.add(mesh);
        var gl = k.glow(col, 0.5); gl.position.copy(p); gl.material.opacity = 0; inner.add(gl);
        bulbs.push({ m: bm, gl: gl, i: qb, a: Math.atan2(p.z, p.x) });
      }
      // кольцо «текущий ярус» — неоновая трубка
      var ring = new T.Mesh(new T.TorusGeometry(rb + 0.42, 0.045, 8, 72), new T.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0, fog: false }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.14; g.add(ring);
      tree.add(g);
      return { g: g, inner: inner, mat: mat, dark: dark, bright: bright, wire: wireMat, bulbs: bulbs, ring: ring, lit: 0, target: 0, chase: 0, hover: 0, labelAt: [(n % 2 ? -1 : 1) * rAt(0.42) * 0.62, hh * 0.42, rAt(0.42) * 0.82 + 0.75], n: n }; // ёлочкой слева/справа, не колонной по стволу (AG 18.11)
    }
    // снег на лапах большой ёлки создаётся после ярусов (см. S.place → ensureTreeSnow)
    var treeSnow = null;
    function ensureTreeSnow() {
      if (treeSnow || !TS.length) return;
      treeSnow = new T.InstancedMesh(lumpGeo, snowSoft, TS.length); TS.forEach(function (m, i) { treeSnow.setMatrixAt(i, m); }); tree.add(treeSnow);
      var ps = new T.InstancedMesh(lumpGeo, snowSoft, PS.length); PS.forEach(function (m, i) { ps.setMatrixAt(i, m); }); scene.add(ps);
    }

    // ---------- звезда ∞: объёмное золото с сильным свечением, неоновые кольца ----------
    function starObj() {
      var g = new T.Group(); g.position.set(0, 10.35, 0.1);
      var pts = [];
      for (var s = 0; s < 160; s++) { var t = s / 160 * TAU, den = 1 + Math.sin(t) * Math.sin(t); pts.push(new T.Vector3(1.12 * Math.cos(t) / den, 1.12 * Math.sin(t) * Math.cos(t) / den, 0.14 * Math.sin(t))); }
      var curve = new T.CatmullRomCurve3(pts, true);
      var mat = new T.MeshStandardMaterial({ color: 0xffc840, emissive: C.gold, emissiveIntensity: 0, metalness: 0.95, roughness: 0.2, envMapIntensity: 1.7 });
      g.add(new T.Mesh(new T.TubeGeometry(curve, 220, 0.2, 14, true), mat));
      var fin = lathe([[0, -1.45], [0.1, -1.4], [0.13, -1.25], [0.06, -1.05], [0.09, -0.9], [0.05, -0.7], [0.03, -0.55], [0, -0.5]], 20, gold); g.add(fin); // золотой шпиль
      var gl = k.glow(C.gold, 3.8); gl.material.opacity = 0; g.add(gl);
      var halo = k.glow(C.gold, 8); halo.material.opacity = 0; g.add(halo);
      var spk = new T.BufferGeometry(), sa = new Float32Array(90 * 3);
      for (var q = 0; q < 90; q++) { var aa = Math.random() * TAU, rr = rand(1.2, 2.6); sa[q * 3] = Math.cos(aa) * rr; sa[q * 3 + 1] = Math.sin(aa) * rr * 0.7; sa[q * 3 + 2] = rand(-0.6, 0.6); }
      spk.setAttribute('position', new T.BufferAttribute(sa, 3));
      var spMat = new T.PointsMaterial({ size: 0.16, map: dotTex, color: 0xffe08a, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
      var sparks = new T.Points(spk, spMat); g.add(sparks);
      var rings = [[C.pink, 6.4, 0.35, 0.2, 6.6], [C.blue, 5.8, -0.3, 1.9, 5.2], [C.purple, 7.0, 0.2, 3.6, 3.4]].map(function (r) {
        var m = new T.Mesh(new T.TorusGeometry(r[1], 0.055, 8, 160, 4.4), new T.MeshBasicMaterial({ color: r[0], transparent: true, opacity: 0, fog: false, depthWrite: false }));
        m.rotation.set(Math.PI / 2 + r[2], 0, r[3]); m.position.y = r[4]; scene.add(m);
        var soft = new T.Mesh(new T.TorusGeometry(r[1], 0.2, 8, 160, 4.4), new T.MeshBasicMaterial({ color: r[0], transparent: true, opacity: 0, fog: false, blending: T.AdditiveBlending, depthWrite: false }));
        m.add(soft);
        return { m: m, soft: soft, sp: 0.12 + Math.random() * 0.1 };
      });
      scene.add(g);
      return { g: g, inner: g, mat: mat, glow: gl, halo: halo, spark: spMat, sparks: sparks, rings: rings, bulbs: [], lit: 0, target: 0, chase: 0, hover: 0, labelAt: [0, 1.35, 0], star: true };
    }

    // ---------- тренировочный шар на золотой арке ----------
    function baubleObj() {
      var g = new T.Group(); g.position.set(-8.6, 0, 1.8);
      var base = lathe([[0, 0], [0.42, 0], [0.42, 0.08], [0.32, 0.14], [0.3, 0.24], [0.18, 0.3], [0.14, 0.42], [0, 0.42]], 28, gold); g.add(base);
      var post = lathe([[0.1, 0.4], [0.12, 0.6], [0.08, 0.75], [0.08, 4.1], [0.12, 4.2], [0.06, 4.3], [0, 4.32]], 20, gold); g.add(post);
      [1.2, 2.6].forEach(function (y) { var c = new T.Mesh(new T.TorusGeometry(0.12, 0.035, 8, 20), gold); c.rotation.x = Math.PI / 2; c.position.y = y; g.add(c); });
      // арка-крюк с завитком
      var hook = new T.CatmullRomCurve3([[0, 4.25, 0], [0.25, 4.75, 0], [0.75, 4.95, 0], [1.25, 4.75, 0], [1.42, 4.4, 0], [1.4, 4.2, 0]].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
      g.add(new T.Mesh(new T.TubeGeometry(hook, 40, 0.06, 10, false), gold));
      var curl = new T.Mesh(new T.TorusGeometry(0.16, 0.04, 8, 20, Math.PI * 1.6), gold); curl.position.set(0.3, 4.55, 0); curl.rotation.z = 1.2; g.add(curl);
      var hang = new T.Group(); hang.position.set(1.4, 3.1, 0); g.add(hang);
      var str = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.42, 4), gold); str.position.y = 0.9; hang.add(str);
      var mat = PHYS ? new T.MeshPhysicalMaterial({ color: C.purple, emissive: C.purple, emissiveIntensity: 0.05, metalness: 0.55, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6 })
        : new T.MeshStandardMaterial({ color: C.purple, emissive: C.purple, emissiveIntensity: 0.05, metalness: 0.55, roughness: 0.12 });
      var ball = new T.Mesh(new T.SphereGeometry(0.62, 40, 28), mat); hang.add(ball);
      var capm = lathe([[0, 0.55], [0.2, 0.56], [0.22, 0.62], [0.18, 0.72], [0, 0.74]], 20, gold); hang.add(capm);
      var loop = new T.Mesh(new T.TorusGeometry(0.07, 0.02, 6, 16), gold); loop.position.y = 0.8; hang.add(loop);
      [0, Math.PI / 2].forEach(function (rz) { var band = new T.Mesh(new T.TorusGeometry(0.625, 0.03, 8, 48), goldGlow); band.rotation.set(Math.PI / 2, 0, 0); band.rotation.y = rz; if (rz) band.rotation.set(0, 0, 0); hang.add(band); });
      var gl = k.glow(C.purple, 2.4); gl.position.copy(hang.position); gl.material.opacity = 0; g.add(gl);
      var ring = new T.Mesh(new T.TorusGeometry(1.25, 0.04, 8, 48), new T.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(0.7, 0.05, 0); g.add(ring);
      scene.add(g);
      return { g: g, inner: g, mat: mat, glow: gl, ring: ring, ball: hang, bulbs: [], lit: 0, target: 0, chase: 0, hover: 0, labelAt: [1.4, 2.05, 0.4], bauble: true };
    }

    // ---------- кованые фонари с живым огнём ----------
    var glassMat = new T.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffb050, emissiveIntensity: 0.9, transparent: true, opacity: 0.75, roughness: 0.15 });
    var FLAME = [[0.55, 0.12, 0.02], [1.0, 0.62, 0.18], [1.0, 0.95, 0.75]];
    function lamp(x, z) {
      var g = new T.Group(); g.position.set(x, 0, z);
      g.add(lathe([[0, 0], [0.32, 0], [0.32, 0.1], [0.22, 0.18], [0.2, 0.4], [0.12, 0.5], [0.09, 0.7], [0, 0.7]], 16, iron));
      var post = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 3.0, 10), iron); post.position.y = 2.1; g.add(post);
      [1.3, 3.2].forEach(function (y) { var c = new T.Mesh(new T.TorusGeometry(0.1, 0.03, 6, 16), iron); c.rotation.x = Math.PI / 2; c.position.y = y; g.add(c); });
      var arm = new T.CatmullRomCurve3([[0, 3.5, 0], [0.18, 3.78, 0], [0.5, 3.82, 0], [0.7, 3.62, 0]].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
      g.add(new T.Mesh(new T.TubeGeometry(arm, 20, 0.032, 6, false), iron));
      var curl = new T.Mesh(new T.TorusGeometry(0.13, 0.025, 6, 16, Math.PI * 1.5), iron); curl.position.set(0.22, 3.38, 0); g.add(curl);
      var lan = new T.Group(); lan.position.set(0.7, 3.12, 0); g.add(lan);
      var glass = new T.Mesh(new T.BoxGeometry(0.3, 0.4, 0.3), glassMat); lan.add(glass);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { var e = new T.Mesh(new T.BoxGeometry(0.035, 0.44, 0.035), iron); e.position.set(c[0] * 0.15, 0, c[1] * 0.15); lan.add(e); });
      var roof = new T.Mesh(new T.ConeGeometry(0.26, 0.24, 4), iron); roof.rotation.y = Math.PI / 4; roof.position.y = 0.32; lan.add(roof);
      var rsn = new T.Mesh(new T.ConeGeometry(0.22, 0.1, 4), snowMat); rsn.rotation.y = Math.PI / 4; rsn.position.y = 0.4; lan.add(rsn);
      var bot = new T.Mesh(new T.BoxGeometry(0.34, 0.05, 0.34), iron); bot.position.y = -0.22; lan.add(bot);
      var fl = k.flame(FLAME, 0.9); fl.scale.set(0.11, 0.2, 1); fl.position.y = -0.14; lan.add(fl);
      var gl = k.glow(0xffb860, 2.4); gl.material.opacity = 0.45; lan.add(gl);
      g.rotation.y = Math.atan2(-x, -z) - Math.PI / 2; // рука фонаря — к ёлке
      scene.add(g);
    }
    [[-11.4, 5.2], [11.4, 5.2], [-9.2, -7.2], [9.2, -7.2]].forEach(function (p) { lamp(p[0], p[1]); });

    // ---------- подарки: фольга и бумага с ∞, атласные ленты, банты ----------
    function paperTex(bg, fg) {
      var t = k.tex(256, 256, function (g, w) {
        g.fillStyle = bg; g.fillRect(0, 0, w, w); g.strokeStyle = fg; g.lineWidth = 3; g.lineCap = 'round';
        for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) { // ∞ узором
          var cx = c * 64 + (r % 2) * 32 + 16, cy = r * 64 + 32;
          g.beginPath(); for (var s = 0; s <= 40; s++) { var t2 = s / 40 * TAU, d = 1 + Math.sin(t2) * Math.sin(t2), x = cx + 14 * Math.cos(t2) / d, y = cy + 14 * Math.sin(t2) * Math.cos(t2) / d; if (s) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
        }
      });
      return t;
    }
    var giftMats = [
      new T.MeshStandardMaterial({ map: paperTex('#c8155a', '#ffd04a'), roughness: 0.5 }),
      new T.MeshStandardMaterial({ map: paperTex('#0a7ab8', '#ffe08a'), roughness: 0.5 }),
      new T.MeshStandardMaterial({ map: paperTex('#5a1c9a', '#ffc840'), roughness: 0.5 }),
      new T.MeshStandardMaterial({ color: 0xffc23a, metalness: 0.75, roughness: 0.22, envMapIntensity: 1.5 }), // фольга
      new T.MeshStandardMaterial({ color: 0x14a8e8, metalness: 0.7, roughness: 0.2, envMapIntensity: 1.5 }),
      new T.MeshStandardMaterial({ color: 0xe0247a, metalness: 0.7, roughness: 0.2, envMapIntensity: 1.5 }),
    ];
    var satin = [C.gold, 0xf2f2ff, C.pink, C.blue].map(function (c) { return new T.MeshStandardMaterial({ color: c, metalness: 0.45, roughness: 0.26, envMapIntensity: 1.4 }); });
    function gift(x, z, s, v, ry) {
      var g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      var hh = s * 0.85, rb = satin[(v + 1) % satin.length], m = giftMats[v % giftMats.length];
      var bx = bevelBox(s, hh, s, Math.min(0.05, s * 0.06), m); bx.position.y = hh / 2; g.add(bx);
      [[s + 0.02, hh + 0.02, s * 0.13], [s * 0.13, hh + 0.02, s + 0.02]].forEach(function (r) { var q = new T.Mesh(new T.BoxGeometry(r[0], r[1], r[2]), rb); q.position.y = hh / 2; g.add(q); });
      [-0.6, 0.6].forEach(function (a) { var lp = new T.Mesh(new T.TorusGeometry(s * 0.16, s * 0.045, 10, 24), rb); lp.position.set(Math.sin(a) * s * 0.13, hh + s * 0.11, 0); lp.rotation.set(0, Math.PI / 2, a * 1.4); lp.scale.set(1, 0.8, 1); g.add(lp); });
      [-0.5, 0.5].forEach(function (a) { var tl = new T.Mesh(new T.BoxGeometry(s * 0.09, s * 0.32, 0.015), rb); tl.position.set(Math.sin(a) * s * 0.14, hh + s * 0.02, s * 0.08); tl.rotation.z = a * 1.2; g.add(tl); });
      var knot = new T.Mesh(new T.SphereGeometry(s * 0.065, 12, 8), rb); knot.position.y = hh + s * 0.04; g.add(knot);
    }
    [[5.4, 3.4, 1.15, 0, 0.3], [6.7, 2.4, 0.9, 1, -0.4], [6.1, 4.6, 0.75, 3, 0.8], [7.6, 3.9, 1.0, 2, 0.1], [5.0, 5.2, 0.6, 4, -0.7], [8.3, 2.0, 0.7, 5, 0.5],
      [2.4, 2.4, 0.8, 4, 0.2], [-2.3, 2.5, 0.7, 3, -0.3], [2.9, 1.0, 0.6, 2, 0.9], [-2.9, 1.2, 0.85, 0, 0.4], [1.0, 2.9, 0.55, 5, -0.2]]
      .forEach(function (p) { gift(p[0], p[1], p[2], p[3], p[4]); });
    // фиолетовая бумага с золотыми ∞ из графики giftwrap-infinity.jpg (batch 2); UV у bevelBox — в мировых единицах
    genTex('../../nolimitcoins/assets/gen/giftwrap-infinity.jpg', function (c) { c.wrapS = c.wrapT = T.RepeatWrapping; c.repeat.set(0.75, 0.75); giftMats[2].map = c; giftMats[2].roughness = 0.32; giftMats[2].metalness = 0.3; giftMats[2].envMapIntensity = 1.3; giftMats[2].needsUpdate = true; });

    // ---------- Coiny (PNG из утверждённого арта 04) ----------
    // Coiny: машет с гирляндой (gen, без каймы старой вырезки); когда звезда горит — празднует (coiny-cheer)
    var coiny = genBoard('../../nolimitcoins/assets/gen/coiny-wave.png', '../../nolimitcoins/assets/coiny-wave.png', 3.1);
    coiny.position.set(-4.1, 0, 6.2); scene.add(coiny);
    var coinyCheer = k.billboard('../../nolimitcoins/assets/gen/coiny-cheer.png', 3.2); coinyCheer.visible = false; scene.add(coinyCheer);
    var cheerOk = false; (function () { var pr = new Image(); pr.onload = function () { cheerOk = true; }; pr.src = '../../nolimitcoins/assets/gen/coiny-cheer.png'; })();
    var coinyGlow = k.glow(C.purple, 3.4); coinyGlow.position.set(0, 1.4, -0.3); coinyGlow.material.opacity = 0.3; coiny.add(coinyGlow);

    // ---------- виньетка (кино) ----------
    if (!box.querySelector('.t3d-vignette')) { var vig = document.createElement('div'); vig.className = 't3d-vignette'; box.appendChild(vig); }

    // ---------- уровни → объекты ----------
    S.place = function (L) {
      var o = S.objs[L.id];
      if (o) return o;
      o = L.id === 'star' ? starObj() : L.id === 'practice' ? baubleObj() : tier(L.n || +String(L.id).replace(/\D/g, '') || 1);
      var openIt = function () { if (S.onOpen) S.onOpen(L.id, S.levels.find(function (x) { return x.id === L.id; })); };
      o.lab = k.label(o.g, o.labelAt, '', openIt);
      if (o.star) o.lab.cls('star', true);
      k.pick(o.g, openIt, function (on) { o.hover = on ? 1 : 0; });
      o.id = L.id; S.objs[L.id] = o;
      return o;
    };
    S.ensureSnow = ensureTreeSnow;

    // ---------- анимация ----------
    k.onFrame(function (t, dt) {
      var tierLit = 0;
      Object.keys(S.objs).forEach(function (id) {
        var o = S.objs[id], cur = S.current === id;
        o.lit += (o.target - o.lit) * Math.min(1, dt * 2.2);
        o.chase = Math.max(0, o.chase - dt * 0.45);
        var sc = 1 + o.hover * 0.025; o.inner.scale.x += (sc - o.inner.scale.x) * 0.2; o.inner.scale.z = o.inner.scale.x;
        if (o.ring) o.ring.material.opacity += ((cur ? 0.95 : o.hover ? 0.45 : 0) - o.ring.material.opacity) * Math.min(1, dt * 6);
        if (o.star) {
          var open = o.state === 'open';
          o.mat.emissiveIntensity = o.lit * 1.8 + (open ? 0.16 + 0.12 * Math.sin(t * 2.4) : 0.02) + (cur || o.hover ? 0.25 : 0);
          o.glow.material.opacity = Math.min(1, o.lit * 0.6 + (open ? 0.08 + 0.05 * Math.sin(t * 2.4) : 0));
          o.halo.material.opacity = o.lit * 0.3;
          o.spark.opacity = o.lit * (0.6 + 0.3 * Math.sin(t * 3)); o.sparks.rotation.z = t * 0.15;
          o.g.rotation.y = Math.sin(t * 0.6) * 0.25;
          starLight.intensity = o.lit * 1.1;
          o.rings.forEach(function (r, i) { r.m.rotation.z += dt * r.sp * (i % 2 ? -1 : 1); r.m.material.opacity = o.lit * 0.95; r.soft.material.opacity = o.lit * 0.18; });
          return;
        }
        if (o.bauble) {
          o.mat.emissiveIntensity = 0.05 + o.lit * 0.6 + (o.state === 'open' ? 0.1 + 0.07 * Math.sin(t * 2) : 0);
          o.glow.material.opacity = o.lit * 0.55 + (o.state === 'open' ? 0.12 : 0);
          o.ball.position.x = 1.4 + Math.sin(t * 1.2) * 0.05; o.glow.position.x = o.ball.position.x;
          return;
        }
        if (o.state === 'lit') tierLit++;
        // тёмный ярус — приглушённая холодная хвоя; зажжённый — сочная, с тёплым отсветом гирлянды
        o.mat.color.copy(o.dark).lerp(o.bright, o.lit);
        o.mat.emissiveIntensity = o.lit * 0.25;
        o.wire.emissiveIntensity = o.lit * 0.6;
        var n = o.bulbs.length, run = (t * 0.35) % 1; // «ищущий» огонёк по открытому ярусу
        o.bulbs.forEach(function (b) {
          var on;
          if (o.chase > 0) on = ((1 - o.chase) * 1.5 * n > b.i) ? 1 : 0.1;
          else on = o.lit * (0.72 + 0.28 * Math.sin(t * 2.4 + b.i * 1.1));
          if (o.lit < 0.5 && !o.chase) {
            if (o.state === 'active') on = Math.max(on, b.i % 3 === 0 ? 0.5 : 0);
            else if (o.state === 'open') { var dd = Math.abs(b.i / n - run); dd = Math.min(dd, 1 - dd); on = Math.max(on, dd < 0.03 ? 0.8 : 0); }
          }
          b.m.emissiveIntensity = on * 1.5;
          b.gl.material.opacity = on * 0.22; // ореол лампы даёт bloom; спрайт только подкрашивает

        });
      });
      treeLight.intensity = tierLit / 6 * 0.7;
      coinyGlow.material.opacity = 0.26 + 0.08 * Math.sin(t * 2);
      var cheer = cheerOk && S.objs.star && S.objs.star.state === 'lit';
      coinyCheer.visible = cheer; coiny.children[0].visible = !cheer && coiny.children[0].material.map != null;
      if (cheer) { // телефон: руки вверх задевали подпись Practice и левый край — правее и чуть меньше (19.11)
        var tallC = S.frame && S.frame.t > 0.88;
        coinyCheer.position.copy(coiny.position); if (tallC) coinyCheer.position.x += 0.8;
        coinyCheer.scale.setScalar(tallC ? 0.85 : 1);
      }
      twinkle.opacity = 0.7 + 0.25 * Math.sin(t * 1.7);
      garls.forEach(function (gg) { gg.m.opacity = 0.7 + 0.3 * Math.sin(t * 2.2 + gg.ph); });
      smokes.forEach(function (sm) { // дым из труб: поднимается, расширяется и тает
        var u = (t * 0.12 + sm.ph) % 1; sm.s.position.set(sm.x + Math.sin(u * 3 + sm.ph * 6) * 0.25 + u * 0.5, sm.y0 + u * 2.6, -0.5);
        var s2 = 0.5 + u * 1.6; sm.s.scale.set(s2, s2, 1); sm.s.material.opacity = Math.sin(u * Math.PI) * 0.45;
      });
    });

    // узкий кадр (телефон): Coiny выходит вперёд на пустой снег внизу, арка с шаром ближе к центру — иначе обрезаны
    S.layout = function () {
      var tall = S.frame && S.frame.t > 0.88; // только телефон (≈ 1:1 у монитора 1920 — ещё широкая раскладка)
      if (tall) coiny.position.set(-1.6, 0, 12.4); else coiny.position.set(-4.1, 0, 6.2);
      var b = S.objs.practice; if (b) { if (tall) b.g.position.set(-5.9, 0, 4.2); else b.g.position.set(-8.6, 0, 1.8); }
    };
    S.k = k;
    k.onResize(function (w, h) {
      var F = frame(w / h), changed = !S.frame || Math.abs(F.t - S.frame.t) > 0.02;
      S.frame = F; S.layout();
      k.camera.fov = F.fov;
      if (F.t > 0) k.camera.zoom = F.zoom;
      k.camera.updateProjectionMatrix();
      if (changed && S.camKey === 'all') S.look(F.pos, F.look, 0.4);
    });
    return S;
  }

  // ======================================================================================================
  function render(box, levels, opts) {
    opts = opts || {};
    var S = box._t3d;
    if (!S) {
      if (!supported()) return window.GarlandTree ? GarlandTree.render(box, levels, opts) : null;
      css();
      box.classList.add('t3d');
      Array.prototype.slice.call(box.children).forEach(function (c) { if (!c.classList.contains('t3d-title')) box.removeChild(c); });
      S = build(box);
      if (!S) { box.classList.remove('t3d'); return window.GarlandTree ? GarlandTree.render(box, levels, opts) : null; }
      box._t3d = S;
      S.note = document.createElement('p'); S.note.className = 't3d-note'; S.note.hidden = true; box.appendChild(S.note);
    }
    if (S.k.debug('lit')) levels = levels.map(function (L) { return Object.assign({}, L, { status: 'lit' }); });
    var prev = S.levels, fresh = !S.objs.practice;
    S.levels = levels; S.onOpen = opts.onOpen; S.current = opts.current || null;
    levels.forEach(function (L) {
      var o = S.place(L), st = stOf(L);
      var was = prev && prev.find(function (x) { return x.id === L.id; });
      if (was && was.status !== 'lit' && L.status === 'lit') o.chase = 1; // только что зажгли — гирлянда бежит
      o.state = st; o.target = st === 'lit' ? 1 : 0;
      var name = L.id === 'star' ? '∞ Infinity Star' : L.id === 'practice' ? 'Practice' : 'Tier ' + (L.n || L.id.replace(/\D/g, ''));
      o.lab.set(name + '<small>' + status(L) + '</small>');
      o.lab.el.setAttribute('aria-label', (L.title || name) + ': ' + status(L));
      o.lab.cls('lit', st === 'lit'); o.lab.cls('locked', st === 'locked'); o.lab.cls('ready', st === 'open'); o.lab.cls('cur', S.current === L.id);
    });
    S.ensureSnow();
    if (fresh) S.layout();
    // подпись под ёлкой: что откроется и когда (как в 2D)
    var star = levels.find(function (l) { return l.id === 'star'; }), note = '';
    var nx = levels.filter(function (l) { return l.status === 'new' && l.can && !l.can.ok && l.can.error === 'not_open'; }).sort(function (a, b) { return a.can.opensAt - b.can.opensAt; })[0];
    if (star && star.status === 'new' && star.can && star.can.error === 'need_tiers') note = 'Light ' + star.can.need + ' more ' + (star.can.need === 1 ? 'tier' : 'tiers') + ' to unlock the Infinity Star.';
    else if (nx) note = (nx.id === 'star' ? 'The Infinity Star' : nx.id === 'practice' ? 'Practice' : 'Next tiers') + ' open ' + when(nx.can.opensAt) + '.';
    S.note.textContent = note; S.note.hidden = !note;

    // камера: к текущему ярусу/звезде/шару, иначе общий план (первый кадр — сразу, без перелёта)
    var cur = S.current && S.objs[S.current], k = S.k, sec = S.started ? 1.5 : 0; S.started = true;
    if (cur) {
      var key = 'cur:' + S.current;
      if (S.camKey !== key) {
        S.camKey = key;
        var wp = new k.T.Vector3(); cur.g.getWorldPosition(wp);
        var tall = S.frame && S.frame.t > 0.5;
        var bx = cur.g.position.x + 1.4;
        if (cur.bauble) S.look([bx + 2.8, 4.4, cur.g.position.z + 9 + (tall ? 4 : 0)], [bx, 2.8, cur.g.position.z], sec);
        else if (cur.star) S.look([0, 9.6, 11 + (tall ? 5 : 0)], [0, 8.8, 0], sec);
        else S.look([0, wp.y + 2.2, 12.5 + (tall ? 5 : 0) + (6 - cur.n) * 0.5], [0, wp.y + 0.7, 0], sec);
      }
    } else if (S.camKey !== 'all') { S.camKey = 'all'; S.look(S.frame.pos, S.frame.look, sec); }
    return S;
  }

  window.Tree3D = { render: render, supported: supported };
})();
