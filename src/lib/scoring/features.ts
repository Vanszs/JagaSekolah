import type { SiswaInput, Features } from "./types";
import { DEFAULT_THRESHOLDS, type Thresholds } from "./thresholds";

/** Hitung fitur ABC + konteks dari data mentah siswa. */
export function computeFeatures(
  s: SiswaInput,
  t: Thresholds = DEFAULT_THRESHOLDS
): Features {
  const pctAbsen = s.totalHari > 0 ? (s.hariAlpa / s.totalHari) * 100 : 0;

  // Tren absensi memburuk: 2 periode terakhir turun berturut-turut
  let trenAbsensiMemburuk = false;
  const tr = s.absensiPerPeriode;
  if (tr && tr.length >= 3) {
    const n = tr.length;
    trenAbsensiMemburuk = tr[n - 1]! < tr[n - 2]! && tr[n - 2]! < tr[n - 3]!;
  }

  const nilaiTurun =
    s.rataNilaiSebelumnya !== undefined &&
    s.rataNilaiSebelumnya > s.rataNilaiSekarang
      ? s.rataNilaiSebelumnya - s.rataNilaiSekarang
      : 0;

  const nilaiIntiRendah =
    (s.nilaiMatematika !== undefined && s.nilaiMatematika < s.kkm) ||
    (s.nilaiBahasa !== undefined && s.nilaiBahasa < s.kkm);

  const ekonomiRentan =
    s.penerimaKip ||
    s.statusEkonomi === "miskin" ||
    s.statusEkonomi === "kurang_mampu";

  const keluargaRentan =
    s.statusKeluarga === "yatim" ||
    s.statusKeluarga === "piatu" ||
    s.statusKeluarga === "yatim_piatu";

  return {
    pctAbsen,
    alpaBeruntun: s.alpaBeruntunMaks,
    trenAbsensiMemburuk,
    telatKronis: s.jumlahTelat >= t.telatKronisPerBulan,
    catatanDisiplin: s.catatanDisiplin,
    partisipasiRendah: s.partisipasi <= 1,
    pctTugasTidakKumpul: s.pctTugasTidakKumpul,
    nilaiTurun,
    mapelDiBawahKkm: s.mapelDiBawahKkm,
    pernahTinggalKelas: s.pernahTinggalKelas,
    nilaiIntiRendah,
    faktorEkonomi: ekonomiRentan,
    jarakJauh: (s.jarakKm ?? 0) >= 5,
    keluargaRentan,
  };
}
