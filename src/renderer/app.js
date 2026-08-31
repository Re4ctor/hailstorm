const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastHourlyFields =
  "weather_code,precipitation_probability,precipitation,showers,cape,wind_gusts_10m,wind_direction_10m,freezing_level_height";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";
const radarMetadataUrl = "https://api.rainviewer.com/public/weather-maps.json";
const precipitationForecastUrl = "https://map-tiles.open-meteo.com/data_spatial/dwd_icon/latest.json";
const mapStartZoom = 7;
const precipitationColorScale = {
  type: "breakpoint",
  unit: "mm",
  breakpoints: [0.01, 0.15, 0.5, 1, 2, 4, 7, 10, 15, 25],
  colors: [
    [27, 99, 203, 0],
    [22, 143, 226, 0.2],
    [46, 210, 236, 0.42],
    [68, 194, 197, 0.58],
    [149, 205, 89, 0.72],
    [242, 213, 76, 0.82],
    [242, 139, 54, 0.9],
    [222, 60, 56, 0.96],
    [170, 46, 112, 1],
    [118, 34, 104, 1]
  ]
};
const cloudCoverColorScale = {
  type: "breakpoint",
  unit: "%",
  breakpoints: [0, 20, 40, 60, 80, 100],
  colors: [
    [255, 255, 255, 0],
    [224, 231, 235, 0.08],
    [205, 214, 220, 0.16],
    [181, 192, 200, 0.27],
    [153, 165, 175, 0.4],
    [126, 138, 149, 0.54]
  ]
};
const rainViewerRequestsPerMinute = 100;
const rainViewerPlaybackBudget = Math.floor(rainViewerRequestsPerMinute * 0.75);
const requestTimeoutMs = 12000;
const requestRetries = 2;
const requestBackoffMs = 800;
const requestMaxBackoffMs = 8000;
// Open-Meteo publishes 600 calls/min, 5.000/hour and 10.000/day on the free
// non-commercial tier, with no API key. These caps sit at half the published
// per-minute ceiling: enough headroom that a burst cannot trip the limit, and
// still far more than this app can spend, because a forecast load is one
// request and the saved-place comparison is one more regardless of its length.
const hostRequestLimits = {
  "api.open-meteo.com": { perMinute: 300, concurrency: 6 },
  "geocoding-api.open-meteo.com": { perMinute: 200, concurrency: 4 },
  // RainViewer publishes no number for the free tier, so this one stays
  // deliberately modest. Playback does not spend it: see prefetchRadarFrames.
  "api.rainviewer.com": { perMinute: 30, concurrency: 3 },
  "map-tiles.open-meteo.com": { perMinute: 60, concurrency: 4 }
};
const defaultRequestLimit = { perMinute: 60, concurrency: 3 };
const forecastFreshMs = 10 * 60 * 1000;
const comparisonFreshMs = 20 * 60 * 1000;
const forecastCacheMaxAgeMs = 24 * 60 * 60 * 1000;
const forecastCacheMaxEntries = 12;
const geocodeCacheTtlMs = 30 * 60 * 1000;
const geocodeCacheMaxEntries = 60;
const radarMetadataTtlMs = 2 * 60 * 1000;
const suggestionDebounceMs = 340;
const notifiedMaxAgeMs = 48 * 60 * 60 * 1000;
const radarFrameRevealMs = 8000;
const radarWarmPlaybackFloorMs = 1200;
const radarCachedPlaybackMs = 420;
const radarMaxNativeZoom = 7;
const radarPrefetchTileCap = 24;
const radarPrefetchGapMs = 220;
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
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 19,
      attribution: "Tiles &copy; Esri"
    }
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 19,
      maxNativeZoom: 19,
      attribution: "Tiles &copy; Esri"
    }
  },
  dark: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    options: {
      maxZoom: 16,
      maxNativeZoom: 16,
      attribution: "Tiles &copy; Esri"
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
    settings: "Impostazioni",
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
    barKeyRisk: "Rischio",
    barKeyStorm: "Intensità",
    route: "Percorso",
    history: "Storico",
    warnings: "Avvisi ufficiali",
    sidebarOpen: "Dati",
    sidebarClose: "Mappa",
    conditions: "Condizioni",
    hourly: "Rischio orario",
    compare: "Confronto salvati",
    radarTitle: "Radar e previsione precipitazioni",
    radarSubtitle: "Ultime 2 ore + prossime 10 ore",
    layerMap: "Mappa",
    layerSatellite: "Satellite",
    layerDark: "Scura",
    layerTerrain: "Terreno",
    weak: "Debole",
    strong: "Forte",
    noSaved: "Salva una località per confrontarla",
    noRisk: "Nessuna finestra severa nel periodo selezionato",
    severe: "Finestra severa",
    updatedNever: "Mai aggiornato",
    updated: "Aggiornato",
    loadingRadar: "Caricamento radar e previsione",
    refresh: "Aggiorna",
    playRadar: "Riproduci",
    pauseRadar: "Pausa",
    radarReplayLimited: (seconds) => `Riproduzione limitata a un fotogramma ogni ${seconds} s per rispettare il limite del radar.`,
    mapLayerTitle: "Livello mappa",
    legendLabel: "Legenda intensità precipitazioni",
    looking: "Cerco",
    forecast: "Carico previsione...",
    radar: "Aggiorno radar e previsione...",
    radarOutlook: "Radar + 10 ore",
    synced: "Sincronizzato",
    minimum: "Minimo",
    low: "Basso",
    moderate: "Moderato",
    high: "Alto",
    severeLabel: "Severo",
    risk: "rischio",
    riskPrefix: "Rischio",
    severity: "Gravità",
    peak: "Picco",
    opacityLabel: "Livello",
    riskHeadline: (label) => `Rischio ${label.toLowerCase()}`,
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
    settings: "Settings",
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
    barKeyRisk: "Risk",
    barKeyStorm: "Intensity",
    route: "Route",
    history: "History",
    warnings: "Official warnings",
    sidebarOpen: "Details",
    sidebarClose: "Map",
    conditions: "Conditions",
    hourly: "Hourly risk",
    compare: "Saved comparison",
    radarTitle: "Live radar and precipitation forecast",
    radarSubtitle: "Last 2 hours + next 10 hours",
    layerMap: "Map",
    layerSatellite: "Satellite",
    layerDark: "Dark",
    layerTerrain: "Terrain",
    weak: "Weak",
    strong: "Strong",
    noSaved: "Save a location to compare it",
    noRisk: "No severe window in the selected range",
    severe: "Severe window",
    updatedNever: "Never updated",
    updated: "Updated",
    loadingRadar: "Loading radar and forecast",
    refresh: "Refresh",
    playRadar: "Play",
    pauseRadar: "Pause",
    radarReplayLimited: (seconds) => `Replay limited to one frame every ${seconds}s to respect the radar limit.`,
    mapLayerTitle: "Map layer",
    legendLabel: "Precipitation intensity legend",
    looking: "Searching",
    forecast: "Loading forecast...",
    radar: "Updating radar and forecast...",
    radarOutlook: "Radar + 10 hours",
    synced: "Synced",
    minimum: "Minimal",
    low: "Low",
    moderate: "Moderate",
    high: "High",
    severeLabel: "Severe",
    risk: "risk",
    riskPrefix: "Risk",
    severity: "Severity",
    peak: "Peak",
    opacityLabel: "Layer",
    riskHeadline: (label) => `${label} risk`,
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
  riskPanel: document.querySelector("#riskPanel"),
  riskLabel: document.querySelector("#riskLabel"),
  riskUnit: document.querySelector("#riskUnit"),
  severityLabel: document.querySelector("#severityLabel"),
  peakLabel: document.querySelector("#peakLabel"),
  opacityLabel: document.querySelector("#opacityLabel"),
  riskSummary: document.querySelector("#riskSummary"),
  riskExplain: document.querySelector("#riskExplain"),
  metrics: document.querySelector("#metrics"),
  hours: document.querySelector("#hours"),
  hourRange: document.querySelector("#hourRange"),
  severeWindow: document.querySelector("#severeWindow"),
  frameLabel: document.querySelector("#frameLabel"),
  frameSlider: document.querySelector("#frameSlider"),
  playRadar: document.querySelector("#playRadar"),
  frameStart: document.querySelector("#frameStart"),
  frameMid: document.querySelector("#frameMid"),
  frameEnd: document.querySelector("#frameEnd"),
  radarState: document.querySelector("#radarState"),
  savePlace: document.querySelector("#savePlace"),
  savedPlaces: document.querySelector("#savedPlaces"),
  savedTitle: document.querySelector("#savedTitle"),
  thresholdLabel: document.querySelector("#thresholdLabel"),
  settingsBlock: document.querySelector("#settingsBlock"),
  settingsSummary: document.querySelector("#settingsSummary"),
  languageLabel: document.querySelector("#languageLabel"),
  conditionsTitle: document.querySelector("#conditionsTitle"),
  hourlyTitle: document.querySelector("#hourlyTitle"),
  barKeyRisk: document.querySelector("#barKeyRisk"),
  barKeyStorm: document.querySelector("#barKeyStorm"),
  compareTitle: document.querySelector("#compareTitle"),
  modelNote: document.querySelector("#modelNote"),
  radarTitle: document.querySelector("#radarTitle"),
  radarSubtitle: document.querySelector("#radarSubtitle"),
  layerMap: document.querySelector("#layerMap"),
  layerSatellite: document.querySelector("#layerSatellite"),
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
let visibleRadarLayer = null;
const radarLayers = new Set();
const seenRadarFrames = new Set();
let framesBuiltForLayer = null;
let radarFrames = [];
let frameIndex = 0;
let radarPlaybackTimer = null;
let autoRefreshTimer = null;
let autoRefreshDeferred = false;
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
  radarOpacity: 72,
  forecastHours: 24,
  forecastDay: 0,
  forecastOffsetHours: 0,
  autoRefresh: 0,
  detailMode: "detailed",
  settingsOpen: false,
  mapLayer: "satellite",
  ...readJson(storageKeys.prefs, {})
};
if ([40, 52, 64].includes(Number(preferences.radarOpacity))) preferences.radarOpacity = 72;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// One token bucket per host, so a burst of saved places or a fast typist can
// never outpace the provider limits. Tokens refill continuously; concurrency is
// capped separately because parallel sockets are what providers notice first.
const hostBuckets = new Map();

