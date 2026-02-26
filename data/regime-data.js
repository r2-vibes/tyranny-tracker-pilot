(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RegimeData = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PILOT_COUNTRIES = [
    { iso:'USA', country:'United States', lat:38, lng:-97, regimeClass:'blue', fh:83, vdem:0.83, eiu:7.85 },
    { iso:'CAN', country:'Canada', lat:56, lng:-106, regimeClass:'blue', fh:97, vdem:0.9, eiu:8.69 },
    { iso:'DEU', country:'Germany', lat:51, lng:10, regimeClass:'blue', fh:94, vdem:0.88, eiu:8.8 },
    { iso:'SWE', country:'Sweden', lat:62, lng:15, regimeClass:'blue', fh:100, vdem:0.91, eiu:9.39 },
    { iso:'JPN', country:'Japan', lat:36, lng:138, regimeClass:'blue', fh:96, vdem:0.86, eiu:8.4 },
    { iso:'BRA', country:'Brazil', lat:-14, lng:-51, regimeClass:'yellow', fh:72, vdem:0.62, eiu:6.68 },
    { iso:'MEX', country:'Mexico', lat:23, lng:-102, regimeClass:'yellow', fh:61, vdem:0.56, eiu:5.25 },
    { iso:'IND', country:'India', lat:22, lng:79, regimeClass:'yellow', fh:66, vdem:0.5, eiu:7.04 },
    { iso:'TUR', country:'Turkey', lat:39, lng:35, regimeClass:'yellow', fh:33, vdem:0.34, eiu:4.33 },
    { iso:'HUN', country:'Hungary', lat:47, lng:20, regimeClass:'yellow', fh:65, vdem:0.44, eiu:6.53 },
    { iso:'RUS', country:'Russia', lat:61, lng:105, regimeClass:'red', fh:13, vdem:0.12, eiu:2.03 },
    { iso:'CHN', country:'China', lat:35, lng:103, regimeClass:'red', fh:9, vdem:0.09, eiu:2.12 },
    { iso:'IRN', country:'Iran', lat:32, lng:53, regimeClass:'red', fh:11, vdem:0.14, eiu:1.96 },
    { iso:'SAU', country:'Saudi Arabia', lat:24, lng:45, regimeClass:'red', fh:8, vdem:0.14, eiu:2.08 },
    { iso:'VEN', country:'Venezuela', lat:7, lng:-66, regimeClass:'red', fh:15, vdem:0.18, eiu:2.76 },
    { iso:'CUB', country:'Cuba', lat:21, lng:-79, regimeClass:'red', fh:12, vdem:0.11, eiu:2.59 },
    { iso:'NGA', country:'Nigeria', lat:9, lng:8, regimeClass:'yellow', fh:43, vdem:0.39, eiu:4.23 },
    { iso:'ZAF', country:'South Africa', lat:-30, lng:24, regimeClass:'yellow', fh:79, vdem:0.67, eiu:7.05 }
  ];

  const BY_ISO = new Map(PILOT_COUNTRIES.map((d) => [d.iso, d]));
  const BY_NAME = new Map(PILOT_COUNTRIES.map((d) => [d.country.toLowerCase(), d]));

  const REGIME_LABELS = {
    blue: 'Democracy',
    yellow: 'Hybrid',
    red: 'Authoritarian',
    no_data: 'No data',
  };

  const REGIME_COLORS = {
    blue: { fill: 'rgba(45,127,249,0.58)', stroke: 'rgba(45,127,249,0.55)', flat: '#2d7ff9' },
    yellow: { fill: 'rgba(247,184,58,0.58)', stroke: 'rgba(247,184,58,0.55)', flat: '#f7b83a' },
    red: { fill: 'rgba(231,76,60,0.58)', stroke: 'rgba(231,76,60,0.55)', flat: '#e74c3c' },
    no_data: { fill: 'rgba(140,146,160,0.42)', stroke: 'rgba(140,146,160,0.7)', flat: '#8c92a0' },
  };

  function getFeatureIso(feature) {
    const p = feature && feature.properties ? feature.properties : {};
    const raw = p.iso_a3 || p.ISO_A3 || p.adm0_a3 || feature.id || '';
    let iso = String(raw).toUpperCase();
    if (iso === '-99') iso = '';
    return iso;
  }

  function getFeatureName(feature) {
    const p = feature && feature.properties ? feature.properties : {};
    return p.name || p.ADMIN || p.admin || 'Unknown';
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

  function resolveCountryRegime(feature) {
    const iso = getFeatureIso(feature);
    const name = getFeatureName(feature);

    let base = null;
    if (iso && BY_ISO.has(iso)) base = BY_ISO.get(iso);
    if (!base && BY_NAME.has(String(name).toLowerCase())) base = BY_NAME.get(String(name).toLowerCase());

    const center = featureCenter(feature);
    if (!base) {
      return {
        iso: iso || String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        country: name,
        regimeClass: 'no_data',
        label: REGIME_LABELS.no_data,
        sourceStatus: 'missing',
        lat: center ? center.lat : null,
        lng: center ? center.lng : null,
        metrics: { fh: null, vdem: null, eiu: null },
      };
    }

    return {
      iso: base.iso,
      country: base.country,
      regimeClass: base.regimeClass,
      label: REGIME_LABELS[base.regimeClass],
      sourceStatus: 'pilot',
      lat: center ? center.lat : base.lat,
      lng: center ? center.lng : base.lng,
      metrics: { fh: base.fh, vdem: base.vdem, eiu: base.eiu },
    };
  }

  return {
    PILOT_COUNTRIES,
    REGIME_COLORS,
    REGIME_LABELS,
    getFeatureIso,
    getFeatureName,
    featureCenter,
    resolveCountryRegime,
  };
});
