import type { Role } from "@prisma/client";

/** Nama ikon lucide-react yang didukung sidebar (dipetakan di DashboardShell). */
export type NavIcon =
  | "home"
  | "alert"
  | "book"
  | "calendar"
  | "pie"
  | "handshake"
  | "dropout"
  | "building"
  | "users"
  | "sync"
  | "audit"
  | "shield"
  | "grid"
  | "consent"
  | "report"
  | "compare";

/** Grup section di sidebar (header non-clickable). undefined = tanpa grup (flat). */
export type NavSection = "analitik" | "platform" | "keamanan" | "sekolah" | "kelola";

export interface NavItem {
  href: string;
  /** Label default; bisa di-override per-role lewat labelByRole. */
  label: string;
  labelByRole?: Partial<Record<Role, string>>;
  icon: NavIcon;
  roles: Role[];
  /** Grup section (hanya untuk role yg butuh; ditentukan per-role lewat sectionByRole). */
  section?: NavSection;
  sectionByRole?: Partial<Record<Role, NavSection>>;
}

/** Label section yang ditampilkan sebagai header grup. */
export const SECTION_LABEL: Record<NavSection, string> = {
  analitik: "Analitik",
  platform: "Platform",
  keamanan: "Keamanan",
  sekolah: "Sekolah",
  kelola: "Kelola",
};

/**
 * Menu dashboard per-role. Urutan = urutan tampil di sidebar.
 * Setiap href HARUS punya halaman nyata (tanpa dead link).
 * Beranda (/dashboard) & beberapa rute (akademik/kehadiran/intervensi)
 * dipakai banyak role; kontennya scope-aware (lihat tiap page).
 */
