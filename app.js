(function(){
  try {
    const c=document.createElement('canvas');
    const ok=!!(window.WebGLRenderingContext && (c.getContext('webgl')||c.getContext('experimental-webgl')));
    if(!ok){ window.location.href='./lite.html'; return; }
  } catch(e){ window.location.href='./lite.html'; return; }
})();

const { resolveCountryRegime, REGIME_COLORS, REGIME_LABELS, getFeatureIso } = window.RegimeData;
const { buildSearchIndex, searchCountries, moveActiveIndex } = window.CountrySearch;

const panel = document.getElementById('panel');
const searchInput = document.getElementById('country-search');
const suggestionsEl = document.getElementById('search-suggestions');
const searchStatus = document.getElementById('search-status');

let countryEntries = [];
let byIso = new Map();
let searchIndex = [];
let suggestions = [];
let activeSuggestion = -1;

const globe = Globe()(document.getElementById('globe'))
  .backgroundColor('#111722')
  .globeImageUrl('./assets/earth-blue-marble.jpg')
  .bumpImageUrl('./assets/earth-topology.png')
  .htmlElementsData([])
  .htmlLat(d => d.lat)
  .htmlLng(d => d.lng)
  .htmlAltitude(0.07)
  .htmlElement(d => {
    const el = document.createElement('div');
    el.className = `country-bubble ${d.regimeClass}`;
    // Prevent right-edge clipping: shift bubbles left for eastern longitudes.
    el.style.transform = (d.lng > 20) ? 'translate(-105%, -110%)' : 'translate(-50%, -110%)';
    if (d.sourceStatus === 'missing') {
      el.innerHTML = `
        <div class="bubble-title">${d.country}</div>
        <div class="bubble-badge">${d.label}</div>
      `;
      return el;
    }
    el.innerHTML = `
      <div class="bubble-title">${d.country}</div>
      <div class="bubble-badge">${d.label}</div>
      <div class="bubble-row"><span>FH</span><strong>${d.metrics.fh}</strong></div>
      <div class="bubble-row"><span>V-Dem</span><strong>${d.metrics.vdem.toFixed(2)}</strong></div>
      <div class="bubble-row"><span>EIU</span><strong>${d.metrics.eiu.toFixed(2)}</strong></div>
    `;
    return el;
  })
  .onGlobeClick(() => globe.htmlElementsData([]))
  .polygonsTransitionDuration(0);

globe.controls().autoRotate = false;
globe.controls().autoRotateSpeed = 0;
globe.pointOfView({ lat: 20, lng: 0, altitude: 1.85 });

fetch('./data/world.geojson')
  .then(r => r.json())
  .then(geo => {
    countryEntries = geo.features.map((feature) => ({ feature, ...resolveCountryRegime(feature) }));
    byIso = new Map(countryEntries.map((d) => [d.iso, d]));
    searchIndex = buildSearchIndex(countryEntries.map(({ country, iso }) => ({ country, iso })));

    globe
      .polygonsData(geo.features)
      .polygonAltitude(feat => {
        const d = byIso.get(getFeatureIso(feat)) || resolveCountryRegime(feat);
        return d.sourceStatus === 'missing' ? 0.006 : 0.014;
      })
      .polygonCapColor(feat => {
        const d = byIso.get(getFeatureIso(feat)) || resolveCountryRegime(feat);
        if (d.regimeClass === 'no_data') return 'rgba(140,146,160,0.28)';
        return REGIME_COLORS[d.regimeClass].fill;
      })
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(feat => {
        const d = byIso.get(getFeatureIso(feat)) || resolveCountryRegime(feat);
        if (d.regimeClass === 'no_data') return 'rgba(140,146,160,0.45)';
        return REGIME_COLORS[d.regimeClass].stroke;
      })
      .polygonLabel(feat => {
        const d = byIso.get(getFeatureIso(feat)) || resolveCountryRegime(feat);
        return `${d.country}<br/>${d.label}`;
      })
      .onPolygonClick(feat => {
        const d = byIso.get(getFeatureIso(feat)) || resolveCountryRegime(feat);
        focusCountry(d);
      });

    setupSearch();
  })
  .catch(() => {
    panel.innerHTML = '<h2>Data load issue</h2><p>Could not load country polygons right now.</p>';
  });

function focusCountry(d) {
  if (!d) return;
  globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.3 }, 900);
  globe.htmlElementsData([{ ...d }]);
  renderPanel(d);
  searchInput.value = d.country;
  clearSuggestions();
}

function renderPanel(d) {
  if (d.sourceStatus === 'missing') {
    panel.innerHTML = `
      <h2>${d.country}</h2>
      <p><span class="badge no_data">${d.label}</span></p>
      <div class="card">
        <div class="row"><span>Status</span><strong>No source data loaded</strong></div>
      </div>
      <p class="meta">This country is shown in neutral gray until FH/V-Dem/EIU data is ingested.</p>
    `;
    return;
  }

  panel.innerHTML = `
    <h2>${d.country}</h2>
    <p><span class="badge ${d.regimeClass}">${REGIME_LABELS[d.regimeClass]}</span></p>
    <div class="card">
      <div class="row"><span>Freedom House</span><strong>${d.metrics.fh}</strong></div>
      <div class="row"><span>V-Dem (norm.)</span><strong>${d.metrics.vdem.toFixed(2)}</strong></div>
      <div class="row"><span>EIU Democracy</span><strong>${d.metrics.eiu.toFixed(2)}</strong></div>
    </div>
    <p class="meta">Pilot data layer. Ready to ingest full FH/V-Dem/EIU datasets.</p>
  `;
}

function setupSearch() {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    suggestions = searchCountries(searchIndex, q, 8);
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
      selectSuggestion(picked.iso);
      return;
    }
    if (e.key === 'Escape') {
      clearSuggestions();
    }
  });
}

function selectSuggestion(iso) {
  const d = byIso.get(iso);
  if (!d) return;
  focusCountry(d);
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
      selectSuggestion(s.iso);
    });
    suggestionsEl.appendChild(li);
  });
}

setTimeout(() => {
  const cv = document.querySelector('#globe canvas');
  if (!cv || cv.clientWidth === 0 || cv.clientHeight === 0) window.location.href = './lite.html';
}, 2500);
