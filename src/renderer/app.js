const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";
const precipitationMapUrl = "https://map-tiles.open-meteo.com/data_spatial/dwd_icon/latest.json";
const mapStartZoom = 7;
const precipitationColorScale = {
  type: "breakpoint",
  unit: "mm",
  breakpoints: [0.01, 0.15, 0.5, 1, 2, 4, 7, 10, 15, 25],
  colors: [
    [61, 105, 132, 0],
    [71, 166, 190, 0],
    [49, 153, 174, 0.3],
    [41, 139, 119, 0.56],
    [86, 158, 95, 0.72],
    [191, 184, 74, 0.82],
    [222, 146, 66, 0.9],
    [211, 92, 65, 0.96],
    [174, 60, 70, 1],
    [134, 48, 67, 1]
  ]
};
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
    save: "Salva località",
    remove: "Rimuovi località",
    saved: "Salvati",
    threshold: "Avviso da",
    languageLabel: "Lingua",
    forecastRange: "Periodo",
    forecastDay: "Giorno",
    today: "Oggi",
    tomorrow: "Domani",
    useLocation: "Usa la mia posizione",
    currentLocation: "Posizione attuale",
    locating: "Rilevo la posizione...",
    locationUnavailable: "Posizione non disponibile. Cerca una città.",
    copyReport: "Copia report",
    exportReport: "Esporta report",
    renamePlace: "Rinomina",
    copiedReport: "Report copiato",
    copyFailed: "Impossibile copiare. Riprova o esporta il report.",
    exportedReport: "Report esportato",
    forecastLoadingDetail: "Aggiorno rischio, condizioni e andamento orario.",
    retry: "Riprova",
    dataError: "Dati non disponibili",
    forecastError: "Previsione non disponibile. Riprova.",
    comparisonLoading: "Aggiorno le località salvate...",
    comparisonError: "Alcune località non sono state aggiornate.",
    radarError: "Precipitazioni non disponibili",
    radarRetry: "Premi Aggiorna per riprovare.",
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
    radarTitle: "Previsione precipitazioni",
    radarSubtitle: "Prossime 2 ore",
    layerMap: "Mappa",
    layerDark: "Scura",
    layerTerrain: "Terreno",
    weak: "Debole",
    strong: "Forte",
    noSaved: "Salva una località per confrontarla",
    noRisk: "Nessuna finestra severa nel periodo selezionato",
    severe: "Finestra severa",
    updatedNever: "Mai aggiornato",
    updated: "Aggiornato",
    loadingRadar: "Caricamento previsione",
    refresh: "Aggiorna",
    mapLayerTitle: "Livello mappa",
    legendLabel: "Legenda intensità precipitazioni",
    looking: "Cerco",
    forecast: "Carico previsione...",
    radar: "Aggiorno mappa previsionale...",
    radarForecast: "Previsione",
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
    save: "Save location",
    remove: "Remove location",
    saved: "Saved",
    threshold: "Alert from",
    languageLabel: "Language",
    forecastRange: "Range",
    forecastDay: "Day",
    today: "Today",
    tomorrow: "Tomorrow",
    useLocation: "Use my location",
    currentLocation: "Current location",
    locating: "Detecting location...",
    locationUnavailable: "Location unavailable. Search for a city instead.",
    copyReport: "Copy report",
    exportReport: "Export report",
    renamePlace: "Rename",
    copiedReport: "Report copied",
    copyFailed: "Could not copy. Try again or export the report.",
    exportedReport: "Report exported",
    forecastLoadingDetail: "Updating risk, conditions, and the hourly outlook.",
    retry: "Try again",
    dataError: "Data unavailable",
    forecastError: "Forecast unavailable. Try again.",
    comparisonLoading: "Updating saved locations...",
    comparisonError: "Some locations could not be updated.",
    radarError: "Precipitation unavailable",
    radarRetry: "Select Refresh to try again.",
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
    radarTitle: "Precipitation forecast",
    radarSubtitle: "Next 2 hours",
    layerMap: "Map",
    layerDark: "Dark",
    layerTerrain: "Terrain",
    weak: "Weak",
    strong: "Strong",
    noSaved: "Save a location to compare it",
    noRisk: "No severe window in the selected range",
    severe: "Severe window",
    updatedNever: "Never updated",
    updated: "Updated",
    loadingRadar: "Loading forecast",
    refresh: "Refresh",
    mapLayerTitle: "Map layer",
    legendLabel: "Precipitation intensity legend",
    looking: "Searching",
    forecast: "Loading forecast...",
    radar: "Updating forecast map...",
    radarForecast: "Forecast",
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
  mapLayer: document.querySelector("#mapLayer"),
  forecastState: document.querySelector("#forecastState"),
  forecastStateTitle: document.querySelector("#forecastStateTitle"),
  forecastStateDetail: document.querySelector("#forecastStateDetail"),
  forecastSkeleton: document.querySelector("#forecastSkeleton"),
  retryForecast: document.querySelector("#retryForecast"),
  compareStatus: document.querySelector("#compareStatus"),
  compareStatusText: document.querySelector("#compareStatusText"),
  retryComparison: document.querySelector("#retryComparison")
};

