import { Suspense } from "react";
import { UserPlus, Info } from "lucide-react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, creatableRoles, canManageUsers } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { audit } from "@/lib/audit";
import { usersByRole } from "@/lib/analytics";
import { StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { RiskDonutChart } from "@/components/charts/recharts/RiskDonutChart";
import { UsersTable, type UserRow } from "@/components/dashboard/UsersTable";

export const dynamic = "force-dynamic";

/**
 * Manajemen User (Superadmin) — seluruh akun lintas tenant: distribusi peran,
 * status keaktifan, lingkup. Penambahan via /dashboard/admin/users/baru.
 */
export default async function UsersPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/users");
  requireRole(ctx, "superadmin");
  await audit(ctx, "view_users", "users:all");

  const dapatDibuat = creatableRoles(ctx.role);
  const bolehTambah = canManageUsers(ctx.role);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">Manajemen User</h1>
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

      <Suspense fallback={<KpiSkeleton />}>
        <UsersKpis />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel title="Distribusi pengguna per peran" desc="Komposisi akun di seluruh platform.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <RoleBarSection />
          </Suspense>
        </Panel>
        <Panel title="Status keaktifan" desc="Akun aktif vs nonaktif.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <ActiveDonutSection />
          </Suspense>
        </Panel>
      </div>

      {/* Transparansi RBAC */}
      <div className="flex gap-3 rounded-xl border border-[#005D4C]/20 bg-[#005D4C]/[0.03] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#005D4C]" aria-hidden="true" />
        <div className="text-sm text-slate-700">
          <p className="font-medium text-slate-900">Hak penambahan akun</p>
          <p className="mt-0.5 text-slate-600">
            {dapatDibuat.length > 0 ? (
              <>
                Sebagai <span className="font-medium">{roleLabel(ctx.role)}</span>, Anda dapat menambah:{" "}
                <span className="font-medium text-[#005D4C]">{dapatDibuat.map((r) => roleLabel(r)).join(", ")}</span>.
              </>
            ) : (
              <>Peran Anda tidak memiliki hak menambah pengguna.</>
            )}{" "}
            Akun <span className="font-medium">guru</span> & <span className="font-medium">BK</span> ditambahkan oleh Super Admin atau Kepala Sekolah. Tidak ada peran yang dapat membuat akun Super Admin.
          </p>
        </div>
      </div>

      <Panel title="Daftar pengguna" desc="Urutkan kolom mana pun untuk meninjau akun.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <UsersTableSection />
        </Suspense>
      </Panel>
    </div>
  );
}

async function UsersKpis() {
  const rows = await usersByRole();
  const total = rows.reduce((a, r) => a + r.total, 0);
  const aktif = rows.reduce((a, r) => a + r.aktif, 0);
  const get = (r: Role) => rows.find((x) => x.role === r)?.total ?? 0;
  const sekolahUsers = get("kepsek") + get("guru") + get("bk");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total pengguna" value={total.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="Aktif" value={aktif.toLocaleString("id-ID")} accent="hijau" sub={`${total - aktif} nonaktif`} />
      <StatTile label="Dinas" value={get("dinas").toLocaleString("id-ID")} accent="brand" sub="pengawas wilayah" />
      <StatTile label="Tingkat sekolah" value={sekolahUsers.toLocaleString("id-ID")} accent="brand" sub="kepsek + guru + BK" />
    </div>
  );
}

async function RoleBarSection() {
  const rows = await usersByRole();
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada pengguna.</p>;
  const sorted = rows.toSorted((a, b) => b.total - a.total);
  return <HorizontalBarChart seriesName="Pengguna" data={sorted.map((r) => ({ label: roleLabel(r.role as Role), value: r.total }))} />;
}

async function ActiveDonutSection() {
  const rows = await usersByRole();
  const total = rows.reduce((a, r) => a + r.total, 0);
  const aktif = rows.reduce((a, r) => a + r.aktif, 0);
  if (total === 0) return <p className="text-sm text-slate-500">Belum ada pengguna.</p>;
  return (
    <RiskDonutChart
      data={[
        { name: "Aktif", value: aktif, key: "hijau" },
        { name: "Nonaktif", value: total - aktif, key: "merah" },
      ]}
    />
  );
}

async function UsersTableSection() {
  const users = await prisma.user.findMany({
    select: {
      id: true, nama: true, email: true, role: true, aktif: true,
      sekolah: { select: { nama: true } },
      wilayah: { select: { kabupaten: true } },
    },
    orderBy: [{ role: "asc" }, { nama: "asc" }],
  });
  const rows: UserRow[] = users.map((u) => ({
    id: u.id,
    nama: u.nama,
    email: u.email,
    role: u.role,
    roleLabel: roleLabel(u.role),
    lingkup: u.sekolah?.nama ?? u.wilayah?.kabupaten ?? "Nasional",
    aktif: u.aktif,
  }));
  return <UsersTable rows={rows} />;
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
