/* Grade or Raw — shared page behavior (nav toggle, config-driven links). No tracking. */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Placeholder links filled from assets/js/config.js
  var cfg = window.GOR_CONFIG || {};
  var isUrl = function (u) { return typeof u === "string" && /^https:\/\//i.test(u); };
  document.querySelectorAll("[data-config-link]").forEach(function (el) {
    var key = el.getAttribute("data-config-link");
    var url = cfg[key];
    var link = el.querySelector("a");
    var pending = el.querySelector(".pending");
    if (isUrl(url) && link) {
      link.href = url;
      link.hidden = false;
      if (pending) pending.hidden = true;
    }
  });

  // Footer year
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