let map;
let marker;
let baseLayer;
let weatherMapAdapter;
let radarLayer;
const radarLayers = new Set();
let radarFrames = [];
let frameIndex = 0;
let autoRefreshTimer = null;
let currentPlace = null;
let currentForecast = null;
let lastUpdatedAt = null;
let savedMarkers = [];
let searchSuggestions = [];
let loadGeneration = 0;
let radarLoadGeneration = 0;
let comparisonGeneration = 0;
let citySearchGeneration = 0;
let suggestionGeneration = 0;

let savedPlaces = readJson(storageKeys.saved, []);
let preferences = {
  language: "it",
  riskThreshold: 50,
  radarOpacity: 64,
  forecastHours: 24,
  forecastDay: 0,
  forecastOffsetHours: 0,
  autoRefresh: 0,
  detailMode: "detailed",
  mapLayer: "voyager",
  ...readJson(storageKeys.prefs, {})
};
if ([40, 52].includes(Number(preferences.radarOpacity))) preferences.radarOpacity = 64;

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
      <span class="cityMarkerLabel">${escapeHtml(placeLabel(place))}</span>
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

function setForecastState(state, detail = "") {
  const ready = state === "ready";
  const error = state === "error";
  els.forecastState.hidden = ready;
  els.forecastState.classList.toggle("is-error", error);
  els.forecastState.setAttribute("aria-busy", String(state === "loading"));
  els.forecastStateTitle.textContent = error ? t("dataError") : t("forecast");
  els.forecastStateDetail.textContent = detail || (error ? t("forecastError") : t("forecastLoadingDetail"));
  els.forecastSkeleton.hidden = state !== "loading";
  els.retryForecast.hidden = !error;
  if (!ready) {
    els.sheetRiskLabel.textContent = error ? t("dataError") : t("forecast");
    els.sheetScore.textContent = "--";
    els.sheetScore.style.color = "var(--risk-neutral)";
  }
}

function setComparisonState(state, failures = 0) {
  const ready = state === "ready";
  els.compareStatus.hidden = ready;
  els.compareStatus.classList.toggle("is-error", state === "error");
  els.compareStatusText.textContent = state === "loading"
    ? t("comparisonLoading")
    : `${t("comparisonError")} ${failures ? `(${failures})` : ""}`.trim();
  els.retryComparison.hidden = state !== "error";
}

function riskColor(score) {
  if (score >= 75) return "var(--danger)";
  if (score >= Number(preferences.riskThreshold)) return "var(--accent)";
  return "var(--risk-neutral)";
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
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: timezone
  });
  const day = formatter.format(new Date(time));
  const firstDay = formatter.format(new Date(firstTime));
  const nextDay = formatter.format(new Date(new Date(firstTime).getTime() + 24 * 60 * 60 * 1000));
  const prefix = day === firstDay
    ? preferences.language === "it" ? "oggi" : "today"
    : day === nextDay
      ? preferences.language === "it" ? "domani" : "tomorrow"
      : day;
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
  const maxOffset = maxForecastOffset(rows);
  const offset = Math.min(selectedForecastOffsetHours(), maxOffset);
  preferences.forecastOffsetHours = offset;
  preferences.forecastDay = selectedForecastDay();
  els.forecastDay.value = String(preferences.forecastDay);
  els.prevForecastWindow.disabled = offset <= 0;
  els.nextForecastWindow.disabled = offset >= maxOffset;
  [...els.forecastDay.options].forEach((option) => {
    option.disabled = Number(option.value) * 24 > maxOffset;
  });
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
  return `${t("severe")}: ${formatHour(visibleRows[best.start].time, timezone)}-${formatHour(visibleRows[best.end].time, timezone)}, ${duration}h, ${best.peak}, ${cause}`;
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

}

