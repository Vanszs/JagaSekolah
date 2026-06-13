import { prisma } from "@/lib/db";
import { assertSameSekolah, AuthError, type TenantContext } from "@/lib/rbac";

/**
 * Ambil siswa & pastikan milik tenant pemanggil (anti-IDOR + guru lintas-kelas).
 * Uniform 403 untuk not-found/ditolak (cegah enumeration).
 */
export async function resolveSiswa(ctx: TenantContext, siswaId: string) {
  const siswa = await prisma.siswa.findUnique({
    where: { id: siswaId },
    select: { id: true, sekolahId: true, kelasId: true },
  });
  const FORBIDDEN = "Tidak ditemukan atau akses ditolak.";
  if (!siswa) throw new AuthError(403, FORBIDDEN);
  assertSameSekolah(ctx, siswa.sekolahId);
  if (ctx.role === "guru" && ctx.kelasId !== siswa.kelasId)
    throw new AuthError(403, FORBIDDEN);
  return siswa;
}
