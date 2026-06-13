import { describe, it } from "node:test";
import { expect } from "./_expect";
import { NAV_ITEMS, navForRole, canAccess, roleLabel } from "@/lib/nav";

const ALL_ROLES = ["superadmin", "dinas", "kepsek", "guru", "bk"] as const;

describe("NAV_ITEMS", () => {
  it("has 7 items", () => {
    expect(NAV_ITEMS).toHaveLength(7);
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
  it("superadmin sees platform menu (Nasional, Siswa? no — admin items)", () => {
    const items = navForRole("superadmin");
    const hrefs = items.map((i) => i.href);
    // Beranda + Monitoring Nasional (agregat) + Tenant + Users + Audit + Security = 6
    expect(items).toHaveLength(6);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/agregat");
    expect(hrefs).toContain("/dashboard/admin/tenant");
    expect(hrefs).toContain("/dashboard/admin/users");
    expect(hrefs).toContain("/dashboard/admin/audit");
    expect(hrefs).toContain("/dashboard/admin/security");
  });

  it("superadmin beranda label is 'Dashboard Nasional'", () => {
    const home = navForRole("superadmin").find((i) => i.href === "/dashboard");
    expect(home!.label).toBe("Dashboard Nasional");
  });

  it("superadmin does NOT see per-student Daftar Siswa", () => {
    const hrefs = navForRole("superadmin").map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/siswa");
  });

  it("dinas sees Dashboard Wilayah + Peta Risiko (2 items)", () => {
    const items = navForRole("dinas");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/agregat");
  });

  it("dinas beranda label is 'Dashboard Wilayah', agregat is 'Peta Risiko'", () => {
    const items = navForRole("dinas");
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Dashboard Wilayah");
    expect(items.find((i) => i.href === "/dashboard/agregat")!.label).toBe("Peta Risiko");
  });

  it("dinas does NOT see Daftar Siswa", () => {
    const hrefs = navForRole("dinas").map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/siswa");
  });

  it("kepsek sees Dashboard Sekolah + Daftar Siswa (2 items)", () => {
    const items = navForRole("kepsek");
    expect(items).toHaveLength(2);
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/dashboard/siswa");
  });

  it("kepsek does NOT see Agregat or admin items", () => {
    const hrefs = navForRole("kepsek").map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
    expect(hrefs).not.toContain("/dashboard/admin/tenant");
  });

  it("guru sees Dashboard Kelas + Siswa Saya (2 items)", () => {
    const items = navForRole("guru");
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Dashboard Kelas");
    expect(items.find((i) => i.href === "/dashboard/siswa")!.label).toBe("Siswa Saya");
  });

  it("guru does NOT see Agregat", () => {
    const hrefs = navForRole("guru").map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
  });

  it("bk sees Dashboard BK + Daftar Kasus (2 items)", () => {
    const items = navForRole("bk");
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Dashboard BK");
    expect(items.find((i) => i.href === "/dashboard/siswa")!.label).toBe("Daftar Kasus");
  });

  it("bk does NOT see Agregat or admin items", () => {
    const hrefs = navForRole("bk").map((i) => i.href);
    expect(hrefs).not.toContain("/dashboard/agregat");
    expect(hrefs).not.toContain("/dashboard/admin/users");
  });
});

describe("canAccess", () => {
  describe("exact matches", () => {
    it("superadmin can access all platform hrefs", () => {
      expect(canAccess("superadmin", "/dashboard")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/agregat")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/admin/tenant")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/admin/users")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/admin/audit")).toBe(true);
      expect(canAccess("superadmin", "/dashboard/admin/security")).toBe(true);
    });

    it("dinas can access /dashboard and /dashboard/agregat", () => {
      expect(canAccess("dinas", "/dashboard")).toBe(true);
      expect(canAccess("dinas", "/dashboard/agregat")).toBe(true);
    });

    it("dinas CANNOT access /dashboard/siswa or admin", () => {
      expect(canAccess("dinas", "/dashboard/siswa")).toBe(false);
      expect(canAccess("dinas", "/dashboard/admin/tenant")).toBe(false);
    });

    it("guru can access /dashboard and /dashboard/siswa", () => {
      expect(canAccess("guru", "/dashboard")).toBe(true);
      expect(canAccess("guru", "/dashboard/siswa")).toBe(true);
    });

    it("guru CANNOT access /dashboard/agregat or admin", () => {
      expect(canAccess("guru", "/dashboard/agregat")).toBe(false);
      expect(canAccess("guru", "/dashboard/admin/users")).toBe(false);
    });

    it("kepsek can access /dashboard and /dashboard/siswa", () => {
      expect(canAccess("kepsek", "/dashboard")).toBe(true);
      expect(canAccess("kepsek", "/dashboard/siswa")).toBe(true);
    });

    it("kepsek CANNOT access /dashboard/agregat or admin", () => {
      expect(canAccess("kepsek", "/dashboard/agregat")).toBe(false);
      expect(canAccess("kepsek", "/dashboard/admin/audit")).toBe(false);
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
      expect(canAccess("superadmin", "/dashboard/siswa/123")).toBe(false); // superadmin tak punya /siswa
      expect(canAccess("guru", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("kepsek", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("bk", "/dashboard/siswa/123")).toBe(true);
      expect(canAccess("dinas", "/dashboard/siswa/123")).toBe(false);
    });

    it("/dashboard/agregat/kecamatan inherits /dashboard/agregat permissions", () => {
      expect(canAccess("superadmin", "/dashboard/agregat/kecamatan")).toBe(true);
      expect(canAccess("dinas", "/dashboard/agregat/kecamatan")).toBe(true);
      expect(canAccess("guru", "/dashboard/agregat/kecamatan")).toBe(false);
    });

    it("/dashboard/admin/users/123 inherits /dashboard/admin/users", () => {
      expect(canAccess("superadmin", "/dashboard/admin/users/123")).toBe(true);
      expect(canAccess("kepsek", "/dashboard/admin/users/123")).toBe(false);
    });
  });

  describe("unknown href returns false", () => {
    it("completely unknown path", () => {
      for (const role of ALL_ROLES) {
        expect(canAccess(role, "/unknown")).toBe(false);
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
