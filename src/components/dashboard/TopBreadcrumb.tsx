"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import type { Role } from "@prisma/client";

/** Label per-rute statik (label akhir breadcrumb). Home disesuaikan per-role. */
const LABELS: Record<string, string> = {
  "/dashboard/analisis-risiko": "Analisis Risiko",
  "/dashboard/akademik": "Analisis Akademik",
  "/dashboard/kehadiran": "Kehadiran",
  "/dashboard/demografi": "Demografi & Pemerataan",
  "/dashboard/intervensi": "Cakupan Intervensi",
  "/dashboard/putus-sekolah": "Putus Sekolah",
  "/dashboard/perbandingan": "Perbandingan Sekolah",
  "/dashboard/laporan": "Laporan & Ekspor",
  "/dashboard/consent": "Kelola Consent",
  "/dashboard/kelas": "Risiko per Kelas",
  "/dashboard/siswa": "Daftar Siswa",
  "/dashboard/kelola/users": "Kelola Guru & BK",
  "/dashboard/kelola/kelas": "Kelola Kelas",
  "/dashboard/admin/tenant": "Manajemen Tenant",
  "/dashboard/admin/users": "Manajemen User",
  "/dashboard/admin/users/baru": "Tambah Pengguna",
  "/dashboard/admin/sync": "Sinkronisasi & Impor",
  "/dashboard/admin/audit": "Audit Log",
  "/dashboard/admin/security": "Keamanan & Consent",
};

const HOME_LABEL: Record<Role, string> = {
  superadmin: "Ikhtisar Nasional",
  dinas: "Ringkasan Wilayah",
  kepsek: "Dashboard Sekolah",
  guru: "Kelas Saya",
  bk: "Dashboard BK",
};

/**
 * Rute drill-down dinamis (wilayah/kabupaten/sekolah/siswa) sudah merender
 * breadcrumb-nya sendiri DENGAN NAMA ASLI (provinsi/sekolah/siswa). Untuk rute
 * ini, TopBreadcrumb tidak menampilkan apa-apa agar tidak ganda.
 */
const DYNAMIC_PREFIXES = ["/dashboard/wilayah", "/dashboard/kabupaten", "/dashboard/sekolah", "/dashboard/siswa/"];

/** Breadcrumb global di atas main content, dibangun dari pathname. */
export function TopBreadcrumb({ role }: { role: Role }) {
  const pathname = usePathname();

  // Drill-down dinamis: biarkan halaman merender breadcrumb kaya-nama sendiri.
  if (DYNAMIC_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const home = { label: HOME_LABEL[role], href: "/dashboard" };

  // Beranda → cukup tampilkan label beranda sebagai item aktif.
  if (pathname === "/dashboard") {
    return <Bar items={[{ label: home.label }]} />;
  }

  const leaf = LABELS[pathname];
  // Rute /dashboard/kelola/* punya induk "Kelola" implisit; tampilkan langsung leaf.
  const items = [home, { label: leaf ?? prettifySegment(pathname) }];
  return <Bar items={items} />;
}

function prettifySegment(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean).at(-1) ?? "";
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Bar({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li className="flex items-center gap-1">
          <Home className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        </li>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
              {c.href && !last ? (
                <Link href={c.href} className="text-slate-500 transition-colors hover:text-[#005D4C]">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-slate-900" : "text-slate-500"} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
