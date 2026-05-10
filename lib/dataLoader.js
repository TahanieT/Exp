'use strict';

const fs = require('fs');
const path = require('path');

// Parse a single line of quoted CSV (handles embedded commas inside quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// "WD   31" → { area: "WD", block: "31" }
function splitAreaBlock(str) {
  const parts = (str || '').trim().split(/\s+/);
  return { area: parts[0] || '', block: parts[1] || '' };
}

function joinKey(area, block) {
  return `${(area || '').trim().toUpperCase()}:${(block || '').trim()}`;
}

// ─── OGORA (well production) ───────────────────────────────────────────────
// Fields: operatorId, wellId, reportPeriod, statusCode, wellType,
//         oilProd, gasProd, waterProd, apiNum, completionCode,
//         areaBlock, operatorCode, operatorName, areaBlockCode,
//         subOperator, completionType, completionDate, f17, f18
function loadOgoraData(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const records = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const f = parseCSVLine(trimmed);
    const ab = splitAreaBlock(f[10]);
    records.push({
      operatorId:     f[0]  || '',
      wellId:         f[1]  || '',
      reportPeriod:   f[2]  || '',
      statusCode:     f[3]  || '',
      wellType:       f[4]  || '',
      oilProd:        parseInt(f[5])  || 0,
      gasProd:        parseInt(f[6])  || 0,
      waterProd:      parseInt(f[7])  || 0,
      apiNum:         f[8]  || '',
      completionCode: f[9]  || '',
      areaBlock:      f[10] || '',
      area:           ab.area,
      block:          ab.block,
      key:            joinKey(ab.area, ab.block),
      operatorCode:   f[11] || '',
      operatorName:   f[12] || '',
      areaBlockCode:  f[13] || '',
      completionType: f[15] || '',
      completionDate: f[16] || ''
    });
  }
  return records;
}

// ─── PLATSTRUREM (platform structure removal) ──────────────────────────────
// Fields: companyName, companyId, appNum, appDate, approvalDate,
//         completionDate, effectiveDate, type, leaseNum,
//         area, block, slot, monthYear, removalMethod,
//         depthCode, structureId, seqNum, waterDepth
function loadPlatstruremData(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const records = [];
  let idx = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const f = parseCSVLine(trimmed);
    const area  = (f[9]  || '').trim();
    const block = (f[10] || '').trim();
    records.push({
      id:             idx++,
      companyName:    f[0]  || '',
      companyId:      (f[1]  || '').trim(),
      appNum:         (f[2]  || '').trim(),
      appDate:        (f[3]  || '').trim(),
      approvalDate:   (f[4]  || '').trim(),
      completionDate: (f[5]  || '').trim(),
      effectiveDate:  (f[6]  || '').trim(),
      type:           (f[7]  || '').trim(),
      leaseNum:       (f[8]  || '').trim(),
      area:           area,
      block:          block,
      key:            joinKey(area, block),
      slot:           (f[11] || '').trim(),
      monthYear:      (f[12] || '').trim(),
      removalMethod:  (f[13] || '').trim(),
      depthCode:      parseInt(f[14]) || 0,
      structureId:    (f[15] || '').trim(),
      seqNum:         (f[16] || '').trim(),
      waterDepth:     parseInt(f[17]) || 0
    });
  }
  return records;
}

// ─── Build well index: key → [wellRecords] ────────────────────────────────
function buildWellIndex(ogoraRecords) {
  const index = {};
  for (const rec of ogoraRecords) {
    if (!index[rec.key]) index[rec.key] = [];
    index[rec.key].push(rec);
  }
  return index;
}

// ─── Compute max active-wells count across all keys (for normalisation) ───
function maxActiveWells(wellIndex) {
  let max = 0;
  for (const wells of Object.values(wellIndex)) {
    const active = wells.filter(w => w.oilProd > 0 || w.gasProd > 0).length;
    if (active > max) max = active;
  }
  return max || 1;
}

// ─── Singleton cache ──────────────────────────────────────────────────────
let _cache = null;

function getData() {
  if (_cache) return _cache;
  const dataDir = path.join(__dirname, '..', 'data');
  const ogoraRecords    = loadOgoraData(path.join(dataDir, 'ogoradelimit.txt'));
  const platRecords     = loadPlatstruremData(path.join(dataDir, 'platstruremdelimit.txt'));
  const wellIndex       = buildWellIndex(ogoraRecords);
  const wellMax         = maxActiveWells(wellIndex);
  const areas           = [...new Set(platRecords.map(r => r.area))].filter(Boolean).sort();
  const removalMethods  = [...new Set(platRecords.map(r => r.removalMethod))].filter(Boolean).sort();
  const companies       = [...new Set(platRecords.map(r => r.companyName))].filter(Boolean).sort();
  _cache = { ogoraRecords, platRecords, wellIndex, wellMax, areas, removalMethods, companies };
  return _cache;
}

// Allow cache to be cleared (e.g. after config changes during testing)
function clearCache() { _cache = null; }

module.exports = { getData, clearCache, joinKey };
