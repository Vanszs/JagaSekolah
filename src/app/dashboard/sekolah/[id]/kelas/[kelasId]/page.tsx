import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, assertSameSekolah, assertDinasWilayah } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { PageHeader, RiskBadge, EmptyState } from "@/components/dashboard/ui";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

export const dynamic = "force-dynamic";

const RANK: Record<string, number> = { merah: 3, kuning: 2, hijau: 1 };

/** Drill-down LEAF level-1: KELAS → roster siswa (identitas pertama kali tampil). */
export default async function KelasRosterPage({ params }: { params: Promise<{ id: string; kelasId: string }> }) {
  const { id: sekolahId, kelasId } = await params;
  const ctx = await requireDashboardContext(`/dashboard/sekolah/${sekolahId}/kelas/${kelasId}`);
  // Roster menampilkan identitas siswa — superadmin (semua), dinas (wilayahnya), kepsek (sekolahnya).
  requireRole(ctx, "superadmin", "dinas", "kepsek");

  const kelas = await prisma.kelas.findFirst({
    where: { id: kelasId, sekolahId },
    select: {
      nama: true,
      sekolah: { select: { nama: true, wilayahId: true, wilayah: { select: { provinsi: true, kabupaten: true } } } },
    },
  });
  if (!kelas) notFound();
  // Tenant guard: kepsek = sekolahnya, dinas = wilayahnya (superadmin lolos keduanya).
  if (ctx.role === "kepsek") assertSameSekolah(ctx, sekolahId);
  else if (ctx.role === "dinas") assertDinasWilayah(ctx, { wilayahId: kelas.sekolah.wilayahId, provinsi: kelas.sekolah.wilayah.provinsi });

  const siswa = await prisma.siswa.findMany({
    where: { kelasId, sekolahId },
    select: {
      id: true,
      nama: true,
      nisn: true,
      risiko: { where: { isLatest: true }, select: { kategori: true, skor: true }, take: 1 },
    },
    orderBy: { nama: "asc" },
  });
  const rows = siswa
    .map((s) => ({ ...s, r: s.risiko[0] ?? null }))
    .sort((a, b) => {
      const ra = a.r ? RANK[a.r.kategori] ?? 0 : 0;
      const rb = b.r ? RANK[b.r.kategori] ?? 0 : 0;
      if (rb !== ra) return rb - ra;
      return (b.r?.skor ?? 0) - (a.r?.skor ?? 0);
    });

  await audit(ctx, "view_agregat", `kelas:${kelasId}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Nasional", href: "/dashboard" },
          { label: kelas.sekolah.wilayah.provinsi, href: `/dashboard/wilayah/${encodeURIComponent(kelas.sekolah.wilayah.provinsi)}` },
          { label: kelas.sekolah.wilayah.kabupaten, href: `/dashboard/kabupaten/${kelas.sekolah.wilayahId}` },
          { label: kelas.sekolah.nama, href: `/dashboard/sekolah/${sekolahId}` },
          { label: kelas.nama },
        ]}
      />
      <PageHeader title={`Kelas ${kelas.nama}`} desc={`${kelas.sekolah.nama} — ${rows.length} siswa. Klik siswa untuk detail risiko.`} />

      {rows.length === 0 ? (
        <EmptyState title="Belum ada siswa" desc="Kelas ini belum memiliki data siswa." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Nama</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">NISN</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Risiko</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Skor</th>
                  <th scope="col" className="px-4 py-3" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/siswa/${s.id}`} className="font-semibold text-slate-900 hover:text-[#005D4C]">
                        {s.nama}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-500">{s.nisn}</td>
                    <td className="px-4 py-3.5">
                      {s.r ? <RiskBadge kategori={s.r.kategori} /> : <span className="text-xs text-slate-400">Belum dihitung</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">{s.r ? Math.round(s.r.skor) : "—"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/dashboard/siswa/${s.id}`} className="inline-flex items-center text-slate-300 group-hover:text-[#005D4C]" aria-label={`Detail ${s.nama}`}>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