function hostBucket(host) {
  if (!hostBuckets.has(host)) {
    const limit = hostRequestLimits[host] || defaultRequestLimit;
    hostBuckets.set(host, { ...limit, tokens: limit.perMinute, active: 0, waiting: [], refilledAt: Date.now() });
  }
  return hostBuckets.get(host);
}

function refillBucket(bucket) {
  const now = Date.now();
  const gained = ((now - bucket.refilledAt) / 60000) * bucket.perMinute;
  if (gained >= 1) {
    bucket.tokens = Math.min(bucket.perMinute, bucket.tokens + Math.floor(gained));
    bucket.refilledAt = now;
  }
}

function acquireRequestSlot(host) {
  const bucket = hostBucket(host);
  return new Promise((resolve) => {
    const attempt = () => {
      refillBucket(bucket);
      if (bucket.tokens >= 1 && bucket.active < bucket.concurrency) {
        bucket.tokens -= 1;
        bucket.active += 1;
        resolve(() => {
          bucket.active -= 1;
          bucket.waiting.shift()?.();
        });
        return;
      }
      // Out of tokens is a timing problem, a busy socket pool is a queue problem.
      if (bucket.tokens < 1) setTimeout(attempt, Math.ceil(60000 / bucket.perMinute));
      else bucket.waiting.push(attempt);
    };
    attempt();
  });
}

