import { Suspense } from "react";
import { Info, MapPin } from "lucide-react";
import {
  platformScale,
  getKpis,
  monthlyRiskTrend,
  riskDonut,
  riskFactorBreakdown,
  riskByProvinsi,
  interventionByJenis,
  interventionTrend,
} from "@/lib/analytics";
import { PageHeader, StatTile } from "@/components/dashboard/ui";
import { RegionTable } from "@/components/dashboard/RegionTable";
import { RiskTrendLine } from "@/components/charts/recharts/RiskTrendLine";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { FactorBars } from "@/components/charts/recharts/FactorBars";
import { CategoryBars } from "@/components/charts/recharts/Bars";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { CHART } from "@/components/charts/recharts/theme";

/**
 * Overview Nasional (Superadmin) — AGREGAT SAJA, tanpa identitas siswa.
 * Pertanyaan: seberapa besar sistem, apakah risiko nasional membaik, wilayah
 * mana yang perlu perhatian, faktor apa yang dominan. Untuk melihat siswa,
 * superadmin harus drill-down: Nasional → Provinsi → Kabupaten → Sekolah →
 * Kelas → Siswa (lihat tabel wilayah di bawah).
 */
export default function NationalOverview() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard Nasional"
        desc="Statistik agregat sistem peringatan dini putus sekolah secara nasional. Telusuri wilayah untuk melihat detail hingga tingkat siswa."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <ScaleKpis />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title="Sebaran risiko nasional" desc="Kondisi populasi terkini.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <DonutSection />
          </Suspense>
        </Panel>
        <Panel title="Tren risiko 12 bulan" desc="Apakah situasi nasional membaik?">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <TrendSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Analisis faktor risiko nasional" desc="Mengapa siswa berisiko — jumlah siswa berisiko per faktor.">
        <Suspense fallback={<ChartSkeleton h={260} />}>
          <FactorSection />
        </Suspense>
      </Panel>

      <Panel title="Provinsi dengan risiko tinggi terbanyak" desc="Lima provinsi teratas yang perlu perhatian.">
        <Suspense fallback={<ChartSkeleton h={200} />}>
          <TopProvinceSection />
        </Suspense>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Intervensi per jenis (nasional)" desc="Komposisi tindak lanjut seluruh sekolah.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <JenisSection />
          </Suspense>
        </Panel>
        <Panel title="Tren intervensi 12 bulan" desc="Aktivitas tindak lanjut nasional.">
          <Suspense fallback={<ChartSkeleton h={200} />}>
            <IntervTrendSection />
          </Suspense>
        </Panel>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
              <MapPin className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
              Sebaran per wilayah
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Klik provinsi untuk menelusuri hingga sekolah, kelas, dan siswa.</p>
          </div>
        </div>
        <Suspense fallback={<TableSkeleton />}>
          <ProvinceSection />
        </Suspense>
      </section>

      <DeferredNotice />
    </div>
  );
}

function Panel({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="font-display text-base font-semibold text-[#0F172A]">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

async function ScaleKpis() {
  const [scale, kpis] = await Promise.all([platformScale(), getKpis({})]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Sekolah terpantau" value={scale.totalSekolah.toLocaleString("id-ID")} accent="brand" sub={`${scale.sekolahAktif} aktif · ${scale.totalProvinsi} provinsi`} />
      <StatTile label="Siswa dipantau" value={scale.totalSiswa.toLocaleString("id-ID")} accent="brand" sub={`di ${scale.totalWilayah} kabupaten`} />
      <StatTile label="Risiko tinggi (nasional)" value={kpis.merah.toLocaleString("id-ID")} accent="merah" sub={kpis.merahDeltaPct != null ? `${kpis.merahDeltaPct > 0 ? "+" : ""}${kpis.merahDeltaPct.toFixed(1)}% vs bln lalu` : "skor terkini"} />
      <StatTile label="Pengguna sistem" value={scale.totalUser.toLocaleString("id-ID")} accent="brand" sub="lintas peran" />
    </div>
  );
}

async function DonutSection() {
  const d = await riskDonut({});
  return (
    <RiskDonutChart
      data={[
        { name: "Risiko Tinggi", value: d.merah, key: "merah" },
        { name: "Waspada", value: d.kuning, key: "kuning" },
        { name: "Aman", value: d.hijau, key: "hijau" },
      ]}
    />
  );
}

async function TrendSection() {
  const trend = await monthlyRiskTrend({});
  return <RiskTrendLine data={trend.map((t) => ({ label: t.label, merah: t.merah, kuning: t.kuning, hijau: t.hijau }))} />;
}

async function FactorSection() {
  const factors = await riskFactorBreakdown({});
  if (factors.length === 0) return <p className="text-sm text-slate-500">Belum ada siswa berisiko untuk dianalisis.</p>;
  return <FactorBars data={factors.map((f) => ({ label: f.label, value: f.count }))} />;
}

async function JenisSection() {
  const j = await interventionByJenis({});
  if (j.length === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <CategoryBars data={j.map((x) => ({ label: x.label, value: x.count }))} seriesName="Intervensi" />;
}

async function IntervTrendSection() {
  const t = await interventionTrend({});
  if (t.reduce((a, x) => a + x.jumlah, 0) === 0) return <p className="text-sm text-slate-500">Belum ada intervensi tercatat.</p>;
  return <SingleAreaChart data={t.map((x) => ({ label: x.label, value: x.jumlah }))} name="Intervensi" />;
}

async function ProvinceSection() {
  const provinsi = await riskByProvinsi();
  return (
    <RegionTable
      rows={provinsi}
      firstColLabel="Provinsi"
      unitLabel="Sekolah"
      hrefFor={(r) => `/dashboard/wilayah/${encodeURIComponent(r.id)}`}
    />
  );
}

async function TopProvinceSection() {
  const provinsi = await riskByProvinsi();
  const top = provinsi.filter((p) => p.merah > 0).slice(0, 5);
  if (top.length === 0) return <p className="text-sm text-slate-500">Belum ada provinsi dengan risiko tinggi.</p>;
  return (
    <HorizontalBarChart
      seriesName="Risiko tinggi"
      barColor={CHART.merah}
      data={top.map((p) => ({ label: p.label, value: p.merah }))}
    />
  );
}

function DeferredNotice() {
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <div className="text-sm">
          <h2 className="font-display font-semibold text-slate-700">Peta geografis & funnel intervensi — belum tersedia</h2>
          <p className="mt-1 max-w-prose text-slate-500">
            Heatmap koordinat membutuhkan data lintang/bujur per wilayah; funnel & tingkat
            keberhasilan intervensi membutuhkan pencatatan tahap & hasil. Belum ada di model data,
            jadi tidak ditampilkan agar tidak menyajikan angka karangan. Penelusuran wilayah di atas
            adalah pengganti yang akurat untuk konsentrasi risiko geografis.
          </p>
        </div>
      </div>
    </section>
  );
}

/* skeletons */
function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
function ChartSkeleton({ h }: { h: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" style={{ height: h }} />;
}
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}

