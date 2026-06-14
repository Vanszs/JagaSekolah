import { redirect } from "next/navigation";
import { RefreshCw, Upload, Info } from "lucide-react";
import { requireDashboardContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PageHeader, StatTile, Panel } from "@/components/dashboard/ui";
import { RecomputeButton } from "@/components/dashboard/RecomputeButton";
import { SyncLogTable } from "@/components/dashboard/SyncLogTable";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/sync");
  if (ctx.role !== "superadmin") redirect("/dashboard");

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [logs, sekolah, total30, gagal30] = await Promise.all([
    prisma.syncLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.sekolah.findMany({ select: { id: true, nama: true } }),
    prisma.syncLog.count({ where: { createdAt: { gte: since } } }),
    prisma.syncLog.count({ where: { createdAt: { gte: since }, status: { not: "success" } } }),
  ]);
  const namaSekolah = new Map(sekolah.map((s) => [s.id, s.nama]));
  const rows = logs.map((l) => ({
    id: l.id,
    waktu: l.createdAt.toISOString(),
    sekolah: l.sekolahId ? (namaSekolah.get(l.sekolahId) ?? l.sekolahId) : "—",
    status: l.status,
    idempotencyKey: l.idempotencyKey,
    detail: l.detailJson ?? "",
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sinkronisasi & Impor"
        desc="Pantau sinkronisasi data dari sekolah, picu penghitungan ulang risiko, dan kelola impor data."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Sinkronisasi (30 hari)" value={total30.toLocaleString("id-ID")} accent="brand" sub="total transaksi" />
        <StatTile label="Gagal (30 hari)" value={gagal30.toLocaleString("id-ID")} accent={gagal30 > 0 ? "merah" : "hijau"} sub="perlu ditinjau" />
        <StatTile label="Sekolah terhubung" value={sekolah.length.toLocaleString("id-ID")} accent="brand" sub="tenant aktif" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Hitung ulang risiko" desc="Skoring ulang seluruh siswa (consent granted) berdasarkan data terbaru. Dijalankan terserialisasi.">
          <RecomputeButton />
        </Panel>
        <Panel title="Impor data" desc="Unggah Dapodik/absensi/nilai (CSV/Excel).">
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4">
            <Upload className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-sm text-slate-500">
              Impor massal tersedia melalui endpoint <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">POST /api/import</code> (CSV/Excel
              ber-skema Dapodik). Antarmuka unggah berkas akan ditambahkan di sini.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Riwayat sinkronisasi" desc="100 transaksi sinkronisasi terbaru dari sekolah.">
        <SyncLogTable rows={rows} />
      </Panel>

      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            Sinkronisasi bersifat idempoten (setiap transaksi punya kunci unik), sehingga pengiriman ulang
            tidak menggandakan data.
          </p>
        </div>
      </section>
    </div>
  );
}
