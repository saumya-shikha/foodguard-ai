const fs = require("fs");
const path = require("path");

let dataset = [];

function normalizeStateName(name) {
  // Keep original casing consistent by mapping to dataset values elsewhere.
  return String(name ?? "").trim();
}

function loadDatasetOrThrow() {
  // __dirname = backend/src/services, so go up two levels to backend/
  const datasetPath = path.join(__dirname, "..", "..", "data", "dataset.json");

  try {
    const raw = fs.readFileSync(datasetPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      Throw new Error("Dataset must be an array of records");
    }

    // Basic shape validation (fail fast if the file is corrupted).
    for (const row of parsed) {
      if (
        typeof row.state !== "string" ||
        typeof row.year !== "number" ||
        typeof row.food_category !== "string" ||
        typeof row.contamination_cases !== "number"
      ) {
        Throw new Error("Dataset contains invalid record shape");
      }
    }

    dataset = parsed;
  } catch (err) {
    console.error("Failed to load dataset.json:", err);
    Throw err;
  }
}

function getAllData() {
  return dataset;
}

function getByState(stateName) {
  const target = String(stateName).toLowerCase();
  // Match case-insensitively.
  const rows = dataset.filter((r) => r.state.toLowerCase() === target);
  return rows;
}

function getByYear(year) {
  return dataset.filter((r) => r.year === year);
}

function filterData({ state, year, category }) {
  const stateLower = state ? String(state).toLowerCase() : null;
  const yearNum = year != null && year !== "" ? Number(year) : null;
  const catLower = category ? String(category).toLowerCase() : null;

  return dataset.filter((r) => {
    if (stateLower && r.state.toLowerCase() !== stateLower) return false;
    if (yearNum != null && Number.isFinite(yearNum) && r.year !== yearNum)
      return false;
    if (catLower && r.food_category.toLowerCase() !== catLower) return false;
    return true;
  });
}

function computeInsights({ state, year, category }) {
  const rows = filterData({ state, year, category });
  const total = rows.reduce((s, r) => s + (r.contamination_cases || 0), 0);

  const states = new Set(rows.map((r) => r.state));
  const years = new Set(rows.map((r) => r.year));
  const categories = new Set(rows.map((r) => r.food_category));

  // Aggregate helpers
  const byState = new Map();
  const byCategory = new Map();
  const byYear = new Map();
  const byYearCategory = new Map(); // year -> Map(category -> cases)

  for (const r of rows) {
    const c = Number(r.contamination_cases || 0);
    byState.set(r.state, (byState.get(r.state) || 0) + c);
    byCategory.set(r.food_category, (byCategory.get(r.food_category) || 0) + c);
    byYear.set(r.year, (byYear.get(r.year) || 0) + c);
    if (!byYearCategory.has(r.year)) byYearCategory.set(r.year, new Map());
    const m = byYearCategory.get(r.year);
    m.set(r.food_category, (m.get(r.food_category) || 0) + c);
  }

  const topState = Array.from(byState.entries()).sort((a, b) => b[1] - a[1])[0];
  const topCategory = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
  const yearSeries = Array.from(byYear.entries())
    .map(([y, cases]) => ({ year: y, cases }))
    .sort((a, b) => a.year - b.year);

  // Simple linear regression forecast on yearly totals
  let forecast = null;
  if (yearSeries.length >= 2) {
    const xs = yearSeries.map((p) => p.year);
    const ys = yearSeries.map((p) => p.cases);
    const n = xs.length;
    const xMean = xs.reduce((s, v) => s + v, 0) / n;
    const yMean = ys.reduce((s, v) => s + v, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (ys[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yMean - slope * xMean;
    const nextYear = Math.max(...xs) + 1;
    const predicted = Math.max(0, Math.round(intercept + slope * nextYear));
    forecast = { year: nextYear, predicted_cases: predicted, slope_per_year: Math.round(slope) };
  }

  // Anomaly detection (outliers) using robust threshold: > P90 in current selection
  const casesArr = rows.map((r) => Number(r.contamination_cases || 0)).sort((a, b) => a - b);
  const p90 =
    casesArr.length > 0
      ? casesArr[Math.min(casesArr.length - 1, Math.floor(casesArr.length * 0.9))]
      : 0;

  const anomalies = rows
    .filter((r) => Number(r.contamination_cases || 0) >= p90 && p90 > 0)
    .sort((a, b) => b.contamination_cases - a.contamination_cases)
    .slice(0, 8)
    .map((r) => ({
      state: r.state,
      year: r.year,
      food_category: r.food_category,
      contamination_cases: r.contamination_cases,
    }));

  // Recommendations: focus top category in top state, and top anomaly hotspot
  const recs = [];
  if (topState && topCategory) {
    recs.push(
      `Prioritize inspections in ${topState[0]} focusing on ${topCategory[0]} handling and storage.`
    );
  }
  if (anomalies.length) {
    const a = anomalies[0];
    recs.push(
      `Investigate spike: ${a.state} (${a.year}) in ${a.food_category} with ${a.contamination_cases} cases.`
    );
  }
  if (forecast) {
    recs.push(
      `Prepare for next year (${forecast.year}) with an estimated ${forecast.predicted_cases.toLocaleString()} cases based on trend.`
    );
  }

  const summary = {
    filter: { state: state || "All", year: year || "All", category: category || "All" },
    totals: {
      records: rows.length,
      total_cases: total,
      states: states.size,
      years: years.size,
      categories: categories.size,
    },
    top: {
      state: topState ? { name: topState[0], cases: topState[1] } : null,
      category: topCategory ? { name: topCategory[0], cases: topCategory[1] } : null,
    },
    forecast,
    anomalies,
    recommendations: recs,
  };

  return summary;
}

module.exports = {
  loadDatasetOrThrow,
  getAllData,
  getByState,
  getByYear,
  normalizeStateName,
  filterData,
  computeInsights,
};

