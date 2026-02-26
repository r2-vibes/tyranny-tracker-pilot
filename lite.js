const { resolveCountryRegime, REGIME_COLORS, getFeatureIso } = window.RegimeData;
const { buildSearchIndex, searchCountries, moveActiveIndex } = window.CountrySearch;

const searchInput = document.getElementById('country-search-lite');
const suggestionsEl = document.getElementById('search-suggestions-lite');
const searchStatus = document.getElementById('search-status-lite');

let byIso = new Map();
let searchIndex = [];
let suggestions = [];
let activeSuggestion = -1;

const map = L.map('map2d', { zoomControl: true, minZoom: 1, maxZoom: 7 }).setView([20, 0], 2);
let geoLayer;

fetch('./data/world.geojson').then(r=>r.json()).then(geo => {
  const entries = geo.features.map((feature) => ({ feature, ...resolveCountryRegime(feature) }));
  byIso = new Map(entries.map((d) => [d.iso, d]));
  searchIndex = buildSearchIndex(entries.map(({ country, iso }) => ({ country, iso })));

  geoLayer = L.geoJSON(geo, {
    style: (f) => {
      const d = byIso.get(getFeatureIso(f)) || resolveCountryRegime(f);
      return { color: REGIME_COLORS[d.regimeClass].stroke, weight:0.8, fillColor: REGIME_COLORS[d.regimeClass].flat, fillOpacity:0.55 };
    },
    onEachFeature: (f, layer) => {
      const d = byIso.get(getFeatureIso(f)) || resolveCountryRegime(f);
      layer._countryIso = d.iso;
      if (d.sourceStatus === 'missing') {
        layer.bindPopup(`<b>${d.country}</b><br>No data`);
      } else {
        layer.bindPopup(`<b>${d.country}</b><br>${d.label}<br>Freedom House: ${d.metrics.fh}<br>V-Dem: ${d.metrics.vdem.toFixed(2)}<br>EIU: ${d.metrics.eiu.toFixed(2)}`);
      }
      layer.on('click', () => focusCountry(d.iso));
    }
  }).addTo(map);

  setupSearch();
});

function focusCountry(iso) {
  if (!geoLayer) return;
  const d = byIso.get(iso);
  if (!d) return;

  let targetLayer = null;
  geoLayer.eachLayer((layer) => {
    if (!targetLayer && layer._countryIso === iso) targetLayer = layer;
  });
  if (!targetLayer) return;

  map.fitBounds(targetLayer.getBounds(), { maxZoom: 5, animate: true, duration: 0.6 });
  targetLayer.openPopup();
  searchInput.value = d.country;
  clearSuggestions();
}

function setupSearch() {
  searchInput.addEventListener('input', () => {
    suggestions = searchCountries(searchIndex, searchInput.value, 8);
    activeSuggestion = -1;
    renderSuggestions();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestion = moveActiveIndex(activeSuggestion, suggestions.length, 'down');
      renderSuggestions();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestion = moveActiveIndex(activeSuggestion, suggestions.length, 'up');
      renderSuggestions();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const picked = suggestions[activeSuggestion] || suggestions[0];
      if (!picked) {
        searchStatus.textContent = 'No matching countries.';
        return;
      }
      focusCountry(picked.iso);
      return;
    }
    if (e.key === 'Escape') {
      clearSuggestions();
    }
  });
}

function clearSuggestions() {
  suggestions = [];
  activeSuggestion = -1;
  renderSuggestions();
}

function renderSuggestions() {
  suggestionsEl.innerHTML = '';

  if (!searchInput.value.trim()) {
    searchStatus.textContent = '';
    return;
  }

  if (!suggestions.length) {
    searchStatus.textContent = 'No results.';
    return;
  }

  searchStatus.textContent = '';
  suggestions.forEach((s, idx) => {
    const li = document.createElement('li');
    li.className = idx === activeSuggestion ? 'active' : '';
    li.textContent = s.country;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      focusCountry(s.iso);
    });
    suggestionsEl.appendChild(li);
  });
}
