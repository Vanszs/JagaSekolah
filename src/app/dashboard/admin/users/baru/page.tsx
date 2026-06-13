import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole, creatableRoles } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import CreateUserForm from "./CreateUserForm";

export const dynamic = "force-dynamic";

/**
 * Halaman "Tambah Pengguna" (Superadmin & Kepsek).
 * Memuat opsi tenant secara paralel, lalu menyerahkan ke form klien.
 * Pilihan peran DIBATASI oleh creatableRoles (sumber kebenaran rbac.ts).
 */
export default async function NewUserPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/users/baru");
  requireRole(ctx, "superadmin", "kepsek");

  const roles = creatableRoles(ctx.role).map((r) => ({ value: r, label: roleLabel(r) }));

  // Superadmin perlu daftar sekolah & wilayah; kepsek terkunci ke sekolahnya.
  const [sekolah, wilayah, kelas] = await Promise.all([
    ctx.role === "superadmin"
      ? prisma.sekolah.findMany({ select: { id: true, nama: true }, orderBy: { nama: "asc" } })
      : prisma.sekolah.findMany({
          where: { id: ctx.sekolahId ?? "__none__" },
          select: { id: true, nama: true },
        }),
    ctx.role === "superadmin"
      ? prisma.wilayah.findMany({
          select: { id: true, provinsi: true, kabupaten: true },
          orderBy: [{ provinsi: "asc" }, { kabupaten: "asc" }],
        })
      : Promise.resolve([]),
    prisma.kelas.findMany({
      where: ctx.role === "kepsek" ? { sekolahId: ctx.sekolahId ?? "__none__" } : {},
      select: { id: true, nama: true, sekolahId: true },
      orderBy: { nama: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/admin/users"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Manajemen User
      </Link>

      <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">
        Tambah Pengguna
      </h1>
      <p className="mt-1 max-w-prose text-sm text-slate-600">
        Buat akun baru. Pilihan peran dan lingkup mengikuti hak akses{" "}
        <span className="font-medium">{roleLabel(ctx.role)}</span> Anda.
      </p>

      <div className="mt-6">
        <CreateUserForm
          actorRole={ctx.role}
          roles={roles}
          sekolah={sekolah}
          wilayah={wilayah.map((w) => ({ id: w.id, label: `${w.kabupaten}, ${w.provinsi}` }))}
          kelas={kelas}
          lockedSekolahId={ctx.role === "kepsek" ? ctx.sekolahId : null}
        />
      </div>
    </div>
  );
}
