import { describe, it } from "node:test";
import { expect } from "./_expect";
import { scoreSiswa } from "@/lib/scoring/rules";
import type { SiswaInput } from "@/lib/scoring/types";

function baseSiswa(over: Partial<SiswaInput> = {}): SiswaInput {
  return {
    id: "f", nama: "Test", totalHari: 40, hariAlpa: 0, alpaBeruntunMaks: 0, jumlahTelat: 0,
    catatanDisiplin: 0, partisipasi: 3, pctTugasTidakKumpul: 0, rataNilaiSekarang: 85,
    rataNilaiSebelumnya: 85, mapelDiBawahKkm: 0, pernahTinggalKelas: false,
    nilaiMatematika: 85, nilaiBahasa: 85, kkm: 70, penerimaKip: false, ...over,
  };
}
const kodes = (s: SiswaInput) => scoreSiswa(s).alasan.map((a) => a.kode);

/**
 * Skenario lapangan Indonesia. Asersi pada KATEGORI + keberadaan kode alasan
 * (bukan skor eksak, agar tahan terhadap kalibrasi ambang).
 */
describe("scoring lapangan Indonesia — 3T & remote", () => {
  it("Papua Pegunungan: jarak 15km + KIP + alpa kritis + telat → merah", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 9, alpaBeruntunMaks: 4, jarakKm: 15, penerimaKip: true, statusEkonomi: "miskin", jumlahTelat: 8 }));
    expect(r.kategori).toBe("merah");
    expect(scoreSiswa(baseSiswa({ hariAlpa: 9, alpaBeruntunMaks: 4, jarakKm: 15, penerimaKip: true, statusEkonomi: "miskin", jumlahTelat: 8 })).alasan.map((a) => a.kode)).toContain("jarak");
  });
  it("Mentawai: akses sungai, telat kronis + jarak jauh + ekonomi → kuning/merah (berisiko)", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 4, jumlahTelat: 10, jarakKm: 20, penerimaKip: true, statusEkonomi: "miskin" }));
    expect(r.kategori).not.toBe("hijau");
    expect(kodes(baseSiswa({ hariAlpa: 4, jumlahTelat: 10, jarakKm: 20, penerimaKip: true, statusEkonomi: "miskin" }))).toContain("telat");
  });
  it("Timika: semua konteks D tapi absensi+akademik sempurna → tetap rendah (hijau)", () => {
    const r = scoreSiswa(baseSiswa({ penerimaKip: true, statusEkonomi: "miskin", jarakKm: 15, statusKeluarga: "yatim_piatu" }));
    expect(r.kategori).toBe("hijau");
    expect(kodes(baseSiswa({ penerimaKip: true, statusEkonomi: "miskin", jarakKm: 15, statusKeluarga: "yatim_piatu" }))).toContain("keluarga_rentan");
  });
});

describe("scoring lapangan Indonesia — musiman & ekonomi", () => {
  it("nelayan Maluku: alpa beruntun 7 musim ikan + miskin → merah", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 10, alpaBeruntunMaks: 7, penerimaKip: true, jarakKm: 8, statusEkonomi: "miskin" }));
    expect(r.kategori).toBe("merah");
    expect(kodes(baseSiswa({ hariAlpa: 10, alpaBeruntunMaks: 7 }))).toContain("alpa_beruntun");
  });
  it("petani sawit Kalbar: panen, alpa beruntun 5 + kurang mampu → kuning", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 5, alpaBeruntunMaks: 5, penerimaKip: true, statusEkonomi: "kurang_mampu" }));
    expect(r.kategori).toBe("kuning");
  });
  it("anak pekerja batu bata Jatim: tugas 70% + partisipasi rendah → berisiko", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 5, pctTugasTidakKumpul: 70, partisipasi: 1, penerimaKip: true, statusEkonomi: "miskin" }));
    expect(r.kategori).not.toBe("hijau");
    expect(kodes(baseSiswa({ pctTugasTidakKumpul: 70, partisipasi: 1 }))).toContain("tugas");
  });
});

