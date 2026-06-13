import { apiHandler } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { siswaScope, assertSameSekolah, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";

function parseAlasan(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return { alasan: [], saran: [] };
  }
}

/**
 * GET /api/siswa/[id]
 * Detail siswa + risiko terkini + intervensi aktif.
 * Uniform 403 (tidak bedakan not-found vs lintas-tenant -> cegah enumeration).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const ctx = await requireContext();
    siswaScope(ctx); // dinas -> 403
    const { id } = await params;

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

    // Uniform 403: not-found & lintas-tenant -> pesan sama
    const FORBIDDEN = "Tidak ditemukan atau akses ditolak.";
    if (!siswa) throw new AuthError(403, FORBIDDEN);
    if (ctx.role !== "superadmin" && ctx.sekolahId !== siswa.sekolahId)
      throw new AuthError(403, FORBIDDEN);
    if (ctx.role === "guru" && ctx.kelasId !== siswa.kelasId)
      throw new AuthError(403, FORBIDDEN);

    await audit(ctx, "view_siswa", `siswa:${siswa.id}`, clientIp(req));

    const r = siswa.risiko[0];
    return {
      id: siswa.id,
      nama: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas.nama,
      risiko: r ? { kategori: r.kategori, skor: r.skor, ...(parseAlasan(r.alasanJson) as object) } : null,
      intervensi: siswa.intervensi,
    };
  });
}
