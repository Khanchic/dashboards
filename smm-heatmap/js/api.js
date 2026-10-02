// Транспорт: у референсі це /api/* на сервері, у нас бекенду немає — дані лежать поруч зі
// сторінкою в data/*.json (збирає automation/build-heatmap-dashboard.js з таблиці SMM Insights USA2).
// ⟳ = перечитати JSON в обхід кешу браузера (корисно одразу після пушу).
window.DashAPI = (function () {
  "use strict";

  function get(name, fresh) {
    var url = "data/" + name + ".json" + (fresh ? "?t=" + Date.now() : "");
    return fetch(url, { cache: fresh ? "reload" : "default" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " — " + url);
      return r.json();
    });
  }

  return {
    insights: function (fresh) { return get("insights", fresh); },
    top: function (fresh) { return get("top", fresh); },
    formats: function (fresh) { return get("formats", fresh); },
  };
})();
