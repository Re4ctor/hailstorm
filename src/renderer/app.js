const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";
const rainViewerUrl = "https://api.rainviewer.com/public/weather-maps.json";
const radarMaxNativeZoom = 7;
const mapStartZoom = 7;
const storageKeys = {
  saved: "hailWatch.savedPlaces",
  prefs: "hailWatch.preferences",
  lastPlace: "hailWatch.lastPlace",
  notified: "hailWatch.notified",
  forecastCache: "hailWatch.forecastCache",
  history: "hailWatch.history"
};

const mapLayers = {
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: "abcd",
      maxZoom: 20,
      maxNativeZoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    options: {
      subdomains: "abcd",
      maxZoom: 20,
      maxNativeZoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 17,
      maxNativeZoom: 17,
      attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
    }
  }
};

const copy = {
  it: {
    ready: "Pronto",
    search: "Cerca",
    location: "Località",
    save: "Salva",
    remove: "Rimuovi",
    saved: "Salvati",
    threshold: "Avviso da",
    languageLabel: "Lingua",
    forecastRange: "Periodo",
    forecastDay: "Giorno",
    today: "Oggi",
    tomorrow: "Domani",
    useLocation: "Posizione",
    currentLocation: "Posizione attuale",
    locating: "Rilevo posizione...",
    locationUnavailable: "Posizione non disponibile.",
    copyReport: "Copia report",
    exportReport: "Esporta",
    renamePlace: "Rinomina",
    copiedReport: "Report copiato",
    copyFailed: "Copia non riuscita",
    exportedReport: "Report esportato",
    autoRefresh: "Auto",
    detailMode: "Vista",
    detailedMode: "Dettaglio",
    compactMode: "Compatta",
    trend: "Trend",
    route: "Percorso",
    history: "Storico",
    warnings: "Avvisi ufficiali",
    sidebarOpen: "Dati",
    sidebarClose: "Mappa",
    conditions: "Condizioni",
    hourly: "Rischio orario",
    compare: "Confronto salvati",
    radarTitle: "Radar live",
    radarSubtitle: "Traccia temporali",
    layerMap: "Mappa",
    layerDark: "Scura",
    layerTerrain: "Terreno",
    weak: "Debole",
    strong: "Forte",
    noSaved: "Nessuna località salvata",
    noRisk: "Nessuna finestra severa nel periodo selezionato",
    severe: "Finestra severa",
    updatedNever: "Mai aggiornato",
    updated: "Aggiornato",
    loadingRadar: "Caricamento radar",
    refresh: "Aggiorna",
    play: "Avvia",
    pause: "Pausa",
    mapLayerTitle: "Livello mappa",
    legendLabel: "Legenda intensità radar",
    looking: "Cerco",
    forecast: "Carico previsione...",
    radar: "Aggiorno radar...",
    synced: "Sincronizzato",
    minimum: "Minimo",
    low: "Basso",
    moderate: "Moderato",
    high: "Alto",
    severeLabel: "Severo",
    risk: "rischio",
    riskPrefix: "Rischio",
    alertTitle: "Rischio grandine",
    alertBody: (place, score) => `${place} ha raggiunto rischio ${score}.`,
    explanationEmpty: "Nessun segnale forte nel modello.",
    note:
      "La forza della grandine è una stima basata su temporali, CAPE, precipitazioni, rovesci, raffiche e quota dello zero termico. Usa gli avvisi ufficiali per la sicurezza.",
    metrics: {
      signal: "Segnale temporale",
      cape: "CAPE",
      rain: "Probabilità pioggia",
      gusts: "Raffiche",
      showers: "Rovesci",
      freezing: "Zero termico",
      windDirection: "Direzione vento",
      totalRain: "Pioggia totale"
    }
  },
  en: {
    ready: "Ready",
    search: "Search",
    location: "Location",
    save: "Save",
    remove: "Remove",
    saved: "Saved",
    threshold: "Alert from",
    languageLabel: "Language",
    forecastRange: "Range",
    forecastDay: "Day",
    today: "Today",
    tomorrow: "Tomorrow",
    useLocation: "Location",
    currentLocation: "Current location",
    locating: "Detecting location...",
    locationUnavailable: "Location unavailable.",
    copyReport: "Copy report",
    exportReport: "Export",
    renamePlace: "Rename",
    copiedReport: "Report copied",
    copyFailed: "Copy failed",
    exportedReport: "Report exported",
    autoRefresh: "Auto",
    detailMode: "View",
    detailedMode: "Detailed",
    compactMode: "Compact",
    trend: "Trend",
    route: "Route",
    history: "History",
    warnings: "Official warnings",
    sidebarOpen: "Details",
    sidebarClose: "Map",
    conditions: "Conditions",
    hourly: "Hourly risk",
    compare: "Saved comparison",
    radarTitle: "Live radar",
    radarSubtitle: "Track storms",
    layerMap: "Map",
    layerDark: "Dark",
    layerTerrain: "Terrain",
    weak: "Weak",
    strong: "Strong",
    noSaved: "No saved locations",
    noRisk: "No severe window in the selected range",
    severe: "Severe window",
    updatedNever: "Never updated",
    updated: "Updated",
    loadingRadar: "Loading radar",
    refresh: "Refresh",
    play: "Play",
    pause: "Pause",
    mapLayerTitle: "Map layer",
    legendLabel: "Radar intensity legend",
    looking: "Searching",
    forecast: "Loading forecast...",
    radar: "Updating radar...",
    synced: "Synced",
    minimum: "Minimal",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    severeLabel: "Severe",
    risk: "risk",
    riskPrefix: "Risk",
    alertTitle: "Hail risk",
    alertBody: (place, score) => `${place} reached risk ${score}.`,
    explanationEmpty: "No strong signal in the model.",
    note:
      "Hail strength is an estimate based on thunderstorms, CAPE, precipitation, showers, gusts, and freezing level. Use official warnings for safety.",
    metrics: {
      signal: "Storm signal",
      cape: "CAPE",
      rain: "Rain probability",
      gusts: "Gusts",
      showers: "Showers",
      freezing: "Freezing level",
      windDirection: "Wind direction",
      totalRain: "Total rain"
    }
  }
};

