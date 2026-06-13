import { describe, it } from "node:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect } from "./_expect";
import { NAV_ITEMS, navForRole, canAccess } from "@/lib/nav";

const ALL_ROLES = ["superadmin", "dinas", "kepsek", "guru", "bk"] as const;
const APP_DIR = join(process.cwd(), "src", "app");

/** href → apakah ada page.tsx di disk (dead-link guard). */
function pageExists(href: string): boolean {
  return existsSync(join(APP_DIR, href, "page.tsx"));
}

describe("nav integrity — no dead links", () => {
  it("every NAV_ITEMS href has a real page.tsx on disk", () => {
    for (const item of NAV_ITEMS) {
      expect(pageExists(item.href)).toBe(true);
    }
  });

  it("every drill-down dynamic route page exists", () => {
    const dynamicRoutes = [
      "/dashboard/wilayah/[provinsi]",
      "/dashboard/kabupaten/[wilayahId]",
      "/dashboard/sekolah/[id]",
      "/dashboard/sekolah/[id]/kelas/[kelasId]",
      "/dashboard/siswa/[id]",
    ];
    for (const r of dynamicRoutes) expect(pageExists(r)).toBe(true);
  });
});

describe("canAccess consistency with navForRole", () => {
  it("every visible nav item is accessible to its role", () => {
    for (const role of ALL_ROLES) {
      for (const item of navForRole(role)) {
        expect(canAccess(role, item.href)).toBe(true);
      }
    }
  });

  it("superadmin has NO /dashboard/siswa nav entry (drill-down only)", () => {
    expect(canAccess("superadmin", "/dashboard/siswa")).toBe(false);
    expect(canAccess("superadmin", "/dashboard/siswa/abc")).toBe(false);
  });

  it("dinas: siswa drill-down allowed, root/kelola/consent denied", () => {
    expect(canAccess("dinas", "/dashboard/siswa")).toBe(true);
    expect(canAccess("dinas", "/dashboard/siswa/x")).toBe(true);
    for (const href of ["/dashboard/consent", "/dashboard/admin/tenant", "/dashboard/admin/security", "/dashboard/kelola/users"]) {
      expect(canAccess("dinas", href)).toBe(false);
    }
  });

  it("guru/bk denied admin + kelola", () => {
    for (const role of ["guru", "bk"] as const) {
      expect(canAccess(role, "/dashboard/admin/audit")).toBe(false);
      expect(canAccess(role, "/dashboard/kelola/kelas")).toBe(false);
      expect(canAccess(role, "/dashboard/analisis-risiko")).toBe(false);
    }
  });

  it("kepsek allowed kelola + sekolah, denied admin + national analytics", () => {
    expect(canAccess("kepsek", "/dashboard/kelola/users")).toBe(true);
    expect(canAccess("kepsek", "/dashboard/kelas")).toBe(true);
    expect(canAccess("kepsek", "/dashboard/admin/tenant")).toBe(false);
    expect(canAccess("kepsek", "/dashboard/analisis-risiko")).toBe(false);
  });

  it("unknown / empty href denied for all roles", () => {
    for (const role of ALL_ROLES) {
      expect(canAccess(role, "/nope")).toBe(false);
      expect(canAccess(role, "")).toBe(false);
    }
  });
});
