import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, assertSameWilayah } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { riskByKelasInSekolah, monthlyRiskTrend } from "@/lib/analytics";
import { PageHeader } from "@/components/dashboard/ui";
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
  assertSameWilayah(ctx, sekolah.wilayahId); // dinas hanya wilayahnya; superadmin lolos

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
      <PageHeader title={sekolah.nama} desc={`NPSN ${sekolah.npsn} · ${sekolah.wilayah.kabupaten}, ${sekolah.wilayah.provinsi}`} />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-display text-base font-semibold text-[#0F172A]">Tren risiko 12 bulan</h2>
        <Suspense fallback={<div className="h-[260px] animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />}>
          <SchoolTrend sekolahId={id} />
        </Suspense>
      </section>

      <h2 className="mb-3 font-display text-base font-semibold text-[#0F172A]">Risiko per kelas</h2>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />}>
        <ClassTable sekolahId={id} />
      </Suspense>
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
