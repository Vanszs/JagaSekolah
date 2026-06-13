import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  siswaScope,
  agregatScope,
  requireRole,
  assertSameSekolah,
  creatableRoles,
  canCreateUser,
  canManageUsers,
  AuthError,
  type TenantContext,
} from "@/lib/rbac";
import { analyticsScope, isAggregateRole } from "@/lib/dashboardScope";
import { authorizeResolvedSiswa } from "@/lib/resolveSiswa";

// ── Fixtures: real Indonesian regions ──────────────────────────────────
const SEK_MENTAWAI = "sek-smpn1-siberut"; // SMP N 1 Siberut, Kab. Kepulauan Mentawai (Sumbar, 3T)
const SEK_PADANG = "sek-smpn2-padang"; // SMP N 2 Padang (sekolah lain)
const WIL_NTT = "wil-ntt-manggarai"; // Kab. Manggarai, NTT
const KELAS_8A = "kls-8a";
const KELAS_8B = "kls-8b";

const ctx = (over: Partial<TenantContext>): TenantContext => ({
  userId: "u1", role: "guru", sekolahId: null, wilayahId: null, kelasId: null, ...over,
});
const superadmin = ctx({ role: "superadmin" });
const dinas = ctx({ role: "dinas", wilayahId: WIL_NTT });
const kepsek = ctx({ role: "kepsek", sekolahId: SEK_MENTAWAI });
const guru = ctx({ role: "guru", sekolahId: SEK_MENTAWAI, kelasId: KELAS_8A });
const bk = ctx({ role: "bk", sekolahId: SEK_MENTAWAI });

describe("siswaScope per role", () => {
  it("superadmin → {} (national)", () => expect(siswaScope(superadmin)).toEqual({}));
  it("dinas → {sekolah:{wilayahId}} (wilayah-scoped, dapat telusur hingga siswa)", () => expect(siswaScope(dinas)).toEqual({ sekolah: { wilayahId: WIL_NTT } }));
  it("dinas tanpa wilayahId → 403", () => expect(() => siswaScope(ctx({ role: "dinas" }))).toThrow(AuthError));
  it("kepsek → {sekolahId}", () => expect(siswaScope(kepsek)).toEqual({ sekolahId: SEK_MENTAWAI }));
  it("bk → {sekolahId}", () => expect(siswaScope(bk)).toEqual({ sekolahId: SEK_MENTAWAI }));
  it("guru → {sekolahId, kelasId}", () => expect(siswaScope(guru)).toEqual({ sekolahId: SEK_MENTAWAI, kelasId: KELAS_8A }));
  it("kepsek without sekolahId → 403 (provisioning delay 3T)", () => expect(() => siswaScope(ctx({ role: "kepsek" }))).toThrow(AuthError));
  it("guru without kelasId → 403 (belum diassign wali)", () => expect(() => siswaScope(ctx({ role: "guru", sekolahId: SEK_MENTAWAI }))).toThrow(AuthError));
  it("guru without sekolahId → 403", () => expect(() => siswaScope(ctx({ role: "guru", kelasId: KELAS_8A }))).toThrow(AuthError));
  it("bk stale kelasId is ignored (was guru before)", () => expect(siswaScope(ctx({ role: "bk", sekolahId: SEK_MENTAWAI, kelasId: KELAS_8B }))).toEqual({ sekolahId: SEK_MENTAWAI }));
});

describe("agregatScope per role", () => {
  it("superadmin → {} (all wilayah)", () => expect(agregatScope(superadmin)).toEqual({}));
  it("dinas → {wilayahId}", () => expect(agregatScope(dinas)).toEqual({ wilayahId: WIL_NTT }));
  it("dinas without wilayahId → 403", () => expect(() => agregatScope(ctx({ role: "dinas" }))).toThrow(AuthError));
  it("kepsek → 403 (no aggregate)", () => expect(() => agregatScope(kepsek)).toThrow(AuthError));
  it("guru → 403", () => expect(() => agregatScope(guru)).toThrow(AuthError));
});

describe("analyticsScope per role (dinas allowed aggregate-anonymous)", () => {
  it("superadmin → {}", () => expect(analyticsScope(superadmin)).toEqual({}));
  it("dinas → {sekolah:{wilayahId}} (aggregate, no PII)", () => expect(analyticsScope(dinas)).toEqual({ sekolah: { wilayahId: WIL_NTT } }));
  it("dinas without wilayahId → 403 (never unscoped national)", () => expect(() => analyticsScope(ctx({ role: "dinas" }))).toThrow(AuthError));
  it("kepsek → {sekolahId}", () => expect(analyticsScope(kepsek)).toEqual({ sekolahId: SEK_MENTAWAI }));
  it("guru → {sekolahId, kelasId}", () => expect(analyticsScope(guru)).toEqual({ sekolahId: SEK_MENTAWAI, kelasId: KELAS_8A }));
  it("guru without kelasId → 403", () => expect(() => analyticsScope(ctx({ role: "guru", sekolahId: SEK_MENTAWAI }))).toThrow(AuthError));
});

describe("isAggregateRole", () => {
  it("superadmin true", () => expect(isAggregateRole("superadmin")).toBe(true));
  it("dinas true", () => expect(isAggregateRole("dinas")).toBe(true));
  it("kepsek false", () => expect(isAggregateRole("kepsek")).toBe(false));
  it("guru false", () => expect(isAggregateRole("guru")).toBe(false));
  it("bk false", () => expect(isAggregateRole("bk")).toBe(false));
});