function retryDelayMs(response, attempt) {
  const retryAfter = Number(response?.headers?.get?.("Retry-After"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, requestMaxBackoffMs);
  return Math.min(requestBackoffMs * 2 ** attempt, requestMaxBackoffMs);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, errorMessage, signal) {
  const host = new URL(url, location.href).hostname;
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const release = await acquireRequestSlot(host);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, requestTimeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      // Throttling and provider hiccups are worth waiting out; other failures are not.
      if ((response.status === 429 || response.status >= 500) && attempt < requestRetries) {
        await wait(retryDelayMs(response, attempt));
        continue;
      }
      if (!response.ok) throw new Error(errorMessage);
      return await response.json();
    } catch (error) {
      if (signal?.aborted) throw error;
      const timedOut = error.name === "AbortError";
      if (attempt < requestRetries && (timedOut || error.name === "TypeError")) {
        await wait(retryDelayMs(null, attempt));
        continue;
      }
      throw timedOut ? new Error(errorMessage) : error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      release();
    }
  }
}

// Identical concurrent requests share one response, so the focused place and the
// saved comparison cannot fetch the same forecast twice.
const inflightRequests = new Map();

function fetchJson(url, errorMessage, { signal } = {}) {
  if (signal) return requestJson(String(url), errorMessage, signal);
  const key = String(url);
  if (!inflightRequests.has(key)) {
    inflightRequests.set(key, requestJson(key, errorMessage).finally(() => inflightRequests.delete(key)));
  }
  return inflightRequests.get(key);
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
  if (score >= 75) return "var(--risk-severe)";
  if (score >= 50) return "var(--risk-high)";
  if (score >= 25) return "var(--risk-moderate)";
  if (score >= 10) return "var(--risk-low)";
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

const hourlyRowsCache = new WeakMap();

function getHourlyRows(forecast) {
  if (!forecast) return [];
  const cached = hourlyRowsCache.get(forecast);
  if (cached && cached.language === preferences.language) return cached.rows;
  const rows = buildHourlyRows(forecast);
  hourlyRowsCache.set(forecast, { language: preferences.language, rows });
  return rows;
}

function buildHourlyRows(forecast) {
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

function formatAxisHour(time, timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hourCycle: "h23",
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
  const visibleRows = rows.length ? selectedRows(rows) : [];
  if (!visibleRows.length) return `${selectedForecastHours()}h`;
  const first = visibleRows[0].time;
  const last = visibleRows[visibleRows.length - 1].time;
  const dayOf = (time) =>
    new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: timezone }).format(new Date(time));
  // A window that crosses midnight reads as a backwards range without the day.
  const end = dayOf(first) === dayOf(last)
    ? formatHour(last, timezone)
    : formatTimelineLabel(last, timezone, rows[0].time);
  return `${formatHour(first, timezone)} -> ${end}`;
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
  if (!visibleRows.length) {
    els.placeName.textContent = placeLabel(place);
    return false;
  }
  const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0]);
  const score = max.score;
  const color = riskColor(score);
  const label = riskLabel(score);
  const topReasons = max.reasons.slice(0, 4);
  const rainTotal = `${totalPrecipitation(rows).toFixed(1)} mm`;
  const trend = riskTrend(rows);

  els.placeName.textContent = placeLabel(place);
  els.riskTime.textContent = `${formatDateTime(max.time, forecast.timezone)}`;
  els.riskScore.textContent = String(score);
  els.riskLabel.textContent = t("riskHeadline")(label);
  els.riskSummary.textContent = `${weatherText(max.weather_code)}. ${Math.round(
    max.precipitation_probability || 0
  )}% ${preferences.language === "it" ? "probabilità pioggia" : "rain probability"}. CAPE ${Math.round(max.cape || 0)} J/kg.`;
  // Set on the card so the ring and the severity chip share one source.
  els.riskPanel.style.setProperty("--risk-color", color);
  els.scoreRing.style.setProperty("--risk-progress", String(score));
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
    [t("metrics").totalRain, rainTotal],
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
    [t("trend"), trend],
    [t("metrics").totalRain, rainTotal],
    [t("history"), historyDelta(place, score)],
    [t("metrics").windDirection, windDirectionLabel(max.wind_direction_10m)]
  ]
    .map(([labelText, value]) => `<div class="insightItem"><span>${labelText}</span><strong>${value}</strong></div>`)
    .join("");

  els.warningLink.href = warningUrl(place);
  els.warningLink.textContent = t("warnings");
  els.sheetPlace.textContent = place.name;
  els.sheetRiskLabel.textContent = t("riskHeadline")(label);
  els.sheetScore.textContent = String(score);
  els.sheetScore.style.color = color;
  els.sheetPeak.textContent = `${t("peak")}: ${formatDateTime(max.time, forecast.timezone)}`;
  els.sheetSevere.textContent = severeWindow || t("noRisk");
  els.sheetTrend.textContent = `${t("trend")}: ${trend}`;

  renderHourlyChart(visibleRows, rows[0].time, forecast.timezone);

  return true;
}

function renderHourlyChart(visibleRows, firstTime, timezone) {
  const chart = els.hours.parentElement;
  hideChartTip();
  chart.style.setProperty("--threshold", String(Number(preferences.riskThreshold)));
  // Roughly eight labels regardless of window length, so 24h and 48h read the
  // same and the axis never collides with itself.
  const tickStep = Math.max(1, Math.ceil(visibleRows.length / 8));

  els.hours.innerHTML = visibleRows
    .map((row, index) => {
      const intensity = stormIntensity(row);
      const tick = index % tickStep === 0
        ? `<span class="hourTick">${formatAxisHour(row.time, timezone)}</span>`
        : "";
      return `<div class="hourCol" style="--risk:${row.score};--storm:${intensity};--c:${riskColor(row.score)}"
        data-when="${escapeHtml(formatTimelineLabel(row.time, timezone, firstTime))}"
        data-score="${row.score}"
        data-level="${escapeHtml(riskLabel(row.score))}"
        data-storm="${intensity}"
        data-cape="${Math.round(Number(row.cape || 0))}"
        data-rain="${Math.round(Number(row.precipitation_probability || 0))}">
        <span class="hourStorm"></span>
        <span class="hourRisk"></span>
        ${tick}
      </div>`;
    })
    .join("");
}

// An hourly chart people cannot interrogate is a picture. The tooltip is what
// makes it readable: every column can be inspected without leaving the view.
let chartTip = null;

