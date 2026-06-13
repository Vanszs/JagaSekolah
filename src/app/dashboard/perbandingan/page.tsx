import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskBySekolahScoped, dinasSekolahWhere } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { SchoolCompareTable } from "@/components/dashboard/SchoolCompareTable";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

export default async function PerbandinganPage() {
  const ctx = await requireDashboardContext("/dashboard/perbandingan");
  if (ctx.role !== "dinas") redirect("/dashboard");
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
          <CompareTable where={where} />
        </Suspense>
      </Panel>
    </div>
  );
}

async function CompareBar({ where }: { where: Parameters<typeof riskBySekolahScoped>[0] }) {
  const rows = await riskBySekolahScoped(where);
  const top = rows.filter((r) => r.merah > 0).slice(0, 15);
  if (top.length === 0) return <p className="text-sm text-slate-500">Belum ada sekolah dengan risiko tinggi.</p>;
  return <HorizontalBarChart seriesName="Risiko tinggi" barColor={CHART.merah} data={top.map((r) => ({ label: r.label, value: r.merah }))} />;
}

async function CompareTable({ where }: { where: Parameters<typeof riskBySekolahScoped>[0] }) {
  const rows = await riskBySekolahScoped(where);
  return <SchoolCompareTable rows={rows} />;
}
