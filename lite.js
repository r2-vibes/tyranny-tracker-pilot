const sample = [
  { iso:'USA', country:'United States', class:'blue', fh:83, vdem:0.83, eiu:7.85 },
  { iso:'CAN', country:'Canada', class:'blue', fh:97, vdem:0.9, eiu:8.69 },
  { iso:'DEU', country:'Germany', class:'blue', fh:94, vdem:0.88, eiu:8.8 },
  { iso:'SWE', country:'Sweden', class:'blue', fh:100, vdem:0.91, eiu:9.39 },
  { iso:'JPN', country:'Japan', class:'blue', fh:96, vdem:0.86, eiu:8.4 },
  { iso:'BRA', country:'Brazil', class:'yellow', fh:72, vdem:0.62, eiu:6.68 },
  { iso:'MEX', country:'Mexico', class:'yellow', fh:61, vdem:0.56, eiu:5.25 },
  { iso:'IND', country:'India', class:'yellow', fh:66, vdem:0.5, eiu:7.04 },
  { iso:'TUR', country:'Turkey', class:'yellow', fh:33, vdem:0.34, eiu:4.33 },
  { iso:'HUN', country:'Hungary', class:'yellow', fh:65, vdem:0.44, eiu:6.53 },
  { iso:'RUS', country:'Russia', class:'red', fh:13, vdem:0.12, eiu:2.03 },
  { iso:'CHN', country:'China', class:'red', fh:9, vdem:0.09, eiu:2.12 },
  { iso:'IRN', country:'Iran', class:'red', fh:11, vdem:0.14, eiu:1.96 },
  { iso:'SAU', country:'Saudi Arabia', class:'red', fh:8, vdem:0.14, eiu:2.08 },
  { iso:'VEN', country:'Venezuela', class:'red', fh:15, vdem:0.18, eiu:2.76 },
  { iso:'CUB', country:'Cuba', class:'red', fh:12, vdem:0.11, eiu:2.59 },
  { iso:'NGA', country:'Nigeria', class:'yellow', fh:43, vdem:0.39, eiu:4.23 },
  { iso:'ZAF', country:'South Africa', class:'yellow', fh:79, vdem:0.67, eiu:7.05 }
];
const byIso = new Map(sample.map(d=>[d.iso,d]));
const colors = { blue:'#2d7ff9', yellow:'#f7b83a', red:'#e74c3c' };

const map = L.map('map2d', { zoomControl: true, minZoom: 1, maxZoom: 7 }).setView([20, 0], 2);

fetch('./data/world.geojson').then(r=>r.json()).then(geo => {
  L.geoJSON(geo, {
    style: (f) => {
      const iso = (f.properties.iso_a3 || f.properties.ISO_A3 || '').toUpperCase();
      const d = byIso.get(iso);
      if (!d) return { color:'#3b4252', weight:0.6, fillColor:'#1a1f2b', fillOpacity:0.35 };
      return { color: colors[d.class], weight:1.1, fillColor: colors[d.class], fillOpacity:0.55 };
    },
    onEachFeature: (f, layer) => {
      const iso = (f.properties.iso_a3 || f.properties.ISO_A3 || '').toUpperCase();
      const d = byIso.get(iso);
      if (!d) return;
      layer.bindPopup(`<b>${d.country}</b><br>${d.class.toUpperCase()}<br>Freedom House: ${d.fh}<br>V-Dem: ${d.vdem.toFixed(2)}<br>EIU: ${d.eiu.toFixed(2)}`);
    }
  }).addTo(map);
});