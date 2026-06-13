import type { Prisma, KategoriRisiko } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseAlasan } from "@/lib/parseAlasan";
import {
  scoreBinIndex,
  SCORE_BIN_LABELS,
  distanceBinIndex,
  DISTANCE_LABELS,
} from "@/lib/analyticsBuckets";
import {
  transformPlatformByProvinsi,
  transformUsersByRole,
  transformConsentBySekolah,
  transformAuditByAksi,
} from "@/lib/analyticsKernels";

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

/* ═══════════════════════════════════════════════════════════════════════
   TAMBAHAN — analitik kaya per-halaman (semua REAL, zero schema change).
   ═══════════════════════════════════════════════════════════════════════ */

/** Helper: peta sekolahId → provinsi (untuk agregasi nasional per provinsi). */
async function sekolahProvinsiMap(): Promise<Map<string, string>> {
  const sekolah = await prisma.sekolah.findMany({
    select: { id: true, wilayah: { select: { provinsi: true } } },
  });
  return new Map(sekolah.map((s) => [s.id, s.wilayah.provinsi]));
}

/* ── RISIKO: distribusi skor (histogram 10-poin) ───────────────────────── */
export interface ScoreBin {
  bin: string;
  count: number;
}

export async function riskScoreDistribution(scope: RiskScope): Promise<ScoreBin[]> {
  const rows = await prisma.risiko.findMany({
    where: { isLatest: true, siswa: scope },
    select: { skor: true },
  });
  const bins: ScoreBin[] = SCORE_BIN_LABELS.map((bin) => ({ bin, count: 0 }));
  for (const r of rows) {
    bins[scoreBinIndex(r.skor)]!.count += 1;
  }
  return bins;
}

/* ── RISIKO: sumber scoring (rule vs ml) ───────────────────────────────── */
export async function riskSourceBreakdown(scope: RiskScope): Promise<{ sumber: string; count: number }[]> {
  const grouped = await prisma.risiko.groupBy({
    by: ["sumber"],
    where: { isLatest: true, siswa: scope },
    _count: true,
  });
  return grouped.map((g) => ({ sumber: g.sumber, count: g._count }));
}

/* ── RISIKO: Δ merah bulan-ke-bulan per provinsi (heatmap delta) ────────── */
export interface ProvinceDelta {
  provinsi: string;
  bulanLalu: number;
  bulanIni: number;
  delta: number;
}

export async function riskDeltaByProvinsi(): Promise<ProvinceDelta[]> {
  const now = new Date();
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [prov, rows] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.risiko.findMany({
      where: { kategori: "merah", tanggalHitung: { gte: prevStart } },
      select: { sekolahId: true, tanggalHitung: true },
    }),
  ]);
  const map = new Map<string, ProvinceDelta>();
  for (const p of new Set(prov.values())) map.set(p, { provinsi: p, bulanLalu: 0, bulanIni: 0, delta: 0 });
  for (const r of rows) {
    const p = prov.get(r.sekolahId);
    if (!p) continue;
    const e = map.get(p)!;
    if (r.tanggalHitung >= curStart) e.bulanIni += 1;
    else if (r.tanggalHitung >= prevStart) e.bulanLalu += 1;
  }
  for (const e of map.values()) e.delta = e.bulanIni - e.bulanLalu;
  return Array.from(map.values()).sort((a, b) => b.delta - a.delta);
}

/* ── RISIKO: tren faktor dominan per bulan (multi-line) ─────────────────── */
export interface FactorTrendPoint {
  label: string;
  [factor: string]: string | number;
}

export async function factorTrendMonthly(scope: RiskScope): Promise<{ points: FactorTrendPoint[]; factors: string[] }> {
  const since = new Date();
  since.setMonth(since.getMonth() - 5, 1); // 6 bulan terakhir (faktor lebih padat)
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.risiko.findMany({
    where: { tanggalHitung: { gte: since }, kategori: { in: ["merah", "kuning"] }, siswa: scope },
    select: { tanggalHitung: true, alasanJson: true },
  });
  const now = new Date();
  const buckets = new Map<string, FactorTrendPoint>();
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { label: monthLabel(d) });
  }
  const factorSet = new Set<string>();
  for (const r of rows) {
    const b = buckets.get(monthKey(r.tanggalHitung));
    if (!b) continue;
    try {
      const raw = JSON.parse(r.alasanJson) as { alasan?: { kode?: string }[] };
      const seen = new Set<string>();
      for (const a of raw.alasan ?? []) {
        if (!a.kode) continue;
        const g = FACTOR_GROUP[a.kode] ?? "Lainnya";
        if (seen.has(g)) continue;
        seen.add(g);
        factorSet.add(g);
        b[g] = ((b[g] as number) ?? 0) + 1;
      }
    } catch {
      /* abaikan baris rusak */
    }
  }
  const factors = Array.from(factorSet);
  for (const b of buckets.values()) for (const f of factors) if (b[f] == null) b[f] = 0;
  return { points: Array.from(buckets.values()), factors };
}