const els = {
  form: document.querySelector("#searchForm"),
  cityInput: document.querySelector("#cityInput"),
  locationLabel: document.querySelector("#locationLabel"),
  status: document.querySelector("#statusLine"),
  placeName: document.querySelector("#placeName"),
  riskTime: document.querySelector("#riskTime"),
  scoreRing: document.querySelector("#scoreRing"),
  riskScore: document.querySelector("#riskScore"),
  riskLabel: document.querySelector("#riskLabel"),
  riskSummary: document.querySelector("#riskSummary"),
  riskExplain: document.querySelector("#riskExplain"),
  metrics: document.querySelector("#metrics"),
  hours: document.querySelector("#hours"),
  hourRange: document.querySelector("#hourRange"),
  severeWindow: document.querySelector("#severeWindow"),
  prevFrame: document.querySelector("#prevFrame"),
  playRadar: document.querySelector("#playRadar"),
  nextFrame: document.querySelector("#nextFrame"),
  frameLabel: document.querySelector("#frameLabel"),
  frameSlider: document.querySelector("#frameSlider"),
  radarState: document.querySelector("#radarState"),
  savePlace: document.querySelector("#savePlace"),
  savedPlaces: document.querySelector("#savedPlaces"),
  savedTitle: document.querySelector("#savedTitle"),
  thresholdLabel: document.querySelector("#thresholdLabel"),
  languageLabel: document.querySelector("#languageLabel"),
  conditionsTitle: document.querySelector("#conditionsTitle"),
  hourlyTitle: document.querySelector("#hourlyTitle"),
  compareTitle: document.querySelector("#compareTitle"),
  modelNote: document.querySelector("#modelNote"),
  radarTitle: document.querySelector("#radarTitle"),
  radarSubtitle: document.querySelector("#radarSubtitle"),
  layerMap: document.querySelector("#layerMap"),
  layerDark: document.querySelector("#layerDark"),
  layerTerrain: document.querySelector("#layerTerrain"),
  legendWeak: document.querySelector("#legendWeak"),
  legendStrong: document.querySelector("#legendStrong"),
  compareList: document.querySelector("#compareList"),
  riskThreshold: document.querySelector("#riskThreshold"),
  languageSelect: document.querySelector("#languageSelect"),
  forecastHours: document.querySelector("#forecastHours"),
  forecastRangeLabel: document.querySelector("#forecastRangeLabel"),
  prevForecastWindow: document.querySelector("#prevForecastWindow"),
  nextForecastWindow: document.querySelector("#nextForecastWindow"),
  forecastDay: document.querySelector("#forecastDay"),
  forecastDayLabel: document.querySelector("#forecastDayLabel"),
  useLocation: document.querySelector("#useLocation"),
  copyReport: document.querySelector("#copyReport"),
  exportReport: document.querySelector("#exportReport"),
  renamePlace: document.querySelector("#renamePlace"),
  suggestions: document.querySelector("#suggestions"),
  autoRefresh: document.querySelector("#autoRefresh"),
  autoRefreshLabel: document.querySelector("#autoRefreshLabel"),
  detailMode: document.querySelector("#detailMode"),
  detailModeLabel: document.querySelector("#detailModeLabel"),
  insightPanel: document.querySelector("#insightPanel"),
  warningLink: document.querySelector("#warningLink"),
  routeSummary: document.querySelector("#routeSummary"),
  mobileForecastSheet: document.querySelector("#mobileForecastSheet"),
  sheetPlace: document.querySelector("#sheetPlace"),
  sheetRiskLabel: document.querySelector("#sheetRiskLabel"),
  sheetScore: document.querySelector("#sheetScore"),
  sheetPeak: document.querySelector("#sheetPeak"),
  sheetSevere: document.querySelector("#sheetSevere"),
  sheetTrend: document.querySelector("#sheetTrend"),
  mobileSidebarToggle: document.querySelector("#mobileSidebarToggle"),
  mobileDrawerBackdrop: document.querySelector("#mobileDrawerBackdrop"),
  radarOpacity: document.querySelector("#radarOpacity"),
  refreshForecast: document.querySelector("#refreshForecast"),
  refreshStamp: document.querySelector("#refreshStamp"),
  mapLayer: document.querySelector("#mapLayer")
};

let map;
let marker;
let baseLayer;
let radarLayer;
let previousRadarLayer;
let radarFrames = [];
let frameIndex = 0;
let radarNowIndex = 0;
let radarTimer = null;
let autoRefreshTimer = null;
let currentPlace = null;
let currentForecast = null;
let lastUpdatedAt = null;
let savedMarkers = [];
let searchSuggestions = [];

