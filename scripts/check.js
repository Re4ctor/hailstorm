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
assert.match(js, /metadata\.radar\?\.past/);
assert.match(html, /id="playRadar"/);
assert.doesNotMatch(html + js, /weather-map-layer|OMWeatherMapLayer|weatherMapAdapter/);
assert.doesNotMatch(html + css + js, /[—–]/);

console.log("UI smoke checks passed");