/* ── KEHADIRAN: tren 12 bulan per status (stacked area) ─────────────────── */
export interface AttendanceMonth {
  label: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  telat: number;
}

export async function attendanceTrendMonthly(scope: RiskScope): Promise<AttendanceMonth[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.absensi.findMany({
    where: { tanggal: { gte: since }, siswa: scope },
    select: { tanggal: true, status: true },
  });
  const now = new Date();
  const buckets = new Map<string, AttendanceMonth>();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { label: monthLabel(d), hadir: 0, izin: 0, sakit: 0, alpa: 0, telat: 0 });
  }
  for (const r of rows) {
    const b = buckets.get(monthKey(r.tanggal));
    if (b) b[r.status] += 1;
  }
  return Array.from(buckets.values());
}

/* ── KEHADIRAN: distribusi status 30 hari (donut, semua 5 status) ──────── */
export async function attendanceStatusDist(scope: RiskScope): Promise<{ status: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const grouped = await prisma.absensi.groupBy({
    by: ["status"],
    where: { tanggal: { gte: since }, siswa: scope },
    _count: true,
  });
  return grouped.map((g) => ({ status: g.status, count: g._count }));
}

/* ── KEHADIRAN: tren alpa harian 30 hari (area) ────────────────────────── */
export async function dailyAlpaTrend(scope: RiskScope, days = 30): Promise<{ label: string; value: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.absensi.findMany({
    where: { status: "alpa", tanggal: { gte: since }, siswa: scope },
    select: { tanggal: true },
  });
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const buckets = new Map<string, { label: string; value: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.set(dayKey(d), { label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), value: 0 });
  }
  for (const r of rows) {
    const b = buckets.get(dayKey(r.tanggal));
    if (b) b.value += 1;
  }
  return Array.from(buckets.values());
}

/* ── KEHADIRAN: per provinsi (%hadir/%alpa/kronis) ─────────────────────── */
export interface ProvinceAttendance {
  provinsi: string;
  pctHadir: number;
  pctAlpa: number;
  total: number;
}

export async function attendanceByProvinsi(): Promise<ProvinceAttendance[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [prov, rows] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.absensi.findMany({
      where: { tanggal: { gte: since } },
      select: { status: true, siswa: { select: { sekolahId: true } } },
    }),
  ]);
  const agg = new Map<string, { hadir: number; alpa: number; total: number }>();
  for (const p of new Set(prov.values())) agg.set(p, { hadir: 0, alpa: 0, total: 0 });
  for (const r of rows) {
    const p = prov.get(r.siswa.sekolahId);
    if (!p) continue;
    const e = agg.get(p)!;
    e.total += 1;
    if (r.status === "hadir") e.hadir += 1;
    if (r.status === "alpa") e.alpa += 1;
  }
  return Array.from(agg.entries())
    .map(([provinsi, e]) => ({
      provinsi,
      pctHadir: e.total > 0 ? Math.round((e.hadir / e.total) * 100) : 0,
      pctAlpa: e.total > 0 ? Math.round((e.alpa / e.total) * 100) : 0,
      total: e.total,
    }))
    .sort((a, b) => b.pctAlpa - a.pctAlpa);
}

