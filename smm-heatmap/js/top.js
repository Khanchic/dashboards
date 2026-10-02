// Лучший пост недели: карточки топов, история топов бренда, сравнение выбранных. Данные — data/top.json.
// Неделя и бренд приходят из stats.js (TopPosts.render), своё состояние — только сортировка и выбор.
window.TopPosts = (function () {
  "use strict";

  var COLOR = SMM.COLOR, weekRange = SMM.weekRange;
  var DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var HISTORY = 8;
  var MAX_PICK = 4;

  var T = null, ctx = null;
  var sort = "lift";
  var picked = {}; // ключ "неделя|код" → true
  var byKey = {};

  var els = {};
  ["topSub", "topSort", "topInsight", "topGrid", "topHistTitle", "topHistory", "cmpBar", "cmpCount",
   "cmpGo", "cmpReset", "modal", "modalBody", "modalClose"].forEach(function (id) { els[id] = document.getElementById(id); });

  var NF = new Intl.NumberFormat("ru-RU");
  function nf(n) { return n == null ? "—" : NF.format(Math.round(n)); }
  function pct(n, d) { return n == null ? "—" : (n * 100).toFixed(d == null ? 1 : d).replace(".", ",") + "%"; }
  function x(n) { return n == null ? "—" : "×" + n.toFixed(2).replace(".", ","); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function ddmm(s) { return String(s || "").slice(0, 5); }
  // автоответ (бот: код в личку за коммент) накручивает комментарии — пока не отслеживаем, бейдж скрыт
  function arBadge(t) {
    if (t.autoreply == null) return "";
    return t.autoreply
      ? '<span class="badge ar on" title="Автоответ включён: за комментарий бот шлёт код в личку">🤖 автоответ</span>'
      : '<span class="badge ar off" title="Автоответа нет: комментариев за код меньше, сравнивай с поправкой">без автоответа</span>';
  }
  function liftCls(v) { return v == null ? "flat" : v >= 1.15 ? "up" : v <= 0.85 ? "down" : "flat"; }
  function imgHtml(t, eager) {
    return t.img
      ? '<img src="' + esc(t.img) + '" alt=""' + (eager ? "" : ' loading="lazy"') + " />"
      : '<div class="tp-noimg">' + esc(t.type) + "<small>без картинки</small></div>";
  }

  function key(week, t) { return week + "|" + t.code; }
  function index() {
    byKey = {};
    Object.keys(T.weeks).forEach(function (w) {
      T.weeks[w].forEach(function (t) { t.week = w; byKey[key(w, t)] = t; });
    });
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      if (sort === "lift") return (b.lift == null ? -1 : b.lift) - (a.lift == null ? -1 : a.lift);
      return b.inter - a.inter;
    });
  }

  // ---------- карточка ----------
  function card(t, head) {
    var k = key(t.week, t);
    return '<article class="tp-card' + (picked[k] ? " picked" : "") + '" data-k="' + esc(k) + '">' +
      '<label class="tp-pick" title="Добавить в сравнение"><input type="checkbox"' + (picked[k] ? " checked" : "") + ' /></label>' +
      '<div class="tp-img">' + imgHtml(t) + "</div>" +
      '<div class="tp-body">' +
        '<div class="tp-head">' + head + "</div>" +
        '<div class="tp-tags"><span class="badge">' + esc(t.type) + '</span><span class="badge">' + DOW[t.dow] + " " + ddmm(t.date) + "</span>" + arBadge(t) + "</div>" +
        '<div class="tp-main"><b>' + nf(t.inter) + '</b> взаимод. <span class="tp-lift ' + liftCls(t.lift) + '">' + x(t.lift) + "</span></div>" +
        '<div class="tp-stats">' + (t.reach ? "Охват " + nf(t.reach) + " · ER " + pct(t.er) : "Охват н/д (Meta отдала 0)") + (t.ctr != null ? " · CTR " + pct(t.ctr, 2) : "") + "</div>" +
      "</div></article>";
  }
  function projHead(t) { return '<span class="dot" style="background:' + COLOR[t.code] + '"></span>' + esc(t.project); }
  function weekHead(t) { return "нед. " + weekRange(t.week); }

  // ---------- выводы ----------
  function countBy(list, f) {
    var m = {};
    list.forEach(function (t) { var k = f(t); m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
  }
  function insightAll(list) {
    var out = [];
    var withLift = list.filter(function (t) { return t.lift != null; }).sort(function (a, b) { return b.lift - a.lift; });
    if (withLift.length) {
      var b = withLift[0];
      out.push("Сильнее всех к своей норме — <b>" + esc(b.project) + "</b> " + x(b.lift) + " (" + esc(b.type) + ")");
      var weak = withLift.filter(function (t) { return t.lift <= 0.85; });
      if (weak.length) out.push("Топ слабее обычного: " + weak.map(function (t) { return esc(t.project) + " " + x(t.lift); }).join(", "));
    }
    var f = countBy(list, function (t) { return t.type; });
    if (f.length && f[0][1] > 1) out.push("Формат недели: <b>" + esc(f[0][0]) + "</b> — топ у " + f[0][1] + " из " + list.length);
    var noAr = list.filter(function (t) { return t.autoreply === false; });
    if (noAr.length && noAr.length < list.length) out.push("Без автоответа: " + noAr.map(function (t) { return esc(t.project); }).join(", ") + " — комментариев за код нет, сравнивай с поправкой");
    var d = countBy(list, function (t) { return DOW[t.dow]; }).filter(function (p) { return p[1] > 1; });
    if (d.length) out.push("Дни топов: " + d.map(function (p) { return p[0] + " ×" + p[1]; }).join(", "));
    return out;
  }
  function insightHistory(list) {
    var out = [];
    var f = countBy(list, function (t) { return t.type; });
    if (f.length) out.push("Чаще в топе: <b>" + esc(f[0][0]) + "</b> — " + f[0][1] + " из " + list.length + " нед.");
    var d = countBy(list, function (t) { return DOW[t.dow]; });
    if (d.length && d[0][1] > 1) out.push("Чаще выстреливает в <b>" + d[0][0] + "</b> — " + d[0][1] + " раз");
    var best = list.slice().sort(function (a, b) { return b.inter - a.inter; })[0];
    if (best) out.push("Рекорд периода — " + nf(best.inter) + " взаимод., нед. " + weekRange(best.week));
    return out;
  }

  // ---------- рендер ----------
  function render(c) {
    if (c) ctx = c;
    if (!T || !ctx) return;
    var week = ctx.week;
    var list = T.weeks[week] || [];
    els.topSub.textContent = "нед. " + weekRange(week) + " · Facebook";

    if (ctx.proj === "ALL") {
      els.topGrid.className = "tp-grid";
      els.topGrid.innerHTML = list.length ? sorted(list).map(function (t) { return card(t, projHead(t)); }).join("")
        : '<div class="mt-empty">За эту неделю постов в логе нет.</div>';
      els.topInsight.innerHTML = insightAll(list).map(function (s) { return "<li>" + s + "</li>"; }).join("");
      els.topHistTitle.classList.add("hidden");
      els.topHistory.innerHTML = "";
    } else {
      var cur = list.filter(function (t) { return t.code === ctx.proj; })[0];
      els.topGrid.className = "tp-grid solo";
      els.topGrid.innerHTML = cur ? hero(cur) : '<div class="mt-empty">У бренда нет постов в логе за эту неделю.</div>';
      var weeks = ctx.weeks.slice(0, ctx.weeks.indexOf(week) + 1).reverse().slice(0, HISTORY);
      var hist = weeks.map(function (w) { return byKey[w + "|" + ctx.proj]; }).filter(Boolean);
      els.topHistTitle.classList.remove("hidden");
      els.topHistory.innerHTML = hist.map(function (t) { return card(t, weekHead(t)); }).join("");
      els.topInsight.innerHTML = insightHistory(hist).map(function (s) { return "<li>" + s + "</li>"; }).join("");
    }
    syncBar();
  }

  function statRows(t) {
    return [
      ["Взаимодействия", nf(t.inter)],
      ["К норме", '<span class="' + liftCls(t.lift) + '">' + x(t.lift) + "</span>" +
        (t.baseMedian ? ' <span class="muted">медиана топов ' + t.baseWeeks + " нед.: " + nf(t.baseMedian) + "</span>" : "")],
      ["Охват", t.reach ? nf(t.reach) : "н/д — Meta отдала 0"],
      ["ER", pct(t.er)],
      ["CTR", t.ctr == null ? '— <span class="muted">клики не сняты</span>'
        : pct(t.ctr, 2) + (t.clicks != null ? ' <span class="muted">' + nf(t.clicks) + " кликов</span>" : "")],
      ["Медиана недели", nf(t.weekMedian) + ' <span class="muted">из ' + t.posts + " постов</span>"],
    ];
  }

  function hero(t) {
    var k = key(t.week, t);
    // полный текст есть у постов, записанных с 01.10.2026; у старых — первые ~80 символов из лога
    var text = t.text || (t.title ? t.title + "…" : "");
    return '<article class="tp-hero" data-k="' + esc(k) + '">' +
      '<div class="tp-img">' + imgHtml(t, true) + "</div>" +
      '<div class="tp-hero-body">' +
        '<div class="tp-tags"><span class="badge">' + esc(t.type) + '</span><span class="badge">' + DOW[t.dow] + " " + ddmm(t.date) + "</span>" + arBadge(t) +
          '<label class="tp-pick inline"><input type="checkbox"' + (picked[k] ? " checked" : "") + " /> в сравнение</label></div>" +
        '<pre class="post tp-text">' + esc(text) + "</pre>" +
        '<div class="tp-kv">' + statRows(t).map(function (r) { return "<span>" + r[0] + "</span><b>" + r[1] + "</b>"; }).join("") + "</div>" +
        '<div class="acts">' + (t.text ? '<button class="ghost-btn sm" data-copy>Копировать текст</button>' : "") +
          (t.link ? '<a class="ghost-btn sm" href="' + esc(t.link) + '" target="_blank" rel="noopener">Открыть пост ↗</a>' : "") + "</div>" +
      "</div></article>";
  }

  // ---------- модалки ----------
  function openModal(html) {
    els.modalBody.innerHTML = html;
    els.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    els.modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function detail(t) {
    openModal('<div class="md-title"><span class="dot" style="background:' + COLOR[t.code] + '"></span>' + esc(t.project) +
      ' <span class="panel-sub">нед. ' + weekRange(t.week) + "</span></div>" + hero(t));
  }

  function compare() {
    var list = Object.keys(picked).map(function (k) { return byKey[k]; }).filter(Boolean);
    if (list.length < 2) return;
    var oneProject = list.every(function (t) { return t.code === list[0].code; });
    var rows = [
      { t: "Формат", f: function (t) { return esc(t.type); } },
      { t: "День", f: function (t) { return DOW[t.dow] + " " + ddmm(t.date); } },
      { t: "Взаимодействия", v: function (t) { return t.inter; }, f: function (t) { return nf(t.inter); } },
      { t: "К норме", v: function (t) { return t.lift; }, f: function (t) { return x(t.lift); } },
      { t: "Охват", v: function (t) { return t.reach; }, f: function (t) { return t.reach ? nf(t.reach) : "н/д"; } },
      { t: "ER", v: function (t) { return t.er; }, f: function (t) { return pct(t.er); } },
      { t: "CTR", v: function (t) { return t.ctr; }, f: function (t) { return pct(t.ctr, 2); } },
      { t: "× медианы недели", v: function (t) { return t.weekMedian ? t.inter / t.weekMedian : null; },
        f: function (t) { return x(t.weekMedian ? t.inter / t.weekMedian : null); } },
    ];
    var head = "<tr><th></th>" + list.map(function (t) {
      return '<th><div class="cm-img">' + (t.img ? '<img src="' + esc(t.img) + '" alt="" />' : '<div class="tp-noimg">' + esc(t.type) + "</div>") + "</div>" +
        (oneProject ? "нед. " + weekRange(t.week) : '<span class="dot" style="background:' + COLOR[t.code] + '"></span>' + esc(t.project) +
          (list.some(function (o) { return o.week !== t.week; }) ? '<br><span class="muted">' + weekRange(t.week) + "</span>" : "")) + "</th>";
    }).join("") + "</tr>";
    var body = rows.map(function (r) {
      var best = null;
      if (r.v) list.forEach(function (t) { var v = r.v(t); if (v != null && (best == null || v > best)) best = v; });
      return "<tr><td>" + r.t + "</td>" + list.map(function (t) {
        var on = r.v && best != null && r.v(t) === best;
        return '<td class="' + (on ? "best" : "") + '">' + r.f(t) + "</td>";
      }).join("") + "</tr>";
    }).join("");

    // вывод: кто сильнее к своей норме и что у победителя другое
    var notes = [];
    var withLift = list.filter(function (t) { return t.lift != null; }).sort(function (a, b) { return b.lift - a.lift; });
    if (withLift.length > 1) {
      var a = withLift[0], z = withLift[withLift.length - 1];
      notes.push("<b>" + esc(oneProject ? "нед. " + weekRange(a.week) : a.project) + "</b> сильнее к своей норме: " + x(a.lift) + " против " + x(z.lift));
      if (a.type !== z.type) notes.push("Форматы разные: " + esc(a.type) + " vs " + esc(z.type) + " — смотри на механику");
      else notes.push("Формат один (" + esc(a.type) + ") — разница в исполнении: картинка, текст, день");
      if (a.dow !== z.dow) notes.push("Дни: " + DOW[a.dow] + " vs " + DOW[z.dow]);
    }
    var abs = list.slice().sort(function (p, q) { return q.inter - p.inter; })[0];
    if (!oneProject && withLift.length && abs !== withLift[0])
      notes.push("По абсолютным взаимодействиям лидер другой — " + esc(abs.project) + ": у бренда просто больше аудитория");

    openModal('<div class="md-title">Сравнение топов <span class="panel-sub">лучшее значение в строке подсвечено</span></div>' +
      '<div class="table-wrap keep"><table class="cmp cm-table">' + head + body + "</table></div>" +
      (notes.length ? '<ul class="tp-insight">' + notes.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>" : ""));
  }

  function syncBar() {
    var n = Object.keys(picked).length;
    els.cmpBar.classList.toggle("hidden", n === 0);
    els.cmpCount.textContent = n === 1 ? "Выбран 1 пост — отметь ещё" : "Выбрано " + n;
    els.cmpGo.disabled = n < 2;
  }

  function togglePick(k, on) {
    if (on && Object.keys(picked).length >= MAX_PICK) { render(); return; }
    if (on) picked[k] = true; else delete picked[k];
    render();
  }

  // ---------- события ----------
  document.addEventListener("click", function (e) {
    var host = e.target.closest("#topPanel, #modal");
    if (!host) return;
    var cb = e.target.closest(".tp-pick input");
    if (cb) {
      var k = cb.closest("[data-k]").dataset.k;
      togglePick(k, cb.checked);
      return;
    }
    if (e.target.closest(".tp-pick")) return;
    var copy = e.target.closest("[data-copy]");
    if (copy) {
      var t = byKey[copy.closest("[data-k]").dataset.k];
      navigator.clipboard.writeText(t.text).then(function () { copy.textContent = "Скопировано ✓"; });
      return;
    }
    var c = e.target.closest(".tp-card");
    if (c && host.id === "topPanel") detail(byKey[c.dataset.k]);
  });
  els.topSort.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-sort]");
    if (!b) return;
    sort = b.dataset.sort;
    Array.prototype.forEach.call(els.topSort.children, function (x) { x.classList.toggle("active", x === b); });
    render();
  });
  els.cmpGo.addEventListener("click", compare);
  els.cmpReset.addEventListener("click", function () { picked = {}; render(); });
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", function (e) { if (e.target === els.modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  // ---------- загрузка ----------
  function apply(data) { T = data; index(); render(); }
  function load(fresh) {
    return DashAPI.top(fresh).then(apply).catch(function (e) {
      if (!T) els.topGrid.innerHTML = '<div class="mt-empty">Не удалось загрузить топы: ' + esc(e.message) + "</div>";
    });
  }

  return { render: render, load: load };
})();
