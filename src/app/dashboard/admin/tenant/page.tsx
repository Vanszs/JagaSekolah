import { Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { PageHeader, StatTile, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

/**
 * Manajemen Tenant (Superadmin) — daftar sekolah, wilayah, jumlah siswa/pengguna,
 * dan status keaktifan tenant. "Aktif" = punya pengguna terdaftar (bisa login).
 */
export default async function TenantPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/tenant");
  requireRole(ctx, "superadmin");

  const sekolah = await prisma.sekolah.findMany({
    select: {
      id: true,
      npsn: true,
      nama: true,
      wilayah: { select: { provinsi: true, kabupaten: true } },
      _count: { select: { siswa: true, users: true } },
    },
    orderBy: { nama: "asc" },
  });

  await audit(ctx, "view_tenant", "tenant:all");

  const aktif = sekolah.filter((s) => s._count.users > 0).length;
  const totalSiswa = sekolah.reduce((a, s) => a + s._count.siswa, 0);

  return (
    <>
      <PageHeader
        title="Manajemen Tenant"
        desc="Sekolah yang terdaftar di platform beserta status keaktifan dan cakupan datanya."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total sekolah" value={sekolah.length} accent="brand" />
        <StatTile label="Tenant aktif" value={aktif} accent="hijau" sub="punya pengguna" />
        <StatTile label="Siswa tercakup" value={totalSiswa.toLocaleString("id-ID")} accent="brand" />
      </div>

      {sekolah.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
            title="Belum ada sekolah"
            desc="Daftarkan sekolah pertama untuk mengaktifkan pemantauan."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Sekolah</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Wilayah</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Siswa</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Pengguna</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sekolah.map((s) => {
                  const isAktif = s._count.users > 0;
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900">{s.nama}</span>
                        <span className="ml-2 font-mono text-xs text-slate-400">NPSN {s.npsn}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {s.wilayah.kabupaten}, {s.wilayah.provinsi}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                        {s._count.siswa.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">{s._count.users}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            isAktif
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-slate-50 text-slate-500 ring-slate-400/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isAktif ? "bg-emerald-500" : "bg-slate-400"}`}
                            aria-hidden="true"
                          />
                          {isAktif ? "Aktif" : "Belum aktif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