/* ── KEHADIRAN: siswa kronis (≥5 alpa/30hr) per provinsi ───────────────── */
export async function chronicAbsenteeByProvinsi(): Promise<{ provinsi: string; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [prov, perSiswa] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.absensi.groupBy({
      by: ["siswaId"],
      where: { status: "alpa", tanggal: { gte: since } },
      _count: true,
    }),
  ]);
  const kronisIds = perSiswa.reduce<string[]>((acc, a) => {
    if (a._count >= 5) acc.push(a.siswaId);
    return acc;
  }, []);
  if (kronisIds.length === 0) return [];
  const siswa = await prisma.siswa.findMany({ where: { id: { in: kronisIds } }, select: { sekolahId: true } });
  const tally = new Map<string, number>();
  for (const p of new Set(prov.values())) tally.set(p, 0);
  for (const s of siswa) {
    const p = prov.get(s.sekolahId);
    if (p) tally.set(p, (tally.get(p) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([provinsi, count]) => ({ provinsi, count }))
    .sort((a, b) => b.count - a.count);
}

/* ── INTERVENSI: cakupan per provinsi (diintervensi / berisiko) ────────── */
export interface ProvinceCoverage {
  provinsi: string;
  berisiko: number;
  diintervensi: number;
  pct: number;
}

export async function interventionCoverageByProvinsi(): Promise<ProvinceCoverage[]> {
  const [prov, atRisk, intervened] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.risiko.findMany({
      where: { isLatest: true, kategori: { in: ["merah", "kuning"] } },
      select: { siswaId: true, sekolahId: true },
    }),
    prisma.intervensi.findMany({
      where: { deletedAt: null },
      select: { siswaId: true, sekolahId: true },
    }),
  ]);
  const riskByProv = new Map<string, Set<string>>();
  for (const r of atRisk) {
    const p = prov.get(r.sekolahId);
    if (!p) continue;
    (riskByProv.get(p) ?? riskByProv.set(p, new Set()).get(p)!).add(r.siswaId);
  }
  const intByProv = new Map<string, Set<string>>();
  for (const i of intervened) {
    const p = prov.get(i.sekolahId);
    if (!p) continue;
    (intByProv.get(p) ?? intByProv.set(p, new Set()).get(p)!).add(i.siswaId);
  }
  const out: ProvinceCoverage[] = [];
  for (const [provinsi, riskSet] of riskByProv) {
    const berisiko = riskSet.size;
    // hanya hitung siswa yang berisiko DAN diintervensi
    const intSet = intByProv.get(provinsi) ?? new Set();
    let diintervensi = 0;
    for (const id of riskSet) if (intSet.has(id)) diintervensi += 1;
    out.push({ provinsi, berisiko, diintervensi, pct: berisiko > 0 ? Math.round((diintervensi / berisiko) * 100) : 0 });
  }
  return out.sort((a, b) => a.pct - b.pct);
}

/* ── INTERVENSI: tren per jenis (stacked area) ─────────────────────────── */
export async function interventionTrendByJenis(scope: RiskScope): Promise<{ points: FactorTrendPoint[]; jenis: { key: string; label: string }[] }> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.intervensi.findMany({
    where: { deletedAt: null, tanggal: { gte: since }, siswa: scope },
    select: { tanggal: true, jenis: true },
  });
  const now = new Date();
  const buckets = new Map<string, FactorTrendPoint>();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { label: monthLabel(d) });
  }
  const jenisSet = new Set<string>();
  for (const r of rows) {
    const b = buckets.get(monthKey(r.tanggal));
    if (!b) continue;
    jenisSet.add(r.jenis);
    b[r.jenis] = ((b[r.jenis] as number) ?? 0) + 1;
  }
  const jenis = Array.from(jenisSet).map((k) => ({ key: k, label: JENIS_LABEL[k] ?? k }));
  for (const b of buckets.values()) for (const j of jenis) if (b[j.key] == null) b[j.key] = 0;
  return { points: Array.from(buckets.values()), jenis };
}

/* ── INTERVENSI: pelaku teraktif ───────────────────────────────────────── */
export async function topIntervenors(scope: RiskScope, take = 10): Promise<{ nama: string; count: number }[]> {
  const grouped = await prisma.intervensi.groupBy({
    by: ["olehUserId"],
    where: { deletedAt: null, siswa: scope },
    _count: true,
    orderBy: { _count: { olehUserId: "desc" } },
    take,
  });
  if (grouped.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.olehUserId) } },
    select: { id: true, nama: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.nama]));
  return grouped.map((g) => ({ nama: nameOf.get(g.olehUserId) ?? "—", count: g._count }));
}

/* ── AKADEMIK (model Nilai): rata-rata & %tuntas per mapel ─────────────── */
export interface MapelStat {
  mapel: string;
  rataRata: number;
  pctTuntas: number;
  total: number;
}

