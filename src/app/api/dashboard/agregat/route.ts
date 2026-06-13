import { apiHandler } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { agregatScope } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";

/**
 * GET /api/dashboard/agregat
 * Statistik risiko ANONIM per sekolah dalam wilayah. TIDAK mengembalikan PII.
 * Hanya menghitung risiko TERKINI (isLatest=true) -> angka benar.
 */
export async function GET(req: Request) {
  return apiHandler(async () => {
    const ctx = await requireContext();
    const scope = agregatScope(ctx); // guru/kepsek/bk -> 403

    const sekolahList = await prisma.sekolah.findMany({
      where: scope.wilayahId ? { wilayahId: scope.wilayahId } : {},
      select: { id: true, npsn: true, nama: true },
    });
    const sekolahIds = sekolahList.map((s) => s.id);

    // FIX correctness: hanya risiko terkini per siswa
    const grouped = await prisma.risiko.groupBy({
      by: ["sekolahId", "kategori"],
      where: { sekolahId: { in: sekolahIds }, isLatest: true },
      _count: true,
    });

    const perSekolah = sekolahList.map((s) => {
      const rows = grouped.filter((g) => g.sekolahId === s.id);
      const get = (k: string) => rows.find((r) => r.kategori === k)?._count ?? 0;
      return {
        sekolah: s.nama,
        npsn: s.npsn,
        hijau: get("hijau"),
        kuning: get("kuning"),
        merah: get("merah"),
      };
    });

    const total = perSekolah.reduce(
      (acc, s) => ({
        hijau: acc.hijau + s.hijau,
        kuning: acc.kuning + s.kuning,
        merah: acc.merah + s.merah,
      }),
      { hijau: 0, kuning: 0, merah: 0 }
    );

    await audit(ctx, "view_agregat", `wilayah:${scope.wilayahId ?? "all"}`, clientIp(req));
    return { totalSekolah: sekolahList.length, total, perSekolah };
  });
}