describe("scoring lapangan Indonesia — bencana & akademik", () => {
  it("gempa Nias: alpa massal 15 beruntun 10 + tinggal kelas → merah", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 15, alpaBeruntunMaks: 10, pernahTinggalKelas: true, penerimaKip: true, jarakKm: 7 }));
    expect(r.kategori).toBe("merah");
    expect(kodes(baseSiswa({ pernahTinggalKelas: true }))).toContain("tinggal_kelas");
  });
  it("perempuan Madura: tren turun + nilai inti rendah + piatu → merah", () => {
    const r = scoreSiswa(baseSiswa({ absensiPerPeriode: [88, 78, 68], penerimaKip: true, statusKeluarga: "piatu", nilaiMatematika: 55, nilaiBahasa: 65, rataNilaiSebelumnya: 72, rataNilaiSekarang: 60, mapelDiBawahKkm: 3 }));
    expect(r.kategori).toBe("merah");
    const k = kodes(baseSiswa({ absensiPerPeriode: [88, 78, 68], nilaiMatematika: 55, nilaiBahasa: 65, rataNilaiSebelumnya: 72, rataNilaiSekarang: 60, mapelDiBawahKkm: 3 }));
    expect(k).toContain("tren_absensi");
    expect(k).toContain("nilai_inti");
  });
});

describe("scoring lapangan Indonesia — data minim & kontrol", () => {
  it("pesantren transfer: data minim (5 hari, no nilai) → hijau, tanpa false-positive", () => {
    const r = scoreSiswa(baseSiswa({ totalHari: 5, hariAlpa: 0, rataNilaiSebelumnya: undefined, absensiPerPeriode: undefined, nilaiMatematika: undefined, nilaiBahasa: undefined }));
    expect(r.kategori).toBe("hijau");
    expect(r.alasan).toHaveLength(0);
  });
  it("siswa perkotaan Surabaya mampu: semua baik → hijau, skor 0", () => {
    const r = scoreSiswa(baseSiswa({ jarakKm: 2, statusEkonomi: "mampu" }));
    expect(r.kategori).toBe("hijau");
    expect(r.skor).toBe(0);
  });
});

describe("scoring boundary thresholds", () => {
  it("pctAbsen tepat 10% → absen_waspada (bukan kritis)", () => {
    const k = kodes(baseSiswa({ hariAlpa: 4, totalHari: 40 }));
    expect(k).toContain("absen_waspada");
    expect(k).not.toContain("absen_kritis");
  });
  it("pctAbsen tepat 20% → absen_kritis", () => {
    expect(kodes(baseSiswa({ hariAlpa: 8, totalHari: 40 }))).toContain("absen_kritis");
  });
  it("alpaBeruntun tepat 3 → alpa_beruntun", () => {
    expect(kodes(baseSiswa({ alpaBeruntunMaks: 3 }))).toContain("alpa_beruntun");
  });
  it("skor selalu 0..100 (tidak pernah > 100 walau semua faktor)", () => {
    const r = scoreSiswa(baseSiswa({
      hariAlpa: 14, alpaBeruntunMaks: 6, jumlahTelat: 8, catatanDisiplin: 3, partisipasi: 1,
      pctTugasTidakKumpul: 80, rataNilaiSebelumnya: 72, rataNilaiSekarang: 50, mapelDiBawahKkm: 5,
      pernahTinggalKelas: true, nilaiMatematika: 40, nilaiBahasa: 45, penerimaKip: true,
      statusEkonomi: "miskin", jarakKm: 9, statusKeluarga: "yatim",
    }));
    expect(r.kategori).toBe("merah");
    expect(r.skor).toBeLessThanOrEqual(100);
    expect(r.skor).toBeGreaterThanOrEqual(0);
  });
});
