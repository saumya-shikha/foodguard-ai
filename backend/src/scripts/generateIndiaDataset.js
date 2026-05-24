const fs = require("fs");
const path = require("path");

function hashStringToUint32(s) {
  // FNV-1a
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATES = [
  "AndSaumyaa Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "asthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

const CATEGORIES = [
  "Dairy Products",
  "Ready-to-Eat Foods",
  "Spices & Masala",
  "Edible Oils",
  "Meat & Poultry",
  "Produce"
];

const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

// Relative risk-ish weights (purely synthetic but realistic-feeling).
const STATE_WEIGHT = new Map([
  ["Maharashtra", 1.35],
  ["Uttar Pradesh", 1.5],
  ["Delhi", 1.1],
  ["West Bengal", 1.15],
  ["Tamil Nadu", 1.1],
  ["Karnataka", 1.05],
  ["Gujarat", 1.0],
  ["asthan", 0.95],
  ["Bihar", 1.12],
  ["Assam", 0.85],
  ["Kerala", 0.8],
  ["Punjab", 0.78],
  ["Haryana", 0.82],
  ["Odisha", 0.9],
  ["Madhya Pradesh", 1.0],
]);

const CATEGORY_WEIGHT = new Map([
  ["Ready-to-Eat Foods", 1.35],
  ["Dairy Products", 1.25],
  ["Spices & Masala", 1.15],
  ["Edible Oils", 1.05],
  ["Meat & Poultry", 0.95],
  ["Produce", 1.1],
]);

function yearMultiplier(year) {
  // slight trend upward over time with a dip in 2020-21 (inspection/reporting artifact style)
  if (year === 2020) return 0.92;
  if (year === 2021) return 0.96;
  return 0.95 + (year - 2018) * 0.035;
}

function generateCases(state, year, category) {
  const key = `${state}|${year}|${category}`;
  const seed = hashStringToUint32(key);
  const rnd = mulberry32(seed);

  const base = 140 + Math.round(rnd() * 220); // 140..360
  const stateW = STATE_WEIGHT.get(state) ?? 0.9 + rnd() * 0.4;
  const catW = CATEGORY_WEIGHT.get(category) ?? 1.0;
  const yW = yearMultiplier(year);

  // add controlled noise and occasional spikes
  const noise = 0.88 + rnd() * 0.32; // 0.88..1.20
  const spike = rnd() < 0.06 ? 1.25 + rnd() * 0.5 : 1.0; // rare spike

  const cases = Math.max(20, Math.round(base * stateW * catW * yW * noise * spike));
  return cases;
}

function main() {
  const rows = [];
  for (const state of STATES) {
    for (const year of YEARS) {
      for (const category of CATEGORIES) {
        rows.push({
          state,
          year,
          food_category: category,
          contamination_cases: generateCases(state, year, category),
        });
      }
    }
  }

  // Ensure stable ordering for diffs/readability.
  rows.sort((a, b) => {
    if (a.state !== b.state) return a.state.localeCompare(b.state);
    if (a.year !== b.year) return a.year - b.year;
    return a.food_category.localeCompare(b.food_category);
  });

  const outPath = path.join(__dirname, "..", "..", "data", "dataset.json");
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + "\n", "utf8");
  console.log(`Wrote ${rows.length} records to ${outPath}`);
}

main();

