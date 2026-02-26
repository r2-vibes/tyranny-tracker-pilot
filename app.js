const sample = [
  { iso:'USA', country:'United States', lat:38, lng:-97, class:'blue', fh:83, vdem:0.83, eiu:7.85 },
  { iso:'CAN', country:'Canada', lat:56, lng:-106, class:'blue', fh:97, vdem:0.9, eiu:8.69 },
  { iso:'DEU', country:'Germany', lat:51, lng:10, class:'blue', fh:94, vdem:0.88, eiu:8.8 },
  { iso:'SWE', country:'Sweden', lat:62, lng:15, class:'blue', fh:100, vdem:0.91, eiu:9.39 },
  { iso:'JPN', country:'Japan', lat:36, lng:138, class:'blue', fh:96, vdem:0.86, eiu:8.4 },
  { iso:'BRA', country:'Brazil', lat:-14, lng:-51, class:'yellow', fh:72, vdem:0.62, eiu:6.68 },
  { iso:'MEX', country:'Mexico', lat:23, lng:-102, class:'yellow', fh:61, vdem:0.56, eiu:5.25 },
  { iso:'IND', country:'India', lat:22, lng:79, class:'yellow', fh:66, vdem:0.5, eiu:7.04 },
  { iso:'TUR', country:'Turkey', lat:39, lng:35, class:'yellow', fh:33, vdem:0.34, eiu:4.33 },
  { iso:'HUN', country:'Hungary', lat:47, lng:20, class:'yellow', fh:65, vdem:0.44, eiu:6.53 },
  { iso:'RUS', country:'Russia', lat:61, lng:105, class:'red', fh:13, vdem:0.12, eiu:2.03 },
  { iso:'CHN', country:'China', lat:35, lng:103, class:'red', fh:9, vdem:0.09, eiu:2.12 },
  { iso:'IRN', country:'Iran', lat:32, lng:53, class:'red', fh:11, vdem:0.14, eiu:1.96 },
  { iso:'SAU', country:'Saudi Arabia', lat:24, lng:45, class:'red', fh:8, vdem:0.14, eiu:2.08 },
  { iso:'VEN', country:'Venezuela', lat:7, lng:-66, class:'red', fh:15, vdem:0.18, eiu:2.76 },
  { iso:'CUB', country:'Cuba', lat:21, lng:-79, class:'red', fh:12, vdem:0.11, eiu:2.59 },
  { iso:'NGA', country:'Nigeria', lat:9, lng:8, class:'yellow', fh:43, vdem:0.39, eiu:4.23 },
  { iso:'ZAF', country:'South Africa', lat:-30, lng:24, class:'yellow', fh:79, vdem:0.67, eiu:7.05 }
];

const byIso = new Map(sample.map(d => [d.iso, d]));
const panel = document.getElementById('panel');

const fillMap = {
  blue: 'rgba(45,127,249,0.42)',
  yellow: 'rgba(247,184,58,0.42)',
  red: 'rgba(231,76,60,0.42)'
};
const strokeMap = {
  blue: 'rgba(45,127,249,0.55)',
  yellow: 'rgba(247,184,58,0.55)',
  red: 'rgba(231,76,60,0.55)'
};

const globe = Globe()(document.getElementById('globe'))
  .backgroundColor('#0b0d11')
  .globeImageUrl('./assets/earth-dark.jpg')
  .bumpImageUrl('./assets/earth-topology.png')
  .htmlElementsData([])
  .htmlLat(d => d.lat)
  .htmlLng(d => d.lng)
  .htmlAltitude(0.07)
  .htmlElement(d => {
    const el = document.createElement('div');
    el.className = `country-bubble ${d.class}`;
    el.innerHTML = `
      <div class="bubble-title">${d.country}</div>
      <div class="bubble-badge">${labelFor(d.class)}</div>
      <div class="bubble-row"><span>FH</span><strong>${d.fh}</strong></div>
      <div class="bubble-row"><span>V-Dem</span><strong>${d.vdem.toFixed(2)}</strong></div>
      <div class="bubble-row"><span>EIU</span><strong>${d.eiu.toFixed(2)}</strong></div>
    `;
    return el;
  })
  .onGlobeClick(() => globe.htmlElementsData([]));

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.3;
globe.pointOfView({ lat: 20, lng: 0, altitude: 1.85 });

fetch('./data/world.geojson')
  .then(r => r.json())
  .then(geo => {
    globe
      .polygonsData(geo.features)
      .polygonAltitude(feat => getCountry(feat) ? 0.012 : 0.001)
      .polygonCapColor(feat => {
        const c = getCountry(feat);
        return c ? fillMap[c.class] : 'rgba(255,255,255,0.03)';
      })
      .polygonSideColor(() => 'rgba(0,0,0,0.05)')
      .polygonStrokeColor(feat => {
        const c = getCountry(feat);
        return c ? strokeMap[c.class] : 'rgba(255,255,255,0.08)';
      })
      .polygonLabel(feat => {
        const c = getCountry(feat);
        if (!c) return feat.properties.name;
        return `${c.country}<br/>${labelFor(c.class)}`;
      })
      .onPolygonClick(feat => {
        const c = getCountry(feat);
        if (!c) return;
        const center = featureCenter(feat) || { lat: c.lat, lng: c.lng };
        globe.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.3 }, 900);
        globe.htmlElementsData([{ ...c, lat: center.lat, lng: center.lng }]);
        renderPanel(c);
      });
  })
  .catch(() => {
    panel.innerHTML = '<h2>Data load issue</h2><p>Could not load country polygons right now.</p>';
  });

function getCountry(feature) {
  const p = feature.properties || {};
  const iso = (p.iso_a3 || p.ISO_A3 || p.adm0_a3 || '').toUpperCase();
  if (iso && byIso.has(iso)) return byIso.get(iso);
  const name = (p.name || p.ADMIN || '').toLowerCase();
  return sample.find(s => s.country.toLowerCase() === name);
}

function featureCenter(feature) {
  try {
    const coords = feature.geometry.coordinates;
    let ring = null;
    if (feature.geometry.type === 'Polygon') ring = coords[0];
    if (feature.geometry.type === 'MultiPolygon') ring = coords[0][0];
    if (!ring || !ring.length) return null;
    let lat = 0, lng = 0;
    ring.forEach(([x, y]) => { lng += x; lat += y; });
    return { lat: lat / ring.length, lng: lng / ring.length };
  } catch {
    return null;
  }
}

function renderPanel(d) {
  panel.innerHTML = `
    <h2>${d.country}</h2>
    <p><span class="badge ${d.class}">${labelFor(d.class)}</span></p>
    <div class="card">
      <div class="row"><span>Freedom House</span><strong>${d.fh}</strong></div>
      <div class="row"><span>V-Dem (norm.)</span><strong>${d.vdem.toFixed(2)}</strong></div>
      <div class="row"><span>EIU Democracy</span><strong>${d.eiu.toFixed(2)}</strong></div>
    </div>
    <p class="meta">Pilot data only. Full build will include all countries, time series, and source citations.</p>
  `;
}

function labelFor(v){
  if(v==='blue') return 'Democracy';
  if(v==='yellow') return 'Hybrid';
  return 'Authoritarian';
}
