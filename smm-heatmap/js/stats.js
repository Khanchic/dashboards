// Дашборд статистики: 8 брендов × недели, только Facebook. Данные — data/insights.json.
// Логика и графики — по референсу SMM Dashboard (popup-builder), источник данных — наш.
(function () {
  "use strict";

  var COLOR = SMM.COLOR, EMOJI = SMM.EMOJI;

  var state = { proj: "ALL", plat: "FB", period: 13, weekIdx: null, weekPinned: false };
  var D = null;
  var charts = {};

  var els = {};
  ["meta", "refreshBtn", "projChips", "periodSel", "weekSel", "kpis", "chTitle1", "chEmpty1", "tblWeek",
   "cmpTable", "cmpCards", "toast"].forEach(function (id) { els[id] = document.getElementById(id); });

  // ---------- утилиты ----------
  var NF = new Intl.NumberFormat("ru-RU");
  function nf(n) { return n == null ? "—" : NF.format(Math.round(n)); }
  function pct(n, d) { return n == null ? "—" : (n * 100).toFixed(d == null ? 1 : d).replace(".", ",") + "%"; }
  function kfmt(v){ return v >= 10000 ? Math.round(v/1000)+"k" : NF.format(Math.round(v)); }
  function shortWeek(w) { return String(w || "").slice(0, 5); }

  function delta(cur, prev) {
    if (cur == null || prev == null || !prev) return null;
    return (cur - prev) / Math.abs(prev);
  }
  function deltaTxt(d) {
    if (d == null) return '<span class="flat">—</span>';
    var cls = d > 0.0005 ? "up" : d < -0.0005 ? "down" : "flat";
    var sign = d > 0 ? "+" : "";
    return '<span class="' + cls + '">' + sign + (d * 100).toFixed(1).replace(".", ",") + "%</span>";
  }
  function ppTxt(cur, prev) {
    if (cur == null || prev == null) return '<span class="flat">—</span>';
    var d = (cur - prev) * 100;
    var cls = d > 0.05 ? "up" : d < -0.05 ? "down" : "flat";
    return '<span class="' + cls + '">' + (d > 0 ? "+" : "") + d.toFixed(1).replace(".", ",") + " п.п.</span>";
  }
  function toast(msg, isErr) {
    els.toast.textContent = msg;
    els.toast.className = "toast" + (isErr ? " err" : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { els.toast.className = "toast hidden"; }, 3200);
  }

  // ---------- доступ к рядам ----------
  function raw(code, plat, metric) {
    var p = D.data[code];
    if (!p || !p[plat]) return null;
    return p[plat][metric] || null;
  }

  // ALL = сумма по 8 брендам (аддитивные метрики), не среднее средних
  function series(code, plat, metric) {
    if (code !== "ALL") return raw(code, plat, metric) || D.weeks.map(function () { return null; });
    return D.weeks.map(function (_, i) {
      var s = null;
      D.projects.forEach(function (p) {
        var arr = raw(p.code, plat, metric);
        if (arr && arr[i] != null) s = (s || 0) + arr[i];
      });
      return s;
    });
  }

  function ratio(a, b) {
    return a.map(function (v, i) {
      return v == null || b[i] == null || !b[i] ? null : v / b[i];
    });
  }

  // все производные считаем сами — чтобы ALL и отдельный бренд считались одинаково
  function metrics(code, plat) {
    var reach = series(code, plat, "Reach week");
    var inter = series(code, plat, "Interaction week");
    var posts = series(code, plat, "Post count");
    return {
      followers: series(code, plat, "Followers"),
      netFollows: series(code, plat, "Net Follows"),
      reach: reach,
      inter: inter,
      posts: posts,
      visits: series(code, plat, "Visits"),
      views: series(code, plat, "Views"),
      er: ratio(inter, reach),
      perPost: ratio(inter, posts),
      reachPerPost: ratio(reach, posts),
      // CTR: клики по ссылке ÷ охват только тех постов, где клики сняты
      ctr: ratio(series(code, "FB", "Link clicks"), series(code, "FB", "Reach clicked")),
    };
  }

  function windowRange() {
    var end = state.weekIdx;
    var start = state.period ? Math.max(0, end - state.period + 1) : 0;
    return { start: start, end: end };
  }
  function slice(arr) {
    var r = windowRange();
    return arr.slice(r.start, r.end + 1);
  }

  // ---------- шапка ----------
  function buildChips() {
    var all = [{ code: "ALL", name: "Все бренды" }].concat(D.projects);
    els.projChips.innerHTML = "";
    all.forEach(function (p) {
      var b = document.createElement("button");
      b.className = "chip" + (p.code === state.proj ? " active" : "");
      b.textContent = (EMOJI[p.code] ? EMOJI[p.code] + " " : "📦 ") + p.name;
      b.onclick = function () { state.proj = p.code; buildChips(); render(); };
      els.projChips.appendChild(b);
    });
  }

  function buildWeekSel() {
    els.weekSel.innerHTML = "";
    for (var i = D.lastIdx; i >= 0; i--) {
      var o = document.createElement("option");
      o.value = i;
      o.textContent = "нед. " + SMM.weekRange(D.weeks[i]);
      els.weekSel.appendChild(o);
    }
    els.weekSel.value = state.weekIdx;
  }

  // ---------- KPI ----------
  // подсказка при наведении: что это | формула | откуда (показывает js/info.js по data-tip)
  var KPI_TIP = {
    "Подписчики": "Сколько людей подписано на страницу на конец недели.|Число на конец недели|USA 2 Projects → Followers (Business Suite → Audience)",
    "Прирост за неделю": "Новые подписки за неделю.|Формула листа по строке Net Follows|USA 2 Projects → Net Follows",
    "Охват": "Сумма охвата всех постов ленты за неделю, без сторис. Человек, увидевший 3 поста, считается 3 раза.|Σ Reach постов недели|USA 2 Projects → Reach week (сумма по ПОСТИ ЛОГ)",
    "Взаимодействия": "Реакции, комментарии, репосты и сохранения на постах недели, как считает Meta.|Σ Interactions постов недели|USA 2 Projects → Interaction week",
    "ER": "Насколько охваченные люди реагируют на посты. Δ — в процентных пунктах.|Взаимодействия ÷ Охват (для «Все бренды» — сумма к сумме)|Считается в дашборде",
    "Реакций / пост": "Сколько взаимодействий в среднем собирает один пост.|Взаимодействия ÷ Постов|Считается в дашборде",
    "Постов": "Сколько постов вышло в ленте за неделю, без сторис.|Число постов недели|USA 2 Projects → Post count",
    "Визиты на страницу": "Сколько раз открывали саму страницу Facebook — не сайт.|Σ Visits за 7 дней|USA 2 Projects → Visits (Business Suite → Results)",
  };

  function kpi(label, value, deltaHtml) {
    var tip = KPI_TIP[label] ? ' data-tip="' + KPI_TIP[label].replace(/"/g, "&quot;") + '" tabindex="0"' : "";
    return '<div class="kpi"' + tip + '><div class="kpi-label">' + label + '</div>' +
      '<div class="kpi-val">' + value + '</div>' +
      '<div class="kpi-delta">' + (deltaHtml || "") + '</div></div>';
  }

  function renderKpis() {
    var m = metrics(state.proj, state.plat);
    var i = state.weekIdx, j = i - 1;
    var at = function (a) { return a[i]; }, pr = function (a) { return j >= 0 ? a[j] : null; };

    els.kpis.innerHTML = [
      kpi("Подписчики", nf(at(m.followers)), deltaTxt(delta(at(m.followers), pr(m.followers)))),
      kpi("Прирост за неделю", nf(at(m.netFollows)), deltaTxt(delta(at(m.netFollows), pr(m.netFollows)))),
      kpi("Охват", nf(at(m.reach)), deltaTxt(delta(at(m.reach), pr(m.reach)))),
      kpi("Взаимодействия", nf(at(m.inter)), deltaTxt(delta(at(m.inter), pr(m.inter)))),
      kpi("ER", pct(at(m.er)), ppTxt(at(m.er), pr(m.er))),
      kpi("Реакций / пост", nf(at(m.perPost)), deltaTxt(delta(at(m.perPost), pr(m.perPost)))),
      kpi("Постов", nf(at(m.posts)), deltaTxt(delta(at(m.posts), pr(m.posts)))),
      kpi("Визиты на страницу", nf(at(m.visits)), deltaTxt(delta(at(m.visits), pr(m.visits)))),
    ].join("");
  }

  // ---------- графики ----------

  // Подписи брендов у конца линий: с 8 рядами сопоставлять линию с легендой
  // по цвету ненадёжно, поэтому имя пишется прямо там, где линия заканчивается.
  var endLabels = {
    id: "endLabels",
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || !opts.enabled) return;
      var area = chart.chartArea, items = [];
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        for (var i = ds.data.length - 1; i >= 0; i--) {
          if (ds.data[i] != null && meta.data[i]) {
            items.push({ y: meta.data[i].y, text: ds.label, color: ds.borderColor });
            break;
          }
        }
      });
      if (!items.length) return;

      // раздвигаем по вертикали, чтобы подписи не наезжали друг на друга
      var MIN = 14;
      items.sort(function (a, b) { return a.y - b.y; });
      for (var i = 1; i < items.length; i++) {
        if (items[i].y - items[i - 1].y < MIN) items[i].y = items[i - 1].y + MIN;
      }
      var over = items[items.length - 1].y - area.bottom;
      if (over > 0) items.forEach(function (it) { it.y -= over; });

      var ctx = chart.ctx;
      ctx.save();
      ctx.font = '600 11px -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.textBaseline = "middle";
      items.forEach(function (it) {
        ctx.fillStyle = it.color;
        ctx.fillText(it.text, area.right + 8, Math.max(area.top + 6, it.y));
      });
      ctx.restore();
    },
  };
  if (typeof Chart !== "undefined") Chart.register(endLabels);

  function mount(id, cfg) {
    if (typeof Chart === "undefined") return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), cfg);
  }

  function axes(extra) {
    var base = {
      x: { grid: { color: "#22304f40" }, ticks: { color: "#8b98b5", maxRotation: 0, autoSkipPadding: 14 } },
      y: {
        beginAtZero: true, grid: { color: "#22304f80" }, border: { display: false },
        ticks: { color: "#8b98b5", callback: function (v) { return kfmt(v); } },
      },
    };
    return Object.assign(base, extra || {});
  }
  var LEGEND = { display: true, labels: { color: "#8b98b5", boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } };
  var COMMON = { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false } };

  function renderCharts() {
    var labels = slice(D.weeks).map(shortWeek);
    var m = metrics(state.proj, state.plat);

    // 1 — CTR (FB): клики по ссылке ÷ охват постов
    var toPct = function (a) { return slice(a).map(function (v) { return v == null ? null : v * 100; }); };
    var ds1;
    if (state.proj === "ALL") {
      ds1 = D.projects.map(function (p) {
        return {
          label: p.name, data: toPct(metrics(p.code, "FB").ctr),
          borderColor: COLOR[p.code], backgroundColor: COLOR[p.code],
          borderWidth: 2, pointRadius: 2, tension: .3, spanGaps: true,
        };
      });
      els.chTitle1.textContent = "Facebook · клики ÷ охват постов · по брендам";
    } else {
      ds1 = [{
        label: "CTR", data: toPct(m.ctr),
        borderColor: COLOR[state.proj], backgroundColor: COLOR[state.proj] + "1f",
        borderWidth: 2, pointRadius: 2, tension: .3, fill: true, spanGaps: true,
      }];
      els.chTitle1.textContent = "Facebook · клики ÷ охват постов";
    }
    // клики снимаются с недавнего времени — пока точек нет, говорим об этом прямо на графике
    var hasCtr = ds1.some(function (d) { return d.data.some(function (v) { return v != null; }); });
    els.chEmpty1.classList.toggle("hidden", hasCtr);
    els.chEmpty1.innerHTML = D.clicksSince
      ? "За выбранные недели кликов нет.<br>Клики по ссылке снимаются с <b>" + D.clicksSince + "</b>."
      : "Клики по ссылке начали собирать в лог постов.<br>Первая точка появится после ближайшего недельного сбора.";
    // подписи у концов линий — только на широком экране, где есть место справа
    var named = state.proj === "ALL" && window.innerWidth >= 900;
    mount("chFollowers", {
      type: "line",
      data: { labels: labels, datasets: ds1 },
      options: Object.assign({}, COMMON, {
        layout: named ? { padding: { right: 96 } } : {},
        plugins: {
          legend: state.proj === "ALL" ? LEGEND : { display: false },
          endLabels: { enabled: named && hasCtr },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + " " + (c.parsed.y == null ? "—" : c.parsed.y.toFixed(2).replace(".", ",") + "%"); } } },
        },
        scales: axes({
          y: {
            beginAtZero: true, grid: { color: "#22304f80" }, border: { display: false },
            ticks: { color: "#8b98b5", callback: function (v) { return v + "%"; } },
          },
        }),
      }),
    });

    // 2 — охват (бары) + взаимодействия (линия)
    mount("chReach", {
      data: {
        labels: labels,
        datasets: [
          { type: "bar", label: "Охват", data: slice(m.reach), backgroundColor: "#2f6fed66", borderRadius: 4, order: 2 },
          { type: "line", label: "Взаимодействия", data: slice(m.inter), borderColor: "#3ddc97",
            borderWidth: 2, pointRadius: 0, tension: .3, spanGaps: true, yAxisID: "y1", order: 1 },
        ],
      },
      options: Object.assign({}, COMMON, {
        plugins: { legend: LEGEND },
        scales: axes({
          y1: {
            position: "right", beginAtZero: true, grid: { display: false }, border: { display: false },
            ticks: { color: "#3ddc97", callback: function (v) { return kfmt(v); } },
          },
        }),
      }),
    });

    // 3 — ER
    mount("chEr", {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "ER", data: slice(m.er).map(function (v) { return v == null ? null : v * 100; }),
          borderColor: "#ff8a3d", backgroundColor: "#ff8a3d",
          borderWidth: 2, pointRadius: 2, tension: .3, spanGaps: true,
        }],
      },
      options: Object.assign({}, COMMON, {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return "ER " + c.parsed.y.toFixed(1).replace(".", ",") + "%"; } } },
        },
        scales: axes({
          y: {
            grid: { color: "#22304f80" }, border: { display: false },
            ticks: { color: "#8b98b5", callback: function (v) { return v + "%"; } },
          },
        }),
      }),
    });

    // 4 — посты + реакции на пост
    mount("chPosts", {
      data: {
        labels: labels,
        datasets: [
          { type: "bar", label: "Постов", data: slice(m.posts), backgroundColor: "#a855f766", borderRadius: 4, order: 2 },
          { type: "line", label: "Реакций / пост", data: slice(m.perPost), borderColor: "#f0c000",
            borderWidth: 2, pointRadius: 0, tension: .3, spanGaps: true, yAxisID: "y1", order: 1 },
        ],
      },
      options: Object.assign({}, COMMON, {
        plugins: { legend: LEGEND },
        scales: axes({
          y: { beginAtZero: true, grid: { color: "#22304f80" }, border: { display: false }, ticks: { color: "#8b98b5", precision: 0 } },
          y1: {
            position: "right", beginAtZero: true, grid: { display: false }, border: { display: false },
            ticks: { color: "#f0c000", callback: function (v) { return kfmt(v); } },
          },
        }),
      }),
    });
  }

  // ---------- таблица сравнения ----------
  var COLS = [
    { k: "followers", t: "Подписчики", d: true },
    { k: "netFollows", t: "Прирост", d: true },
    { k: "reach", t: "Охват", d: true },
    { k: "inter", t: "Взаимод.", d: true },
    { k: "er", t: "ER", pct: true },
    { k: "ctr", t: "CTR", pct: true, digits: 2 },
    { k: "perPost", t: "Реакц./пост", d: true },
    { k: "posts", t: "Постов" },
    { k: "visits", t: "Визиты", d: true },
  ];

  function rowCells(m) {
    var i = state.weekIdx, j = i - 1;
    return COLS.map(function (c) {
      var cur = m[c.k][i], prev = j >= 0 ? m[c.k][j] : null;
      var val = c.pct ? pct(cur, c.digits) : nf(cur);
      var d = c.pct ? ppTxt(cur, prev) : c.d ? deltaTxt(delta(cur, prev)) : "";
      return { val: val, d: d, title: c.t };
    });
  }

  function renderTable() {
    els.tblWeek.textContent = "нед. " + SMM.weekRange(D.weeks[state.weekIdx]) + " · Facebook";

    var head = "<thead><tr><th>Бренд</th>" +
      COLS.map(function (c) { return "<th>" + c.t + "</th>"; }).join("") + "</tr></thead>";

    var body = D.projects.map(function (p) {
      var cells = rowCells(metrics(p.code, state.plat));
      return '<tr><td><span style="color:' + COLOR[p.code] + '">●</span> ' + p.name + "</td>" +
        cells.map(function (c) { return "<td>" + c.val + '<span class="d">' + c.d + "</span></td>"; }).join("") + "</tr>";
    }).join("");

    var totCells = rowCells(metrics("ALL", state.plat));
    body += '<tr class="total"><td>Все бренды</td>' +
      totCells.map(function (c) { return "<td>" + c.val + '<span class="d">' + c.d + "</span></td>"; }).join("") + "</tr>";

    els.cmpTable.innerHTML = head + "<tbody>" + body + "</tbody>";

    // мобильные карточки
    els.cmpCards.innerHTML = D.projects.concat([{ code: "ALL", name: "Все бренды" }]).map(function (p) {
      var cells = rowCells(metrics(p.code, state.plat));
      return '<div class="card"><div class="card-head"><div class="card-name">' +
        (EMOJI[p.code] || "📦") + " " + p.name + "</div><div>" + cells[0].val + " " + cells[0].d + "</div></div>" +
        '<div class="card-grid">' + cells.slice(1).map(function (c) {
          return '<div class="card-cell"><span>' + c.title + "</span><b>" + c.val + "</b></div>";
        }).join("") + "</div></div>";
    }).join("");
  }

  // ---------- рендер ----------
  function render() {
    if (!D) return;
    renderKpis();
    renderCharts();
    renderTable();
    TopPosts.render({ week: D.weeks[state.weekIdx], weeks: D.weeks, proj: state.proj, plat: state.plat });
  }

  // ---------- загрузка ----------
  function apply(data) {
    D = data;
    if (state.weekIdx == null || state.weekIdx > D.lastIdx || !state.weekPinned) state.weekIdx = D.lastIdx;
    buildChips();
    buildWeekSel();
    els.meta.textContent = "данные на " + SMM.builtAt(D.fetchedAt);
    render();
  }

  function load(fresh) {
    els.refreshBtn.textContent = "…";
    TopPosts.load(fresh);
    return DashAPI.insights(fresh)
      .then(apply)
      .catch(function (e) { toast("Не удалось загрузить: " + e.message, true); })
      .then(function () { els.refreshBtn.textContent = "⟳"; });
  }

  // ---------- события ----------
  els.periodSel.addEventListener("change", function () { state.period = Number(els.periodSel.value); render(); });
  els.weekSel.addEventListener("change", function () { state.weekIdx = Number(els.weekSel.value); state.weekPinned = true; render(); });
  els.refreshBtn.addEventListener("click", function () { load(true); });
  var resizeT;
  window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(render, 200); });

  load(false);
})();
