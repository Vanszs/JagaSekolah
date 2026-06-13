// Optimasi GeoJSON provinsi: bulatkan presisi koordinat & buang ring sangat kecil.
// Hasil: ukuran turun drastis -> render "secepat kilat".
const fs = require("fs");

const src = JSON.parse(fs.readFileSync("public/geo/indonesia-provinces.geojson", "utf8"));
const P = 1000; // 3 desimal
const round = (n) => Math.round(n * P) / P;

// Hitung luas bbox sebuah ring (lon/lat) untuk filter pulau mikro.
function ringBox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return (maxX - minX) * (maxY - minY);
}

const MIN_AREA = 0.0025; // ~ buang pulau sangat kecil (derajat^2)

function cleanRing(ring) {
  const out = [];
  let prev = null;
  for (const pt of ring) {
    const r = [round(pt[0]), round(pt[1])];
    if (!prev || r[0] !== prev[0] || r[1] !== prev[1]) out.push(r);
    prev = r;
  }
  return out.length >= 4 ? out : null;
}

let before = 0, after = 0;
for (const f of src.features) {
  const g = f.geometry;
  if (g.type === "Polygon") {
    g.coordinates = g.coordinates.map(cleanRing).filter(Boolean);
  } else if (g.type === "MultiPolygon") {
    g.coordinates = g.coordinates
      .filter((poly) => ringBox(poly[0]) >= MIN_AREA)
      .map((poly) => poly.map(cleanRing).filter(Boolean))
      .filter((poly) => poly.length > 0);
  }
  // simpan hanya properti yang dipakai
  f.properties = { state: f.properties.state };
}

const out = JSON.stringify(src);
fs.writeFileSync("public/geo/indonesia-provinces.min.geojson", out);
before = fs.statSync("public/geo/indonesia-provinces.geojson").size;
after = Buffer.byteLength(out);
console.log(`before ${(before/1024).toFixed(0)}KB -> after ${(after/1024).toFixed(0)}KB`);
