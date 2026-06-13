import type { AlasanItem } from "./types";

/** Saran tindakan berdasarkan alasan yang muncul. */
export function buildSaran(alasan: AlasanItem[]): string[] {
  const kode = new Set(alasan.map((a) => a.kode));
  const saran: string[] = [];

  if (kode.has("absen_kritis") || kode.has("alpa_beruntun")) {
    saran.push("Lakukan kunjungan rumah / hubungi orang tua untuk cek penyebab ketidakhadiran.");
  }
  if (kode.has("absen_waspada") || kode.has("tren_absensi")) {
    saran.push("Pantau kehadiran harian; ajak bicara empat mata untuk identifikasi hambatan.");
  }
  if (kode.has("faktor_ekonomi")) {
    saran.push("Usulkan bantuan (KIP/PIP) dan koordinasi dengan operator Dapodik sekolah.");
  }
  if (kode.has("nilai_turun") || kode.has("mapel_kkm") || kode.has("nilai_inti")) {
    saran.push("Beri pendampingan belajar / remedial pada mapel bermasalah.");
  }
  if (kode.has("disiplin") || kode.has("partisipasi") || kode.has("tugas")) {
    saran.push("Koordinasi dengan Guru BK untuk konseling motivasi & keterlibatan.");
  }
  if (kode.has("telat")) {
    saran.push("Telusuri penyebab keterlambatan (transportasi/jadwal); sepakati solusi dengan siswa & orang tua.");
  }
  if (kode.has("tinggal_kelas")) {
    saran.push("Beri pendampingan ekstra & target belajar yang jelas; pantau kemajuan tiap pekan.");
  }
  if (kode.has("jarak")) {
    saran.push("Evaluasi opsi transportasi/jam masuk; koordinasi dengan orang tua soal akses ke sekolah.");
  }
  if (kode.has("keluarga_rentan")) {
    saran.push("Libatkan wali/keluarga; pertimbangkan dukungan psikososial.");
  }
  if (saran.length === 0) {
    saran.push("Pertahankan pemantauan rutin; tidak ada sinyal risiko menonjol.");
  }
  return saran;
}
