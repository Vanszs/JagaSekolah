import { Suspense } from "react";
import { MapPin } from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  getKpis,
  monthlyRiskTrend,
  riskFactorBreakdown,
  riskDonut,
  riskBySekolahScoped,
  interventionTrend,
  attendanceSummary,
} from "@/lib/analytics";
import { PageHeader, StatTile } from "@/components/dashboard/ui";
import { RegionTable } from "@/components/dashboard/RegionTable";
import { RiskTrendLine } from "@/components/charts/recharts/RiskTrendLine";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { FactorBars } from "@/components/charts/recharts/FactorBars";
import { CategoryStackedBars } from "@/components/charts/recharts/CategoryStackedBars";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";

/**
 * Dashboard Wilayah (Dinas) — AGREGAT ANONIM. Fokus: sekolah mana yang perlu
 * perhatian, faktor dominan, apakah membaik. TANPA identitas siswa (PDP).
 * Drill-down hanya sampai sekolah (bukan roster/siswa).
 */
export default function DinasDashboard({
  regionLabel,
  sekolahWhere,
  scope,
}: {
  regionLabel: string;
  sekolahWhere: Prisma.SekolahWhereInput;
  scope: Prisma.SiswaWhereInput;
}) {
  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Wilayah" desc={`Statistik risiko anonim seluruh sekolah di ${regionLabel}. Identitas siswa tetap di tangan sekolah.`} />

      <Suspense fallback={<KpiSkeleton />}>
        <DinasKpis scope={scope} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title="Sebaran risiko wilayah" desc="Kondisi populasi terkini.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <DonutSection scope={scope} />
          </Suspense>
        </Panel>
        <Panel title="Tren risiko 12 bulan" desc="Apakah situasi wilayah membaik?">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <TrendSection scope={scope} />
          </Suspense>
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Faktor risiko dominan" desc="Mengapa siswa berisiko di wilayah ini.">
          <Suspense fallback={<ChartSkeleton h={240} />}>
            <FactorSection scope={scope} />
          </Suspense>
        </Panel>
        <Panel title="Tren intervensi 12 bulan" desc="Aktivitas tindak lanjut sekolah.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <InterventionSection scope={scope} />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Perbandingan sekolah" desc="Komposisi risiko per sekolah di wilayah ini.">
        <Suspense fallback={<ChartSkeleton h={260} />}>
          <SchoolCompare sekolahWhere={sekolahWhere} />
        </Suspense>
      </Panel>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <MapPin className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
          Telusuri sekolah
        </h2>
        <Suspense fallback={<TableSkeleton />}>
          <SchoolTable sekolahWhere={sekolahWhere} />
        </Suspense>
      </section>
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="font-display text-base font-semibold text-[#0F172A]">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

async function DinasKpis({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const [kpis, att] = await Promise.all([getKpis(scope), attendanceSummary(scope)]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Siswa dipantau" value={kpis.totalSiswa.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="Risiko tinggi" value={kpis.merah.toLocaleString("id-ID")} accent="merah" sub={kpis.merahDeltaPct != null ? `${kpis.merahDeltaPct > 0 ? "+" : ""}${kpis.merahDeltaPct.toFixed(1)}% vs bln lalu` : "skor terkini"} />
      <StatTile label="Waspada" value={kpis.kuning.toLocaleString("id-ID")} accent="kuning" />
      <StatTile label="Rata-rata hadir" value={`${att.pctHadir}%`} accent="hijau" sub={`${att.kronisCount} alpa kronis`} />
    </div>
  );
}

async function DonutSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const d = await riskDonut(scope);
  return (
    <RiskDonutChart data={[
      { name: "Risiko Tinggi", value: d.merah, key: "merah" },
      { name: "Waspada", value: d.kuning, key: "kuning" },
      { name: "Aman", value: d.hijau, key: "hijau" },
    ]} />
  );
}

async function TrendSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const t = await monthlyRiskTrend(scope);
  return <RiskTrendLine data={t.map((x) => ({ label: x.label, merah: x.merah, kuning: x.kuning, hijau: x.hijau }))} />;
}

async function FactorSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const f = await riskFactorBreakdown(scope);
  if (f.length === 0) return <p className="text-sm text-slate-500">Belum ada siswa berisiko.</p>;
  return <FactorBars data={f.map((x) => ({ label: x.label, value: x.count }))} />;
}

async function InterventionSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const t = await interventionTrend(scope);
  const total = t.reduce((a, x) => a + x.jumlah, 0);
  if (total === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <SingleAreaChart data={t.map((x) => ({ label: x.label, value: x.jumlah }))} name="Intervensi" />;
}

async function SchoolCompare({ sekolahWhere }: { sekolahWhere: Prisma.SekolahWhereInput }) {
  const sek = await riskBySekolahScoped(sekolahWhere);
  return <CategoryStackedBars data={sek.map((k) => ({ label: k.label, merah: k.merah, kuning: k.kuning, hijau: k.hijau }))} />;
}

async function SchoolTable({ sekolahWhere }: { sekolahWhere: Prisma.SekolahWhereInput }) {
  const sek = await riskBySekolahScoped(sekolahWhere);
  return <RegionTable rows={sek} firstColLabel="Sekolah" hrefFor={(r) => `/dashboard/sekolah/${r.id}`} />;
}

function KpiSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />)}</div>;
}
function ChartSkeleton({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" style={{ height: h }} />;
}
function TableSkeleton() {
  return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />)}</div>;
}
