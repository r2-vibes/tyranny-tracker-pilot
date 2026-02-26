const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSearchIndex, searchCountries, moveActiveIndex } = require('../data/search.js');

test('searchCountries returns prefix matches and excludes non-matches', () => {
  const idx = buildSearchIndex([
    { country: 'United States', iso: 'USA' },
    { country: 'United Kingdom', iso: 'GBR' },
    { country: 'Uruguay', iso: 'URY' },
  ]);

  const out = searchCountries(idx, 'uni');
  assert.equal(out.length, 2);
  assert.ok(out.some((d) => d.country === 'United States'));
  assert.ok(out.some((d) => d.country === 'United Kingdom'));
});

test('searchCountries handles empty and no-results inputs', () => {
  const idx = buildSearchIndex([{ country: 'Canada', iso: 'CAN' }]);
  assert.deepEqual(searchCountries(idx, ''), []);
  assert.deepEqual(searchCountries(idx, 'zzz'), []);
});

test('moveActiveIndex cycles with arrow keys', () => {
  assert.equal(moveActiveIndex(-1, 3, 'down'), 0);
  assert.equal(moveActiveIndex(0, 3, 'down'), 1);
  assert.equal(moveActiveIndex(2, 3, 'down'), 0);
  assert.equal(moveActiveIndex(0, 3, 'up'), 2);
});
