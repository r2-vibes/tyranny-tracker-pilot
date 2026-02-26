(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CountrySearch = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalize(v) {
    return String(v || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function buildSearchIndex(entries) {
    return (entries || []).map((item) => ({
      ...item,
      _norm: normalize(item.country),
    }));
  }

  function searchCountries(index, query, limit = 8) {
    const q = normalize(query);
    if (!q) return [];

    const withScore = [];
    for (const item of index || []) {
      const pos = item._norm.indexOf(q);
      if (pos === -1) continue;
      const prefixBonus = pos === 0 ? -100 : 0;
      withScore.push({ item, score: prefixBonus + pos + item._norm.length / 1000 });
    }

    return withScore
      .sort((a, b) => a.score - b.score || a.item.country.localeCompare(b.item.country))
      .slice(0, limit)
      .map((x) => x.item);
  }

  function moveActiveIndex(current, length, direction) {
    if (!length) return -1;
    if (direction === 'down') return (current + 1 + length) % length;
    if (direction === 'up') return (current - 1 + length) % length;
    return current;
  }

  return {
    normalize,
    buildSearchIndex,
    searchCountries,
    moveActiveIndex,
  };
});
