import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import {
  getKpis,
  riskFactorBreakdown,
  riskScoreDistribution,
  riskDeltaByProvinsi,
  factorTrendMonthly,
  riskSourceBreakdown,
  riskByProvinsi,
  dropoutTotal,
} from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { FactorBars } from "@/components/charts/recharts/FactorBars";
import { Histogram } from "@/components/charts/recharts/Histogram";
import { HeatmapTable } from "@/components/charts/recharts/HeatmapTable";
import { MultiLineChart, LINE_PALETTE } from "@/components/charts/recharts/MultiLineChart";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { ProvinceRiskTable } from "@/components/dashboard/ProvinceRiskTable";

export const dynamic = "force-dynamic";

const sumberLabel = (s: string) => (s === "rule" ? "Berbasis aturan" : s === "ml" ? "Machine learning" : s);

export default async function AnalisisRisikoPage() {
  const ctx = await requireDashboardContext("/dashboard/analisis-risiko");
  if (ctx.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analisis Risiko Nasional"
        desc="Pendalaman risiko putus sekolah secara agregat: faktor dominan, sebaran skor, perubahan antarbulan, dan tren faktor. Tanpa identitas siswa."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <RiskKpis />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Faktor risiko dominan" desc="Jumlah siswa berisiko per faktor (merah + kuning).">
          <Suspense fallback={<ChartSkeleton h={260} />}>
            <FactorSection />
          </Suspense>
        </Panel>
        <Panel title="Distribusi skor risiko" desc="Sebaran skor siswa terkini (0–100).">
          <Suspense fallback={<ChartSkeleton h={240} />}>
            <ScoreSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Tren faktor risiko (6 bulan)" desc="Pergerakan tiap faktor dari waktu ke waktu.">
        <Suspense fallback={<ChartSkeleton h={280} />}>
          <FactorTrendSection />
        </Suspense>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel title="Perubahan risiko tinggi antarbulan" desc="Δ jumlah siswa merah per provinsi (bulan ini vs bulan lalu). Merah = memburuk.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <DeltaSection />
          </Suspense>
        </Panel>
        <Panel title="Sumber penilaian" desc="Komposisi metode scoring.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <SourceSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Perbandingan antarprovinsi" desc="Klik provinsi untuk menelusuri hingga sekolah, kelas, dan siswa.">
        <Suspense fallback={<ChartSkeleton h={200} />}>
          <ProvinceSection />
        </Suspense>
      </Panel>
    </div>
  );
}

async function RiskKpis() {
  const [kpis, dropout] = await Promise.all([getKpis({}), dropoutTotal({})]);
  const total = kpis.merah + kpis.kuning + kpis.hijau;
  const pctMerah = total > 0 ? Math.round((kpis.merah / total) * 100) : 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Risiko tinggi" value={kpis.merah.toLocaleString("id-ID")} accent="merah" sub={kpis.merahDeltaPct != null ? `${kpis.merahDeltaPct > 0 ? "+" : ""}${kpis.merahDeltaPct.toFixed(1)}% vs bln lalu` : `${pctMerah}% populasi`} />
      <StatTile label="Waspada" value={kpis.kuning.toLocaleString("id-ID")} accent="kuning" sub="perlu pemantauan" />
      <StatTile label="Aman" value={kpis.hijau.toLocaleString("id-ID")} accent="hijau" sub={`dari ${total.toLocaleString("id-ID")} siswa`} />
      <StatTile label="Sudah putus sekolah" value={dropout.toLocaleString("id-ID")} accent="merah" sub="akumulatif tercatat" />
    </div>
  );
}

async function FactorSection() {
  const factors = await riskFactorBreakdown({});
  if (factors.length === 0) return <p className="text-sm text-slate-500">Belum ada siswa berisiko untuk dianalisis.</p>;
  return <FactorBars data={factors.map((f) => ({ label: f.label, value: f.count }))} />;
}

async function ScoreSection() {
  const bins = await riskScoreDistribution({});
  return <Histogram data={bins} seriesName="Siswa" xLabel="Skor risiko" />;
}

async function FactorTrendSection() {
  const { points, factors } = await factorTrendMonthly({});
  if (factors.length === 0) return <p className="text-sm text-slate-500">Belum ada data faktor untuk ditampilkan.</p>;
  const series = factors.map((f, i) => ({ key: f, name: f, color: LINE_PALETTE[i % LINE_PALETTE.length]! }));
  return <MultiLineChart data={points} series={series} />;
}

async function DeltaSection() {
  const rows = await riskDeltaByProvinsi();
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada data perubahan.</p>;
  return (
    <HeatmapTable
      mode="delta"
      rowHeader="Provinsi"
      columns={["Bln lalu", "Bln ini", "Δ"]}
      rows={rows.map((r) => ({ label: r.provinsi, values: [r.bulanLalu, r.bulanIni, r.delta] }))}
      caption="Perubahan jumlah siswa risiko tinggi per provinsi"
    />
  );
}

async function SourceSection() {
  const rows = await riskSourceBreakdown({});
  const total = rows.reduce((a, r) => a + r.count, 0);
  if (total === 0) return <p className="text-sm text-slate-500">Belum ada penilaian.</p>;
  return (
    <RiskDonutChart
      data={rows.map((r) => ({
        name: sumberLabel(r.sumber),
        value: r.count,
        key: r.sumber === "ml" ? "kuning" : "hijau",
      }))}
    />
  );
}

async function ProvinceSection() {
  const provinsi = await riskByProvinsi();
  return <ProvinceRiskTable rows={provinsi} />;
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
