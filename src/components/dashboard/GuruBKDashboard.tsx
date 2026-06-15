import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  riskDonut,
  attendanceSummary,
  interventionByJenis,
  interventionTrend,
  priorityStudents,
} from "@/lib/analytics";
import { PageHeader, StatTile, RiskDot, EmptyState } from "@/components/dashboard/ui";
import { RISK_CONFIG } from "@/lib/risk";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { CategoryBars } from "@/components/charts/recharts/Bars";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import type { KategoriRisiko } from "@prisma/client";

const KATEGORI: KategoriRisiko[] = ["merah", "kuning", "hijau"];

/**
 * Dashboard Guru & BK. Fokus operasional (sedikit grafik, banyak aksi):
 * - GURU: "siswa mana yang harus saya bantu hari ini" — KPI kelas + donut +
 *   kehadiran + daftar siswa prioritas.
 * - BK: "kasus mana yang harus ditangani" — donut kasus + intervensi per jenis
 *   + tren intervensi + daftar kasus prioritas.
 */
export default async function GuruBKDashboard({ role, scope }: { role: Role; scope: Prisma.SiswaWhereInput }) {
  const isBK = role === "bk";

  const [totalSiswa, grouped] = await Promise.all([
    prisma.siswa.count({ where: scope }),
    prisma.risiko.groupBy({ by: ["kategori"], where: { isLatest: true, siswa: scope }, _count: true }),
  ]);
  const count = (k: KategoriRisiko) => grouped.find((g) => g.kategori === k)?._count ?? 0;

  return (
    <div className="space-y-8">
      {/* Greeting banner — teal accent per Pencil design */}
      <div className="flex items-center justify-between rounded-lg border border-teal-100 bg-teal-50 px-5 py-3.5">
        <div>
          <p className="text-sm font-semibold text-[#005D4C]">
            {isBK ? "Dashboard Bimbingan & Konseling" : "Dashboard Wali Kelas"}
          </p>
          <p className="mt-0.5 text-xs text-teal-700">
            {isBK
              ? "Kasus mana yang harus ditangani hari ini."
              : "Siswa mana yang harus dibantu hari ini."}
          </p>
        </div>
        <span className="text-xl" aria-hidden="true">{isBK ? "🤝" : "📚"}</span>
      </div>

      <PageHeader
        title={isBK ? "Dashboard BK" : "Dashboard Kelas"}
        desc={isBK ? "Kasus mana yang harus ditangani — ringkasan kasus & tindak lanjut." : "Siswa mana yang harus dibantu hari ini — pantauan kelas Anda."}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={isBK ? "Total kasus dipantau" : "Total siswa"} value={totalSiswa} accent="brand" />
        {KATEGORI.map((k) => (
          <StatTile key={k} label={RISK_CONFIG[k].label} value={count(k)} accent={k} />
        ))}
      </div>

      {/* Grafik kecil yang relevan dgn peran */}
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title={isBK ? "Sebaran kasus" : "Sebaran risiko kelas"}>
          <Suspense fallback={<ChartSkeleton h={220} />}><DonutSection scope={scope} /></Suspense>
        </Panel>
        {isBK ? (
          <Panel title="Intervensi per jenis">
            <Suspense fallback={<ChartSkeleton h={200} />}><JenisSection scope={scope} /></Suspense>
          </Panel>
        ) : (
          <Panel title="Kehadiran (30 hari)">
            <Suspense fallback={<ChartSkeleton h={200} />}><AttendanceSection scope={scope} /></Suspense>
          </Panel>
        )}
      </div>

      {isBK && (
        <Panel title="Tren intervensi 12 bulan" desc="Aktivitas tindak lanjut BK dari waktu ke waktu.">
          <Suspense fallback={<ChartSkeleton h={200} />}><IntervTrend scope={scope} /></Suspense>
        </Panel>
      )}

      {/* Daftar tindakan utama */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#0F172A]">{isBK ? "Kasus prioritas" : "Perlu perhatian"}</h2>
          <Link href="/dashboard/siswa" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#005D4C] hover:underline underline-offset-2">
            {isBK ? "Semua kasus" : "Semua siswa"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <Suspense fallback={<ListSkeleton />}><PriorityList scope={scope} /></Suspense>
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
async function JenisSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const j = await interventionByJenis(scope);
  if (j.length === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <CategoryBars data={j.map((x) => ({ label: x.label, value: x.count }))} seriesName="Intervensi" />;
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
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg bg-slate-50 p-4 text-center">
          <dd className={`text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</dd>
          <dt className="mt-1 text-xs text-slate-500">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
async function IntervTrend({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const t = await interventionTrend(scope);
  if (t.reduce((a, x) => a + x.jumlah, 0) === 0) return <p className="text-sm text-slate-500">Belum ada intervensi.</p>;
  return <SingleAreaChart data={t.map((x) => ({ label: x.label, value: x.jumlah }))} name="Intervensi" />;
}
async function PriorityList({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const rows = await priorityStudents(scope, 8);
  if (rows.length === 0) {
    return <EmptyState icon={<Users className="h-6 w-6" aria-hidden="true" />} title="Belum ada siswa berisiko" desc="Semua siswa berstatus aman, atau data risiko belum dihitung." />;
  }
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/dashboard/siswa/${r.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{r.nama}</p>
              <p className="truncate text-xs text-slate-400">{r.kelas} · {r.faktorUtama}</p>
            </div>
            <RiskDot kategori={r.kategori} />
            <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-700">{r.skor}</span>
            <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ChartSkeleton({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" style={{ height: h }} />;
}
function ListSkeleton() {
  return <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-14 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />)}</div>;
}
