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

const colorMap = { blue:'#2d7ff9', yellow:'#f7b83a', red:'#e74c3c' };
let selectedCountry = null;

const panel = document.getElementById('panel');
const globe = Globe()(document.getElementById('globe'))
  .backgroundColor('#0b0d11')
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .pointsData(sample)
  .pointAltitude(0.03)
  .pointRadius(0.5)
  .pointColor(d => colorMap[d.class])
  .pointLabel(d => `${d.country} (${d.iso})`)
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
  .onPointClick(d => {
    selectedCountry = d;
    globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.3 }, 900);
    globe.htmlElementsData([d]);
    renderPanel(d);
  })
  .onGlobeClick(() => {
    selectedCountry = null;
    globe.htmlElementsData([]);
  });

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.35;
globe.pointOfView({ lat: 20, lng: 0, altitude: 2.1 });

function renderPanel(d) {
  panel.innerHTML = `
    <h2>${d.country}</h2>
    <p><span class="badge ${d.class}">${labelFor(d.class)}</span></p>
    <div class="card">
      <div class="row"><span>Freedom House</span><strong>${d.fh}</strong></div>
      <div class="row"><span>V-Dem (norm.)</span><strong>${d.vdem.toFixed(2)}</strong></div>
      <div class="row"><span>EIU Democracy</span><strong>${d.eiu.toFixed(2)}</strong></div>
    </div>
    <p class="meta">Pilot data only. Full build will include full-country coverage, timeseries, methodology overlays, and citation links per indicator.</p>
  `;
}

function labelFor(v){
  if(v==='blue') return 'Democracy';
  if(v==='yellow') return 'Hybrid';
  return 'Authoritarian';
}
