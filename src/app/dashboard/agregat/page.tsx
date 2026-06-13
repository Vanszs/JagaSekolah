import { Lock } from "lucide-react";
import type { KategoriRisiko } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireContext } from "@/lib/session";
import { agregatScope, AuthError } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { PageHeader, StatTile, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

export default async function AgregatPage() {
  const ctx = await requireContext();

  let scope: { wilayahId?: string };
  try {
    scope = agregatScope(ctx); // guru/kepsek/bk -> 403
  } catch (e) {
    if (e instanceof AuthError && e.code === 403) {
      return (
        <>
          <PageHeader title="Agregat Wilayah" />
          <EmptyState
            icon={<Lock className="h-6 w-6" aria-hidden="true" />}
            title="Halaman khusus Dinas"
            desc="Statistik agregat wilayah hanya dapat diakses oleh Dinas Pendidikan dan Super Admin."
          />
        </>
      );
    }
    throw e;
  }

  const sekolahList = await prisma.sekolah.findMany({
    where: scope.wilayahId ? { wilayahId: scope.wilayahId } : {},
    select: { id: true, npsn: true, nama: true },
    orderBy: { nama: "asc" },
  });
  const ids = sekolahList.map((s) => s.id);

  const grouped = await prisma.risiko.groupBy({
    by: ["sekolahId", "kategori"],
    where: { sekolahId: { in: ids }, isLatest: true },
    _count: true,
  });

  const get = (sekolahId: string, k: KategoriRisiko) =>
    grouped.find((g) => g.sekolahId === sekolahId && g.kategori === k)?._count ?? 0;

  const perSekolah = sekolahList.map((s) => ({
    ...s,
    merah: get(s.id, "merah"),
    kuning: get(s.id, "kuning"),
    hijau: get(s.id, "hijau"),
  }));
  const total = perSekolah.reduce(
    (a, s) => ({ merah: a.merah + s.merah, kuning: a.kuning + s.kuning, hijau: a.hijau + s.hijau }),
    { merah: 0, kuning: 0, hijau: 0 },
  );

  await audit(ctx, "view_agregat", `wilayah:${scope.wilayahId ?? "all"}`);

  return (
    <>
      <PageHeader
        title="Agregat Wilayah"
        desc="Statistik risiko anonim per sekolah. Tidak menampilkan identitas siswa — data per-anak tetap di tangan sekolah."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Sekolah terpantau" value={sekolahList.length} accent="brand" />
        <StatTile label="Risiko tinggi" value={total.merah} accent="merah" />
        <StatTile label="Waspada" value={total.kuning} accent="kuning" />
        <StatTile label="Aman" value={total.hijau} accent="hijau" />
      </div>

      {perSekolah.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Belum ada sekolah" desc="Tidak ada sekolah terdaftar di wilayah ini." />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Sekolah</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Tinggi</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Waspada</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Aman</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {perSekolah.map((s) => {
                  const t = s.merah + s.kuning + s.hijau;
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900">{s.nama}</span>
                        <span className="ml-2 text-xs tabular-nums text-slate-400">NPSN {s.npsn}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-red-600">{s.merah}</td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-amber-600">{s.kuning}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-emerald-600">{s.hijau}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-500">{t}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
