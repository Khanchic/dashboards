// Форматы: рейтинг инфоповодов, ER по брендам, теплокарта формат×бренд + выводы и рекомендации недели.
// В референсе всё считает сервер (/api/formats); у нас в data/formats.json лежат сами посты
// ([дата, бренд, тип, reach, interactions]) и фильтры считаются здесь, в браузере.
(function () {
  "use strict";

  // Секвенциальная шкала: одна синь, светлота растёт монотонно (0.48 → 0.86).
  // Нижний шаг 2.61:1 к поверхности — поэтому в каждой ячейке стоит видимое число.
  var RAMP = ["#1c5cab", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#86b6ef", "#b7d3f6"];
  var LIGHT_FROM = 4; // с этого шага текст в ячейке тёмный

  var D = null, POSTS = [];
  var state = null;
  function defaults() {
    return { period: D ? "w:" + D.weeks[D.weeks.length - 1] : "ALL", project: "ALL", from: "", to: "", minPosts: 1 };
  }

  var els = {};
  ["meta", "refreshBtn", "periodSel", "projSel", "minSel", "fromInp", "toInp", "resetBtn", "kpis", "insWeek",
   "insGrid", "recsList", "ratingScope", "ratingTable", "erTable", "hmLegend", "heatmap", "tip", "toast"].forEach(function (id) {
    els[id] = document.getElementById(id);
  });

  var NF = new Intl.NumberFormat("ru-RU");
  function nf(n) { return n == null ? "—" : NF.format(Math.round(n)); }
  function pct(n) { return n == null ? "—" : (n * 100).toFixed(1).replace(".", ",") + "%"; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function toast(msg, isErr) {
    els.toast.textContent = msg;
    els.toast.className = "toast" + (isErr ? " err" : "");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { els.toast.className = "toast hidden"; }, 3200);
  }
  // p-й процентиль отсортированного массива
  function quantile(sorted, p) {
    if (!sorted.length) return 0;
    var i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }
  function iso(dmy) { return dmy.slice(6, 10) + "-" + dmy.slice(3, 5) + "-" + dmy.slice(0, 2); }
  function mondayIso(dmy) {
    var d = new Date(Date.UTC(+dmy.slice(6, 10), +dmy.slice(3, 5) - 1, +dmy.slice(0, 2)));
    d = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
    return d.toISOString().slice(0, 10);
  }

  // ---------- тултип ----------
  function showTip(html, x, y) {
    els.tip.innerHTML = html;
    els.tip.classList.remove("hidden");
    var r = els.tip.getBoundingClientRect();
    var left = Math.min(Math.max(8, x - r.width / 2), window.innerWidth - r.width - 8);
    var top = y - r.height - 12;
    if (top < 8) top = y + 18;
    els.tip.style.left = left + "px";
    els.tip.style.top = top + "px";
  }
  function hideTip() { els.tip.classList.add("hidden"); }

  // ---------- выборка ----------
  function useRange() { return !!(state.from || state.to); }
  function inPeriod(p) {
    if (useRange()) {
      var d = p.iso;
      return (!state.from || d >= state.from) && (!state.to || d <= state.to);
    }
    if (state.period === "ALL") return true;
    if (state.period.indexOf("w:") === 0) return p.monday === iso(state.period.slice(2));
    return p.month === state.period.slice(2); // "m:MM.YYYY"
  }
  function periodLabel() {
    if (useRange()) return "по датам";
    if (state.period === "ALL") return "за всё время";
    if (state.period.indexOf("w:") === 0) return "нед. " + SMM.weekRange(state.period.slice(2));
    return state.period.slice(2);
  }

  function agg(list) {
    var a = { posts: 0, inter: 0, reach: 0 };
    list.forEach(function (p) { a.posts++; a.inter += p.inter; a.reach += p.reach; });
    a.perPost = a.posts ? a.inter / a.posts : null;
    a.reachPer = a.posts ? a.reach / a.posts : null;
    a.er = a.reach ? a.inter / a.reach : null;
    return a;
  }
  function groupBy(list, f) {
    var m = {};
    list.forEach(function (p) { var k = f(p); (m[k] = m[k] || []).push(p); });
    return m;
  }

  function fillSelects() {
    if (!els.periodSel.options.length) {
      var weeks = D.weeks.slice().reverse();
      var months = [];
      POSTS.forEach(function (p) { if (months.indexOf(p.month) < 0) months.push(p.month); });
      months.sort(function (a, b) { return (b.slice(3) + b.slice(0, 2)).localeCompare(a.slice(3) + a.slice(0, 2)); });
      els.periodSel.innerHTML =
        '<optgroup label="Неделя">' + weeks.map(function (w) {
          return '<option value="w:' + w + '">нед. ' + SMM.weekRange(w) + "</option>";
        }).join("") + "</optgroup>" +
        '<optgroup label="Месяц">' + months.map(function (m) {
          return '<option value="m:' + m + '">' + m + "</option>";
        }).join("") + "</optgroup>" +
        '<option value="ALL">Всё время</option>';
      els.projSel.innerHTML = '<option value="ALL">Все бренды</option>' +
        D.projects.map(function (p) { return '<option value="' + esc(p) + '">' + (SMM.EMOJI[p] || "") + " " + esc(p) + "</option>"; }).join("");
    }
    els.periodSel.value = state.period;
    els.projSel.value = state.project;
    els.periodSel.disabled = useRange();
  }

  // ---------- KPI ----------
  function renderKpis(sel) {
    var t = agg(sel);
    function kpi(label, val, sub) {
      return '<div class="kpi"><div class="kpi-label">' + label + '</div><div class="kpi-val">' + val +
        '</div><div class="kpi-delta flat">' + (sub || "") + "</div></div>";
    }
    var scope = state.project === "ALL" ? "все бренды" : state.project;
    els.kpis.innerHTML = [
      kpi("Постов в выборке", nf(t.posts), scope + " · " + periodLabel()),
      kpi("Реакций / пост", nf(t.perPost), "среднее по выборке"),
      kpi("ER", pct(t.er), "Σ взаимодействий ÷ Σ охвата"),
      kpi("Взаимодействий", nf(t.inter), "всего"),
      kpi("Охват", nf(t.reach), "всего"),
    ].join("");
  }

  // ---------- выводы недели ----------
  function renderInsights() {
    var ins = D.insights, w = ins.week;
    var isThat = !useRange() && state.period === "w:" + w;
    els.insWeek.textContent = "нед. " + SMM.weekRange(w) + " · по всем брендам";
    if (isThat) {
      els.insGrid.innerHTML = ins.items.map(function (i) {
        return '<div class="ins"><span class="badge">' + i.tag + "</span><p>" + i.html + "</p></div>";
      }).join("");
      els.recsList.innerHTML = ins.recs.map(function (r) { return "<li><span>" + r + "</span></li>"; }).join("");
    } else {
      var note = '<div class="ins-note">Выводы и рекомендации написаны для <b>нед. ' + SMM.weekRange(w) +
        '</b>. <button class="ghost-btn sm" data-goweek="' + w + '">Показать эту неделю</button></div>';
      els.insGrid.innerHTML = note;
      els.recsList.innerHTML = "";
    }
    els.recsList.parentNode.classList.toggle("hidden", !isThat);
  }

  // ---------- рейтинг ----------
  function renderRating(sel) {
    var scope = state.project === "ALL" ? "все бренды" : state.project;
    var g = groupBy(sel, function (p) { return p.type; });
    var all = Object.keys(g).map(function (t) { var a = agg(g[t]); a.type = t; return a; })
      .sort(function (a, b) { return b.perPost - a.perPost; });
    var rows = all.filter(function (r) { return r.posts >= state.minPosts; });
    var hidden = all.length - rows.length;
    els.ratingScope.textContent = scope + " · " + periodLabel() + (hidden ? " · скрыто форматов с малой выборкой: " + hidden : "");

    var max = rows.reduce(function (m, r) { return Math.max(m, r.perPost || 0); }, 0) || 1;
    var head = "<thead><tr>" +
      "<th>Формат</th><th>Реакций / пост</th><th>Постов</th>" +
      '<th class="col-opt">Реакций всего</th><th class="col-opt">Reach / пост</th>' +
      '<th class="col-opt">Reach всего</th><th class="col-opt">ER</th>' +
      "</tr></thead>";

    var body = rows.map(function (r) {
      var w = Math.max(2, ((r.perPost || 0) / max) * 100);
      return "<tr>" +
        "<td>" + esc(r.type) + "</td>" +
        '<td class="bar-cell"><div class="bar"><span style="width:' + w.toFixed(1) + '%"></span></div>' +
          '<div style="margin-top:4px">' + nf(r.perPost) + "</div></td>" +
        "<td>" + nf(r.posts) + "</td>" +
        '<td class="col-opt">' + nf(r.inter) + "</td>" +
        '<td class="col-opt">' + nf(r.reachPer) + "</td>" +
        '<td class="col-opt">' + nf(r.reach) + "</td>" +
        '<td class="col-opt">' + pct(r.er) + "</td>" +
        "</tr>";
    }).join("");

    els.ratingTable.innerHTML = rows.length ? head + "<tbody>" + body + "</tbody>"
      : '<tbody><tr><td class="mt-empty">За выбранный период постов нет.</td></tr></tbody>';
  }

  // ---------- ER по брендам ----------
  function renderEr(period) {
    var g = groupBy(period, function (p) { return p.project; });
    var rows = D.projects.filter(function (p) { return g[p]; }).map(function (p) { var a = agg(g[p]); a.project = p; return a; })
      .sort(function (a, b) { return (b.er || 0) - (a.er || 0); });
    var max = rows.reduce(function (m, r) { return Math.max(m, r.er || 0); }, 0) || 1;
    var head = "<thead><tr><th>Бренд</th><th>ER</th><th>Постов</th><th>Реакций / пост</th></tr></thead>";
    var body = rows.map(function (r) {
      var w = Math.max(2, ((r.er || 0) / max) * 100);
      return '<tr><td><span class="dot" style="background:' + SMM.COLOR[r.project] + '"></span>' + esc(r.project) + "</td>" +
        '<td class="bar-cell"><div class="bar er"><span style="width:' + w.toFixed(1) + '%"></span></div>' +
          '<div style="margin-top:4px">' + pct(r.er) + "</div></td>" +
        "<td>" + nf(r.posts) + "</td><td>" + nf(r.perPost) + "</td></tr>";
    }).join("");
    els.erTable.innerHTML = head + "<tbody>" + body + "</tbody>";
  }

  // ---------- теплокарта ----------
  function renderHeatmap(period) {
    var projects = D.projects.filter(function (p) { return period.some(function (x) { return x.project === p; }); });
    var byType = groupBy(period, function (p) { return p.type; });
    var types = Object.keys(byType)
      .filter(function (t) { return byType[t].length >= state.minPosts; })
      .sort(function (a, b) { return agg(byType[b]).perPost - agg(byType[a]).perPost; });
    var cells = {}, vals = [];
    types.forEach(function (t) {
      var g = groupBy(byType[t], function (p) { return p.project; });
      projects.forEach(function (p) {
        if (!g[p]) return;
        var a = agg(g[p]);
        cells[t + "|" + p] = a;
        vals.push(a.perPost);
      });
    });
    if (!vals.length) { els.heatmap.innerHTML = ""; els.hmLegend.innerHTML = ""; return; }

    // Домен шкалы — 5-й…95-й процентиль с обрезкой по краям: одиночные выбросы
    // (формат с одним постом) иначе сжимают всю остальную карту в середину.
    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var lo = Math.round(quantile(sorted, 0.05)), hi = Math.round(quantile(sorted, 0.95));
    if (hi <= lo) { lo = sorted[0]; hi = sorted[sorted.length - 1] || lo + 1; }

    function step(v) {
      if (hi === lo) return RAMP.length - 1;
      var i = Math.floor(((v - lo) / (hi - lo)) * RAMP.length);
      return Math.max(0, Math.min(RAMP.length - 1, i));
    }

    var head = '<thead><tr><th class="rowhead">Формат</th>' +
      projects.map(function (p) { return "<th>" + esc(p) + "</th>"; }).join("") + "</tr></thead>";

    var body = types.map(function (t) {
      var tds = projects.map(function (p) {
        var c = cells[t + "|" + p];
        if (!c) return '<td class="empty">—</td>';
        var s = step(c.perPost);
        return '<td class="filled' + (s >= LIGHT_FROM ? " light" : "") + '"' +
          ' style="background:' + RAMP[s] + '"' +
          ' data-type="' + esc(t) + '" data-proj="' + esc(p) + '"' +
          ' data-posts="' + c.posts + '" data-val="' + c.perPost + '" data-er="' + (c.er == null ? "" : c.er) + '">' + nf(c.perPost) + "</td>";
      }).join("");
      return '<tr><th class="rowhead" title="' + esc(t) + '">' + esc(t) + "</th>" + tds + "</tr>";
    }).join("");

    els.heatmap.innerHTML = head + "<tbody>" + body + "</tbody>";

    els.hmLegend.innerHTML = "<span>≤ " + nf(lo) + "</span><span class=\"swatches\">" +
      RAMP.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join("") +
      "</span><span>≥ " + nf(hi) + " реакций / пост</span>" +
      '<span class="hm-legend-note">шкала обрезана по 5–95 процентилю</span>';
  }

  function cellTip(td) {
    var r = td.getBoundingClientRect();
    showTip("<b>" + esc(td.dataset.type) + " · " + esc(td.dataset.proj) + "</b>" +
      nf(td.dataset.val) + " реакций / пост<br>" + nf(td.dataset.posts) + " постов" +
      (td.dataset.er ? " · ER " + pct(Number(td.dataset.er)) : ""),
      r.left + r.width / 2, r.top);
  }
  els.heatmap.addEventListener("mouseover", function (e) {
    var td = e.target.closest("td.filled");
    if (!td) return hideTip();
    cellTip(td);
  });
  els.heatmap.addEventListener("mouseleave", hideTip);
  els.heatmap.addEventListener("click", function (e) {
    var td = e.target.closest("td.filled");
    if (!td) return hideTip();
    cellTip(td);
  });

  // ---------- рендер ----------
  function render() {
    if (!D) return;
    fillSelects();
    var period = POSTS.filter(inPeriod);
    var sel = state.project === "ALL" ? period : period.filter(function (p) { return p.project === state.project; });
    renderKpis(sel);
    renderInsights();
    renderRating(sel);
    renderEr(period);
    renderHeatmap(period);
  }

  // ---------- загрузка ----------
  function load(fresh) {
    els.refreshBtn.textContent = "…";
    return DashAPI.formats(fresh)
      .then(function (data) {
        D = data;
        POSTS = data.posts.map(function (r) {
          return { date: r[0], iso: iso(r[0]), monday: mondayIso(r[0]), month: r[0].slice(3), project: r[1], type: r[2], reach: r[3], inter: r[4] };
        });
        if (!state) state = defaults();
        els.periodSel.innerHTML = "";
        els.meta.textContent = "данные на " + SMM.builtAt(data.fetchedAt);
        render();
      })
      .catch(function (e) { toast("Не удалось загрузить: " + e.message, true); })
      .then(function () { els.refreshBtn.textContent = "⟳"; });
  }

  // ---------- события ----------
  els.periodSel.addEventListener("change", function () { state.period = els.periodSel.value; render(); });
  els.projSel.addEventListener("change", function () { state.project = els.projSel.value; render(); });
  els.minSel.addEventListener("change", function () { state.minPosts = Number(els.minSel.value); render(); });
  els.fromInp.addEventListener("change", function () { state.from = els.fromInp.value; render(); });
  els.toInp.addEventListener("change", function () { state.to = els.toInp.value; render(); });
  els.resetBtn.addEventListener("click", function () {
    state = defaults();
    els.fromInp.value = ""; els.toInp.value = ""; els.minSel.value = "1";
    render();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-goweek]");
    if (!b) return;
    state.from = state.to = ""; els.fromInp.value = els.toInp.value = "";
    state.period = "w:" + b.dataset.goweek;
    render();
  });
  els.refreshBtn.addEventListener("click", function () { load(true); });
  window.addEventListener("scroll", hideTip, { passive: true });

  load(false);
})();
