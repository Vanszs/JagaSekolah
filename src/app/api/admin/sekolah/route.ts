import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, agregatScope, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";
import { z } from "zod";

const CreateBody = z.object({
  npsn: z.string().regex(/^\d{6,12}$/),
  nama: z.string().min(1).max(120),
  wilayahId: z.string().min(1),
});

/** GET /api/admin/sekolah — superadmin: semua; dinas: wilayahnya. */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "superadmin", "dinas");
      const scope = agregatScope(ctx); // superadmin {} / dinas {wilayahId}
      const data = await prisma.sekolah.findMany({
        where: scope.wilayahId ? { wilayahId: scope.wilayahId } : {},
        select: {
          id: true, npsn: true, nama: true,
          wilayah: { select: { provinsi: true, kabupaten: true } },
          _count: { select: { siswa: true, users: true } },
        },
        orderBy: { nama: "asc" },
      });
      return { data };
    },
    { req, route: "GET /api/admin/sekolah" }
  );
}

/** POST /api/admin/sekolah — hanya superadmin. */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "superadmin");
      await rateLimit(`admin:${ctx.userId}`);
      const body = CreateBody.parse(await safeJson(req));

      const wilayah = await prisma.wilayah.findUnique({ where: { id: body.wilayahId } });
      if (!wilayah) throw new AuthError(403, "Wilayah tidak ditemukan.");
      const dup = await prisma.sekolah.findUnique({ where: { npsn: body.npsn } });
      if (dup) throw new AuthError(409, "NPSN sudah terdaftar.");

      const sekolah = await prisma.sekolah.create({
        data: { npsn: body.npsn, nama: body.nama, wilayahId: body.wilayahId },
        select: { id: true, npsn: true, nama: true },
      });
      await audit(ctx, "sekolah_create", `sekolah:${sekolah.id}`, clientIp(req));
      return sekolah;
    },
    { req, route: "POST /api/admin/sekolah" }
  );
}
