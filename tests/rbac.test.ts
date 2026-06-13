import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  siswaScope,
  agregatScope,
  assertSameSekolah,
  requireRole,
  creatableRoles,
  canCreateUser,
  canManageUsers,
  AuthError,
  type TenantContext,
} from "@/lib/rbac";

const ctx = (over: Partial<TenantContext>): TenantContext => ({
  userId: "u1",
  role: "guru",
  sekolahId: null,
  wilayahId: null,
  kelasId: null,
  provinsi: null,
  ...over,
});

describe("siswaScope", () => {
  it("guru dibatasi ke sekolah + kelasnya", () => {
    const s = siswaScope(ctx({ role: "guru", sekolahId: "sek1", kelasId: "kel1" }));
    expect(s).toEqual({ sekolahId: "sek1", kelasId: "kel1" });
  });

  it("kepsek dibatasi ke sekolahnya", () => {
    const s = siswaScope(ctx({ role: "kepsek", sekolahId: "sek1" }));
    expect(s).toEqual({ sekolahId: "sek1" });
  });

  it("bk dibatasi ke sekolahnya", () => {
    const s = siswaScope(ctx({ role: "bk", sekolahId: "sek2" }));
    expect(s).toEqual({ sekolahId: "sek2" });
  });

  it("superadmin tanpa filter", () => {
    expect(siswaScope(ctx({ role: "superadmin" }))).toEqual({});
  });

  it("dinas KABUPATEN → {sekolah:{wilayahId}}", () => {
    expect(siswaScope(ctx({ role: "dinas", wilayahId: "w1" }))).toEqual({ sekolah: { wilayahId: "w1" } });
  });
  it("dinas PROVINSI → {sekolah:{wilayah:{provinsi}}}", () => {
    expect(siswaScope(ctx({ role: "dinas", provinsi: "Jawa Timur" }))).toEqual({ sekolah: { wilayah: { provinsi: "Jawa Timur" } } });
  });
  it("dinas PUSAT (tanpa wilayah/provinsi) → {} (nasional)", () => {
    expect(siswaScope(ctx({ role: "dinas" }))).toEqual({});
  });

  it("guru tanpa kelas -> 403", () => {
    expect(() => siswaScope(ctx({ role: "guru", sekolahId: "sek1" }))).toThrow(AuthError);
  });

  it("kepsek tanpa sekolah -> 403", () => {
    expect(() => siswaScope(ctx({ role: "kepsek" }))).toThrow(AuthError);
  });
});

describe("agregatScope", () => {
  it("dinas dibatasi ke wilayahnya", () => {
    expect(agregatScope(ctx({ role: "dinas", wilayahId: "w1" }))).toEqual({ wilayahId: "w1" });
  });
  it("superadmin seluruh wilayah", () => {
    expect(agregatScope(ctx({ role: "superadmin" }))).toEqual({});
  });
  it("guru tidak boleh agregat -> 403", () => {
    expect(() => agregatScope(ctx({ role: "guru", sekolahId: "s1" }))).toThrow(AuthError);
  });
});

describe("assertSameSekolah (anti-IDOR)", () => {
  it("tolak akses lintas sekolah", () => {
    expect(() => assertSameSekolah(ctx({ role: "kepsek", sekolahId: "sekA" }), "sekB")).toThrow(AuthError);
  });
  it("izinkan akses sekolah sendiri", () => {
    expect(() => assertSameSekolah(ctx({ role: "kepsek", sekolahId: "sekA" }), "sekA")).not.toThrow();
  });
  it("superadmin lewat semua", () => {
    expect(() => assertSameSekolah(ctx({ role: "superadmin" }), "apapun")).not.toThrow();
  });
});

describe("requireRole", () => {
  it("lempar 403 jika role tidak diizinkan", () => {
    expect(() => requireRole(ctx({ role: "guru" }), "dinas", "superadmin")).toThrow(AuthError);
  });
  it("lolos jika role diizinkan", () => {
    expect(() => requireRole(ctx({ role: "bk" }), "bk", "kepsek")).not.toThrow();
  });
});

describe("creatableRoles / canCreateUser (siapa boleh menambah user)", () => {
  it("superadmin boleh membuat semua peran", () => {
    expect(creatableRoles("superadmin")).toEqual(["dinas", "kepsek", "guru", "bk"]);
    for (const r of ["dinas", "kepsek", "guru", "bk"] as const) {
      expect(canCreateUser("superadmin", r)).toBe(true);
    }
  });

  it("kepsek hanya boleh membuat guru & bk", () => {
    expect(creatableRoles("kepsek")).toEqual(["guru", "bk"]);
    expect(canCreateUser("kepsek", "guru")).toBe(true);
    expect(canCreateUser("kepsek", "bk")).toBe(true);
    expect(canCreateUser("kepsek", "kepsek")).toBe(false);
    expect(canCreateUser("kepsek", "dinas")).toBe(false);
  });

  it("dinas, guru, bk TIDAK boleh membuat akun apa pun", () => {
    for (const actor of ["dinas", "guru", "bk"] as const) {
      expect(creatableRoles(actor)).toEqual([]);
      expect(canManageUsers(actor)).toBe(false);
      for (const target of ["dinas", "kepsek", "guru", "bk"] as const) {
        expect(canCreateUser(actor, target)).toBe(false);
      }
    }
  });

  it("canManageUsers true hanya untuk superadmin & kepsek", () => {
    expect(canManageUsers("superadmin")).toBe(true);
    expect(canManageUsers("kepsek")).toBe(true);
    expect(canManageUsers("dinas")).toBe(false);
    expect(canManageUsers("guru")).toBe(false);
    expect(canManageUsers("bk")).toBe(false);
  });

  it("tak ada peran yang bisa membuat superadmin (cegah eskalasi privilese)", () => {
    for (const actor of ["superadmin", "dinas", "kepsek", "guru", "bk"] as const) {
      expect(creatableRoles(actor)).not.toContain("superadmin");
    }
  });
});
