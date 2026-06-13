import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { siswaScope, agregatScope } from "@/lib/rbac";
import NationalOverview from "@/components/dashboard/NationalOverview";
import DinasDashboard from "@/components/dashboard/DinasDashboard";
import SchoolDashboard from "@/components/dashboard/SchoolDashboard";
import GuruBKDashboard from "@/components/dashboard/GuruBKDashboard";
import PlatformHealth from "@/components/dashboard/PlatformHealth";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const ctx = await requireDashboardContext("/dashboard");

  // ── Superadmin: AGREGAT nasional saja (tanpa PII siswa) + kesehatan platform.
  //    Siswa hanya dicapai lewat drill-down wilayah → sekolah → kelas → siswa.
  if (ctx.role === "superadmin") {
    return (
      <div className="space-y-10">
        <NationalOverview />
        <PlatformHealth />
      </div>
    );
  }

  // ── Dinas: analitik wilayah (anonim, agregat) ──
  if (ctx.role === "dinas") {
    const scope = agregatScope(ctx); // { wilayahId } (dinas selalu punya wilayah)
    const wilayah = scope.wilayahId
      ? await prisma.wilayah.findUnique({ where: { id: scope.wilayahId }, select: { provinsi: true, kabupaten: true } })
      : null;
    const where: Prisma.SiswaWhereInput = scope.wilayahId ? { sekolah: { wilayahId: scope.wilayahId } } : {};
    return (
      <DinasDashboard
        regionLabel={wilayah ? `${wilayah.kabupaten}, ${wilayah.provinsi}` : "wilayah Anda"}
        wilayahId={scope.wilayahId ?? ""}
        scope={where}
      />
    );
  }

  // ── Kepala Sekolah: dashboard sekolah (chart-rich) ──
  if (ctx.role === "kepsek") {
    const where = siswaScope(ctx) as Prisma.SiswaWhereInput; // { sekolahId }
    return <SchoolDashboard scope={where} />;
  }

  // ── Guru / BK: dashboard fokus aksi + grafik kecil sesuai peran ──
  const where = siswaScope(ctx) as Prisma.SiswaWhereInput; // guru {sekolahId,kelasId}, bk {sekolahId}
  return <GuruBKDashboard role={ctx.role} scope={where} />;
}
