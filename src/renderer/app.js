const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";
const forecastUrl = "https://api.open-meteo.com/v1/forecast";
const rainViewerUrl = "https://api.rainviewer.com/public/weather-maps.json";
const radarMaxNativeZoom = 7;
const mapStartZoom = 7;

const els = {
  form: document.querySelector("#searchForm"),
  cityInput: document.querySelector("#cityInput"),
  status: document.querySelector("#statusLine"),
  placeName: document.querySelector("#placeName"),
  riskTime: document.querySelector("#riskTime"),
  scoreRing: document.querySelector("#scoreRing"),
  riskScore: document.querySelector("#riskScore"),
  riskLabel: document.querySelector("#riskLabel"),
  riskSummary: document.querySelector("#riskSummary"),
  metrics: document.querySelector("#metrics"),
  hours: document.querySelector("#hours"),
  hourRange: document.querySelector("#hourRange"),
  prevFrame: document.querySelector("#prevFrame"),
  playRadar: document.querySelector("#playRadar"),
  nextFrame: document.querySelector("#nextFrame"),
  frameLabel: document.querySelector("#frameLabel"),
  radarState: document.querySelector("#radarState")
};

let map;
let marker;
let baseLayer;
let radarLayer;
let previousRadarLayer;
let radarFrames = [];
let frameIndex = 0;
let radarTimer = null;

function cityMarkerIcon(place) {
  const label = `${place.name}, ${place.country}`;
  return L.divIcon({
    className: "cityMarker",
    html: `
      <span class="cityMarkerPin"></span>
      <span class="cityMarkerLabel">${label}</span>
    `,
    iconSize: [190, 44],
    iconAnchor: [18, 22]
  });
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
  if (score >= 75) return "Severo";
  if (score >= 50) return "Alto";
  if (score >= 25) return "Moderato";
  if (score >= 10) return "Basso";
  return "Minimo";
}

function weatherText(code) {
  const labels = {
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
  };
  return labels[code] || "Meteo variabile";
}

function scoreHour(hour) {
  const code = Number(hour.weather_code || 0);
  const cape = Number(hour.cape || 0);
  const precipProb = Number(hour.precipitation_probability || 0);
  const precip = Number(hour.precipitation || 0);
  const showers = Number(hour.showers || 0);
  const gusts = Number(hour.wind_gusts_10m || 0);
  const freezing = Number(hour.freezing_level_height || 0);
  let score = 0;

  if (code === 99) score += 50;
  else if (code === 96) score += 42;
  else if (code === 95) score += 30;
  else if ([80, 81, 82].includes(code)) score += 12;

  if (cape >= 2500) score += 36;
  else if (cape >= 1500) score += 28;
  else if (cape >= 800) score += 18;
  else if (cape >= 300) score += 8;

  score += Math.min(18, precipProb * 0.18);
  score += Math.min(16, precip * 7);
  score += Math.min(18, showers * 11);

  if (gusts >= 80) score += 10;
  else if (gusts >= 60) score += 7;
  else if (gusts >= 45) score += 4;

  if (freezing >= 1800 && freezing <= 4200 && score > 18) score += 8;
  if (freezing > 5200) score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHourlyRows(forecast) {
  const hourly = forecast.hourly || {};
  return (hourly.time || []).map((time, index) => {
    const row = { time };
    Object.keys(hourly).forEach((key) => {
      if (key !== "time") row[key] = hourly[key][index];
    });
    row.score = scoreHour(row);
    return row;
  });
}

function formatHour(time, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(time));
}

function formatTimelineLabel(time, timezone, firstTime) {
  const date = new Date(time);
  const firstDate = new Date(firstTime);
  const day = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    timeZone: timezone
  }).format(date);
  const firstDay = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    timeZone: timezone
  }).format(firstDate);
  const prefix = day === firstDay ? "oggi" : "domani";
  return `${prefix} ${formatHour(time, timezone)}`;
}

function formatRangeLabel(rows, timezone) {
  if (!rows.length) return "24 ore";
  const first = rows[0].time;
  const last = rows[Math.min(rows.length, 24) - 1].time;
  return `${formatHour(first, timezone)} → ${formatHour(last, timezone)}`;
}

function formatDateTime(time, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(time));
}

