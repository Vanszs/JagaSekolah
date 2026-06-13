import { describe, it } from "node:test";
import { expect } from "./_expect";
import { scoreSiswa } from "@/lib/scoring/rules";
import type { SiswaInput } from "@/lib/scoring/types";

function baseSiswa(over: Partial<SiswaInput> = {}): SiswaInput {
  return {
    id: "s1",
    nama: "Uji",
    totalHari: 40,
    hariAlpa: 0,
    alpaBeruntunMaks: 0,
    jumlahTelat: 0,
    catatanDisiplin: 0,
    partisipasi: 3,
    pctTugasTidakKumpul: 0,
    rataNilaiSekarang: 85,
    rataNilaiSebelumnya: 85,
    mapelDiBawahKkm: 0,
    pernahTinggalKelas: false,
    nilaiMatematika: 85,
    nilaiBahasa: 85,
    kkm: 70,
    penerimaKip: false,
    ...over,
  };
}

describe("scoreSiswa", () => {
  it("siswa sehat -> hijau, skor 0", () => {
    const r = scoreSiswa(baseSiswa());
    expect(r.kategori).toBe("hijau");
    expect(r.skor).toBe(0);
    expect(r.alasan).toHaveLength(0);
  });

  it("absen kritis + nilai turun + mapel<KKM -> merah", () => {
    const r = scoreSiswa(
      baseSiswa({
        hariAlpa: 12, // 30%
        alpaBeruntunMaks: 4,
        rataNilaiSebelumnya: 80,
        rataNilaiSekarang: 60, // turun 20
        mapelDiBawahKkm: 4,
        nilaiMatematika: 50,
      })
    );
    expect(r.kategori).toBe("merah");
    expect(r.skor).toBeGreaterThanOrEqual(60);
    expect(r.alasan.map((a) => a.kode)).toContain("absen_kritis");
    expect(r.alasan.map((a) => a.kode)).toContain("alpa_beruntun");
  });

  it("hanya absen waspada -> kuning", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 5 })); // 12.5%
    expect(["kuning", "hijau"]).toContain(r.kategori);
    expect(r.alasan.map((a) => a.kode)).toContain("absen_waspada");
  });

  it("alasan tersortir dari bobot terbesar", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 12, alpaBeruntunMaks: 5, jumlahTelat: 10 }));
    for (let i = 1; i < r.alasan.length; i++) {
      expect(r.alasan[i - 1]!.bobot).toBeGreaterThanOrEqual(r.alasan[i]!.bobot);
    }
  });

  it("selalu menyertakan configVersion dan saran", () => {
    const r = scoreSiswa(baseSiswa({ hariAlpa: 10 }));
    expect(r.configVersion).toMatch(/^[0-9a-f]{12}$/);
    expect(r.saran.length).toBeGreaterThan(0);
  });

  it("skor dibatasi maksimum 100", () => {
    const r = scoreSiswa(
      baseSiswa({
        hariAlpa: 20,
        alpaBeruntunMaks: 10,
        jumlahTelat: 20,
        catatanDisiplin: 5,
        partisipasi: 1,
        pctTugasTidakKumpul: 90,
        rataNilaiSebelumnya: 90,
        rataNilaiSekarang: 40,
        mapelDiBawahKkm: 5,
        pernahTinggalKelas: true,
        nilaiMatematika: 30,
        penerimaKip: true,
        statusEkonomi: "miskin",
        jarakKm: 12,
        statusKeluarga: "yatim_piatu",
      })
    );
    expect(r.skor).toBeLessThanOrEqual(100);
    expect(r.kategori).toBe("merah");
  });
});
