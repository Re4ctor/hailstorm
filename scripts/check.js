const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const html = readFileSync("src/renderer/index.html", "utf8");
const css = readFileSync("src/renderer/styles.css", "utf8");
const js = readFileSync("src/renderer/app.js", "utf8");

new Function(js);
for (const id of js.matchAll(/querySelector\("#([^"]+)"\)/g)) {
  assert.match(html, new RegExp(`id=["']${id[1]}["']`), `Missing #${id[1]} in index.html`);
}
assert.match(css, /prefers-reduced-motion/);
assert.match(js, /return "var\(--risk-neutral\)"/);
assert.match(js, /https:\/\/api\.rainviewer\.com\/public\/weather-maps\.json/);
assert.match(js, /https:\/\/map-tiles\.open-meteo\.com\/data_spatial\/dwd_icon\/latest\.json/);
assert.match(js, /forecastMetadata\.valid_times/);
assert.match(js, /variable=cloud_cover/);
assert.match(js, /cloudLayer\.setOpacity/);
assert.match(js, /rainViewerRequestsPerMinute = 100/);
assert.match(js, /function radarPlaybackDelay\(\)/);
assert.match(js, /new AbortController\(\)/, "Network requests must time out");
assert.match(js, /forecastCacheMaxEntries/, "Stored forecasts must stay bounded");
assert.match(js, /document\.documentElement\.lang/, "Document language must follow the language setting");
assert.equal(
  (js.match(/await fetch\(/g) || []).length,
  1,
  "Every request must go through fetchJson, which is the only place allowed to call fetch"
);
assert.match(html, /id="playRadar"/);
assert.match(html, /weather-map-layer/);
assert.doesNotMatch(html + css + js, /[—–]/);

console.log("UI smoke checks passed");
