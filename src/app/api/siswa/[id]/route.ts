import { apiHandler } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { siswaScope, AuthError } from "@/lib/rbac";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";
import { parseAlasan } from "@/lib/parseAlasan";

/**
 * GET /api/siswa/[id]
 * Detail siswa + risiko terkini + intervensi aktif.
 * Uniform 403 (tidak bedakan not-found vs lintas-tenant -> cegah enumeration).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(
    async () => {
      const [ctx, { id }] = await Promise.all([requireContext(), params]);
      siswaScope(ctx); // dinas -> 403

      // Tenant check tunggal (anti-IDOR) — sumber kebenaran sama dgn halaman.
      await resolveSiswa(ctx, id);

      const siswa = await prisma.siswa.findUnique({
        where: { id },
        select: {
          id: true,
          nama: true,
          nisn: true,
          sekolahId: true,
          kelasId: true,
          kelas: { select: { nama: true } },
          risiko: {
            where: { isLatest: true },
            take: 1,
            select: { kategori: true, skor: true, alasanJson: true },
          },
          intervensi: {
            where: { deletedAt: null },
            orderBy: { tanggal: "desc" },
            select: { id: true, jenis: true, catatan: true, tanggal: true, version: true },
          },
        },
      });
      if (!siswa) throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");

      await audit(ctx, "view_siswa", `siswa:${siswa.id}`, clientIp(req));

      const r = siswa.risiko[0];
      return {
        id: siswa.id,
        nama: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas.nama,
        risiko: r ? { kategori: r.kategori, skor: r.skor, ...parseAlasan(r.alasanJson) } : null,
        intervensi: siswa.intervensi,
      };
    },
    { req, route: "GET /api/siswa/[id]" }
  );
}