/** Periode terbaru = paling akhir secara leksikografis ("2026-genap" > "2025-ganjil"). */
async function periodeTerbaru(scope: RiskScope): Promise<string | null> {
  const rows = await prisma.nilai.findMany({
    where: { siswa: scope },
    select: { periode: true },
    distinct: ["periode"],
    orderBy: { periode: "desc" },
    take: 1,
  });
  return rows[0]?.periode ?? null;
}

export async function gradeByMapel(scope: RiskScope): Promise<MapelStat[]> {
  const periode = await periodeTerbaru(scope);
  if (!periode) return [];
  const rows = await prisma.nilai.findMany({
    where: { periode, siswa: scope },
    select: { mapel: true, nilai: true, kkm: true },
  });
  const agg = new Map<string, { sum: number; tuntas: number; n: number }>();
  for (const r of rows) {
    const e = agg.get(r.mapel) ?? { sum: 0, tuntas: 0, n: 0 };
    e.sum += r.nilai;
    e.n += 1;
    if (r.nilai >= r.kkm) e.tuntas += 1;
    agg.set(r.mapel, e);
  }
  return Array.from(agg.entries())
    .map(([mapel, e]) => ({
      mapel,
      rataRata: e.n > 0 ? Math.round((e.sum / e.n) * 10) / 10 : 0,
      pctTuntas: e.n > 0 ? Math.round((e.tuntas / e.n) * 100) : 0,
      total: e.n,
    }))
    .sort((a, b) => a.rataRata - b.rataRata);
}

/* ── AKADEMIK: jumlah siswa di bawah KKM per mapel (periode terbaru) ───── */
export async function belowKkmByMapel(scope: RiskScope): Promise<{ mapel: string; count: number }[]> {
  const stats = await gradeByMapel(scope);
  return stats
    .map((s) => ({ mapel: s.mapel, count: Math.round(((100 - s.pctTuntas) / 100) * s.total) }))
    .sort((a, b) => b.count - a.count);
}

/* ── AKADEMIK: tren rata-rata nilai per periode ────────────────────────── */
export async function gradeTrendByPeriode(scope: RiskScope): Promise<{ label: string; value: number }[]> {
  const rows = await prisma.nilai.groupBy({
    by: ["periode"],
    where: { siswa: scope },
    _avg: { nilai: true },
    orderBy: { periode: "asc" },
  });
  return rows.map((r) => ({ label: r.periode, value: r._avg.nilai != null ? Math.round(r._avg.nilai * 10) / 10 : 0 }));
}

/* ── AKADEMIK: per provinsi (rata-rata nilai + %tuntas) ────────────────── */
export async function academicByProvinsi(): Promise<{ provinsi: string; rataRata: number; pctTuntas: number }[]> {
  const periode = await periodeTerbaru({});
  if (!periode) return [];
  const [prov, rows] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.nilai.findMany({
      where: { periode },
      select: { nilai: true, kkm: true, siswa: { select: { sekolahId: true } } },
    }),
  ]);
  const agg = new Map<string, { sum: number; tuntas: number; n: number }>();
  for (const r of rows) {
    const p = prov.get(r.siswa.sekolahId);
    if (!p) continue;
    const e = agg.get(p) ?? { sum: 0, tuntas: 0, n: 0 };
    e.sum += r.nilai;
    e.n += 1;
    if (r.nilai >= r.kkm) e.tuntas += 1;
    agg.set(p, e);
  }
  return Array.from(agg.entries())
    .map(([provinsi, e]) => ({
      provinsi,
      rataRata: e.n > 0 ? Math.round((e.sum / e.n) * 10) / 10 : 0,
      pctTuntas: e.n > 0 ? Math.round((e.tuntas / e.n) * 100) : 0,
    }))
    .sort((a, b) => a.rataRata - b.rataRata);
}

/* ── DEMOGRAFI: risiko per jenis kelamin (field non-terenkripsi) ───────── */
export interface GroupRisk {
  grup: string;
  merah: number;
  kuning: number;
  hijau: number;
}