let savedPlaces = readJson(storageKeys.saved, []);
let preferences = {
  language: "it",
  riskThreshold: 50,
  radarOpacity: 52,
  forecastHours: 24,
  forecastDay: 0,
  forecastOffsetHours: 0,
  autoRefresh: 0,
  detailMode: "detailed",
  mapLayer: "voyager",
  ...readJson(storageKeys.prefs, {})
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function t(key) {
  return copy[preferences.language]?.[key] || copy.it[key] || key;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

function placeKey(place) {
  return `${Number(place.latitude).toFixed(3)},${Number(place.longitude).toFixed(3)}`;
}

function placeLabel(place) {
  return [place.name, place.country].filter(Boolean).join(", ");
}

function cityMarkerIcon(place) {
  return L.divIcon({
    className: "cityMarker",
    html: `
      <span class="cityMarkerPin"></span>
      <span class="cityMarkerLabel">${placeLabel(place)}</span>
    `,
    iconSize: [190, 44],
    iconAnchor: [18, 22]
  });
}

function savedMarkerIcon(place) {
  const score = Number(place.lastScore || 0);
  return L.divIcon({
    className: "cityMarker savedMapMarker",
    html: `
      <span class="cityMarkerPin" style="--marker-color:${riskColor(score)}"></span>
      <span class="cityMarkerLabel">${escapeHtml(place.name)} ${Number.isFinite(place.lastScore) ? place.lastScore : ""}</span>
    `,
    iconSize: [160, 38],
    iconAnchor: [14, 19]
  });
}

function renderSavedMarkers() {
  if (!map) return;
  savedMarkers.forEach((item) => map.removeLayer(item));
  savedMarkers = savedPlaces
    .filter((place) => !currentPlace || placeKey(place) !== placeKey(currentPlace))
    .map((place) =>
      L.marker([place.latitude, place.longitude], {
        icon: savedMarkerIcon(place),
        zIndexOffset: 650
      })
        .addTo(map)
        .on("click", () => loadPlace(place))
    );
}

function setStatus(message) {
  els.status.textContent = message;
}

function riskColor(score) {
  if (score >= 75) return "#ef5d68";
  if (score >= 50) return "#f58d54";
  if (score >= 25) return "#f0c95a";
  return "#5ee0a0";
}

function riskLabel(score) {
  if (score >= 75) return t("severeLabel");
  if (score >= 50) return t("high");
  if (score >= 25) return t("moderate");
  if (score >= 10) return t("low");
  return t("minimum");
}

function windDirectionLabel(degrees) {
  if (!Number.isFinite(Number(degrees))) return "--";
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(Number(degrees) / 45) % 8];
}

function warningUrl(place) {
  const country = String(place?.country || "").toLowerCase();
  if (country.includes("ital")) return "https://www.protezionecivile.gov.it/it/approfondimento/allertamento-meteo-idro/";
  if (country.includes("united states") || country.includes("usa")) return "https://www.weather.gov/alerts";
  if (country.includes("united kingdom")) return "https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings";
  if (country.includes("france")) return "https://vigilance.meteofrance.fr/";
  if (country.includes("germany")) return "https://www.dwd.de/EN/weather/warnings/warnings_node.html";
  return "https://meteoalarm.org/";
}

function weatherText(code) {
  const labels = {
    it: {
      0: "Sereno",
      1: "Prevalentemente sereno",
      2: "Parzialmente nuvoloso",
      3: "Coperto",
      45: "Nebbia",
      51: "Pioviggine leggera",
      61: "Pioggia",
      63: "Pioggia",
      65: "Pioggia intensa",
      80: "Rovesci",
      81: "Rovesci",
      82: "Rovesci violenti",
      95: "Temporale",
      96: "Temporale con grandine",
      99: "Temporale severo con grandine"
    },
    en: {
      0: "Clear",
      1: "Mostly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      51: "Light drizzle",
      61: "Rain",
      63: "Rain",
      65: "Heavy rain",
      80: "Showers",
      81: "Showers",
      82: "Violent showers",
      95: "Thunderstorm",
      96: "Thunderstorm with hail",
      99: "Severe thunderstorm with hail"
    }
  };
  return labels[preferences.language]?.[code] || labels.it[code] || "Variable weather";
}

function addReason(reasons, label, points, value) {
  if (points > 0) reasons.push({ label, points: Math.round(points), value });
}

function analyzeHour(hour) {
  const code = Number(hour.weather_code || 0);
  const cape = Number(hour.cape || 0);
  const precipProb = Number(hour.precipitation_probability || 0);
  const precip = Number(hour.precipitation || 0);
  const showers = Number(hour.showers || 0);
  const gusts = Number(hour.wind_gusts_10m || 0);
  const freezing = Number(hour.freezing_level_height || 0);
  const reasons = [];
  let score = 0;
  let points = 0;

  if (code === 99) points = 50;
  else if (code === 96) points = 42;
  else if (code === 95) points = 30;
  else if ([80, 81, 82].includes(code)) points = 12;
  score += points;
  addReason(reasons, weatherText(code), points, "");

  if (cape >= 2500) points = 36;
  else if (cape >= 1500) points = 28;
  else if (cape >= 800) points = 18;
  else if (cape >= 300) points = 8;
  else points = 0;
  score += points;
  addReason(reasons, "CAPE", points, `${Math.round(cape)} J/kg`);

  points = Math.min(18, precipProb * 0.18);
  score += points;
  addReason(reasons, t("metrics").rain, points, `${Math.round(precipProb)}%`);

  points = Math.min(16, precip * 7);
  score += points;
  addReason(reasons, preferences.language === "it" ? "Pioggia" : "Rain", points, `${Number(precip).toFixed(1)} mm`);

  points = Math.min(18, showers * 11);
  score += points;
  addReason(reasons, t("metrics").showers, points, `${Number(showers).toFixed(1)} mm`);

  if (gusts >= 80) points = 10;
  else if (gusts >= 60) points = 7;
  else if (gusts >= 45) points = 4;
  else points = 0;
  score += points;
  addReason(reasons, t("metrics").gusts, points, `${Math.round(gusts)} km/h`);

  if (freezing >= 1800 && freezing <= 4200 && score > 18) {
    score += 8;
    addReason(reasons, t("metrics").freezing, 8, `${Math.round(freezing)} m`);
  }
  if (freezing > 5200) {
    score -= 6;
    reasons.push({ label: t("metrics").freezing, points: -6, value: `${Math.round(freezing)} m` });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.sort((a, b) => b.points - a.points)
  };
}

function getHourlyRows(forecast) {
  const hourly = forecast.hourly || {};
  return (hourly.time || []).map((time, index) => {
    const row = { time };
    Object.keys(hourly).forEach((key) => {
      if (key !== "time") row[key] = hourly[key][index];
    });
    const analysis = analyzeHour(row);
    row.score = analysis.score;
    row.reasons = analysis.reasons;
    return row;
  });
}

function formatHour(time, timezone) {
  return new Intl.DateTimeFormat(preferences.language === "it" ? "it-IT" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(time));
}

function formatTimelineLabel(time, timezone, firstTime) {
  const locale = preferences.language === "it" ? "it-IT" : "en-US";
  const date = new Date(time);
  const firstDate = new Date(firstTime);
  const day = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: timezone
  }).format(date);
  const firstDay = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: timezone
  }).format(firstDate);
  const prefix = day === firstDay ? (preferences.language === "it" ? "oggi" : "today") : (preferences.language === "it" ? "domani" : "tomorrow");
  return `${prefix} ${formatHour(time, timezone)}`;
}

function selectedForecastHours() {
  return Number(preferences.forecastHours) === 48 ? 48 : 24;
}

function selectedForecastOffsetHours() {
  const offset = Number(preferences.forecastOffsetHours ?? preferences.forecastDay * 24 ?? 0);
  return Number.isFinite(offset) ? Math.max(0, Math.min(144, offset)) : 0;
}

function selectedForecastDay() {
  return Math.floor(selectedForecastOffsetHours() / 24);
}

function maxForecastOffset(rows) {
  return Math.min(144, Math.max(0, (rows?.length || 168) - selectedForecastHours()));
}

function selectedRows(rows) {
  const start = Math.min(selectedForecastOffsetHours(), maxForecastOffset(rows));
  return rows.slice(start, Math.min(rows.length, start + selectedForecastHours()));
}

function updateForecastWindowControls(rows) {
  const offset = selectedForecastOffsetHours();
  const maxOffset = maxForecastOffset(rows);
  els.prevForecastWindow.disabled = offset <= 0;
  els.nextForecastWindow.disabled = offset >= maxOffset;
}

