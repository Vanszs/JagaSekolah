import type { Prisma, KategoriRisiko } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseAlasan } from "@/lib/parseAlasan";

/**
 * Lapisan data analitik — SEMUA dari data nyata (Risiko snapshot historis,
 * Absensi, Intervensi, alasanJson). Tidak ada angka karangan. Fungsi menerima
 * `scope` (Prisma.SiswaWhereInput) agar bisa dipakai lintas peran (nasional /
 * wilayah / sekolah / kelas).
 */

export type RiskScope = Prisma.SiswaWhereInput;

const KAT: KategoriRisiko[] = ["merah", "kuning", "hijau"];
const monthLabel = (d: Date) =>
  d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

/** Kunci bulan (YYYY-M) untuk grouping. */
function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/* ── KPI utama + delta bulan-ke-bulan (dari snapshot historis) ─────────── */
export interface Kpis {
  totalSiswa: number;
  merah: number;
  kuning: number;
  hijau: number;
  intervensiAktif: number;
  // delta % vs ~30 hari lalu (snapshot historis terdekat)
  merahDeltaPct: number | null;
  totalSiswaSpark: number[]; // sparkline merah per bulan (untuk kartu risiko)
}

export async function getKpis(scope: RiskScope): Promise<Kpis> {
  const trend = await monthlyRiskTrend(scope);
  const latest = trend.at(-1);
  const prev = trend.at(-2);
  const merahDeltaPct =
    prev && prev.merah > 0 && latest ? ((latest.merah - prev.merah) / prev.merah) * 100 : null;

  const [totalSiswa, grouped, intervensiAktif] = await Promise.all([
    prisma.siswa.count({ where: scope }),
    prisma.risiko.groupBy({
      by: ["kategori"],
      where: { isLatest: true, siswa: scope },
      _count: true,
    }),
    prisma.intervensi.count({ where: { deletedAt: null, siswa: scope } }),
  ]);
  const cnt = (k: KategoriRisiko) => grouped.find((g) => g.kategori === k)?._count ?? 0;

  return {
    totalSiswa,
    merah: cnt("merah"),
    kuning: cnt("kuning"),
    hijau: cnt("hijau"),
    intervensiAktif,
    merahDeltaPct,
    totalSiswaSpark: trend.map((t) => t.merah),
  };
}

/* ── Tren risiko 12 bulan (merah/kuning/hijau per bulan) ───────────────── */
export interface MonthBucket {
  key: string;
  label: string;
  merah: number;
  kuning: number;
  hijau: number;
}

export async function monthlyRiskTrend(scope: RiskScope): Promise<MonthBucket[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.risiko.findMany({
    where: { tanggalHitung: { gte: since }, siswa: scope },
    select: { tanggalHitung: true, kategori: true },
  });

  // 12 bucket bulan berurutan
  const buckets = new Map<string, MonthBucket>();
  const now = new Date();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { key: monthKey(d), label: monthLabel(d), merah: 0, kuning: 0, hijau: 0 });
  }
  for (const r of rows) {
    const b = buckets.get(monthKey(r.tanggalHitung));
    if (b) b[r.kategori] += 1;
  }
  return [...buckets.values()];
}

/* ── Analisis faktor risiko (agregat alasanJson.kode siswa berisiko) ───── */
const FACTOR_GROUP: Record<string, string> = {
  absen_kritis: "Kehadiran menurun",
  absen_waspada: "Kehadiran menurun",
  alpa_beruntun: "Kehadiran menurun",
  tren_absensi: "Kehadiran menurun",
  telat: "Kehadiran menurun",
  nilai_turun: "Prestasi akademik",
  mapel_kkm: "Prestasi akademik",
  nilai_inti: "Prestasi akademik",
  tinggal_kelas: "Riwayat tinggal kelas",
  disiplin: "Masalah perilaku",
  partisipasi: "Masalah perilaku",
  tugas: "Masalah perilaku",
  faktor_ekonomi: "Faktor ekonomi",
  keluarga_rentan: "Kondisi keluarga",
  jarak: "Jarak ke sekolah",
};

export interface FactorRow {
  label: string;
  count: number;
}

