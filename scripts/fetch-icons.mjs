// Build-time IconScout fetcher — unduh SVG icon FREE (price=0) ke public/icons/.
// Kredensial dari .env (ICONSCOUT_CLIENT_ID + ICONSCOUT_CLIENT_SECRET) — tidak pernah
// masuk bundle klien. Jalankan manual: `node scripts/fetch-icons.mjs [--stage]`.
//
// Lisensi: IconScout free icons butuh atribusi. Lihat public/icons/ATTRIBUTION.md.

import fs from "node:fs/promises";
import path from "node:path";

const CLIENT_ID = process.env.ICONSCOUT_CLIENT_ID;
const CLIENT_SECRET = process.env.ICONSCOUT_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("ICONSCOUT_CLIENT_ID / ICONSCOUT_CLIENT_SECRET belum di-set di environment.");
  process.exit(1);
}

const STAGE = process.argv.includes("--stage");
const OUT_DIR = STAGE ? "public/icons/_stage" : "public/icons";
const CANDIDATES = STAGE ? 4 : 1; // staging: ambil bbrp kandidat untuk dikurasi

// Pemetaan: nama-file -> query pencarian. Konsep konten landing (chrome tetap Lucide).
const ICONS = [
  { name: "school", query: "school building line" },
  { name: "students", query: "students group line" },
  { name: "map-pin", query: "location pin line" },
  { name: "trending-down", query: "graph decline line" },
  { name: "alert", query: "alert warning line" },
  { name: "attendance", query: "calendar check line" },
  { name: "behavior", query: "clipboard list line" },
  { name: "academic", query: "graduation cap line" },
  { name: "context", query: "wallet money line" },
  { name: "sync", query: "data sync line" },
  { name: "engine", query: "brain processor line" },
  { name: "alert-bell", query: "notification bell line" },
  { name: "intervention", query: "helping hands care line" },
  { name: "shield", query: "shield check security line" },
  { name: "lock", query: "lock secure line" },
  { name: "consent", query: "document check line" },
  { name: "audit", query: "eye view line" },
];

async function api(url) {
  const res = await fetch(url, { headers: { "Client-ID": CLIENT_ID } });
  if (!res.ok) throw new Error(`search ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getDownloadUrl(uuid) {
  const res = await fetch(`https://api.iconscout.com/v3/items/${uuid}/api-download`, {
    method: "POST",
    headers: {
      "Client-ID": CLIENT_ID,
      "Client-Secret": CLIENT_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ format: "svg" }),
  });
  if (!res.ok) throw new Error(`download ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j?.response?.download?.url;
}

async function searchFree(query) {
  const u = new URL("https://api.iconscout.com/v3/search");
  u.searchParams.set("query", query);
  u.searchParams.set("asset", "icon");
  u.searchParams.set("price", "free");
  u.searchParams.set("per_page", "12");
  const j = await api(u.toString());
  return j?.response?.items?.data ?? [];
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const attribution = [];

  for (const { name, query } of ICONS) {
    try {
      const results = await searchFree(query);
      if (!results.length) {
        console.warn(`[skip] ${name}: tidak ada hasil free untuk "${query}"`);
        continue;
      }
      const picks = results.slice(0, CANDIDATES);
      for (let i = 0; i < picks.length; i++) {
        const it = picks[i];
        const url = await getDownloadUrl(it.uuid);
        if (!url) {
          console.warn(`[skip] ${name} #${i}: tak ada url unduh`);
          continue;
        }
        const svgRes = await fetch(url);
        let svg = await svgRes.text();
        // Normalisasi agar bisa diwarnai via currentColor & responsif.
        svg = svg
          .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
          .replace(/<svg /, '<svg fill="currentColor" ');
        const fileName = STAGE ? `${name}-${i}.svg` : `${name}.svg`;
        await fs.writeFile(path.join(OUT_DIR, fileName), svg, "utf8");
        attribution.push(`- ${fileName}: "${it.name}" by IconScout (id ${it.id}, ${query})`);
        console.log(`[ok] ${fileName}  <- ${it.name} (uuid ${it.uuid})`);
        await new Promise((r) => setTimeout(r, 120)); // jeda sopan
      }
    } catch (e) {
      console.error(`[err] ${name}: ${e.message}`);
    }
  }

  await fs.writeFile(
    path.join(OUT_DIR, "ATTRIBUTION.md"),
    `# Atribusi Icon (IconScout)\n\nIkon di folder ini diunduh dari IconScout (paket free) via API.\nFree license IconScout mewajibkan atribusi ke pembuat.\n\n${attribution.join("\n")}\n`,
    "utf8"
  );
  console.log(`\nSelesai. ${attribution.length} file -> ${OUT_DIR}`);
}

main();
