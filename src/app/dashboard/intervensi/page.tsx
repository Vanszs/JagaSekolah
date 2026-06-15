import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/session";
import { analyticsScope, isAggregateRole } from "@/lib/dashboardScope";
import {
  interventionByJenis,
  interventionTrend,
  interventionTrendByJenis,
  interventionCoverageByProvinsi,
  topIntervenors,
  getKpis,
} from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { CategoryBars } from "@/components/charts/recharts/Bars";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { StackedAreaChart } from "@/components/charts/recharts/StackedAreaChart";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { CoverageProvinceTable } from "@/components/dashboard/InterventionTables";
import { LINE_PALETTE } from "@/components/charts/recharts/MultiLineChart";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = {
  superadmin: "Cakupan Intervensi Nasional",
  dinas: "Cakupan Intervensi Wilayah",
  kepsek: "Rekap Intervensi Sekolah",
  guru: "Rekap Tindak Lanjut",
  bk: "Rekap Intervensi",
};

export default async function IntervensiPage() {
  const ctx = await requireDashboardContext("/dashboard/intervensi");
  const scope = analyticsScope(ctx);
  const aggregate = isAggregateRole(ctx.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title={TITLE[ctx.role] ?? "Intervensi"}
        desc="Tindak lanjut yang tercatat: jenis, tren, dan cakupan terhadap siswa berisiko. Data dari catatan intervensi yang ada."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <IntervensiKpis scope={scope} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Intervensi per jenis" desc="Komposisi tindak lanjut.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <JenisSection scope={scope} />
          </Suspense>
        </Panel>
        <Panel title="Tren intervensi 12 bulan" desc="Volume tindak lanjut tiap bulan.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <TrendSection scope={scope} />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Tren intervensi per jenis (12 bulan)" desc="Pergeseran jenis tindak lanjut dari waktu ke waktu.">
        <Suspense fallback={<ChartSkeleton h={260} />}>
          <TrendByJenisSection scope={scope} />
        </Suspense>
      </Panel>

      {aggregate ? (
        <Panel title="Cakupan intervensi antarprovinsi" desc="Persentase siswa berisiko yang sudah diintervensi.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <CoverageSection />
          </Suspense>
        </Panel>
      ) : (
        <Panel title="Pelaku tindak lanjut teraktif" desc="Guru/BK dengan intervensi terbanyak.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <TopIntervenorsSection scope={scope} />
          </Suspense>
        </Panel>
      )}
    </div>
  );
}

async function IntervensiKpis({ scope }: { scope: Parameters<typeof getKpis>[0] }) {
  const [kpis, byJenis] = await Promise.all([getKpis(scope), interventionByJenis(scope)]);
  const totalIntervensi = byJenis.reduce((a, j) => a + j.count, 0);
  const berisiko = kpis.merah + kpis.kuning;
  const cakupan = berisiko > 0 ? Math.round((kpis.intervensiAktif / berisiko) * 100) : 0;
  const teratas = byJenis[0];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total intervensi" value={totalIntervensi.toLocaleString("id-ID")} accent="brand" sub="tercatat (aktif)" />
      <StatTile label="Cakupan" value={`${cakupan}%`} accent={cakupan >= 75 ? "hijau" : cakupan >= 40 ? "kuning" : "merah"} sub="dari siswa berisiko" />
      <StatTile label="Siswa berisiko" value={berisiko.toLocaleString("id-ID")} accent="merah" sub="merah + kuning" />
      <StatTile label="Jenis terbanyak" value={teratas?.label ?? "—"} accent="brand" sub={teratas ? `${teratas.count} kasus` : "belum ada"} />
    </div>
  );
}

async function JenisSection({ scope }: { scope: Parameters<typeof interventionByJenis>[0] }) {
  const j = await interventionByJenis(scope);
  if (j.length === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <CategoryBars seriesName="Intervensi" data={j.map((x) => ({ label: x.label, value: x.count }))} />;
}

async function TrendSection({ scope }: { scope: Parameters<typeof interventionTrend>[0] }) {
  const t = await interventionTrend(scope);
  if (t.reduce((a, x) => a + x.jumlah, 0) === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <SingleAreaChart name="Intervensi" data={t.map((x) => ({ label: x.label, value: x.jumlah }))} />;
}

async function TrendByJenisSection({ scope }: { scope: Parameters<typeof interventionTrendByJenis>[0] }) {
  const { points, jenis } = await interventionTrendByJenis(scope);
  if (jenis.length === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  const series = jenis.map((j, i) => ({ key: j.key, name: j.label, color: LINE_PALETTE[i % LINE_PALETTE.length]! }));
  return <StackedAreaChart data={points} series={series} ariaLabel="Tren intervensi per jenis 12 bulan" />;
}

async function CoverageSection() {
  const rows = await interventionCoverageByProvinsi();
  return <CoverageProvinceTable rows={rows} />;
}

async function TopIntervenorsSection({ scope }: { scope: Parameters<typeof topIntervenors>[0] }) {
  const rows = await topIntervenors(scope, 10);
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada pelaku tercatat.</p>;
  return <HorizontalBarChart seriesName="Intervensi" data={rows.map((r) => ({ label: r.nama, value: r.count }))} />;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
