import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskByKelasInSekolah } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { CategoryStackedBars } from "@/components/charts/recharts/CategoryStackedBars";
import { KelasRiskTable } from "@/components/dashboard/KelasRiskTable";

export const dynamic = "force-dynamic";

export default async function KelasPage() {
  const ctx = await requireDashboardContext("/dashboard/kelas");
  if (ctx.role !== "kepsek" || !ctx.sekolahId) redirect("/dashboard");
  const sekolahId = ctx.sekolahId;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Risiko per Kelas"
        desc="Sebaran risiko tiap kelas di sekolah Anda. Klik kelas untuk melihat daftar siswa."
      />

      <Panel title="Komposisi risiko antarkelas" desc="Perbandingan jumlah siswa per kategori.">
        <Suspense fallback={<ChartSkeleton h={260} />}>
          <KelasBars sekolahId={sekolahId} />
        </Suspense>
      </Panel>

      <Panel title="Daftar kelas" desc="Urutkan kolom; klik nama kelas untuk roster siswa.">
        <Suspense fallback={<ChartSkeleton h={200} />}>
          <KelasTable sekolahId={sekolahId} />
        </Suspense>
      </Panel>
    </div>
  );
}

async function KelasBars({ sekolahId }: { sekolahId: string }) {
  const rows = await riskByKelasInSekolah(sekolahId);
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada kelas.</p>;
  return <CategoryStackedBars data={rows.map((r) => ({ label: r.label, merah: r.merah, kuning: r.kuning, hijau: r.hijau }))} />;
}

async function KelasTable({ sekolahId }: { sekolahId: string }) {
  const rows = await riskByKelasInSekolah(sekolahId);
  return <KelasRiskTable rows={rows} sekolahId={sekolahId} />;
}