function stormIntensity(row) {
  const code = Number(row.weather_code || 0);
  const codePoints = code === 99 ? 100 : code === 96 ? 85 : code === 95 ? 70 : [80, 81, 82].includes(code) ? 45 : 0;
  const rainPoints = Math.min(100, Number(row.precipitation_probability || 0));
  const gustPoints = Math.min(100, Number(row.wind_gusts_10m || 0));
  return Math.round(Math.max(codePoints, rainPoints * 0.7, gustPoints));
}

function riskTrend(rows) {
  const visibleRows = selectedRows(rows);
  if (visibleRows.length < 4) return "--";
  const early = visibleRows.slice(0, 3).reduce((sum, row) => sum + row.score, 0) / 3;
  const next = visibleRows.slice(3, 6).reduce((sum, row) => sum + row.score, 0) / Math.min(3, visibleRows.length - 3);
  if (next - early >= 8) return preferences.language === "it" ? "in aumento" : "rising";
  if (early - next >= 8) return preferences.language === "it" ? "in calo" : "falling";
  return preferences.language === "it" ? "stabile" : "stable";
}

function totalPrecipitation(rows) {
  return selectedRows(rows).reduce((sum, row) => sum + Number(row.precipitation || 0) + Number(row.showers || 0), 0);
}

function historyDelta(place, score) {
  const history = readJson(storageKeys.history, {});
  const entries = history[placeKey(place)] || [];
  const previous = entries[entries.length - 1]?.score;
  if (!Number.isFinite(previous)) return preferences.language === "it" ? "primo controllo" : "first check";
  const diff = score - previous;
  if (Math.abs(diff) < 3) return preferences.language === "it" ? "come prima" : "unchanged";
  return `${diff > 0 ? "+" : ""}${diff}`;
}

function rememberHistory(place, score) {
  const history = readJson(storageKeys.history, {});
  const key = placeKey(place);
  const entries = [...(history[key] || []), { at: Date.now(), score }].slice(-20);
  history[key] = entries;
  writeJson(storageKeys.history, history);
}

function formatRangeLabel(rows, timezone) {
  if (!rows.length) return `${selectedForecastHours()}h`;
  const visibleRows = selectedRows(rows);
  const first = visibleRows[0].time;
  const last = visibleRows[visibleRows.length - 1].time;
  return `${formatHour(first, timezone)} -> ${formatHour(last, timezone)}`;
}

function formatDateTime(time, timezone) {
  return new Intl.DateTimeFormat(preferences.language === "it" ? "it-IT" : "en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(time));
}

function findSevereWindow(rows, timezone) {
  const threshold = Number(preferences.riskThreshold);
  const visibleRows = selectedRows(rows);
  const lastIndex = visibleRows.length - 1;
  let start = -1;
  let best = null;
  visibleRows.forEach((row, index) => {
    if (row.score >= threshold && start === -1) start = index;
    if ((row.score < threshold || index === lastIndex) && start !== -1) {
      const end = row.score >= threshold && index === lastIndex ? index : index - 1;
      const segment = visibleRows.slice(start, end + 1);
      const peak = segment.reduce((max, item) => Math.max(max, item.score), 0);
      if (!best || peak > best.peak) best = { start, end, peak };
      start = -1;
    }
  });
  if (!best) return null;
  const duration = best.end - best.start + 1;
  const peakRow = visibleRows.slice(best.start, best.end + 1).reduce((top, row) => (row.score > top.score ? row : top), visibleRows[best.start]);
  const cause = peakRow.reasons?.[0]?.label || weatherText(peakRow.weather_code);
  return `${t("severe")}: ${formatHour(visibleRows[best.start].time, timezone)}-${formatHour(visibleRows[best.end].time, timezone)} · ${duration}h · ${best.peak} · ${cause}`;
}

function renderRisk(place, forecast) {
  const rows = getHourlyRows(forecast);
  const visibleRows = selectedRows(rows);
  const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0] || rows[0]);
  const score = max?.score || 0;
  const color = riskColor(score);
  const label = riskLabel(score);
  const topReasons = (max?.reasons || []).slice(0, 4);

  els.placeName.textContent = placeLabel(place);
  els.riskTime.textContent = `${formatDateTime(max.time, forecast.timezone)}`;
  els.riskScore.textContent = String(score);
  els.riskLabel.textContent = `${t("riskPrefix")} ${label.toLowerCase()}`;
  els.riskSummary.textContent = `${weatherText(max.weather_code)}. ${Math.round(
    max.precipitation_probability || 0
  )}% ${preferences.language === "it" ? "probabilità pioggia" : "rain probability"}. CAPE ${Math.round(max.cape || 0)} J/kg.`;
  els.scoreRing.style.borderColor = color;
  els.scoreRing.style.setProperty("--risk-color", color);
  const severeWindow = findSevereWindow(rows, forecast.timezone);
  els.hourRange.textContent = formatRangeLabel(rows, forecast.timezone);
  updateForecastWindowControls(rows);
  els.severeWindow.textContent = severeWindow || t("noRisk");
  els.severeWindow.classList.toggle("is-active", Boolean(severeWindow));

  els.metrics.innerHTML = [
    [t("metrics").signal, weatherText(max.weather_code)],
    [t("metrics").cape, `${Math.round(max.cape || 0)} J/kg`],
    [t("metrics").rain, `${Math.round(max.precipitation_probability || 0)}%`],
    [t("metrics").gusts, `${Math.round(max.wind_gusts_10m || 0)} km/h`],
    [t("metrics").windDirection, windDirectionLabel(max.wind_direction_10m)],
    [t("metrics").showers, `${Number(max.showers || 0).toFixed(1)} mm`],
    [t("metrics").totalRain, `${totalPrecipitation(rows).toFixed(1)} mm`],
    [t("metrics").freezing, `${Math.round(max.freezing_level_height || 0)} m`]
  ]
    .map(([name, value]) => `<div class="metric"><span>${name}</span><strong>${value}</strong></div>`)
    .join("");

  els.riskExplain.innerHTML = topReasons.length
    ? topReasons
        .map(
          (reason) => `<div class="reason">
            <span>${reason.label}${reason.value ? ` · ${reason.value}` : ""}</span>
            <strong>${reason.points > 0 ? "+" : ""}${reason.points}</strong>
          </div>`
        )
        .join("")
    : `<div class="reason"><span>${t("explanationEmpty")}</span><strong>0</strong></div>`;

  els.insightPanel.innerHTML = [
    [t("trend"), riskTrend(rows)],
    [t("metrics").totalRain, `${totalPrecipitation(rows).toFixed(1)} mm`],
    [t("history"), historyDelta(place, score)],
    [t("metrics").windDirection, windDirectionLabel(max.wind_direction_10m)]
  ]
    .map(([labelText, value]) => `<div class="insightItem"><span>${labelText}</span><strong>${value}</strong></div>`)
    .join("");

  els.warningLink.href = warningUrl(place);
  els.warningLink.textContent = t("warnings");
  els.sheetPlace.textContent = place.name;
  els.sheetRiskLabel.textContent = `${t("riskPrefix")} ${label.toLowerCase()}`;
  els.sheetScore.textContent = String(score);
  els.sheetScore.style.color = color;
  els.sheetPeak.textContent = `${preferences.language === "it" ? "Picco" : "Peak"}: ${formatDateTime(max.time, forecast.timezone)}`;
  els.sheetSevere.textContent = severeWindow || t("noRisk");
  els.sheetTrend.textContent = `${t("trend")}: ${riskTrend(rows)}`;

  els.hours.innerHTML = selectedRows(rows)
    .map((row) => {
      const rowColor = riskColor(row.score);
      const intensity = stormIntensity(row);
      const severe = row.score >= Number(preferences.riskThreshold) ? " is-severe" : "";
      return `<div class="hour${severe}">
        <span>${formatTimelineLabel(row.time, forecast.timezone, rows[0].time)}</span>
        <div class="bars">
          <div class="bar"><div class="fill" style="width: ${row.score}%; background: ${rowColor}"></div></div>
          <div class="bar is-storm"><div class="fill" style="width: ${intensity}%"></div></div>
        </div>
        <strong>${row.score}</strong>
      </div>`;
    })
    .join("");

  rememberHistory(place, score);
  maybeNotify(place, max);
}

