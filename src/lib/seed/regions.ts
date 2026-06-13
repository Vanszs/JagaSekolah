/**
 * Data wilayah Indonesia NYATA & LENGKAP — seluruh 38 provinsi (termasuk 4
 * provinsi pemekaran Papua 2022: Papua Selatan, Papua Tengah, Papua Pegunungan,
 * Papua Barat Daya). Nama provinsi & kabupaten/kota = ASLI (BPS/Kemendagri).
 *
 * Nama sekolah = sintetis plausibel (pola penamaan SMP Negeri); NPSN = 8-digit
 * di-generate sistematis (unik, format valid) TAPI BUKAN NPSN sekolah asli —
 * agar tidak menautkan ke data nyata/PII. Flag is3T menandai daerah
 * Terdepan/Terluar/Tertinggal untuk realisme lapangan.
 */

export interface SeedSekolah {
  nama: string;
  npsn: string;
}
export interface SeedKabupaten {
  kabupaten: string;
  is3T: boolean;
  sekolah: SeedSekolah[];
}
export interface SeedProvinsi {
  provinsi: string;
  kabupatenList: SeedKabupaten[];
}

/** Definisi ringkas: [provinsi, [[kabupaten, is3T, namaSekolah], ...]]. */
type RawKab = [kabupaten: string, is3T: boolean, sekolah: string];
type RawProv = [provinsi: string, kabupaten: RawKab[]];

