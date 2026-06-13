import { apiHandler, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { siswaScope, requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { buildSiswaInput } from "@/lib/scoring/buildInput";
import { scoreSiswa } from "@/lib/scoring/rules";
import { decodePII } from "@/lib/siswaPII";
import { audit, clientIp } from "@/lib/audit";
import { chunk, withSerialLock } from "@/lib/concurrency";

const BATCH = 500;

/**
 * POST /api/risiko/recompute
 * Hitung ulang risiko siswa dalam tenant.
 * - HANYA siswa consentStatus=granted yang diproses (UU PDP data anak).
 * - Serialize per tenant (cegah race isLatest).
 * - Chunked transaction (batch 500) -> aman untuk skala besar.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "guru", "bk", "kepsek", "superadmin");
      await rateLimit(`recompute:${ctx.userId}`);
      const scope = siswaScope(ctx); // dinas -> 403

      const lockKey = `recompute:${ctx.sekolahId ?? "all"}`;
      const dihitung = await withSerialLock(lockKey, async () => {
        // Hanya siswa dengan consent granted
        const siswa = await prisma.siswa.findMany({
          where: { ...scope, consentStatus: "granted" },
          select: {
            id: true,
            nama: true,
            sekolahId: true,
            penerimaKip: true,
            jarakKm: true,
            dekId: true,
            statusEkonomiEnc: true,
            statusKeluargaEnc: true,
            statusOrtuEnc: true,
            absensi: { select: { tanggal: true, status: true } },
            nilai: { select: { mapel: true, periode: true, nilai: true, kkm: true } },
          },
        });
        if (siswa.length === 0) return 0;

        const now = new Date();
        const rows = await Promise.all(
          siswa.map(async (s) => {
            const pii = await decodePII(s);
            const hasil = scoreSiswa(buildSiswaInput(s, pii));
            return {
              siswaId: s.id,
              sekolahId: s.sekolahId,
              tanggalHitung: now,
              kategori: hasil.kategori,
              skor: hasil.skor,
              alasanJson: JSON.stringify({ alasan: hasil.alasan, saran: hasil.saran }),
              sumber: "rule" as const,
              configVersion: hasil.configVersion,
              isLatest: true,
            };
          })
        );

        // Chunked: matikan isLatest lama + insert baru, per batch dalam transaksi
        for (const part of chunk(rows, BATCH)) {
          const ids = part.map((r) => r.siswaId);
          await prisma.$transaction([
            prisma.risiko.updateMany({
              where: { siswaId: { in: ids }, isLatest: true },
              data: { isLatest: false },
            }),
            prisma.risiko.createMany({ data: part }),
          ]);
        }
        return rows.length;
      });

      await audit(ctx, "recompute", `tenant:${ctx.sekolahId ?? "all"}:${dihitung}`, clientIp(req));
      return { dihitung };
    },
    { req, route: "POST /api/risiko/recompute" }
  );
}
