/**
 * 3D-мир The North Star Expedition (Scarlet Sands) на ядре _3d/ny3d.js — ПРЕМИУМ (конвейер зала Witching Hours:
 * линейный вывод, bloom, FogExp2, зеркальная вода, шейдерный огонь, ×2-текстуры). Игра (north-star-game.js) не меняется:
 * сцена — путь экспедиции вокруг неё. Ночь в алых дюнах с инеем, нарисованная панорама неба с Млечным путём и дальними
 * грядами, лагерь как на ключевом арте (палатка с гирляндой, ёлка, костёр, ковёр, исследовательница и кот), тропа к
 * Северной звезде: 6 находок (каменная пирамидка, флаг, латунный фонарь) → оазис (вода-зеркало, пальмы) → Golden Compass.
 * Пройденное загорается: фонарь у находки, золотые следы на тропе, вода оазиса, искры от компаса к звезде.
 *
 *   NorthStar3D.render(box, { expedition: view|null, training: view|null }, { kind, current, onSelect(kind, key) })
 *   NorthStar3D.supported()   — есть ли WebGL (иначе мира нет, игра работает как раньше)
 *   ?ny3d=lit — всё как пройдено (для скриншотов); ?ny3d=nopremium / nobloom / noreflect — сравнение и замеры.
 */
