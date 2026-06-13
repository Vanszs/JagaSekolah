import { describe, it } from "node:test";
import { expect } from "./_expect";
import { buildSaran } from "@/lib/scoring/explain";
import type { AlasanItem } from "@/lib/scoring/types";

function item(kode: string, bobot = 10): AlasanItem {
  return { kode, pesan: `pesan ${kode}`, bobot };
}

describe("buildSaran", () => {
  describe("attendance-related saran", () => {
    it("suggests kunjungan rumah for absen_kritis", () => {
      const saran = buildSaran([item("absen_kritis")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("kunjungan rumah");
    });

    it("suggests kunjungan rumah for alpa_beruntun", () => {
      const saran = buildSaran([item("alpa_beruntun")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("kunjungan rumah");
    });

    it("suggests pantau kehadiran for absen_waspada", () => {
      const saran = buildSaran([item("absen_waspada")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Pantau kehadiran");
    });

    it("suggests pantau kehadiran for tren_absensi", () => {
      const saran = buildSaran([item("tren_absensi")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Pantau kehadiran");
    });
  });

  describe("economic factor saran", () => {
    it("suggests KIP/PIP for faktor_ekonomi", () => {
      const saran = buildSaran([item("faktor_ekonomi")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("KIP/PIP");
    });
  });

  describe("academic saran", () => {
    it("suggests remedial for nilai_turun", () => {
      const saran = buildSaran([item("nilai_turun")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("remedial");
    });

    it("suggests remedial for mapel_kkm", () => {
      const saran = buildSaran([item("mapel_kkm")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("remedial");
    });

    it("suggests remedial for nilai_inti", () => {
      const saran = buildSaran([item("nilai_inti")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("remedial");
    });
  });

  describe("behavior saran", () => {
    it("suggests BK konseling for disiplin", () => {
      const saran = buildSaran([item("disiplin")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Guru BK");
    });

    it("suggests BK konseling for partisipasi", () => {
      const saran = buildSaran([item("partisipasi")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Guru BK");
    });

    it("suggests BK konseling for tugas", () => {
      const saran = buildSaran([item("tugas")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Guru BK");
    });
  });

  describe("family saran", () => {
    it("suggests dukungan psikososial for keluarga_rentan", () => {
      const saran = buildSaran([item("keluarga_rentan")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("psikososial");
    });
  });

  describe("empty reasons → default saran", () => {
    it("returns pertahankan pemantauan for empty array", () => {
      const saran = buildSaran([]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Pertahankan pemantauan");
    });

    it("returns pertahankan pemantauan for unrecognized kode", () => {
      const saran = buildSaran([item("unknown_code")]);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("Pertahankan pemantauan");
    });
  });

  describe("multiple factors produce multiple saran", () => {
    it("generates distinct saran for attendance + academic + behavior", () => {
      const alasan = [
        item("absen_kritis", 30),
        item("nilai_turun", 15),
        item("disiplin", 8),
      ];
      const saran = buildSaran(alasan);
      expect(saran).toHaveLength(3);
      expect(saran[0]).toContain("kunjungan rumah");
      expect(saran[1]).toContain("remedial");
      expect(saran[2]).toContain("Guru BK");
    });

    it("deduplicates — absen_kritis + alpa_beruntun produce one saran", () => {
      const alasan = [item("absen_kritis", 30), item("alpa_beruntun", 20)];
      const saran = buildSaran(alasan);
      // Only one attendance saran since both trigger same branch
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("kunjungan rumah");
    });

    it("deduplicates — nilai_turun + mapel_kkm + nilai_inti produce one saran", () => {
      const alasan = [
        item("nilai_turun", 15),
        item("mapel_kkm", 15),
        item("nilai_inti", 10),
      ];
      const saran = buildSaran(alasan);
      expect(saran).toHaveLength(1);
      expect(saran[0]).toContain("remedial");
    });

    it("all categories present → 6 saran", () => {
      const alasan = [
        item("absen_kritis", 30),
        item("absen_waspada", 15),
        item("faktor_ekonomi", 8),
        item("nilai_turun", 15),
        item("disiplin", 8),
        item("keluarga_rentan", 7),
      ];
      const saran = buildSaran(alasan);
      expect(saran).toHaveLength(6);
    });
  });
});
