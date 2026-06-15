import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/session";
import { analyticsScope, isAggregateRole } from "@/lib/dashboardScope";
import {
  gradeByMapel,
  belowKkmByMapel,
  gradeTrendByPeriode,
  academicByProvinsi,
} from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { AcademicProvinceTable } from "@/components/dashboard/AcademicTables";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = {
  superadmin: "Analisis Akademik Nasional",
  dinas: "Analisis Akademik Wilayah",
  kepsek: "Analisis Akademik Sekolah",
  guru: "Akademik Kelas",
  bk: "Analisis Akademik",
};

export default async function AkademikPage() {
  const ctx = await requireDashboardContext("/dashboard/akademik");
  const scope = analyticsScope(ctx);
  const aggregate = isAggregateRole(ctx.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title={TITLE[ctx.role] ?? "Analisis Akademik"}
        desc="Capaian nilai per mata pelajaran berdasarkan KKM (≥70 tuntas). Periode terbaru, dari data nilai yang ada."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <AkademikKpis scope={scope} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Rata-rata nilai per mata pelajaran" desc="Diurutkan dari terendah (perlu perhatian).">
          <Suspense fallback={<ChartSkeleton h={240} />}>
            <RataMapelSection scope={scope} />
          </Suspense>
        </Panel>
        <Panel title="Siswa di bawah KKM per mapel" desc="Jumlah siswa belum tuntas (periode terbaru).">
          <Suspense fallback={<ChartSkeleton h={240} />}>
            <BelowKkmSection scope={scope} />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Tren rata-rata nilai antarperiode" desc="Perkembangan capaian akademik.">
        <Suspense fallback={<ChartSkeleton h={200} />}>
          <TrendSection scope={scope} />
        </Suspense>
      </Panel>

      {aggregate && (
        <Panel title="Perbandingan akademik antarprovinsi" desc="Rata-rata nilai & persentase tuntas KKM.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <ProvinceSection />
          </Suspense>
        </Panel>
      )}
    </div>
  );
}

async function AkademikKpis({ scope }: { scope: Parameters<typeof gradeByMapel>[0] }) {
  const stats = await gradeByMapel(scope);
  if (stats.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada data nilai untuk dianalisis.</p>;
  }
  const totalNilai = stats.reduce((a, s) => a + s.total, 0);
  const avgRata = Math.round((stats.reduce((a, s) => a + s.rataRata * s.total, 0) / Math.max(1, totalNilai)) * 10) / 10;
  const avgTuntas = Math.round(stats.reduce((a, s) => a + s.pctTuntas * s.total, 0) / Math.max(1, totalNilai));
  const terendah = stats[0]!; // sudah terurut asc
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Rata-rata nilai" value={avgRata} accent="brand" sub="seluruh mapel periode ini" />
      <StatTile label="Tuntas KKM" value={`${avgTuntas}%`} accent={avgTuntas >= 75 ? "hijau" : avgTuntas >= 50 ? "kuning" : "merah"} sub="siswa mencapai KKM" />
      <StatTile label="Mapel perlu perhatian" value={terendah.mapel} accent="merah" sub={`rata-rata ${terendah.rataRata}`} />
      <StatTile label="Jumlah penilaian" value={totalNilai.toLocaleString("id-ID")} accent="brand" sub="record nilai periode ini" />
    </div>
  );
}

async function RataMapelSection({ scope }: { scope: Parameters<typeof gradeByMapel>[0] }) {
  const stats = await gradeByMapel(scope);
  if (stats.length === 0) return <p className="text-sm text-slate-500">Belum ada data nilai.</p>;
  return (
    <HorizontalBarChart
      seriesName="Rata-rata"
      data={stats.map((s) => ({
        label: s.mapel,
        value: s.rataRata,
        color: s.rataRata >= 70 ? CHART.hijau : s.rataRata >= 60 ? CHART.kuning : CHART.merah,
      }))}
    />
  );
}

async function BelowKkmSection({ scope }: { scope: Parameters<typeof belowKkmByMapel>[0] }) {
  const rows = await belowKkmByMapel(scope);
  if (rows.every((r) => r.count === 0)) return <p className="text-sm text-slate-500">Semua siswa tuntas KKM. 🎯</p>;
  return <HorizontalBarChart seriesName="Siswa belum tuntas" barColor={CHART.merah} data={rows.map((r) => ({ label: r.mapel, value: r.count }))} />;
}

async function TrendSection({ scope }: { scope: Parameters<typeof gradeTrendByPeriode>[0] }) {
  const rows = await gradeTrendByPeriode(scope);
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada data periode.</p>;
  return <SingleAreaChart name="Rata-rata nilai" data={rows} />;
}

async function ProvinceSection() {
  const rows = await academicByProvinsi();
  return <AcademicProvinceTable rows={rows} />;
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