(function () {
  'use strict';
  var B = { crimson: 0xff2058, cta: 0xdb0037, gold: 0xffe229, sand: 0xe4b473, warm: 0xffb45a, night: 0x0b0b20, ice: 0xbfd2ff };
  // тропа: лагерь → находки 1–6 → оазис → компас. [x, z]
  var WAY = { camp: [-1.2, 6.2], s1: [3.6, 1.4], s2: [-3.4, -3.6], s3: [3.9, -8.6], s4: [-3.3, -13.6], s5: [3.4, -18.6], s6: [-2.9, -23.4], oasis: [0.6, -28.6], super: [0, -35.5] };
  var PAWS = { c1: [7.6, -1.4], c2: [-8.8, -8.4], c3: [8.2, -16.2], c4: [-8.4, -20.6] };
  // кадр: от лагеря вдаль к звезде (не «карта сверху»); телефон — выше, чтобы цели разошлись по вертикали
  var CAM = { pos: [0.6, 9.2, 25.5], look: [0.4, 1.4, -15] };
  var CAM_TALL = { pos: [0, 15.5, 21.5], look: [0, 0.2, -14.5] };
  var STAR = [17, 20, -78];

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
      'background:rgba(11,11,32,.78);border:1px solid rgba(228,180,115,.5);border-radius:3px;padding:5px 9px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;backdrop-filter:blur(4px)}' +
      '.scs3d .ny3d-label small{font:500 10.5px/1 "DM Mono",monospace;text-transform:none;letter-spacing:0;color:#B9A58C}' +
      '.scs3d .ny3d-label.lit{border-color:#FFE229;box-shadow:0 0 14px rgba(255,226,41,.35)} .scs3d .ny3d-label.lit small{color:#FFE229}' +
      '.scs3d .ny3d-label.ready{border-color:#FF2058} .scs3d .ny3d-label.ready small{color:#FF6F8F}' +
      '.scs3d .ny3d-label.miss small{color:#9aa6c8}' +
      '.scs3d .ny3d-label.locked{opacity:.6}' +
      '.scs3d .ny3d-label.cur{background:#DB0037;color:#fff;border-color:#FF2058} .scs3d .ny3d-label.cur small{color:#FFE229}' +
      '.scs3d .ny3d-label.paw{padding:3px 7px 4px;font-size:11px}' +
      '.scs3d .ny3d-label:focus-visible{outline:2px solid #FFE229;outline-offset:2px}' +
      // фонари попыток и штамп Found (золото/серебро/бронза)
      '.scs3d .s3l{display:inline-flex;gap:2px;align-items:flex-end}.scs3d .s3l i{display:block;width:10px;height:14px}.scs3d .s3l svg{display:block;width:100%;height:100%}' +
      '.scs3d .s3l i.on{filter:drop-shadow(0 0 3px rgba(255,180,60,.9))}' +
      '.scs3d .s3s{display:inline-block;font:400 9px/1 "Archivo Black",sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8E0026;padding:3px 6px;border:1.5px solid #B3002F;border-radius:2px;transform:rotate(-4deg);box-shadow:inset 0 0 0 1px rgba(255,255,255,.4),0 1px 4px rgba(0,0,0,.45)}' +
      '.scs3d .s3s.gold{background:linear-gradient(135deg,#FFF3B0,#E7B530 45%,#FFE58A 62%,#B8861C)}' +
      '.scs3d .s3s.silver{background:linear-gradient(135deg,#FFFFFF,#BCC4D0 45%,#EEF1F5 62%,#8D96A3)}' +
      '.scs3d .s3s.bronze{background:linear-gradient(135deg,#F6C59A,#B8692F 45%,#E59A5E 62%,#7E4218);color:#5E0018;border-color:#7E0022}' +
      '.scs3d-title{position:absolute;left:0;top:0;padding:16px 18px;pointer-events:none;z-index:2}' +
      '.scs3d-title h1{margin:0;font:400 clamp(1.3rem,3.4vw,2.4rem)/1.05 "Archivo Black",sans-serif;color:#FFE229;text-transform:uppercase;text-shadow:0 2px 18px rgba(0,0,0,.75)}' +
      '.scs3d-title p{margin:6px 0 0;font:500 12px "DM Mono",monospace;color:#F3E6D2;text-shadow:0 1px 8px rgba(0,0,0,.8)}' +
      '.scs3d-all{position:absolute;right:12px;top:12px;z-index:3;background:rgba(11,11,32,.8);color:#E4B473;border:1px solid rgba(228,180,115,.5);border-radius:3px;padding:7px 11px;font:500 11px "DM Mono",monospace;text-transform:uppercase;cursor:pointer}' +
      '.scs3d-all[hidden]{display:none}' +
      '@media (max-width:600px){.scs3d .ny3d-label.paw small{display:none}.scs3d .ny3d-label{font-size:10px;padding:4px 6px}.scs3d .ny3d-label small{font-size:9.5px}.scs3d-title h1{font-size:1.15rem}}';
    document.head.appendChild(s);
  }

  // ---------- рельеф: мягкие гребни дюн, у тропы ровнее, под компасом — высокая дюна ----------
  function pathX(z) {
    var keys = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    for (var i = 0; i < keys.length - 1; i++) {
      var a = WAY[keys[i]], b = WAY[keys[i + 1]];
      if (z <= a[1] && z >= b[1]) { var t = (a[1] - z) / (a[1] - b[1]); t = t * t * (3 - 2 * t); return a[0] + (b[0] - a[0]) * t; }
    }
    return z > WAY.camp[1] ? WAY.camp[0] : 0;
  }
  // гребень дюны: асимметричный профиль (пологий наветренный склон, крутой подветренный) вместо синусов
  function crest(v) { var f = v - Math.floor(v); return f < 0.72 ? Math.pow(f / 0.72, 1.6) : Math.pow((1 - f) / 0.28, 2.2); }
  function H(x, z) {
    var w = x * 0.055 + Math.sin(z * 0.045 + x * 0.02) * 0.9;
    var d = 1.25 * crest(w + z * 0.018) + 0.55 * crest(x * 0.11 - z * 0.07 + 0.4) + 0.22 * Math.sin(x * 0.41 + z * 0.29 + 2.1);
    var off = Math.abs(x - pathX(z)), flat = Math.min(1, Math.max(0, (off - 2.2) / 5));
    flat = flat * flat * (3 - 2 * flat);
    var h = d * (0.14 + 0.86 * flat) + Math.max(0, off - 9) * 0.2;
    var dz = z - WAY.super[1], dx = x - WAY.super[0];
    h += 2.8 * Math.exp(-(dx * dx + dz * dz) / 26);           // дюна компаса
    if (z < -40) h += (-40 - z) * 0.12;                         // дальние гряды (дальше их продолжает панорама)
    var cz = z - WAY.camp[1], cx = x - WAY.camp[0];
    h *= 1 - 0.88 * Math.exp(-(cx * cx + cz * cz) / 34);        // ровная площадка лагеря
    var oz = z - WAY.oasis[1], ox = x - WAY.oasis[0];
    h -= 0.5 * Math.exp(-(ox * ox + oz * oz) / 9);               // чаша оазиса
    return h;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  function build(box) {
    var k = NY3D.create(box, {
      premium: true, bg: 0x070722, fogExp: [0x2a0f2e, 0.0125],
      env: [0xff2058, 0xe4b473, 0xfff0c0, 0x540b2b, 0x30101a], cam: { pos: CAM.pos, look: CAM.look, fov: 44 }, designAspect: 2, minZoom: 0.42, parallax: 0.7,
    });
    if (!k) return null;
    var T = k.T, scene = k.scene, HQ = k.HQ, mobile = k.mobile, S = { k: k, obj: {}, lit: false, t: 0 };
    var TAU = Math.PI * 2;

    // ---------- общие фактуры (как в залах WH: рисунок + тот же рисунок как emissiveMap) ----------
    function speckle(g, W, Hh, n, a) { for (var i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,' + a + ')' : 'rgba(0,0,0,' + a * 3 + ')'; g.fillRect(Math.random() * W, Math.random() * Hh, 2, 2); } }
    // кладка песчаника: ряды блоков со швами, выветренные края, абстрактные резные знаки (без букв)
    function blocks(o) {
      return k.tex(o.w || 256, o.h || 512, function (g, W, Hh) {
        g.fillStyle = o.base; g.fillRect(0, 0, W, Hh); speckle(g, W, Hh, 5000, 0.03);
        var rows = o.rows || 12, cols = o.cols || 3, rh = Hh / rows;
        for (var r = 0; r < rows; r++) {
          var y = r * rh, cw = W / cols, sh = (r % 2) * cw / 2;
          g.fillStyle = 'rgba(0,0,0,' + (0.04 + Math.random() * 0.12).toFixed(2) + ')'; g.fillRect(0, y, W, rh);
          g.fillStyle = 'rgba(255,220,170,' + (0.03 + Math.random() * 0.06).toFixed(2) + ')'; g.fillRect(0, y + 2, W, rh * 0.25);
          g.fillStyle = o.joint; g.fillRect(0, y, W, 2.5);
          for (var c = 0; c <= cols; c++) g.fillRect(c * cw - sh, y, 2.5, rh);
        }
        if (o.glyphs) for (var j = 0; j < o.glyphs; j++) {
          var gx = W * (0.2 + Math.random() * 0.6), gy = Hh * (0.15 + j * 0.7 / o.glyphs) + rh * 0.3;
          g.strokeStyle = 'rgba(30,8,8,.55)'; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.arc(gx, gy, 7, 0, TAU); g.moveTo(gx, gy + 7); g.lineTo(gx, gy + 22); g.moveTo(gx - 9, gy + 13); g.lineTo(gx + 9, gy + 13); g.stroke();
          g.strokeStyle = 'rgba(228,180,115,.45)'; g.lineWidth = 1.2; g.beginPath(); g.arc(gx + 1, gy + 1, 7, 0, TAU); g.stroke();
        }
      }, HQ);
    }
    function stoneMat(tex, rep, tint, glow) {
      if (rep) { tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(rep[0], rep[1]); }
      return new T.MeshStandardMaterial({ map: tex, roughness: 0.86, metalness: 0.04, color: tint || 0xd8b0a0, emissive: 0xb06040, emissiveMap: tex, emissiveIntensity: glow != null ? glow : 0.32 });
    }
    // ---------- сгенерированная графика (../../scarletsands/assets/gen, 18.11): пока не загрузилась или нет файла — процедурная ----------
    // картинка-текстура: своя копия на каждое использование (свой repeat), без sRGB-перекодировки (премиум)
    function genTex(url, cb) { k.image(url, function (t) { var c = t.clone(); c.needsUpdate = true; c.anisotropy = k.aniso; cb(c); }); }
    // персонаж: новый PNG; если файла нет — прежний
    function genBoard(url, fb, height, o, fbHeight) {
      var b = k.billboard(url, height, o), probe = new Image();
      probe.onerror = function () {
        if (!fb) return;
        var fh = fbHeight || height;
        k.image(fb, function (t, img) { var m = b.children[0]; m.material.map = t; m.material.needsUpdate = true; m.scale.set(fh * img.width / img.height, fh, 1); m.position.y = fh / 2; m.visible = true; });
      };
      probe.src = url;
      return b;
    }
    // песчаник: одна картинка на все ориентиры, repeat — по форме предмета
    var stoneUses = [];
    function stoneUse(mat, rx, ry, kind) { stoneUses.push([mat, rx, ry, kind]); return mat; }
    genTex('../../scarletsands/assets/gen/sandstone.jpg', function (t) {
      stoneUses.forEach(function (u) {
        var c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = T.RepeatWrapping; c.repeat.set(u[1], u[2]);
        u[0].map = c; u[0].emissiveMap = c; u[0].color.setHex(0xf4e2d2); u[0].emissiveIntensity = 0.2;
        // пирамиды: большие ровные грани — своя подсветка их «заливала» (на телефоне плоские и бледные);
        // меньше самосвечения и тёплый закатный тон → грани читаются светом и тенью
        if (u[3] === 'pyr') { u[0].color.setHex(0xe9b48e); u[0].emissive.setHex(0x8a3418); u[0].emissiveIntensity = 0.09; }
        u[0].needsUpdate = true;
      });
    });
    var sandstoneTex = blocks({ base: '#c4875a', joint: 'rgba(60,20,10,.3)', rows: 10, cols: 3, glyphs: 3 });
    var sandstone = stoneUse(stoneMat(sandstoneTex, null, 0xf0d4bc, 0.34), 1, 1);
    var rockTex = k.tex(128, 128, function (g, W, Hh) { g.fillStyle = '#8a5038'; g.fillRect(0, 0, W, Hh); speckle(g, W, Hh, 1800, 0.05); for (var i = 0; i < 14; i++) { g.strokeStyle = 'rgba(30,8,6,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(rnd(0, W), rnd(0, Hh)); g.lineTo(rnd(0, W), rnd(0, Hh)); g.stroke(); } });
    var rock = new T.MeshStandardMaterial({ map: rockTex, color: 0xd8a890, roughness: 0.9, flatShading: true, emissive: 0x8a3a24, emissiveMap: rockTex, emissiveIntensity: 0.22 });
    var gold = new T.MeshStandardMaterial({ color: 0xd9a94e, metalness: 0.95, roughness: 0.24, envMapIntensity: 1.6 });
    var goldGlow = new T.MeshStandardMaterial({ color: 0xd9a94e, metalness: 0.9, roughness: 0.3, emissive: 0xffc860, emissiveIntensity: 0.5 });
    var bronze = new T.MeshStandardMaterial({ color: 0xb5803f, metalness: 0.9, roughness: 0.38 });
    var woodTex = k.tex(64, 256, function (g, W, Hh) { g.fillStyle = '#5a321e'; g.fillRect(0, 0, W, Hh); for (var i = 0; i < 40; i++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '20,8,4' : '140,90,60') + ',.35)'; g.lineWidth = rnd(0.6, 2); var x = rnd(0, W); g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rnd(-4, 4), Hh * 0.3, x + rnd(-4, 4), Hh * 0.7, x, Hh); g.stroke(); } });
    var wood = new T.MeshStandardMaterial({ map: woodTex, roughness: 0.85, emissive: 0x3a1a0a, emissiveMap: woodTex, emissiveIntensity: 0.3 });
    var dotTex = k.tex(64, 64, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
    function glowMat(color) { return new T.MeshBasicMaterial({ color: color, fog: false }); }
    function at(obj, x, z, dy) { obj.position.set(x, H(x, z) + (dy || 0), z); scene.add(obj); return obj; }

    // ---------- небо: нарисованная панорама (градиент, Млечный путь, звёзды, дальние гряды с инеем) ----------
    var skyTex = k.tex(2048, 640, function (g, W, Hh) {
      var gr = g.createLinearGradient(0, 0, 0, Hh);
      gr.addColorStop(0, '#03041a'); gr.addColorStop(0.35, '#0b1250'); gr.addColorStop(0.6, '#24186a'); gr.addColorStop(0.76, '#5a1c62'); gr.addColorStop(0.86, '#a02a54'); gr.addColorStop(1, '#3a0a1e');
      g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      // Млечный путь: диагональная полоса из мягких пятен и пыли
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 260; i++) {
        var u = Math.random(), x = u * W, y = Hh * (0.08 + u * 0.38) + rnd(-60, 60), r = rnd(18, 70);
        var c = g.createRadialGradient(x, y, 0, x, y, r); var tint = Math.random() < 0.5 ? '150,140,255' : '255,150,190';
        c.addColorStop(0, 'rgba(' + tint + ',.05)'); c.addColorStop(1, 'rgba(' + tint + ',0)'); g.fillStyle = c; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (i = 0; i < 2600; i++) { var su = Math.random(), sy = Hh * (0.08 + su * 0.38) + rnd(-45, 45); g.fillStyle = 'rgba(230,225,255,' + rnd(0.15, 0.6).toFixed(2) + ')'; g.fillRect(su * W, sy, 1.2, 1.2); }
      g.restore();
      // звёзды по всему небу
      for (i = 0; i < 1500; i++) { var y2 = Math.pow(Math.random(), 1.3) * Hh * 0.74, a = rnd(0.25, 1), s = Math.random() < 0.04 ? 2.4 : Math.random() < 0.2 ? 1.6 : 1; g.fillStyle = Math.random() < 0.12 ? 'rgba(255,225,170,' + a + ')' : Math.random() < 0.15 ? 'rgba(255,180,210,' + a + ')' : 'rgba(225,232,255,' + a + ')'; g.fillRect(rnd(0, W), y2, s, s); }
      // свечение горизонта
      var hz = g.createLinearGradient(0, Hh * 0.7, 0, Hh * 0.9); hz.addColorStop(0, 'rgba(255,60,110,0)'); hz.addColorStop(1, 'rgba(255,90,120,.35)'); g.fillStyle = hz; g.fillRect(0, Hh * 0.7, W, Hh * 0.2);
      // три слоя дальних гряд: чем ближе, тем темнее и выше; на гребнях иней
      [[0.8, '#7a2048', 0.035, 'rgba(255,190,210,.35)'], [0.84, '#4a0e2c', 0.05, 'rgba(230,210,255,.3)'], [0.9, '#26061a', 0.06, 'rgba(220,210,255,.22)']].forEach(function (L, li) {
        g.beginPath(); g.moveTo(0, Hh);
        var pts = [];
        for (var x3 = 0; x3 <= W; x3 += 8) { var v = x3 / W * (6 + li * 3) + li * 2.3, f = v - Math.floor(v), cr = f < 0.7 ? Math.pow(f / 0.7, 1.5) : Math.pow((1 - f) / 0.3, 2); var y3 = Hh * L[0] - cr * Hh * L[2] * (0.7 + 0.5 * Math.sin(x3 * 0.004 + li)); pts.push([x3, y3]); g.lineTo(x3, y3); }
        g.lineTo(W, Hh); g.closePath(); g.fillStyle = L[1]; g.fill();
        g.strokeStyle = L[3]; g.lineWidth = 1.6; g.beginPath(); pts.forEach(function (p, j) { if (j) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
      });
    });
    var pano = k.panorama({ texture: skyTex, r: 110, h: 86, span: 3.9, y0: -10, z: -6, repeat: 1, color: 0xffffff });
    // нарисованное небо: 2 повтора по дуге, сдвиг 0.5 — швы (у стыка двойной контур дюн) уходят на ±¼ дуги, за край кадра
    genTex('../../scarletsands/assets/gen/sky-desert.jpg', function (c) { c.wrapS = T.RepeatWrapping; c.repeat.set(2, 1); c.offset.x = 0.5; pano.material.map = c; pano.material.needsUpdate = true; });

    // Северная звезда: четырёхлучевая, с длинными лучами — яркая, ловится bloom'ом
    var starTex = k.tex(512, 512, function (g, w) {
      var c = w / 2, gr = g.createRadialGradient(c, c, 0, c, c, c);
      gr.addColorStop(0, 'rgba(255,252,235,1)'); gr.addColorStop(0.06, 'rgba(255,240,190,1)'); gr.addColorStop(0.2, 'rgba(255,200,110,.35)'); gr.addColorStop(0.5, 'rgba(255,150,80,.08)'); gr.addColorStop(1, 'rgba(255,120,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, w);
      g.translate(c, c);
      [[1, 0.035, 1], [0.6, 0.03, 0.6]].forEach(function (r, j) {
        g.save(); g.rotate(j * Math.PI / 4); g.beginPath();
        for (var s = 0; s < 8; s++) { var ang = s * Math.PI / 4, rr = s % 2 ? c * r[1] : c * r[0]; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
        g.closePath(); var lg = g.createRadialGradient(0, 0, 0, 0, 0, c * r[0]); lg.addColorStop(0, 'rgba(255,250,225,' + r[2] + ')'); lg.addColorStop(0.5, 'rgba(255,225,150,' + r[2] * 0.7 + ')'); lg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = lg; g.fill(); g.restore();
      });
    });
    var nstar = new T.Sprite(new T.SpriteMaterial({ map: starTex, color: 0xffffff, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    nstar.position.fromArray(STAR); nstar.scale.set(30, 30, 1); scene.add(nstar);
    var nhalo = k.glow(0xffb070, 70); nhalo.material.fog = false; nhalo.material.opacity = 0.22; nhalo.position.copy(nstar.position); scene.add(nhalo);
    // мерцающие звёзды поверх панорамы (живые точки, bloom делает их искрами)
    var twN = mobile ? 60 : 140, twPos = new Float32Array(twN * 3), twPh = [];
    for (var i = 0; i < twN; i++) { var ta = Math.PI + rnd(-1.6, 1.6), el = rnd(0.12, 0.62); twPos[i * 3] = Math.sin(ta) * 100; twPos[i * 3 + 1] = Math.sin(el) * 80 - 2; twPos[i * 3 + 2] = Math.cos(ta) * 100 - 6; twPh.push(rnd(0, TAU)); }
    var twGeo = new T.BufferGeometry(); twGeo.setAttribute('position', new T.BufferAttribute(twPos, 3));
    var twinkle = new T.Points(twGeo, new T.PointsMaterial({ map: dotTex, size: 1.6, color: 0xfff0e0, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending }));
    scene.add(twinkle);

    // ---------- свет: лунный холод слева, тёплая звезда справа-сзади, костёр ----------
    var hemi = new T.HemisphereLight(0x6a64c8, 0x3a0a1a, 0.62); scene.add(hemi);
    var moon = new T.DirectionalLight(0x9aa8ff, 0.5); moon.position.set(-18, 22, 14); scene.add(moon);
    var starLight = new T.DirectionalLight(0xffb070, 0.55); starLight.position.set(STAR[0], STAR[1], STAR[2]); scene.add(starLight);
    var fire = new T.PointLight(0xff8a3a, 2.2, 15, 1.6); scene.add(fire);
    var rim = new T.PointLight(0xff3a6a, 0.8, 40, 1.4); rim.position.set(0, 6, -42); scene.add(rim);

    // ---------- дюны: рельеф + цвет по высоте, рябь в normal map, иней на гребнях ----------
    var SEG = mobile ? 130 : 200;
    var geo = new T.PlaneGeometry(170, 170, SEG, SEG); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -24);
    var P = geo.attributes.position, col = new Float32Array(P.count * 3);
    var cLow = new T.Color(0x3a0618), cMid = new T.Color(0x8a1028), cHi = new T.Color(0xc8283c), cSnow = new T.Color(0xc8c8ea), tmp = new T.Color();
    for (i = 0; i < P.count; i++) {
      var x = P.getX(i), z = P.getZ(i), h = H(x, z); P.setY(i, h);
      var hn = Math.max(0, Math.min(1, h / 2.4));
      tmp.copy(cLow).lerp(cMid, Math.min(1, hn * 1.5)); if (hn > 0.5) tmp.lerp(cHi, (hn - 0.5) * 1.6);
      var fr0 = (Math.sin(x * 0.37 + z * 0.11) + Math.sin(x * 0.13 - z * 0.29 + 2) + Math.sin(x * 0.71 + z * 0.53 + 4)) / 3 + (Math.min(h, 2.6) - 1.3) * 0.5;
      if (fr0 > 0.45) tmp.lerp(cSnow, Math.min(0.62, (fr0 - 0.45) * 1.3));
      col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    // песок: зерно + искры инея (светятся через emissiveMap) + рябь ветра → normal map из той же ряби
    var RW = mobile ? 256 : 512;
    var rip = document.createElement('canvas'); rip.width = rip.height = RW; var rg = rip.getContext('2d'), rimg = rg.createImageData(RW, RW);
    var hgt = new Float32Array(RW * RW);
    for (var yy = 0; yy < RW; yy++) for (var xx = 0; xx < RW; xx++) { var u2 = xx / RW * TAU, v2 = yy / RW * TAU; hgt[yy * RW + xx] = Math.sin(v2 * 11 + Math.sin(u2 * 2) * 2.2 + Math.sin(u2 * 5 + v2 * 3) * 0.9) * 0.5 * (0.6 + 0.4 * Math.sin(u2 * 3 + v2 * 2)) + Math.sin(v2 * 23 + u2 * 6 + Math.sin(v2 * 4) * 2) * 0.12; }
    for (yy = 0; yy < RW; yy++) for (xx = 0; xx < RW; xx++) {
      var hx = hgt[yy * RW + (xx + 1) % RW] - hgt[yy * RW + (xx - 1 + RW) % RW], hy = hgt[((yy + 1) % RW) * RW + xx] - hgt[((yy - 1 + RW) % RW) * RW + xx];
      var nx = -hx * 1.4, ny = -hy * 1.4, nz = 1, nl = Math.sqrt(nx * nx + ny * ny + 1), o = (yy * RW + xx) * 4;
      rimg.data[o] = (nx / nl * 0.5 + 0.5) * 255; rimg.data[o + 1] = (ny / nl * 0.5 + 0.5) * 255; rimg.data[o + 2] = (nz / nl * 0.5 + 0.5) * 255; rimg.data[o + 3] = 255;
    }
    rg.putImageData(rimg, 0, 0);
    var sandN = new T.CanvasTexture(rip); sandN.wrapS = sandN.wrapT = T.RepeatWrapping; sandN.repeat.set(9, 9); sandN.anisotropy = k.aniso;
    var sandTex = k.tex(256, 256, function (g, w, hh) {
      g.fillStyle = '#d8d0d0'; g.fillRect(0, 0, w, hh);
      for (var j = 0; j < 9000; j++) { var v = 170 + Math.random() * 85 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 10) + ',' + (v - 6) + ',.55)'; g.fillRect(Math.random() * w, Math.random() * hh, 1.2, 1.2); }
    }, HQ);
    sandTex.wrapS = sandTex.wrapT = T.RepeatWrapping; sandTex.repeat.set(22, 22);
    var sparkTex = k.tex(256, 256, function (g, w, hh) { g.fillStyle = '#000'; g.fillRect(0, 0, w, hh); for (var j = 0; j < 90; j++) { g.fillStyle = 'rgba(220,225,255,' + rnd(0.4, 1).toFixed(2) + ')'; g.fillRect(Math.random() * w, Math.random() * hh, 1.3, 1.3); } });
    sparkTex.wrapS = sparkTex.wrapT = T.RepeatWrapping; sparkTex.repeat.set(30, 30);
    var ground = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, map: sandTex, normalMap: sandN, normalScale: new T.Vector2(0.22, 0.22), roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveMap: sparkTex, emissiveIntensity: 0.55 }));
    scene.add(ground);
    // песок с рябью из графики: цвет по высоте и иней даёт рельеф (vertexColors), поэтому картинку берём как зерно —
    // приглушённую и светлую, иначе красное × красное уходит в темноту
    k.image('../../scarletsands/assets/gen/sand-red.jpg', function (t, img) {
      var c = document.createElement('canvas'); c.width = img.width; c.height = img.height; var g = c.getContext('2d');
      g.filter = 'saturate(0.3) brightness(1.75)'; g.drawImage(img, 0, 0);
      var st = new T.CanvasTexture(c); st.wrapS = st.wrapT = T.RepeatWrapping; st.repeat.set(16, 16); st.anisotropy = k.aniso;
      ground.material.map = st; ground.material.needsUpdate = true;
    });
    // мерцание инея на гребнях: редкие яркие точки (bloom превращает их в блёстки)
    var frN = mobile ? 160 : 420, frPos = new Float32Array(frN * 3), frPh = [], fn = 0;
    while (fn < frN) { var fx = rnd(-30, 30), fz = rnd(-40, 14), fh = H(fx, fz); if (fh < 1.1 || Math.abs(fx - pathX(fz)) < 2.5) continue; frPos[fn * 3] = fx; frPos[fn * 3 + 1] = fh + 0.05; frPos[fn * 3 + 2] = fz; frPh.push(rnd(0, TAU)); fn++; }
    var frGeo = new T.BufferGeometry(); frGeo.setAttribute('position', new T.BufferAttribute(frPos, 3));
    var frost = new T.Points(frGeo, new T.PointsMaterial({ map: dotTex, size: 0.22, color: 0xe8ecff, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(frost);

    // ---------- тропа: следы, загораются золотом ----------
    var order = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    var curve = new T.CatmullRomCurve3(order.map(function (key) { var p = WAY[key]; return new T.Vector3(p[0], H(p[0], p[1]), p[1]); }), false, 'catmullrom', 0.4);
    var N = 170, steps = [], FS = 8, fpPos = [], fpCol = [], glPos = new Float32Array((N - 1) * 3), glCol = new Float32Array((N - 1) * 3);
    var cDark = new T.Color(0x2a0614), cGold = new T.Color(0xffd34a);
    for (i = 1; i < N; i++) {
      var u = i / N, p = curve.getPointAt(u), tg = curve.getTangentAt(u), side = (i % 2 ? 1 : -1) * 0.16;
      var sx = p.x + tg.z * side, sz = p.z - tg.x * side, sy = H(sx, sz) + 0.04;
      for (var q = 0; q < FS; q++) {
        var a0 = q / FS * TAU, a1 = (q + 1) / FS * TAU;
        fpPos.push(sx, sy, sz, sx + Math.cos(a1) * 0.13, sy, sz + Math.sin(a1) * 0.1, sx + Math.cos(a0) * 0.13, sy, sz + Math.sin(a0) * 0.1);
        for (var r3 = 0; r3 < 3; r3++) fpCol.push(cDark.r, cDark.g, cDark.b);
      }
      glPos[(i - 1) * 3] = sx; glPos[(i - 1) * 3 + 1] = sy + 0.1; glPos[(i - 1) * 3 + 2] = sz;
      steps.push({ u: u, on: 0, lit: -1 });
    }
    var fpGeo = new T.BufferGeometry(); fpGeo.setAttribute('position', new T.Float32BufferAttribute(fpPos, 3)); fpGeo.setAttribute('color', new T.Float32BufferAttribute(fpCol, 3));
    var fpMesh = new T.Mesh(fpGeo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 })); scene.add(fpMesh);
    var glGeo = new T.BufferGeometry(); glGeo.setAttribute('position', new T.BufferAttribute(glPos, 3)); glGeo.setAttribute('color', new T.BufferAttribute(glCol, 3));
    var glPts = new T.Points(glGeo, new T.PointsMaterial({ size: 0.7, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(glPts);
    var uAt = {}; order.forEach(function (key) {
      var p = WAY[key], best = 0, bd = 1e9;
      for (var j = 0; j <= 400; j++) { var q = curve.getPointAt(j / 400), dd = (q.x - p[0]) * (q.x - p[0]) + (q.z - p[1]) * (q.z - p[1]); if (dd < bd) { bd = dd; best = j / 400; } }
      uAt[key] = best;
    });

    // ---------- ориентиры пустыни: песчаник с кладкой, золотые навершия ----------
    function pyramid(x, z, s, rot) {
      var g = new T.Group(), t2 = blocks({ base: '#c88c5c', joint: 'rgba(60,20,10,.22)', rows: 11, cols: 7 });
      var m = new T.Mesh(new T.ConeGeometry(1, 1, 4, 6), stoneUse(stoneMat(t2, null, 0xf2d6c0, 0.34), Math.max(2, Math.round(s / 2)), Math.max(1.5, s / 4), 'pyr')); m.rotation.y = Math.PI / 4; m.position.y = 0.5; g.add(m);
      var cap = new T.Mesh(new T.ConeGeometry(0.16, 0.16, 4), goldGlow); cap.rotation.y = Math.PI / 4; cap.position.y = 0.92; g.add(cap);
      // иней по рёбрам
      var fr = new T.Mesh(new T.ConeGeometry(0.42, 0.42, 4), new T.MeshStandardMaterial({ color: 0xe6e8ff, roughness: 0.8, transparent: true, opacity: 0.55, emissive: 0x6a6aa8, emissiveIntensity: 0.3 }));
      fr.rotation.y = Math.PI / 4; fr.position.y = 0.66; g.add(fr);
      g.scale.set(s, s * 0.78, s); g.rotation.y = rot || 0; return at(g, x, z, -0.25);
    }
    pyramid(-17, -27, 8.5, 0.1); pyramid(-9.5, -36, 4.2, 0.3); pyramid(17.5, -38, 6.2, -0.2);
    (function obelisk(x, z) {
      var g = new T.Group(), t2 = blocks({ base: '#94573a', joint: 'rgba(40,10,6,.4)', rows: 16, cols: 1, w: 128, h: 512, glyphs: 5 });
      var geoO = new T.CylinderGeometry(0.28, 0.46, 5.0, 4, 1); geoO.rotateY(Math.PI / 4);
      var m = new T.Mesh(geoO, stoneUse(stoneMat(t2, null, 0xe0b8a0, 0.3), 1, 4)); m.position.y = 2.5 + 0.5; g.add(m);
      var base = new T.Mesh(new T.BoxGeometry(1.3, 0.5, 1.3), sandstone); base.position.y = 0.25; g.add(base);
      var tipG = new T.ConeGeometry(0.4, 0.6, 4); tipG.rotateY(Math.PI / 4); var tip = new T.Mesh(tipG, goldGlow); tip.position.y = 5.8; g.add(tip);
      var tg2 = k.glow(0xffc860, 1.6); tg2.position.y = 5.85; g.add(tg2);
      g.rotation.z = 0.05; at(g, x, z, -0.15);
    })(10.8, -6.2);
    (function temple(x, z) {
      var g = new T.Group();
      var stepT = blocks({ base: '#c4875a', joint: 'rgba(60,20,10,.3)', rows: 3, cols: 8, w: 512, h: 128 });
      var base = new T.Mesh(new T.BoxGeometry(6, 0.5, 3), stoneUse(stoneMat(stepT, null, 0xf0d4bc, 0.32), 3, 0.5)); base.position.y = 0.25; g.add(base);
      var base2 = new T.Mesh(new T.BoxGeometry(5.4, 0.3, 2.5), stoneUse(stoneMat(stepT, null, 0xf0d4bc, 0.32), 3, 0.3)); base2.position.y = 0.65; g.add(base2);
      // колонны с каннелюрами (Lathe), капитель, одна обломана
      var prof = [[0.34, 0], [0.34, 0.12], [0.27, 0.2], [0.25, 1], [0.235, 2.2], [0.3, 2.3], [0.36, 2.42], [0.36, 2.5]].map(function (p) { return new T.Vector2(p[0], p[1]); });
      var colT = k.tex(256, 64, function (gg, W, Hh) { gg.fillStyle = '#cc9468'; gg.fillRect(0, 0, W, Hh); for (var j = 0; j < 16; j++) { gg.fillStyle = 'rgba(30,8,6,.35)'; gg.fillRect(j * W / 16, 0, 3, Hh); gg.fillStyle = 'rgba(255,220,180,.12)'; gg.fillRect(j * W / 16 + 4, 0, 4, Hh); } speckle(gg, W, Hh, 600, 0.04); }, HQ);
      var colMat = stoneMat(colT, null, 0xe8c4ac, 0.3);
      [-2.2, -0.75, 0.75, 2.2].forEach(function (cx, j) {
        var lg = new T.LatheGeometry(prof, 16), c = new T.Mesh(lg, colMat);
        c.position.set(cx, 0.8, 0); if (j === 2) { c.scale.y = 0.55; } else c.scale.y = 1.25; g.add(c);
        if (j === 2) { var drum = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 0.5, 14), colMat); drum.position.set(cx + 1.0, 0.95, 1.2); drum.rotation.set(Math.PI / 2, 0.3, 0); g.add(drum); }
      });
      var linT = blocks({ base: '#c08458', joint: 'rgba(60,20,10,.3)', rows: 2, cols: 5, w: 512, h: 128, glyphs: 2 });
      var lin = new T.Mesh(new T.BoxGeometry(3.4, 0.5, 0.9), stoneUse(stoneMat(linT, null, 0xe0b8a0, 0.32), 2, 0.4)); lin.position.set(-1.45, 0.8 + 3.15, 0); lin.rotation.z = -0.03; g.add(lin);
      for (var j = 0; j < 5; j++) { var rb = new T.Mesh(new T.BoxGeometry(rnd(0.5, 0.9), rnd(0.3, 0.5), rnd(0.4, 0.7)), sandstone); rb.position.set(rnd(-3, 3.2), 0.2, rnd(1.4, 2.6)); rb.rotation.y = rnd(0, 3); g.add(rb); }
      g.rotation.y = 0.5; at(g, x, z, -0.12);
    })(-12, -6);
    // кактусы с рёбрами и красным цветком
    function cactus(x, z, s) {
      var g = new T.Group(), cT = k.tex(128, 64, function (gg, W, Hh) { gg.fillStyle = '#2a8a50'; gg.fillRect(0, 0, W, Hh); for (var j = 0; j < 10; j++) { gg.fillStyle = 'rgba(10,40,20,.5)'; gg.fillRect(j * W / 10, 0, 3, Hh); gg.fillStyle = 'rgba(220,255,220,.6)'; for (var q2 = 0; q2 < 6; q2++) gg.fillRect(j * W / 10 + 6, q2 * Hh / 6 + 4, 1.5, 1.5); } });
      var mat = new T.MeshStandardMaterial({ map: cT, roughness: 0.7, emissive: 0x0a3a1a, emissiveMap: cT, emissiveIntensity: 0.35 });
      var t2 = new T.Mesh(new T.CapsuleGeometry(0.28, 1.7, 6, 14), mat); t2.position.y = 1.1; g.add(t2);
      [[-1, 0.95, 0.6], [1, 1.3, 0.48]].forEach(function (a) {
        var arm = new T.Mesh(new T.CapsuleGeometry(0.17, a[2], 6, 12), mat); arm.position.set(a[0] * 0.5, a[1] + 0.32, 0); g.add(arm);
        var jn = new T.Mesh(new T.CapsuleGeometry(0.16, 0.24, 6, 12), mat); jn.rotation.z = Math.PI / 2; jn.position.set(a[0] * 0.32, a[1], 0); g.add(jn);
      });
      var fl = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), new T.MeshStandardMaterial({ color: B.crimson, emissive: B.cta, emissiveIntensity: 0.8 })); fl.position.y = 2.05; g.add(fl);
      g.scale.setScalar(s); g.rotation.y = x; return at(g, x, z, -0.05);
    }
    cactus(7.6, 4.6, 1); cactus(-8.8, -15.5, 1.15); cactus(9.8, -21.5, 0.9);

    // ---------- лагерь (как на ключевом арте) ----------
    var camp = new T.Group(); at(camp, WAY.camp[0], WAY.camp[1], 0);
    // ткань палатки: беж с выгоранием, швы и строчка, подолы темнее (рисунок = emissiveMap — тёплое свечение изнутри)
    var canvasTex = k.tex(256, 256, function (g, W, Hh) {
      var gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#b49870'); gr.addColorStop(1, '#7e6446'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      speckle(g, W, Hh, 4000, 0.025);
      for (var j = 1; j < 4; j++) { g.fillStyle = 'rgba(80,50,30,.35)'; g.fillRect(j * W / 4 - 1, 0, 2, Hh); g.fillStyle = 'rgba(255,240,210,.25)'; for (var q2 = 0; q2 < Hh; q2 += 8) g.fillRect(j * W / 4 + 4, q2, 1, 4); }
      g.fillStyle = 'rgba(70,40,20,.4)'; g.fillRect(0, Hh - 14, W, 14);
    }, HQ);
    var canvasMat = new T.MeshStandardMaterial({ map: canvasTex, roughness: 0.9, side: T.DoubleSide, emissive: 0xffa050, emissiveMap: canvasTex, emissiveIntensity: 0.07 });
    // gen: ткань с настоящей строчкой (batch 2); цвет чуть темнее, чтобы скаты не пересвечивались костром
    genTex('../../scarletsands/assets/gen/tent-canvas.jpg', function (t) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1.3, 1.3); canvasMat.map = t; canvasMat.emissiveMap = t; canvasMat.color.setHex(0xd8c4a8); canvasMat.needsUpdate = true; });
    var tentG = new T.Group(); tentG.position.set(-3.4, 0, -0.5); tentG.rotation.y = 0.5; camp.add(tentG);
    var TW = 1.7, TH2 = 2.35, TD = 3.4; // полуширина, высота конька, глубина
    var SL = Math.hypot(TW, TH2), tilt = Math.atan2(TW, TH2);
    [-1, 1].forEach(function (sd) {   // два ската с провисом ткани внутрь
      var pg = new T.PlaneGeometry(TD, SL, 12, 6), pp = pg.attributes.position;
      for (var j = 0; j < pp.count; j++) { var px = pp.getX(j) / TD + 0.5, py = pp.getY(j) / SL + 0.5; pp.setZ(j, -sd * (Math.sin(px * Math.PI) * Math.sin(py * Math.PI) * 0.12 + Math.abs(Math.sin(px * Math.PI * 3)) * 0.02)); }
      pg.rotateY(Math.PI / 2); pg.computeVertexNormals();
      var m = new T.Mesh(pg, canvasMat); m.rotation.z = sd * tilt; m.position.set(sd * TW / 2, TH2 / 2, 0); tentG.add(m);
    });
    var backW = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(-TW, 0), new T.Vector2(TW, 0), new T.Vector2(0, TH2)])), canvasMat); backW.position.z = -TD / 2; tentG.add(backW);
    // вход: тёплое нутро и откинутые полы
    var inner = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(-TW * 0.82, 0), new T.Vector2(TW * 0.82, 0), new T.Vector2(0, TH2 * 0.85)])), new T.MeshBasicMaterial({ color: 0xffb060 }));
    inner.position.z = -TD / 2 + 0.05; tentG.add(inner);
    var innerFloor = new T.Mesh(new T.PlaneGeometry(TW * 1.6, TD), new T.MeshStandardMaterial({ color: 0x6a2a18, emissive: 0xff8a3a, emissiveIntensity: 0.35, roughness: 1 })); innerFloor.rotation.x = -Math.PI / 2; innerFloor.position.y = 0.02; tentG.add(innerFloor);
    [-1, 1].forEach(function (sd) {   // откинутые и подвязанные полы входа вдоль боковых кромок
      var flap = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(0, TH2), new T.Vector2(sd * TW, 0), new T.Vector2(sd * TW * 0.42, 0), new T.Vector2(sd * TW * 0.3, TH2 * 0.45)])), canvasMat);
      flap.position.set(0, 0, TD / 2 + 0.02); tentG.add(flap);
      var tie = new T.Mesh(new T.TorusGeometry(0.05, 0.015, 6, 12), new T.MeshStandardMaterial({ color: 0x7a1424, roughness: 0.8 })); tie.position.set(sd * TW * 0.55, TH2 * 0.4, TD / 2 + 0.05); tentG.add(tie);
    });
    var tentLight = new T.PointLight(0xffa050, 0.6, 5, 1.6); tentLight.position.set(0, 1, 0.8); tentG.add(tentLight);
    var pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, TH2 + 0.25, 8), wood); pole.position.set(0, (TH2 + 0.25) / 2, TD / 2 + 0.02); tentG.add(pole);
    // гирлянда: по коньку и передним кромкам, лампы-шарики (яркие — bloom), провод
    var bulbGeo = new T.SphereGeometry(0.06, 10, 8), campBulbs = [];
    var wire = [];
    for (i = 0; i <= 16; i++) { var tt = i / 16; wire.push(new T.Vector3((tt < 0.5 ? -TW + tt * 2 * TW : TW - (tt - 0.5) * 2 * TW) * 1.04, (tt < 0.5 ? tt * 2 : (1 - tt) * 2) * TH2 + 0.06 - Math.sin(tt * 16 * Math.PI) * 0.035, TD / 2 + 0.06)); }
    for (i = 1; i <= 9; i++) wire.push(new T.Vector3(0, TH2 + 0.04 - Math.sin(i * Math.PI) * 0.02, TD / 2 - i * TD / 9));
    wire.forEach(function (p, j) {
      var bm = new T.Mesh(bulbGeo, glowMat(new T.Color(1, 0.86, 0.55))); bm.position.copy(p); tentG.add(bm); campBulbs.push(bm);
    });
    var wireGeo = new T.TubeGeometry(new T.CatmullRomCurve3(wire.slice(0, 17)), 60, 0.008, 4); tentG.add(new T.Mesh(wireGeo, new T.MeshBasicMaterial({ color: 0x1a0e08 })));
    // ёлка в горшке: ярусы с неровным краем, иней на лапах, шары с отражениями, огоньки
    var xtree = new T.Group();
    var needle = new T.MeshStandardMaterial({ color: 0x1f6a3c, roughness: 0.8, flatShading: true, emissive: 0x0a2a14, emissiveIntensity: 0.4 });
    var snowTip = new T.MeshStandardMaterial({ color: 0xeef0ff, roughness: 0.7, flatShading: true, emissive: 0x5a5a9a, emissiveIntensity: 0.25 });
    [[0.8, 0.95, 0.75], [0.64, 0.85, 1.25], [0.48, 0.75, 1.7], [0.3, 0.6, 2.1]].forEach(function (t2) {
      var cg2 = new T.ConeGeometry(t2[0], t2[1], 14, 2), cp = cg2.attributes.position;
      for (var j = 0; j < cp.count; j++) { var yv = cp.getY(j); if (yv < -t2[1] * 0.4) { var s2 = 1 + Math.sin(j * 2.3) * 0.12; cp.setX(j, cp.getX(j) * s2); cp.setZ(j, cp.getZ(j) * s2); cp.setY(j, yv - Math.abs(Math.sin(j * 1.7)) * 0.08); } }
      cg2.computeVertexNormals();
      var c = new T.Mesh(cg2, needle); c.position.y = t2[2]; xtree.add(c);
      var sn = new T.Mesh(new T.ConeGeometry(t2[0] * 0.55, t2[1] * 0.35, 14), snowTip); sn.position.y = t2[2] + t2[1] * 0.3; xtree.add(sn);
    });
    var pot = new T.Mesh(new T.CylinderGeometry(0.34, 0.26, 0.5, 18), new T.MeshStandardMaterial({ color: 0xb4532e, roughness: 0.6, emissive: 0x4a1a0a, emissiveIntensity: 0.3 })); pot.position.y = 0.25; xtree.add(pot);
    var baubles = [];
    for (i = 0; i < 14; i++) {
      var ty = 0.75 + (i / 14) * 1.5, tr = 0.78 * (1 - (ty - 0.5) / 2.0) + 0.04, ta2 = i * 2.3;
      var bm2 = new T.Mesh(new T.SphereGeometry(0.075, 14, 10), new T.MeshStandardMaterial({ color: i % 2 ? 0xd4002e : 0xffc83a, metalness: 0.85, roughness: 0.18, envMapIntensity: 1.6, emissive: i % 2 ? 0x5a0010 : 0x6a4a00, emissiveIntensity: 0.4 }));
      bm2.position.set(Math.cos(ta2) * tr, ty, Math.sin(ta2) * tr); xtree.add(bm2); baubles.push(bm2);
    }
    var tLights = [];
    for (i = 0; i < 18; i++) { var ly = 0.7 + (i / 18) * 1.6, lr = 0.8 * (1 - (ly - 0.5) / 2.0) + 0.06, la = i * 1.1 + 0.5; var lb = new T.Mesh(new T.SphereGeometry(0.035, 6, 5), glowMat(new T.Color(1, 0.9, 0.6))); lb.position.set(Math.cos(la) * lr, ly, Math.sin(la) * lr); xtree.add(lb); tLights.push(lb); }
    var tstar = new T.Mesh(new T.OctahedronGeometry(0.12, 0), goldGlow); tstar.position.y = 2.5; xtree.add(tstar);
    var tstarG = k.glow(B.gold, 0.9); tstarG.position.y = 2.5; xtree.add(tstarG);
    xtree.position.set(-6.0, 0, 1.0); camp.add(xtree);
    // ковёр с орнаментом и бахромой (чёткая канва)
    // поле ковра: gen-узор rug-crimson.jpg (batch 2), поверх — свои кайма и бордюр; без картинки — процедурный медальон
    var rugImg = null;
    var rugTex = k.tex(512, 320, function (g, W, Hh) {
      g.fillStyle = '#6a1020'; g.fillRect(0, 0, W, Hh);
      if (rugImg) {
        var ts = 300; g.save(); g.beginPath(); g.rect(40, 40, W - 80, Hh - 80); g.clip();
        for (var ty0 = Hh / 2 - ts * 1.5; ty0 < Hh; ty0 += ts) for (var tx0 = W / 2 - ts * 1.5; tx0 < W; tx0 += ts) g.drawImage(rugImg, tx0, ty0, ts, ts);
        g.restore();
        g.strokeStyle = '#d9a94e'; g.lineWidth = 10; g.strokeRect(22, 22, W - 44, Hh - 44);
        g.strokeStyle = '#2a3a7a'; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, Hh - 80);
        g.fillStyle = '#e4b473'; for (var jj = 0; jj < 22; jj++) { g.save(); g.translate(30 + jj * (W - 60) / 21, 31); g.rotate(Math.PI / 4); g.fillRect(-4, -4, 8, 8); g.restore(); g.save(); g.translate(30 + jj * (W - 60) / 21, Hh - 31); g.rotate(Math.PI / 4); g.fillRect(-4, -4, 8, 8); g.restore(); }
        return;
      }
      speckle(g, W, Hh, 4000, 0.03);
      g.strokeStyle = '#d9a94e'; g.lineWidth = 10; g.strokeRect(22, 22, W - 44, Hh - 44);
      g.strokeStyle = '#2a3a7a'; g.lineWidth = 6; g.strokeRect(40, 40, W - 80, Hh - 80);
      g.fillStyle = '#e4b473'; for (var j = 0; j < 22; j++) { g.save(); g.translate(30 + j * (W - 60) / 21, 31); g.rotate(Math.PI / 4); g.fillRect(-4, -4, 8, 8); g.restore(); g.save(); g.translate(30 + j * (W - 60) / 21, Hh - 31); g.rotate(Math.PI / 4); g.fillRect(-4, -4, 8, 8); g.restore(); }
      var cx = W / 2, cy = Hh / 2;
      g.fillStyle = '#b8243a'; g.beginPath(); g.moveTo(cx - 150, cy); g.lineTo(cx, cy - 92); g.lineTo(cx + 150, cy); g.lineTo(cx, cy + 92); g.closePath(); g.fill();
      g.strokeStyle = '#e4b473'; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#2a3a7a'; g.beginPath(); g.moveTo(cx - 70, cy); g.lineTo(cx, cy - 44); g.lineTo(cx + 70, cy); g.lineTo(cx, cy + 44); g.closePath(); g.fill();
      g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.fill();
      [-1, 1].forEach(function (s2) { g.fillStyle = '#e4b473'; for (var j = 0; j < 3; j++) { g.save(); g.translate(cx + s2 * (180 + j * 18), cy); g.rotate(Math.PI / 4); g.fillRect(-7, -7, 14, 14); g.restore(); } });
    }, HQ);
    k.image('../../scarletsands/assets/gen/rug-crimson.jpg', function (t, img) { rugImg = img; rugTex.redraw(); });
    var rug = new T.Mesh(new T.PlaneGeometry(2.8, 1.75), new T.MeshStandardMaterial({ map: rugTex, roughness: 0.95, emissive: 0xffffff, emissiveMap: rugTex, emissiveIntensity: 0.12 }));
    rug.rotation.x = -Math.PI / 2; rug.rotation.z = 0.15; rug.position.set(1.7, 0.03, 1.3); camp.add(rug);
    var fringeGeo = new T.PlaneGeometry(0.05, 0.16);
    var fringeMat = new T.MeshStandardMaterial({ color: 0xd8c09a, roughness: 1, side: T.DoubleSide, emissive: 0x3a2a1a, emissiveIntensity: 0.3 });
    for (i = 0; i < 22; i++) [-1, 1].forEach(function (s2) { var fr2 = new T.Mesh(fringeGeo, fringeMat); fr2.rotation.z = Math.PI / 2; fr2.position.set(s2 * 1.47, (i / 21 - 0.5) * 1.6, 0.002); rug.add(fr2); });
    // костёр: кольцо камней, поленья с корой, шейдерное пламя (как жаровни WH), искры, свет
    var fireG = new T.Group(); fireG.position.set(-0.4, 0, 2.1); camp.add(fireG);
    for (i = 0; i < 9; i++) { var stn = new T.Mesh(new T.DodecahedronGeometry(0.19, 1), rock); var aa = i / 9 * TAU; stn.scale.set(1, 0.7, 1); stn.position.set(Math.cos(aa) * 0.52, 0.1, Math.sin(aa) * 0.52); stn.rotation.set(i, i * 2, 0); fireG.add(stn); }
    for (i = 0; i < 4; i++) { var lg2 = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.85, 8), wood); lg2.rotation.z = Math.PI / 2 - 0.35; lg2.rotation.y = i * Math.PI / 2 + 0.3; lg2.position.y = 0.2; fireG.add(lg2); }
    var ember = new T.Mesh(new T.CircleGeometry(0.34, 18), glowMat(new T.Color(1, 0.42, 0.1))); ember.rotation.x = -Math.PI / 2; ember.position.y = 0.06; fireG.add(ember);
    var FCOL = [[0.7, 0.08, 0.02], [1.0, 0.5, 0.1], [1.0, 0.94, 0.68]];
    var fl1 = k.flame(FCOL, 0.95); fl1.scale.set(0.95, 1.35, 1); fl1.position.y = 0.08; fireG.add(fl1);
    var fl2 = k.flame(FCOL, 0.7); fl2.scale.set(0.7, 1.0, 1); fl2.position.set(0.18, 0.08, 0.08); fireG.add(fl2);
    var fl3 = k.flame(FCOL, 0.7); fl3.scale.set(0.65, 0.95, 1); fl3.position.set(-0.18, 0.08, -0.06); fireG.add(fl3);
    var fireGlow = k.glow(0xff7a2a, 2.8); fireGlow.position.y = 0.5; fireG.add(fireGlow);
    var fireSpill = k.glow(0xff5a1a, 6.5); fireSpill.position.y = 0.1; fireSpill.material.opacity = 0.42; fireG.add(fireSpill);
    fire.position.set(camp.position.x - 0.4, camp.position.y + 1.1, camp.position.z + 2.1);
    var SPN = mobile ? 24 : 48, spPos = new Float32Array(SPN * 3), spV = [];
    for (i = 0; i < SPN; i++) { spV.push({ life: rnd(0, 1.6), vx: rnd(-0.2, 0.2), vz: rnd(-0.2, 0.2), vy: rnd(0.8, 1.6) }); }
    var spGeo = new T.BufferGeometry(); spGeo.setAttribute('position', new T.BufferAttribute(spPos, 3));
    var sparks = new T.Points(spGeo, new T.PointsMaterial({ map: dotTex, size: 0.09, color: 0xffb060, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    sparks.frustumCulled = false; fireG.add(sparks);
    // рюкзак и фонарь у входа
    var packT = k.tex(64, 64, function (g, W, Hh) { g.fillStyle = '#7a6a42'; g.fillRect(0, 0, W, Hh); speckle(g, W, Hh, 400, 0.05); g.fillStyle = '#5a4a2a'; g.fillRect(8, 30, W - 16, 24); g.fillStyle = '#c8a050'; g.fillRect(W / 2 - 3, 36, 6, 6); });
    var pack = new T.Mesh(new T.BoxGeometry(0.52, 0.66, 0.34, 2, 2, 2), new T.MeshStandardMaterial({ map: packT, roughness: 0.85, emissive: 0x2a1a0a, emissiveMap: packT, emissiveIntensity: 0.3 }));
    pack.position.set(-4.7, 0.33, 2.3); pack.rotation.y = 0.4; camp.add(pack);
    function brassLantern(scale) {
      var g = new T.Group();
      var cap = new T.Mesh(new T.ConeGeometry(0.16, 0.14, 8), bronze); cap.position.y = 0.42; g.add(cap);
      var ringT = new T.Mesh(new T.TorusGeometry(0.05, 0.012, 6, 14), bronze); ringT.position.y = 0.52; g.add(ringT);
      var baseL = new T.Mesh(new T.CylinderGeometry(0.15, 0.17, 0.06, 10), bronze); baseL.position.y = 0.03; g.add(baseL);
      for (var j = 0; j < 4; j++) { var bar = new T.Mesh(new T.BoxGeometry(0.02, 0.32, 0.02), bronze); var aj = j / 4 * TAU + Math.PI / 4; bar.position.set(Math.cos(aj) * 0.13, 0.2, Math.sin(aj) * 0.13); g.add(bar); }
      var glass = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.3, 10, 1, true), new T.MeshStandardMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.18, roughness: 0.1, emissive: 0xffa040, emissiveIntensity: 0, side: T.DoubleSide, depthWrite: false })); glass.position.y = 0.2; g.add(glass);
      var fl = k.flame([[0.7, 0.2, 0.02], [1.0, 0.62, 0.15], [1.0, 0.96, 0.75]], 0.9); fl.scale.set(0.12, 0.22, 1); fl.position.y = 0.09; g.add(fl);
      var gl = k.glow(B.warm, 1.6); gl.position.y = 0.2; g.add(gl);
      g.scale.setScalar(scale || 1);
      return { g: g, glass: glass.material, flame: fl, glow: gl };
    }
    var campLamp = brassLantern(1.15); campLamp.g.position.set(0.9, 0, -0.2); camp.add(campLamp.g);

    // ---------- персонажи: настоящие PNG бренда ----------
    // исследовательница: указывает вперёд — на тропу к Find 1 (gen batch 2, фигура ~87% кадра → выше борд);
    // нет файла — поза с фонарём и картой (explorer-star, на весь кадр)
    var girl = genBoard('../../scarletsands/assets/gen/explorer-point.png', '../../scarletsands/assets/gen/explorer-star.png', 3.15, null, 2.75);
    girl.position.set(camp.position.x + 2.3, camp.position.y, camp.position.z + 1.7); scene.add(girl);
    // кот: целый cat-sit.png (gen). Если файла нет — старый mascot-3.png с погашенным срезанным краем шляпы
    var cat = new T.Group(), catMat = new T.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, side: T.DoubleSide, toneMapped: false, fog: false });
    var catMesh = new T.Mesh(new T.PlaneGeometry(1, 1), catMat); catMesh.visible = false; cat.add(catMesh);
    k.image('../../scarletsands/assets/gen/cat-sit.png', function (t, img) {
      catMat.map = t; catMat.needsUpdate = true;
      var hh = 1.15; catMesh.scale.set(hh * img.width / img.height, hh, 1); catMesh.position.y = hh / 2; catMesh.visible = true;
    });
    (function () { var probe = new Image(); probe.onerror = function () { oldCat(); }; probe.src = '../../scarletsands/assets/gen/cat-sit.png'; })();
    function oldCat() {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'), w = img.width, h = img.height, pad = 18; c.width = w + pad; c.height = h;
        var g = c.getContext('2d'); g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'destination-out';
        var gr = g.createLinearGradient(w - 26, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
        g.fillStyle = gr; g.fillRect(w - 26, 0, 26 + pad, h);
        var t = new T.CanvasTexture(c); if (T.sRGBEncoding && !k.premium) t.encoding = T.sRGBEncoding;
        catMat.map = t; catMat.needsUpdate = true;
        var hh = 1.05; catMesh.scale.set(hh * c.width / h, hh, 1); catMesh.position.y = hh / 2; catMesh.visible = true;
      };
      img.src = '../../scarletsands/assets/mascot-3.png';
    }
    cat.position.set(camp.position.x + 1.0, camp.position.y, camp.position.z + 2.8); scene.add(cat);
    k.onFrame(function () { catMesh.rotation.y = Math.atan2(k.camera.position.x - cat.position.x, k.camera.position.z - cat.position.z); });

    // ---------- точки тропы ----------
    var flagTex = k.tex(128, 80, function (g, W, Hh) { g.fillStyle = '#c4002e'; g.fillRect(0, 0, W, Hh); g.fillStyle = 'rgba(0,0,0,.18)'; for (var j = 0; j < W; j += 6) g.fillRect(j, 0, 1, Hh); g.strokeStyle = '#e4b473'; g.lineWidth = 4; g.strokeRect(4, 4, W - 8, Hh - 8); g.fillStyle = '#e4b473'; g.save(); g.translate(W / 2, Hh / 2); g.beginPath(); for (var s2 = 0; s2 < 8; s2++) { var an = s2 * Math.PI / 4, rr = s2 % 2 ? 6 : 18; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.restore(); }, HQ);
    function find(key, num) {
      var p = WAY[key], g = new T.Group(); at(g, p[0], p[1], 0);
      var cairn = new T.Group(); g.add(cairn);
      [[0, 0.18, 0.44, 0.75], [0.05, 0.5, 0.34, 0.8], [-0.03, 0.76, 0.24, 0.85], [0.02, 0.95, 0.15, 0.9]].forEach(function (c, j) { var s = new T.Mesh(new T.DodecahedronGeometry(c[2], 1), rock); s.scale.set(1, c[3] * 0.72, 1); s.position.set(c[0], c[1], 0); s.rotation.set(j, j * 2, 0); cairn.add(s); });
      var pl = new T.Mesh(new T.CylinderGeometry(0.03, 0.035, 2.1, 8), wood); pl.position.set(0.34, 1.05, 0); g.add(pl);
      var finial = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), gold); finial.position.set(0.34, 2.12, 0); g.add(finial);
      var flagMat = new T.MeshStandardMaterial({ map: flagTex, side: T.DoubleSide, roughness: 0.7, emissive: 0xffffff, emissiveMap: flagTex, emissiveIntensity: 0.2 });
      var flag = new T.Mesh(new T.PlaneGeometry(0.85, 0.53, 10, 3), flagMat); flag.position.set(0.78, 1.78, 0); g.add(flag);
      var fp = flag.geometry.attributes.position, fx0 = [];
      for (var j = 0; j < fp.count; j++) fx0.push(fp.getX(j));
      var lan = brassLantern(1); lan.g.position.set(-0.5, 0, 0.32); g.add(lan.g);
      var spill = k.glow(0xffa040, 4.2); spill.position.set(0, 0.15, 0.2); spill.material.opacity = 0; g.add(spill);
      var ring = new T.Mesh(new T.RingGeometry(1.25, 1.42, 48), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
      return { key: key, g: g, flag: flag, flagMat: flagMat, fp: fp, fx0: fx0, lan: lan, spill: spill, ring: ring, lit: 0, target: 0, labY: 2.6, hover: 0 };
    }
    var pawTex = k.tex(128, 128, function (gg, w) {
      gg.fillStyle = '#fff'; gg.beginPath(); gg.ellipse(64, 80, 26, 21, 0, 0, TAU); gg.fill();
      [[32, 48], [52, 32], [76, 32], [96, 48]].forEach(function (q) { gg.beginPath(); gg.ellipse(q[0], q[1], 11, 13, 0, 0, TAU); gg.fill(); });
    }, HQ);
    function paw(key, num) {
      var p = WAY[key] || PAWS[key], g = new T.Group(); at(g, p[0], p[1], 0.05);
      var mat = new T.MeshBasicMaterial({ map: pawTex, color: 0x6a1a2a, transparent: true, depthWrite: false });
      var m = new T.Mesh(new T.PlaneGeometry(1.1, 1.1), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = num * 0.7; g.add(m);
      var gl = k.glow(B.crimson, 2.4); gl.position.y = 0.3; gl.material.opacity = 0; g.add(gl);
      var hit = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.6, 10), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 0.3; g.add(hit);
      return { key: key, g: g, pawMat: mat, gl: gl, lit: 0, target: 0, labY: 1.0, paw: true, hover: 0, ring: null };
    }
    // пальма: изогнутый ствол из колец (Tube) + листья-перья с прожилками (прозрачная канва)
    var leafTex = k.tex(256, 64, function (g, W, Hh) {
      g.clearRect(0, 0, W, Hh); g.fillStyle = '#2aa050';
      for (var j = 0; j < 36; j++) { var x = 10 + j * (W - 20) / 36, len = Hh * 0.48 * Math.sin((j + 2) / 38 * Math.PI); g.save(); g.translate(x, Hh / 2); [-1, 1].forEach(function (s2) { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, s2 * len * 0.6, 12, s2 * len); g.lineTo(9, s2 * len); g.quadraticCurveTo(3, s2 * len * 0.5, 0, 0); g.fill(); }); g.restore(); }
      g.strokeStyle = '#b8e070'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(4, Hh / 2); g.lineTo(W - 4, Hh / 2); g.stroke();
    }, HQ);
    var leafMat = new T.MeshStandardMaterial({ map: leafTex, transparent: true, alphaTest: 0.3, side: T.DoubleSide, roughness: 0.6, emissive: 0x0a4a1e, emissiveMap: leafTex, emissiveIntensity: 0.5 });
    var trunkTex = k.tex(64, 256, function (g, W, Hh) { g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, W, Hh); for (var j = 0; j < 22; j++) { var y = j * Hh / 22; g.fillStyle = 'rgba(30,14,6,.5)'; g.fillRect(0, y, W, 3); g.fillStyle = 'rgba(200,150,100,.25)'; g.fillRect(0, y + 4, W, 3); } });
    trunkTex.wrapS = trunkTex.wrapT = T.RepeatWrapping;
    var trunkMat = new T.MeshStandardMaterial({ map: trunkTex, roughness: 0.9, emissive: 0x3a1a0a, emissiveMap: trunkTex, emissiveIntensity: 0.3 });
    function palm(h, lean, rotY) {
      var g = new T.Group(), pts = [];
      for (var j = 0; j <= 8; j++) { var tj = j / 8; pts.push(new T.Vector3(Math.sin(tj * 1.4) * lean, tj * h, 0)); }
      var cv = new T.CatmullRomCurve3(pts), tube = new T.Mesh(new T.TubeGeometry(cv, 24, 0.13, 10), trunkMat); g.add(tube);
      var top = cv.getPoint(1);
      for (j = 0; j < 9; j++) {
        var lg = new T.PlaneGeometry(2.2, 0.55, 10, 1), lp = lg.attributes.position;
        for (var q = 0; q < lp.count; q++) { var lx = lp.getX(q) + 1.1; lp.setX(q, lx); lp.setY(q, lp.getY(q) * (1 - lx / 2.6)); lp.setZ(q, lx * lx * 0.18); }
        lg.rotateX(Math.PI / 2); lg.computeVertexNormals();
        var leaf = new T.Mesh(lg, leafMat), hold = new T.Group(); hold.position.copy(top); hold.rotation.y = j / 9 * TAU + rotY; leaf.rotation.z = 0.25 - (j % 3) * 0.12; hold.add(leaf); g.add(hold);
      }
      for (j = 0; j < 4; j++) { var nut = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), new T.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7 })); nut.position.set(top.x + Math.cos(j * 1.6) * 0.14, top.y - 0.12, Math.sin(j * 1.6) * 0.14); g.add(nut); }
      g.rotation.y = rotY; return g;
    }
    function oasis() {
      var p = WAY.oasis, g = new T.Group(); at(g, p[0], p[1], 0);
      // вода: зеркало (Reflector) + тонкий тёмно-бирюзовый слой; ночью в ней отражаются пальмы, фонари и небо
      var shape = new T.CircleGeometry(2.4, 48); shape.scale(1, 0.7, 1);
      var waterTop = new T.Mesh(shape.clone(), new T.MeshStandardMaterial({ color: 0x0a3a5a, emissive: 0x18c8e0, emissiveIntensity: 0.06, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.55 }));
      waterTop.rotation.x = -Math.PI / 2; waterTop.position.y = 0.08; g.add(waterTop);
      var mir = k.mirror(shape.clone(), { res: mobile ? 256 : 512, color: 0x7a8aa0, hide: [waterTop] });
      if (mir) { mir.rotation.x = -Math.PI / 2; mir.position.y = 0.06; g.add(mir); }
      var shoreT = k.tex(256, 32, function (gg, W, Hh) { gg.fillStyle = '#2a7a40'; gg.fillRect(0, 0, W, Hh); for (var j = 0; j < 500; j++) { gg.fillStyle = Math.random() < 0.5 ? 'rgba(120,220,120,.4)' : 'rgba(10,40,20,.5)'; gg.fillRect(Math.random() * W, Math.random() * Hh, 1.5, 3); } });
      shoreT.wrapS = T.RepeatWrapping; shoreT.repeat.x = 8;
      var shoreG = new T.RingGeometry(2.3, 3.1, 64, 2); shoreG.scale(1, 0.7, 1);
      var shore = new T.Mesh(shoreG, new T.MeshStandardMaterial({ map: shoreT, roughness: 0.9, side: T.DoubleSide, emissive: 0x0a3a1a, emissiveMap: shoreT, emissiveIntensity: 0.4 })); shore.rotation.x = -Math.PI / 2; shore.position.y = 0.05; g.add(shore);
      for (var j = 0; j < 10; j++) { var aj = j / 10 * TAU + 0.3, rr = new T.Mesh(new T.DodecahedronGeometry(rnd(0.12, 0.22), 1), rock); rr.scale.y = 0.6; rr.position.set(Math.cos(aj) * 2.5, 0.08, Math.sin(aj) * 1.75); g.add(rr); }
      var palms = [];
      [[-2.4, -0.7, 3.4, 0.8, 0.3], [2.6, -0.3, 3.9, -0.9, 2.1], [1.3, -1.8, 2.8, 0.5, 4], [-1.3, 1.6, 2.4, -0.4, 1]].forEach(function (q) {
        var pg = palm(q[2], q[3], q[4]); pg.position.set(q[0], 0, q[1]); g.add(pg); palms.push(pg);
      });
      var lanterns = [];
      for (j = 0; j < 8; j++) { var a = j / 8 * TAU, lb = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), glowMat(new T.Color(j % 2 ? 1 : 0.4, j % 2 ? 0.85 : 0.95, j % 2 ? 0.4 : 1))); lb.position.set(Math.cos(a) * 2.85, 0.28, Math.sin(a) * 2.0); g.add(lb); var lgw = k.glow(j % 2 ? B.gold : 0x5ae8ff, 1.0); lgw.position.copy(lb.position); lgw.material.opacity = 0; g.add(lgw); lanterns.push({ m: lb, gl: lgw }); }
      var wglow = k.glow(0x3ae0ff, 7); wglow.position.y = 0.3; wglow.material.opacity = 0; g.add(wglow);
      var wLight = new T.PointLight(0x3ae0ff, 0, 9, 1.6); wLight.position.y = 1.2; g.add(wLight);
      var ring = new T.Mesh(new T.RingGeometry(3.2, 3.4, 64), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; g.add(ring);
      return { key: 'oasis', g: g, water: waterTop.material, lanterns: lanterns, wglow: wglow, wLight: wLight, ring: ring, lit: 0, target: 0, labY: 4.4, hover: 0 };
    }
    // Golden Compass — главный герой: постамент из песчаника с золотым поясом, корпус-Lathe из золота,
    // циферблат с гравированной розой ветров (без букв), стрелка, четыре алых камня, стеклянный купол
    function compass() {
      var p = WAY.super, g = new T.Group(); at(g, p[0], p[1], 0);
      var pedT = blocks({ base: '#9a5a3a', joint: 'rgba(40,10,6,.5)', rows: 4, cols: 6, w: 512, h: 128, glyphs: 2 });
      var ped = new T.Mesh(new T.CylinderGeometry(0.72, 0.92, 1.0, 8), stoneMat(pedT, null, 0xe0b8a0, 0.32)); ped.position.y = 0.5; g.add(ped);
      var band = new T.Mesh(new T.TorusGeometry(0.76, 0.045, 8, 48), gold); band.rotation.x = Math.PI / 2; band.position.y = 0.92; g.add(band);
      var cg = new T.Group(); cg.position.y = 1.75; g.add(cg);
      var body = new T.Mesh(new T.LatheGeometry([[0, -0.1], [0.5, -0.1], [0.62, -0.05], [0.66, 0.02], [0.62, 0.08], [0.56, 0.1]].map(function (q) { return new T.Vector2(q[0], q[1]); }), 48), gold);
      body.rotation.x = Math.PI / 2; cg.add(body);
      var faceT = k.tex(512, 512, function (gg, W) {
        var c = W / 2; var bg = gg.createRadialGradient(c, c, 0, c, c, c); bg.addColorStop(0, '#fbf1da'); bg.addColorStop(1, '#d8bf8a'); gg.fillStyle = bg; gg.fillRect(0, 0, W, W);
        gg.strokeStyle = '#8a5a1a'; for (var j = 0; j < 72; j++) { var a = j / 72 * TAU, r0 = c * (j % 6 ? 0.88 : 0.82); gg.lineWidth = j % 6 ? 1.5 : 3; gg.beginPath(); gg.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); gg.lineTo(c + Math.cos(a) * c * 0.94, c + Math.sin(a) * c * 0.94); gg.stroke(); }
        [0.94, 0.8, 0.42].forEach(function (r) { gg.lineWidth = 2.5; gg.beginPath(); gg.arc(c, c, c * r, 0, TAU); gg.stroke(); });
        // роза ветров: 8 лучей, тонированные половинки — гравировка без букв
        for (j = 0; j < 8; j++) {
          var an = j / 8 * TAU - Math.PI / 2, L = c * (j % 2 ? 0.5 : 0.76), wdt = c * (j % 2 ? 0.07 : 0.1);
          [-1, 1].forEach(function (s2) { gg.beginPath(); gg.moveTo(c, c); gg.lineTo(c + Math.cos(an + s2 * Math.PI / 2) * wdt, c + Math.sin(an + s2 * Math.PI / 2) * wdt); gg.lineTo(c + Math.cos(an) * L, c + Math.sin(an) * L); gg.closePath(); gg.fillStyle = s2 > 0 ? (j === 0 ? '#c4002e' : '#b07a2a') : (j === 0 ? '#8a0020' : '#e8c070'); gg.fill(); });
        }
        for (j = 0; j < 16; j++) { var a2 = j / 16 * TAU; gg.fillStyle = '#8a5a1a'; gg.beginPath(); gg.arc(c + Math.cos(a2) * c * 0.61, c + Math.sin(a2) * c * 0.61, 4, 0, TAU); gg.fill(); }
      }, HQ);
      var face = new T.Mesh(new T.CircleGeometry(0.54, 48), new T.MeshStandardMaterial({ map: faceT, roughness: 0.45, metalness: 0.2, emissive: 0xffffff, emissiveMap: faceT, emissiveIntensity: 0.22 })); face.position.z = 0.1; cg.add(face);
      // gen: гравированный циферблат compass-face.png (batch 2, абстрактные глифы без букв) — кроп по внутреннему ободу
      genTex('../../scarletsands/assets/gen/compass-face.png', function (t) { t.repeat.set(0.74, 0.74); t.offset.set(0.13, 0.13); face.material.map = t; face.material.emissiveMap = t; face.material.emissiveIntensity = 0.3; face.material.needsUpdate = true; });
      var back = new T.Mesh(new T.CircleGeometry(0.6, 48), gold); back.rotation.y = Math.PI; back.position.z = -0.1; cg.add(back);
      var needleG = new T.Group(); needleG.position.z = 0.13; cg.add(needleG);
      var nN = new T.Mesh(new T.ConeGeometry(0.06, 0.46, 4), new T.MeshStandardMaterial({ color: B.cta, emissive: B.cta, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 })); nN.position.y = 0.23; nN.scale.z = 0.35; needleG.add(nN);
      var nS = new T.Mesh(new T.ConeGeometry(0.06, 0.4, 4), gold); nS.position.y = -0.2; nS.rotation.z = Math.PI; nS.scale.z = 0.35; needleG.add(nS);
      var hub = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), gold); needleG.add(hub);
      var dome = new T.Mesh(new T.SphereGeometry(0.56, 32, 12, 0, TAU, 0, Math.PI / 2.6), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.4, envMapIntensity: 2, depthWrite: false }));
      dome.rotation.x = Math.PI / 2; dome.position.z = 0.04; cg.add(dome);
      var gems = new T.MeshStandardMaterial({ color: 0xff2058, emissive: 0x9a0020, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.12, envMapIntensity: 2 });
      for (var j = 0; j < 4; j++) { var aj = j / 4 * TAU + Math.PI / 4, gm = new T.Mesh(new T.OctahedronGeometry(0.07, 0), gems); gm.position.set(Math.cos(aj) * 0.64, Math.sin(aj) * 0.64, 0.04); cg.add(gm); }
      var bow = new T.Mesh(new T.TorusGeometry(0.12, 0.03, 8, 20), gold); bow.position.y = 0.72; cg.add(bow);
      var lockG = new T.Group(); g.add(lockG);
      var lockBody = new T.Mesh(new T.BoxGeometry(0.42, 0.34, 0.16), new T.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.8, roughness: 0.35 })); lockBody.position.set(0, 1.12, 0.95); lockG.add(lockBody);
      var shack = new T.Mesh(new T.TorusGeometry(0.14, 0.04, 8, 16, Math.PI), lockBody.material); shack.position.set(0, 1.29, 0.95); lockG.add(shack);
      var gl = k.glow(B.gold, 3.6); gl.position.y = 1.75; gl.material.opacity = 0.15; g.add(gl);
      var cLight = new T.PointLight(0xffc860, 0, 10, 1.6); cLight.position.set(0, 2.6, 1.2); g.add(cLight);
      // столб света от звезды на компас (мягкий аддитивный конус) + искры по дорожке к звезде
      var beamT = k.tex(64, 256, function (gg, W, Hh) { var gr = gg.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,220,150,0)'); gr.addColorStop(0.5, 'rgba(255,230,170,.9)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, W, Hh); var v = gg.createLinearGradient(0, 0, 0, Hh); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.8, 'rgba(0,0,0,0)'); gg.globalCompositeOperation = 'destination-out'; gg.fillStyle = v; gg.fillRect(0, 0, W, Hh); });
      var shaft = new T.Mesh(new T.CylinderGeometry(0.25, 1.4, 9, 24, 1, true), new T.MeshBasicMaterial({ map: beamT, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
      shaft.position.y = 5.6; g.add(shaft);
      var from = g.position.clone().add(new T.Vector3(0, 1.75 * 1.45, 0)), beam = [];
      for (j = 0; j < 30; j++) { var sp2 = k.glow(j % 3 ? 0xffe08a : 0xffffff, 1); sp2.material.fog = false; sp2.material.opacity = 0; scene.add(sp2); beam.push(sp2); }
      beam.from = from; beam.to = nstar.position.clone();
      var ring = new T.Mesh(new T.RingGeometry(1.4, 1.58, 48), new T.MeshBasicMaterial({ color: B.crimson, transparent: true, opacity: 0, side: T.DoubleSide, fog: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
      g.scale.setScalar(1.45);
      return { key: 'super', g: g, cg: cg, needle: needleG, gold: gold, gems: gems, gl: gl, cLight: cLight, shaft: shaft, beam: beam, lockG: lockG, ring: ring, lit: 0, target: 0, labY: 3.1, hover: 0 };
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
    campO.lab = k.label(camp, [-2.6, 3.9, 0], '', function () { if (S.onSelect) S.onSelect('training', 't'); });
    k.pick(tentG, function () { if (S.onSelect) S.onSelect('training', 't'); }, function (on) { campO.hover = on ? 1 : 0; });
    S.obj.t = campO;

    // лёгкий иней в воздухе (Рождество в пустыне)
    k.snow({ n: 420, area: [46, 16, 50], center: [0, 0, -14], speed: 0.45, size: 0.12, opacity: 0.6, color: 0xdfe6ff });

    // ---------- анимация ----------
    var dbgOn = k.debug('info');
    k.onFrame(function (t, dt) { try { frameFn(t, dt); } catch (e) { if (dbgOn) box.setAttribute('data-err', String(e && e.stack || e).slice(0, 300)); throw e; } });
    function frameFn(t, dt) {
      S.t = t;
      var f = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
      fire.intensity = 1.7 * f; fireGlow.material.opacity = 0.7 * f; tentLight.intensity = 0.55 + 0.1 * Math.sin(t * 9);
      for (var j = 0; j < SPN; j++) {
        var sv = spV[j]; sv.life += dt; if (sv.life > 1.6) { sv.life = 0; sv.vx = rnd(-0.25, 0.25); sv.vz = rnd(-0.25, 0.25); sv.vy = rnd(0.8, 1.6); }
        spPos[j * 3] = sv.vx * sv.life + Math.sin(t * 3 + j) * 0.05; spPos[j * 3 + 1] = 0.3 + sv.vy * sv.life; spPos[j * 3 + 2] = sv.vz * sv.life;
      }
      spGeo.attributes.position.needsUpdate = true; sparks.material.opacity = 0.9;
      campBulbs.forEach(function (b, j) { var v = 0.7 + 0.3 * Math.sin(t * 2.2 + j * 1.3); b.material.color.setRGB(v, v * 0.86, v * 0.55); });
      tLights.forEach(function (b, j) { var v = 0.55 + 0.45 * Math.sin(t * 3 + j * 2.1); b.material.color.setRGB(v, v * 0.9, v * 0.6); });
      tstarG.material.opacity = 0.7 + 0.3 * Math.sin(t * 3);
      var tw = 0.92 + 0.08 * Math.sin(t * 1.3);
      nstar.material.rotation = Math.sin(t * 0.2) * 0.04; nstar.scale.setScalar(19 * tw * (1 + 0.15 * S.prog)); nhalo.material.opacity = 0.12 + 0.18 * S.prog;
      twinkle.material.opacity = 0.65 + 0.35 * Math.sin(t * 1.7);
      frost.material.opacity = 0.55 + 0.45 * Math.sin(t * 2.3);
      campLamp.flame.material.uniforms.uI.value = 0.9;
      // следы на тропе
      var fc = fpGeo.attributes.color, recol = false;
      steps.forEach(function (s, j) {
        var on = s.u <= S.trailU ? 1 : 0; s.on += (on - s.on) * Math.min(1, dt * 3);
        var e = s.on * 0.85 * (0.6 + 0.4 * Math.sin(t * 3 - s.u * 30));
        glCol[j * 3] = cGold.r * e; glCol[j * 3 + 1] = cGold.g * e; glCol[j * 3 + 2] = cGold.b * e;
        var L = s.on > 0.5 ? 1 : 0;
        if (L !== s.lit) { s.lit = L; recol = true; var c2 = L ? cGold : cDark; for (var q = 0; q < FS * 3; q++) fc.setXYZ(j * FS * 3 + q, c2.r, c2.g, c2.b); }
      });
      glGeo.attributes.color.needsUpdate = true; if (recol) fc.needsUpdate = true;
      Object.keys(S.obj).forEach(function (key) {
        var o = S.obj[key]; o.lit += (o.target - o.lit) * Math.min(1, dt * 2.4);
        var cur = S.current === key;
        if (o.ring) { o.ring.material.opacity += ((cur ? 0.9 : o.hover ? 0.45 : o.ready ? 0.28 + 0.18 * Math.sin(t * 3) : 0) - o.ring.material.opacity) * Math.min(1, dt * 6); o.ring.scale.setScalar(1 + Math.sin(t * 3) * 0.03); }
        if (o.flag) {
          o.flag.visible = o.state !== 'locked';
          o.flagMat.color.setHex(o.state === 'miss' ? 0x6a7aa8 : 0xffffff); o.flagMat.emissiveIntensity = o.state === 'miss' ? 0.05 : 0.2 + o.lit * 0.15;
          for (var j2 = 0; j2 < o.fp.count; j2++) { var x0 = o.fx0[j2] + 0.42; o.fp.setZ(j2, Math.sin(t * 4 + x0 * 5 + o.g.position.z) * 0.08 * x0); }
          o.fp.needsUpdate = true;
          var on2 = o.lit * (0.9 + 0.1 * Math.sin(t * 9 + o.g.position.x));
          o.lan.flame.visible = o.lit > 0.05; o.lan.flame.material.uniforms.uI.value = 0.95 * o.lit;
          o.lan.glass.emissiveIntensity = on2 * 0.9; o.lan.glow.material.opacity = on2 * 0.9; o.spill.material.opacity = o.lit * 0.42;
          o.g.scale.setScalar(1 + o.hover * 0.06);
        }
        if (o.paw) {
          o.pawMat.color.setHex(o.state === 'locked' ? 0x4a1424 : o.lit > 0.5 ? 0xffd34a : B.crimson);
          o.pawMat.opacity = o.state === 'locked' ? 0.5 : 0.95;
          o.gl.material.opacity = o.lit * (0.6 + 0.3 * Math.sin(t * 2.5 + o.g.position.x)) + (o.state === 'ready' ? 0.25 : 0);
          o.g.scale.setScalar(1 + o.hover * 0.12);
        }
        if (o.water) {
          o.water.emissiveIntensity = 0.06 + o.lit * (0.5 + 0.1 * Math.sin(t * 1.8));
          o.wglow.material.opacity = o.lit * 0.38; o.wLight.intensity = o.lit * 1.4;
          o.lanterns.forEach(function (l, j3) { var v = o.lit * (0.6 + 0.4 * Math.sin(t * 2 + j3)); l.gl.material.opacity = v; l.m.visible = o.lit > 0.05; });
        }
        if (o.cg) {
          o.cg.rotation.y = Math.sin(t * 0.5) * 0.7 + t * 0.25 * o.lit; o.cg.position.y = 1.75 + Math.sin(t * 1.5) * 0.08 * (0.3 + o.lit);
          o.needle.rotation.z = Math.sin(t * 0.9) * 0.4 * (1 - o.lit) + Math.sin(t * 3) * 0.05;
          o.gems.emissiveIntensity = 0.5 + o.lit * 1.2;
          o.gl.material.opacity = 0.18 + o.lit * 0.7; o.cLight.intensity = 0.4 + o.lit * 1.6;
          o.shaft.material.opacity = o.lit * (0.32 + 0.06 * Math.sin(t * 1.4));
          o.beam.forEach(function (b, j4) { var u = ((j4 / o.beam.length) + t * 0.06) % 1; b.position.lerpVectors(o.beam.from, o.beam.to, u); b.scale.setScalar(0.5 + u * 1.8); b.material.opacity = o.lit * Math.sin(u * Math.PI) * 0.85; });
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
  // Попытки = латунные фонари (промах гасит один), найдено = штамп «Found»: золото с 1-й попытки, серебро со 2-й,
  // бронза с 3-й (утв. 23.11). Только вид: логика попыток и призы не меняются; номер попытки = max − tries.
  function grade(t) {
    if (!t || !t.done) return null;
    var used = (t.max || 0) - (t.tries || 0);
    return used <= 1 ? 'gold' : used === 2 ? 'silver' : 'bronze';
  }
  function lantern(on) {
    var b = on ? '#E9B949' : '#6E5232', g = on ? '#FFD66B' : '#26140F';
    return '<svg viewBox="0 0 12 16" aria-hidden="true"><circle cx="6" cy="2.2" r="1.5" fill="none" stroke="' + b + '" stroke-width=".9"/>' +
      '<path d="M3.2 3.9h5.6l1.1 1.5H2.1z" fill="' + b + '"/><rect x="2.6" y="5.4" width="6.8" height="7.4" rx="1.7" fill="' + g + '" stroke="' + b + '" stroke-width=".9"/>' +
      (on ? '<path d="M6 7.1c1.2 1.3 1.2 2.7 0 3.9c-1.2-1.2-1.2-2.6 0-3.9z" fill="#FF7A1A"/>' : '') +
      '<path d="M2.1 12.8h7.8l-1 1.7H3.1z" fill="' + b + '"/></svg>';
  }
  function lanterns(t) {
    var h = '', max = t && t.max || 0, left = t && t.tries || 0;
    for (var i = 0; i < max; i++) h += '<i class="' + (i < left ? 'on' : '') + '">' + lantern(i < left) + '</i>';
    return '<span class="s3l" title="' + left + ' of ' + max + ' tries left">' + h + '</span>';
  }
  function stampHtml(t, word) { var g = grade(t); return '<span class="s3s ' + g + '" title="' + g + ' stamp">' + (word || 'Found') + '</span>'; }
  function small(t, key, ch) {
    var s = state(t);
    if (s === 'lit') return stampHtml(t, key[0] === 'c' ? 'Paw' : 'Found');
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
    return lanterns(t);
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
    var tasks = v && v.tasks || [];
    ['s1', 's2', 's3', 's4', 's5', 's6'].forEach(function (key, i) {
      var t = tasks.filter(function (x) { return x.slot === key; })[0] || tasks[i] || null;
      var o = S.obj[key], st = v ? state(t) : 'locked';
      o.state = st; o.target = st === 'lit' ? 1 : 0; o.ready = st === 'ready';
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
      setLab(o, q[1], v ? small(t, q[0]) : q[0] === 'oasis' ? 'Dec 26 · 11 AM ET' : 'Dec 26', st, q[1]);
    });
    var ts = tv ? state(tv.target) : 'ready', camp = S.obj.t;
    camp.state = ts; camp.target = ts === 'lit' ? 1 : 0;
    setLab(camp, 'Camp', ts === 'lit' ? 'practice done' : 'practice page', ts, 'Camp: practice page');
    var order = ['s1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'], reach = 'camp';
    for (var i = 0; i < order.length; i++) { var st2 = S.obj[order[i]].state; if (st2 === 'lit' || st2 === 'miss') reach = order[i]; else break; }
    var keys = ['camp', 's1', 's2', 's3', 's4', 's5', 's6', 'oasis', 'super'];
    S.trailU = reach === 'camp' ? 0 : keys.indexOf(reach) / (keys.length - 1) + 0.002;
    S.prog = v && v.progress ? Math.min(1, (v.progress.stamps || 0) / 10 + (v.progress.golden ? 0.3 : 0)) : 0;
    if (prev && S.current && prev !== S.current) S.focus = S.current;
    apply(S);
    return S;
  }
  function setLab(o, title, sub, st, aria) {
    o.lab.set(title + '<small>' + sub + '</small>');
    var plain = sub.indexOf('<') < 0 ? sub : (sub.match(/title="([^"]+)"/) || [0, ''])[1]; // фонари/штамп → текст из title
    o.lab.el.setAttribute('aria-label', aria + ': ' + plain);
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
        S.k.look([p.x * 0.35, p.y + (tall ? 11 : 5.5), p.z + far], [p.x * 0.7, p.y + 1.0, p.z - 2], 1.5);
      }
      S.allBtn.hidden = false;
    } else if (S.camKey !== 'all') { S.camKey = 'all'; S.k.look(S.frame.pos, S.frame.look, 1.4); S.allBtn.hidden = true; }
  }

  window.NorthStar3D = { render: render, supported: supported };
})();
