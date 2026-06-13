import { redirect } from "next/navigation";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, creatableRoles } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { prisma } from "@/lib/db";
import { PageHeader, Panel } from "@/components/dashboard/ui";
import CreateUserForm from "@/app/dashboard/admin/users/baru/CreateUserForm";
import { SchoolUsersTable } from "@/components/dashboard/SchoolUsersTable";

export const dynamic = "force-dynamic";

export default async function KelolaUsersPage() {
  const ctx = await requireDashboardContext("/dashboard/kelola/users");
  requireRole(ctx, "kepsek");
  if (!ctx.sekolahId) redirect("/dashboard");
  const sekolahId = ctx.sekolahId;

  const [users, kelas, sekolah] = await Promise.all([
    prisma.user.findMany({
      where: { sekolahId, role: { in: ["guru", "bk"] } },
      select: { id: true, nama: true, email: true, role: true, aktif: true, kelas: { select: { nama: true } } },
      orderBy: [{ role: "asc" }, { nama: "asc" }],
    }),
    prisma.kelas.findMany({ where: { sekolahId }, select: { id: true, nama: true, sekolahId: true }, orderBy: { nama: "asc" } }),
    prisma.sekolah.findMany({ where: { id: sekolahId }, select: { id: true, nama: true } }),
  ]);

  const roles = creatableRoles(ctx.role).map((r) => ({ value: r, label: roleLabel(r) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Kelola Guru & BK"
        desc="Tambah dan tinjau akun wali kelas serta guru BK di sekolah Anda."
      />

      <Panel title="Daftar pengguna sekolah" desc={`${users.length} akun guru & BK terdaftar.`}>
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
      </Panel>

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