async function searchCities(name, count = 5) {
  const url = new URL(geocodeUrl);
  url.searchParams.set("name", name);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", preferences.language);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error(preferences.language === "it" ? "Ricerca città non riuscita." : "City search failed.");
  const data = await response.json();
  return data.results || [];
}

async function searchCity(name) {
  const results = await searchCities(name, 1);
  if (!results.length) throw new Error(preferences.language === "it" ? "Nessuna città trovata." : "No city found.");
  return results[0];
}

function cacheKey(place) {
  return `${placeKey(place)}:forecast-7d`;
}

async function getForecast(place) {
  const url = new URL(forecastUrl);
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set(
    "hourly",
    "weather_code,precipitation_probability,precipitation,showers,cape,wind_gusts_10m,wind_direction_10m,freezing_level_height"
  );
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");

  const forecastCache = readJson(storageKeys.forecastCache, {});
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(preferences.language === "it" ? "Richiesta previsioni non riuscita." : "Forecast request failed.");
    const forecast = await response.json();
    forecastCache[cacheKey(place)] = { at: Date.now(), forecast };
    writeJson(storageKeys.forecastCache, forecastCache);
    return forecast;
  } catch (error) {
    const cached = forecastCache[cacheKey(place)];
    if (cached?.forecast) {
      setStatus(preferences.language === "it" ? "Uso ultima previsione salvata" : "Using last saved forecast");
      return cached.forecast;
    }
    throw error;
  }
}

function selectedLayerConfig() {
  return mapLayers[preferences.mapLayer] || mapLayers.voyager;
}

function setBaseLayer() {
  if (!map) return;
  const config = selectedLayerConfig();
  if (baseLayer) map.removeLayer(baseLayer);
  baseLayer = L.tileLayer(config.url, config.options).addTo(map);
}

function ensureMap(place) {
  if (!map) {
    map = L.map("map", {
      zoomControl: false,
      minZoom: 3,
      maxZoom: 16,
      worldCopyJump: true
    }).setView([place.latitude, place.longitude], mapStartZoom);
    window.map = map;
    L.control.zoom({ position: "topright" }).addTo(map);
    setBaseLayer();
  } else {
    map.setView([place.latitude, place.longitude], mapStartZoom);
  }

  if (!marker) {
    marker = L.marker([place.latitude, place.longitude], {
      icon: cityMarkerIcon(place),
      zIndexOffset: 1000
    }).addTo(map);
  } else {
    marker.setLatLng([place.latitude, place.longitude]);
    marker.setIcon(cityMarkerIcon(place));
  }
  renderSavedMarkers();
  requestAnimationFrame(() => map.invalidateSize());
}

