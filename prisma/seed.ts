/**
 * Seed data SINTETIS lengkap multi-tenant (Opsi B).
 * Wilayah -> Sekolah -> Kelas -> Siswa. Role: superadmin, dinas, kepsek, guru, bk.
 * Mencakup semua kategori risiko + dropout retrospektif + intervensi + audit + sync log.
 * TIDAK menggunakan data siswa asli. Deterministik (faker.seed).
 */
import {
  PrismaClient,
  type AbsensiStatus,
  type Prisma,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { scoreSiswa } from "../src/lib/scoring/rules";
import type { SiswaInput } from "../src/lib/scoring/types";
import { encodePII } from "../src/lib/siswaPII";

const prisma = new PrismaClient();
faker.seed(2026);

const MAPEL = ["Matematika", "Bahasa Indonesia", "IPA", "IPS", "PPKn"];
const PERIODE_LALU = "2025-ganjil";
const PERIODE_KINI = "2026-genap";

type Profil = "sehat" | "waspada" | "kritis" | "dropout" | "data_minim";

function pick<T>(arr: T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })]!;
}

function configProfil(p: Profil) {
  switch (p) {
    case "sehat": return { alpaRate: 0.03, turun: [-3, 4], base: [78, 95], kip: 0.1, ekonomi: ["mampu"], jarak: [0, 4] };
    case "waspada": return { alpaRate: 0.13, turun: [6, 12], base: [68, 80], kip: 0.4, ekonomi: ["kurang_mampu", "mampu"], jarak: [3, 8] };
    case "kritis": return { alpaRate: 0.28, turun: [12, 22], base: [55, 72], kip: 0.7, ekonomi: ["miskin", "kurang_mampu"], jarak: [5, 14] };
    case "dropout": return { alpaRate: 0.35, turun: [15, 25], base: [50, 68], kip: 0.8, ekonomi: ["miskin"], jarak: [6, 16] };
    case "data_minim": return { alpaRate: 0.1, turun: [0, 0], base: [70, 85], kip: 0.2, ekonomi: ["kurang_mampu"], jarak: [0, 5] };
  }
}

async function bersihkan() {
  // Hapus per-level FK: tabel daun paralel, lalu naik ke induk.
  await Promise.all([
    prisma.auditLog.deleteMany(),
    prisma.syncLog.deleteMany(),
    prisma.intervensi.deleteMany(),
    prisma.risiko.deleteMany(),
    prisma.nilai.deleteMany(),
    prisma.absensi.deleteMany(),
  ]);
  await prisma.siswa.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sekolah.deleteMany();
  await prisma.wilayah.deleteMany();
}

