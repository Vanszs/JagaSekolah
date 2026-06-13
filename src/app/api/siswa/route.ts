import { apiHandler } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { siswaScope } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { z } from "zod";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  kategori: z.enum(["hijau", "kuning", "merah"]).optional(),
});

/**
 * GET /api/siswa?page=&limit=&kategori=
 * Daftar siswa milik tenant + risiko terkini. Pagination + tanpa N+1.
 */
export async function GET(req: Request) {
  return apiHandler(async () => {
    const ctx = await requireContext();
    const where = siswaScope(ctx); // dinas -> 403

    const url = new URL(req.url);
    const { page, limit, kategori } = QuerySchema.parse(
      Object.fromEntries(url.searchParams)
    );

    const [total, siswa] = await Promise.all([
      prisma.siswa.count({ where }),
      prisma.siswa.findMany({
        where,
        select: {
          id: true,
          nisn: true,
          nama: true,
          kelas: { select: { nama: true } },
          // FIX N+1: ambil hanya risiko terkini dalam 1 query nested
          risiko: {
            where: { isLatest: true },
            select: { kategori: true, skor: true, tanggalHitung: true },
            take: 1,
          },
        },
        orderBy: { nama: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    let data = siswa.map((s) => ({
      id: s.id,
      nisn: s.nisn,
      nama: s.nama,
      kelas: s.kelas.nama,
      risiko: s.risiko[0] ?? null,
    }));

    // filter kategori (opsional) - di level hasil halaman
    if (kategori) data = data.filter((d) => d.risiko?.kategori === kategori);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  });
}
