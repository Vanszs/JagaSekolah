import type { SiswaInput, HasilSkor, AlasanItem, Kategori } from "./types";
import { DEFAULT_THRESHOLDS, type Thresholds, configVersion } from "./thresholds";
import { computeFeatures } from "./features";
import { buildSaran } from "./explain";

/**
 * Mesin scoring rule-based (L1) - deterministik & transparan.
 * Menggabungkan sinyal ABC + konteks lokal menjadi skor 0..100 + kategori.
 */
export function scoreSiswa(
  input: SiswaInput,
  t: Thresholds = DEFAULT_THRESHOLDS
): HasilSkor {
  const f = computeFeatures(input, t);
  const alasan: AlasanItem[] = [];
  const b = t.bobot;

  const add = (kode: string, pesan: string, bobot: number) =>
    alasan.push({ kode, pesan, bobot });

  // --- A: Attendance ---
  if (f.pctAbsen >= t.pctAbsenKritis) {
    add("absen_kritis", `Ketidakhadiran sangat tinggi (${f.pctAbsen.toFixed(0)}%).`, b.pctAbsenKritis!);
  } else if (f.pctAbsen >= t.pctAbsenWaspada) {
    add("absen_waspada", `Ketidakhadiran mulai tinggi (${f.pctAbsen.toFixed(0)}%).`, b.pctAbsenWaspada!);
  }
  if (f.alpaBeruntun >= t.alpaBeruntunFlag) {
    add("alpa_beruntun", `Alpa ${f.alpaBeruntun} hari berturut-turut.`, b.alpaBeruntun!);
  }
  if (f.trenAbsensiMemburuk) {
    add("tren_absensi", "Tren kehadiran menurun beberapa periode.", b.trenAbsensiMemburuk!);
  }
  if (f.telatKronis) {
    add("telat", "Sering terlambat (kronis).", b.telatKronis!);
  }

  // --- B: Behavior ---
  if (f.catatanDisiplin > 0) {
    add("disiplin", `Ada ${f.catatanDisiplin} catatan pelanggaran.`, Math.min(b.catatanDisiplin! * f.catatanDisiplin, b.catatanDisiplin! * 3));
  }
  if (f.partisipasiRendah) {
    add("partisipasi", "Partisipasi di kelas rendah.", b.partisipasiRendah!);
  }
  if (f.pctTugasTidakKumpul >= 50) {
    add("tugas", `Banyak tugas tidak dikumpulkan (${f.pctTugasTidakKumpul.toFixed(0)}%).`, b.tugasTidakKumpul!);
  }

  // --- C: Course ---
  if (f.nilaiTurun >= t.nilaiTurunFlag) {
    add("nilai_turun", `Nilai turun ${f.nilaiTurun.toFixed(0)} poin.`, b.nilaiTurun!);
  }
  if (f.mapelDiBawahKkm >= t.mapelDiBawahKkmFlag) {
    add("mapel_kkm", `${f.mapelDiBawahKkm} mapel di bawah KKM.`, b.mapelDiBawahKkm!);
  }
  if (f.pernahTinggalKelas) {
    add("tinggal_kelas", "Pernah tidak naik kelas.", b.pernahTinggalKelas!);
  }
  if (f.nilaiIntiRendah) {
    add("nilai_inti", "Nilai mapel inti (Matematika/Bahasa) di bawah KKM.", b.nilaiIntiRendah!);
  }

  // --- D: Konteks lokal ---
  if (f.faktorEkonomi) {
    add("faktor_ekonomi", "Faktor ekonomi (KIP/kurang mampu).", b.faktorEkonomi!);
  }
  if (f.jarakJauh) {
    add("jarak", "Jarak rumah-sekolah jauh.", b.jarakJauh!);
  }
  if (f.keluargaRentan) {
    add("keluarga_rentan", "Kondisi keluarga rentan.", b.keluargaRentan!);
  }

  // Skor = jumlah bobot, dibatasi 0..100
  const skor = Math.min(
    100,
    alasan.reduce((acc, a) => acc + a.bobot, 0)
  );

  const kategori: Kategori =
    skor >= t.skorMerah ? "merah" : skor >= t.skorKuning ? "kuning" : "hijau";

  // urutkan alasan dari bobot terbesar
  alasan.sort((x, y) => y.bobot - x.bobot);

  return {
    siswaId: input.id,
    kategori,
    skor,
    alasan,
    saran: buildSaran(alasan),
    configVersion: configVersion(t),
  };
}