'use strict';

// ─── Individual component scorers (each returns 0.0–1.0) ──────────────────

function scoreWaterDepth(depth, cfg) {
  if (!depth || depth <= 0) return 0.5;
  const max = cfg.maxDepth || 500;
  if (cfg.mode === 'deep_preferred') {
    return Math.min(1, depth / max);
  }
  // default: shallow_preferred
  return Math.max(0, 1 - (depth / max));
}

function scoreRemovalMethod(method, cfg) {
  const key = (method || '').trim();
  if (cfg[key] !== undefined) return cfg[key];
  return cfg['default'] !== undefined ? cfg['default'] : 0.3;
}

function scorePlatformAge(completionDateStr, cfg) {
  // completionDate from platstrurem is "MM/DD/YYYY        " (may have trailing spaces)
  const clean = (completionDateStr || '').trim();
  if (!clean) return 0.5;
  const parts = clean.split('/');
  if (parts.length < 3) return 0.5;
  const year = parseInt(parts[2]);
  if (!year || isNaN(year)) return 0.5;
  const age = new Date().getFullYear() - year;
  const maxYears = cfg.maxYears || 50;
  const normalised = Math.min(1, Math.max(0, age / maxYears));
  // preferNewer: true  → newer = higher score (1 - normalised)
  // preferNewer: false → older = higher score (normalised)
  return cfg.preferNewer ? (1 - normalised) : normalised;
}

function scoreDepthCode(code, cfg) {
  const key = String(code || 0);
  return cfg[key] !== undefined ? cfg[key] : 0.5;
}

function scoreActiveWells(key, wellIndex, wellMax) {
  const wells = wellIndex[key] || [];
  const active = wells.filter(w => w.oilProd > 0 || w.gasProd > 0).length;
  if (!wellMax || wellMax === 0) return 0;
  return Math.min(1, active / wellMax);
}

// ─── Main scoring function ─────────────────────────────────────────────────
// Returns { total: 0-100, grade: "A"–"F", components: { name: { raw, weighted } } }
function scoreplatform(platform, wellIndex, wellMax, config) {
  const w = config.weights;
  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0) || 1;

  const rawScores = {
    waterDepth:       scoreWaterDepth(platform.waterDepth, config.waterDepth),
    removalMethod:    scoreRemovalMethod(platform.removalMethod, config.removalMethod),
    platformAge:      scorePlatformAge(platform.completionDate, config.platformAge),
    activeWellsNearby: scoreActiveWells(platform.key, wellIndex, wellMax),
    depthCode:        scoreDepthCode(platform.depthCode, config.depthCode)
  };

  let weightedSum = 0;
  const components = {};
  for (const [name, weight] of Object.entries(w)) {
    const raw = rawScores[name] || 0;
    const weighted = raw * weight;
    weightedSum += weighted;
    components[name] = { raw: Math.round(raw * 100), weighted: Math.round(weighted), weight };
  }

  const total = Math.round((weightedSum / totalWeight) * 100);
  const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'F';

  return { total, grade, components };
}

// ─── Score and sort a list of platform records ────────────────────────────
function scoreAll(platRecords, wellIndex, wellMax, config) {
  return platRecords
    .map(p => ({ ...p, score: scoreplatform(p, wellIndex, wellMax, config) }))
    .sort((a, b) => b.score.total - a.score.total);
}

// ─── Validate a config object; return array of error strings ─────────────
function validateConfig(config) {
  const errors = [];
  if (!config.weights || typeof config.weights !== 'object') {
    errors.push('weights must be an object');
    return errors;
  }
  const sum = Object.values(config.weights).reduce((a, b) => a + Number(b), 0);
  if (Math.abs(sum - 100) > 0.5) {
    errors.push(`weights must sum to 100 (currently ${sum})`);
  }
  for (const [k, v] of Object.entries(config.weights)) {
    if (v < 0 || v > 100) errors.push(`weight "${k}" must be between 0 and 100`);
  }
  const validModes = ['shallow_preferred', 'deep_preferred'];
  if (!validModes.includes(config.waterDepth && config.waterDepth.mode)) {
    errors.push(`waterDepth.mode must be one of: ${validModes.join(', ')}`);
  }
  return errors;
}

module.exports = { scoreAll, scoreplatform, validateConfig };
