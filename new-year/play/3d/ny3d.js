/**
 * NY3D — общее 3D-ядро рождественских ивентов (все бренды). Three.js из vendor/ (тот же, что в Witching Hours).
 * Ядро только рисует: свет, свечение (bloom), снег, подписи-кнопки поверх сцены, клики по объектам, камера, экономия
 * на слабых телефонах. Сцену бренда строит его файл (stormrush/mechanic/client/street3d.js и т. п.).
 *
 *   var k = NY3D.create(box, { bg: 0x05080a, fog: [0x05080a, 30, 70], bloom: [strength, radius, threshold], cam: { pos:[x,y,z], look:[x,y,z], fov } })
 *   k === null → WebGL недоступен, бренд показывает свой 2D-вариант.
 *
 *   k.T, k.scene, k.camera, k.renderer, k.mobile, k.reduced
 *   k.tex(w, h, draw(g, W, H))          CanvasTexture
 *   k.image(url, cb(texture, img))      картинка бренда (PNG с прозрачностью) → текстура
 *   k.billboard(url, height, opts)      плоская фигура персонажа, всегда лицом к камере по Y (opts.bob — покачивание)
 *   k.glow(color, size)                 мягкая светящаяся точка (Sprite)
 *   k.snow({ n, area:[w,h,d], speed })  падающий снег
 *   k.label(obj, offset[x,y,z], html, onClick) → { el, set(html), cls(name, on), hide(on) }   HTML-кнопка над объектом
 *   k.pick(obj, onClick, onHover)       объект кликабелен (луч от курсора, курсор-рука)
 *   k.onFrame(fn(t, dt))                анимация сцены
 *   k.look(pos, target, sec)            плавно перевести камеру
 *   k.parallax(amount)                  лёгкое смещение камеры за курсором (0 — выкл.)
 *   k.dispose()
 */
