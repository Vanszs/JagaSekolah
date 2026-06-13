import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { riskBySekolah, getKpis, attendanceSummary, interventionByJenis } from "@/lib/analytics";
import { PageHeader, StatTile, Panel } from "@/components/dashboard/ui";
import { ExportButton, type ExportRow } from "@/components/dashboard/ExportButton";

export const dynamic = "force-dynamic";

export default async function LaporanPage() {
  const ctx = await requireDashboardContext("/dashboard/laporan");
  if (ctx.role !== "dinas" || !ctx.wilayahId) redirect("/dashboard");

  const scope = { sekolah: { wilayahId: ctx.wilayahId } };
  const [wilayah, sekolahRows, kpis, hadir, intervensi] = await Promise.all([
    prisma.wilayah.findUnique({ where: { id: ctx.wilayahId }, select: { provinsi: true, kabupaten: true } }),
    riskBySekolah(ctx.wilayahId),
    getKpis(scope),
    attendanceSummary(scope),
    interventionByJenis(scope),
  ]);

  const totalIntervensi = intervensi.reduce((a, j) => a + j.count, 0);
  const wilayahLabel = wilayah ? `${wilayah.kabupaten}, ${wilayah.provinsi}` : "wilayah Anda";

  // Baris ekspor: rekap per sekolah (agregat, tanpa identitas siswa).
  const exportRows: ExportRow[] = sekolahRows.map((s) => ({
    Sekolah: s.label,
    NPSN: s.sub?.replace("NPSN ", "") ?? "",
    Siswa: s.total,
    RisikoTinggi: s.merah,
    Waspada: s.kuning,
    Aman: s.hijau,
    PersenTinggi: s.total > 0 ? Math.round((s.merah / s.total) * 100) : 0,
  }));

  const tanggal = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan & Ekspor"
        desc={`Rekap agregat ${wilayahLabel} untuk pelaporan ke tingkat provinsi/pusat. Semua data anonim — tanpa identitas siswa.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Sekolah" value={sekolahRows.length.toLocaleString("id-ID")} accent="brand" sub="dalam wilayah" />
        <StatTile label="Risiko tinggi" value={kpis.merah.toLocaleString("id-ID")} accent="merah" sub={`${(kpis.merah + kpis.kuning).toLocaleString("id-ID")} berisiko`} />
        <StatTile label="Tingkat kehadiran" value={`${hadir.pctHadir}%`} accent={hadir.pctHadir >= 90 ? "hijau" : "kuning"} sub="30 hari" />
        <StatTile label="Total intervensi" value={totalIntervensi.toLocaleString("id-ID")} accent="brand" sub="tercatat" />
      </div>

      <Panel title="Ekspor rekap sekolah (CSV)" desc="Unduh tabel agregat per sekolah untuk diolah lebih lanjut atau dilampirkan ke laporan.">
        <ExportButton rows={exportRows} filename={`rekap-sekolah-${tanggal}.csv`} />
      </Panel>

      <Panel title="Ringkasan komposisi risiko" desc="Snapshot terkini wilayah.">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="text-sm text-slate-500">Risiko tinggi</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-red-600">{kpis.merah.toLocaleString("id-ID")}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="text-sm text-slate-500">Waspada</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-600">{kpis.kuning.toLocaleString("id-ID")}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <dt className="text-sm text-slate-500">Aman</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">{kpis.hijau.toLocaleString("id-ID")}</dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
