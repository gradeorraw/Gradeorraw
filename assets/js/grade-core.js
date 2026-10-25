/*
 * Grade or Raw — the verdict math, shared by the calculator and verdicts pages.
 * Plain functions with no DOM access, so they can also be tested in Node.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GradeCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Starting thresholds from the methodology (tuned over time).
  var MIN_GAIN_USD = 25;      // gain must be at least $25 ...
  var MIN_GAIN_PCT = 0.20;    // ... and at least 20% of raw value

  function n(x) {
    var v = typeof x === "number" ? x : parseFloat(x);
    return isFinite(v) ? v : NaN;
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  /**
   * Expected-value verdict from current prices, odds, fees and shipping.
   * inputs: raw, v10, v9, v8 (USD; v8 optional, defaults to raw),
   *         p10, p9 (percent 0-100), fee (USD per card), shipPerCard (USD per card).
   */
  function evaluate(inputs) {
    var errors = [];
    var raw = n(inputs.raw), v10 = n(inputs.v10), v9 = n(inputs.v9);
    var v8Given = inputs.v8 !== undefined && inputs.v8 !== null && String(inputs.v8).trim() !== "";
    var v8 = v8Given ? n(inputs.v8) : raw;
    var p10 = n(inputs.p10), p9 = n(inputs.p9);
    var fee = n(inputs.fee), ship = n(inputs.shipPerCard);

    [["raw", raw, "Raw value"], ["v10", v10, "PSA 10 value"], ["v9", v9, "PSA 9 value"],
     ["v8", v8, "PSA 8-or-lower value"], ["fee", fee, "Grading fee"], ["shipPerCard", ship, "Shipping per card"]]
      .forEach(function (f) {
        if (isNaN(f[1])) errors.push({ field: f[0], message: f[2] + " needs a number." });
        else if (f[1] < 0) errors.push({ field: f[0], message: f[2] + " can't be negative." });
      });
    [["p10", p10, "Chance of PSA 10"], ["p9", p9, "Chance of PSA 9"]].forEach(function (f) {
      if (isNaN(f[1])) errors.push({ field: f[0], message: f[2] + " needs a number." });
      else if (f[1] < 0 || f[1] > 100) errors.push({ field: f[0], message: f[2] + " must be between 0 and 100%." });
    });
    if (!isNaN(p10) && !isNaN(p9) && p10 + p9 > 100.0001) {
      errors.push({ field: "p9", message: "PSA 10 and PSA 9 chances add up to more than 100%." });
    }
    if (errors.length) return { ok: false, errors: errors };

    var P10 = p10 / 100, P9 = p9 / 100, Plow = Math.max(0, 1 - P10 - P9);
    var gross = P10 * v10 + P9 * v9 + Plow * v8;
    var cost = fee + ship;
    var evGrade = gross - cost;
    var gain = evGrade - raw;
    var bar = Math.max(MIN_GAIN_USD, MIN_GAIN_PCT * raw);
    var verdict = gain >= bar ? "grade" : gain > 0 ? "borderline" : "raw";

    // What PSA 10 price would clear the bar, holding everything else fixed?
    var v10Needed = P10 > 0 ? (bar + raw + cost - P9 * v9 - Plow * v8) / P10 : null;

    return {
      ok: true,
      pLowPct: round2(Plow * 100),
      v8Used: v8,
      v8Defaulted: !v8Given,
      grossValue: round2(gross),
      cost: round2(cost),
      evGrade: round2(evGrade),
      gain: round2(gain),
      gainPctOfRaw: raw > 0 ? round2((gain / raw) * 100) : null,
      bar: round2(bar),
      verdict: verdict,
      v10Needed: v10Needed === null ? null : round2(Math.max(0, v10Needed))
    };
  }

  var LABELS = {
    verdict: { grade: "Grade", borderline: "Borderline (only if you want the slab)", raw: "Keep raw" }
  };

  function money(x) {
    if (x === null || x === undefined || isNaN(x)) return "—";
    var sign = x < 0 ? "−" : "";
    return sign + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return {
    MIN_GAIN_USD: MIN_GAIN_USD, MIN_GAIN_PCT: MIN_GAIN_PCT,
    LABELS: LABELS,
    evaluate: evaluate, money: money
  };
});