export const NAV_ITEMS: NavItem[] = [
  // ── Beranda (semua role, label & konten role-aware) ──
  {
    href: "/dashboard",
    label: "Ringkasan",
    labelByRole: {
      superadmin: "Ikhtisar Nasional",
      dinas: "Ringkasan Wilayah",
      kepsek: "Dashboard Sekolah",
      guru: "Kelas Saya",
      bk: "Dashboard BK",
    },
    icon: "home",
    roles: ["superadmin", "dinas", "kepsek", "guru", "bk"],
    sectionByRole: { superadmin: "analitik", kepsek: "sekolah" },
  },

  // ── Analitik superadmin/dinas (agregat + drill-down) ──
  {
    href: "/dashboard/analisis-risiko",
    label: "Analisis Risiko",
    icon: "alert",
    roles: ["superadmin", "dinas"],
    sectionByRole: { superadmin: "analitik" },
  },
  {
    href: "/dashboard/perbandingan",
    label: "Perbandingan Sekolah",
    icon: "compare",
    roles: ["dinas"],
  },

  // ── Risiko per kelas (kepsek) ──
  {
    href: "/dashboard/kelas",
    label: "Risiko per Kelas",
    icon: "grid",
    roles: ["kepsek"],
    sectionByRole: { kepsek: "sekolah" },
  },

  // ── Daftar siswa (level sekolah) ──
  {
    href: "/dashboard/siswa",
    label: "Daftar Siswa",
    labelByRole: { guru: "Siswa Saya", bk: "Siswa Prioritas", dinas: "Telusur Siswa" },
    icon: "users",
    roles: ["dinas", "kepsek", "guru", "bk"],
    sectionByRole: { kepsek: "sekolah" },
  },

  // ── Akademik (semua role; scope-aware) ──
  {
    href: "/dashboard/akademik",
    label: "Analisis Akademik",
    labelByRole: { guru: "Akademik Kelas", kepsek: "Akademik", bk: "Akademik" },
    icon: "book",
    roles: ["superadmin", "dinas", "kepsek", "guru", "bk"],
    sectionByRole: { superadmin: "analitik", kepsek: "sekolah" },
  },

  // ── Kehadiran (semua role; scope-aware) ──
  {
    href: "/dashboard/kehadiran",
    label: "Kehadiran",
    labelByRole: {
      superadmin: "Kehadiran Nasional",
      dinas: "Kehadiran Wilayah",
      guru: "Kehadiran Kelas",
    },
    icon: "calendar",
    roles: ["superadmin", "dinas", "kepsek", "guru", "bk"],
    sectionByRole: { superadmin: "analitik", kepsek: "sekolah" },
  },

  // ── Demografi (superadmin + dinas) ──
  {
    href: "/dashboard/demografi",
    label: "Demografi & Pemerataan",
    icon: "pie",
    roles: ["superadmin", "dinas"],
    sectionByRole: { superadmin: "analitik" },
  },

  // ── Intervensi (semua role; scope-aware) ──
  {
    href: "/dashboard/intervensi",
    label: "Cakupan Intervensi",
    labelByRole: { kepsek: "Rekap Intervensi", guru: "Rekap Tindak Lanjut", bk: "Rekap Intervensi" },
    icon: "handshake",
    roles: ["superadmin", "dinas", "kepsek", "guru", "bk"],
    sectionByRole: { superadmin: "analitik", kepsek: "sekolah" },
  },

  // ── Putus sekolah (superadmin) ──
  {
    href: "/dashboard/putus-sekolah",
    label: "Putus Sekolah",
    icon: "dropout",
    roles: ["superadmin", "dinas"],
    sectionByRole: { superadmin: "analitik" },
  },

  // ── Laporan & ekspor (dinas) ──
  {
    href: "/dashboard/laporan",
    label: "Laporan & Ekspor",
    icon: "report",
    roles: ["dinas"],
  },

  // ── Kelola consent (bk) ──
  {
    href: "/dashboard/consent",
    label: "Kelola Consent",
    icon: "consent",
    roles: ["bk"],
  },

  // ── Kelola (kepsek) ──
  {
    href: "/dashboard/kelola/users",
    label: "Kelola Guru & BK",
    icon: "users",
    roles: ["kepsek"],
    sectionByRole: { kepsek: "kelola" },
  },
  {
    href: "/dashboard/kelola/kelas",
    label: "Kelola Kelas",
    icon: "grid",
    roles: ["kepsek"],
    sectionByRole: { kepsek: "kelola" },
  },

  // ── Platform (superadmin) ──
  {
    href: "/dashboard/admin/tenant",
    label: "Manajemen Tenant",
    icon: "building",
    roles: ["superadmin"],
    section: "platform",
  },
  {
    href: "/dashboard/admin/users",
    label: "Manajemen User",
    icon: "users",
    roles: ["superadmin"],
    section: "platform",
  },
  {
    href: "/dashboard/admin/sync",
    label: "Sinkronisasi & Impor",
    icon: "sync",
    roles: ["superadmin"],
    section: "platform",
  },

  // ── Keamanan (superadmin) ──
  {
    href: "/dashboard/admin/audit",
    label: "Audit Log",
    icon: "audit",
    roles: ["superadmin"],
    section: "keamanan",
  },
  {
    href: "/dashboard/admin/security",
    label: "Keamanan & Consent",
    icon: "shield",
    roles: ["superadmin"],
    section: "keamanan",
  },
];

/** Item nav (label & section ter-resolve) untuk sebuah role, sesuai urutan. */
export interface ResolvedNavItem {
  href: string;
  label: string;
  icon: NavIcon;
  section?: NavSection;
}

export function navForRole(role: Role): ResolvedNavItem[] {
  return NAV_ITEMS.reduce<ResolvedNavItem[]>((acc, i) => {
    if (i.roles.includes(role)) {
      acc.push({
        href: i.href,
        label: i.labelByRole?.[role] ?? i.label,
        icon: i.icon,
        section: i.sectionByRole?.[role] ?? i.section,
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
 * diakses peran tanpa entri nav (mis. drill-down sekolah/[id] oleh superadmin,
 * atau tombol kontekstual) — itu di-handle requireRole, bukan canAccess.
 */
export function canAccess(role: Role, href: string): boolean {
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
