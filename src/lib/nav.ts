import type { Role } from "@prisma/client";

/** Nama ikon lucide-react yang didukung sidebar (dipetakan di DashboardShell). */
export type NavIcon =
  | "home"
  | "users"
  | "shield"
  | "building"
  | "map"
  | "audit";

export interface NavItem {
  href: string;
  /** Label default; bisa di-override per-role lewat labelByRole. */
  label: string;
  /** Override label untuk role tertentu (mis. "Dashboard Nasional" vs "Dashboard Kelas"). */
  labelByRole?: Partial<Record<Role, string>>;
  icon: NavIcon;
  /** Role yang boleh melihat/mengunjungi item ini. */
  roles: Role[];
}

/**
 * Menu dashboard per-role. Urutan = urutan tampil di sidebar.
 * Setiap href HARUS punya halaman nyata (tanpa dead link).
 * Beranda (/dashboard) dipakai semua role tapi kontennya role-aware
 * (lihat src/app/dashboard/page.tsx).
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Ringkasan",
    labelByRole: {
      superadmin: "Dashboard Nasional",
      dinas: "Dashboard Wilayah",
      kepsek: "Dashboard Sekolah",
      guru: "Dashboard Kelas",
      bk: "Dashboard BK",
    },
    icon: "home",
    roles: ["superadmin", "dinas", "kepsek", "guru", "bk"],
  },
  // ── Sekolah-level: data per-siswa ──
  {
    href: "/dashboard/siswa",
    label: "Daftar Siswa",
    labelByRole: { guru: "Siswa Saya", bk: "Daftar Kasus" },
    icon: "users",
    roles: ["kepsek", "guru", "bk"],
  },
  // ── Wilayah / nasional: agregat anonim ──
  {
    href: "/dashboard/agregat",
    label: "Agregat Wilayah",
    labelByRole: { superadmin: "Monitoring Nasional", dinas: "Peta Risiko" },
    icon: "map",
    roles: ["superadmin", "dinas"],
  },
  // ── Superadmin: pengelolaan platform ──
  {
    href: "/dashboard/admin/tenant",
    label: "Manajemen Tenant",
    icon: "building",
    roles: ["superadmin"],
  },
  {
    href: "/dashboard/admin/users",
    label: "Manajemen User",
    icon: "users",
    roles: ["superadmin"],
  },
  {
    href: "/dashboard/admin/audit",
    label: "Audit Log",
    icon: "audit",
    roles: ["superadmin"],
  },
  {
    href: "/dashboard/admin/security",
    label: "Security Center",
    icon: "shield",
    roles: ["superadmin"],
  },
];

/** Item nav untuk sebuah role, dengan label sudah di-resolve. */
export function navForRole(role: Role): Array<Omit<NavItem, "labelByRole">> {
  // Satu lintasan: saring berdasarkan role + bentuk item dgn label ter-resolve.
  return NAV_ITEMS.reduce<Array<Omit<NavItem, "labelByRole">>>((acc, i) => {
    if (i.roles.includes(role)) {
      acc.push({
        href: i.href,
        label: i.labelByRole?.[role] ?? i.label,
        icon: i.icon,
        roles: i.roles,
      });
    }
    return acc;
  }, []);
}

/**
 * Apakah `role` punya ENTRI NAV untuk `href` (visibilitas menu), longest-prefix
 * match agar sub-rute mewarisi induknya.
 *
 * PENTING: ini BUKAN gerbang otorisasi. Otorisasi sebenarnya ada di
 * `requireRole()` tiap halaman/route (server-side). Beberapa rute sengaja
 * dapat diakses peran yang tak punya entri nav — mis. kepsek boleh membuka
 * `/dashboard/admin/users/baru` (lihat requireRole di halaman itu) walau tak
 * ada link nav-nya; itu diakses dari tombol kontekstual, bukan sidebar. Jadi
 * `canAccess` mengembalikan false untuk kasus tsb dan itu BENAR untuk tujuan
 * "tampilkan link sidebar?", bukan untuk "boleh akses?".
 */
export function canAccess(role: Role, href: string): boolean {
  // longest-prefix match agar /dashboard/siswa/[id] mewarisi /dashboard/siswa.
  // Cari item dengan href terpanjang yang cocok — tanpa menyalin/menyortir array.
  let match: NavItem | undefined;
  for (const i of NAV_ITEMS) {
    const hit = href === i.href || href.startsWith(i.href + "/");
    if (hit && (!match || i.href.length > match.href.length)) match = i;
  }
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
