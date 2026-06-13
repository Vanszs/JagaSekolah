import type { Role } from "@prisma/client";

export interface NavItem {
  href: string;
  label: string;
  /** lucide-react icon name (rendered client-side) */
  icon: "home" | "users" | "chart" | "shield" | "school";
  /** roles allowed to see/visit this item */
  roles: Role[];
}

/** Urutan & hak akses tiap menu dashboard per-role. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Ringkasan", icon: "home", roles: ["superadmin", "dinas", "kepsek", "guru", "bk"] },
  { href: "/dashboard/siswa", label: "Daftar Siswa", icon: "users", roles: ["superadmin", "kepsek", "guru", "bk"] },
  { href: "/dashboard/agregat", label: "Agregat Wilayah", icon: "chart", roles: ["superadmin", "dinas"] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}

export function canAccess(role: Role, href: string): boolean {
  // longest-prefix match so /dashboard/siswa/[id] inherits /dashboard/siswa
  const match = [...NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => href === i.href || href.startsWith(i.href + "/"));
  return match ? match.roles.includes(role) : false;
}

const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Super Admin",
  dinas: "Dinas Pendidikan",
  kepsek: "Kepala Sekolah",
  guru: "Wali Kelas",
  bk: "Guru BK",
};

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}
