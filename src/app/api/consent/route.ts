import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, assertSameSekolah, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { z } from "zod";

const BodySchema = z.object({
  siswaId: z.string().min(1),
  status: z.enum(["granted", "revoked"]),
  oleh: z.string().min(1), // nama ortu/wali
  hubungan: z.enum(["ayah", "ibu", "wali"]),
  metode: z.enum(["tatap_muka", "digital", "surat"]),
  catatan: z.string().optional(),
});

const ListQuery = z.object({ siswaId: z.string().min(1) });

/**
 * GET /api/consent?siswaId= — riwayat persetujuan + status terkini siswa.
 */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      const { siswaId } = ListQuery.parse(
        Object.fromEntries(new URL(req.url).searchParams)
      );
      await resolveSiswa(ctx, siswaId);

      const [siswa, riwayat] = await Promise.all([
        prisma.siswa.findUnique({ where: { id: siswaId }, select: { consentStatus: true } }),
        prisma.consent.findMany({
          where: { siswaId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, status: true, oleh: true, hubungan: true,
            metode: true, catatan: true, createdAt: true, dibuatOleh: true,
          },
        }),
      ]);
      return { statusTerkini: siswa?.consentStatus ?? null, riwayat };
    },
    { req, route: "GET /api/consent" }
  );
}

/**
 * POST /api/consent
 * Catat persetujuan/pencabutan ortu (UU PDP data anak).
 * Mengubah Siswa.consentStatus + simpan jejak Consent.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      await rateLimit(`consent:${ctx.userId}`);

      const body = BodySchema.parse(await safeJson(req));

      const siswa = await prisma.siswa.findUnique({
        where: { id: body.siswaId },
        select: { id: true, sekolahId: true, kelasId: true },
      });
      if (!siswa) throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");
      assertSameSekolah(ctx, siswa.sekolahId);
      if (ctx.role === "guru" && ctx.kelasId !== siswa.kelasId)
        throw new AuthError(403, "Tidak ditemukan atau akses ditolak.");

      await prisma.$transaction([
        prisma.consent.create({
          data: {
            siswaId: body.siswaId,
            status: body.status,
            oleh: body.oleh,
            hubungan: body.hubungan,
            metode: body.metode,
            catatan: body.catatan,
            dibuatOleh: ctx.userId,
          },
        }),
        prisma.siswa.update({
          where: { id: body.siswaId },
          data: { consentStatus: body.status },
        }),
      ]);

      await audit(ctx, `consent_${body.status}`, `siswa:${body.siswaId}`, clientIp(req));
      return { siswaId: body.siswaId, consentStatus: body.status };
    },
    { req, route: "POST /api/consent" }
  );
}
