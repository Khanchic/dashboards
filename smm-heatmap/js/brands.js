// Бренди й спільні хелпери для всіх вкладок.
// Палітра — фіксований порядок, перевірена валідатором dataviz на поверхні #121a30 (сусідні пари:
// CVD ΔE ≥ 8,4, нормальний зір ΔE ≥ 19). Порядок кольорів = порядок брендів у графіках і легенді:
// не переставляти поодинці, інакше сусідні лінії зіллються. Ідентичність додатково дублюють
// підписи біля кінців ліній, тож колір не єдина ознака бренду.
window.SMM = (function () {
  "use strict";
  var COLOR = {
    "FWL": "#3987e5", "FireSeven": "#d95926", "Vegas Way": "#199e70", "StormRush": "#c98500",
    "NLC": "#d55181", "SCS": "#9085e9", "DEXYPLAY": "#e66767", "TAO Fortune": "#2a9fb0",
  };
  var EMOJI = {
    "FWL": "🎡", "FireSeven": "🔥", "Vegas Way": "🎰", "StormRush": "🌪️",
    "NLC": "💎", "SCS": "🏜️", "DEXYPLAY": "⚡", "TAO Fortune": "🥠",
  };

  function pad(v) { return String(v).padStart(2, "0"); }
  // неделя подписана понедельником, с которого начинается (как колонки USA 2 Projects) → «07.09–13.09»
  function weekRange(label) {
    var m = String(label || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return label;
    var start = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])), end = new Date(start.getTime() + 6 * 86400000);
    return pad(start.getUTCDate()) + "." + pad(start.getUTCMonth() + 1) + "–" + pad(end.getUTCDate()) + "." + pad(end.getUTCMonth() + 1);
  }
  function builtAt(iso) {
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  return { COLOR: COLOR, EMOJI: EMOJI, weekRange: weekRange, builtAt: builtAt };
})();