export async function riskFactorBreakdown(scope: RiskScope): Promise<FactorRow[]> {
  const rows = await prisma.risiko.findMany({
    where: { isLatest: true, kategori: { in: ["merah", "kuning"] }, siswa: scope },
    select: { alasanJson: true },
  });
  const tally = new Map<string, number>();
  for (const r of rows) {
    let groups: Set<string>;
    try {
      const raw = JSON.parse(r.alasanJson) as { alasan?: { kode?: string }[] };
      groups = new Set<string>();
      if (Array.isArray(raw.alasan)) {
        for (const a of raw.alasan) {
          if (a.kode) groups.add(FACTOR_GROUP[a.kode] ?? "Lainnya");
        }
      }
    } catch {
      const { alasan } = parseAlasan(r.alasanJson);
      groups = alasan.length > 0 ? new Set(["Lainnya"]) : new Set();
    }
    for (const g of groups) tally.set(g, (tally.get(g) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/* ── Donut sebaran risiko terkini ──────────────────────────────────────── */
export async function riskDonut(scope: RiskScope) {
  const grouped = await prisma.risiko.groupBy({
    by: ["kategori"],
    where: { isLatest: true, siswa: scope },
    _count: true,
  });
  const cnt = (k: KategoriRisiko) => grouped.find((g) => g.kategori === k)?._count ?? 0;
  return { merah: cnt("merah"), kuning: cnt("kuning"), hijau: cnt("hijau") };
}

/* ── Risiko per kelas ──────────────────────────────────────────────────── */
export interface KelasRisk {
  kelas: string;
  merah: number;
  kuning: number;
  hijau: number;
}

export async function riskByKelas(scope: RiskScope): Promise<KelasRisk[]> {
  const siswa = await prisma.siswa.findMany({
    where: scope,
    select: {
      kelas: { select: { nama: true } },
      risiko: { where: { isLatest: true }, select: { kategori: true }, take: 1 },
    },
  });
  const map = new Map<string, KelasRisk>();
  for (const s of siswa) {
    const nama = s.kelas.nama;
    const k = map.get(nama) ?? { kelas: nama, merah: 0, kuning: 0, hijau: 0 };
    const kat = s.risiko[0]?.kategori;
    if (kat) k[kat] += 1;
    map.set(nama, k);
  }
  const result = Array.from(map.values());
  result.sort((a, b) => a.kelas.localeCompare(b.kelas));
  return result;
}

/* ── Ringkasan kehadiran (30 hari) ─────────────────────────────────────── */
export interface AttendanceSummary {
  pctHadir: number;
  pctAlpa: number;
  kronisCount: number; // siswa dgn alpa tinggi
  total: number;
}

export async function attendanceSummary(scope: RiskScope): Promise<AttendanceSummary> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const grouped = await prisma.absensi.groupBy({
    by: ["status"],
    where: { tanggal: { gte: since }, siswa: scope },
    _count: true,
  });
  const get = (s: string) => grouped.find((g) => g.status === s)?._count ?? 0;
  const total = grouped.reduce((a, g) => a + g._count, 0);
  const hadir = get("hadir");
  const alpa = get("alpa");

  // siswa dgn ≥5 alpa dalam 30 hari (kronis)
  const alpaPerSiswa = await prisma.absensi.groupBy({
    by: ["siswaId"],
    where: { tanggal: { gte: since }, status: "alpa", siswa: scope },
    _count: true,
  });
  const kronisCount = alpaPerSiswa.filter((a) => a._count >= 5).length;

  return {
    pctHadir: total > 0 ? Math.round((hadir / total) * 100) : 0,
    pctAlpa: total > 0 ? Math.round((alpa / total) * 100) : 0,
    kronisCount,
    total,
  };
}

/* ── Daftar siswa prioritas (skor tertinggi) ───────────────────────────── */
export interface PriorityStudent {
  id: string;
  nama: string;
  kelas: string;
  kategori: KategoriRisiko;
  skor: number;
  faktorUtama: string;
}

export async function priorityStudents(scope: RiskScope, take = 10): Promise<PriorityStudent[]> {
  const rows = await prisma.risiko.findMany({
    where: { isLatest: true, kategori: { in: ["merah", "kuning"] }, siswa: scope },
    orderBy: { skor: "desc" },
    take,
    select: {
      skor: true,
      kategori: true,
      alasanJson: true,
      siswa: { select: { id: true, nama: true, kelas: { select: { nama: true } } } },
    },
  });
  return rows.map((r) => {
    const { alasan } = parseAlasan(r.alasanJson);
    return {
      id: r.siswa.id,
      nama: r.siswa.nama,
      kelas: r.siswa.kelas.nama,
      kategori: r.kategori,
      skor: Math.round(r.skor),
      faktorUtama: alasan[0] ?? "—",
    };
  });
}
/* ── Agregasi wilayah (provinsi & kabupaten) untuk drill-down ──────────── */
export interface RegionRisk {
  /** id untuk navigasi: provinsi=nama (slug), kabupaten=wilayahId */
  id: string;
  label: string;
  sub?: string;
  merah: number;
  kuning: number;
  hijau: number;
  total: number;
  sekolah: number;
}

/** Risiko terkini diagregasi per PROVINSI (gabung Risiko→Sekolah→Wilayah). */
export async function riskByProvinsi(): Promise<RegionRisk[]> {
  const [grouped, sekolah] = await Promise.all([
    prisma.risiko.groupBy({
      by: ["sekolahId", "kategori"],
      where: { isLatest: true },
      _count: true,
    }),
    prisma.sekolah.findMany({
      select: { id: true, wilayah: { select: { provinsi: true } } },
    }),
  ]);
  const sekToProv = new Map(sekolah.map((s) => [s.id, s.wilayah.provinsi]));
  const provSekolah = new Map<string, Set<string>>();
  for (const s of sekolah) {
    const set = provSekolah.get(s.wilayah.provinsi) ?? new Set<string>();
    set.add(s.id);
    provSekolah.set(s.wilayah.provinsi, set);
  }
  const map = new Map<string, RegionRisk>();
  for (const g of grouped) {
    const prov = sekToProv.get(g.sekolahId);
    if (!prov) continue;
    const r = map.get(prov) ?? { id: prov, label: prov, merah: 0, kuning: 0, hijau: 0, total: 0, sekolah: provSekolah.get(prov)?.size ?? 0 };
    r[g.kategori] += g._count;
    r.total += g._count;
    map.set(prov, r);
  }
  // sertakan provinsi tanpa risiko juga
  for (const [prov, set] of provSekolah) {
    if (!map.has(prov)) map.set(prov, { id: prov, label: prov, merah: 0, kuning: 0, hijau: 0, total: 0, sekolah: set.size });
  }
  return Array.from(map.values()).sort((a, b) => b.merah - a.merah);
}

/** Kabupaten dalam satu provinsi. */
export async function riskByKabupaten(provinsi: string): Promise<RegionRisk[]> {
  const sekolah = await prisma.sekolah.findMany({
    where: { wilayah: { provinsi } },
    select: { id: true, wilayahId: true, wilayah: { select: { kabupaten: true, provinsi: true } } },
  });
  const sekToWil = new Map(sekolah.map((s) => [s.id, s.wilayahId]));
  const wilMeta = new Map<string, { kabupaten: string; provinsi: string; sekolah: Set<string> }>();
  for (const s of sekolah) {
    const m = wilMeta.get(s.wilayahId) ?? { kabupaten: s.wilayah.kabupaten, provinsi: s.wilayah.provinsi, sekolah: new Set<string>() };
    m.sekolah.add(s.id);
    wilMeta.set(s.wilayahId, m);
  }
  const grouped = await prisma.risiko.groupBy({
    by: ["sekolahId", "kategori"],
    where: { isLatest: true, sekolahId: { in: sekolah.map((s) => s.id) } },
    _count: true,
  });
  const map = new Map<string, RegionRisk>();
  for (const [wilId, meta] of wilMeta) {
    map.set(wilId, { id: wilId, label: meta.kabupaten, sub: meta.provinsi, merah: 0, kuning: 0, hijau: 0, total: 0, sekolah: meta.sekolah.size });
  }
  for (const g of grouped) {
    const wilId = sekToWil.get(g.sekolahId);
    if (!wilId) continue;
    const r = map.get(wilId);
    if (!r) continue;
    r[g.kategori] += g._count;
    r.total += g._count;
  }
  return Array.from(map.values()).sort((a, b) => b.merah - a.merah);
}

/** Sekolah dalam satu kabupaten (wilayahId). */
export async function riskBySekolah(wilayahId: string): Promise<RegionRisk[]> {
  const sekolah = await prisma.sekolah.findMany({
    where: { wilayahId },
    select: { id: true, nama: true, npsn: true },
  });
  const grouped = await prisma.risiko.groupBy({
    by: ["sekolahId", "kategori"],
    where: { isLatest: true, sekolahId: { in: sekolah.map((s) => s.id) } },
    _count: true,
  });
  const map = new Map<string, RegionRisk>();
  for (const s of sekolah) {
    map.set(s.id, { id: s.id, label: s.nama, sub: `NPSN ${s.npsn}`, merah: 0, kuning: 0, hijau: 0, total: 0, sekolah: 1 });
  }
  for (const g of grouped) {
    const r = map.get(g.sekolahId);
    if (!r) continue;
    r[g.kategori] += g._count;
    r.total += g._count;
  }
  return Array.from(map.values()).sort((a, b) => b.merah - a.merah);
}

/** Kelas dalam satu sekolah (untuk drill-down sebelum roster siswa). */
export async function riskByKelasInSekolah(sekolahId: string): Promise<RegionRisk[]> {
  const [kelas, siswa] = await Promise.all([
    prisma.kelas.findMany({
      where: { sekolahId },
      select: { id: true, nama: true, _count: { select: { siswa: true } } },
    }),
    prisma.siswa.findMany({
      where: { sekolahId },
      select: { kelasId: true, risiko: { where: { isLatest: true }, select: { kategori: true }, take: 1 } },
    }),
  ]);
  const map = new Map<string, RegionRisk>();
  for (const k of kelas) {
    map.set(k.id, { id: k.id, label: k.nama, merah: 0, kuning: 0, hijau: 0, total: 0, sekolah: 1 });
  }
  for (const s of siswa) {
    const r = map.get(s.kelasId);
    if (!r) continue;
    const kat = s.risiko[0]?.kategori;
    if (kat) {
      r[kat] += 1;
      r.total += 1;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

/* ── Skala platform (superadmin) ───────────────────────────────────────── */
export interface PlatformScale {
  totalSekolah: number;
  totalWilayah: number;
  totalProvinsi: number;
  totalSiswa: number;
  totalUser: number;
  sekolahAktif: number; // punya pengguna
}

export async function platformScale(): Promise<PlatformScale> {
  const [totalSekolah, wilayah, totalSiswa, totalUser, sekolahAktif] = await Promise.all([
    prisma.sekolah.count(),
    prisma.wilayah.findMany({ select: { provinsi: true } }),
    prisma.siswa.count(),
    prisma.user.count(),
    prisma.sekolah.count({ where: { users: { some: {} } } }),
  ]);
  return {
    totalSekolah,
    totalWilayah: wilayah.length,
    totalProvinsi: new Set(wilayah.map((w) => w.provinsi)).size,
    totalSiswa,
    totalUser,
    sekolahAktif,
  };
}

/* ── Intervensi: per jenis + tren bulanan (REAL, dari Intervensi.jenis/tanggal) ── */
const JENIS_LABEL: Record<string, string> = {
  kunjungan_rumah: "Kunjungan rumah",
  koordinasi_bk: "Koordinasi BK",
  usul_kip: "Usulan KIP/PIP",
  konseling: "Konseling",
  lainnya: "Lainnya",
};

export interface JenisRow {
  jenis: string;
  label: string;
  count: number;
}

/** Jumlah intervensi aktif per jenis (scope-aware). */
export async function interventionByJenis(scope: RiskScope): Promise<JenisRow[]> {
  const grouped = await prisma.intervensi.groupBy({
    by: ["jenis"],
    where: { deletedAt: null, siswa: scope },
    _count: true,
  });
  return grouped
    .map((g) => ({ jenis: g.jenis, label: JENIS_LABEL[g.jenis] ?? g.jenis, count: g._count }))
    .sort((a, b) => b.count - a.count);
}

export interface InterventionMonth {
  label: string;
  jumlah: number;
}

/** Tren jumlah intervensi 12 bulan (scope-aware). */
export async function interventionTrend(scope: RiskScope): Promise<InterventionMonth[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.intervensi.findMany({
    where: { deletedAt: null, tanggal: { gte: since }, siswa: scope },
    select: { tanggal: true },
  });
  const buckets = new Map<string, InterventionMonth>();
  const now = new Date();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { label: monthLabel(d), jumlah: 0 });
  }
  for (const r of rows) {
    const b = buckets.get(monthKey(r.tanggal));
    if (b) b.jumlah += 1;
  }
  return Array.from(buckets.values());
}
