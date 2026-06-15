"use client";

import { useRef, useState, useSyncExternalStore } from "react";
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
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { NavItem, ResolvedNavItem, NavSection } from "@/lib/nav";
import { SECTION_LABEL } from "@/lib/nav";
import type { Role } from "@prisma/client";
import { TopBreadcrumb } from "@/components/dashboard/TopBreadcrumb";

const MDMQ = "(min-width: 768px) and (max-width: 1023px)";

function subscribeMd(cb: () => void) {
  const mql = window.matchMedia(MDMQ);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getMdSnapshot() {
  return window.matchMedia(MDMQ).matches;
}

function getMdServerSnapshot() {
  return false;
}

function useIsMd() {
  return useSyncExternalStore(subscribeMd, getMdSnapshot, getMdServerSnapshot);
}

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

const SIDEBAR_KEY = "jaga-sidebar-collapsed";

interface Props {
  nav: ResolvedNavItem[];
  user: { nama: string; role: Role; roleLabel: string; sekolah?: string | null };
  children: React.ReactNode;
}

/** Nav list — expanded or icon-rail collapsed. */
function NavList({
  nav,
  isActive,
  collapsed,
  onNavigate,
}: {
  nav: ResolvedNavItem[];
  isActive: (href: string) => boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  let lastSection: NavSection | undefined | "__none" = "__none";
  return (
    <nav
      aria-label="Menu utama"
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3"
    >
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        const showHeader = !collapsed && item.section && item.section !== lastSection;
        lastSection = item.section;
        return (
          <div key={item.href}>
            {showHeader && (
              <p className="px-2 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400 first:pt-1">
                {SECTION_LABEL[item.section!]}
              </p>
            )}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-1 ${
                active
                  ? "bg-[#F0FDFA] text-[#0F172A]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-[#005D4C]" : "text-slate-400"}`}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/** Sidebar inner — brand + nav + user footer. */
function SidebarInner({
  nav,
  user,
  initials,
  isActive,
  loggingOut,
  collapsed,
  onLogout,
  onNavigate,
  onToggle,
}: {
  nav: ResolvedNavItem[];
  user: Props["user"];
  initials: string;
  isActive: (href: string) => boolean;
  loggingOut: boolean;
  collapsed: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
  onToggle?: () => void;
}) {
  return (
    <>
      {/* Brand + collapse toggle */}
      <div
        className={`flex h-14 shrink-0 items-center border-b border-slate-200 px-3 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-1 rounded-md px-1"
          >
            <span className="font-display text-[15px] font-bold text-[#0F172A]">Jaga</span>
            <span className="font-display text-[15px] font-bold text-[#005D4C]">Sekolah</span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C]"
          >
            <ShieldCheck className="h-5 w-5 text-[#005D4C]" aria-label="JagaSekolah" />
          </Link>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className={`rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-1 ${collapsed ? "absolute right-[-14px] top-5 z-10 border border-slate-200 bg-white shadow-sm" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <NavList
        nav={nav}
        isActive={isActive}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />

      {/* User footer */}
      <div className="shrink-0 border-t border-slate-200 p-2">
        {collapsed ? (
          <div
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-full bg-[#005D4C]/10 font-display text-xs font-bold text-[#005D4C]"
            title={user.nama}
            aria-hidden="true"
          >
            {initials}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005D4C]/10 font-display text-xs font-bold text-[#005D4C]"
                aria-hidden="true"
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">{user.nama}</p>
                <p className="truncate text-[11px] text-slate-500">{user.roleLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {loggingOut ? "Keluar…" : "Keluar"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function DashboardShell({ nav, user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const isMd = useIsMd();
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem(SIDEBAR_KEY) === "1"
  );
  const drawerRef = useRef<HTMLDialogElement>(null);
  const railCollapsed = isMd || collapsed;
  const isAdminRoute = pathname?.startsWith("/dashboard/admin") ?? false;

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      localStorage.setItem(SIDEBAR_KEY, !v ? "1" : "0");
      return !v;
    });
  };

  const openDrawer = () => drawerRef.current?.showModal();

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
      {/* Sidebar — md: icon-rail always, lg: full/collapsible */}
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-slate-200 bg-[#F8FAFC] md:flex
          lg:transition-[width] lg:duration-200 lg:ease-out lg:motion-reduce:transition-none
          ${railCollapsed ? "w-[60px]" : "w-56"}`}
      >
        <SidebarInner
          nav={nav}
          user={user}
          initials={initials}
          isActive={isActive}
          loggingOut={loggingOut}
          collapsed={railCollapsed}
          onLogout={logout}
          onToggle={isMd ? undefined : toggleCollapsed}
        />
      </aside>

      {/* Drawer — mobile */}
      <dialog
        ref={drawerRef}
        aria-label="Menu navigasi"
        className="m-0 h-dvh max-h-none w-64 max-w-[85vw] bg-[#F8FAFC] p-0 shadow-xl backdrop:bg-slate-900/40 md:hidden"
      >
        <div className="flex h-full flex-col">
          <button
            type="button"
            onClick={() => drawerRef.current?.close()}
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
            collapsed={false}
            onLogout={logout}
            onNavigate={() => drawerRef.current?.close()}
          />
        </div>
      </dialog>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar — h-14, white, border-b (dashboards.md §3) */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Buka menu"
            className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Breadcrumb — di kiri topbar (semua rute) */}
          <TopBreadcrumb role={user.role} variant="topbar" />

          {/* Sekolah / tenant context (kepsek/guru/bk, non-admin) */}
          {!isAdminRoute && user.sekolah ? (
            <div className="hidden items-center gap-2 text-[13px] text-slate-500 md:flex">
              <School className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate font-medium text-slate-700 max-w-[200px]">{user.sekolah}</span>
            </div>
          ) : null}

          <div className="flex-1" />

          {/* Search pill trigger (dashboards.md §3 pt.3) */}
          <button
            type="button"
            aria-label="Cari (⌘K)"
            className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 sm:inline-flex"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Cari…
            <kbd className="ml-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Notification bell — dot merah (dashboards.md) */}
          <button
            type="button"
            aria-label="Notifikasi (ada yang baru)"
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
          </button>

          {/* Avatar — solid teal (dashboards.md: 30×30 circle) */}
          <span
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#005D4C] font-display text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:py-[22px]">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