function ensureChartTip() {
  if (chartTip?.isConnected) return chartTip;
  chartTip = document.createElement("div");
  chartTip.className = "chartTip";
  chartTip.hidden = true;
  els.hours.parentElement.appendChild(chartTip);
  return chartTip;
}

function hideChartTip() {
  if (chartTip) chartTip.hidden = true;
}

function showChartTip(column) {
  const tip = ensureChartTip();
  const plot = els.hours.parentElement;
  const score = Number(column.dataset.score);
  const metrics = t("metrics");
  tip.style.setProperty("--c", column.style.getPropertyValue("--c"));
  tip.innerHTML = `
    <b>${escapeHtml(column.dataset.when)}</b>
    <span class="tipRow"><span class="tipSeverity">${escapeHtml(column.dataset.level)}</span><strong>${score}</strong></span>
    <span class="tipRow">${metrics.rain}<strong>${column.dataset.rain}%</strong></span>
    <span class="tipRow">${metrics.cape}<strong>${column.dataset.cape} J/kg</strong></span>
    <span class="tipRow">${t("barKeyStorm")}<strong>${column.dataset.storm}</strong></span>`;
  tip.hidden = false;
  // Clamped so a column at either edge does not push the tooltip out of the panel.
  const half = tip.offsetWidth / 2;
  const centre = column.offsetLeft + column.offsetWidth / 2;
  tip.style.left = `${Math.max(half, Math.min(plot.clientWidth - half, centre))}px`;
  tip.style.top = `${plot.clientHeight * (1 - Math.min(100, Math.max(0, score)) / 100)}px`;
}

// Typing "Milano" would otherwise cost a lookup per debounce, then cost them
// again the moment the user backspaces.
const geocodeCache = new Map();

function readGeocodeCache(key) {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > geocodeCacheTtlMs) {
    geocodeCache.delete(key);
    return null;
  }
  return entry.results;
}

function writeGeocodeCache(key, results) {
  geocodeCache.set(key, { at: Date.now(), results });
  while (geocodeCache.size > geocodeCacheMaxEntries) geocodeCache.delete(geocodeCache.keys().next().value);
}

async function searchCities(name, count = 5, { signal } = {}) {
  const query = name.trim();
  const cacheKeyValue = `${preferences.language}:${count}:${query.toLowerCase()}`;
  const cached = readGeocodeCache(cacheKeyValue);
  if (cached) return cached;

  const url = new URL(geocodeUrl);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", preferences.language);
  url.searchParams.set("format", "json");

  const data = await fetchJson(
    url,
    preferences.language === "it" ? "Ricerca non disponibile. Riprova." : "Search unavailable. Try again.",
    { signal }
  );
  const results = data.results || [];
  writeGeocodeCache(cacheKeyValue, results);
  return results;
}

async function searchCity(name) {
  const results = await searchCities(name, 1);
  if (!results.length) throw new Error(preferences.language === "it" ? "Località non trovata. Controlla il nome e riprova." : "Location not found. Check the name and try again.");
  return results[0];
}

function cacheKey(place) {
  return `${placeKey(place)}:forecast-168h-v3`;
}

// Parsing the stored cache is expensive (a week of hourly data per place), so
// entries are kept in memory once read and only re-serialized on a fresh fetch.
const forecastMemory = new Map();

function readForecastCache() {
  const cache = readJson(storageKeys.forecastCache, {});
  const cutoff = Date.now() - forecastCacheMaxAgeMs;
  return Object.fromEntries(
    Object.entries(cache)
      .filter(([, entry]) => Number(entry?.at) > cutoff && entry?.forecast?.hourly?.time?.length)
      .sort(([, a], [, b]) => Number(b.at) - Number(a.at))
      .slice(0, forecastCacheMaxEntries)
  );
}

function cachedForecastEntry(place) {
  const key = cacheKey(place);
  if (!forecastMemory.has(key)) forecastMemory.set(key, readForecastCache()[key] || null);
  const entry = forecastMemory.get(key);
  return Date.now() - Number(entry?.at) < forecastCacheMaxAgeMs ? entry : null;
}

function cacheForecast(place, forecast) {
  const key = cacheKey(place);
  const entry = { at: Date.now(), forecast };
  forecastMemory.set(key, entry);
  const cache = readForecastCache();
  cache[key] = entry;
  if (!writeJson(storageKeys.forecastCache, cache)) writeJson(storageKeys.forecastCache, { [key]: entry });
}

async function getForecast(place, { force = false, freshMs = forecastFreshMs } = {}) {
  const cached = cachedForecastEntry(place);
  if (!force && cached && Date.now() - Number(cached.at) < freshMs) return cached.forecast;

  const url = new URL(forecastUrl);
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set("hourly", forecastHourlyFields);
  url.searchParams.set("forecast_hours", "168");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("timezone", "auto");

  try {
    const forecast = await fetchJson(url, t("forecastError"));
    if (!forecast.hourly?.time?.length) throw new Error(t("forecastError"));
    forecast.hourly.time = forecast.hourly.time.map((time) => typeof time === "number" ? time * 1000 : time);
    cacheForecast(place, forecast);
    return forecast;
  } catch (error) {
    if (cached?.forecast) {
      setStatus(preferences.language === "it" ? "Uso ultima previsione salvata" : "Using last saved forecast");
      return cached.forecast;
    }
    throw error;
  }
}

