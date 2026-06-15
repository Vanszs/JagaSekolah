import { redirect } from "next/navigation";
import { Info } from "lucide-react";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, EmptyState } from "@/components/dashboard/ui";
import { KelolaKelasTable } from "@/components/dashboard/KelolaKelasTable";

export const dynamic = "force-dynamic";

export default async function KelolaKelasPage() {
  const ctx = await requireDashboardContext("/dashboard/kelola/kelas");
  requireRole(ctx, "kepsek");
  if (!ctx.sekolahId) redirect("/dashboard");

  const kelas = await prisma.kelas.findMany({
    where: { sekolahId: ctx.sekolahId },
    select: {
      id: true,
      nama: true,
      _count: { select: { siswa: true } },
      wali: { select: { nama: true } },
    },
    orderBy: { nama: "asc" },
  });

  const rows = kelas.map((k) => ({
    id: k.id,
    nama: k.nama,
    jumlahSiswa: k._count.siswa,
    wali: k.wali.map((w) => w.nama).join(", ") || "Belum ada wali",
    adaWali: k.wali.length > 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Kelas"
        desc="Daftar kelas di sekolah Anda beserta jumlah siswa dan wali kelas. Klik kelas untuk melihat roster."
      />

      {rows.length > 0 ? (
        <Panel title="Daftar kelas" desc={`${rows.length} kelas terdaftar.`}>
          <KelolaKelasTable rows={rows} sekolahId={ctx.sekolahId} />
        </Panel>
      ) : (
        <EmptyState title="Belum ada kelas" desc="Kelas akan muncul setelah data diimpor dari Dapodik." />
      )}

      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-5">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            Penambahan kelas baru dan penugasan wali kelas mengikuti data Dapodik melalui proses impor.
            Untuk menambah wali kelas, buat akun guru di <span className="font-medium">Kelola Guru &amp; BK</span> dan tetapkan kelasnya.
          </p>
        </div>
      </section>
    </div>
  );
}