async function searchCities(name, count = 5) {
  const url = new URL(geocodeUrl);
  url.searchParams.set("name", name);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", preferences.language);
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error(preferences.language === "it" ? "Ricerca non disponibile. Riprova." : "Search unavailable. Try again.");
  const data = await response.json();
  return data.results || [];
}

async function searchCity(name) {
  const results = await searchCities(name, 1);
  if (!results.length) throw new Error(preferences.language === "it" ? "Località non trovata. Controlla il nome e riprova." : "Location not found. Check the name and try again.");
  return results[0];
}

function cacheKey(place) {
  return `${placeKey(place)}:forecast-168h-v3`;
}

async function getForecast(place) {
  const url = new URL(forecastUrl);
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set(
    "hourly",
    "weather_code,precipitation_probability,precipitation,showers,cape,wind_gusts_10m,wind_direction_10m,freezing_level_height"
  );
  url.searchParams.set("forecast_hours", "168");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("timezone", "auto");

  const forecastCache = readJson(storageKeys.forecastCache, {});
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(t("forecastError"));
    const forecast = await response.json();
    if (!forecast.hourly?.time?.length) throw new Error(t("forecastError"));
    forecast.hourly.time = forecast.hourly.time.map((time) => typeof time === "number" ? time * 1000 : time);
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

function updateWeatherMapBounds() {
  if (!map || !window.OMWeatherMapLayer) return;
  const bounds = map.getBounds();
  window.OMWeatherMapLayer.updateCurrentBounds([
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ]);
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
    if (window.OMWeatherMapLayer) {
      weatherMapAdapter = window.OMWeatherMapLayer.addLeafletProtocolSupport(L);
      const protocolSettings = {
        ...window.OMWeatherMapLayer.defaultOmProtocolSettings,
        colorScales: {
          ...window.OMWeatherMapLayer.defaultOmProtocolSettings.colorScales,
          precipitation: precipitationColorScale
        }
      };
      weatherMapAdapter.addProtocol("om", window.OMWeatherMapLayer.omProtocol, protocolSettings);
      map.createPane("weatherPane");
      map.getPane("weatherPane").classList.add("weatherPane");
      map.on("moveend", updateWeatherMapBounds);
      updateWeatherMapBounds();
    }
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

function createRadarLayer(frame) {
  if (!weatherMapAdapter) throw new Error(preferences.language === "it" ? "Livello previsionale non disponibile." : "Forecast layer unavailable.");
  return weatherMapAdapter.createTileLayer(frame.url, {
    opacity: 0,
    maxZoom: 12,
    pane: "weatherPane",
    attribution: "Forecast &copy; Open-Meteo, DWD"
  });
}

async function loadRadar() {
  const generation = ++radarLoadGeneration;
  els.radarState.textContent = t("loadingRadar");
  const response = await fetch(precipitationMapUrl);
  if (!response.ok) throw new Error(preferences.language === "it" ? "Previsione mappa non disponibile." : "Map forecast unavailable.");
  const metadata = await response.json();
  if (generation !== radarLoadGeneration) return;
  const validTimes = metadata.valid_times || [];
  if (!validTimes.length) throw new Error(preferences.language === "it" ? "Nessun orario previsionale." : "No forecast times available.");

  const now = Date.now();
  const startIndex = validTimes.reduce((best, time, index) => Date.parse(time) <= now ? index : best, 0);
  radarFrames = validTimes.slice(startIndex, startIndex + 3).map((time, offset) => ({
    time: Date.parse(time) / 1000,
    url: `om://${precipitationMapUrl}?time_step=valid_times_${startIndex + offset}&variable=precipitation&dark=${preferences.mapLayer === "dark"}`
  }));
  els.radarState.textContent = t("radarForecast");
  frameIndex = 0;
  els.frameSlider.min = "0";
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
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(frame.time * 1000));
  const minutes = Math.max(0, Math.round((frame.time - radarFrames[0].time) / 60));
  const offset = minutes === 0
    ? preferences.language === "it" ? "Ora" : "Now"
    : minutes % 60 === 0 ? `+${minutes / 60}h` : `+${minutes} min`;
  return `${offset} · ${time}`;
}

function showRadarFrame(index) {
  if (!map || !radarFrames.length) return;
  frameIndex = clampFrameIndex(index);
  const frame = radarFrames[frameIndex];
  const nextLayer = createRadarLayer(frame).addTo(map);

  radarLayer = nextLayer;
  radarLayers.add(nextLayer);
  nextLayer.once("load", () => {
    if (nextLayer !== radarLayer) {
      if (map.hasLayer(nextLayer)) map.removeLayer(nextLayer);
      radarLayers.delete(nextLayer);
      return;
    }
    nextLayer.setOpacity(Number(preferences.radarOpacity) / 100);
    radarLayers.forEach((layer) => {
      if (layer !== nextLayer) {
        if (map.hasLayer(layer)) map.removeLayer(layer);
        radarLayers.delete(layer);
      }
    });
  });

  els.frameLabel.textContent = formatRadarFrameLabel(frame);
  els.frameSlider.value = String(frameIndex);
  els.frameSlider.style.setProperty("--frame-progress", `${radarFrames.length > 1 ? (frameIndex / (radarFrames.length - 1)) * 100 : 0}%`);
  els.frameLabel.classList.remove("is-changing");
  requestAnimationFrame(() => els.frameLabel.classList.add("is-changing"));
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
  els.retryForecast.textContent = t("retry");
  els.retryComparison.textContent = t("retry");
  els.mobileSidebarToggle.textContent = document.querySelector(".shell").classList.contains("is-sidebar-open") ? t("sidebarClose") : t("sidebarOpen");
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
            <span>${escapeHtml(place.name)}</span>${score}
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
  const generation = ++comparisonGeneration;
  if (!savedPlaces.length) {
    els.routeSummary.textContent = "";
    setComparisonState("ready");
    els.compareList.innerHTML = `<span class="emptySaved">${t("noSaved")}</span>`;
    renderSavedMarkers();
    return;
  }

  setComparisonState("loading");
  els.compareList.innerHTML = savedPlaces
    .map((place) => `<div class="compareItem"><span>${escapeHtml(place.name)}</span><strong>...</strong></div>`)
    .join("");

  const updated = [];
  let failures = 0;
  for (const place of [...savedPlaces]) {
    try {
      const forecast = await getForecast(place);
      if (generation !== comparisonGeneration) return;
      const rows = getHourlyRows(forecast);
      const visibleRows = selectedRows(rows);
      const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0] || rows[0]);
      maybeNotify(place, max);
      updated.push({ ...place, lastScore: max.score, lastTime: max.time, lastTimezone: forecast.timezone });
    } catch {
      failures += 1;
      updated.push({ ...place, lastScore: null });
    }
  }

  if (generation !== comparisonGeneration) return;
  setComparisonState(failures ? "error" : "ready", failures);
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
      const color = Number.isFinite(place.lastScore) ? riskColor(place.lastScore) : "var(--risk-neutral)";
      const time = place.lastTime ? formatHour(place.lastTime, place.lastTimezone) : "";
      return `<button type="button" class="compareItem" data-place="${placeKey(place)}">
        <span>${escapeHtml(place.name)}${time ? ` · ${time}` : ""}</span>
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
  const generation = ++loadGeneration;
  let forecastRendered = false;
  citySearchGeneration += 1;
  suggestionGeneration += 1;
  clearTimeout(suggestionTimer);
  els.suggestions.innerHTML = "";
  try {
    currentPlace = place;
    currentForecast = null;
    setMobileSidebar(false);
    ensureMap(place);
    renderSavedPlaces();

    setStatus(t("forecast"));
    setForecastState("loading");
    const forecast = await getForecast(place);
    if (generation !== loadGeneration) return;
    currentForecast = forecast;
    renderRisk(place, currentForecast);
    forecastRendered = true;
    setForecastState("ready");
    const rows = selectedRows(getHourlyRows(currentForecast));
    const max = rows.reduce((best, row) => row.score > best.score ? row : best, rows[0]);
    rememberHistory(place, max.score);
    maybeNotify(place, max);
    lastUpdatedAt = new Date();
    updateLastUpdated();
    writeJson(storageKeys.lastPlace, place);

    setStatus(t("radar"));
    await loadRadar();
    if (generation !== loadGeneration) return;
    setStatus(`${t("synced")} ${place.name}`);
    refreshSavedComparison();
  } catch (error) {
    console.error(error);
    if (generation === loadGeneration) {
      setStatus(error.message);
      if (!forecastRendered) {
        setForecastState("error");
      } else {
        els.radarState.textContent = t("radarError");
        els.frameLabel.textContent = t("radarRetry");
      }
    }
  }
}

async function loadCity(city) {
  const generation = ++citySearchGeneration;
  try {
    setStatus(`${t("looking")} ${city}...`);
    const place = await searchCity(city);
    if (generation !== citySearchGeneration) return;
    await loadPlace(place);
  } catch (error) {
    console.error(error);
    if (generation === citySearchGeneration) {
      setStatus(error.message);
      if (!currentForecast) setForecastState("error", error.message);
    }
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
  const visibleRows = selectedRows(rows);
  const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0]);
  const severeWindow = findSevereWindow(rows, currentForecast.timezone) || t("noRisk");
  return [
    `HailWatch · ${placeLabel(currentPlace)}`,
    `${t("riskPrefix")}: ${max.score} (${riskLabel(max.score)})`,
    `${preferences.language === "it" ? "Picco" : "Peak"}: ${formatDateTime(max.time, currentForecast.timezone)}`,
    severeWindow,
    `${weatherText(max.weather_code)}, CAPE ${Math.round(max.cape || 0)} J/kg, ${Math.round(max.precipitation_probability || 0)}%`
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
  els.cityInput.value = currentPlace.name;
  els.placeName.textContent = placeLabel(currentPlace);
  els.sheetPlace.textContent = currentPlace.name;
}

let suggestionTimer = null;
function queueSuggestions() {
  clearTimeout(suggestionTimer);
  const generation = ++suggestionGeneration;
  const query = els.cityInput.value.trim();
  if (query.length < 3) {
    els.suggestions.innerHTML = "";
    return;
  }
  suggestionTimer = setTimeout(async () => {
    try {
      const suggestions = await searchCities(query, 5);
      if (generation !== suggestionGeneration) return;
      searchSuggestions = suggestions;
      els.suggestions.innerHTML = searchSuggestions
        .map(
          (place, index) => `<button type="button" class="suggestionItem" data-index="${index}">
            <span>${escapeHtml(place.name)}</span><small>${escapeHtml([place.admin1, place.country].filter(Boolean).join(", "))}</small>
          </button>`
        )
        .join("");
    } catch {
      if (generation === suggestionGeneration) els.suggestions.innerHTML = "";
    }
  }, 260);
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(suggestionTimer);
  suggestionGeneration += 1;
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
  suggestionGeneration += 1;
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
els.retryForecast.addEventListener("click", () => {
  if (currentPlace) loadPlace(currentPlace);
  else loadCity(els.cityInput.value.trim());
});
els.retryComparison.addEventListener("click", refreshSavedComparison);
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
els.frameSlider.addEventListener("input", () => {
  showRadarFrame(Number(els.frameSlider.value));
});
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
function setForecastOffset(offset, commit = true) {
  const rows = currentForecast ? getHourlyRows(currentForecast) : null;
  preferences.forecastOffsetHours = Math.max(0, Math.min(maxForecastOffset(rows), Number(offset) || 0));
  preferences.forecastDay = selectedForecastDay();
  els.forecastDay.value = String(selectedForecastDay());
  if (commit) persistPreferences();
  if (currentPlace && currentForecast) renderRisk(currentPlace, currentForecast);
  if (commit) refreshSavedComparison();
}

els.prevForecastWindow.addEventListener("click", () => {
  setForecastOffset(selectedForecastOffsetHours() - selectedForecastHours());
});
els.nextForecastWindow.addEventListener("click", () => {
  setForecastOffset(selectedForecastOffsetHours() + selectedForecastHours());
});
els.forecastHours.addEventListener("change", () => {
  preferences.forecastHours = Number(els.forecastHours.value);
  setForecastOffset(selectedForecastOffsetHours());
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
  loadRadar();
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