const RAW: RawProv[] = [
  // ── SUMATERA ──────────────────────────────────────────────────────────
  ["Aceh", [["Kota Banda Aceh", false, "SMP Negeri 1 Banda Aceh"], ["Kabupaten Simeulue", true, "SMP Negeri 1 Sinabang"]]],
  ["Sumatera Utara", [["Kota Medan", false, "SMP Negeri 1 Medan"], ["Kabupaten Nias Selatan", true, "SMP Negeri 1 Teluk Dalam"]]],
  ["Sumatera Barat", [["Kota Padang", false, "SMP Negeri 7 Padang"], ["Kabupaten Kepulauan Mentawai", true, "SMP Negeri 1 Sikakap"]]],
  ["Riau", [["Kota Pekanbaru", false, "SMP Negeri 4 Pekanbaru"], ["Kabupaten Kepulauan Meranti", true, "SMP Negeri 1 Tebing Tinggi"]]],
  ["Kepulauan Riau", [["Kota Batam", false, "SMP Negeri 6 Batam"], ["Kabupaten Natuna", true, "SMP Negeri 1 Ranai"]]],
  ["Jambi", [["Kota Jambi", false, "SMP Negeri 7 Jambi"], ["Kabupaten Kerinci", false, "SMP Negeri 1 Sungai Penuh"]]],
  ["Bengkulu", [["Kota Bengkulu", false, "SMP Negeri 1 Bengkulu"], ["Kabupaten Kaur", false, "SMP Negeri 1 Bintuhan"]]],
  ["Sumatera Selatan", [["Kota Palembang", false, "SMP Negeri 1 Palembang"], ["Kabupaten Musi Rawas Utara", true, "SMP Negeri 1 Rupit"]]],
  ["Kepulauan Bangka Belitung", [["Kota Pangkalpinang", false, "SMP Negeri 1 Pangkalpinang"], ["Kabupaten Belitung Timur", false, "SMP Negeri 1 Manggar"]]],
  ["Lampung", [["Kota Bandar Lampung", false, "SMP Negeri 2 Bandar Lampung"], ["Kabupaten Pesisir Barat", true, "SMP Negeri 1 Krui"]]],

  // ── JAWA ──────────────────────────────────────────────────────────────
  ["DKI Jakarta", [["Kota Jakarta Pusat", false, "SMP Negeri 1 Jakarta"], ["Kota Jakarta Utara", false, "SMP Negeri 30 Jakarta"]]],
  ["Jawa Barat", [["Kota Bandung", false, "SMP Negeri 5 Bandung"], ["Kabupaten Garut", false, "SMP Negeri 1 Tarogong Kidul"]]],
  ["Jawa Tengah", [["Kota Semarang", false, "SMP Negeri 2 Semarang"], ["Kabupaten Brebes", false, "SMP Negeri 1 Brebes"]]],
  ["DI Yogyakarta", [["Kota Yogyakarta", false, "SMP Negeri 5 Yogyakarta"], ["Kabupaten Gunungkidul", false, "SMP Negeri 1 Wonosari"]]],
  ["Jawa Timur", [["Kota Surabaya", false, "SMP Negeri 1 Surabaya"], ["Kabupaten Sampang", false, "SMP Negeri 2 Sampang"]]],
  ["Banten", [["Kota Serang", false, "SMP Negeri 1 Serang"], ["Kabupaten Lebak", false, "SMP Negeri 1 Rangkasbitung"]]],

  // ── BALI & NUSA TENGGARA ──────────────────────────────────────────────
  ["Bali", [["Kota Denpasar", false, "SMP Negeri 1 Denpasar"], ["Kabupaten Karangasem", false, "SMP Negeri 1 Amlapura"]]],
  ["Nusa Tenggara Barat", [["Kota Mataram", false, "SMP Negeri 2 Mataram"], ["Kabupaten Lombok Utara", false, "SMP Negeri 1 Tanjung"]]],
  ["Nusa Tenggara Timur", [["Kota Kupang", false, "SMP Negeri 1 Kupang"], ["Kabupaten Sumba Barat Daya", true, "SMP Negeri 1 Tambolaka"], ["Kabupaten Manggarai", true, "SMP Negeri 2 Ruteng"]]],

  // ── KALIMANTAN ────────────────────────────────────────────────────────
  ["Kalimantan Barat", [["Kota Pontianak", false, "SMP Negeri 1 Pontianak"], ["Kabupaten Kapuas Hulu", true, "SMP Negeri 1 Putussibau"]]],
  ["Kalimantan Tengah", [["Kota Palangka Raya", false, "SMP Negeri 1 Palangka Raya"], ["Kabupaten Murung Raya", true, "SMP Negeri 1 Puruk Cahu"]]],
  ["Kalimantan Selatan", [["Kota Banjarmasin", false, "SMP Negeri 1 Banjarmasin"], ["Kabupaten Hulu Sungai Utara", false, "SMP Negeri 1 Amuntai"]]],
  ["Kalimantan Timur", [["Kota Samarinda", false, "SMP Negeri 1 Samarinda"], ["Kabupaten Mahakam Ulu", true, "SMP Negeri 1 Ujoh Bilang"]]],
  ["Kalimantan Utara", [["Kota Tarakan", false, "SMP Negeri 1 Tarakan"], ["Kabupaten Nunukan", true, "SMP Negeri 1 Nunukan"]]],

  // ── SULAWESI ──────────────────────────────────────────────────────────
  ["Sulawesi Utara", [["Kota Manado", false, "SMP Negeri 1 Manado"], ["Kabupaten Kepulauan Sangihe", true, "SMP Negeri 1 Tahuna"]]],
  ["Sulawesi Tengah", [["Kota Palu", false, "SMP Negeri 1 Palu"], ["Kabupaten Banggai Kepulauan", true, "SMP Negeri 1 Salakan"]]],
  ["Sulawesi Selatan", [["Kota Makassar", false, "SMP Negeri 6 Makassar"], ["Kabupaten Kepulauan Selayar", true, "SMP Negeri 1 Benteng"]]],
  ["Sulawesi Tenggara", [["Kota Kendari", false, "SMP Negeri 1 Kendari"], ["Kabupaten Wakatobi", true, "SMP Negeri 1 Wangi-Wangi"]]],
  ["Gorontalo", [["Kota Gorontalo", false, "SMP Negeri 1 Gorontalo"], ["Kabupaten Pohuwato", false, "SMP Negeri 1 Marisa"]]],
  ["Sulawesi Barat", [["Kabupaten Mamuju", false, "SMP Negeri 1 Mamuju"], ["Kabupaten Mamasa", true, "SMP Negeri 1 Mamasa"]]],

  // ── MALUKU ────────────────────────────────────────────────────────────
  ["Maluku", [["Kota Ambon", false, "SMP Negeri 4 Ambon"], ["Kabupaten Kepulauan Aru", true, "SMP Negeri 1 Dobo"]]],
  ["Maluku Utara", [["Kota Ternate", false, "SMP Negeri 1 Ternate"], ["Kabupaten Pulau Taliabu", true, "SMP Negeri 1 Bobong"]]],

  // ── PAPUA (6 provinsi, termasuk pemekaran 2022) ───────────────────────
  ["Papua", [["Kota Jayapura", false, "SMP Negeri 2 Jayapura"], ["Kabupaten Sarmi", true, "SMP Negeri 1 Sarmi"]]],
  ["Papua Barat", [["Kota Sorong", false, "SMP Negeri 1 Sorong"], ["Kabupaten Teluk Wondama", true, "SMP Negeri 1 Rasiei"]]],
  ["Papua Selatan", [["Kabupaten Merauke", true, "SMP Negeri 1 Merauke"], ["Kabupaten Asmat", true, "SMP Negeri 1 Agats"]]],
  ["Papua Tengah", [["Kabupaten Nabire", true, "SMP Negeri 1 Nabire"], ["Kabupaten Puncak Jaya", true, "SMP Negeri 1 Mulia"]]],
  ["Papua Pegunungan", [["Kabupaten Jayawijaya", true, "SMP Negeri 1 Wamena"], ["Kabupaten Yahukimo", true, "SMP Negeri 1 Dekai"]]],
  ["Papua Barat Daya", [["Kabupaten Raja Ampat", true, "SMP Negeri 1 Waisai"], ["Kabupaten Maybrat", true, "SMP Negeri 1 Kumurkek"]]],
];

/** Bangun struktur + NPSN unik sistematis: PP(2) + KK(2) + 0001 → 8 digit. */
export const SEED_REGIONS: SeedProvinsi[] = RAW.map(([provinsi, kabs], pi) => ({
  provinsi,
  kabupatenList: kabs.map(([kabupaten, is3T, nama], ki) => ({
    kabupaten,
    is3T,
    sekolah: [{ nama, npsn: `${String(pi + 1).padStart(2, "0")}${String(ki + 1).padStart(2, "0")}0001` }],
  })),
}));

/** Daftar datar semua sekolah dengan konteks wilayahnya. */
export const ALL_SEED_SEKOLAH = SEED_REGIONS.flatMap((p) =>
  p.kabupatenList.flatMap((k) => k.sekolah.map((s) => ({ ...s, provinsi: p.provinsi, kabupaten: k.kabupaten, is3T: k.is3T }))),
);
