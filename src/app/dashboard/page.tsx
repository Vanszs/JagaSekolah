import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { siswaScope, dinasLevel } from "@/lib/rbac";
import { analyticsScope } from "@/lib/dashboardScope";
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

  // ── Dinas: analitik agregat sesuai jenjang (pusat/provinsi/kabupaten) ──
  if (ctx.role === "dinas") {
    const where = analyticsScope(ctx) as Prisma.SiswaWhereInput;
    const level = dinasLevel(ctx);
    let regionLabel: string;
    if (level === "kabupaten" && ctx.wilayahId) {
      const w = await prisma.wilayah.findUnique({ where: { id: ctx.wilayahId }, select: { provinsi: true, kabupaten: true } });
      regionLabel = w ? `${w.kabupaten}, ${w.provinsi}` : "wilayah Anda";
    } else if (level === "provinsi") {
      regionLabel = `Provinsi ${ctx.provinsi}`;
    } else {
      regionLabel = "Nasional";
    }
    return (
      <DinasDashboard
        regionLabel={regionLabel}
        wilayahId={ctx.wilayahId ?? ""}
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
