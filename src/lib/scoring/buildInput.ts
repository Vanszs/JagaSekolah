import type { SiswaInput } from "@/lib/scoring/types";
import type { SiswaPII } from "@/lib/siswaPII";
import type { AbsensiStatus } from "@prisma/client";

const PERIODE_KINI = "2026-genap";
const PERIODE_LALU = "2025-ganjil";

/** Data siswa untuk membangun input scoring (hasil batch fetch). */
export interface SiswaWithData {
  id: string;
  nama: string;
  penerimaKip: boolean;
  jarakKm: number | null;
  absensi: { tanggal: Date; status: AbsensiStatus }[];
  nilai: { mapel: string; periode: string; nilai: number; kkm: number }[];
}

/**
 * Bangun SiswaInput. PURE - tanpa DB/crypto.
 * PII sudah didekripsi di pemanggil (decodePII) dan diberikan sebagai `pii`.
 */
export function buildSiswaInput(siswa: SiswaWithData, pii: SiswaPII): SiswaInput {
  const totalHari = siswa.absensi.length || 1;
  const hariAlpa = siswa.absensi.filter((a) => a.status === "alpa").length;
  const jumlahTelat = siswa.absensi.filter((a) => a.status === "telat").length;

  const sorted = siswa.absensi.toSorted(
    (a, b) => a.tanggal.getTime() - b.tanggal.getTime()
  );
  let beruntun = 0;
  let alpaBeruntunMaks = 0;
  for (const a of sorted) {
    if (a.status === "alpa") {
      beruntun++;
      alpaBeruntunMaks = Math.max(alpaBeruntunMaks, beruntun);
    } else beruntun = 0;
  }

  const nilaiKini = siswa.nilai.filter((n) => n.periode === PERIODE_KINI);
  const nilaiLalu = siswa.nilai.filter((n) => n.periode === PERIODE_LALU);
  const avg = (arr: { nilai: number }[]) =>
    arr.length ? arr.reduce((s, n) => s + n.nilai, 0) / arr.length : 0;

  const kkm = nilaiKini[0]?.kkm ?? 70;
  const mapelDiBawahKkm = nilaiKini.filter((n) => n.nilai < n.kkm).length;
  const find = (m: string) => nilaiKini.find((n) => n.mapel === m)?.nilai;

  return {
    id: siswa.id,
    nama: siswa.nama,
    totalHari,
    hariAlpa,
    alpaBeruntunMaks,
    jumlahTelat,
    catatanDisiplin: 0,
    partisipasi: 2,
    pctTugasTidakKumpul: 0,
    rataNilaiSekarang: avg(nilaiKini),
    rataNilaiSebelumnya: nilaiLalu.length ? avg(nilaiLalu) : undefined,
    mapelDiBawahKkm,
    pernahTinggalKelas: false,
    nilaiMatematika: find("Matematika"),
    nilaiBahasa: find("Bahasa Indonesia"),
    kkm,
    penerimaKip: siswa.penerimaKip,
    statusEkonomi: pii.statusEkonomi ?? undefined,
    jarakKm: siswa.jarakKm ?? undefined,
    statusKeluarga: pii.statusKeluarga ?? undefined,
  };
}
