import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, assertDinasWilayah } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { riskByKelasInSekolah, monthlyRiskTrend } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { RegionTable } from "@/components/dashboard/RegionTable";
import { RiskTrendLine } from "@/components/charts/recharts/RiskTrendLine";

export const dynamic = "force-dynamic";

/** Drill-down: SEKOLAH → tren + daftar kelas. */
export default async function SekolahPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireDashboardContext(`/dashboard/sekolah/${id}`);
  requireRole(ctx, "superadmin", "dinas");

  const sekolah = await prisma.sekolah.findUnique({
    where: { id },
    select: { nama: true, npsn: true, wilayahId: true, wilayah: { select: { provinsi: true, kabupaten: true } } },
  });
  if (!sekolah) notFound();
  assertDinasWilayah(ctx, { wilayahId: sekolah.wilayahId, provinsi: sekolah.wilayah.provinsi }); // jenjang dinas

  await audit(ctx, "view_agregat", `sekolah:${id}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Nasional", href: "/dashboard" },
          { label: sekolah.wilayah.provinsi, href: `/dashboard/wilayah/${encodeURIComponent(sekolah.wilayah.provinsi)}` },
          { label: sekolah.wilayah.kabupaten, href: `/dashboard/kabupaten/${sekolah.wilayahId}` },
          { label: sekolah.nama },
        ]}
      />
      <PageHeader title={sekolah.nama} desc={`NPSN ${sekolah.npsn} · ${sekolah.wilayah.kabupaten}, ${sekolah.wilayah.provinsi}`} />      <div className="space-y-6">
        <Panel title="Tren risiko 12 bulan" desc="Evolusi kategori risiko siswa sepanjang tahun.">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <SchoolTrend sekolahId={id} />
          </Suspense>
        </Panel>

        <Panel title="Risiko per kelas" desc="Klik nama kelas untuk melihat daftar siswa.">
          <Suspense fallback={<ChartSkeleton h={160} />}>
            <ClassTable sekolahId={id} />
          </Suspense>
        </Panel>
      </div>
    </>
  );
}

async function SchoolTrend({ sekolahId }: { sekolahId: string }) {
  const trend = await monthlyRiskTrend({ sekolahId });
  return <RiskTrendLine data={trend.map((t) => ({ label: t.label, merah: t.merah, kuning: t.kuning, hijau: t.hijau }))} />;
}

async function ClassTable({ sekolahId }: { sekolahId: string }) {
  const kelas = await riskByKelasInSekolah(sekolahId);
  return (
    <RegionTable
      rows={kelas}
      firstColLabel="Kelas"
      hrefFor={(r) => `/dashboard/sekolah/${sekolahId}/kelas/${r.id}`}
    />
  );
}
