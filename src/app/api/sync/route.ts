import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, assertSameSekolah, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { applySyncBatch, type SyncPort, type SyncItem } from "@/lib/offline/applySync";
import { audit, clientIp } from "@/lib/audit";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const ItemSchema = z.object({
  idempotencyKey: z.string().uuid(),
  intervensiId: z.string().optional(),
  siswaId: z.string().min(1),
  jenis: z.string().min(1),
  catatan: z.string().min(1),
  baseVersion: z.number().int().nonnegative(),
});
const BodySchema = z.object({ items: z.array(ItemSchema).min(1).max(100) });

export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek");
      await rateLimit(`sync:${ctx.userId}`);

      const body = BodySchema.parse(await safeJson(req));

    // Validasi semua siswa milik tenant (anti lintas sekolah/kelas)
    const siswaIds = [...new Set(body.items.map((i) => i.siswaId))];
    const siswaList = await prisma.siswa.findMany({
      where: { id: { in: siswaIds } },
      select: { id: true, sekolahId: true, kelasId: true },
    });
    const siswaMap = new Map(siswaList.map((s) => [s.id, s]));
    for (const it of body.items) {
      const s = siswaMap.get(it.siswaId);
      if (!s) throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");
      assertSameSekolah(ctx, s.sekolahId);
      if (ctx.role === "guru" && ctx.kelasId !== s.kelasId)
        throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");
    }

    const port: SyncPort = {
      async claimKey(key) {
        // Atomik: unique constraint. Duplicate -> false.
        try {
          await prisma.syncLog.create({
            data: { idempotencyKey: key, status: "processing", sekolahId: ctx.sekolahId },
          });
          return true;
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return false;
          throw e;
        }
      },
      async markKey(key, status, detail) {
        await prisma.syncLog.update({
          where: { idempotencyKey: key },
          data: { status, detailJson: detail },
        });
      },
      async exists(id) {
        return !!(await prisma.intervensi.findUnique({ where: { id }, select: { id: true } }));
      },
      async createIntervensi(item: SyncItem) {
        const s = siswaMap.get(item.siswaId)!;
        const iv = await prisma.intervensi.create({
          data: {
            siswaId: item.siswaId,
            sekolahId: s.sekolahId,
            jenis: item.jenis,
            catatan: item.catatan,
            olehUserId: ctx.userId,
            version: 1,
          },
          select: { id: true, version: true },
        });
        return iv;
      },
      async updateIntervensiIfVersion(id, base, item) {
        // Atomic compare-and-set: hanya update bila version == base.
        const res = await prisma.intervensi.updateMany({
          where: { id, version: base, deletedAt: null },
          data: { jenis: item.jenis, catatan: item.catatan, version: { increment: 1 } },
        });
        if (res.count === 0) return null; // versi tak cocok -> conflict
        return base + 1;
      },
    };

    const results = await applySyncBatch(port, body.items);
    await audit(ctx, "sync", `items:${results.length}`, clientIp(req));
    return { results };
    },
    { req, route: "POST /api/sync" }
  );
}
