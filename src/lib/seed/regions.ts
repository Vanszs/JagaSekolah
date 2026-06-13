/**
 * Data wilayah Indonesia NYATA untuk seed (nama provinsi & kabupaten/kota asli,
 * BPS/Kemendagri). Nama sekolah = sintetis plausibel mengikuti pola penamaan;
 * NPSN = format 8-digit valid TAPI sintetis (BUKAN NPSN sekolah asli) agar tidak
 * menautkan ke data nyata. Mencakup daerah 3T (Terdepan/Terluar/Tertinggal) untuk
 * realisme lapangan.
 */

export interface SeedSekolah {
  nama: string;
  npsn: string; // 8-digit sintetis
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

export const SEED_REGIONS: SeedProvinsi[] = [
  {
    provinsi: "Aceh",
    kabupatenList: [
      { kabupaten: "Kota Banda Aceh", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Banda Aceh", npsn: "10100101" }] },
      { kabupaten: "Kabupaten Simeulue", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Sinabang", npsn: "10100401" }] },
    ],
  },
  {
    provinsi: "Sumatera Utara",
    kabupatenList: [
      { kabupaten: "Kota Medan", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Medan", npsn: "10200101" }] },
      { kabupaten: "Kabupaten Nias Selatan", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Teluk Dalam", npsn: "10200301" }] },
    ],
  },
  {
    provinsi: "Sumatera Barat",
    kabupatenList: [
      { kabupaten: "Kabupaten Kepulauan Mentawai", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Sikakap", npsn: "10300201" }] },
    ],
  },
  {
    provinsi: "DKI Jakarta",
    kabupatenList: [
      { kabupaten: "Kota Jakarta Utara", is3T: false, sekolah: [{ nama: "SMP Negeri 30 Jakarta", npsn: "20100301" }] },
    ],
  },
  {
    provinsi: "Jawa Barat",
    kabupatenList: [
      { kabupaten: "Kota Bandung", is3T: false, sekolah: [{ nama: "SMP Negeri 5 Bandung", npsn: "20200101" }] },
      { kabupaten: "Kabupaten Garut", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Tarogong Kidul", npsn: "20200301" }] },
    ],
  },
  {
    provinsi: "Jawa Tengah",
    kabupatenList: [
      { kabupaten: "Kota Semarang", is3T: false, sekolah: [{ nama: "SMP Negeri 2 Semarang", npsn: "20300101" }] },
      { kabupaten: "Kabupaten Brebes", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Brebes", npsn: "20300301" }] },
    ],
  },
  {
    provinsi: "DI Yogyakarta",
    kabupatenList: [
      { kabupaten: "Kabupaten Gunungkidul", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Wonosari", npsn: "20400201" }] },
    ],
  },
  {
    provinsi: "Jawa Timur",
    kabupatenList: [
      { kabupaten: "Kota Surabaya", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Surabaya", npsn: "20500101" }] },
      { kabupaten: "Kabupaten Sampang", is3T: false, sekolah: [{ nama: "SMP Negeri 2 Sampang", npsn: "20500201" }] },
    ],
  },
  {
    provinsi: "Bali",
    kabupatenList: [
      { kabupaten: "Kabupaten Karangasem", is3T: false, sekolah: [{ nama: "SMP Negeri 1 Amlapura", npsn: "30100201" }] },
    ],
  },
  {
    provinsi: "Nusa Tenggara Timur",
    kabupatenList: [
      { kabupaten: "Kabupaten Timor Tengah Selatan", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Soe", npsn: "30200201" }] },
      { kabupaten: "Kabupaten Sumba Barat Daya", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Tambolaka", npsn: "30200401" }] },
      { kabupaten: "Kabupaten Manggarai", is3T: true, sekolah: [{ nama: "SMP Negeri 2 Ruteng", npsn: "30200601" }] },
    ],
  },
  {
    provinsi: "Kalimantan Barat",
    kabupatenList: [
      { kabupaten: "Kabupaten Kapuas Hulu", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Putussibau", npsn: "40100201" }] },
    ],
  },
  {
    provinsi: "Kalimantan Utara",
    kabupatenList: [
      { kabupaten: "Kabupaten Malinau", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Malinau", npsn: "40200101" }] },
    ],
  },
  {
    provinsi: "Sulawesi Selatan",
    kabupatenList: [
      { kabupaten: "Kota Makassar", is3T: false, sekolah: [{ nama: "SMP Negeri 6 Makassar", npsn: "50100101" }] },
      { kabupaten: "Kabupaten Kepulauan Selayar", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Benteng", npsn: "50100401" }] },
    ],
  },
  {
    provinsi: "Maluku",
    kabupatenList: [
      { kabupaten: "Kabupaten Kepulauan Aru", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Dobo", npsn: "60100401" }] },
    ],
  },
  {
    provinsi: "Papua Pegunungan",
    kabupatenList: [
      { kabupaten: "Kabupaten Jayawijaya", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Wamena", npsn: "60300201" }] },
      { kabupaten: "Kabupaten Yahukimo", is3T: true, sekolah: [{ nama: "SMP Negeri 1 Dekai", npsn: "60300401" }] },
    ],
  },
];

/** Daftar datar semua sekolah dengan konteks wilayahnya. */
export const ALL_SEED_SEKOLAH = SEED_REGIONS.flatMap((p) =>
  p.kabupatenList.flatMap((k) => k.sekolah.map((s) => ({ ...s, provinsi: p.provinsi, kabupaten: k.kabupaten, is3T: k.is3T }))),
);
