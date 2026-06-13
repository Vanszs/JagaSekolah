import { describe, it } from "node:test";
import { expect } from "./_expect";
import { scoreSiswa } from "@/lib/scoring/rules";
import { configVersion, DEFAULT_THRESHOLDS } from "@/lib/scoring/thresholds";
import type { SiswaInput } from "@/lib/scoring/types";

function baseSiswa(over: Partial<SiswaInput> = {}): SiswaInput {
  return {
    id: "scenario-1",
    nama: "Test",
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

describe("rules-scenarios: realistic profiles", () => {
  it("dropout-bound profile -> merah with multiple alasan", () => {
    // Realistic: absent a lot, grades falling, poor family, far from school
    const r = scoreSiswa(baseSiswa({
      id: "dropout-1",
      hariAlpa: 10,           // 25% (kritis >=20%)
      alpaBeruntunMaks: 5,    // >=3 flag
      jumlahTelat: 8,         // >=6 -> telatKronis
      catatanDisiplin: 2,
      partisipasi: 1,         // rendah
      pctTugasTidakKumpul: 60,
      rataNilaiSebelumnya: 75,
      rataNilaiSekarang: 55,  // turun 20 (>=10 flag)
      mapelDiBawahKkm: 4,    // >=3 flag
      pernahTinggalKelas: true,
      nilaiMatematika: 50,    // < kkm 70
      nilaiBahasa: 60,        // < kkm 70
      penerimaKip: true,
      jarakKm: 8,             // >=5 -> jarakJauh
      statusKeluarga: "yatim",
    }));
    expect(r.kategori).toBe("merah");
    expect(r.skor).toBeGreaterThanOrEqual(60);
    expect(r.alasan.length).toBeGreaterThan(5);
    // Should contain key risk codes
    const codes = r.alasan.map(a => a.kode);
    expect(codes).toContain("absen_kritis");
    expect(codes).toContain("alpa_beruntun");
    expect(codes).toContain("nilai_turun");
    expect(codes).toContain("mapel_kkm");
    expect(codes).toContain("faktor_ekonomi");
    expect(codes).toContain("jarak");
    expect(codes).toContain("keluarga_rentan");
  });

  it("borderline kuning->merah transition at exact threshold (skor=60)", () => {
    // skorMerah = 60. Construct exactly at boundary.
    // absen_kritis=30 + alpaBeruntun=20 + nilaiTurun=15 = 65 -> merah
    const merah = scoreSiswa(baseSiswa({
      hariAlpa: 8,             // 20% exactly -> kritis (>=20)
      alpaBeruntunMaks: 3,     // exactly >=3
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 70,   // turun 10 exactly (>=10 flag)
    }));
    expect(merah.kategori).toBe("merah");
    expect(merah.skor).toBeGreaterThanOrEqual(60);

    // Just below: absen_waspada=15 + alpaBeruntun=20 + nilaiTurun=15 = 50 -> kuning
    const kuning = scoreSiswa(baseSiswa({
      hariAlpa: 5,             // 12.5% -> waspada (>=10, <20)
      alpaBeruntunMaks: 3,
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 70,   // turun 10
    }));
    expect(kuning.kategori).toBe("kuning");
    expect(kuning.skor).toBeGreaterThanOrEqual(30);
    expect(kuning.skor).toBeLessThanOrEqual(59);
  });

  it("multiple konteks factors (KIP + jarakJauh + keluarga rentan)", () => {
    // Only context factors, no academic/attendance issues
    const r = scoreSiswa(baseSiswa({
      penerimaKip: true,
      jarakKm: 10,
      statusKeluarga: "yatim_piatu",
    }));
    // faktorEkonomi=8 + jarak=5 + keluarga_rentan=7 = 20 -> hijau (<30)
    expect(r.kategori).toBe("hijau");
    expect(r.skor).toBe(20);
    const codes = r.alasan.map(a => a.kode);
    expect(codes).toContain("faktor_ekonomi");
    expect(codes).toContain("jarak");
    expect(codes).toContain("keluarga_rentan");
  });

  it("KIP + jarak jauh combination pushing into kuning with mild attendance", () => {
    // faktorEkonomi=8 + jarak=5 + absen_waspada=15 + telatKronis=5 = 33 -> kuning
    const r = scoreSiswa(baseSiswa({
      penerimaKip: true,
      jarakKm: 6,
      hariAlpa: 5,       // 12.5% -> waspada
      jumlahTelat: 7,    // >=6 -> telatKronis
    }));
    expect(r.kategori).toBe("kuning");
    expect(r.skor).toBeGreaterThanOrEqual(30);
    const codes = r.alasan.map(a => a.kode);
    expect(codes).toContain("faktor_ekonomi");
    expect(codes).toContain("jarak");
    expect(codes).toContain("absen_waspada");
    expect(codes).toContain("telat");
  });

  it("recovering student (improving tren) has no tren_absensi flag", () => {
    // absensiPerPeriode improving: 70, 80, 90 (each higher = better attendance)
    // trenAbsensiMemburuk requires last < second-last < third-last → false here
    const r = scoreSiswa(baseSiswa({
      absensiPerPeriode: [70, 80, 90], // improving -> NOT memburuk
      hariAlpa: 2,                     // 5% -> no flag
    }));
    const codes = r.alasan.map(a => a.kode);
    expect(codes).not.toContain("tren_absensi");
    expect(r.kategori).toBe("hijau");
  });

  it("worsening tren triggers tren_absensi", () => {
    // 90, 80, 70 -> each period attendance drops -> memburuk
    const r = scoreSiswa(baseSiswa({
      absensiPerPeriode: [90, 80, 70], // declining -> memburuk
      hariAlpa: 2,
    }));
    const codes = r.alasan.map(a => a.kode);
    expect(codes).toContain("tren_absensi");
  });
});

describe("rules-scenarios: monotonicity & structural guarantees", () => {
  it("more risk factors => higher or equal skor", () => {
    const minimal = scoreSiswa(baseSiswa({ hariAlpa: 5 }));   // absen_waspada only
    const more = scoreSiswa(baseSiswa({
      hariAlpa: 5,
      alpaBeruntunMaks: 4,
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 65,
    }));
    const most = scoreSiswa(baseSiswa({
      hariAlpa: 5,
      alpaBeruntunMaks: 4,
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 65,
      penerimaKip: true,
      jarakKm: 7,
      pernahTinggalKelas: true,
    }));
    expect(more.skor).toBeGreaterThanOrEqual(minimal.skor);
    expect(most.skor).toBeGreaterThanOrEqual(more.skor);
  });

  it("alasan non-empty for kuning", () => {
    const r = scoreSiswa(baseSiswa({
      hariAlpa: 5,
      alpaBeruntunMaks: 4,
    }));
    // Should be kuning (15 + 20 = 35 >= 30)
    expect(r.kategori).toBe("kuning");
    expect(r.alasan.length).toBeGreaterThan(0);
  });

  it("alasan non-empty for merah", () => {
    const r = scoreSiswa(baseSiswa({
      hariAlpa: 10,
      alpaBeruntunMaks: 5,
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 60,
    }));
    expect(r.kategori).toBe("merah");
    expect(r.alasan.length).toBeGreaterThan(0);
  });

  it("alasan empty for clean hijau", () => {
    const r = scoreSiswa(baseSiswa());
    expect(r.kategori).toBe("hijau");
    expect(r.alasan).toHaveLength(0);
  });

  it("saran present and non-empty for kuning", () => {
    const r = scoreSiswa(baseSiswa({
      hariAlpa: 5,
      alpaBeruntunMaks: 4,
    }));
    expect(r.kategori).toBe("kuning");
    expect(r.saran.length).toBeGreaterThan(0);
  });

  it("saran present and non-empty for merah", () => {
    const r = scoreSiswa(baseSiswa({
      hariAlpa: 10,
      alpaBeruntunMaks: 5,
      rataNilaiSebelumnya: 80,
      rataNilaiSekarang: 60,
    }));
    expect(r.kategori).toBe("merah");
    expect(r.saran.length).toBeGreaterThan(0);
  });

  it("configVersion stable across multiple calls", () => {
    const r1 = scoreSiswa(baseSiswa());
    const r2 = scoreSiswa(baseSiswa({ hariAlpa: 10 }));
    const r3 = scoreSiswa(baseSiswa({ penerimaKip: true }));
    expect(r1.configVersion).toBe(r2.configVersion);
    expect(r2.configVersion).toBe(r3.configVersion);
    // Matches the direct configVersion() call
    expect(r1.configVersion).toBe(configVersion(DEFAULT_THRESHOLDS));
  });

  it("configVersion changes with different thresholds", () => {
    const custom = { ...DEFAULT_THRESHOLDS, skorMerah: 70 };
    const r = scoreSiswa(baseSiswa(), custom);
    expect(r.configVersion).not.toBe(configVersion(DEFAULT_THRESHOLDS));
  });
});
