// Tipe domain untuk mesin scoring JagaSekolah

export type Kategori = "hijau" | "kuning" | "merah";

/** Data mentah per siswa yang dibutuhkan untuk menghitung fitur. */
export interface SiswaInput {
  id: string;
  nama: string;
  // Absensi (30 hari terakhir / periode berjalan)
  totalHari: number;
  hariAlpa: number;
  alpaBeruntunMaks: number;
  jumlahTelat: number;
  absensiPerPeriode?: number[]; // % kehadiran tiap periode (untuk tren)
  // Behavior
  catatanDisiplin: number;
  partisipasi: number; // 1..3 (3 = aktif)
  pctTugasTidakKumpul: number; // 0..100
  // Course
  rataNilaiSekarang: number;
  rataNilaiSebelumnya?: number;
  mapelDiBawahKkm: number;
  pernahTinggalKelas: boolean;
  nilaiMatematika?: number;
  nilaiBahasa?: number;
  kkm: number;
  // Konteks lokal
  penerimaKip: boolean;
  statusEkonomi?: string; // "miskin" | "kurang_mampu" | "mampu"
  jarakKm?: number;
  statusKeluarga?: string; // "yatim" | "piatu" | "yatim_piatu" | "wali" | "ortu_lengkap"
}

/** Fitur ABC + konteks terhitung (ternormalisasi). */
export interface Features {
  // A
  pctAbsen: number;
  alpaBeruntun: number;
  trenAbsensiMemburuk: boolean;
  telatKronis: boolean;
  // B
  catatanDisiplin: number;
  partisipasiRendah: boolean;
  pctTugasTidakKumpul: number;
  // C
  nilaiTurun: number; // selisih turun (poin), 0 jika tidak turun
  mapelDiBawahKkm: number;
  pernahTinggalKelas: boolean;
  nilaiIntiRendah: boolean;
  // D
  faktorEkonomi: boolean;
  jarakJauh: boolean;
  keluargaRentan: boolean;
}

export interface AlasanItem {
  kode: string;
  pesan: string;
  bobot: number;
}

export interface HasilSkor {
  siswaId: string;
  kategori: Kategori;
  skor: number; // 0..100
  alasan: AlasanItem[];
  saran: string[];
  configVersion: string;
}
