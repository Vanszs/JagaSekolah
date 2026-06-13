import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  transformPlatformByProvinsi,
  transformUsersByRole,
  transformConsentBySekolah,
  transformAuditByAksi,
  computeConsentPct,
} from "@/lib/analyticsKernels";

describe("transformPlatformByProvinsi", () => {
  it("empty → []", () => expect(transformPlatformByProvinsi([])).toHaveLength(0));
  it("aggregates two schools same provinsi", () => {
    const r = transformPlatformByProvinsi([
      { provinsi: "Nusa Tenggara Timur", siswaCount: 80, usersCount: 2 },
      { provinsi: "Nusa Tenggara Timur", siswaCount: 40, usersCount: 0 },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ provinsi: "Nusa Tenggara Timur", sekolah: 2, siswa: 120, pengguna: 2 });
  });
  it("sorts by siswa DESC", () => {
    const r = transformPlatformByProvinsi([
      { provinsi: "Maluku", siswaCount: 60, usersCount: 1 },
      { provinsi: "Jawa Tengah", siswaCount: 900, usersCount: 10 },
    ]);
    expect(r[0]!.provinsi).toBe("Jawa Tengah");
  });
  it("tie-break by provinsi name (stable)", () => {
    const r = transformPlatformByProvinsi([
      { provinsi: "Papua", siswaCount: 50, usersCount: 1 },
      { provinsi: "Aceh", siswaCount: 50, usersCount: 1 },
    ]);
    expect(r[0]!.provinsi).toBe("Aceh");
  });
  it("new school zero counts still listed (3T onboarding)", () => {
    const r = transformPlatformByProvinsi([{ provinsi: "Papua Pegunungan", siswaCount: 0, usersCount: 0 }]);
    expect(r[0]).toEqual({ provinsi: "Papua Pegunungan", sekolah: 1, siswa: 0, pengguna: 0 });
  });
});

describe("transformUsersByRole", () => {
  it("empty → []", () => expect(transformUsersByRole([])).toHaveLength(0));
  it("merges aktif + nonaktif for same role", () => {
    const r = transformUsersByRole([
      { role: "guru", aktif: true, count: 45 },
      { role: "guru", aktif: false, count: 5 },
    ]);
    expect(r[0]).toEqual({ role: "guru", total: 50, aktif: 45 });
  });
  it("all deactivated → aktif 0", () => {
    const r = transformUsersByRole([{ role: "guru", aktif: false, count: 10 }]);
    expect(r[0]).toEqual({ role: "guru", total: 10, aktif: 0 });
  });
});

describe("computeConsentPct (division-by-zero guard)", () => {
  it("0/0 → 0 (NOT NaN) — fresh school, common in 3T rollout", () => expect(computeConsentPct(0, 0)).toBe(0));
  it("all granted → 100", () => expect(computeConsentPct(45, 45)).toBe(100));
  it("rounds 2/3 → 67", () => expect(computeConsentPct(2, 3)).toBe(67));
  it("rounds 1/3 → 33", () => expect(computeConsentPct(1, 3)).toBe(33));
  it("exact half → 50", () => expect(computeConsentPct(5, 10)).toBe(50));
});

describe("transformConsentBySekolah", () => {
  it("empty schools → []", () => expect(transformConsentBySekolah([], [])).toHaveLength(0));
  it("school with no consent rows → all zero, pct 0", () => {
    const r = transformConsentBySekolah([{ id: "s1", nama: "SMP N 1 Kupang" }], []);
    expect(r[0]).toEqual({ id: "s1", nama: "SMP N 1 Kupang", granted: 0, pending: 0, revoked: 0, total: 0, pctGranted: 0 });
  });
  it("aggregates statuses + pct", () => {
    const r = transformConsentBySekolah(
      [{ id: "s1", nama: "SMP N 1 Ende" }],
      [
        { sekolahId: "s1", consentStatus: "granted", count: 80 },
        { sekolahId: "s1", consentStatus: "pending", count: 15 },
        { sekolahId: "s1", consentStatus: "revoked", count: 5 },
      ],
    );
    expect(r[0]!.total).toBe(100);
    expect(r[0]!.pctGranted).toBe(80);
  });
  it("orphan row (deleted school) ignored", () => {
    const r = transformConsentBySekolah(
      [{ id: "s1", nama: "A" }],
      [{ sekolahId: "ghost", consentStatus: "granted", count: 9 }],
    );
    expect(r[0]!.total).toBe(0);
  });
  it("sorts pctGranted ASC (worst compliance first)", () => {
    const r = transformConsentBySekolah(
      [{ id: "good", nama: "Patuh" }, { id: "bad", nama: "Rendah" }],
      [
        { sekolahId: "good", consentStatus: "granted", count: 10 },
        { sekolahId: "bad", consentStatus: "pending", count: 10 },
      ],
    );
    expect(r[0]!.id).toBe("bad");
  });
});

describe("transformAuditByAksi", () => {
  it("empty → []", () => expect(transformAuditByAksi([])).toHaveLength(0));
  it("take<=0 → []", () => expect(transformAuditByAksi([{ aksi: "x", count: 1 }], 0)).toHaveLength(0));
  it("sorts DESC + slices to take", () => {
    const r = transformAuditByAksi(
      [{ aksi: "a", count: 5 }, { aksi: "b", count: 50 }, { aksi: "c", count: 20 }],
      2,
    );
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({ aksi: "b", count: 50 });
    expect(r[1]).toEqual({ aksi: "c", count: 20 });
  });
});
