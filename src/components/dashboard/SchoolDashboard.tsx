import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Prisma } from "@prisma/client";
import {
  getKpis,
  monthlyRiskTrend,
  riskFactorBreakdown,
  riskByKelas,
  attendanceSummary,
  priorityStudents,
  interventionByJenis,
  interventionTrend,
} from "@/lib/analytics";
import { PageHeader, StatTile, RiskBadge } from "@/components/dashboard/ui";
import { RiskTrendLine } from "@/components/charts/recharts/RiskTrendLine";
import { FactorBars } from "@/components/charts/recharts/FactorBars";
import { CategoryStackedBars } from "@/components/charts/recharts/CategoryStackedBars";
import { CategoryBars } from "@/components/charts/recharts/Bars";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";

/**
 * Dashboard Sekolah (Kepala Sekolah). Fokus: kinerja sekolah, perbandingan
 * kelas, faktor risiko, dan pengawasan intervensi. Boleh melihat siswa
 * (lingkup sekolahnya).
 */
export default function SchoolDashboard({ scope }: { scope: Prisma.SiswaWhereInput }) {
  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Sekolah" desc="Kinerja risiko, perbandingan kelas, dan pengawasan intervensi di sekolah Anda." />

      <Suspense fallback={<KpiSkeleton />}>
        <SchoolKpis scope={scope} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tren risiko 12 bulan" desc="Apakah kondisi sekolah membaik?">
          <Suspense fallback={<ChartSkeleton h={260} />}><TrendSection scope={scope} /></Suspense>
        </Panel>
        <Panel title="Risiko per kelas" desc="Kelas mana yang paling membutuhkan perhatian.">
          <Suspense fallback={<ChartSkeleton h={260} />}><ClassSection scope={scope} /></Suspense>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Faktor risiko" desc="Mengapa siswa berisiko di sekolah ini.">
          <Suspense fallback={<ChartSkeleton h={240} />}><FactorSection scope={scope} /></Suspense>
        </Panel>
        <Panel title="Kehadiran (30 hari)" desc="Prediktor terkuat putus sekolah.">
          <Suspense fallback={<ChartSkeleton h={240} />}><AttendanceSection scope={scope} /></Suspense>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Intervensi per jenis" desc="Komposisi tindak lanjut.">
          <Suspense fallback={<ChartSkeleton h={200} />}><JenisSection scope={scope} /></Suspense>
        </Panel>
        <Panel title="Tren intervensi 12 bulan" desc="Aktivitas tindak lanjut dari waktu ke waktu.">
          <Suspense fallback={<ChartSkeleton h={200} />}><IntervTrendSection scope={scope} /></Suspense>
        </Panel>
      </div>

      <Panel title="Siswa prioritas" desc="Daftar tindakan — risiko tertinggi lebih dulu.">
        <Suspense fallback={<TableSkeleton />}><PrioritySection scope={scope} /></Suspense>
      </Panel>
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

async function SchoolKpis({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const [kpis, att] = await Promise.all([getKpis(scope), attendanceSummary(scope)]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total siswa" value={kpis.totalSiswa.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="Risiko tinggi" value={kpis.merah.toLocaleString("id-ID")} accent="merah" sub={kpis.merahDeltaPct != null ? `${kpis.merahDeltaPct > 0 ? "+" : ""}${kpis.merahDeltaPct.toFixed(1)}% vs bln lalu` : "skor terkini"} />
      <StatTile label="Intervensi aktif" value={kpis.intervensiAktif.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="Rata-rata hadir" value={`${att.pctHadir}%`} accent="hijau" sub={`${att.kronisCount} alpa kronis`} />
    </div>
  );
}

async function TrendSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const t = await monthlyRiskTrend(scope);
  return <RiskTrendLine data={t.map((x) => ({ label: x.label, merah: x.merah, kuning: x.kuning, hijau: x.hijau }))} />;
}
async function ClassSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const k = await riskByKelas(scope);
  if (k.length === 0) return <p className="text-sm text-slate-500">Belum ada data kelas.</p>;
  return <CategoryStackedBars data={k.map((x) => ({ label: x.kelas, merah: x.merah, kuning: x.kuning, hijau: x.hijau }))} />;
}
async function FactorSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const f = await riskFactorBreakdown(scope);
  if (f.length === 0) return <p className="text-sm text-slate-500">Belum ada siswa berisiko.</p>;
  return <FactorBars data={f.map((x) => ({ label: x.label, value: x.count }))} />;
}
async function AttendanceSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const a = await attendanceSummary(scope);
  if (a.total === 0) return <p className="text-sm text-slate-500">Belum ada catatan kehadiran.</p>;
  const stats = [
    { label: "Rata-rata hadir", value: `${a.pctHadir}%`, tone: "text-emerald-700" },
    { label: "Tingkat alpa", value: `${a.pctAlpa}%`, tone: "text-red-700" },
    { label: "Alpa kronis", value: `${a.kronisCount}`, tone: "text-amber-700" },
  ];
  return (
    <dl className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg bg-slate-50 p-4 text-center">
          <dd className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</dd>
          <dt className="mt-1 text-xs text-slate-500">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
async function JenisSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const j = await interventionByJenis(scope);
  if (j.length === 0) return <p className="text-sm text-slate-500">Belum ada intervensi.</p>;
  return <CategoryBars data={j.map((x) => ({ label: x.label, value: x.count }))} seriesName="Intervensi" />;
}
async function IntervTrendSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const t = await interventionTrend(scope);
  if (t.reduce((a, x) => a + x.jumlah, 0) === 0) return <p className="text-sm text-slate-500">Belum ada intervensi.</p>;
  return <SingleAreaChart data={t.map((x) => ({ label: x.label, value: x.jumlah }))} name="Intervensi" />;
}
async function PrioritySection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const rows = await priorityStudents(scope, 10);
  if (rows.length === 0) return <p className="text-sm text-slate-500">Tidak ada siswa berisiko saat ini.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Siswa</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Kelas</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Tingkat</th>
            <th scope="col" className="px-3 py-2.5 text-left font-medium">Faktor utama</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">Skor</th>
            <th scope="col" className="px-3 py-2.5"><span className="sr-only">Aksi</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="group transition-colors hover:bg-slate-50">
              <td className="px-3 py-3 font-medium text-slate-900">{r.nama}</td>
              <td className="px-3 py-3 text-slate-600">{r.kelas}</td>
              <td className="px-3 py-3"><RiskBadge kategori={r.kategori} /></td>
              <td className="max-w-xs truncate px-3 py-3 text-slate-600">{r.faktorUtama}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-900">{r.skor}</td>
              <td className="px-3 py-3 text-right">
                <Link href={`/dashboard/siswa/${r.id}`} className="inline-flex items-center text-slate-300 group-hover:text-[#005D4C]" aria-label={`Detail ${r.nama}`}>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />)}</div>;
}
function ChartSkeleton({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" style={{ height: h }} />;
}
function TableSkeleton() {
  return <div className="space-y-2">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-9 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />)}</div>;
}