async function loadRadar() {
  const response = await fetch(rainViewerUrl);
  if (!response.ok) throw new Error(preferences.language === "it" ? "Dati radar non disponibili." : "Radar data unavailable.");
  const data = await response.json();
  const pastFrames = data.radar?.past || [];
  const futureFrames = data.radar?.nowcast || [];
  const frames = [...pastFrames, ...futureFrames];
  els.radarState.textContent = futureFrames.length ? "Live" : preferences.language === "it" ? "Storico" : "History";
  radarFrames = frames.map((frame) => ({
    ...frame,
    tileUrl: `${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
  }));
  radarNowIndex = Math.max(0, pastFrames.length - 1);
  frameIndex = radarNowIndex;
  els.frameSlider.max = String(Math.max(0, radarFrames.length - 1));
  els.frameSlider.disabled = radarFrames.length <= 1;
  showRadarFrame(frameIndex);
}

function clampFrameIndex(index) {
  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) return 0;
  return Math.max(0, Math.min(numericIndex, Math.max(0, radarFrames.length - 1)));
}

function formatRadarFrameLabel(frame) {
  const locale = preferences.language === "it" ? "it-IT" : "en-US";
  const date = new Date(frame.time * 1000);
  const time = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
  let phase;
  if (frameIndex > radarNowIndex) phase = preferences.language === "it" ? "previsione" : "forecast";
  else if (frameIndex === radarNowIndex) phase = preferences.language === "it" ? "ora" : "now";
  else phase = preferences.language === "it" ? "storico" : "past";
  return `${time} · ${phase} · ${frameIndex + 1}/${radarFrames.length}`;
}

function updateFrameControls() {
  els.prevFrame.disabled = frameIndex <= 0;
  els.nextFrame.disabled = frameIndex >= radarFrames.length - 1;
}

function showRadarFrame(index) {
  if (!map || !radarFrames.length) return;
  frameIndex = clampFrameIndex(index);
  const frame = radarFrames[frameIndex];

  previousRadarLayer = radarLayer;

  radarLayer = L.tileLayer(frame.tileUrl, {
    tileSize: 256,
    opacity: 0,
    zIndex: 10,
    maxZoom: 16,
    maxNativeZoom: radarMaxNativeZoom,
    attribution: "Radar &copy; RainViewer"
  }).addTo(map);

  radarLayer.once("load", () => {
    radarLayer.setOpacity(Number(preferences.radarOpacity) / 100);
    if (previousRadarLayer) {
      const staleLayer = previousRadarLayer;
      staleLayer.setOpacity(0);
      setTimeout(() => {
        if (staleLayer !== radarLayer && map.hasLayer(staleLayer)) {
          map.removeLayer(staleLayer);
        }
      }, 360);
    }
  });

  els.frameLabel.textContent = formatRadarFrameLabel(frame);
  els.frameSlider.value = String(frameIndex);
  els.frameSlider.style.setProperty("--frame-progress", `${radarFrames.length > 1 ? (frameIndex / (radarFrames.length - 1)) * 100 : 0}%`);
  updateFrameControls();
  els.frameLabel.classList.remove("is-changing");
  requestAnimationFrame(() => els.frameLabel.classList.add("is-changing"));
}

function toggleRadarPlayback() {
  if (radarTimer) {
    clearInterval(radarTimer);
    radarTimer = null;
    els.playRadar.textContent = t("play");
    return;
  }

  if (frameIndex >= radarFrames.length - 1) return;

  els.playRadar.textContent = t("pause");
  radarTimer = setInterval(() => {
    if (frameIndex >= radarFrames.length - 1) {
      toggleRadarPlayback();
      return;
    }
    showRadarFrame(frameIndex + 1);
  }, 1050);
}

function updateLastUpdated() {
  els.refreshStamp.textContent = lastUpdatedAt
    ? `${t("updated")} ${new Intl.DateTimeFormat(preferences.language === "it" ? "it-IT" : "en-US", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(lastUpdatedAt)}`
    : t("updatedNever");
}

function persistPreferences() {
  writeJson(storageKeys.prefs, preferences);
}

function applyDetailMode() {
  document.body.classList.toggle("is-compact", preferences.detailMode === "compact");
}

function configureAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  const minutes = Number(preferences.autoRefresh || 0);
  if (minutes > 0) {
    autoRefreshTimer = setInterval(() => {
      if (currentPlace) loadPlace(currentPlace);
      else refreshSavedComparison();
    }, minutes * 60 * 1000);
  }
}

function setMobileSidebar(open) {
  document.querySelector(".shell").classList.toggle("is-sidebar-open", open);
  els.mobileSidebarToggle.setAttribute("aria-expanded", String(open));
  els.mobileSidebarToggle.textContent = open ? t("sidebarClose") : t("sidebarOpen");
}

function renderStaticText() {
  document.querySelector("button[type='submit']").textContent = t("search");
  els.locationLabel.textContent = t("location");
  els.savePlace.textContent = isCurrentSaved() ? t("remove") : t("save");
  els.savedTitle.textContent = t("saved");
  els.thresholdLabel.textContent = t("threshold");
  els.languageLabel.textContent = t("languageLabel");
  els.forecastRangeLabel.textContent = t("forecastRange");
  els.forecastDayLabel.textContent = t("forecastDay");
  els.forecastDay.options[0].textContent = t("today");
  els.forecastDay.options[1].textContent = t("tomorrow");
  els.autoRefreshLabel.textContent = t("autoRefresh");
  els.detailModeLabel.textContent = t("detailMode");
  els.detailMode.options[0].textContent = t("detailedMode");
  els.detailMode.options[1].textContent = t("compactMode");
  els.useLocation.textContent = t("useLocation");
  els.copyReport.textContent = t("copyReport");
  els.exportReport.textContent = t("exportReport");
  els.renamePlace.textContent = t("renamePlace");
  els.conditionsTitle.textContent = t("conditions");
  els.hourlyTitle.textContent = t("hourly");
  els.compareTitle.textContent = t("compare");
  els.modelNote.textContent = t("note");
  els.radarTitle.textContent = t("radarTitle");
  els.radarSubtitle.textContent = t("radarSubtitle");
  els.layerMap.textContent = t("layerMap");
  els.layerDark.textContent = t("layerDark");
  els.layerTerrain.textContent = t("layerTerrain");
  els.legendWeak.textContent = t("weak");
  els.legendStrong.textContent = t("strong");
  els.refreshForecast.textContent = t("refresh");
  els.mobileSidebarToggle.textContent = document.querySelector(".shell").classList.contains("is-sidebar-open") ? t("sidebarClose") : t("sidebarOpen");
  els.playRadar.textContent = radarTimer ? t("pause") : t("play");
  els.mapLayer.setAttribute("title", t("mapLayerTitle"));
  document.querySelector(".radarLegend").setAttribute("aria-label", t("legendLabel"));
  if (!radarFrames.length) els.frameLabel.textContent = t("loadingRadar");
  updateLastUpdated();
}

function isCurrentSaved() {
  return currentPlace ? savedPlaces.some((place) => placeKey(place) === placeKey(currentPlace)) : false;
}

function renderSavedPlaces() {
  els.savePlace.textContent = isCurrentSaved() ? t("remove") : t("save");
  renderSavedMarkers();
  els.savedPlaces.innerHTML = savedPlaces.length
    ? savedPlaces
        .map((place) => {
          const active = currentPlace && placeKey(place) === placeKey(currentPlace) ? " is-active" : "";
          const score = Number.isFinite(place.lastScore) ? `<strong>${place.lastScore}</strong>` : "";
          return `<button type="button" class="savedChip${active}" data-place="${placeKey(place)}">
            <span>${place.name}</span>${score}
          </button>`;
        })
        .join("")
    : `<span class="emptySaved">${t("noSaved")}</span>`;
}

function saveCurrentPlace() {
  if (!currentPlace) return;
  const key = placeKey(currentPlace);
  if (isCurrentSaved()) {
    savedPlaces = savedPlaces.filter((place) => placeKey(place) !== key);
  } else {
    savedPlaces = [
      {
        id: key,
        name: currentPlace.name,
        country: currentPlace.country,
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude
      },
      ...savedPlaces.filter((place) => placeKey(place) !== key)
    ].slice(0, 8);
  }
  writeJson(storageKeys.saved, savedPlaces);
  renderSavedPlaces();
  refreshSavedComparison();
}

async function refreshSavedComparison() {
  if (!savedPlaces.length) {
    els.routeSummary.textContent = "";
    els.compareList.innerHTML = `<span class="emptySaved">${t("noSaved")}</span>`;
    renderSavedMarkers();
    return;
  }

  els.compareList.innerHTML = savedPlaces
    .map((place) => `<div class="compareItem"><span>${place.name}</span><strong>...</strong></div>`)
    .join("");

  const updated = [];
  for (const place of savedPlaces) {
    try {
      const forecast = await getForecast(place);
      const rows = getHourlyRows(forecast);
      const visibleRows = selectedRows(rows);
      const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0] || rows[0]);
      maybeNotify(place, max);
      updated.push({ ...place, lastScore: max.score, lastTime: max.time, lastTimezone: forecast.timezone });
    } catch {
      updated.push({ ...place, lastScore: null });
    }
  }

  savedPlaces = updated.sort((a, b) => Number(b.lastScore || 0) - Number(a.lastScore || 0));
  writeJson(storageKeys.saved, savedPlaces);
  renderSavedPlaces();
  const riskiest = savedPlaces.find((place) => Number.isFinite(place.lastScore));
  els.routeSummary.textContent = riskiest
    ? `${t("route")}: ${riskiest.name} · ${riskiest.lastScore}`
    : "";
  renderSavedMarkers();
  els.compareList.innerHTML = savedPlaces
    .map((place) => {
      const score = Number.isFinite(place.lastScore) ? place.lastScore : "--";
      const color = Number.isFinite(place.lastScore) ? riskColor(place.lastScore) : "#8e969c";
      const time = place.lastTime ? formatHour(place.lastTime, place.lastTimezone) : "";
      return `<button type="button" class="compareItem" data-place="${placeKey(place)}">
        <span>${place.name}${time ? ` · ${time}` : ""}</span>
        <strong style="color:${color}">${score}</strong>
      </button>`;
    })
    .join("");
}

async function maybeNotify(place, max) {
  if (!("Notification" in window) || !max || max.score < Number(preferences.riskThreshold)) return;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (Notification.permission !== "granted") return;

  const notified = readJson(storageKeys.notified, {});
  const key = `${placeKey(place)}:${max.time}:${preferences.riskThreshold}`;
  if (notified[key]) return;
  notified[key] = Date.now();
  writeJson(storageKeys.notified, notified);
  new Notification(t("alertTitle"), {
    body: t("alertBody")(placeLabel(place), max.score)
  });
}

async function loadPlace(place) {
  try {
    currentPlace = place;
    setMobileSidebar(false);
    ensureMap(place);
    renderSavedPlaces();

    setStatus(t("forecast"));
    currentForecast = await getForecast(place);
    renderRisk(place, currentForecast);
    lastUpdatedAt = new Date();
    updateLastUpdated();
    writeJson(storageKeys.lastPlace, place);

    setStatus(t("radar"));
    await loadRadar();
    setStatus(`${t("synced")} ${place.name}`);
    refreshSavedComparison();
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}

async function loadCity(city) {
  try {
    setStatus(`${t("looking")} ${city}...`);
    const place = await searchCity(city);
    await loadPlace(place);
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}

function rerenderCurrent() {
  renderStaticText();
  renderSavedPlaces();
  if (currentPlace && marker) marker.setIcon(cityMarkerIcon(currentPlace));
  if (currentPlace && currentForecast) renderRisk(currentPlace, currentForecast);
  refreshSavedComparison();
}

async function loadCurrentLocation() {
  if (!("geolocation" in navigator)) {
    setStatus(t("locationUnavailable"));
    return;
  }

  setStatus(t("locating"));
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const place = {
        name: t("currentLocation"),
        country: "",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      els.cityInput.value = place.name;
      loadPlace(place);
    },
    () => setStatus(t("locationUnavailable")),
    { enableHighAccuracy: true, maximumAge: 600000, timeout: 12000 }
  );
}

function buildReport() {
  if (!currentPlace || !currentForecast) return "";
  const rows = getHourlyRows(currentForecast);
  const max = rows.reduce((best, row) => (row.score > best.score ? row : best), rows[0]);
  const severeWindow = findSevereWindow(rows, currentForecast.timezone) || t("noRisk");
  return [
    `HailWatch · ${placeLabel(currentPlace)}`,
    `${t("riskPrefix")}: ${max.score} (${riskLabel(max.score)})`,
    `${preferences.language === "it" ? "Picco" : "Peak"}: ${formatDateTime(max.time, currentForecast.timezone)}`,
    severeWindow,
    `${weatherText(max.weather_code)} · CAPE ${Math.round(max.cape || 0)} J/kg · ${Math.round(max.precipitation_probability || 0)}%`
  ].join("\n");
}

async function copyCurrentReport() {
  const report = buildReport();
  if (!report) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(report);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = report;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setStatus(t("copiedReport"));
  } catch {
    setStatus(t("copyFailed"));
  }
}

function exportCurrentReport() {
  const report = buildReport();
  if (!report) return;
  const blob = new Blob([report], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `hailwatch-${currentPlace?.name || "report"}.txt`.replace(/\s+/g, "-").toLowerCase();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setStatus(t("exportedReport"));
}

function renameCurrentSavedPlace() {
  if (!currentPlace || !isCurrentSaved()) return;
  const name = window.prompt(preferences.language === "it" ? "Nuovo nome" : "New name", currentPlace.name);
  if (!name?.trim()) return;
  const key = placeKey(currentPlace);
  savedPlaces = savedPlaces.map((place) => (placeKey(place) === key ? { ...place, name: name.trim() } : place));
  currentPlace = { ...currentPlace, name: name.trim() };
  writeJson(storageKeys.saved, savedPlaces);
  writeJson(storageKeys.lastPlace, currentPlace);
  renderSavedPlaces();
  renderSavedMarkers();
  if (marker) marker.setIcon(cityMarkerIcon(currentPlace));
  els.placeName.textContent = placeLabel(currentPlace);
}

let suggestionTimer = null;
function queueSuggestions() {
  clearTimeout(suggestionTimer);
  const query = els.cityInput.value.trim();
  if (query.length < 3) {
    els.suggestions.innerHTML = "";
    return;
  }
  suggestionTimer = setTimeout(async () => {
    try {
      searchSuggestions = await searchCities(query, 5);
      els.suggestions.innerHTML = searchSuggestions
        .map(
          (place, index) => `<button type="button" class="suggestionItem" data-index="${index}">
            <span>${escapeHtml(place.name)}</span><small>${escapeHtml([place.admin1, place.country].filter(Boolean).join(", "))}</small>
          </button>`
        )
        .join("");
    } catch {
      els.suggestions.innerHTML = "";
    }
  }, 260);
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = els.cityInput.value.trim();
  els.suggestions.innerHTML = "";
  if (city) loadCity(city);
});

els.cityInput.addEventListener("input", queueSuggestions);
els.suggestions.addEventListener("click", (event) => {
  const button = event.target.closest(".suggestionItem");
  if (!button) return;
  const place = searchSuggestions[Number(button.dataset.index)];
  if (!place) return;
  els.cityInput.value = place.name;
  els.suggestions.innerHTML = "";
  loadPlace(place);
});

els.savedPlaces.addEventListener("click", (event) => {
  const button = event.target.closest("[data-place]");
  if (!button) return;
  const place = savedPlaces.find((item) => placeKey(item) === button.dataset.place);
  if (place) {
    els.cityInput.value = place.name;
    loadPlace(place);
  }
});

els.compareList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-place]");
  if (!button) return;
  const place = savedPlaces.find((item) => placeKey(item) === button.dataset.place);
  if (place) {
    els.cityInput.value = place.name;
    loadPlace(place);
  }
});

els.savePlace.addEventListener("click", saveCurrentPlace);
els.useLocation.addEventListener("click", loadCurrentLocation);
els.mobileSidebarToggle.addEventListener("click", () => {
  const open = !document.querySelector(".shell").classList.contains("is-sidebar-open");
  setMobileSidebar(open);
  if (map) setTimeout(() => map.invalidateSize(), 220);
});
els.mobileDrawerBackdrop.addEventListener("click", () => setMobileSidebar(false));
els.mobileForecastSheet.addEventListener("click", () => {
  const open = !els.mobileForecastSheet.classList.contains("is-open");
  els.mobileForecastSheet.classList.toggle("is-open", open);
  els.mobileForecastSheet.setAttribute("aria-expanded", String(open));
});
els.copyReport.addEventListener("click", copyCurrentReport);
els.exportReport.addEventListener("click", exportCurrentReport);
els.renamePlace.addEventListener("click", renameCurrentSavedPlace);
els.prevFrame.addEventListener("click", () => showRadarFrame(frameIndex - 1));
els.nextFrame.addEventListener("click", () => showRadarFrame(frameIndex + 1));
els.frameSlider.addEventListener("input", () => {
  if (radarTimer) toggleRadarPlayback();
  showRadarFrame(Number(els.frameSlider.value));
});
els.playRadar.addEventListener("click", toggleRadarPlayback);
els.refreshForecast.addEventListener("click", () => {
  if (currentPlace) loadPlace(currentPlace);
});
els.riskThreshold.addEventListener("change", () => {
  preferences.riskThreshold = Number(els.riskThreshold.value);
  persistPreferences();
  rerenderCurrent();
});
els.languageSelect.addEventListener("change", () => {
  preferences.language = els.languageSelect.value;
  persistPreferences();
  rerenderCurrent();
});
function setForecastOffset(offset) {
  const rows = currentForecast ? getHourlyRows(currentForecast) : null;
  preferences.forecastOffsetHours = Math.max(0, Math.min(maxForecastOffset(rows), Number(offset) || 0));
  preferences.forecastDay = selectedForecastDay();
  els.forecastDay.value = String(selectedForecastDay());
  persistPreferences();
  if (currentPlace && currentForecast) renderRisk(currentPlace, currentForecast);
  refreshSavedComparison();
}

els.prevForecastWindow.addEventListener("click", () => {
  setForecastOffset(selectedForecastOffsetHours() - selectedForecastHours());
});
els.nextForecastWindow.addEventListener("click", () => {
  setForecastOffset(selectedForecastOffsetHours() + selectedForecastHours());
});
els.forecastHours.addEventListener("change", () => {
  preferences.forecastHours = Number(els.forecastHours.value);
  persistPreferences();
  if (currentPlace && currentForecast) renderRisk(currentPlace, currentForecast);
  refreshSavedComparison();
});
els.forecastDay.addEventListener("change", () => {
  setForecastOffset(Number(els.forecastDay.value) * 24);
});
els.autoRefresh.addEventListener("change", () => {
  preferences.autoRefresh = Number(els.autoRefresh.value);
  persistPreferences();
  configureAutoRefresh();
});
els.detailMode.addEventListener("change", () => {
  preferences.detailMode = els.detailMode.value;
  persistPreferences();
  applyDetailMode();
});
els.radarOpacity.addEventListener("input", () => {
  preferences.radarOpacity = Number(els.radarOpacity.value);
  persistPreferences();
  if (radarLayer) radarLayer.setOpacity(preferences.radarOpacity / 100);
});
els.mapLayer.addEventListener("change", () => {
  preferences.mapLayer = els.mapLayer.value;
  persistPreferences();
  setBaseLayer();
});
window.addEventListener("resize", () => {
  if (map) map.invalidateSize();
});
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "r") {
    event.preventDefault();
    if (currentPlace) loadPlace(currentPlace);
  }
  if ((event.metaKey || event.ctrlKey) && key === "l") {
    event.preventDefault();
    els.cityInput.focus();
    els.cityInput.select();
  }
  if (event.code === "Space" && !["INPUT", "SELECT", "BUTTON", "TEXTAREA"].includes(event.target.tagName)) {
    event.preventDefault();
    toggleRadarPlayback();
  }
});

els.riskThreshold.value = String(preferences.riskThreshold);
els.languageSelect.value = preferences.language;
els.forecastHours.value = String(selectedForecastHours());
els.forecastDay.value = String(selectedForecastDay());
els.autoRefresh.value = String(Number(preferences.autoRefresh || 0));
els.detailMode.value = preferences.detailMode === "compact" ? "compact" : "detailed";
els.radarOpacity.value = String(preferences.radarOpacity);
els.mapLayer.value = preferences.mapLayer;
applyDetailMode();
configureAutoRefresh();
renderStaticText();
renderSavedPlaces();
refreshSavedComparison();

const lastPlace = readJson(storageKeys.lastPlace, null);
if (lastPlace?.latitude && lastPlace?.longitude) {
  els.cityInput.value = lastPlace.name;
  loadPlace(lastPlace);
} else {
  setStatus(t("ready"));
  loadCity(els.cityInput.value);
}
