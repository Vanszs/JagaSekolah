import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskBySekolahScoped, dinasSekolahWhere } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton, EmptyState } from "@/components/dashboard/ui";
import { Pagination } from "@/components/dashboard/Pagination";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { SchoolCompareTable } from "@/components/dashboard/SchoolCompareTable";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function PerbandinganPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireDashboardContext("/dashboard/perbandingan");
  if (ctx.role !== "dinas") redirect("/dashboard");
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr, 10) || 1);
  const where = dinasSekolahWhere({ wilayahId: ctx.wilayahId, provinsi: ctx.provinsi });
  const cakupan = ctx.wilayahId ? "di wilayah Anda" : ctx.provinsi ? `di Provinsi ${ctx.provinsi}` : "se-Indonesia";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Perbandingan Sekolah"
        desc={`Peringkat sekolah ${cakupan} berdasarkan tingkat risiko. Agregat — klik sekolah untuk menelusuri.`}
      />

      <Panel title="Sekolah dengan risiko tinggi terbanyak" desc="Lima belas teratas.">
        <Suspense fallback={<ChartSkeleton h={300} />}>
          <CompareBar where={where} />
        </Suspense>
      </Panel>

      <Panel title="Peringkat lengkap" desc="Urutkan kolom mana pun. Klik nama sekolah untuk menelusuri kelas.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <CompareTable where={where} page={page} />
        </Suspense>
      </Panel>
    </div>
  );
}

async function CompareBar({ where }: { where: Parameters<typeof riskBySekolahScoped>[0] }) {
  const rows = await riskBySekolahScoped(where);
  const top = rows.toSorted((a, b) => b.merah - a.merah).filter((r) => r.merah > 0).slice(0, 15);
  if (top.length === 0) return <p className="text-sm text-slate-500">Belum ada sekolah dengan risiko tinggi.</p>;
  return <HorizontalBarChart seriesName="Risiko tinggi" barColor={CHART.merah} data={top.map((r) => ({ label: r.label, value: r.merah }))} />;
}

async function CompareTable({ where, page }: { where: Parameters<typeof riskBySekolahScoped>[0]; page: number }) {
  const rows = await riskBySekolahScoped(where);
  if (rows.length === 0) return <EmptyState title="Belum ada data sekolah" desc="Sekolah akan muncul setelah data tersedia di lingkup ini." />;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);
  return (
    <>
      <SchoolCompareTable rows={pageRows} />
      <Pagination page={page} totalPages={totalPages} basePath="/dashboard/perbandingan" />
    </>
  );
}