export async function riskByGender(scope: RiskScope): Promise<GroupRisk[]> {
  const siswa = await prisma.siswa.findMany({
    where: scope,
    select: { jenisKelamin: true, risiko: { where: { isLatest: true }, select: { kategori: true }, take: 1 } },
  });
  const label = (g: string | null) => (g === "L" ? "Laki-laki" : g === "P" ? "Perempuan" : "Tidak diisi");
  const map = new Map<string, GroupRisk>();
  for (const s of siswa) {
    const key = label(s.jenisKelamin);
    const e = map.get(key) ?? { grup: key, merah: 0, kuning: 0, hijau: 0 };
    const kat = s.risiko[0]?.kategori;
    if (kat) e[kat] += 1;
    map.set(key, e);
  }
  return Array.from(map.values());
}

/* ── DEMOGRAFI: risiko KIP vs non-KIP ──────────────────────────────────── */
export async function riskByKip(scope: RiskScope): Promise<GroupRisk[]> {
  const siswa = await prisma.siswa.findMany({
    where: scope,
    select: { penerimaKip: true, risiko: { where: { isLatest: true }, select: { kategori: true }, take: 1 } },
  });
  const map = new Map<string, GroupRisk>([
    ["Penerima KIP", { grup: "Penerima KIP", merah: 0, kuning: 0, hijau: 0 }],
    ["Non-KIP", { grup: "Non-KIP", merah: 0, kuning: 0, hijau: 0 }],
  ]);
  for (const s of siswa) {
    const e = map.get(s.penerimaKip ? "Penerima KIP" : "Non-KIP")!;
    const kat = s.risiko[0]?.kategori;
    if (kat) e[kat] += 1;
  }
  return Array.from(map.values());
}

/* ── DEMOGRAFI: distribusi jarak ke sekolah (histogram) ────────────────── */
export async function distanceDistribution(scope: RiskScope): Promise<ScoreBin[]> {
  const siswa = await prisma.siswa.findMany({ where: scope, select: { jarakKm: true } });
  const bins: ScoreBin[] = DISTANCE_LABELS.map((bin) => ({ bin, count: 0 }));
  for (const s of siswa) {
    if (s.jarakKm == null) continue;
    bins[distanceBinIndex(s.jarakKm)]!.count += 1;
  }
  return bins;
}

/* ── PUTUS SEKOLAH: total per provinsi (sudahDropout) ──────────────────── */
export async function dropoutByProvinsi(): Promise<{ provinsi: string; count: number }[]> {
  const [prov, rows] = await Promise.all([
    sekolahProvinsiMap(),
    prisma.siswa.findMany({ where: { sudahDropout: true }, select: { sekolahId: true } }),
  ]);
  const tally = new Map<string, number>();
  for (const p of new Set(prov.values())) tally.set(p, 0);
  for (const r of rows) {
    const p = prov.get(r.sekolahId);
    if (p) tally.set(p, (tally.get(p) ?? 0) + 1);
  }
  return Array.from(tally.entries())
    .map(([provinsi, count]) => ({ provinsi, count }))
    .sort((a, b) => b.count - a.count);
}

/* ── PUTUS SEKOLAH: tren bulanan (nonaktifSejak) ───────────────────────── */
export async function dropoutTrend(scope: RiskScope): Promise<{ label: string; value: number }[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.siswa.findMany({
    where: { sudahDropout: true, nonaktifSejak: { gte: since }, ...scope },
    select: { nonaktifSejak: true },
  });
  const now = new Date();
  const buckets = new Map<string, { label: string; value: number }>();
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    buckets.set(monthKey(d), { label: monthLabel(d), value: 0 });
  }
  for (const r of rows) {
    if (!r.nonaktifSejak) continue;
    const b = buckets.get(monthKey(r.nonaktifSejak));
    if (b) b.value += 1;
  }
  return Array.from(buckets.values());
}

/* ── Total dropout (KPI) ───────────────────────────────────────────────── */
export async function dropoutTotal(scope: RiskScope): Promise<number> {
  return prisma.siswa.count({ where: { sudahDropout: true, ...scope } });
}

/* ═══════════════════════════════════════════════════════════════════════
   TAMBAHAN — analitik untuk HALAMAN ADMIN (tenant/users/audit/security).
   Semua agregat, REAL, zero schema change.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── TENANT: skala platform per provinsi ───────────────────────────────── */
export interface PlatformProvinsi {
  provinsi: string;
  sekolah: number;
  siswa: number;
  pengguna: number;
}

