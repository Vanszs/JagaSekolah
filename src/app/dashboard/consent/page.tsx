import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, siswaScope } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import type { Prisma, ConsentStatus } from "@prisma/client";
import { PageHeader, StatTile, Panel } from "@/components/dashboard/ui";
import { ConsentStudentsTable } from "@/components/dashboard/ConsentStudentsTable";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const ctx = await requireDashboardContext("/dashboard/consent");
  requireRole(ctx, "bk", "kepsek");
  const scope = siswaScope(ctx) as Prisma.SiswaWhereInput;

  const [grouped, siswa] = await Promise.all([
    prisma.siswa.groupBy({ by: ["consentStatus"], where: scope, _count: true }),
    prisma.siswa.findMany({
      where: scope,
      select: { id: true, nama: true, nisn: true, consentStatus: true, kelas: { select: { nama: true } } },
      orderBy: [{ consentStatus: "asc" }, { nama: "asc" }],
    }),
  ]);
  const cnt = (s: ConsentStatus) => grouped.find((g) => g.consentStatus === s)?._count ?? 0;
  const granted = cnt("granted");
  const pending = cnt("pending");
  const revoked = cnt("revoked");
  const total = granted + pending + revoked;
  const pctGranted = total > 0 ? Math.round((granted / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Consent"
        desc="Persetujuan orang tua/wali untuk pemrosesan data anak (UU PDP). Hanya siswa dengan persetujuan yang diproses untuk penilaian risiko."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Disetujui" value={granted.toLocaleString("id-ID")} accent="hijau" sub={`${pctGranted}% dari total`} />
        <StatTile label="Menunggu" value={pending.toLocaleString("id-ID")} accent="kuning" sub="belum ada persetujuan" />
        <StatTile label="Dicabut" value={revoked.toLocaleString("id-ID")} accent="merah" sub="pemrosesan dihentikan" />
        <StatTile label="Total siswa" value={total.toLocaleString("id-ID")} accent="brand" sub="dalam lingkup Anda" />
      </div>

      <Panel title="Status persetujuan per siswa" desc="Klik nama untuk mencatat/memperbarui persetujuan di halaman detail.">
        <ConsentStudentsTable
          rows={siswa.map((s) => ({ id: s.id, nama: s.nama, nisn: s.nisn, kelas: s.kelas.nama, status: s.consentStatus }))}
        />
      </Panel>
    </div>
  );
}
