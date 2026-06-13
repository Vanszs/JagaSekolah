import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { platformByProvinsi, schoolRiskRows } from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { TenantTable } from "@/components/dashboard/TenantTable";

export const dynamic = "force-dynamic";

/**
 * Manajemen Tenant (Superadmin) — skala & sebaran sekolah di platform,
 * komposisi risiko per sekolah, dan status keaktifan. Agregat (tanpa PII).
 */
export default async function TenantPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/tenant");
  requireRole(ctx, "superadmin");
  await audit(ctx, "view_tenant", "tenant:all");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manajemen Tenant"
        desc="Sekolah yang terdaftar di platform: sebaran wilayah, cakupan data, komposisi risiko, dan status keaktifan."
      />

      <Suspense fallback={<KpiSkeleton n={4} />}>
        <TenantKpis />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Siswa terpantau per provinsi" desc="Cakupan data tiap provinsi.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <SiswaProvSection />
          </Suspense>
        </Panel>
        <Panel title="Jumlah sekolah per provinsi" desc="Sebaran tenant.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <SekolahProvSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Daftar sekolah" desc="Urutkan kolom; klik nama sekolah untuk menelusuri kelas & siswa.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <TenantTableSection />
        </Suspense>
      </Panel>
    </div>
  );
}

async function TenantKpis() {
  const [agg, prov] = await Promise.all([
    prisma.sekolah.findMany({ select: { _count: { select: { siswa: true, users: true } } } }),
    platformByProvinsi(),
  ]);
  const total = agg.length;
  const aktif = agg.filter((s) => s._count.users > 0).length;
  const dormant = total - aktif;
  const totalSiswa = agg.reduce((a, s) => a + s._count.siswa, 0);
  const rataSiswa = total > 0 ? Math.round(totalSiswa / total) : 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total sekolah" value={total.toLocaleString("id-ID")} accent="brand" sub={`${prov.length} provinsi`} />
      <StatTile label="Tenant aktif" value={aktif.toLocaleString("id-ID")} accent="hijau" sub={`${dormant} belum aktif`} />
      <StatTile label="Siswa tercakup" value={totalSiswa.toLocaleString("id-ID")} accent="brand" sub={`rata-rata ${rataSiswa}/sekolah`} />
      <StatTile label="Provinsi" value={prov.length.toLocaleString("id-ID")} accent="brand" sub="cakupan wilayah" />
    </div>
  );
}

async function SiswaProvSection() {
  const rows = await platformByProvinsi();
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada data.</p>;
  return <HorizontalBarChart seriesName="Siswa" data={rows.slice(0, 12).map((r) => ({ label: r.provinsi, value: r.siswa }))} />;
}

async function SekolahProvSection() {
  const rows = await platformByProvinsi();
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada data.</p>;
  const sorted = rows.toSorted((a, b) => b.sekolah - a.sekolah).slice(0, 12);
  return <HorizontalBarChart seriesName="Sekolah" data={sorted.map((r) => ({ label: r.provinsi, value: r.sekolah }))} />;
}

async function TenantTableSection() {
  const rows = await schoolRiskRows();
  return <TenantTable rows={rows} />;
}

function KpiSkeleton({ n }: { n: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
