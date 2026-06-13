import type { Role } from "@prisma/client";

/** Konteks tenant yang sudah tervalidasi dari session. */
export interface TenantContext {
  userId: string;
  role: Role;
  sekolahId: string | null;
  wilayahId: string | null;
  kelasId: string | null;
}

export class AuthError extends Error {
  constructor(
    public code: 401 | 403 | 409 | 429,
    message: string
  ) {
    super(message);
  }
}

/** Pastikan role termasuk yang diizinkan, atau lempar 403. */
export function requireRole(ctx: TenantContext, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) {
    throw new AuthError(403, `Akses ditolak untuk role ${ctx.role}.`);
  }
}

/**
 * Filter Prisma `where` untuk data berbasis Siswa, DIPAKSA per tenant.
 * - superadmin: tanpa filter (pengelola sistem).
 * - dinas: TIDAK boleh akses data per-siswa (lempar 403) - hanya agregat.
 * - kepsek/bk: dibatasi ke sekolahId-nya.
 * - guru: dibatasi ke kelasId-nya (di dalam sekolahnya).
 */
export function siswaScope(ctx: TenantContext): Record<string, unknown> {
  switch (ctx.role) {
    case "superadmin":
      return {};
    case "dinas":
      throw new AuthError(403, "Dinas hanya boleh mengakses data agregat anonim.");
    case "kepsek":
    case "bk":
      if (!ctx.sekolahId) throw new AuthError(403, "Sekolah tidak diketahui.");
      return { sekolahId: ctx.sekolahId };
    case "guru":
      if (!ctx.sekolahId || !ctx.kelasId)
        throw new AuthError(403, "Kelas/sekolah tidak diketahui.");
      return { sekolahId: ctx.sekolahId, kelasId: ctx.kelasId };
    default:
      throw new AuthError(403, "Role tidak dikenal.");
  }
}

/**
 * Scope agregat untuk dinas: dibatasi ke wilayahId-nya.
 * superadmin: seluruh wilayah.
 */
export function agregatScope(ctx: TenantContext): { wilayahId?: string } {
  if (ctx.role === "superadmin") return {};
  if (ctx.role === "dinas") {
    if (!ctx.wilayahId) throw new AuthError(403, "Wilayah tidak diketahui.");
    return { wilayahId: ctx.wilayahId };
  }
  throw new AuthError(403, "Hanya dinas/superadmin yang dapat melihat agregat.");
}

/** Validasi bahwa sekolahId target sama dgn tenant (cegah IDOR lintas sekolah). */
export function assertSameSekolah(ctx: TenantContext, sekolahId: string): void {
  if (ctx.role === "superadmin") return;
  if (ctx.sekolahId !== sekolahId) {
    throw new AuthError(403, "Akses lintas sekolah ditolak.");
  }
}
