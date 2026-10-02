// Кнопка «i» в шапке: панель с расшифровкой метрик страницы (текст лежит в #infoPanel самой страницы).
(function () {
  "use strict";
  // подсказки [data-tip="что это|формула|откуда"]: наведение на десктопе, тап на телефоне
  var tip = document.createElement("div");
  tip.className = "tip kpi-tip hidden";
  document.body.appendChild(tip);
  var tipFor = null;
  function showTip(el) {
    var p = el.getAttribute("data-tip").split("|");
    var head = (el.querySelector(".kpi-label") || {}).textContent || "";
    tip.innerHTML = "<b>" + head + "</b>" + p[0] +
      (p[1] ? '<div class="tt-row"><span>Формула</span>' + p[1] + "</div>" : "") +
      (p[2] ? '<div class="tt-row"><span>Откуда</span>' + p[2] + "</div>" : "");
    tip.classList.remove("hidden");
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8;
    tip.style.left = left + "px"; tip.style.top = top + "px";
    tipFor = el;
  }
  function hideTip() { tip.classList.add("hidden"); tipFor = null; }
  document.addEventListener("mouseover", function (e) {
    var el = e.target.closest && e.target.closest("[data-tip]");
    if (el && el !== tipFor) showTip(el);
    else if (!el && tipFor) hideTip();
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-tip]");
    if (el) { el === tipFor ? hideTip() : showTip(el); } else if (tipFor) hideTip();
  });
  document.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches("[data-tip]")) showTip(e.target); });
  document.addEventListener("focusout", hideTip);
  window.addEventListener("scroll", hideTip, { passive: true });

  var btn = document.getElementById("infoBtn"), panel = document.getElementById("infoPanel");
  if (!btn || !panel) return;

  function set(open) {
    panel.classList.toggle("hidden", !open);
    btn.classList.toggle("active", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var r = btn.getBoundingClientRect();
      panel.style.top = r.bottom + 8 + "px";
    }
  }
  btn.addEventListener("click", function (e) { e.stopPropagation(); set(panel.classList.contains("hidden")); });
  document.addEventListener("click", function (e) { if (!panel.contains(e.target)) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  window.addEventListener("resize", function () { if (!panel.classList.contains("hidden")) set(true); });
})();
