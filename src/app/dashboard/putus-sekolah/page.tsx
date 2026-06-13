import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireDashboardContext } from "@/lib/session";
import { analyticsScope } from "@/lib/dashboardScope";
import { dropoutTotal, dropoutTrend, dropoutByProvinsi } from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { CHART } from "@/components/charts/recharts/theme";

export const dynamic = "force-dynamic";

export default async function PutusSekolahPage() {
  const ctx = await requireDashboardContext("/dashboard/putus-sekolah");
  if (ctx.role !== "superadmin" && ctx.role !== "dinas") redirect("/dashboard");
  const scope = analyticsScope(ctx);
  const national = ctx.role === "superadmin" || (!ctx.wilayahId && !ctx.provinsi);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitoring Putus Sekolah"
        desc="Pemantauan agregat siswa yang tercatat sudah tidak aktif/putus sekolah — sesuai cakupan Anda. Fokus pada skala & sebaran untuk evaluasi kebijakan."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <DropoutKpis scope={scope} national={national} />
      </Suspense>

      <Panel title="Tren putus sekolah 12 bulan" desc="Berdasarkan tanggal nonaktif tercatat.">
        <Suspense fallback={<ChartSkeleton h={220} />}>
          <TrendSection scope={scope} />
        </Suspense>
      </Panel>

      {national && (
        <Panel title="Putus sekolah per provinsi" desc="Sebaran wilayah — prioritas intervensi kebijakan.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <ProvinceSection />
          </Suspense>
        </Panel>
      )}
    </div>
  );
}

async function DropoutKpis({ scope, national }: { scope: Prisma.SiswaWhereInput; national: boolean }) {
  const [total, byProv, trend] = await Promise.all([dropoutTotal(scope), national ? dropoutByProvinsi() : Promise.resolve([]), dropoutTrend(scope)]);
  const provTeratas = byProv[0];
  const bulanIni = trend.at(-1)?.value ?? 0;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatTile label="Total putus sekolah" value={total.toLocaleString("id-ID")} accent="merah" sub="akumulatif tercatat" />
      <StatTile label="Bulan ini" value={bulanIni.toLocaleString("id-ID")} accent={bulanIni > 0 ? "kuning" : "hijau"} sub="kasus baru tercatat" />
      {national ? (
        <StatTile label="Provinsi tertinggi" value={provTeratas?.provinsi ?? "—"} accent="merah" sub={provTeratas ? `${provTeratas.count} kasus` : "belum ada"} />
      ) : (
        <StatTile label="Cakupan" value="Wilayah Anda" accent="brand" sub="agregat ter-scope" />
      )}
    </div>
  );
}

async function TrendSection({ scope }: { scope: Prisma.SiswaWhereInput }) {
  const rows = await dropoutTrend(scope);
  if (rows.every((r) => r.value === 0)) return <p className="text-sm text-slate-500">Belum ada kasus putus sekolah tercatat dalam 12 bulan.</p>;
  return <SingleAreaChart name="Putus sekolah" data={rows} />;
}

async function ProvinceSection() {
  const rows = await dropoutByProvinsi();
  if (rows.every((r) => r.count === 0)) return <p className="text-sm text-slate-500">Belum ada kasus putus sekolah tercatat.</p>;
  return <HorizontalBarChart seriesName="Putus sekolah" barColor={CHART.merah} data={rows.map((r) => ({ label: r.provinsi, value: r.count }))} />;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
