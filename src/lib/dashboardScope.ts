import type { Prisma } from "@prisma/client";
import type { TenantContext } from "@/lib/rbac";
import { AuthError } from "@/lib/rbac";

/**
 * Scope Siswa untuk halaman analitik LINTAS-PERAN (akademik/kehadiran/intervensi).
 * Berbeda dgn siswaScope (yang melempar 403 utk dinas) — di sini dinas DIIZINKAN
 * tapi hanya secara AGREGAT/anonim (tak ada identitas siswa yg ditampilkan halaman).
 *
 * - superadmin: {} (nasional)
 * - dinas: { sekolah: { wilayahId } } (anonim, level wilayah)
 * - kepsek/bk: { sekolahId }
 * - guru: { sekolahId, kelasId }
 */
export function analyticsScope(ctx: TenantContext): Prisma.SiswaWhereInput {
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
      if (!ctx.sekolahId || !ctx.kelasId) throw new AuthError(403, "Kelas/sekolah tidak diketahui.");
      return { sekolahId: ctx.sekolahId, kelasId: ctx.kelasId };
    default:
      throw new AuthError(403, "Role tidak dikenal.");
  }
}

/** Apakah peran ini agregat-nasional/wilayah (boleh tampil tabel per-provinsi/sekolah, tanpa PII). */
export function isAggregateRole(role: TenantContext["role"]): boolean {
  return role === "superadmin" || role === "dinas";
}
