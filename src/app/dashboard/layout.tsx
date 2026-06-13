import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { navForRole, roleLabel } from "@/lib/nav";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: "Dashboard — JagaSekolah" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/dashboard");

  const { role } = session.user;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nama: true, sekolah: { select: { nama: true } } },
  });

  return (
    <DashboardShell
      nav={navForRole(role)}
      user={{
        nama: user?.nama ?? "Pengguna",
        roleLabel: roleLabel(role),
        sekolah: user?.sekolah?.nama ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
