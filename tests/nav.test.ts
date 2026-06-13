import { describe, it } from "node:test";
import { expect } from "./_expect";
import { NAV_ITEMS, navForRole, canAccess, roleLabel } from "@/lib/nav";

const ALL_ROLES = ["superadmin", "dinas", "kepsek", "guru", "bk"] as const;

describe("NAV_ITEMS", () => {
  it("has 3 items", () => {
    expect(NAV_ITEMS).toHaveLength(3);
  });

  it("all items have required fields", () => {
    for (const item of NAV_ITEMS) {
      expect(typeof item.href).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.icon).toBe("string");
      expect(item.roles.length).toBeGreaterThan(0);
    }
  });
});

describe("navForRole", () => {
  it("superadmin sees all 3 items", () => {
    const items = navForRole("superadmin");
    expect(items).toHaveLength(3);
  });

  it("dinas sees Ringkasan + Agregat (2 items)", () => {
    const items = navForRole("dinas");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/agregat");
  });

  it("dinas does NOT see Daftar Siswa", () => {
    const items = navForRole("dinas");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/siswa");
  });

  it("kepsek sees Ringkasan + Daftar Siswa (2 items)", () => {
    const items = navForRole("kepsek");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/siswa");
  });

  it("kepsek does NOT see Agregat", () => {
    const items = navForRole("kepsek");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
  });

  it("guru sees Ringkasan + Daftar Siswa (2 items)", () => {
    const items = navForRole("guru");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/siswa");
  });

  it("guru does NOT see Agregat", () => {
    const items = navForRole("guru");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
  });

  it("bk sees Ringkasan + Daftar Siswa (2 items)", () => {
    const items = navForRole("bk");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/siswa");
  });

  it("bk does NOT see Agregat", () => {
    const items = navForRole("bk");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
  });
});

describe("canAccess", () => {
  describe("exact matches", () => {
    it("superadmin can access all hrefs", () => {
      expect(canAccess("superadmin", "/dashboard")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/siswa")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/agregat")).toBe(true);
    });

    it("dinas can access /dashboard and /dashboard/agregat", () => {
      expect(canAccess("dinas", "/dashboard")).toBe(true);
      expect(canAccess("dinas", "/dashboard/agregat")).toBe(true);
    });

    it("dinas CANNOT access /dashboard/siswa", () => {
      expect(canAccess("dinas", "/dashboard/siswa")).toBe(false);
    });

    it("guru can access /dashboard and /dashboard/siswa", () => {
      expect(canAccess("guru", "/dashboard")).toBe(true);
      expect(canAccess("guru", "/dashboard/siswa")).toBe(true);
    });

    it("guru CANNOT access /dashboard/agregat", () => {
      expect(canAccess("guru", "/dashboard/agregat")).toBe(false);
    });

    it("kepsek can access /dashboard and /dashboard/siswa", () => {
      expect(canAccess("kepsek", "/dashboard")).toBe(true);
      expect(canAccess("kepsek", "/dashboard/siswa")).toBe(true);
    });

    it("kepsek CANNOT access /dashboard/agregat", () => {
      expect(canAccess("kepsek", "/dashboard/agregat")).toBe(false);
    });

    it("bk can access /dashboard and /dashboard/siswa", () => {
      expect(canAccess("bk", "/dashboard")).toBe(true);
      expect(canAccess("bk", "/dashboard/siswa")).toBe(true);
    });

    it("bk CANNOT access /dashboard/agregat", () => {
      expect(canAccess("bk", "/dashboard/agregat")).toBe(false);
    });
  });

  describe("longest-prefix matching (nested paths)", () => {
    it("/dashboard/siswa/123 inherits /dashboard/siswa permissions", () => {
      expect(canAccess("superadmin", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("guru", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("kepsek", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("bk", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("dinas", "/dashboard/siswa/123")).toBe(false);
    });

    it("/dashboard/agregat/kecamatan inherits /dashboard/agregat permissions", () => {
      expect(canAccess("superadmin", "/dashboard/agregat/kecamatan")).toBe(true);
      expect(canAccess("dinas", "/dashboard/agregat/kecamatan")).toBe(true);
      expect(canAccess("guru", "/dashboard/agregat/kecamatan")).toBe(false);
      expect(canAccess("kepsek", "/dashboard/agregat/kecamatan")).toBe(false);
      expect(canAccess("bk", "/dashboard/agregat/kecamatan")).toBe(false);
    });

    it("deeply nested /dashboard/siswa/123/interventions uses /dashboard/siswa", () => {
      expect(canAccess("guru", "/dashboard/siswa/123/interventions")).toBe(true);
      expect(canAccess("dinas", "/dashboard/siswa/123/interventions")).toBe(false);
    });
  });

  describe("unknown href returns false", () => {
    it("completely unknown path", () => {
      for (const role of ALL_ROLES) {
        expect(canAccess(role, "/unknown")).toBe(false);
      }
    });

    it("/settings is not a nav item", () => {
      for (const role of ALL_ROLES) {
        expect(canAccess(role, "/settings")).toBe(false);
      }
    });

    it("empty string returns false", () => {
      for (const role of ALL_ROLES) {
        expect(canAccess(role, "")).toBe(false);
      }
    });
  });
});

describe("roleLabel", () => {
  it("superadmin -> Super Admin", () => {
    expect(roleLabel("superadmin")).toBe("Super Admin");
  });

  it("dinas -> Dinas Pendidikan", () => {
    expect(roleLabel("dinas")).toBe("Dinas Pendidikan");
  });

  it("kepsek -> Kepala Sekolah", () => {
    expect(roleLabel("kepsek")).toBe("Kepala Sekolah");
  });

  it("guru -> Wali Kelas", () => {
    expect(roleLabel("guru")).toBe("Wali Kelas");
  });

  it("bk -> Guru BK", () => {
    expect(roleLabel("bk")).toBe("Guru BK");
  });
});