describe("creatableRoles / canCreateUser / canManageUsers", () => {
  it("superadmin creates all 4", () => expect(creatableRoles("superadmin")).toEqual(["dinas", "kepsek", "guru", "bk"]));
  it("kepsek creates guru+bk only", () => expect(creatableRoles("kepsek")).toEqual(["guru", "bk"]));
  it("dinas creates none", () => expect(creatableRoles("dinas")).toEqual([]));
  it("guru creates none", () => expect(creatableRoles("guru")).toEqual([]));
  it("bk creates none", () => expect(creatableRoles("bk")).toEqual([]));
  it("kepsek→guru true", () => expect(canCreateUser("kepsek", "guru")).toBe(true));
  it("kepsek→bk true", () => expect(canCreateUser("kepsek", "bk")).toBe(true));
  it("kepsek→kepsek false (no peer)", () => expect(canCreateUser("kepsek", "kepsek")).toBe(false));
  it("kepsek→superadmin false (no escalation)", () => expect(canCreateUser("kepsek", "superadmin")).toBe(false));
  it("kepsek→dinas false", () => expect(canCreateUser("kepsek", "dinas")).toBe(false));
  it("nobody creates superadmin", () => {
    for (const r of ["superadmin", "dinas", "kepsek", "guru", "bk"] as const) expect(canCreateUser(r, "superadmin")).toBe(false);
  });
  it("canManageUsers: superadmin+kepsek true, others false", () => {
    expect(canManageUsers("superadmin")).toBe(true);
    expect(canManageUsers("kepsek")).toBe(true);
    expect(canManageUsers("dinas")).toBe(false);
    expect(canManageUsers("guru")).toBe(false);
    expect(canManageUsers("bk")).toBe(false);
  });
});

describe("assertSameSekolah", () => {
  it("superadmin bypass (any school)", () => expect(() => assertSameSekolah(superadmin, SEK_PADANG)).not.toThrow());
  it("kepsek own school OK", () => expect(() => assertSameSekolah(kepsek, SEK_MENTAWAI)).not.toThrow());
  it("kepsek cross-school 403", () => expect(() => assertSameSekolah(kepsek, SEK_PADANG)).toThrow(AuthError));
  it("dinas (sekolahId null) vs any school 403", () => expect(() => assertSameSekolah(dinas, SEK_MENTAWAI)).toThrow(AuthError));
});

describe("requireRole", () => {
  it("kepsek in [kepsek,superadmin] passes", () => expect(() => requireRole(kepsek, "kepsek", "superadmin")).not.toThrow());
  it("kepsek in [dinas] throws 403", () => expect(() => requireRole(kepsek, "dinas")).toThrow(AuthError));
  it("guru in [superadmin] throws", () => expect(() => requireRole(guru, "superadmin")).toThrow(AuthError));
});

describe("authorizeResolvedSiswa (IDOR + anti-enumeration + dinas wilayah)", () => {
  const sOwnKelas = { id: "s1", sekolahId: SEK_MENTAWAI, kelasId: KELAS_8A, wilayahId: WIL_NTT };
  const sOtherKelas = { id: "s2", sekolahId: SEK_MENTAWAI, kelasId: KELAS_8B, wilayahId: WIL_NTT };
  const sOtherSchool = { id: "s3", sekolahId: SEK_PADANG, kelasId: KELAS_8A, wilayahId: "wil-sumbar" };

  it("superadmin resolves any school", () => expect(authorizeResolvedSiswa(superadmin, sOtherSchool)).toEqual(sOtherSchool));
  it("dinas resolves siswa in own wilayah", () => expect(authorizeResolvedSiswa(dinas, sOwnKelas)).toEqual(sOwnKelas));
  it("dinas cross-wilayah → 403", () => expect(() => authorizeResolvedSiswa(dinas, sOtherSchool)).toThrow(AuthError));
  it("dinas without wilayahId → 403", () => expect(() => authorizeResolvedSiswa(ctx({ role: "dinas" }), sOwnKelas)).toThrow(AuthError));
  it("kepsek resolves own-school any-kelas", () => expect(authorizeResolvedSiswa(kepsek, sOtherKelas)).toEqual(sOtherKelas));
  it("kepsek cross-school → 403", () => expect(() => authorizeResolvedSiswa(kepsek, sOtherSchool)).toThrow(AuthError));
  it("guru own-kelas OK", () => expect(authorizeResolvedSiswa(guru, sOwnKelas)).toEqual(sOwnKelas));
  it("guru same-school other-kelas → 403", () => expect(() => authorizeResolvedSiswa(guru, sOtherKelas)).toThrow(AuthError));
  it("guru cross-school → 403", () => expect(() => authorizeResolvedSiswa(guru, sOtherSchool)).toThrow(AuthError));
  it("bk own-school any-kelas OK", () => expect(authorizeResolvedSiswa(bk, sOtherKelas)).toEqual(sOtherKelas));
  it("bk cross-school → 403", () => expect(() => authorizeResolvedSiswa(bk, sOtherSchool)).toThrow(AuthError));
  it("not-found → uniform 403 (anti-enumeration)", () => expect(() => authorizeResolvedSiswa(guru, null)).toThrow(AuthError));
});
