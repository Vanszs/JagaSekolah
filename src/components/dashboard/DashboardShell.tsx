"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  ShieldCheck,
  School,
  Building2,
  ScrollText,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  PieChart,
  HeartHandshake,
  UserMinus,
  RefreshCw,
  LayoutGrid,
  FileCheck2,
  FileText,
  GitCompare,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { NavItem, ResolvedNavItem, NavSection } from "@/lib/nav";
import { SECTION_LABEL } from "@/lib/nav";
import type { Role } from "@prisma/client";
import { TopBreadcrumb } from "@/components/dashboard/TopBreadcrumb";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  alert: AlertTriangle,
  book: BookOpen,
  calendar: CalendarDays,
  pie: PieChart,
  handshake: HeartHandshake,
  dropout: UserMinus,
  building: Building2,
  users: Users,
  sync: RefreshCw,
  audit: ScrollText,
  shield: ShieldCheck,
  grid: LayoutGrid,
  consent: FileCheck2,
  report: FileText,
  compare: GitCompare,
};

interface Props {
  nav: ResolvedNavItem[];
  user: { nama: string; role: Role; roleLabel: string; sekolah?: string | null };
  children: React.ReactNode;
}

/** Daftar tautan navigasi dgn header section opsional — komponen modul-scope. */
function NavList({
  nav,
  isActive,
  onNavigate,
}: {
  nav: ResolvedNavItem[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  let lastSection: NavSection | undefined | "__none" = "__none";
  return (
    <nav aria-label="Menu utama" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        const showHeader = item.section && item.section !== lastSection;
        lastSection = item.section;
        return (
          <div key={item.href}>
            {showHeader && (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400 first:pt-0">
                {SECTION_LABEL[item.section!]}
              </p>
            )}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#005D4C]/10 text-[#005D4C]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#005D4C]" : "text-slate-400"}`} aria-hidden="true" />
              {item.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/** Isi sidebar (logo + nav + profil + logout) — komponen modul-scope. */
function SidebarInner({
  nav,
  user,
  initials,
  isActive,
  loggingOut,
  onLogout,
  onNavigate,
}: {
  nav: ResolvedNavItem[];
  user: Props["user"];
  initials: string;
  isActive: (href: string) => boolean;
  loggingOut: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-0.5 border-b border-slate-100 px-5">
        <span className="font-display text-lg font-bold text-[#0F172A]">Jaga</span>
        <span className="font-display text-lg font-bold text-[#005D4C]">Sekolah</span>
      </div>
      <NavList nav={nav} isActive={isActive} onNavigate={onNavigate} />
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#005D4C]/10 font-display text-sm font-bold text-[#005D4C]"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{user.nama}</p>
            <p className="truncate text-xs text-slate-500">{user.roleLabel}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />
          {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </>
  );
}

export default function DashboardShell({ nav, user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  const openDrawer = () => drawerRef.current?.showModal();
  const closeDrawer = () => drawerRef.current?.close();

  const initials = user.nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex h-dvh bg-[#F8FAFC]">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarInner
          nav={nav}
          user={user}
          initials={initials}
          isActive={isActive}
          loggingOut={loggingOut}
          onLogout={logout}
        />
      </aside>

      {/* Drawer — mobile (native <dialog>: focus-trap + Escape + backdrop gratis) */}
      <dialog
        ref={drawerRef}
        aria-label="Menu navigasi"
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-white p-0 shadow-xl backdrop:bg-slate-900/40 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Tutup menu"
            className="absolute right-3 top-4 rounded-md p-2 text-slate-400 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <SidebarInner
            nav={nav}
            user={user}
            initials={initials}
            isActive={isActive}
            loggingOut={loggingOut}
            onLogout={logout}
            onNavigate={() => drawerRef.current?.close()}
          />
        </div>
      </dialog>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-10">
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Buka menu"
            className="-ml-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Konteks tenant (sekolah) bila ada — peran sudah tampil di profil sidebar */}
          {user.sekolah ? (
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <School className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate font-medium text-slate-700">{user.sekolah}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-slate-400">JagaSekolah</span>
          )}

          <span
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#005D4C]/10 font-display text-xs font-bold text-[#005D4C] lg:hidden"
            aria-hidden="true"
          >
            {initials}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <TopBreadcrumb role={user.role} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
