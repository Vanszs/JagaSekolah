import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskByGender, riskByKip, distanceDistribution } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { CategoryStackedBars } from "@/components/charts/recharts/CategoryStackedBars";
import { Histogram } from "@/components/charts/recharts/Histogram";

export const dynamic = "force-dynamic";

export default async function DemografiPage() {
  const ctx = await requireDashboardContext("/dashboard/demografi");
  if (ctx.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Demografi & Pemerataan"
        desc="Sebaran risiko menurut karakteristik siswa (jenis kelamin, status KIP, jarak ke sekolah) untuk menilai pemerataan. Agregat, tanpa identitas siswa. Data ekonomi terenkripsi tidak ditampilkan."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Risiko menurut jenis kelamin" desc="Apakah ada kesenjangan gender?">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <GenderSection />
          </Suspense>
        </Panel>
        <Panel title="Risiko menurut status KIP" desc="Penerima Kartu Indonesia Pintar vs non-penerima.">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <KipSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Distribusi jarak ke sekolah" desc="Sebaran jarak tempuh siswa — faktor aksesibilitas.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <DistanceSection />
        </Suspense>
      </Panel>
    </div>
  );
}

async function GenderSection() {
  const rows = await riskByGender({});
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada data.</p>;
  return <CategoryStackedBars data={rows.map((r) => ({ label: r.grup, merah: r.merah, kuning: r.kuning, hijau: r.hijau }))} />;
}

async function KipSection() {
  const rows = await riskByKip({});
  return <CategoryStackedBars data={rows.map((r) => ({ label: r.grup, merah: r.merah, kuning: r.kuning, hijau: r.hijau }))} />;
}

async function DistanceSection() {
  const bins = await distanceDistribution({});
  if (bins.every((b) => b.count === 0)) return <p className="text-sm text-slate-500">Belum ada data jarak.</p>;
  return <Histogram data={bins} seriesName="Siswa" xLabel="Jarak ke sekolah" />;
}
