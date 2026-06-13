import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { audit, clientIp } from "@/lib/audit";
import { z } from "zod";

const ListQuery = z.object({ siswaId: z.string().min(1) });
const CreateBody = z.object({
  siswaId: z.string().min(1),
  jenis: z.enum(["kunjungan_rumah", "koordinasi_bk", "usul_kip", "konseling", "lainnya"]),
  catatan: z.string().min(1).max(2000),
});

/** GET /api/intervensi?siswaId= -> daftar intervensi aktif siswa. */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      const { siswaId } = ListQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
      await resolveSiswa(ctx, siswaId);

      const data = await prisma.intervensi.findMany({
        where: { siswaId, deletedAt: null },
        orderBy: { tanggal: "desc" },
        select: { id: true, jenis: true, catatan: true, tanggal: true, version: true, olehUserId: true },
      });
      return { data };
    },
    { req, route: "GET /api/intervensi" }
  );
}

/** POST /api/intervensi -> catat intervensi (online, selain via /sync). */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek");
      await rateLimit(`intervensi:${ctx.userId}`);
      const body = CreateBody.parse(await safeJson(req));
      const siswa = await resolveSiswa(ctx, body.siswaId);

      const iv = await prisma.intervensi.create({
        data: {
          siswaId: siswa.id,
          sekolahId: siswa.sekolahId,
          jenis: body.jenis,
          catatan: body.catatan,
          olehUserId: ctx.userId,
          version: 1,
        },
        select: { id: true, jenis: true, catatan: true, tanggal: true, version: true },
      });
      await audit(ctx, "intervensi_create", `siswa:${siswa.id}:iv:${iv.id}`, clientIp(req));
      return iv;
    },
    { req, route: "POST /api/intervensi" }
  );
}
