import { describe, it } from "node:test";
import { expect } from "./_expect";
import { computeFeatures } from "@/lib/scoring/features";
import type { SiswaInput } from "@/lib/scoring/types";

/** Minimal valid SiswaInput for reuse. */
function baseSiswa(overrides: Partial<SiswaInput> = {}): SiswaInput {
  return {
    id: "s1",
    nama: "Test",
    totalHari: 30,
    hariAlpa: 0,
    alpaBeruntunMaks: 0,
    jumlahTelat: 0,
    catatanDisiplin: 0,
    partisipasi: 3,
    pctTugasTidakKumpul: 0,
    rataNilaiSekarang: 80,
    mapelDiBawahKkm: 0,
    pernahTinggalKelas: false,
    kkm: 70,
    penerimaKip: false,
    ...overrides,
  };
}

describe("computeFeatures", () => {
  describe("pctAbsen (attendance %)", () => {
    it("returns 0 when hariAlpa is 0", () => {
      const f = computeFeatures(baseSiswa({ hariAlpa: 0, totalHari: 30 }));
      expect(f.pctAbsen).toBe(0);
    });

    it("calculates correctly for partial absence", () => {
      const f = computeFeatures(baseSiswa({ hariAlpa: 6, totalHari: 30 }));
      expect(f.pctAbsen).toBe(20);
    });

    it("returns 100 when all days absent", () => {
      const f = computeFeatures(baseSiswa({ hariAlpa: 30, totalHari: 30 }));
      expect(f.pctAbsen).toBe(100);
    });

    it("returns 0 when totalHari is 0 (avoid division by zero)", () => {
      const f = computeFeatures(baseSiswa({ hariAlpa: 5, totalHari: 0 }));
      expect(f.pctAbsen).toBe(0);
    });

    it("handles boundary 10% (waspada threshold)", () => {
      const f = computeFeatures(baseSiswa({ hariAlpa: 3, totalHari: 30 }));
      expect(f.pctAbsen).toBe(10);
    });
  });

  describe("alpaBeruntun", () => {
    it("passes through alpaBeruntunMaks directly", () => {
      const f = computeFeatures(baseSiswa({ alpaBeruntunMaks: 5 }));
      expect(f.alpaBeruntun).toBe(5);
    });

    it("is 0 when no consecutive absence", () => {
      const f = computeFeatures(baseSiswa({ alpaBeruntunMaks: 0 }));
      expect(f.alpaBeruntun).toBe(0);
    });
  });

  describe("trenAbsensiMemburuk", () => {
    it("false when absensiPerPeriode is undefined", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: undefined }));
      expect(f.trenAbsensiMemburuk).toBe(false);
    });

    it("false when absensiPerPeriode has fewer than 3 entries", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [90, 85] }));
      expect(f.trenAbsensiMemburuk).toBe(false);
    });

    it("false with exactly 3 entries but not decreasing", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [80, 85, 90] }));
      expect(f.trenAbsensiMemburuk).toBe(false);
    });

    it("true with 3 entries strictly decreasing (worsening attendance)", () => {
      // tr[2] < tr[1] < tr[0] → last two periods decreasing
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [90, 85, 80] }));
      expect(f.trenAbsensiMemburuk).toBe(true);
    });

    it("true with >3 entries where last 3 are decreasing", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [70, 95, 90, 85] }));
      expect(f.trenAbsensiMemburuk).toBe(true);
    });

    it("false when last 3 are not strictly decreasing (equal)", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [90, 85, 85] }));
      expect(f.trenAbsensiMemburuk).toBe(false);
    });

    it("false when only last pair decreases but not second-to-last", () => {
      const f = computeFeatures(baseSiswa({ absensiPerPeriode: [80, 90, 85] }));
      expect(f.trenAbsensiMemburuk).toBe(false);
    });
  });

  describe("telatKronis", () => {
    it("false when jumlahTelat < threshold (6)", () => {
      const f = computeFeatures(baseSiswa({ jumlahTelat: 5 }));
      expect(f.telatKronis).toBe(false);
    });

    it("true when jumlahTelat == threshold (6)", () => {
      const f = computeFeatures(baseSiswa({ jumlahTelat: 6 }));
      expect(f.telatKronis).toBe(true);
    });

    it("true when jumlahTelat > threshold", () => {
      const f = computeFeatures(baseSiswa({ jumlahTelat: 10 }));
      expect(f.telatKronis).toBe(true);
    });
  });

  describe("catatanDisiplin (behavior)", () => {
    it("passes through directly", () => {
      const f = computeFeatures(baseSiswa({ catatanDisiplin: 3 }));
      expect(f.catatanDisiplin).toBe(3);
    });

    it("is 0 when no incidents", () => {
      const f = computeFeatures(baseSiswa({ catatanDisiplin: 0 }));
      expect(f.catatanDisiplin).toBe(0);
    });
  });

  describe("partisipasiRendah", () => {
    it("true when partisipasi is 1", () => {
      const f = computeFeatures(baseSiswa({ partisipasi: 1 }));
      expect(f.partisipasiRendah).toBe(true);
    });

    it("true when partisipasi is 0", () => {
      const f = computeFeatures(baseSiswa({ partisipasi: 0 }));
      expect(f.partisipasiRendah).toBe(true);
    });

    it("false when partisipasi is 2", () => {
      const f = computeFeatures(baseSiswa({ partisipasi: 2 }));
      expect(f.partisipasiRendah).toBe(false);
    });

    it("false when partisipasi is 3", () => {
      const f = computeFeatures(baseSiswa({ partisipasi: 3 }));
      expect(f.partisipasiRendah).toBe(false);
    });
  });

  describe("pctTugasTidakKumpul", () => {
    it("passes through directly", () => {
      const f = computeFeatures(baseSiswa({ pctTugasTidakKumpul: 45 }));
      expect(f.pctTugasTidakKumpul).toBe(45);
    });

    it("is 0 when all tasks submitted", () => {
      const f = computeFeatures(baseSiswa({ pctTugasTidakKumpul: 0 }));
      expect(f.pctTugasTidakKumpul).toBe(0);
    });
  });

  describe("nilaiTurun (course grade drop)", () => {
    it("returns difference when rataNilaiSebelumnya > rataNilaiSekarang", () => {
      const f = computeFeatures(baseSiswa({ rataNilaiSebelumnya: 80, rataNilaiSekarang: 65 }));
      expect(f.nilaiTurun).toBe(15);
    });

    it("returns 0 when rataNilaiSebelumnya == rataNilaiSekarang", () => {
      const f = computeFeatures(baseSiswa({ rataNilaiSebelumnya: 80, rataNilaiSekarang: 80 }));
      expect(f.nilaiTurun).toBe(0);
    });

    it("returns 0 when rataNilaiSebelumnya < rataNilaiSekarang (improved)", () => {
      const f = computeFeatures(baseSiswa({ rataNilaiSebelumnya: 70, rataNilaiSekarang: 80 }));
      expect(f.nilaiTurun).toBe(0);
    });

    it("returns 0 when rataNilaiSebelumnya is undefined", () => {
      const f = computeFeatures(baseSiswa({ rataNilaiSebelumnya: undefined, rataNilaiSekarang: 80 }));
      expect(f.nilaiTurun).toBe(0);
    });
  });

  describe("mapelDiBawahKkm", () => {
    it("passes through directly", () => {
      const f = computeFeatures(baseSiswa({ mapelDiBawahKkm: 4 }));
      expect(f.mapelDiBawahKkm).toBe(4);
    });

    it("is 0 when no subjects below KKM", () => {
      const f = computeFeatures(baseSiswa({ mapelDiBawahKkm: 0 }));
      expect(f.mapelDiBawahKkm).toBe(0);
    });
  });

  describe("pernahTinggalKelas", () => {
    it("true when student repeated a grade", () => {
      const f = computeFeatures(baseSiswa({ pernahTinggalKelas: true }));
      expect(f.pernahTinggalKelas).toBe(true);
    });

    it("false when student never repeated", () => {
      const f = computeFeatures(baseSiswa({ pernahTinggalKelas: false }));
      expect(f.pernahTinggalKelas).toBe(false);
    });
  });

  describe("nilaiIntiRendah", () => {
    it("true when nilaiMatematika < kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: 60, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(true);
    });

    it("true when nilaiBahasa < kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiBahasa: 65, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(true);
    });

    it("true when both < kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: 50, nilaiBahasa: 55, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(true);
    });

    it("false when nilaiMatematika == kkm (not less than)", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: 70, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(false);
    });

    it("false when nilaiBahasa == kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiBahasa: 70, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(false);
    });

    it("false when both are undefined", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: undefined, nilaiBahasa: undefined, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(false);
    });

    it("false when both >= kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: 75, nilaiBahasa: 80, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(false);
    });

    it("true when only nilaiMatematika defined and < kkm", () => {
      const f = computeFeatures(baseSiswa({ nilaiMatematika: 50, nilaiBahasa: undefined, kkm: 70 }));
      expect(f.nilaiIntiRendah).toBe(true);
    });
  });

  describe("faktorEkonomi (konteks lokal)", () => {
    it("true when penerimaKip is true", () => {
      const f = computeFeatures(baseSiswa({ penerimaKip: true }));
      expect(f.faktorEkonomi).toBe(true);
    });

    it("true when statusEkonomi is 'miskin'", () => {
      const f = computeFeatures(baseSiswa({ statusEkonomi: "miskin" }));
      expect(f.faktorEkonomi).toBe(true);
    });

    it("true when statusEkonomi is 'kurang_mampu'", () => {
      const f = computeFeatures(baseSiswa({ statusEkonomi: "kurang_mampu" }));
      expect(f.faktorEkonomi).toBe(true);
    });

    it("false when statusEkonomi is 'mampu' and not KIP", () => {
      const f = computeFeatures(baseSiswa({ penerimaKip: false, statusEkonomi: "mampu" }));
      expect(f.faktorEkonomi).toBe(false);
    });

    it("false when statusEkonomi is undefined and not KIP", () => {
      const f = computeFeatures(baseSiswa({ penerimaKip: false, statusEkonomi: undefined }));
      expect(f.faktorEkonomi).toBe(false);
    });

    it("true when both KIP and miskin (any OR condition)", () => {
      const f = computeFeatures(baseSiswa({ penerimaKip: true, statusEkonomi: "miskin" }));
      expect(f.faktorEkonomi).toBe(true);
    });
  });

  describe("jarakJauh", () => {
    it("true when jarakKm >= 5", () => {
      const f = computeFeatures(baseSiswa({ jarakKm: 5 }));
      expect(f.jarakJauh).toBe(true);
    });

    it("true when jarakKm > 5", () => {
      const f = computeFeatures(baseSiswa({ jarakKm: 10 }));
      expect(f.jarakJauh).toBe(true);
    });

    it("false when jarakKm < 5", () => {
      const f = computeFeatures(baseSiswa({ jarakKm: 4.9 }));
      expect(f.jarakJauh).toBe(false);
    });

    it("false when jarakKm is 0", () => {
      const f = computeFeatures(baseSiswa({ jarakKm: 0 }));
      expect(f.jarakJauh).toBe(false);
    });

    it("false when jarakKm is undefined (defaults to 0)", () => {
      const f = computeFeatures(baseSiswa({ jarakKm: undefined }));
      expect(f.jarakJauh).toBe(false);
    });
  });

  describe("keluargaRentan", () => {
    it("true when statusKeluarga is 'yatim'", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: "yatim" }));
      expect(f.keluargaRentan).toBe(true);
    });

    it("true when statusKeluarga is 'piatu'", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: "piatu" }));
      expect(f.keluargaRentan).toBe(true);
    });

    it("true when statusKeluarga is 'yatim_piatu'", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: "yatim_piatu" }));
      expect(f.keluargaRentan).toBe(true);
    });

    it("false when statusKeluarga is 'ortu_lengkap'", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: "ortu_lengkap" }));
      expect(f.keluargaRentan).toBe(false);
    });

    it("false when statusKeluarga is 'wali'", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: "wali" }));
      expect(f.keluargaRentan).toBe(false);
    });

    it("false when statusKeluarga is undefined", () => {
      const f = computeFeatures(baseSiswa({ statusKeluarga: undefined }));
      expect(f.keluargaRentan).toBe(false);
    });
  });

  describe("custom thresholds", () => {
    it("uses custom telatKronisPerBulan threshold", () => {
      const customT = {
        pctAbsenWaspada: 10,
        pctAbsenKritis: 20,
        alpaBeruntunFlag: 3,
        telatKronisPerBulan: 3,
        nilaiTurunFlag: 10,
        mapelDiBawahKkmFlag: 3,
        pctTugasTidakKumpulFlag: 50,
        skorKuning: 30,
        skorMerah: 60,
        bobot: {},
      };
      const f = computeFeatures(baseSiswa({ jumlahTelat: 3 }), customT);
      expect(f.telatKronis).toBe(true);
    });

    it("not kronis below custom threshold", () => {
      const customT = {
        pctAbsenWaspada: 10,
        pctAbsenKritis: 20,
        alpaBeruntunFlag: 3,
        telatKronisPerBulan: 3,
        nilaiTurunFlag: 10,
        mapelDiBawahKkmFlag: 3,
        pctTugasTidakKumpulFlag: 50,
        skorKuning: 30,
        skorMerah: 60,
        bobot: {},
      };
      const f = computeFeatures(baseSiswa({ jumlahTelat: 2 }), customT);
      expect(f.telatKronis).toBe(false);
    });
  });

  describe("full output shape", () => {
    it("returns all expected fields", () => {
      const f = computeFeatures(baseSiswa());
      expect(f.pctAbsen).toBeGreaterThanOrEqual(0);
      expect(f.alpaBeruntun).toBeGreaterThanOrEqual(0);
      expect(f.trenAbsensiMemburuk).toBe(false);
      expect(f.telatKronis).toBe(false);
      expect(f.catatanDisiplin).toBe(0);
      expect(f.partisipasiRendah).toBe(false);
      expect(f.pctTugasTidakKumpul).toBe(0);
      expect(f.nilaiTurun).toBe(0);
      expect(f.mapelDiBawahKkm).toBe(0);
      expect(f.pernahTinggalKelas).toBe(false);
      expect(f.nilaiIntiRendah).toBe(false);
      expect(f.faktorEkonomi).toBe(false);
      expect(f.jarakJauh).toBe(false);
      expect(f.keluargaRentan).toBe(false);
    });
  });

  describe("edge: high-risk student (all factors triggered)", () => {
    it("returns all risk flags true", () => {
      const f = computeFeatures(baseSiswa({
        totalHari: 30,
        hariAlpa: 10,
        alpaBeruntunMaks: 5,
        jumlahTelat: 8,
        absensiPerPeriode: [95, 85, 75],
        catatanDisiplin: 3,
        partisipasi: 1,
        pctTugasTidakKumpul: 60,
        rataNilaiSekarang: 55,
        rataNilaiSebelumnya: 75,
        mapelDiBawahKkm: 4,
        pernahTinggalKelas: true,
        nilaiMatematika: 50,
        nilaiBahasa: 45,
        kkm: 70,
        penerimaKip: true,
        jarakKm: 8,
        statusKeluarga: "yatim_piatu",
      }));
      expect(f.pctAbsen).toBeGreaterThan(30);
      expect(f.alpaBeruntun).toBe(5);
      expect(f.trenAbsensiMemburuk).toBe(true);
      expect(f.telatKronis).toBe(true);
      expect(f.catatanDisiplin).toBe(3);
      expect(f.partisipasiRendah).toBe(true);
      expect(f.pctTugasTidakKumpul).toBe(60);
      expect(f.nilaiTurun).toBe(20);
      expect(f.mapelDiBawahKkm).toBe(4);
      expect(f.pernahTinggalKelas).toBe(true);
      expect(f.nilaiIntiRendah).toBe(true);
      expect(f.faktorEkonomi).toBe(true);
      expect(f.jarakJauh).toBe(true);
      expect(f.keluargaRentan).toBe(true);
    });
  });
});
