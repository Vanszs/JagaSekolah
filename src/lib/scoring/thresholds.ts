// Ambang risiko - DAPAT DIKALIBRASI per sekolah.
// Angka default dari literatur (ABC). WAJIB dikalibrasi via validasi retrospektif.
import { createHash } from "node:crypto";

export interface Thresholds {
  // Attendance
  pctAbsenWaspada: number; // %
  pctAbsenKritis: number; // %
  alpaBeruntunFlag: number; // hari
  telatKronisPerBulan: number;
  // Course
  nilaiTurunFlag: number; // poin
  mapelDiBawahKkmFlag: number;
  // Skor -> kategori
  skorKuning: number; // >= ini => minimal kuning
  skorMerah: number; // >= ini => merah
  // Bobot tiap sinyal (menjumlah ke skor 0..100)
  bobot: Record<string, number>;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  pctAbsenWaspada: 10,
  pctAbsenKritis: 20,
  alpaBeruntunFlag: 3,
  telatKronisPerBulan: 6,
  nilaiTurunFlag: 10,
  mapelDiBawahKkmFlag: 3,
  skorKuning: 30,
  skorMerah: 60,
  bobot: {
    pctAbsenKritis: 30,
    pctAbsenWaspada: 15,
    alpaBeruntun: 20,
    trenAbsensiMemburuk: 10,
    telatKronis: 5,
    catatanDisiplin: 8,
    partisipasiRendah: 7,
    tugasTidakKumpul: 8,
    nilaiTurun: 15,
    mapelDiBawahKkm: 15,
    pernahTinggalKelas: 12,
    nilaiIntiRendah: 10,
    faktorEkonomi: 8,
    jarakJauh: 5,
    keluargaRentan: 7,
  },
};

/** Hash stabil dari konfigurasi ambang -> disimpan di Risiko.configVersion. */
export function configVersion(t: Thresholds = DEFAULT_THRESHOLDS): string {
  return createHash("sha256").update(stableStringify(t)).digest("hex").slice(0, 12);
}

/**
 * Serialisasi deterministik dengan key terurut REKURSIF.
 * Catatan: JSON.stringify(obj, keysArray) memakai array sebagai allowlist properti
 * (bukan pengurut) sehingga key bersarang seperti `bobot.*` ikut terpotong —
 * itu membuat perubahan bobot tidak mengubah hash. Fungsi ini menghindarinya.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const body = Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",");
  return `{${body}}`;
}