export async function platformByProvinsi(): Promise<PlatformProvinsi[]> {
  const sekolah = await prisma.sekolah.findMany({
    select: {
      wilayah: { select: { provinsi: true } },
      _count: { select: { siswa: true, users: true } },
    },
  });
  return transformPlatformByProvinsi(
    sekolah.map((s) => ({ provinsi: s.wilayah.provinsi, siswaCount: s._count.siswa, usersCount: s._count.users })),
  );
}

/* ── TENANT: baris sekolah + komposisi risiko (semua wilayah) ──────────── */
export interface SchoolRow {
  id: string;
  nama: string;
  npsn: string;
  provinsi: string;
  kabupaten: string;
  siswa: number;
  pengguna: number;
  merah: number;
  kuning: number;
  hijau: number;
  aktif: boolean;
}

export async function schoolRiskRows(): Promise<SchoolRow[]> {
  const [sekolah, grouped] = await Promise.all([
    prisma.sekolah.findMany({
      select: {
        id: true,
        nama: true,
        npsn: true,
        wilayah: { select: { provinsi: true, kabupaten: true } },
        _count: { select: { siswa: true, users: true } },
      },
      orderBy: { nama: "asc" },
    }),
    prisma.risiko.groupBy({ by: ["sekolahId", "kategori"], where: { isLatest: true }, _count: true }),
  ]);
  const riskOf = new Map<string, { merah: number; kuning: number; hijau: number }>();
  for (const g of grouped) {
    const e = riskOf.get(g.sekolahId) ?? { merah: 0, kuning: 0, hijau: 0 };
    e[g.kategori] += g._count;
    riskOf.set(g.sekolahId, e);
  }
  return sekolah.map((s) => {
    const r = riskOf.get(s.id) ?? { merah: 0, kuning: 0, hijau: 0 };
    return {
      id: s.id,
      nama: s.nama,
      npsn: s.npsn,
      provinsi: s.wilayah.provinsi,
      kabupaten: s.wilayah.kabupaten,
      siswa: s._count.siswa,
      pengguna: s._count.users,
      merah: r.merah,
      kuning: r.kuning,
      hijau: r.hijau,
      aktif: s._count.users > 0,
    };
  });
}

/* ── AUDIT: tren aktivitas harian (n hari) ─────────────────────────────── */
export async function auditActivityTrend(days = 14): Promise<{ label: string; value: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.auditLog.findMany({
    where: { timestamp: { gte: since } },
    select: { timestamp: true },
  });
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const buckets = new Map<string, { label: string; value: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    buckets.set(dayKey(d), { label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), value: 0 });
  }
  for (const r of rows) {
    const b = buckets.get(dayKey(r.timestamp));
    if (b) b.value += 1;
  }
  return Array.from(buckets.values());
}

/* ── AUDIT: breakdown jenis aksi ───────────────────────────────────────── */
export async function auditByAksi(take = 8): Promise<{ aksi: string; count: number }[]> {
  const grouped = await prisma.auditLog.groupBy({ by: ["aksi"], _count: true });
  return transformAuditByAksi(grouped.map((g) => ({ aksi: g.aksi, count: g._count })), take);
}

/* ── USERS: distribusi per peran (+ aktif/nonaktif) ────────────────────── */
export interface RoleCount {
  role: string;
  total: number;
  aktif: number;
}

export async function usersByRole(): Promise<RoleCount[]> {
  const grouped = await prisma.user.groupBy({ by: ["role", "aktif"], _count: true });
  return transformUsersByRole(grouped.map((g) => ({ role: g.role, aktif: g.aktif, count: g._count })));
}

/* ── SECURITY: kepatuhan consent per sekolah ───────────────────────────── */
export interface ConsentSchoolRow {
  id: string;
  nama: string;
  granted: number;
  pending: number;
  revoked: number;
  total: number;
  pctGranted: number;
}

export async function consentBySekolah(): Promise<ConsentSchoolRow[]> {
  const [sekolah, grouped] = await Promise.all([
    prisma.sekolah.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } }),
    prisma.siswa.groupBy({ by: ["sekolahId", "consentStatus"], _count: true }),
  ]);
  return transformConsentBySekolah(
    sekolah,
    grouped.map((g) => ({ sekolahId: g.sekolahId, consentStatus: g.consentStatus, count: g._count })),
  );
}
