import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskBySekolah } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { SchoolCompareTable } from "@/components/dashboard/SchoolCompareTable";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

export default async function PerbandinganPage() {
  const ctx = await requireDashboardContext("/dashboard/perbandingan");
  if (ctx.role !== "dinas") redirect("/dashboard");
  if (!ctx.wilayahId) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Perbandingan Sekolah"
        desc="Peringkat sekolah di wilayah Anda berdasarkan tingkat risiko. Agregat anonim — tanpa identitas siswa."
      />

      <Panel title="Sekolah dengan risiko tinggi terbanyak" desc="Lima belas teratas (klik tabel untuk telusuri).">
        <Suspense fallback={<ChartSkeleton h={300} />}>
          <CompareBar wilayahId={ctx.wilayahId} />
        </Suspense>
      </Panel>

      <Panel title="Peringkat lengkap" desc="Urutkan kolom mana pun. Klik nama sekolah untuk menelusuri kelas.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <CompareTable wilayahId={ctx.wilayahId} />
        </Suspense>
      </Panel>
    </div>
  );
}

async function CompareBar({ wilayahId }: { wilayahId: string }) {
  const rows = await riskBySekolah(wilayahId);
  const top = rows.filter((r) => r.merah > 0).slice(0, 15);
  if (top.length === 0) return <p className="text-sm text-slate-500">Belum ada sekolah dengan risiko tinggi.</p>;
  return <HorizontalBarChart seriesName="Risiko tinggi" barColor={CHART.merah} data={top.map((r) => ({ label: r.label, value: r.merah }))} />;
}

async function CompareTable({ wilayahId }: { wilayahId: string }) {
  const rows = await riskBySekolah(wilayahId);
  return <SchoolCompareTable rows={rows} />;
}
