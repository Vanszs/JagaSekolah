import { prisma } from "@/lib/db";
import { assertSameSekolah, AuthError, type TenantContext } from "@/lib/rbac";

const FORBIDDEN = "Tidak ditemukan atau akses ditolak.";

/**
 * Kernel murni (tanpa DB) — otorisasi siswa yang sudah di-fetch terhadap tenant.
 * Dipisah agar bisa diuji unit. Uniform 403 (not-found == ditolak) cegah enumeration.
 * - superadmin: akses semua.
 * - dinas: hanya siswa yang sekolahnya berada di wilayahnya (butuh `wilayahId` siswa).
 * - kepsek/bk: sekolah sama. guru: sekolah + kelas sama.
 */
export function authorizeResolvedSiswa<T extends { sekolahId: string; kelasId: string; wilayahId?: string | null }>(
  ctx: TenantContext,
  siswa: T | null,
): T {
  if (!siswa) throw new AuthError(403, FORBIDDEN);
  if (ctx.role === "dinas") {
    if (!ctx.wilayahId || siswa.wilayahId !== ctx.wilayahId) throw new AuthError(403, FORBIDDEN);
    return siswa;
  }
  assertSameSekolah(ctx, siswa.sekolahId);
  if (ctx.role === "guru" && ctx.kelasId !== siswa.kelasId) throw new AuthError(403, FORBIDDEN);
  return siswa;
}

/**
 * Ambil siswa & pastikan milik tenant pemanggil (anti-IDOR + guru lintas-kelas + dinas lintas-wilayah).
 */
export async function resolveSiswa(ctx: TenantContext, siswaId: string) {
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    select: { id: true, sekolahId: true, kelasId: true, sekolah: { select: { wilayahId: true } } },
  });
  return authorizeResolvedSiswa(
    ctx,
    siswa ? { ...siswa, wilayahId: siswa.sekolah.wilayahId } : null,
  );
}
