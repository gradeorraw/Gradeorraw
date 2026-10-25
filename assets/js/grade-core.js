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
  var LATER_CUTOFF = 65;      // projection score needed for "grade later"

  var FACTORS = [
    { key: "supply", label: "Supply / print run (scarcer = higher)", weight: 0.25 },
    { key: "oop", label: "Out of print, and for how long (longer = higher)", weight: 0.20 },
    { key: "pokemon", label: "Pokémon popularity", weight: 0.20 },
    { key: "set", label: "Set popularity", weight: 0.15 },
    { key: "momentum", label: "Price momentum (90-day trend)", weight: 0.10 },
    { key: "popgrowth", label: "PSA 10 pop growth (slow growth = higher)", weight: 0.10 }
  ];

  function n(x) {
    var v = typeof x === "number" ? x : parseFloat(x);
    return isFinite(v) ? v : NaN;
  }
  function round2(x) { return Math.round(x * 100) / 100; }

  /**
   * Today's expected-value verdict.
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

  /** Projection score 0-100 from six 0-10 factor scores. Missing factors count as 5. */
  function projectionScore(scores) {
    scores = scores || {};
    var total = 0;
    FACTORS.forEach(function (f) {
      var s = n(scores[f.key]);
      if (isNaN(s)) s = 5;
      s = Math.min(10, Math.max(0, s));
      total += f.weight * s * 10;
    });
    return Math.round(total * 10) / 10;
  }

  /** Forward call: "now" | "later" | "raw". */
  function outlook(todayVerdict, score) {
    if (todayVerdict === "grade") return "now";
    return score >= LATER_CUTOFF ? "later" : "raw";
  }

  var LABELS = {
    verdict: { grade: "Grade", borderline: "Borderline (only if you want the slab)", raw: "Keep raw" },
    outlook: { now: "Grade now", later: "Grade later", raw: "Keep raw", grade_now: "Grade now", grade_later: "Grade later", keep_raw: "Keep raw" }
  };

  function money(x) {
    if (x === null || x === undefined || isNaN(x)) return "—";
    var sign = x < 0 ? "−" : "";
    return sign + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return {
    MIN_GAIN_USD: MIN_GAIN_USD, MIN_GAIN_PCT: MIN_GAIN_PCT, LATER_CUTOFF: LATER_CUTOFF,
    FACTORS: FACTORS, LABELS: LABELS,
    evaluate: evaluate, projectionScore: projectionScore, outlook: outlook, money: money
  };
});