// Open-Meteo accepts comma-separated coordinates and answers with one array
// entry per location, in input order. The saved list therefore costs a single
// request no matter how long it is, and nothing at all when every place is
// still warm in the cache.
async function getForecastBatch(places, { freshMs = comparisonFreshMs } = {}) {
  const forecasts = new Map();
  const misses = [];
  places.forEach((place) => {
    const cached = cachedForecastEntry(place);
    if (cached && Date.now() - Number(cached.at) < freshMs) forecasts.set(placeKey(place), cached.forecast);
    else misses.push(place);
  });
  if (!misses.length) return forecasts;
  // A single coordinate comes back as an object rather than an array, so the
  // one-place case reuses the path that already handles that shape.
  if (misses.length === 1) {
    try {
      forecasts.set(placeKey(misses[0]), await getForecast(misses[0], { freshMs }));
    } catch {
      /* Left out of the map, which the caller reports as a failed row. */
    }
    return forecasts;
  }

  const url = new URL(forecastUrl);
  url.searchParams.set("latitude", misses.map((place) => place.latitude).join(","));
  url.searchParams.set("longitude", misses.map((place) => place.longitude).join(","));
  url.searchParams.set("hourly", forecastHourlyFields);
  url.searchParams.set("forecast_hours", "168");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("timezone", "auto");

  try {
    const payload = await fetchJson(url, t("forecastError"));
    const entries = Array.isArray(payload) ? payload : [payload];
    misses.forEach((place, index) => {
      const forecast = entries[index];
      if (!forecast?.hourly?.time?.length) return;
      forecast.hourly.time = forecast.hourly.time.map((time) => (typeof time === "number" ? time * 1000 : time));
      cacheForecast(place, forecast);
      forecasts.set(placeKey(place), forecast);
    });
  } catch {
    // One failed batch should not blank a list that still has usable history.
    misses.forEach((place) => {
      const cached = cachedForecastEntry(place);
      if (cached?.forecast) forecasts.set(placeKey(place), cached.forecast);
    });
  }
  return forecasts;
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
    weatherMapAdapter = window.OMWeatherMapLayer?.addLeafletProtocolSupport(L);
    if (weatherMapAdapter) {
      const protocolSettings = {
        ...window.OMWeatherMapLayer.defaultOmProtocolSettings,
        colorScales: {
          ...window.OMWeatherMapLayer.defaultOmProtocolSettings.colorScales,
          precipitation: precipitationColorScale,
          cloud_cover: cloudCoverColorScale
        }
      };
      weatherMapAdapter.addProtocol("om", window.OMWeatherMapLayer.omProtocol, protocolSettings);
      map.createPane("weatherPane");
      map.getPane("weatherPane").classList.add("weatherPane");
      map.on("moveend", updateWeatherMapBounds);
      map.on("moveend", queueRadarPrefetch);
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

let radarPrefetchTimer = null;
let radarPrefetchWanted = false;

// Debounced, because loading a place settles the map over several moveend
// events and each one would otherwise start its own pass.
function queueRadarPrefetch() {
  if (!radarPrefetchWanted) return;
  clearTimeout(radarPrefetchTimer);
  radarPrefetchTimer = setTimeout(prefetchRadarFrames, 600);
}

function requestRadarPrefetch() {
  radarPrefetchWanted = true;
  queueRadarPrefetch();
}

function createRadarLayer(frame) {
  if (frame.source === "forecast") {
    if (!weatherMapAdapter) throw new Error(preferences.language === "it" ? "Livello previsionale non disponibile." : "Forecast layer unavailable.");
    const cloudLayer = weatherMapAdapter.createTileLayer(frame.cloudUrl, {
      opacity: 0,
      maxZoom: 12,
      pane: "weatherPane",
      attribution: "Forecast &copy; Open-Meteo, DWD"
    });
    const precipitationLayer = weatherMapAdapter.createTileLayer(frame.url, {
      opacity: 0,
      maxZoom: 12,
      pane: "weatherPane",
      attribution: "Forecast &copy; Open-Meteo, DWD"
    });
    const forecastLayer = L.layerGroup([cloudLayer, precipitationLayer]);
    forecastLayer.setOpacity = (opacity) => {
      cloudLayer.setOpacity(opacity * 0.72);
      precipitationLayer.setOpacity(opacity);
      return forecastLayer;
    };
    precipitationLayer.once("load", () => forecastLayer.fire("load"));
    return forecastLayer;
  }
  return L.tileLayer(frame.url, {
    opacity: 0,
    maxZoom: 16,
    maxNativeZoom: radarMaxNativeZoom,
    attribution: 'Radar &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
  });
}

// Switching the base map only changes tile URLs, so the metadata behind the
// frame list is reused. RainViewer publishes a new set roughly every 10 minutes.
let radarMetadataCache = null;

async function loadRadarMetadata(force) {
  if (!force && radarMetadataCache && Date.now() - radarMetadataCache.at < radarMetadataTtlMs) {
    return radarMetadataCache;
  }
  const [metadata, forecastMetadata] = await Promise.all([
    fetchJson(radarMetadataUrl, preferences.language === "it" ? "Radar live non disponibile." : "Live radar unavailable."),
    fetchJson(
      precipitationForecastUrl,
      preferences.language === "it" ? "Previsione precipitazioni non disponibile." : "Precipitation forecast unavailable."
    )
  ]);
  radarMetadataCache = { at: Date.now(), metadata, forecastMetadata };
  return radarMetadataCache;
}

async function loadRadar({ force = false } = {}) {
  const generation = ++radarLoadGeneration;
  stopRadarPlayback();
  els.radarState.textContent = t("loadingRadar");
  const { metadata, forecastMetadata } = await loadRadarMetadata(force);
  if (generation !== radarLoadGeneration) return;

  const pastFrames = metadata.radar?.past || [];
  const nowcastFrames = metadata.radar?.nowcast || [];
  const radarMetadataFrames = [...pastFrames, ...nowcastFrames];
  if (!metadata.host || !pastFrames.length) throw new Error(preferences.language === "it" ? "Nessun fotogramma radar disponibile." : "No radar frames available.");

  const latestObservedTime = Number(pastFrames.at(-1).time);
  const liveFrames = radarMetadataFrames.map((frame, index) => ({
    time: Number(frame.time),
    isObserved: index < pastFrames.length,
    source: "radar",
    url: `${metadata.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
  }));
  const forecastFrames = (forecastMetadata.valid_times || [])
    .map((time, index) => ({ time: Date.parse(time) / 1000, index }))
    .filter((frame) => frame.time > latestObservedTime && frame.time <= latestObservedTime + 10 * 60 * 60)
    .map((frame) => ({
      ...frame,
      isObserved: false,
      source: "forecast",
      url: `om://${precipitationForecastUrl}?time_step=valid_times_${frame.index}&variable=precipitation&dark=${preferences.mapLayer === "dark"}`,
      cloudUrl: `om://${precipitationForecastUrl}?time_step=valid_times_${frame.index}&variable=cloud_cover&dark=${preferences.mapLayer === "dark"}`
    }));
  if (!forecastFrames.length) throw new Error(preferences.language === "it" ? "Previsione delle prossime 10 ore non disponibile." : "Next ten-hour forecast unavailable.");

  const nextFrames = [...liveFrames, ...forecastFrames].sort((a, b) => a.time - b.time || (a.source === "radar" ? -1 : 1));
  // Forecast tile URLs carry the dark flag, so a base map switch invalidates
  // those cached tiles. Otherwise only drop frames that rolled off the timeline.
  if (framesBuiltForLayer !== preferences.mapLayer) {
    seenRadarFrames.clear();
    framesBuiltForLayer = preferences.mapLayer;
  } else {
    const frameTimes = new Set(nextFrames.map((frame) => frame.time));
    seenRadarFrames.forEach((time) => {
      if (!frameTimes.has(time)) seenRadarFrames.delete(time);
    });
  }
  radarFrames = nextFrames;
  els.radarState.textContent = t("radarOutlook");
  lastUpdatedAt = new Date(Number(metadata.generated || Date.now() / 1000) * 1000);
  updateLastUpdated();
  frameIndex = radarFrames.reduce((latestIndex, frame, index) => frame.isObserved ? index : latestIndex, 0);
  els.frameSlider.min = "0";
  els.frameSlider.max = String(Math.max(0, radarFrames.length - 1));
  els.frameSlider.disabled = radarFrames.length <= 1;
  els.playRadar.disabled = radarFrames.length <= 1;
  updateRadarTimeScale();
  showRadarFrame(frameIndex);
  queueRadarPrefetch();
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
  if (frame.source === "forecast") {
    const firstForecastFrame = radarFrames.find((item) => item.source === "forecast");
    const forecastHour = Math.round((frame.time - firstForecastFrame.time) / 3600) + 1;
    return `+${forecastHour}h · ${time}`;
  }
  const latestPastFrame = radarFrames.filter((item) => item.isObserved).at(-1) || radarFrames.at(-1);
  const minutes = Math.round((frame.time - latestPastFrame.time) / 60);
  const offset = minutes === 0
    ? preferences.language === "it" ? "Ora" : "Now"
    : minutes % 60 === 0 ? `${minutes > 0 ? "+" : "-"}${Math.abs(minutes / 60)}h` : `${minutes > 0 ? "+" : "-"}${Math.abs(minutes)} min`;
  return `${offset} · ${time}`;
}

function updateRadarTimeScale() {
  if (!radarFrames.length) return;
  const last = radarFrames.length - 1;
  els.frameStart.textContent = formatRadarFrameLabel(radarFrames[0]).split(" · ")[0];
  els.frameMid.textContent = formatRadarFrameLabel(radarFrames[Math.round(last / 2)]).split(" · ")[0];
  els.frameEnd.textContent = formatRadarFrameLabel(radarFrames[last]).split(" · ")[0];
}

function stopRadarPlayback() {
  if (radarPlaybackTimer) {
    clearTimeout(radarPlaybackTimer);
    radarPlaybackTimer = null;
  }
  els.playRadar?.setAttribute("aria-pressed", "false");
  if (els.playRadar) els.playRadar.textContent = t("playRadar");
}

function rainViewerFrameTileCount() {
  const loadedTiles = radarLayer?.getContainer?.()?.querySelectorAll("img").length;
  if (loadedTiles) return loadedTiles;
  const size = map?.getSize();
  if (!size) return 25;
  return (Math.ceil(size.x / 256) + 1) * (Math.ceil(size.y / 256) + 1);
}

// Only the observed radar frames cost tile requests; the forecast frames are
// drawn by the weather layer from data it already holds. So the question that
// sets playback speed is whether every radar frame is warm.
function radarFramesAreWarm() {
  const liveFrames = radarFrames.filter((frame) => frame.source === "radar");
  return liveFrames.length > 0 && liveFrames.every((frame) => seenRadarFrames.has(frame.time));
}

// Once a frame's tiles are in the HTTP cache, replaying it costs no requests
// and can run at a watchable speed. Until then playback is paced to a rate the
// radar host is happy with.
function radarPlaybackDelay() {
  if (radarFramesAreWarm()) return radarCachedPlaybackMs;
  const budgeted = Math.ceil((rainViewerFrameTileCount() * 60 * 1000) / rainViewerPlaybackBudget);
  return Math.max(radarWarmPlaybackFloorMs, budgeted);
}

// The tiles the radar layer would request for what is currently on screen.
// RainViewer serves radar up to zoom 7, so anything closer reuses those tiles.
function visibleRadarTiles() {
  if (!map) return [];
  const zoom = Math.min(map.getZoom(), radarMaxNativeZoom);
  const bounds = map.getBounds();
  const topLeft = map.project(bounds.getNorthWest(), zoom).divideBy(256).floor();
  const bottomRight = map.project(bounds.getSouthEast(), zoom).divideBy(256).floor();
  const span = 2 ** zoom;
  const tiles = [];
  for (let x = topLeft.x; x <= bottomRight.x; x += 1) {
    for (let y = topLeft.y; y <= bottomRight.y; y += 1) {
      if (y < 0 || y >= span) continue;
      tiles.push({ z: zoom, x: ((x % span) + span) % span, y });
      if (tiles.length >= radarPrefetchTileCap) return tiles;
    }
  }
  return tiles;
}

function radarTileUrl(frame, tile) {
  return frame.url
    .replace("{z}", String(tile.z))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));
}

