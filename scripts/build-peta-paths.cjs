// Precompute: GeoJSON provinsi -> SVG path strings (build-time).
// Output: src/components/landing/peta-paths.ts  (klien hanya render string, instan).
const fs = require("fs");
const { geoMercator, geoPath } = require("d3-geo");

const geo = JSON.parse(fs.readFileSync("public/geo/indonesia-provinces.min.geojson", "utf8"));
const W = 900, H = 380;
const projection = geoMercator().fitSize([W, H], geo);
const path = geoPath(projection);

const items = geo.features.map((f) => {
  const c = path.centroid(f);
  return {
    nama: f.properties.state,
    d: path(f) || "",
    cx: Math.round((c[0] || 0) * 10) / 10,
    cy: Math.round((c[1] || 0) * 10) / 10,
  };
});

const out = `// AUTO-GENERATED oleh scripts/build-peta-paths.cjs — jangan edit manual.
export const PETA_W = ${W};
export const PETA_H = ${H};
export interface ProvPath { nama: string; d: string; cx: number; cy: number; }
export const PROVINSI_PATHS: ProvPath[] = ${JSON.stringify(items)};
`;
fs.writeFileSync("src/components/landing/peta-paths.ts", out);
console.log(`generated ${items.length} provinces -> ${(Buffer.byteLength(out) / 1024).toFixed(0)}KB`);
