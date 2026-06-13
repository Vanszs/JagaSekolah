import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { audit, clientIp } from "@/lib/audit";
import { z } from "zod";

const PatchBody = z.object({
  jenis: z.enum(["kunjungan_rumah", "koordinasi_bk", "usul_kip", "konseling", "lainnya"]).optional(),
  catatan: z.string().min(1).max(2000).optional(),
  baseVersion: z.number().int().nonnegative(),
});

async function loadOwned(ctx: Awaited<ReturnType<typeof requireContext>>, id: string) {
  const iv = await prisma.intervensi.findUnique({
    where: { id },
    select: { id: true, siswaId: true, version: true, deletedAt: true },
  });
  if (!iv || iv.deletedAt) throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");
  await resolveSiswa(ctx, iv.siswaId); // pastikan tenant/kelas
  return iv;
}

/** PATCH /api/intervensi/[id] -> update dgn optimistic locking. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek");
      await rateLimit(`intervensi:${ctx.userId}`);
      const { id } = await params;
      const body = PatchBody.parse(await safeJson(req));
      await loadOwned(ctx, id);

      const res = await prisma.intervensi.updateMany({
        where: { id, version: body.baseVersion, deletedAt: null },
        data: {
          ...(body.jenis ? { jenis: body.jenis } : {}),
          ...(body.catatan ? { catatan: body.catatan } : {}),
          version: { increment: 1 },
        },
      });
      if (res.count === 0) throw new AuthError(409, "Data telah diubah pengguna lain.");
      await audit(ctx, "intervensi_update", `iv:${id}`, clientIp(req));
      return { id, version: body.baseVersion + 1 };
    },
    { req, route: "PATCH /api/intervensi/[id]" }
  );
}

/** DELETE /api/intervensi/[id] -> soft-delete. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return apiHandler(
    async () => {
      const [ctx, { id }] = await Promise.all([requireContext(), params]);
      requireRole(ctx, "guru", "bk", "kepsek");
      await loadOwned(ctx, id);
      await Promise.all([
        prisma.intervensi.update({ where: { id }, data: { deletedAt: new Date() } }),
        audit(ctx, "intervensi_delete", `iv:${id}`, clientIp(req)),
      ]);
      return { id, deleted: true };
    },
    { req, route: "DELETE /api/intervensi/[id]" }
  );
}