function warmTile(url) {
  return new Promise((resolve) => {
    const image = new Image();
    // Resolving on failure too: a missing tile must not stall the queue.
    image.onload = resolve;
    image.onerror = resolve;
    image.src = url;
  });
}

// A warm set belongs to one viewport. Panning invalidates it, so the signature
// below is what tells the prefetcher its work no longer applies.
let radarWarmKey = null;
let radarPrefetchToken = 0;

async function prefetchRadarFrames() {
  if (!map || !radarFrames.length) return;
  // Honour a metered connection: this is an optimisation, not a requirement.
  if (navigator.connection?.saveData) return;

  const tiles = visibleRadarTiles();
  if (!tiles.length) return;
  const warmKey = `${tiles[0].z}:${tiles[0].x},${tiles[0].y}:${tiles.length}`;
  if (warmKey !== radarWarmKey) {
    radarWarmKey = warmKey;
    seenRadarFrames.clear();
  }

  const token = ++radarPrefetchToken;
  for (const frame of radarFrames) {
    if (token !== radarPrefetchToken) return;
    if (frame.source !== "radar" || seenRadarFrames.has(frame.time)) continue;
    await Promise.all(tiles.map((tile) => warmTile(radarTileUrl(frame, tile))));
    if (token !== radarPrefetchToken) return;
    seenRadarFrames.add(frame.time);
    // One frame at a time, with a breath between them, so warming the timeline
    // never competes with the tiles the visible frame still needs.
    await wait(radarPrefetchGapMs);
  }
}

