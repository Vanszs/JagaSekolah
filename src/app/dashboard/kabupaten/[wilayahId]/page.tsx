import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { riskBySekolah } from "@/lib/analytics";
import { PageHeader } from "@/components/dashboard/ui";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { RegionTable } from "@/components/dashboard/RegionTable";

export const dynamic = "force-dynamic";

/** Drill-down: KABUPATEN (wilayahId) → daftar sekolah. */
export default async function KabupatenPage({ params }: { params: Promise<{ wilayahId: string }> }) {
  const { wilayahId } = await params;
  const ctx = await requireDashboardContext(`/dashboard/kabupaten/${wilayahId}`);
  requireRole(ctx, "superadmin", "dinas");

  const wilayah = await prisma.wilayah.findUnique({
    where: { id: wilayahId },
    select: { provinsi: true, kabupaten: true },
  });
  if (!wilayah) notFound();

  const sekolah = await riskBySekolah(wilayahId);
  await audit(ctx, "view_agregat", `kabupaten:${wilayahId}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Nasional", href: "/dashboard" },
          { label: wilayah.provinsi, href: `/dashboard/wilayah/${encodeURIComponent(wilayah.provinsi)}` },
          { label: wilayah.kabupaten },
        ]}
      />
      <PageHeader title={wilayah.kabupaten} desc={`${wilayah.provinsi} — sebaran risiko per sekolah. Klik untuk menelusuri kelas.`} />
      <RegionTable
        rows={sekolah}
        firstColLabel="Sekolah"
        hrefFor={(r) => `/dashboard/sekolah/${r.id}`}
      />
    </>
  );
}
