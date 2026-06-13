import { Users, UserPlus, Info } from "lucide-react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, creatableRoles, canManageUsers } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { audit } from "@/lib/audit";
import { StatTile, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const ROLE_RING: Record<Role, string> = {
  superadmin: "bg-[#005D4C]/10 text-[#005D4C] ring-[#005D4C]/20",
  dinas: "bg-sky-50 text-sky-700 ring-sky-600/20",
  kepsek: "bg-violet-50 text-violet-700 ring-violet-600/20",
  guru: "bg-slate-100 text-slate-700 ring-slate-400/30",
  bk: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

/**
 * Manajemen User (Superadmin) — semua akun lintas tenant: peran, lingkup,
 * dan status keaktifan. Aksi reset/assign role dilakukan via API admin yang
 * sudah ada (POST /api/admin/users) — halaman ini fokus visibilitas.
 */
export default async function UsersPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/users");
  requireRole(ctx, "superadmin");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      email: true,
      role: true,
      aktif: true,
      sekolah: { select: { nama: true } },
      wilayah: { select: { kabupaten: true } },
    },
    orderBy: [{ role: "asc" }, { nama: "asc" }],
  });

  await audit(ctx, "view_users", "users:all");

  const aktif = users.filter((u) => u.aktif).length;
  const byRole = (r: Role) => users.filter((u) => u.role === r).length;

  // Siapa yang boleh ditambah oleh aktor saat ini (sumber: rbac.ts).
  const dapatDibuat = creatableRoles(ctx.role);
  const bolehTambah = canManageUsers(ctx.role);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
            Manajemen User
          </h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">
            Seluruh akun pengguna lintas sekolah dan dinas, beserta peran dan lingkup aksesnya.
          </p>
        </div>
        {bolehTambah && (
          <Link
            href="/dashboard/admin/users/baru"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#005D4C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tambah Pengguna
          </Link>
        )}
      </div>

      {/* Siapa berhak menambah pengguna — transparansi RBAC */}
      <div className="mb-6 flex gap-3 rounded-xl border border-[#005D4C]/20 bg-[#005D4C]/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#005D4C]" aria-hidden="true" />
        <div className="text-sm text-slate-700">
          <p className="font-medium text-slate-900">Hak penambahan akun</p>
          <p className="mt-0.5 text-slate-600">
            {dapatDibuat.length > 0 ? (
              <>
                Sebagai <span className="font-medium">{roleLabel(ctx.role)}</span>, Anda dapat
                menambah:{" "}
                <span className="font-medium text-[#005D4C]">
                  {dapatDibuat.map((r) => roleLabel(r)).join(", ")}
                </span>
                .
              </>
            ) : (
              <>Peran Anda tidak memiliki hak menambah pengguna.</>
            )}{" "}
            Akun <span className="font-medium">guru</span> & <span className="font-medium">BK</span>{" "}
            ditambahkan oleh Super Admin atau Kepala Sekolah di sekolah terkait. Tidak ada peran yang
            dapat membuat akun Super Admin.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total pengguna" value={users.length} accent="brand" />
        <StatTile label="Aktif" value={aktif} accent="hijau" />
        <StatTile label="Dinas" value={byRole("dinas")} accent="brand" />
        <StatTile label="Sekolah (kepsek/guru/bk)" value={byRole("kepsek") + byRole("guru") + byRole("bk")} accent="brand" />
      </div>

      {users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="Belum ada pengguna"
            desc="Tambahkan akun melalui pendaftaran admin."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Nama</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Peran</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Lingkup</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">{u.nama}</span>
                      <span className="block text-xs text-slate-400">{u.email}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_RING[u.role]}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.sekolah?.nama ?? u.wilayah?.kabupaten ?? <span className="text-slate-400">Nasional</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${u.aktif ? "bg-emerald-500" : "bg-slate-400"}`}
                          aria-hidden="true"
                        />
                        {u.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