async function buatSiswa(
  sekolahId: string,
  kelasId: string,
  nisn: string,
  profil: Profil
): Promise<{ siswaId: string; input: SiswaInput }> {
  const c = configProfil(profil);
  const dataMinim = profil === "data_minim";

  const statusEkonomi = pick(c.ekonomi);
  const statusKeluarga =
    profil === "dropout" || profil === "kritis"
      ? pick(["yatim", "wali", "ortu_lengkap", "piatu"])
      : "ortu_lengkap";

  const siswa = await prisma.siswa.create({
    data: {
      nisn,
      nama: faker.person.fullName(),
      sekolahId,
      kelasId,
      jenisKelamin: pick(["L", "P"]),
      penerimaKip: faker.datatype.boolean(c.kip),
      jarakKm: faker.number.float({ min: c.jarak[0]!, max: c.jarak[1]! }),
      ...(await encodePII({ statusEkonomi, statusKeluarga })),
      consentStatus: "granted", // demo: anggap ortu sudah setuju agar bisa di-scoring
      sudahDropout: profil === "dropout",
    },
  });

  const totalHari = 40;
  let hariAlpa = 0, alpaBeruntunMaks = 0, beruntun = 0, jumlahTelat = 0;
  const absensiData: Prisma.AbsensiCreateManyInput[] = [];
  for (let d = 0; d < totalHari; d++) {
    const tanggal = faker.date.recent({ days: 60 - d });
    let status: AbsensiStatus = "hadir";
    const roll = faker.number.float({ min: 0, max: 1 });
    if (roll < c.alpaRate) {
      status = "alpa"; hariAlpa++; beruntun++; alpaBeruntunMaks = Math.max(alpaBeruntunMaks, beruntun);
    } else {
      beruntun = 0;
      if (roll < c.alpaRate + 0.05) {
        status = pick(["izin", "sakit", "telat"]) as AbsensiStatus;
        if (status === "telat") jumlahTelat++;
      }
    }
    absensiData.push({ siswaId: siswa.id, tanggal, status });
  }
  await prisma.absensi.createMany({ data: absensiData });

  let mapelDiBawahKkm = 0, rataLalu = 0, rataKini = 0, nMat = 0, nBin = 0;
  const nilaiRows: Prisma.NilaiCreateManyInput[] = [];
  for (const mapel of MAPEL) {
    const base = faker.number.int({ min: c.base[0]!, max: c.base[1]! });
    const turun = faker.number.int({ min: c.turun[0]!, max: c.turun[1]! });
    const kini = Math.max(0, base - turun);
    if (!dataMinim) {
      nilaiRows.push({ siswaId: siswa.id, mapel, periode: PERIODE_LALU, nilai: base, kkm: 70 });
      rataLalu += base;
    }
    nilaiRows.push({ siswaId: siswa.id, mapel, periode: PERIODE_KINI, nilai: kini, kkm: 70 });
    rataKini += kini;
    if (kini < 70) mapelDiBawahKkm++;
    if (mapel === "Matematika") nMat = kini;
    if (mapel === "Bahasa Indonesia") nBin = kini;
  }
  await prisma.nilai.createMany({ data: nilaiRows });
  rataLalu /= MAPEL.length; rataKini /= MAPEL.length;

  const input: SiswaInput = {
    id: siswa.id, nama: siswa.nama, totalHari, hariAlpa, alpaBeruntunMaks, jumlahTelat,
    catatanDisiplin: profil === "kritis" || profil === "dropout" ? faker.number.int({ min: 0, max: 3 }) : 0,
    partisipasi: profil === "sehat" ? 3 : profil === "waspada" ? 2 : faker.number.int({ min: 1, max: 2 }),
    pctTugasTidakKumpul: profil === "dropout" ? 70 : profil === "kritis" ? 50 : profil === "waspada" ? 25 : 5,
    rataNilaiSekarang: rataKini, rataNilaiSebelumnya: dataMinim ? undefined : rataLalu,
    mapelDiBawahKkm, pernahTinggalKelas: profil === "dropout" ? faker.datatype.boolean(0.4) : false,
    nilaiMatematika: nMat, nilaiBahasa: nBin, kkm: 70,
    penerimaKip: siswa.penerimaKip, statusEkonomi,
    jarakKm: siswa.jarakKm ?? undefined, statusKeluarga,
  };
  return { siswaId: siswa.id, input };
}