function scheduleRadarStep() {
  const playbackDelay = radarPlaybackDelay();
  els.playRadar.title = playbackDelay > radarCachedPlaybackMs
    ? t("radarReplayLimited")(Math.ceil(playbackDelay / 1000))
    : t("pauseRadar");
  radarPlaybackTimer = setTimeout(() => {
    const nextIndex = frameIndex >= radarFrames.length - 1 ? 0 : frameIndex + 1;
    showRadarFrame(nextIndex);
    // showRadarFrame stops playback at the end of the timeline.
    if (radarPlaybackTimer) scheduleRadarStep();
  }, playbackDelay);
}

function toggleRadarPlayback() {
  if (radarFrames.length <= 1) return;
  if (radarPlaybackTimer) {
    stopRadarPlayback();
    return;
  }
  els.playRadar.setAttribute("aria-pressed", "true");
  els.playRadar.textContent = t("pauseRadar");
  // Warming runs alongside the first pass, so playback speeds up as it catches up.
  requestRadarPrefetch();
  scheduleRadarStep();
}

function discardRadarLayer(layer) {
  if (!layer) return;
  if (map?.hasLayer(layer)) map.removeLayer(layer);
  radarLayers.delete(layer);
  if (visibleRadarLayer === layer) visibleRadarLayer = null;
}

function showRadarFrame(index) {
  if (!map || !radarFrames.length) return;
  frameIndex = clampFrameIndex(index);
  const frame = radarFrames[frameIndex];

  let nextLayer;
  try {
    nextLayer = createRadarLayer(frame);
  } catch (error) {
    stopRadarPlayback();
    els.radarState.textContent = t("radarError");
    els.frameLabel.textContent = error.message;
    return;
  }

  radarLayer = nextLayer;
  radarLayers.add(nextLayer);
  nextLayer.addTo(map);
  // Keep at most the on-screen frame plus the one being requested, so fast
  // scrubbing cannot pile up invisible layers on the map.
  radarLayers.forEach((layer) => {
    if (layer !== nextLayer && layer !== visibleRadarLayer) discardRadarLayer(layer);
  });

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    clearTimeout(revealTimer);
    if (nextLayer !== radarLayer) {
      discardRadarLayer(nextLayer);
      return;
    }
    nextLayer.setOpacity(Number(preferences.radarOpacity) / 100);
    visibleRadarLayer = nextLayer;
    seenRadarFrames.add(frame.time);
    radarLayers.forEach((layer) => {
      if (layer !== nextLayer) discardRadarLayer(layer);
    });
  };
  // A frame whose tiles never all resolve would otherwise stay invisible forever.
  const revealTimer = setTimeout(reveal, radarFrameRevealMs);
  nextLayer.once("load", reveal);

  els.frameLabel.textContent = formatRadarFrameLabel(frame);
  els.frameSlider.value = String(frameIndex);
  els.frameSlider.style.setProperty("--frame-progress", `${radarFrames.length > 1 ? (frameIndex / (radarFrames.length - 1)) * 100 : 0}%`);
  els.frameLabel.classList.remove("is-changing");
  requestAnimationFrame(() => els.frameLabel.classList.add("is-changing"));
  if (frameIndex === radarFrames.length - 1) stopRadarPlayback();
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

function runAutoRefresh() {
  if (currentPlace) loadPlace(currentPlace, { force: true });
  else refreshSavedComparison();
}

// A tab left open in the background used to keep polling every 10 minutes for
// data nobody was looking at. Refresh is deferred until the tab is seen again.
function configureAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
  const minutes = Number(preferences.autoRefresh || 0);
  if (minutes > 0) {
    autoRefreshTimer = setInterval(() => {
      if (document.hidden || navigator.onLine === false) {
        autoRefreshDeferred = true;
        return;
      }
      runAutoRefresh();
    }, minutes * 60 * 1000);
  }
}

function setMobileSidebar(open) {
  document.querySelector(".shell").classList.toggle("is-sidebar-open", open);
  els.mobileSidebarToggle.setAttribute("aria-expanded", String(open));
  els.mobileSidebarToggle.textContent = open ? t("sidebarClose") : t("sidebarOpen");
}

