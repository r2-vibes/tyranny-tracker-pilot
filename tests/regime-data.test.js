const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  resolveCountryRegime,
  getFeatureIso,
  REGIME_COLORS,
  REGIME_LABELS,
} = require('../data/regime-data.js');

const world = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'world.geojson'), 'utf8')
);

test('assigns a fill for every polygon in world.geojson', () => {
  for (const feature of world.features) {
    const regime = resolveCountryRegime(feature);
    assert.ok(regime, `missing regime object for ${feature.properties?.name || feature.id}`);
    assert.ok(regime.regimeClass, `missing regimeClass for ${feature.properties?.name || feature.id}`);
    assert.ok(REGIME_COLORS[regime.regimeClass], `missing color mapping for ${regime.regimeClass}`);
    assert.ok(REGIME_LABELS[regime.regimeClass], `missing label mapping for ${regime.regimeClass}`);
  }
});

test('countries without source data are tagged as neutral no_data', () => {
  const afghanistan = world.features.find((f) => getFeatureIso(f) === 'AFG');
  assert.ok(afghanistan, 'missing AFG feature');

  const regime = resolveCountryRegime(afghanistan);
  assert.equal(regime.regimeClass, 'no_data');
  assert.equal(regime.label, 'No data');
});

test('pilot countries still map to red/yellow/blue classes', () => {
  const usa = world.features.find((f) => getFeatureIso(f) === 'USA');
  const china = world.features.find((f) => getFeatureIso(f) === 'CHN');

  assert.equal(resolveCountryRegime(usa).regimeClass, 'blue');
  assert.equal(resolveCountryRegime(china).regimeClass, 'red');
});
