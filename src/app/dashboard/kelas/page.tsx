import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { riskByKelasInSekolah } from "@/lib/analytics";
import { PageHeader, Panel, ChartSkeleton, EmptyState } from "@/components/dashboard/ui";
import { CategoryStackedBars } from "@/components/charts/recharts/CategoryStackedBars";
import { KelasRiskTable } from "@/components/dashboard/KelasRiskTable";

export const dynamic = "force-dynamic";

export default async function KelasPage() {
  const ctx = await requireDashboardContext("/dashboard/kelas");
  if (ctx.role !== "kepsek" || !ctx.sekolahId) redirect("/dashboard");
  const sekolahId = ctx.sekolahId;
  const rows = await riskByKelasInSekolah(sekolahId);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Risiko per Kelas"
        desc="Sebaran risiko tiap kelas di sekolah Anda. Klik kelas untuk melihat daftar siswa."
      />

      {rows.length > 0 ? (
        <>
          <Panel title="Komposisi risiko antarkelas" desc="Perbandingan jumlah siswa per kategori.">
            <CategoryStackedBars data={rows.map((r) => ({ label: r.label, merah: r.merah, kuning: r.kuning, hijau: r.hijau }))} />
          </Panel>

          <Panel title="Daftar kelas" desc="Urutkan kolom; klik nama kelas untuk roster siswa.">
            <KelasRiskTable rows={rows} sekolahId={sekolahId} />
          </Panel>
        </>
      ) : (
        <EmptyState title="Belum ada data kelas" desc="Kelas dan datanya akan muncul setelah impor dari Dapodik." />
      )}
    </div>
  );
}
