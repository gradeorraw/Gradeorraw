/* Grade or Raw — renders verdicts.json. Numbers are recomputed with the same math as the calculator. */
(function () {
  "use strict";
  var C = window.GradeCore;
  var list = document.getElementById("verdict-list");
  var exList = document.getElementById("example-list");
  var status = document.getElementById("verdict-status");
  if (!C || !list) return;

  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) { return typeof u === "string" && /^https:\/\//i.test(u) ? u : ""; }
  function badgeClass(v) { return v === "grade" || v === "now" || v === "grade_now" ? "badge-grade" : v === "borderline" || v === "later" || v === "grade_later" ? "badge-border" : "badge-raw"; }
  function fmtDate(d) {
    var t = Date.parse(d + "T12:00:00");
    return isNaN(t) ? esc(d) : new Date(t).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function render(v) {
    var r = C.evaluate({ raw: v.raw, v10: v.psa10, v9: v.psa9, v8: v.psa8, p10: v.p10, p9: v.p9, fee: v.fee, shipPerCard: v.ship_per_card });
    var art = document.createElement("article");
    art.className = "card verdict-card" + (v.example ? " card-gold" : "");
    if (v.id) art.id = "v-" + String(v.id).replace(/[^a-zA-Z0-9_-]/g, "");
    var links = v.links || {};
    var hasPaid = safeUrl(links.comps_paid) || safeUrl(links.buy_raw_paid);
    var title = (v.example ? "EXAMPLE: " : "") + v.card + (v.set ? ", " + v.set : "") + (v.number ? " #" + v.number : "");
    var html = "<header><h3>" + esc(title) + "</h3>" +
      (v.example ? '<span class="badge badge-example">Example: placeholder numbers</span>' : "") + "</header>" +
      '<p class="meta">Checked ' + fmtDate(v.date) + (v.comps_note ? " · " + esc(v.comps_note) : "") + "</p>";
    if (!r.ok) {
      html += '<p class="warn-text">This entry has invalid numbers: ' + esc(r.errors.map(function (e) { return e.message; }).join(" ")) + "</p>";
    } else {
      var call = v.outlook || null;
      html += '<p><strong>Today:</strong> <span class="badge ' + badgeClass(r.verdict) + '">' + esc(C.LABELS.verdict[r.verdict]) + "</span>" +
        (call ? ' &nbsp; <strong>Outlook:</strong> <span class="badge ' + badgeClass(call) + '">' + esc(C.LABELS.outlook[call] || call) + "</span>" : "") + "</p>" +
        '<div class="table-wrap"><table><caption class="sr-only">Numbers behind this verdict</caption><tbody>' +
        "<tr><th scope=\"row\">Raw</th><td>" + C.money(+v.raw) + "</td><th scope=\"row\">PSA 9 / PSA 10</th><td>" + C.money(+v.psa9) + " / " + C.money(+v.psa10) + "</td></tr>" +
        "<tr><th scope=\"row\">Grade odds (10 / 9 / ≤8)</th><td>" + esc(v.p10) + "% / " + esc(v.p9) + "% / " + r.pLowPct + "%</td><th scope=\"row\">Cost to grade</th><td>" + C.money(r.cost) + (v.fee_tier ? " (" + esc(v.fee_tier) + ")" : "") + "</td></tr>" +
        "<tr><th scope=\"row\">Expected graded value</th><td>" + C.money(r.grossValue) + "</td><th scope=\"row\">Gain vs raw</th><td>" + C.money(r.gain) + " (bar " + C.money(r.bar) + ")</td></tr>" +
        "</tbody></table></div>";
    }
    if (v.outlook_note) html += "<p><strong>Why the outlook:</strong> " + esc(v.outlook_note) + "</p>";
    if (v.notes) html += "<p>" + esc(v.notes) + "</p>";
    var l = [];
    if (safeUrl(links.x_post)) l.push('<a class="btn btn-secondary btn-small" href="' + esc(links.x_post) + '" rel="noopener">See the post on X</a>');
    if (safeUrl(links.comps)) l.push('<a class="btn btn-secondary btn-small" href="' + esc(links.comps) + '" rel="noopener">Sold comps</a>');
    if (safeUrl(links.comps_paid)) l.push('<a class="btn btn-secondary btn-small" href="' + esc(links.comps_paid) + '" rel="sponsored noopener">Sold comps (paid link)</a>');
    if (safeUrl(links.buy_raw_paid)) l.push('<a class="btn btn-secondary btn-small" href="' + esc(links.buy_raw_paid) + '" rel="sponsored noopener">Buy it raw (paid link)</a>');
    if (l.length) html += '<div class="links">' + l.join("") + "</div>";
    if (hasPaid) html += '<p class="disclosure-inline">Paid links: we earn a commission if you buy through them, at no extra cost to you. Not financial advice.</p>';
    else html += '<p class="disclosure-inline">Not financial advice. Prices change; check current sold listings before you decide.</p>';
    art.innerHTML = html;
    return art;
  }

  fetch("verdicts.json", { cache: "no-cache" })
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(function (data) {
      var real = (data.verdicts || []).filter(function (v) { return !v.example; })
        .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      var examples = (data.examples || []).concat((data.verdicts || []).filter(function (v) { return v.example; }));
      if (real.length) {
        real.forEach(function (v) { list.appendChild(render(v)); });
        status.textContent = real.length + " verdict" + (real.length === 1 ? "" : "s") + ", newest first.";
      } else {
        status.textContent = "No verdicts posted yet. The first ones will appear here soon. Follow @GradeOrRaw on X to see them as they go out.";
      }
      if (exList) examples.forEach(function (v) { v.example = true; exList.appendChild(render(v)); });
    })
    .catch(function () {
      status.textContent = "Couldn't load verdicts right now. If you opened this file directly from disk, serve the folder over http instead.";
    });
})();
