import { describe, it } from "node:test";
import { expect } from "./_expect";
import { NAV_ITEMS, navForRole, canAccess, roleLabel, SECTION_LABEL } from "@/lib/nav";

const ALL_ROLES = ["superadmin", "dinas", "kepsek", "guru", "bk"] as const;

describe("NAV_ITEMS", () => {
  it("all items have required fields", () => {
    for (const item of NAV_ITEMS) {
      expect(typeof item.href).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.icon).toBe("string");
      expect(item.roles.length).toBeGreaterThan(0);
    }
  });

  it("no duplicate href", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("navForRole — counts", () => {
  it("superadmin has 12 items", () => {
    expect(navForRole("superadmin")).toHaveLength(12);
  });
  it("dinas has 6 items", () => {
    expect(navForRole("dinas")).toHaveLength(6);
  });
  it("kepsek has 8 items", () => {
    expect(navForRole("kepsek")).toHaveLength(8);
  });
  it("guru has 5 items", () => {
    expect(navForRole("guru")).toHaveLength(5);
  });
  it("bk has 6 items", () => {
    expect(navForRole("bk")).toHaveLength(6);
  });
});

describe("navForRole — superadmin (aggregate + governance, NO student menu)", () => {
  const hrefs = navForRole("superadmin").map((i) => i.href);
  it("beranda label is 'Ikhtisar Nasional'", () => {
    expect(navForRole("superadmin").find((i) => i.href === "/dashboard")!.label).toBe("Ikhtisar Nasional");
  });
  it("includes new analytics pages", () => {
    expect(hrefs).toContain("/dashboard/analisis-risiko");
    expect(hrefs).toContain("/dashboard/akademik");
    expect(hrefs).toContain("/dashboard/kehadiran");
    expect(hrefs).toContain("/dashboard/demografi");
    expect(hrefs).toContain("/dashboard/intervensi");
    expect(hrefs).toContain("/dashboard/putus-sekolah");
  });
  it("includes governance + sync", () => {
    expect(hrefs).toContain("/dashboard/admin/tenant");
    expect(hrefs).toContain("/dashboard/admin/users");
    expect(hrefs).toContain("/dashboard/admin/sync");
    expect(hrefs).toContain("/dashboard/admin/audit");
    expect(hrefs).toContain("/dashboard/admin/security");
  });
  it("does NOT see per-student Daftar Siswa", () => {
    expect(hrefs).not.toContain("/dashboard/siswa");
  });
  it("items are grouped (analitik/platform/keamanan sections present)", () => {
    const sections = new Set(navForRole("superadmin").map((i) => i.section));
    expect(sections.has("analitik")).toBe(true);
    expect(sections.has("platform")).toBe(true);
    expect(sections.has("keamanan")).toBe(true);
  });
});

describe("navForRole — dinas (aggregate-anonymous, NO student identity)", () => {
  const items = navForRole("dinas");
  const hrefs = items.map((i) => i.href);
  it("beranda label is 'Ringkasan Wilayah'", () => {
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Ringkasan Wilayah");
  });
  it("has comparison, akademik, kehadiran, intervensi, laporan", () => {
    expect(hrefs).toContain("/dashboard/perbandingan");
    expect(hrefs).toContain("/dashboard/akademik");
    expect(hrefs).toContain("/dashboard/kehadiran");
    expect(hrefs).toContain("/dashboard/intervensi");
    expect(hrefs).toContain("/dashboard/laporan");
  });
  it("does NOT see Daftar Siswa (no PII)", () => {
    expect(hrefs).not.toContain("/dashboard/siswa");
  });
});

describe("navForRole — kepsek (2 groups: sekolah + kelola)", () => {
  const items = navForRole("kepsek");
  const hrefs = items.map((i) => i.href);
  it("beranda label is 'Dashboard Sekolah'", () => {
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Dashboard Sekolah");
  });
  it("has kelas, siswa, akademik, kehadiran, intervensi", () => {
    expect(hrefs).toContain("/dashboard/kelas");
    expect(hrefs).toContain("/dashboard/siswa");
    expect(hrefs).toContain("/dashboard/akademik");
    expect(hrefs).toContain("/dashboard/kehadiran");
    expect(hrefs).toContain("/dashboard/intervensi");
  });
  it("has user + class management (fixes RBAC door gap)", () => {
    expect(hrefs).toContain("/dashboard/kelola/users");
    expect(hrefs).toContain("/dashboard/kelola/kelas");
  });
  it("does NOT see admin/agregat", () => {
    expect(hrefs).not.toContain("/dashboard/admin/tenant");
    expect(hrefs).not.toContain("/dashboard/analisis-risiko");
  });
  it("has both sekolah + kelola sections", () => {
    const sections = new Set(items.map((i) => i.section));
    expect(sections.has("sekolah")).toBe(true);
    expect(sections.has("kelola")).toBe(true);
  });
});

describe("navForRole — guru (LEAN, 5 items)", () => {
  const items = navForRole("guru");
  const hrefs = items.map((i) => i.href);
  it("labels are class-scoped", () => {
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Kelas Saya");
    expect(items.find((i) => i.href === "/dashboard/siswa")!.label).toBe("Siswa Saya");
    expect(items.find((i) => i.href === "/dashboard/intervensi")!.label).toBe("Rekap Tindak Lanjut");
  });
  it("has kehadiran + akademik (class context)", () => {
    expect(hrefs).toContain("/dashboard/kehadiran");
    expect(hrefs).toContain("/dashboard/akademik");
  });
  it("does NOT see aggregate/admin", () => {
    expect(hrefs).not.toContain("/dashboard/analisis-risiko");
    expect(hrefs).not.toContain("/dashboard/admin/users");
  });
});

describe("navForRole — bk (6 items, case management)", () => {
  const items = navForRole("bk");
  const hrefs = items.map((i) => i.href);
  it("labels", () => {
    expect(items.find((i) => i.href === "/dashboard")!.label).toBe("Dashboard BK");
    expect(items.find((i) => i.href === "/dashboard/siswa")!.label).toBe("Siswa Prioritas");
  });
  it("has intervensi recap + consent", () => {
    expect(hrefs).toContain("/dashboard/intervensi");
    expect(hrefs).toContain("/dashboard/consent");
    expect(hrefs).toContain("/dashboard/kehadiran");
    expect(hrefs).toContain("/dashboard/akademik");
  });
  it("does NOT see admin", () => {
    expect(hrefs).not.toContain("/dashboard/admin/security");
  });
});

describe("canAccess", () => {
  it("superadmin can access analytics + governance routes", () => {
    expect(canAccess("superadmin", "/dashboard")).toBe(true);
    expect(canAccess("superadmin", "/dashboard/analisis-risiko")).toBe(true);
    expect(canAccess("superadmin", "/dashboard/demografi")).toBe(true);
    expect(canAccess("superadmin", "/dashboard/admin/sync")).toBe(true);
    expect(canAccess("superadmin", "/dashboard/admin/security")).toBe(true);
  });

  it("superadmin has NO /dashboard/siswa nav entry (reaches students via drill-down only)", () => {
    expect(canAccess("superadmin", "/dashboard/siswa")).toBe(false);
    expect(canAccess("superadmin", "/dashboard/siswa/123")).toBe(false);
  });

  it("dinas: aggregate yes, student no", () => {
    expect(canAccess("dinas", "/dashboard/perbandingan")).toBe(true);
    expect(canAccess("dinas", "/dashboard/akademik")).toBe(true);
    expect(canAccess("dinas", "/dashboard/laporan")).toBe(true);
    expect(canAccess("dinas", "/dashboard/siswa")).toBe(false);
    expect(canAccess("dinas", "/dashboard/admin/tenant")).toBe(false);
  });

  it("kepsek: school scope + kelola, no admin", () => {
    expect(canAccess("kepsek", "/dashboard/kelas")).toBe(true);
    expect(canAccess("kepsek", "/dashboard/siswa/123")).toBe(true);
    expect(canAccess("kepsek", "/dashboard/kelola/users")).toBe(true);
    expect(canAccess("kepsek", "/dashboard/admin/audit")).toBe(false);
    expect(canAccess("kepsek", "/dashboard/analisis-risiko")).toBe(false);
  });

  it("guru: class scope only", () => {
    expect(canAccess("guru", "/dashboard/siswa/123")).toBe(true);
    expect(canAccess("guru", "/dashboard/akademik")).toBe(true);
    expect(canAccess("guru", "/dashboard/kehadiran")).toBe(true);
    expect(canAccess("guru", "/dashboard/analisis-risiko")).toBe(false);
    expect(canAccess("guru", "/dashboard/admin/users")).toBe(false);
  });

  it("bk: cases + consent", () => {
    expect(canAccess("bk", "/dashboard/consent")).toBe(true);
    expect(canAccess("bk", "/dashboard/intervensi")).toBe(true);
    expect(canAccess("bk", "/dashboard/admin/security")).toBe(false);
  });

  it("longest-prefix: nested student path inherits parent", () => {
    expect(canAccess("guru", "/dashboard/siswa/abc/detail")).toBe(true);
  });

  it("unknown / empty href returns false for all roles", () => {
    for (const role of ALL_ROLES) {
      expect(canAccess(role, "/unknown")).toBe(false);
      expect(canAccess(role, "")).toBe(false);
    }
  });
});

describe("SECTION_LABEL", () => {
  it("covers all sections", () => {
    expect(SECTION_LABEL.analitik).toBe("Analitik");
    expect(SECTION_LABEL.platform).toBe("Platform");
    expect(SECTION_LABEL.keamanan).toBe("Keamanan");
    expect(SECTION_LABEL.sekolah).toBe("Sekolah");
    expect(SECTION_LABEL.kelola).toBe("Kelola");
  });
});

describe("roleLabel", () => {
  it("maps all roles", () => {
    expect(roleLabel("superadmin")).toBe("Super Admin");
    expect(roleLabel("dinas")).toBe("Dinas Pendidikan");
    expect(roleLabel("kepsek")).toBe("Kepala Sekolah");
    expect(roleLabel("guru")).toBe("Wali Kelas");
    expect(roleLabel("bk")).toBe("Guru BK");
  });
});
