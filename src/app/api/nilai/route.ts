import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { audit, clientIp } from "@/lib/audit";
import { chunk } from "@/lib/concurrency";
import { z } from "zod";

const ListQuery = z.object({ siswaId: z.string().min(1), periode: z.string().optional() });

const Entry = z.object({
  siswaId: z.string().min(1),
  mapel: z.string().min(1).max(60),
  periode: z.string().min(1).max(30),
  nilai: z.number().min(0).max(100),
  kkm: z.number().min(0).max(100).default(70),
});
const BatchBody = z.object({ items: z.array(Entry).min(1).max(500) });

/** GET /api/nilai?siswaId=&periode= */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      const q = ListQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
      await resolveSiswa(ctx, q.siswaId);
      const data = await prisma.nilai.findMany({
        where: { siswaId: q.siswaId, ...(q.periode ? { periode: q.periode } : {}) },
        orderBy: [{ periode: "desc" }, { mapel: "asc" }],
        select: { id: true, mapel: true, periode: true, nilai: true, kkm: true },
      });
      return { data };
    },
    { req, route: "GET /api/nilai" }
  );
}

/**
 * POST /api/nilai — input/update nilai (batch).
 * Idempoten per (siswaId, mapel, periode): replace.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek");
      await rateLimit(`nilai:${ctx.userId}`);
      const body = BatchBody.parse(await safeJson(req));

      const ids = [...new Set(body.items.map((i) => i.siswaId))];
      await Promise.all(ids.map((id) => resolveSiswa(ctx, id)));

      let tersimpan = 0;
      for (const part of chunk(body.items, 200)) {
        await prisma.$transaction(
          part.flatMap((it) => [
            prisma.nilai.deleteMany({
              where: { siswaId: it.siswaId, mapel: it.mapel, periode: it.periode },
            }),
            prisma.nilai.create({
              data: {
                siswaId: it.siswaId,
                mapel: it.mapel,
                periode: it.periode,
                nilai: it.nilai,
                kkm: it.kkm,
              },
            }),
          ])
        );
        tersimpan += part.length;
      }
      await audit(ctx, "nilai_input", `count:${tersimpan}`, clientIp(req));
      return { tersimpan };
    },
    { req, route: "POST /api/nilai" }
  );
}