window.NY3D = (function () {
  'use strict';
  var TAU = Math.PI * 2;

  function supported() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
  }

  function create(box, opts) {
    opts = opts || {};
    var T = window.THREE;
    if (!T || !supported()) return null;
    var dbg = (location.search.match(/[?&]ny3d=([\w,]+)/) || [])[1] || '';
    // ПРЕМИУМ (opts.premium) — конвейер зала Witching Hours (hall3d.js), который Александр считает эталоном:
    // линейный вывод без тон-маппинга, hex = ровно тот цвет, что задан (legacy), bloom 0.95/0.55/0.55 на 0.7 разрешения,
    // без MSAA (края сглаживает PR ≥ 1.25), текстуры без перекодировки. Плюс k.mirror / k.flame / k.panorama ниже.
    var premium = !!opts.premium && dbg.split(',').indexOf('nopremium') < 0;
    // обычный режим: hex-цвета брендов = sRGB (16.11, по CoinsMania); старый вид — ?ny3d=legacy
    if (T.ColorManagement && 'legacyMode' in T.ColorManagement) T.ColorManagement.legacyMode = premium || /[?&]ny3d=[\w,]*legacy/.test(location.search);
    var mobile = Math.min(window.innerWidth, window.innerHeight) < 600 || /Mobi|Android/i.test(navigator.userAgent);
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    box.classList.add('ny3d');
    var canvas = document.createElement('canvas');
    canvas.className = 'ny3d-canvas';
    var overlay = document.createElement('div');
    overlay.className = 'ny3d-overlay';
    box.appendChild(canvas); box.appendChild(overlay);

    var renderer;
    var wantBloom = T.EffectComposer && T.RenderPass && T.UnrealBloomPass && dbg.indexOf('nobloom') < 0 && (premium ? opts.bloom !== false : (opts.bloom || dbg.indexOf('bloom') >= 0));
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !(premium && wantBloom), alpha: false, powerPreference: premium ? 'default' : 'high-performance' }); } catch (e) { box.removeChild(canvas); box.removeChild(overlay); return null; }
    if (!premium) {
      if ('outputEncoding' in renderer && T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = opts.exposure || 1.05;
    }
    var bg = new T.Color(opts.bg != null ? opts.bg : 0x05080a);
    renderer.setClearColor(bg, 1);

    var scene = new T.Scene();
    scene.background = bg;
    if (opts.fogExp) scene.fog = new T.FogExp2(opts.fogExp[0], opts.fogExp[1]); // [цвет, плотность] — как в зале WH
    else if (opts.fog) scene.fog = new T.Fog(opts.fog[0], opts.fog[1], opts.fog[2]);
    var cam = opts.cam || {};
    var camera = new T.PerspectiveCamera(cam.fov || 40, 2, 0.1, 400);
    var camPos = new T.Vector3().fromArray(cam.pos || [0, 6, 22]);
    var camLook = new T.Vector3().fromArray(cam.look || [0, 2, 0]);
    var camFrom = null, lookFrom = null, camTo = null, lookTo = null, camT = 1, camDur = 1;
    camera.position.copy(camPos); camera.lookAt(camLook);

    // окружение для металла/стекла: мягкая «комната» из цветных панелей (как в hall3d.js)
    if (opts.env !== false) try {
      var env = new T.Scene(), envCols = opts.env || [0x2a3a50, 0xffd9a0, 0x9fd8ff, 0x101820];
      if (premium && envCols.length === 5) {
        // раскладка зала WH: слева, справа, сверху, сзади, пол — с теми же яркостями (даёт «дорогие» блики на золоте/хроме)
        env.background = new T.Color(0x070405);
        [[1.5, 10, 2, -8, 2, 3], [1.2, 10, 2, 8, 2, 3], [1.0, 12, 3, 0, 10, 5], [1.2, 14, 6, 0, 4, -12], [0.8, 30, 4, 0, -2, 0]].forEach(function (p, i) {
          var m = new T.Mesh(new T.PlaneGeometry(p[1], p[2]), new T.MeshBasicMaterial({ color: new T.Color(envCols[i]).multiplyScalar(p[0]), side: T.DoubleSide }));
          m.position.set(p[3], p[4], p[5]); m.lookAt(0, 0, 0); env.add(m);
        });
      } else envCols.forEach(function (c, i) {
        var m = new T.Mesh(new T.PlaneGeometry(10, 10), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
        var a = (i / envCols.length) * TAU; m.position.set(Math.sin(a) * 8, i === 1 ? 6 : 0, Math.cos(a) * 8); m.lookAt(0, 0, 0); env.add(m);
      });
      var pmrem = new T.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(env, 0.04).texture;
      pmrem.dispose();
    } catch (e) { /* без окружения — просто тусклее металл */ }

    // свечение: EffectComposer + UnrealBloomPass, если файлы подключены
    var composer = null, bloom = null;
    // обычный режим: bloom выключен (с sRGB-выводом пересвечивал снег), свечение — спрайтами k.glow; ?ny3d=bloom — проба.
    // премиум: bloom включён по умолчанию с настройками зала WH (opts.bloom: false — выключить, [s, r, th] — свои)
    if (wantBloom) {
      composer = premium ? new T.EffectComposer(renderer, new T.WebGLRenderTarget(2, 2, { samples: 0 })) : new T.EffectComposer(renderer);
      composer.addPass(new T.RenderPass(scene, camera));
      var b = Array.isArray(opts.bloom) ? opts.bloom : premium ? [0.95, 0.55, 0.55] : [0.9, 0.5, 0.6];
      bloom = new T.UnrealBloomPass(new T.Vector2(premium ? 512 : 256, premium ? 512 : 256), b[0], b[1], b[2]);
      if (premium) {
        if (bloom.highPassUniforms && bloom.highPassUniforms.smoothWidth) bloom.highPassUniforms.smoothWidth.value = 0.2;
        var bloomSize = bloom.setSize.bind(bloom), BK = mobile ? 0.5 : 0.7; // размытию хватает меньшего разрешения
        bloom.setSize = function (w, h) { bloomSize(Math.max(2, Math.round(w * BK)), Math.max(2, Math.round(h * BK))); };
      }
      composer.addPass(bloom);
    }

    // ---------- размер и качество ----------
    var DPR = window.devicePixelRatio || 1;
    // премиум: как в зале WH — на мониторах ×1.25..1.5 вместо MSAA, на телефонах до 1.5
    var PR = premium ? (mobile ? Math.min(DPR, 1.5) : Math.max(1.25, Math.min(DPR, 1.5))) : Math.min(DPR, mobile ? 1.5 : 1.75), W = 1, H = 1;
    var PR_MIN = premium ? Math.min(DPR, mobile ? 0.9 : 1) : 1;
    function resize() {
      var r = box.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      renderer.setPixelRatio(PR); renderer.setSize(W, H, false);
      if (composer) { if (composer.setPixelRatio) composer.setPixelRatio(PR); composer.setSize(W, H); }
      camera.aspect = W / H;
      // узкий экран — камера дальше, чтобы сцена влезла по ширине
      camera.zoom = opts.fixedZoom ? 1 : Math.min(1, (W / H) / (opts.designAspect || 16 / 9)) * (opts.zoom || 1);
      camera.zoom = Math.max(camera.zoom, opts.minZoom || 0.45);
      camera.updateProjectionMatrix();
      if (resizeFns) resizeFns.forEach(function (f) { f(W, H); });
    }
    var resizeFns = null;
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(box); else window.addEventListener('resize', resize);
    resize();
    // если кадры тяжёлые — снижаем плотность пикселей (до 1), потом выключаем bloom
    var perf = { n: 0, sum: 0, cut: 0 };
    function adapt(dt) {
      perf.n++; perf.sum += dt;
      if (perf.n < 90) return;
      var fps = perf.n / perf.sum; perf.n = 0; perf.sum = 0;
      if (fps < 40 && PR > PR_MIN) { PR = Math.max(PR_MIN, PR - 0.25); resize(); }
      else if (fps < 32 && composer && perf.cut++ > 1) { composer = null; }
    }

    // ---------- видимость: не рисуем, когда сцену не видно ----------
    var onScreen = true;
    var io = window.IntersectionObserver ? new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; }) : null;
    if (io) io.observe(box);

    // ---------- текстуры ----------
    var aniso = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    // HQ — во сколько раз канва чётче на компьютере (премиум: ×2, как «графика чётче» в WH 27.10); рисунок в логических w × h
    var HQ = premium && !mobile ? 2 : 1;
    function tex(w, h, draw, k) {
      k = k || 1;
      var c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
      var g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); draw(g, w, h);
      var t = new T.CanvasTexture(c);
      if (T.sRGBEncoding && !premium) t.encoding = T.sRGBEncoding;
      t.anisotropy = aniso;
      t.redraw = function (fn) { g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, w, h); (fn || draw)(g, w, h); t.needsUpdate = true; };
      return t;
    }
    var imgCache = {};
    function image(url, cb) {
      if (imgCache[url]) { if (imgCache[url].tex) cb(imgCache[url].tex, imgCache[url].img); else imgCache[url].wait.push(cb); return; }
      var rec = imgCache[url] = { wait: [cb] };
      var img = new Image();
      img.onload = function () {
        var t = new T.Texture(img); t.needsUpdate = true; if (T.sRGBEncoding && !premium) t.encoding = T.sRGBEncoding; t.anisotropy = aniso;
        rec.tex = t; rec.img = img; rec.wait.forEach(function (f) { f(t, img); }); rec.wait = [];
      };
      img.src = url;
    }
    var glowTex = null;
    function glow(color, size) {
      if (!glowTex) glowTex = tex(64, 64, function (g, w) {
        var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, w);
      });
      var s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: color, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      s.scale.set(size || 1, size || 1, 1);
      return s;
    }

    // ---------- премиум-детали из зала WH ----------
    // Зеркальный пол: Reflector (vendor/Reflector.js) под полупрозрачным полом. Отражение — второй рендер сцены, поэтому
    // обновляется ~30 раз/с (телефон ~15). opts: { res, color, hide:[объекты, которые не отражать — сам пол] }.
    function mirror(geometry, o) {
      o = o || {};
      if (!T.Reflector || dbg.indexOf('noreflect') >= 0) return null;
      var RS = o.res || (mobile ? 512 : 768);
      var r = new T.Reflector(geometry, { textureWidth: RS, textureHeight: RS, color: o.color != null ? o.color : 0x8a8a8a, clipBias: 0.003 });
      var at = 0, every = mobile ? 62 : 30, before = r.onBeforeRender, hide = o.hide || [];
      r.onBeforeRender = function (rr, s, c) {
        var now = performance.now(); if (!r.force && now - at < every) return; at = now; r.force = false;
        hide.forEach(function (h) { h.visible = false; }); before.call(this, rr, s, c); hide.forEach(function (h) { h.visible = true; });
      };
      return r;
    }
    // Живой огонь: шейдер пламени зала WH (fbm-шум, 3 цвета от края к сердцевине). colors — [[r,g,b] ×3] 0..1.
    var flameTime = { value: 0 }, fq = new T.Quaternion(), fqY = new T.Quaternion(), UP = new T.Vector3(0, 1, 0);
    function flame(colors, intensity) {
      var C = (colors || [[0.6, 0.1, 0.02], [1.0, 0.55, 0.1], [1.0, 0.95, 0.7]]).map(function (c) { return { value: new T.Vector3(c[0], c[1], c[2]) }; });
      var mat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false,
        uniforms: { uTime: flameTime, uI: { value: intensity || 0.6 }, uSeed: { value: Math.random() * 10 }, uC0: C[0], uC1: C[1], uC2: C[2] },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: [
          'uniform float uTime; uniform float uI; uniform float uSeed; uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; varying vec2 vUv;',
          'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
          'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }',
          'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; } return v; }',
          'void main(){ vec2 uv = vUv; float n = fbm(vec2(uv.x * 3.2 + uSeed, uv.y * 2.6 - uTime * 1.9));',
          '  float w = abs(uv.x - 0.5) * (1.7 + uv.y * 2.2); float body = (1.0 - smoothstep(0.0, 0.5, w)) * (1.0 - uv.y);',
          '  float f = clamp(body * 1.9 * (0.5 + 0.95 * n) - uv.y * 0.25, 0.0, 1.0);',
          '  vec3 col = mix(uC0, uC1, smoothstep(0.12, 0.45, f)); col = mix(col, uC2, smoothstep(0.55, 0.9, f));',
          '  float a = smoothstep(0.04, 0.32, f) * uI; gl_FragColor = vec4(col * a, a); }'
        ].join('\n')
      });
      var geo = new T.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
      var m = new T.Mesh(geo, mat); m.userData.flame = true; flames.push(m);
      return m; // плоскость 1×1 от основания вверх; масштабировать m.scale, ядро держит её лицом к камере
    }
    var flames = [];
    // Нарисованная панорама: открытый цилиндр позади сцены без тумана (как задники залов WH, hallsets.js).
    // o: { src | texture, r, h, span (рад), y0, z, repeat, color (затемнение), mirror:true — повтор зеркально }
    function panorama(o) {
      var R = o.r || 40, Hh = o.h || 24, span = o.span || 3.4;
      // o.alphaTest — для силуэтов с прозрачностью (хребты, город); o.transparent — мягкие края
      var mat = new T.MeshBasicMaterial({ color: o.color != null ? o.color : 0xffffff, side: T.BackSide, fog: false, toneMapped: false, alphaTest: o.alphaTest || 0, transparent: !!o.transparent, depthWrite: !o.transparent });
      var m = new T.Mesh(new T.CylinderGeometry(R, R, Hh, 96, 1, true, Math.PI - span / 2, span), mat);
      m.position.set(o.x || 0, (o.y0 != null ? o.y0 : -1) + Hh / 2, o.z != null ? o.z : 0); m.renderOrder = -1; scene.add(m);
      function use(t) { t.wrapS = o.mirror === false ? T.RepeatWrapping : T.MirroredRepeatWrapping; t.repeat.x = o.repeat || 1; t.anisotropy = aniso; mat.map = t; mat.visible = true; mat.needsUpdate = true; }
      if (o.texture) use(o.texture); else { mat.visible = false; image(o.src, function (t) { use(t.clone ? (function () { var c = t.clone(); c.needsUpdate = true; return c; })() : t); }); }
      return m;
    }

    // ---------- плоские персонажи ----------
    var boards = [];
    function billboard(url, height, o) {
      o = o || {};
      var g = new T.Group();
      var mat = new T.MeshBasicMaterial({ transparent: true, alphaTest: 0.04, depthWrite: true, side: T.DoubleSide, toneMapped: false, fog: false });
      var m = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
      m.visible = false; g.add(m);
      image(url, function (t, img) {
        mat.map = t; mat.needsUpdate = true;
        var w = height * (img.width / img.height); m.scale.set(w, height, 1); m.position.y = height / 2; m.visible = true;
      });
      boards.push({ g: g, m: m, bob: o.bob || 0, ph: Math.random() * TAU, y0: 0 });
      return g;
    }

    // ---------- снег ----------
    var snows = [];
    function snow(o) {
      o = o || {};
      var n = Math.round((o.n || 900) * (mobile ? 0.5 : 1)), A = o.area || [60, 26, 40], sp = o.speed || 1;
      var pos = new Float32Array(n * 3), vel = new Float32Array(n);
      for (var i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * A[0]; pos[i * 3 + 1] = Math.random() * A[1]; pos[i * 3 + 2] = (Math.random() - 0.5) * A[2]; vel[i] = 0.6 + Math.random() * 0.9; }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      var flake = tex(32, 32, function (g, w) { var gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
      var pts = new T.Points(geo, new T.PointsMaterial({ size: o.size || 0.22, map: flake, transparent: true, depthWrite: false, opacity: o.opacity || 0.85, color: o.color || 0xffffff }));
      if (o.center) pts.position.fromArray(o.center);
      scene.add(pts);
      snows.push({ pts: pts, pos: pos, vel: vel, A: A, sp: sp });
      return pts;
    }

    // ---------- подписи-кнопки ----------
    var labels = [], v3 = new T.Vector3();
    function label(obj, offset, html, onClick) {
      var el = document.createElement(onClick ? 'button' : 'div');
      if (onClick) { el.type = 'button'; el.addEventListener('click', function (e) { e.stopPropagation(); onClick(); }); }
      el.className = 'ny3d-label';
      el.innerHTML = html;
      overlay.appendChild(el);
      var L = { el: el, obj: obj, off: new T.Vector3().fromArray(offset || [0, 0, 0]), hidden: false };
      labels.push(L);
      return {
        el: el,
        set: function (h) { if (el.innerHTML !== h) el.innerHTML = h; },
        cls: function (n, on) { el.classList.toggle(n, !!on); },
        hide: function (on) { L.hidden = !!on; el.style.display = on ? 'none' : ''; },
      };
    }
    function placeLabels() {
      for (var i = 0; i < labels.length; i++) {
        var L = labels[i]; if (L.hidden) continue;
        L.obj.updateWorldMatrix(true, false);
        v3.copy(L.off).applyMatrix4(L.obj.matrixWorld).project(camera);
        var x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
        L.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
        L.el.style.visibility = v3.z > 1 ? 'hidden' : '';
      }
    }

    // ---------- клики по объектам ----------
    var picks = [], ray = new T.Raycaster(), mouse = new T.Vector2(), hover = null, pointer = { x: 0, y: 0 };
    function pick(obj, onClick, onHover) { obj.traverse(function (o) { o.userData.pickRoot = obj; }); picks.push({ obj: obj, click: onClick, hover: onHover }); }
    function hitAt(ev) {
      var r = canvas.getBoundingClientRect();
      mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      var hits = ray.intersectObjects(picks.map(function (p) { return p.obj; }), true);
      for (var i = 0; i < hits.length; i++) {
        var root = hits[i].object.userData.pickRoot;
        var p = picks.find(function (x) { return x.obj === root; });
        if (p) return p;
      }
      return null;
    }
    canvas.addEventListener('pointermove', function (ev) {
      var r = canvas.getBoundingClientRect();
      pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1; pointer.y = ((ev.clientY - r.top) / r.height) * 2 - 1;
      if (ev.pointerType !== 'mouse') return;
      var p = hitAt(ev);
      if (p !== hover) { if (hover && hover.hover) hover.hover(false); hover = p; if (p && p.hover) p.hover(true); }
      canvas.style.cursor = p && p.click ? 'pointer' : '';
    });
    canvas.addEventListener('pointerleave', function () { if (hover && hover.hover) hover.hover(false); hover = null; pointer.x = 0; pointer.y = 0; });
    canvas.addEventListener('click', function (ev) { var p = hitAt(ev); if (p && p.click) p.click(); });

    // ---------- камера ----------
    var par = opts.parallax != null ? opts.parallax : 0.8, sway = { x: 0, y: 0 };
    function look(pos, target, sec) {
      camFrom = camPos.clone(); lookFrom = camLook.clone();
      camTo = new T.Vector3().fromArray(pos); lookTo = new T.Vector3().fromArray(target);
      camT = 0; camDur = reduced || sec === 0 ? 0.001 : (sec || 1.4); // look(..., 0) — сразу, без перелёта
    }
    var ease = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

    // ---------- цикл ----------
    var frames = [], last = performance.now(), t0 = last, raf = 0, dead = false, drawn = 0, info = null;
    if (dbg.split(',').indexOf('info') >= 0) {
      info = document.createElement('div');
      info.style.cssText = 'position:absolute;left:4px;bottom:4px;z-index:9;font:11px/1.3 monospace;color:#0f0;background:rgba(0,0,0,.7);padding:2px 5px;pointer-events:none';
      box.appendChild(info);
    }
    function loop(now) {
      raf = requestAnimationFrame(loop);
      // метка rAF первого кадра бывает раньше performance.now() из create → dt < 0 уводил камеру/лерпы в бесконечность
      var raw = Math.max(0, (now - last) / 1000), dt = Math.min(0.05, raw); last = now;
      if (!onScreen || document.hidden) return;
      var t = Math.max(0, (now - t0) / 1000);
      if (reduced) dt *= 0.35;
      if (camT < 1) {
        camT = Math.min(1, camT + Math.min(0.25, raw) / camDur); // перелёт по реальному времени: на слабом телефоне не растягивается

        var e = ease(camT);
        camPos.lerpVectors(camFrom, camTo, e); camLook.lerpVectors(lookFrom, lookTo, e);
      }
      sway.x += (pointer.x * par - sway.x) * Math.min(1, dt * 2.5);
      sway.y += (pointer.y * par * 0.5 - sway.y) * Math.min(1, dt * 2.5);
      camera.position.set(camPos.x + sway.x, camPos.y - sway.y, camPos.z);
      camera.lookAt(camLook);
      for (var i = 0; i < snows.length; i++) {
        var S = snows[i], p = S.pos, A = S.A;
        for (var j = 0; j < S.vel.length; j++) {
          p[j * 3 + 1] -= S.vel[j] * dt * S.sp;
          p[j * 3] += Math.sin(t * 0.7 + j) * dt * 0.25;
          if (p[j * 3 + 1] < 0) { p[j * 3 + 1] = A[1]; p[j * 3] = (Math.random() - 0.5) * A[0]; }
        }
        S.pts.geometry.attributes.position.needsUpdate = true;
      }
      for (var b = 0; b < boards.length; b++) {
        var B = boards[b];
        B.m.rotation.y = Math.atan2(camera.position.x - B.g.position.x, camera.position.z - B.g.position.z) - B.g.rotation.y;
        if (B.bob) B.m.position.y = B.m.scale.y / 2 + Math.sin(t * 1.6 + B.ph) * B.bob;
      }
      flameTime.value = t;
      // огонь лицом к камере по вертикальной оси с учётом мирового поворота родителей; m.userData.noFace = true — не поворачивать
      for (var fl = 0; fl < flames.length; fl++) {
        var FM = flames[fl]; if (!FM.parent || FM.userData.noFace) continue;
        FM.getWorldPosition(v3); FM.parent.getWorldQuaternion(fq);
        fqY.setFromAxisAngle(UP, Math.atan2(camera.position.x - v3.x, camera.position.z - v3.z));
        FM.quaternion.copy(fq.invert()).multiply(fqY);
      }
      for (var f = 0; f < frames.length; f++) frames[f](t, dt);
      if (composer) composer.render(dt); else renderer.render(scene, camera);
      placeLabels();
      adapt(dt);
      if (info && (++drawn % 20 === 0)) {
        var c = camera.position;
        info.textContent = 'frames ' + drawn + ' · ' + W + '×' + H + ' · PR ' + PR + ' · cam ' + c.x.toFixed(1) + ',' + c.y.toFixed(1) + ',' + c.z.toFixed(1) +
          ' · zoom ' + camera.zoom.toFixed(2) + ' · fov ' + camera.fov + (composer ? ' · bloom' : '');
      }
    }
    raf = requestAnimationFrame(loop);

    var k = {
      T: T, scene: scene, camera: camera, renderer: renderer, box: box, overlay: overlay, mobile: mobile, reduced: reduced, TAU: TAU,
      debug: function (flag) { return dbg.split(',').indexOf(flag) >= 0; }, // ?ny3d=lit — для скриншотов: всё как пройдено
      tex: tex, image: image, glow: glow, billboard: billboard, snow: snow, label: label, pick: pick,
      premium: premium, HQ: HQ, aniso: aniso, mirror: mirror, flame: flame, panorama: panorama,
      onFrame: function (fn) { frames.push(fn); },
      onResize: function (fn) { (resizeFns = resizeFns || []).push(fn); fn(W, H); }, // fn(W, H) — сразу и при каждом изменении размера
      size: function () { return { w: W, h: H }; },
      look: look,
      parallax: function (a) { par = a; },
      bloom: function (s) { if (bloom) bloom.strength = s; },
      dispose: function () {
        if (dead) return; dead = true;
        cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect();
        renderer.dispose(); box.innerHTML = ''; box.classList.remove('ny3d');
      },
    };
    return k;
  }

  /** Подключить стили ядра один раз (чтобы бренду не нужен был отдельный css). */
  (function css() {
    if (document.getElementById('ny3d-css')) return;
    var s = document.createElement('style'); s.id = 'ny3d-css';
    s.textContent =
      '.ny3d{position:relative;overflow:hidden;isolation:isolate}' +
      '.ny3d-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y}' +
      '.ny3d-overlay{position:absolute;inset:0;pointer-events:none}' +
      '.ny3d-label{position:absolute;left:0;top:0;pointer-events:auto;white-space:nowrap;will-change:transform}' +
      'div.ny3d-label{pointer-events:none}';
    (document.head || document.documentElement).appendChild(s);
  })();

  return { create: create, supported: supported };
})();
