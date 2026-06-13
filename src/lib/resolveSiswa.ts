import { prisma } from "@/lib/db";
import { assertSameSekolah, AuthError, type TenantContext } from "@/lib/rbac";

const FORBIDDEN = "Tidak ditemukan atau akses ditolak.";

/**
 * Kernel murni (tanpa DB) — otorisasi siswa yang sudah di-fetch terhadap tenant.
 * Dipisah agar bisa diuji unit. Uniform 403 (not-found == ditolak) cegah enumeration.
 */
export function authorizeResolvedSiswa<T extends { sekolahId: string; kelasId: string }>(
  ctx: TenantContext,
  siswa: T | null,
): T {
  if (!siswa) throw new AuthError(403, FORBIDDEN);
  assertSameSekolah(ctx, siswa.sekolahId);
  if (ctx.role === "guru" && ctx.kelasId !== siswa.kelasId) throw new AuthError(403, FORBIDDEN);
  return siswa;
}

/**
 * Ambil siswa & pastikan milik tenant pemanggil (anti-IDOR + guru lintas-kelas).
 */
export async function resolveSiswa(ctx: TenantContext, siswaId: string) {
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    select: { id: true, sekolahId: true, kelasId: true },
  });
  return authorizeResolvedSiswa(ctx, siswa);
}