async function main() {
  console.log("Seeding multi-tenant (data sintetis)...");
  await bersihkan();

  // ===== Wilayah =====
  const wilayah = await prisma.wilayah.create({ data: { provinsi: "Jawa Tengah", kabupaten: "Kabupaten Sintetis" } });

  // ===== Sekolah dalam wilayah ===== (independen -> paralel)
  const [sekolahA, sekolahB] = await Promise.all([
    prisma.sekolah.create({ data: { npsn: "20200001", nama: "SMP Negeri Sintetis 1", wilayahId: wilayah.id } }),
    prisma.sekolah.create({ data: { npsn: "20200002", nama: "SMP Negeri Sintetis 2 (3T)", wilayahId: wilayah.id } }),
  ]);

  const [kelas8A, kelas8B, kelas9A] = await Promise.all([
    prisma.kelas.create({ data: { sekolahId: sekolahA.id, nama: "VIII-A" } }),
    prisma.kelas.create({ data: { sekolahId: sekolahA.id, nama: "VIII-B" } }),
    prisma.kelas.create({ data: { sekolahId: sekolahB.id, nama: "IX-A" } }),
  ]);

  // ===== Users (semua role + tenant) =====
  // Email & password default per-role dari env (fallback ke nilai demo).
  const pwFor = (role: string) =>
    process.env[`SEED_PASSWORD_${role.toUpperCase()}`] ||
    process.env.SEED_PASSWORD ||
    "password123";
  const email = {
    super: process.env.SEED_EMAIL_SUPERADMIN || "super@demo.test",
    dinas: process.env.SEED_EMAIL_DINAS || "dinas@demo.test",
    kepsek: process.env.SEED_EMAIL_KEPSEK || "kepsek@demo.test",
    guru: process.env.SEED_EMAIL_GURU || "guru@demo.test",
    guru2: process.env.SEED_EMAIL_GURU2 || "guru2@demo.test",
    bk: process.env.SEED_EMAIL_BK || "bk@demo.test",
  };
  const [phSuper, phDinas, phKepsek, phGuru, phBk] = await Promise.all([
    bcrypt.hash(pwFor("superadmin"), 10),
    bcrypt.hash(pwFor("dinas"), 10),
    bcrypt.hash(pwFor("kepsek"), 10),
    bcrypt.hash(pwFor("guru"), 10),
    bcrypt.hash(pwFor("bk"), 10),
  ]);
  const [, , , guru, , bk] = await Promise.all([
    prisma.user.create({ data: { nama: "Super Admin", email: email.super, passwordHash: phSuper, role: "superadmin" } }),
    prisma.user.create({ data: { nama: "Dinas Pendidikan", email: email.dinas, passwordHash: phDinas, role: "dinas", wilayahId: wilayah.id } }),
    prisma.user.create({ data: { nama: "Kepala SMP 1", email: email.kepsek, passwordHash: phKepsek, role: "kepsek", sekolahId: sekolahA.id } }),
    prisma.user.create({ data: { nama: "Wali VIII-A", email: email.guru, passwordHash: phGuru, role: "guru", sekolahId: sekolahA.id, kelasId: kelas8A.id } }),
    prisma.user.create({ data: { nama: "Wali VIII-B", email: email.guru2, passwordHash: phGuru, role: "guru", sekolahId: sekolahA.id, kelasId: kelas8B.id } }),
    prisma.user.create({ data: { nama: "Guru BK SMP 1", email: email.bk, passwordHash: phBk, role: "bk", sekolahId: sekolahA.id } }),
  ]);

  // ===== Distribusi profil =====
  const distribusi: { sekolahId: string; kelasId: string; profil: Profil }[] = [];
  const tambah = (sekolahId: string, kelasId: string, profil: Profil, n: number) => {
    for (let i = 0; i < n; i++) distribusi.push({ sekolahId, kelasId, profil });
  };
  tambah(sekolahA.id, kelas8A.id, "sehat", 12);
  tambah(sekolahA.id, kelas8A.id, "waspada", 8);
  tambah(sekolahA.id, kelas8A.id, "kritis", 5);
  tambah(sekolahA.id, kelas8A.id, "dropout", 4);
  tambah(sekolahA.id, kelas8A.id, "data_minim", 2);
  tambah(sekolahA.id, kelas8B.id, "sehat", 18);
  tambah(sekolahA.id, kelas8B.id, "waspada", 6);
  tambah(sekolahA.id, kelas8B.id, "kritis", 2);
  tambah(sekolahB.id, kelas9A.id, "sehat", 6);
  tambah(sekolahB.id, kelas9A.id, "waspada", 8);
  tambah(sekolahB.id, kelas9A.id, "kritis", 8);
  tambah(sekolahB.id, kelas9A.id, "dropout", 6);

  let nisnCtr = 1000000000;
  const tally: Record<string, number> = { hijau: 0, kuning: 0, merah: 0 };
  let dropoutMerah = 0, totalDropout = 0;
  const siswaMerah: { id: string; sekolahId: string }[] = [];
  const risikoRows: Prisma.RisikoCreateManyInput[] = [];

  for (const d of distribusi) {
    const nisn = String(nisnCtr++).padStart(10, "0");
    const { siswaId, input } = await buatSiswa(d.sekolahId, d.kelasId, nisn, d.profil);
    const hasil = scoreSiswa(input);
    risikoRows.push({
      siswaId, sekolahId: d.sekolahId, kategori: hasil.kategori, skor: hasil.skor,
      alasanJson: JSON.stringify({ alasan: hasil.alasan, saran: hasil.saran }),
      sumber: "rule", configVersion: hasil.configVersion,
    });
    tally[hasil.kategori] = (tally[hasil.kategori] ?? 0) + 1;
    if (hasil.kategori === "merah") siswaMerah.push({ id: siswaId, sekolahId: d.sekolahId });
    if (d.profil === "dropout") { totalDropout++; if (hasil.kategori === "merah") dropoutMerah++; }
  }
  await prisma.risiko.createMany({ data: risikoRows });

  // ── Snapshot risiko HISTORIS (11 bulan ke belakang) ──────────────────
  // Membuat tren 12 bulan & delta bulan-ke-bulan menjadi DATA NYATA (bukan
  // dikarang saat baca). Deterministik: tiap siswa "membaik" dari masa lalu
  // ke sekarang (lebih banyak merah di masa lalu) untuk mengilustrasikan
  // dampak intervensi. Snapshot lama isLatest=false.
  const KATEGORI_ORDER: ("hijau" | "kuning" | "merah")[] = ["hijau", "kuning", "merah"];
  const KATEGORI_IDX: Record<string, number> = { hijau: 0, kuning: 1, merah: 2 };
  const histRows: Prisma.RisikoCreateManyInput[] = [];
  const now = new Date();
  for (let m = 11; m >= 1; m--) {
    const tanggal = new Date(now.getFullYear(), now.getMonth() - m, 15);
    for (let i = 0; i < risikoRows.length; i++) {
      const cur = risikoRows[i]!;
      const curIdx = KATEGORI_IDX[cur.kategori as string] ?? 0;
      // Makin jauh ke belakang, makin besar peluang kategori lebih tinggi (memburuk).
      // Deterministik via (i + m) — tanpa Math.random.
      const bump = ((i * 7 + m * 13) % 12 < m) ? 1 : 0; // makin lama makin sering +1
      const histIdx = Math.min(2, curIdx + bump);
      const kategori = KATEGORI_ORDER[histIdx]!;
      const skor = kategori === "merah" ? 70 : kategori === "kuning" ? 45 : 15;
      histRows.push({
        siswaId: cur.siswaId,
        sekolahId: cur.sekolahId,
        tanggalHitung: tanggal,
        kategori,
        skor,
        alasanJson: cur.alasanJson,
        sumber: "rule",
        configVersion: cur.configVersion,
        isLatest: false,
      });
    }
  }
  // chunk insert (hindari payload besar)
  for (let i = 0; i < histRows.length; i += 500) {
    await prisma.risiko.createMany({ data: histRows.slice(i, i + 500) });
  }

  // Intervensi pada beberapa siswa MERAH sekolah A (oleh guru/bk sekolah A)
  const merahA = siswaMerah.filter((s) => s.sekolahId === sekolahA.id).slice(0, 6);
  const jenis = ["kunjungan_rumah", "koordinasi_bk", "usul_kip", "konseling"];
  await prisma.intervensi.createMany({
    data: merahA.map((s) => ({
      siswaId: s.id, sekolahId: s.sekolahId, jenis: pick(jenis),
      catatan: faker.lorem.sentence(), olehUserId: guru.id, version: 1,
    })),
  });
  if (merahA[0]) {
    await prisma.intervensi.create({
      data: { siswaId: merahA[0].id, sekolahId: merahA[0].sekolahId, jenis: "konseling", catatan: "dibatalkan", olehUserId: bk.id, version: 1, deletedAt: new Date() },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      { userId: guru.id, sekolahId: sekolahA.id, aksi: "view", target: `siswa:${merahA[0]?.id ?? "-"}` },
      { userId: bk.id, sekolahId: sekolahA.id, aksi: "export", target: "kelas:VIII-A" },
    ],
  });

  await prisma.syncLog.createMany({
    data: [
      { idempotencyKey: randomUUID(), sekolahId: sekolahA.id, status: "applied" },
      { idempotencyKey: randomUUID(), sekolahId: sekolahA.id, status: "conflict", detailJson: JSON.stringify({ reason: "version mismatch" }) },
    ],
  });

  const recall = totalDropout > 0 ? ((dropoutMerah / totalDropout) * 100).toFixed(0) : "0";
  console.log("------------------------------------------------------");
  console.log(`Wilayah:1 Sekolah:2 Kelas:3 Siswa:${distribusi.length}`);
  console.log(`Risiko -> hijau:${tally.hijau} kuning:${tally.kuning} merah:${tally.merah}`);
  console.log(`Retrospektif: ${dropoutMerah}/${totalDropout} dropout terdeteksi MERAH (recall ~${recall}%)`);
  console.log("Login (email | role):");
  console.log(`  ${email.super}  | superadmin`);
  console.log(`  ${email.dinas}  | dinas`);
  console.log(`  ${email.kepsek} | kepsek`);
  console.log(`  ${email.guru}   | guru`);
  console.log(`  ${email.guru2}  | guru`);
  console.log(`  ${email.bk}     | bk`);
  console.log("Password & email dari env SEED_* (fallback ke nilai demo).");
  console.log("------------------------------------------------------");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
