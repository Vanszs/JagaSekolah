import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, creatableRoles } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, EmptyState } from "@/components/dashboard/ui";
import { Pagination } from "@/components/dashboard/Pagination";
import CreateUserForm from "@/app/dashboard/admin/users/baru/CreateUserForm";
import { SchoolUsersTable } from "@/components/dashboard/SchoolUsersTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function KelolaUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireDashboardContext("/dashboard/kelola/users");
  requireRole(ctx, "kepsek");
  if (!ctx.sekolahId) redirect("/dashboard");
  const sekolahId = ctx.sekolahId;
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr, 10) || 1);

  const userWhere: Prisma.UserWhereInput = { sekolahId, role: { in: ["guru", "bk"] } };
  const [users, total, kelas, sekolah] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, nama: true, email: true, role: true, aktif: true, kelas: { select: { nama: true } } },
      orderBy: [{ role: "asc" }, { nama: "asc" }, { id: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.user.count({ where: userWhere }),
    prisma.kelas.findMany({ where: { sekolahId }, select: { id: true, nama: true, sekolahId: true }, orderBy: { nama: "asc" } }),
    prisma.sekolah.findMany({ where: { id: sekolahId }, select: { id: true, nama: true } }),
  ]);

  const roles = creatableRoles(ctx.role).map((r) => ({ value: r, label: roleLabel(r) }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Guru & BK"
        desc="Tambah dan tinjau akun wali kelas serta guru BK di sekolah Anda."
      />

      {total > 0 ? (
        <Panel title="Daftar pengguna sekolah" desc={`${total} akun guru & BK terdaftar.`}>
          <SchoolUsersTable
            rows={users.map((u) => ({
              id: u.id,
              nama: u.nama,
              email: u.email,
              role: u.role,
              kelas: u.kelas?.nama ?? "—",
              aktif: u.aktif,
            }))}
          />
          <Pagination page={page} totalPages={totalPages} basePath="/dashboard/kelola/users" />
        </Panel>
      ) : (
        <EmptyState title="Belum ada guru atau BK" desc="Tambahkan akun pengguna baru menggunakan formulir di bawah." />
      )}

      <Panel title="Tambah pengguna baru" desc="Buat akun guru (wali kelas) atau guru BK. Lingkup otomatis terkunci ke sekolah Anda.">
        <CreateUserForm
          actorRole={ctx.role}
          roles={roles}
          sekolah={sekolah}
          wilayah={[]}
          kelas={kelas}
          lockedSekolahId={sekolahId}
        />
      </Panel>
    </div>
  );
}
