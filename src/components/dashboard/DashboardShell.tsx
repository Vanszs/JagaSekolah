"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Users,
  BarChart3,
  ShieldCheck,
  School,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  users: Users,
  chart: BarChart3,
  shield: ShieldCheck,
  school: School,
};

interface Props {
  nav: NavItem[];
  user: { nama: string; roleLabel: string; sekolah?: string | null };
  children: React.ReactNode;
}

export default function DashboardShell({ nav, user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav aria-label="Menu utama" className="flex flex-1 flex-col gap-1 px-3 py-4">
      {nav.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
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
        );
      })}
    </nav>
  );

  const SidebarInner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex h-16 items-center gap-0.5 border-b border-slate-100 px-5">
        <span className="font-display text-lg font-bold text-[#0F172A]">Jaga</span>
        <span className="font-display text-lg font-bold text-[#005D4C]">Sekolah</span>
      </div>
      <NavList onNavigate={onNavigate} />
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
          onClick={logout}
          disabled={loggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
        >
          <LogOut className="h-[18px] w-[18px] text-slate-400" aria-hidden="true" />
          {loggingOut ? "Keluar…" : "Keluar"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh bg-[#F8FAFC]">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarInner />
      </aside>

      {/* Drawer — mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-4 rounded-md p-2 text-slate-400 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarInner onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Buka menu"
            className="-ml-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
            <span className="font-mono uppercase tracking-wide">{user.roleLabel}</span>
            {user.sekolah && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="truncate">{user.sekolah}</span>
              </>
            )}
          </div>
          <span
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#005D4C]/10 font-display text-xs font-bold text-[#005D4C] lg:hidden"
            aria-hidden="true"
          >
            {initials}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
