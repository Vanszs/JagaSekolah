import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { audit, clientIp } from "@/lib/audit";
import { chunk } from "@/lib/concurrency";
import { z } from "zod";

const STATUS = ["hadir", "izin", "sakit", "alpa", "telat"] as const;

const ListQuery = z.object({
  siswaId: z.string().min(1),
  dari: z.string().datetime().optional(),
  sampai: z.string().datetime().optional(),
});

const Entry = z.object({
  siswaId: z.string().min(1),
  tanggal: z.string().datetime(),
  status: z.enum(STATUS),
});
const BatchBody = z.object({ items: z.array(Entry).min(1).max(500) });

/** GET /api/absensi?siswaId=&dari=&sampai= */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      const q = ListQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
      await resolveSiswa(ctx, q.siswaId);
      const data = await prisma.absensi.findMany({
        where: {
          siswaId: q.siswaId,
          tanggal: {
            ...(q.dari ? { gte: new Date(q.dari) } : {}),
            ...(q.sampai ? { lte: new Date(q.sampai) } : {}),
          },
        },
        orderBy: { tanggal: "desc" },
        select: { id: true, tanggal: true, status: true },
      });
      return { data };
    },
    { req, route: "GET /api/absensi" }
  );
}

/**
 * POST /api/absensi — input/update absensi harian (batch).
 * Idempoten per (siswaId, tanggal): replace status hari itu.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek");
      await rateLimit(`absensi:${ctx.userId}`);
      const body = BatchBody.parse(await safeJson(req));

      // validasi semua siswa milik tenant
      const ids = [...new Set(body.items.map((i) => i.siswaId))];
      await Promise.all(ids.map((id) => resolveSiswa(ctx, id)));

      let tersimpan = 0;
      for (const part of chunk(body.items, 200)) {
        await prisma.$transaction(
          part.flatMap((it) => {
            const tgl = new Date(it.tanggal);
            // hapus entri hari yang sama lalu buat baru (replace)
            const hari = new Date(tgl);
            hari.setHours(0, 0, 0, 0);
            const besok = new Date(hari);
            besok.setDate(besok.getDate() + 1);
            return [
              prisma.absensi.deleteMany({
                where: { siswaId: it.siswaId, tanggal: { gte: hari, lt: besok } },
              }),
              prisma.absensi.create({
                data: { siswaId: it.siswaId, tanggal: tgl, status: it.status },
              }),
            ];
          })
        );
        tersimpan += part.length;
      }
      await audit(ctx, "absensi_input", `count:${tersimpan}`, clientIp(req));
      return { tersimpan };
    },
    { req, route: "POST /api/absensi" }
  );
}
