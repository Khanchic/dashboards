// Вкладка Power BI: запуск pbi-extract через локальную Панель (node panel/server.js, порт 8787)
// + встроенный отчёт. Панель живёт только на машине Александра — с телефона кнопка честно скажет, что её нет.
(function () {
  "use strict";
  var PANEL = "http://localhost:8787";
  var els = {};
  ["pbiStatus", "pbiWeek", "pbiRun", "pbiCheck", "pbiLog", "pbiFull", "pbiWrap"].forEach(function (id) { els[id] = document.getElementById(id); });

  // ISO-неделя: последние 4 завершённые, новейшая первой
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    var y = t.getUTCFullYear(), w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
    return y + "-W" + String(w).padStart(2, "0");
  }
  function ddmm(d) { return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0"); }
  (function fillWeeks() {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
    var html = "";
    for (var i = 0; i < 4; i++) {
      var s = new Date(mon); s.setDate(mon.getDate() - 7 * i);
      var e = new Date(s); e.setDate(s.getDate() + 6);
      html += '<option value="' + isoWeek(s) + '">' + isoWeek(s) + " (" + ddmm(s) + "–" + ddmm(e) + ")</option>";
    }
    els.pbiWeek.innerHTML = html;
  })();

  function status(ok) {
    els.pbiStatus.className = "status-pill " + (ok ? "ok" : "bad");
    els.pbiStatus.textContent = ok ? "Локальная Панель активна (порт 8787)" : "Панель не отвечает (node panel/server.js)";
  }
  function check() {
    fetch(PANEL + "/api/actions").then(function (r) { status(r.ok); }).catch(function () { status(false); });
  }
  function log(line) { els.pbiLog.classList.remove("hidden"); els.pbiLog.textContent += line + "\n"; els.pbiLog.scrollTop = els.pbiLog.scrollHeight; }

  function run() {
    var week = els.pbiWeek.value;
    els.pbiRun.disabled = true;
    els.pbiRun.textContent = "⏳ Анализ выполняется…";
    els.pbiLog.textContent = "";
    log("▶ Отправка команды в локальную Панель…");
    function done(msg) {
      els.pbiRun.disabled = false;
      els.pbiRun.textContent = "⚡ Снять и проанализировать неделю";
      if (msg) log(msg);
    }
    fetch(PANEL + "/api/run", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId: "pbi-extract", fields: { week: week } }),
    })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (data) {
        var id = data.runId || (data.run && data.run.id);
        log("✓ Задача запущена" + (id ? " (ID " + id + ")" : ""));
        if (!id) return done("✓ Готово — подробности в Панели.");
        var poll = setInterval(function () {
          fetch(PANEL + "/api/run/" + id).then(function (r) { return r.json(); }).then(function (rd) {
            if (rd.lines && rd.lines.length) els.pbiLog.textContent = rd.lines.map(function (l) { return l.text || l; }).join("\n") + "\n";
            if (/^(ok|done|finished)$/.test(rd.status)) { clearInterval(poll); done("✓ Неделя " + week + " выгружена."); }
            else if (/^(error|failed)$/.test(rd.status)) { clearInterval(poll); done("✕ Ошибка: " + (rd.error || "проверь браузер")); }
          }).catch(function () { clearInterval(poll); done("Связь с Панелью потеряна — проверь статус в ней."); });
        }, 2000);
      })
      .catch(function (e) { done("✕ " + e.message + ". Запущена ли Панель (порт 8787)?"); });
  }

  els.pbiRun.addEventListener("click", run);
  els.pbiCheck.addEventListener("click", check);
  els.pbiFull.addEventListener("click", function () {
    if (document.fullscreenElement) document.exitFullscreen(); else els.pbiWrap.requestFullscreen().catch(function () {});
  });
  check();
})();