function renderRisk(place, forecast) {
  const rows = getHourlyRows(forecast);
  const max = rows.reduce((best, row) => (row.score > best.score ? row : best), rows[0]);
  const score = max?.score || 0;
  const color = riskColor(score);
  const label = riskLabel(score);

  els.placeName.textContent = `${place.name}, ${place.country}`;
  els.riskTime.textContent = `${formatDateTime(max.time, forecast.timezone)}`;
  els.riskScore.textContent = String(score);
  els.riskLabel.textContent = `Rischio ${label.toLowerCase()}`;
  els.riskSummary.textContent = `${weatherText(max.weather_code)}. ${Math.round(
    max.precipitation_probability || 0
  )}% probabilità pioggia. CAPE ${Math.round(max.cape || 0)} J/kg.`;
  els.scoreRing.style.borderColor = color;
  els.scoreRing.style.setProperty("--risk-color", color);
  els.hourRange.textContent = formatRangeLabel(rows, forecast.timezone);

  els.metrics.innerHTML = [
    ["Segnale temporale", weatherText(max.weather_code)],
    ["CAPE", `${Math.round(max.cape || 0)} J/kg`],
    ["Probabilità pioggia", `${Math.round(max.precipitation_probability || 0)}%`],
    ["Raffiche", `${Math.round(max.wind_gusts_10m || 0)} km/h`],
    ["Rovesci", `${Number(max.showers || 0).toFixed(1)} mm`],
    ["Zero termico", `${Math.round(max.freezing_level_height || 0)} m`]
  ]
    .map(([name, value]) => `<div class="metric"><span>${name}</span><strong>${value}</strong></div>`)
    .join("");

  els.hours.innerHTML = rows
    .slice(0, 24)
    .map((row) => {
      const rowColor = riskColor(row.score);
      return `<div class="hour">
        <span>${formatTimelineLabel(row.time, forecast.timezone, rows[0].time)}</span>
        <div class="bar"><div class="fill" style="width: ${row.score}%; background: ${rowColor}"></div></div>
        <strong>${row.score}</strong>
      </div>`;
    })
    .join("");
}

async function searchCity(name) {
  const url = new URL(geocodeUrl);
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Ricerca città non riuscita.");
  const data = await response.json();
  if (!data.results?.length) throw new Error("Nessuna città trovata.");
  return data.results[0];
}

async function getForecast(place) {
  const url = new URL(forecastUrl);
  url.searchParams.set("latitude", place.latitude);
  url.searchParams.set("longitude", place.longitude);
  url.searchParams.set(
    "hourly",
    "weather_code,precipitation_probability,precipitation,showers,cape,wind_gusts_10m,freezing_level_height"
  );
  url.searchParams.set("forecast_hours", "24");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Richiesta previsioni non riuscita.");
  return response.json();
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
    baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      maxNativeZoom: 20,
      attribution:
        '&copy; OpenStreetMap contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
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
  requestAnimationFrame(() => map.invalidateSize());
}

async function loadRadar() {
  const response = await fetch(rainViewerUrl);
  if (!response.ok) throw new Error("Dati radar non disponibili.");
  const data = await response.json();
  const pastFrames = data.radar?.past || [];
  const futureFrames = data.radar?.nowcast || [];
  const frames = [...pastFrames, ...futureFrames];
  els.radarState.textContent = futureFrames.length ? "Live" : "Storico";
  radarFrames = frames.map((frame) => ({
    ...frame,
    tileUrl: `${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
  }));
  frameIndex = Math.max(0, pastFrames.length - 1);
  showRadarFrame(frameIndex);
}

function showRadarFrame(index) {
  if (!map || !radarFrames.length) return;
  frameIndex = (index + radarFrames.length) % radarFrames.length;
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
    radarLayer.setOpacity(0.52);
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

  const frameTime = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(frame.time * 1000));
  els.frameLabel.textContent = `${frameTime} · ${frameIndex + 1}/${radarFrames.length}`;
  els.frameLabel.classList.remove("is-changing");
  requestAnimationFrame(() => els.frameLabel.classList.add("is-changing"));
}

function toggleRadarPlayback() {
  if (radarTimer) {
    clearInterval(radarTimer);
    radarTimer = null;
    els.playRadar.textContent = "Avvia";
    return;
  }

  els.playRadar.textContent = "Pausa";
  radarTimer = setInterval(() => showRadarFrame(frameIndex + 1), 1050);
}

async function loadCity(city) {
  try {
    setStatus(`Cerco ${city}...`);
    const place = await searchCity(city);
    ensureMap(place);

    setStatus("Carico previsione...");
    const forecast = await getForecast(place);
    renderRisk(place, forecast);

    setStatus("Aggiorno radar...");
    await loadRadar();
    setStatus(`Sincronizzato ${place.name}`);
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = els.cityInput.value.trim();
  if (city) loadCity(city);
});

els.prevFrame.addEventListener("click", () => showRadarFrame(frameIndex - 1));
els.nextFrame.addEventListener("click", () => showRadarFrame(frameIndex + 1));
els.playRadar.addEventListener("click", toggleRadarPlayback);
window.addEventListener("resize", () => {
  if (map) map.invalidateSize();
});

loadCity(els.cityInput.value);
