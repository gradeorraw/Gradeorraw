/* Grade or Raw — interactive calculator. Runs entirely in the browser; nothing is sent anywhere. */
(function () {
  "use strict";
  var C = window.GradeCore;
  var form = document.getElementById("calc-form");
  if (!C || !form) return;

  var $ = function (id) { return document.getElementById(id); };
  var FIELDS = ["raw", "v10", "v9", "v8", "p10", "p9", "fee", "returnShip", "cards", "inbound"];
  var DEFAULTS = {};
  FIELDS.forEach(function (k) { DEFAULTS[k] = $(k).value; });

  var preset = $("feePreset");

  function num(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : NaN; }

  function setText(id, t) { var el = $(id); if (el) el.textContent = t; }

  function update() {
    // Clear old error states
    FIELDS.forEach(function (k) { $(k).removeAttribute("aria-invalid"); });

    var cards = Math.max(1, Math.floor(num("cards") || 1));
    var returnShip = num("returnShip"), inbound = num("inbound");
    var shipPerCard = (isNaN(returnShip) ? NaN : returnShip / cards) + (isNaN(inbound) ? 0 : inbound);
    setText("shipPerCardOut", C.money(shipPerCard));

    var r = C.evaluate({
      raw: $("raw").value, v10: $("v10").value, v9: $("v9").value, v8: $("v8").value,
      p10: $("p10").value, p9: $("p9").value, fee: $("fee").value, shipPerCard: shipPerCard
    });

    var errBox = $("calc-errors");
    var verdictEl = $("verdictOut");
    if (!r.ok) {
      errBox.hidden = false;
      errBox.innerHTML = "";
      var ul = document.createElement("ul");
      r.errors.forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.message; ul.appendChild(li);
        var map = { shipPerCard: "returnShip" };
        var el = $(map[e.field] || e.field); if (el) el.setAttribute("aria-invalid", "true");
      });
      errBox.appendChild(ul);
      verdictEl.textContent = "Check inputs";
      verdictEl.className = "verdict-big";
      ["pLowOut", "grossOut", "costOut", "evOut", "gainOut", "barOut", "neededOut"].forEach(function (id) { setText(id, "—"); });
      return;
    }
    errBox.hidden = true;

    setText("pLowOut", r.pLowPct.toFixed(1) + "%");
    setText("grossOut", C.money(r.grossValue));
    setText("costOut", C.money(r.cost));
    setText("evOut", C.money(r.evGrade));
    setText("gainOut", C.money(r.gain) + (r.gainPctOfRaw !== null ? " (" + r.gainPctOfRaw.toFixed(0) + "% of raw)" : ""));
    setText("barOut", C.money(r.bar));
    setText("neededOut", r.v10Needed === null ? "n/a (PSA 10 chance is 0%)" : C.money(r.v10Needed));
    $("v8note").hidden = !r.v8Defaulted;

    verdictEl.textContent = C.LABELS.verdict[r.verdict];
    verdictEl.className = "verdict-big " + (r.verdict === "grade" ? "verdict-grade" : r.verdict === "borderline" ? "verdict-border" : "verdict-raw");

    var why;
    if (r.verdict === "grade") why = "Expected gain of " + C.money(r.gain) + " clears the " + C.money(r.bar) + " bar.";
    else if (r.verdict === "borderline") why = "Positive expected gain, but below the " + C.money(r.bar) + " bar that covers months of waiting and grade risk. Grade only if you want the slab for your collection.";
    else why = "Grading is expected to lose " + C.money(-r.gain) + " versus selling or holding raw.";
    setText("whyOut", why);

    // Max insured value warning for the chosen tier
    var opt = preset.options[preset.selectedIndex];
    var maxV = opt && opt.getAttribute("data-max") ? parseFloat(opt.getAttribute("data-max")) : NaN;
    var v10 = num("v10");
    var tierWarn = $("tierWarn");
    if (isFinite(maxV) && isFinite(v10) && v10 > maxV) {
      tierWarn.hidden = false;
      tierWarn.textContent = "Heads up: a PSA 10 at " + C.money(v10) + " is above this tier's " + C.money(maxV) + " max declared value. You'd likely need a pricier tier.";
    } else tierWarn.hidden = true;

  }

  preset.addEventListener("change", function () {
    var opt = preset.options[preset.selectedIndex];
    var fee = opt.getAttribute("data-fee");
    if (fee) $("fee").value = fee;
    update();
  });
  $("fee").addEventListener("input", function () {
    var opt = preset.options[preset.selectedIndex];
    if (opt.getAttribute("data-fee") && opt.getAttribute("data-fee") !== $("fee").value) preset.value = "custom";
  });

  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); update(); });

  // Share link: encode inputs into the URL query (stays on this page, nothing is uploaded)
  function shareUrl() {
    var p = new URLSearchParams();
    FIELDS.forEach(function (k) { p.set(k, $(k).value); });
    return location.origin + location.pathname + "?" + p.toString();
  }
  $("shareBtn").addEventListener("click", function () {
    var url = shareUrl();
    var status = $("shareStatus");
    history.replaceState(null, "", url);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { status.textContent = "Link copied."; },
        function () { status.textContent = "Link is in your address bar."; });
    } else status.textContent = "Link is in your address bar.";
  });
  $("resetBtn").addEventListener("click", function () {
    Object.keys(DEFAULTS).forEach(function (k) { $(k).value = DEFAULTS[k]; });
    preset.value = "psa-standard";
    history.replaceState(null, "", location.pathname);
    $("shareStatus").textContent = "Reset to example numbers.";
    update();
  });

  // Load values from the URL, if present
  var q = new URLSearchParams(location.search);
  var loaded = false;
  Object.keys(DEFAULTS).forEach(function (k) {
    var v = q.get(k);
    if (v !== null && v !== "" && isFinite(parseFloat(v))) { $(k).value = v; loaded = true; }
  });
  if (loaded) {
    var feeNow = $("fee").value, match = false;
    Array.prototype.forEach.call(preset.options, function (o) { if (o.getAttribute("data-fee") === feeNow) { preset.value = o.value; match = true; } });
    if (!match) preset.value = "custom";
  }
  update();
})();