function renderStaticText() {
  document.documentElement.lang = preferences.language === "en" ? "en" : "it";
  document.querySelector("button[type='submit']").textContent = t("search");
  els.locationLabel.textContent = t("location");
  els.savePlace.textContent = isCurrentSaved() ? t("remove") : t("save");
  els.savedTitle.textContent = t("saved");
  els.thresholdLabel.textContent = t("threshold");
  els.settingsSummary.textContent = t("settings");
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
  els.severityLabel.textContent = t("severity");
  els.peakLabel.textContent = t("peak");
  els.riskUnit.textContent = t("risk");
  els.opacityLabel.textContent = t("opacityLabel");
  els.hourlyTitle.textContent = t("hourly");
  els.barKeyRisk.textContent = t("barKeyRisk");
  els.barKeyStorm.textContent = t("barKeyStorm");
  els.compareTitle.textContent = t("compare");
  els.modelNote.textContent = t("note");
  els.radarTitle.textContent = t("radarTitle");
  els.radarSubtitle.textContent = t("radarSubtitle");
  els.layerMap.textContent = t("layerMap");
  els.layerSatellite.textContent = t("layerSatellite");
  els.layerDark.textContent = t("layerDark");
  els.layerTerrain.textContent = t("layerTerrain");
  els.legendWeak.textContent = t("weak");
  els.legendStrong.textContent = t("strong");
  els.refreshForecast.textContent = t("refresh");
  els.playRadar.textContent = radarPlaybackTimer ? t("pauseRadar") : t("playRadar");
  els.retryForecast.textContent = t("retry");
  els.retryComparison.textContent = t("retry");
  els.mobileSidebarToggle.textContent = document.querySelector(".shell").classList.contains("is-sidebar-open") ? t("sidebarClose") : t("sidebarOpen");
  els.mapLayer.setAttribute("title", t("mapLayerTitle"));
  document.querySelector(".radarLegend").setAttribute("aria-label", t("legendLabel"));
  if (!radarFrames.length) {
    els.frameLabel.textContent = t("loadingRadar");
  } else {
    updateRadarTimeScale();
    els.frameLabel.textContent = formatRadarFrameLabel(radarFrames[frameIndex]);
    els.radarState.textContent = t("radarOutlook");
  }
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

  // Background list entries tolerate older data than the focused place.
  const forecasts = await getForecastBatch(savedPlaces);
  if (generation !== comparisonGeneration) return;

  let failures = 0;
  const updated = savedPlaces.map((place) => {
    const forecast = forecasts.get(placeKey(place));
    const visibleRows = forecast ? selectedRows(getHourlyRows(forecast)) : [];
    if (!visibleRows.length) {
      failures += 1;
      return { ...place, lastScore: null };
    }
    const max = visibleRows.reduce((best, row) => (row.score > best.score ? row : best), visibleRows[0]);
    maybeNotify(place, max);
    return { ...place, lastScore: max.score, lastTime: max.time, lastTimezone: forecast.timezone };
  });
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

  const key = `${placeKey(place)}:${max.time}:${preferences.riskThreshold}`;
  const cutoff = Date.now() - notifiedMaxAgeMs;
  const notified = Object.fromEntries(
    Object.entries(readJson(storageKeys.notified, {})).filter(([, at]) => Number(at) > cutoff)
  );
  if (notified[key]) return;
  notified[key] = Date.now();
  writeJson(storageKeys.notified, notified);
  new Notification(t("alertTitle"), {
    body: t("alertBody")(placeLabel(place), max.score)
  });
}

async function loadPlace(place, { force = false } = {}) {
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
    const forecast = await getForecast(place, { force });
    if (generation !== loadGeneration) return;
    currentForecast = forecast;
    forecastRendered = renderRisk(place, currentForecast);
    setForecastState(forecastRendered ? "ready" : "error");
    const rows = selectedRows(getHourlyRows(currentForecast));
    const max = rows.length ? rows.reduce((best, row) => (row.score > best.score ? row : best), rows[0]) : null;
    if (max) {
      rememberHistory(place, max.score);
      maybeNotify(place, max);
    }
    lastUpdatedAt = new Date();
    updateLastUpdated();
    writeJson(storageKeys.lastPlace, place);

    setStatus(t("radar"));
    await loadRadar({ force });
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

function refreshRiskView() {
  if (!currentPlace || !currentForecast) return;
  setForecastState(renderRisk(currentPlace, currentForecast) ? "ready" : "error");
}

function rerenderCurrent() {
  renderStaticText();
  renderSavedPlaces();
  if (currentPlace && marker) marker.setIcon(cityMarkerIcon(currentPlace));
  refreshRiskView();
  refreshSavedComparison();
  // The status line holds a message built in the previous language.
  if (currentPlace && currentForecast) setStatus(`${t("synced")} ${currentPlace.name}`);
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
    `${t("peak")}: ${formatDateTime(max.time, currentForecast.timezone)}`,
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
let suggestionController = null;
function queueSuggestions() {
  clearTimeout(suggestionTimer);
  // Cancel the superseded lookup instead of paying for a response nobody reads.
  suggestionController?.abort();
  const generation = ++suggestionGeneration;
  const query = els.cityInput.value.trim();
  if (query.length < 3) {
    els.suggestions.innerHTML = "";
    return;
  }
  suggestionTimer = setTimeout(async () => {
    const controller = new AbortController();
    suggestionController = controller;
    try {
      const suggestions = await searchCities(query, 5, { signal: controller.signal });
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
    } finally {
      if (suggestionController === controller) suggestionController = null;
    }
  }, suggestionDebounceMs);
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

els.hours.addEventListener("pointerover", (event) => {
  const column = event.target.closest(".hourCol");
  if (column) showChartTip(column);
});
els.hours.parentElement.addEventListener("pointerleave", hideChartTip);

els.savePlace.addEventListener("click", saveCurrentPlace);
els.useLocation.addEventListener("click", loadCurrentLocation);
els.retryForecast.addEventListener("click", () => {
  if (currentPlace) loadPlace(currentPlace, { force: true });
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
els.playRadar.addEventListener("click", toggleRadarPlayback);
els.frameSlider.addEventListener("input", () => {
  stopRadarPlayback();
  requestRadarPrefetch();
  showRadarFrame(Number(els.frameSlider.value));
});
els.refreshForecast.addEventListener("click", () => {
  if (currentPlace) loadPlace(currentPlace, { force: true });
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
  refreshRiskView();
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
els.settingsBlock.addEventListener("toggle", () => {
  preferences.settingsOpen = els.settingsBlock.open;
  persistPreferences();
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
document.addEventListener("visibilitychange", () => {
  if (document.hidden || !autoRefreshDeferred || navigator.onLine === false) return;
  autoRefreshDeferred = false;
  runAutoRefresh();
});
window.addEventListener("online", () => {
  if (!autoRefreshDeferred) return;
  autoRefreshDeferred = false;
  runAutoRefresh();
});
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "r") {
    event.preventDefault();
    if (currentPlace) loadPlace(currentPlace, { force: true });
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
els.settingsBlock.open = Boolean(preferences.settingsOpen);
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
