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
 * - superadmin: tanpa filter (akses penuh hingga siswa).
 * - dinas: dibatasi ke wilayahnya (boleh menelusuri hingga siswa DI WILAYAHNYA).
 * - kepsek/bk: dibatasi ke sekolahId-nya.
 * - guru: dibatasi ke kelasId-nya (di dalam sekolahnya).
 */
export function siswaScope(ctx: TenantContext): Record<string, unknown> {
  switch (ctx.role) {
    case "superadmin":
      return {};
    case "dinas":
      if (!ctx.wilayahId) throw new AuthError(403, "Wilayah tidak diketahui.");
      return { sekolah: { wilayahId: ctx.wilayahId } };
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

/**
 * Validasi bahwa wilayahId target sama dgn tenant dinas (cegah dinas mengakses
 * lintas wilayah). superadmin lolos. Dipakai pada drill-down sekolah/kelas/siswa.
 */
export function assertSameWilayah(ctx: TenantContext, wilayahId: string): void {
  if (ctx.role === "superadmin") return;
  if (ctx.role === "dinas") {
    if (ctx.wilayahId !== wilayahId) throw new AuthError(403, "Akses lintas wilayah ditolak.");
    return;
  }
  throw new AuthError(403, "Akses ditolak.");
}

/**
 * SUMBER KEBENARAN: peran apa yang boleh DIBUAT oleh sebuah peran.
 * - superadmin: membuat semua peran (dinas, kepsek, guru, bk) lintas tenant.
 * - kepsek: hanya menambah guru & bk DI DALAM sekolahnya sendiri.
 * - dinas/guru/bk: tidak boleh membuat akun.
 * Dipakai oleh API (assertCanCreate) DAN UI (afford "Tambah Pengguna").
 */
const CREATABLE_BY: Record<Role, Role[]> = {
  superadmin: ["dinas", "kepsek", "guru", "bk"],
  kepsek: ["guru", "bk"],
  dinas: [],
  guru: [],
  bk: [],
};

/** Daftar peran yang boleh dibuat oleh `role`. */
export function creatableRoles(role: Role): Role[] {
  return CREATABLE_BY[role];
}

/** Apakah `actor` boleh membuat akun ber-peran `target`? */
export function canCreateUser(actor: Role, target: Role): boolean {
  return CREATABLE_BY[actor].includes(target);
}

/** Apakah `role` boleh mengelola pengguna sama sekali (punya akses ke fitur tambah user)? */
export function canManageUsers(role: Role): boolean {
  return CREATABLE_BY[role].length > 0;
}
