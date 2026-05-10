'use strict';

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const router   = express.Router();
const { getData } = require('../lib/dataLoader');
const { scoreAll, validateConfig } = require('../lib/scoringEngine');

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'reuseScoring.json');
const PAGE_SIZE   = 50;

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function applyFilters(records, q) {
  let results = records;

  if (q.company) {
    const term = q.company.toLowerCase();
    results = results.filter(r => r.companyName.toLowerCase().includes(term));
  }
  if (q.area) {
    results = results.filter(r => r.area === q.area);
  }
  if (q.removalMethod) {
    results = results.filter(r => r.removalMethod === q.removalMethod);
  }
  if (q.depthCode) {
    results = results.filter(r => r.depthCode === parseInt(q.depthCode));
  }
  if (q.minDepth) {
    results = results.filter(r => r.waterDepth >= parseInt(q.minDepth));
  }
  if (q.maxDepth) {
    results = results.filter(r => r.waterDepth <= parseInt(q.maxDepth));
  }
  if (q.yearFrom) {
    results = results.filter(r => {
      const y = parseInt((r.completionDate || '').split('/')[2]);
      return y && y >= parseInt(q.yearFrom);
    });
  }
  if (q.yearTo) {
    results = results.filter(r => {
      const y = parseInt((r.completionDate || '').split('/')[2]);
      return y && y <= parseInt(q.yearTo);
    });
  }
  if (q.type) {
    results = results.filter(r => r.type === q.type);
  }
  return results;
}

// ─── GET /platform-reuse ─────────────────────────────────────────────────
router.get('/platform-reuse', function(req, res) {
  const { platRecords, wellIndex, wellMax, areas, removalMethods } = getData();
  const config = loadConfig();
  const q      = req.query;
  const page   = Math.max(1, parseInt(q.page) || 1);

  const filtered = applyFilters(platRecords, q);
  const scored   = scoreAll(filtered, wellIndex, wellMax, config);

  const total      = scored.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageData   = scored.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  res.render('platformReuse/index', {
    platforms:      pageData,
    total,
    page,
    totalPages,
    PAGE_SIZE,
    query:          q,
    areas,
    removalMethods,
    config,
    grades:         ['A', 'B', 'C', 'D', 'F']
  });
});

// ─── GET /platform-reuse/:id ──────────────────────────────────────────────
router.get('/platform-reuse/:id', function(req, res) {
  const { platRecords, wellIndex, wellMax } = getData();
  const config = loadConfig();
  const id     = parseInt(req.params.id);
  const platform = platRecords.find(p => p.id === id);

  if (!platform) {
    req.flash('error', 'Platform record not found');
    return res.redirect('/platform-reuse');
  }

  const scored   = { ...platform, score: require('../lib/scoringEngine').scoreplatform(platform, wellIndex, wellMax, config) };
  const wells    = wellIndex[platform.key] || [];
  const activeWells = wells.filter(w => w.oilProd > 0 || w.gasProd > 0);

  // Find similar platforms: same area, sort by score
  const sameArea = scoreAll(
    platRecords.filter(p => p.area === platform.area && p.id !== id),
    wellIndex, wellMax, config
  ).slice(0, 5);

  res.render('platformReuse/detail', {
    platform: scored,
    wells,
    activeWells,
    sameArea,
    config
  });
});

// ─── GET /platform-reuse-config ───────────────────────────────────────────
router.get('/platform-reuse-config', function(req, res) {
  const config = loadConfig();
  res.render('platformReuse/config', {
    config,
    configJson: JSON.stringify(config, null, 2),
    errors:     []
  });
});

// ─── POST /platform-reuse-config ─────────────────────────────────────────
router.post('/platform-reuse-config', function(req, res) {
  let newConfig;
  try {
    newConfig = JSON.parse(req.body.configJson);
  } catch (e) {
    const config = loadConfig();
    return res.render('platformReuse/config', {
      config,
      configJson: req.body.configJson || '',
      errors: ['Invalid JSON: ' + e.message]
    });
  }

  const errors = validateConfig(newConfig);
  if (errors.length) {
    return res.render('platformReuse/config', {
      config: newConfig,
      configJson: req.body.configJson,
      errors
    });
  }

  // Preserve meta block
  const current = loadConfig();
  newConfig.meta = current.meta;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
  req.flash('success', 'Scoring configuration saved successfully.');
  res.redirect('/platform-reuse');
});

module.exports = router;
