import { describe, it } from "node:test";
import { expect } from "./_expect";
import { buildSiswaInput, type SiswaWithData } from "@/lib/scoring/buildInput";
import type { SiswaPII } from "@/lib/siswaPII";

// Helpers
function mkAbsensi(statuses: string[]): SiswaWithData["absensi"] {
  return statuses.map((s, i) => ({
    tanggal: new Date(2026, 0, i + 1),
    status: s as "hadir" | "alpa" | "izin" | "sakit" | "telat",
  }));
}

function mkNilai(
  entries: { mapel: string; periode: string; nilai: number; kkm?: number }[]
): SiswaWithData["nilai"] {
  return entries.map((e) => ({ mapel: e.mapel, periode: e.periode, nilai: e.nilai, kkm: e.kkm ?? 70 }));
}

const baseSiswa: SiswaWithData = {
  id: "s1",
  nama: "Andi",
  penerimaKip: false,
  jarakKm: 5,
  absensi: [],
  nilai: [],
};

const basePII: SiswaPII = {
  statusEkonomi: "mampu",
  statusKeluarga: "ortu_lengkap",
};

describe("buildSiswaInput", () => {
  describe("basic fields", () => {
    it("returns id, nama, penerimaKip, jarakKm from siswa", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.id).toBe("s1");
      expect(result.nama).toBe("Andi");
      expect(result.penerimaKip).toBe(false);
      expect(result.jarakKm).toBe(5);
    });

    it("passes PII fields (statusEkonomi, statusKeluarga)", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.statusEkonomi).toBe("mampu");
      expect(result.statusKeluarga).toBe("ortu_lengkap");
    });

    it("handles null jarakKm → undefined", () => {
      const siswa = { ...baseSiswa, jarakKm: null };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.jarakKm).toBe(undefined);
    });

    it("handles null PII fields → undefined", () => {
      const pii: SiswaPII = { statusEkonomi: null, statusKeluarga: null };
      const result = buildSiswaInput(baseSiswa, pii);
      expect(result.statusEkonomi).toBe(undefined);
      expect(result.statusKeluarga).toBe(undefined);
    });
  });

  describe("absensi — empty", () => {
    it("totalHari defaults to 1 (avoids division by zero), hariAlpa=0, alpaBeruntunMaks=0", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.totalHari).toBe(1);
      expect(result.hariAlpa).toBe(0);
      expect(result.alpaBeruntunMaks).toBe(0);
      expect(result.jumlahTelat).toBe(0);
    });
  });

  describe("absensi — all hadir", () => {
    it("hariAlpa=0, alpaBeruntunMaks=0", () => {
      const siswa = { ...baseSiswa, absensi: mkAbsensi(["hadir", "hadir", "hadir", "hadir", "hadir"]) };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.totalHari).toBe(5);
      expect(result.hariAlpa).toBe(0);
      expect(result.alpaBeruntunMaks).toBe(0);
    });
  });

  describe("absensi — all alpa", () => {
    it("hariAlpa equals totalHari, alpaBeruntunMaks equals totalHari", () => {
      const siswa = { ...baseSiswa, absensi: mkAbsensi(["alpa", "alpa", "alpa"]) };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.totalHari).toBe(3);
      expect(result.hariAlpa).toBe(3);
      expect(result.alpaBeruntunMaks).toBe(3);
    });
  });

  describe("absensi — mixed with consecutive alpa", () => {
    it("correctly counts max consecutive alpa", () => {
      // hadir, alpa, alpa, hadir, alpa, alpa, alpa, hadir
      const siswa = {
        ...baseSiswa,
        absensi: mkAbsensi(["hadir", "alpa", "alpa", "hadir", "alpa", "alpa", "alpa", "hadir"]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.hariAlpa).toBe(5);
      expect(result.alpaBeruntunMaks).toBe(3);
    });
  });

  describe("absensi — telat counting", () => {
    it("counts telat entries", () => {
      const siswa = { ...baseSiswa, absensi: mkAbsensi(["telat", "hadir", "telat", "alpa"]) };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.jumlahTelat).toBe(2);
    });
  });

  describe("absensi — single record", () => {
    it("handles single alpa record", () => {
      const siswa = { ...baseSiswa, absensi: mkAbsensi(["alpa"]) };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.totalHari).toBe(1);
      expect(result.hariAlpa).toBe(1);
      expect(result.alpaBeruntunMaks).toBe(1);
    });

    it("handles single hadir record", () => {
      const siswa = { ...baseSiswa, absensi: mkAbsensi(["hadir"]) };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.totalHari).toBe(1);
      expect(result.hariAlpa).toBe(0);
      expect(result.alpaBeruntunMaks).toBe(0);
    });
  });

  describe("absensi — ordering matters for beruntun", () => {
    it("sorts by tanggal before computing streak", () => {
      // Provide out-of-order dates: day3=alpa, day1=alpa, day2=hadir
      const absensi: SiswaWithData["absensi"] = [
        { tanggal: new Date(2026, 0, 3), status: "alpa" },
        { tanggal: new Date(2026, 0, 1), status: "alpa" },
        { tanggal: new Date(2026, 0, 2), status: "hadir" },
      ];
      const siswa = { ...baseSiswa, absensi };
      const result = buildSiswaInput(siswa, basePII);
      // sorted: day1=alpa, day2=hadir, day3=alpa → max streak = 1
      expect(result.alpaBeruntunMaks).toBe(1);
    });
  });

  describe("nilai — empty", () => {
    it("rataNilaiSekarang=0, rataNilaiSebelumnya=undefined, mapelDiBawahKkm=0", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.rataNilaiSekarang).toBe(0);
      expect(result.rataNilaiSebelumnya).toBe(undefined);
      expect(result.mapelDiBawahKkm).toBe(0);
    });
  });

  describe("nilai — current period only", () => {
    it("computes average and mapelDiBawahKkm", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "Matematika", periode: "2026-genap", nilai: 60, kkm: 70 },
          { mapel: "Bahasa Indonesia", periode: "2026-genap", nilai: 80, kkm: 70 },
          { mapel: "IPA", periode: "2026-genap", nilai: 65, kkm: 70 },
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      // avg = (60+80+65)/3 = 68.33...
      expect(result.rataNilaiSekarang).toBeGreaterThan(68);
      expect(result.rataNilaiSekarang).toBeLessThanOrEqual(69);
      expect(result.mapelDiBawahKkm).toBe(2); // Matematika(60<70), IPA(65<70)
      expect(result.rataNilaiSebelumnya).toBe(undefined);
    });
  });

  describe("nilai — both periods", () => {
    it("computes rataNilaiSebelumnya from previous period", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "Matematika", periode: "2026-genap", nilai: 70 },
          { mapel: "Matematika", periode: "2025-ganjil", nilai: 80 },
          { mapel: "IPA", periode: "2025-ganjil", nilai: 90 },
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.rataNilaiSekarang).toBe(70);
      expect(result.rataNilaiSebelumnya).toBe(85); // (80+90)/2
    });
  });

  describe("nilai — nilaiMatematika and nilaiBahasa", () => {
    it("extracts specific subjects from current period", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "Matematika", periode: "2026-genap", nilai: 55 },
          { mapel: "Bahasa Indonesia", periode: "2026-genap", nilai: 72 },
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.nilaiMatematika).toBe(55);
      expect(result.nilaiBahasa).toBe(72);
    });

    it("returns undefined when subjects missing from current period", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([{ mapel: "IPA", periode: "2026-genap", nilai: 80 }]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.nilaiMatematika).toBe(undefined);
      expect(result.nilaiBahasa).toBe(undefined);
    });

    it("does not pick subjects from previous period", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "Matematika", periode: "2025-ganjil", nilai: 90 },
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.nilaiMatematika).toBe(undefined);
    });
  });

  describe("nilai — kkm default", () => {
    it("uses first current-period kkm value, defaults 70 if no current nilai", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.kkm).toBe(70);
    });

    it("picks kkm from first current-period entry", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "IPA", periode: "2026-genap", nilai: 80, kkm: 75 },
          { mapel: "MTK", periode: "2026-genap", nilai: 60, kkm: 65 },
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.kkm).toBe(75);
    });
  });

  describe("hardcoded defaults", () => {
    it("catatanDisiplin=0, partisipasi=2, pctTugasTidakKumpul=0, pernahTinggalKelas=false", () => {
      const result = buildSiswaInput(baseSiswa, basePII);
      expect(result.catatanDisiplin).toBe(0);
      expect(result.partisipasi).toBe(2);
      expect(result.pctTugasTidakKumpul).toBe(0);
      expect(result.pernahTinggalKelas).toBe(false);
    });
  });

  describe("mapelDiBawahKkm — per-entry kkm", () => {
    it("uses each entry own kkm for comparison", () => {
      const siswa = {
        ...baseSiswa,
        nilai: mkNilai([
          { mapel: "A", periode: "2026-genap", nilai: 69, kkm: 70 }, // below
          { mapel: "B", periode: "2026-genap", nilai: 60, kkm: 60 }, // exactly at kkm, NOT below
          { mapel: "C", periode: "2026-genap", nilai: 59, kkm: 60 }, // below
        ]),
      };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.mapelDiBawahKkm).toBe(2);
    });
  });

  describe("penerimaKip flag", () => {
    it("passes through true", () => {
      const siswa = { ...baseSiswa, penerimaKip: true };
      const result = buildSiswaInput(siswa, basePII);
      expect(result.penerimaKip).toBe(true);
    });
  });
});
