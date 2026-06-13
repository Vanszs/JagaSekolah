import { describe, it } from "node:test";
import { expect } from "./_expect";
import { SEED_REGIONS, ALL_SEED_SEKOLAH } from "@/lib/seed/regions";

describe("data wilayah Indonesia nyata", () => {
  it("≥12 provinsi nyata", () => expect(SEED_REGIONS.length).toBeGreaterThanOrEqual(12));

  it("setiap provinsi punya ≥1 kabupaten", () => {
    for (const p of SEED_REGIONS) expect(p.kabupatenList.length).toBeGreaterThanOrEqual(1);
  });

  it("setiap kabupaten punya ≥1 sekolah (tak ada wilayah kosong)", () => {
    for (const p of SEED_REGIONS) for (const k of p.kabupatenList) expect(k.sekolah.length).toBeGreaterThanOrEqual(1);
  });

  it("NPSN semua unik (tak ada duplikat tenant)", () => {
    const npsn = ALL_SEED_SEKOLAH.map((s) => s.npsn);
    expect(new Set(npsn).size).toBe(npsn.length);
  });

  it("NPSN format 8-digit numerik", () => {
    for (const s of ALL_SEED_SEKOLAH) expect(/^\d{8}$/.test(s.npsn)).toBe(true);
  });

  it("≥10 kabupaten 3T (realisme lapangan)", () => {
    const tiga_t = SEED_REGIONS.flatMap((p) => p.kabupatenList.filter((k) => k.is3T));
    expect(tiga_t.length).toBeGreaterThanOrEqual(10);
  });

  it("mencakup daerah kepulauan/pegunungan terpencil (Papua, Maluku, NTT)", () => {
    const provinsi = SEED_REGIONS.map((p) => p.provinsi);
    expect(provinsi).toContain("Papua Pegunungan");
    expect(provinsi).toContain("Maluku");
    expect(provinsi).toContain("Nusa Tenggara Timur");
  });

  it("TIDAK memakai nama sintetis lama", () => {
    const kabs = SEED_REGIONS.flatMap((p) => p.kabupatenList.map((k) => k.kabupaten));
    expect(kabs).not.toContain("Kabupaten Sintetis");
  });
});
