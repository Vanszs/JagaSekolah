import { notFound } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { riskByKabupaten } from "@/lib/analytics";
import { PageHeader } from "@/components/dashboard/ui";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { RegionTable } from "@/components/dashboard/RegionTable";

export const dynamic = "force-dynamic";

/** Drill-down: PROVINSI → daftar kabupaten. param = nama provinsi (URL-encoded). */
export default async function ProvinsiPage({ params }: { params: Promise<{ provinsi: string }> }) {
  const { provinsi: raw } = await params;
  const provinsi = decodeURIComponent(raw);
  const ctx = await requireDashboardContext(`/dashboard/wilayah/${raw}`);
  requireRole(ctx, "superadmin", "dinas");

  const kabupaten = await riskByKabupaten(provinsi);
  if (kabupaten.length === 0) notFound();

  await audit(ctx, "view_agregat", `provinsi:${provinsi}`);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Nasional", href: "/dashboard" },
          { label: provinsi },
        ]}
      />
      <PageHeader title={provinsi} desc="Sebaran risiko per kabupaten/kota. Klik untuk menelusuri sekolah." />
      <RegionTable
        rows={kabupaten}
        firstColLabel="Kabupaten/Kota"
        unitLabel="Sekolah"
        hrefFor={(r) => `/dashboard/kabupaten/${r.id}`}
      />
    </>
  );
}
