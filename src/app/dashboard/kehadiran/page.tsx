import { Suspense } from "react";
import { requireDashboardContext } from "@/lib/session";
import { analyticsScope, isAggregateRole } from "@/lib/dashboardScope";
import {
  attendanceSummary,
  attendanceTrendMonthly,
  attendanceStatusDist,
  dailyAlpaTrend,
  attendanceByProvinsi,
  chronicAbsenteeByProvinsi,
} from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { StackedAreaChart } from "@/components/charts/recharts/StackedAreaChart";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { AttendanceProvinceTable } from "@/components/dashboard/AttendanceTables";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

const TITLE: Record<string, string> = {
  superadmin: "Kehadiran Nasional",
  dinas: "Kehadiran Wilayah",
  kepsek: "Kehadiran Sekolah",
  guru: "Kehadiran Kelas",
  bk: "Kehadiran (pemicu kasus)",
};

const STATUS_SERIES = [
  { key: "hadir", name: "Hadir", color: CHART.hijau },
  { key: "telat", name: "Telat", color: "#0ea5e9" },
  { key: "izin", name: "Izin", color: "#6366f1" },
  { key: "sakit", name: "Sakit", color: CHART.kuning },
  { key: "alpa", name: "Alpa", color: CHART.merah },
];

const STATUS_LABEL: Record<string, string> = { hadir: "Hadir", telat: "Telat", izin: "Izin", sakit: "Sakit", alpa: "Alpa" };

const statusColorKey = (s: string): "merah" | "kuning" | "hijau" =>
  s === "alpa" ? "merah" : s === "sakit" || s === "izin" ? "kuning" : "hijau";

export default async function KehadiranPage() {
  const ctx = await requireDashboardContext("/dashboard/kehadiran");
  const scope = analyticsScope(ctx);
  const aggregate = isAggregateRole(ctx.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title={TITLE[ctx.role] ?? "Analisis Kehadiran"}
        desc="Kehadiran sebagai sinyal peringatan dini. Persentase 30 hari terakhir, tren 12 bulan, dan pola ketidakhadiran."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <KehadiranKpis scope={scope} />
      </Suspense>

      <Panel title="Tren kehadiran 12 bulan" desc="Komposisi status kehadiran tiap bulan.">
        <Suspense fallback={<ChartSkeleton h={260} />}>
          <TrendSection scope={scope} />
        </Suspense>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Distribusi status (30 hari)" desc="Proporsi status kehadiran terkini.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <DistSection scope={scope} />
          </Suspense>
        </Panel>
        <Panel title="Tren alpa harian (30 hari)" desc="Lonjakan ketidakhadiran tanpa keterangan.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <DailySection scope={scope} />
          </Suspense>
        </Panel>
      </div>

      {aggregate && (
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Perbandingan kehadiran antarprovinsi" desc="Persentase hadir/alpa per provinsi.">
            <Suspense fallback={<ChartSkeleton h={200} />}>
              <ProvinceSection />
            </Suspense>
          </Panel>
          <Panel title="Siswa absen kronis per provinsi" desc="≥5 alpa dalam 30 hari.">
            <Suspense fallback={<ChartSkeleton h={200} />}>
              <ChronicSection />
            </Suspense>
          </Panel>
        </div>
      )}
    </div>
  );
}

async function KehadiranKpis({ scope }: { scope: Parameters<typeof attendanceSummary>[0] }) {
  const s = await attendanceSummary(scope);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Tingkat kehadiran" value={`${s.pctHadir}%`} accent={s.pctHadir >= 90 ? "hijau" : s.pctHadir >= 80 ? "kuning" : "merah"} sub="30 hari terakhir" />
      <StatTile label="Tingkat alpa" value={`${s.pctAlpa}%`} accent={s.pctAlpa <= 5 ? "hijau" : s.pctAlpa <= 10 ? "kuning" : "merah"} sub="tanpa keterangan" />
      <StatTile label="Siswa absen kronis" value={s.kronisCount.toLocaleString("id-ID")} accent="merah" sub="≥5 alpa / 30 hari" />
      <StatTile label="Total rekap" value={s.total.toLocaleString("id-ID")} accent="brand" sub="record absensi" />
    </div>
  );
}

async function TrendSection({ scope }: { scope: Parameters<typeof attendanceTrendMonthly>[0] }) {
  const rows = await attendanceTrendMonthly(scope);
  const hasData = rows.some((r) => r.hadir + r.izin + r.sakit + r.alpa + r.telat > 0);
  if (!hasData) return <p className="text-sm text-slate-500">Belum ada data kehadiran.</p>;
  return <StackedAreaChart data={rows as unknown as { label: string; [k: string]: string | number }[]} series={STATUS_SERIES} ariaLabel="Tren kehadiran 12 bulan per status" />;
}

async function DistSection({ scope }: { scope: Parameters<typeof attendanceStatusDist>[0] }) {
  const rows = await attendanceStatusDist(scope);
  const total = rows.reduce((a, r) => a + r.count, 0);
  if (total === 0) return <p className="text-sm text-slate-500">Belum ada data.</p>;
  return <RiskDonutChart data={rows.map((r) => ({ name: STATUS_LABEL[r.status] ?? r.status, value: r.count, key: statusColorKey(r.status) }))} />;
}

async function DailySection({ scope }: { scope: Parameters<typeof dailyAlpaTrend>[0] }) {
  const rows = await dailyAlpaTrend(scope, 30);
  if (rows.every((r) => r.value === 0)) return <p className="text-sm text-slate-500">Tidak ada alpa dalam 30 hari. 🎯</p>;
  return <SingleAreaChart name="Alpa harian" data={rows} />;
}

async function ProvinceSection() {
  const rows = await attendanceByProvinsi();
  return <AttendanceProvinceTable rows={rows} />;
}

async function ChronicSection() {
  const rows = await chronicAbsenteeByProvinsi();
  if (rows.length === 0 || rows.every((r) => r.count === 0)) {
    return <p className="text-sm text-slate-500">Tidak ada siswa absen kronis dalam 30 hari.</p>;
  }
  return <HorizontalBarChart seriesName="Siswa kronis" barColor={CHART.merah} data={rows.map((r) => ({ label: r.provinsi, value: r.count }))} />;
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
