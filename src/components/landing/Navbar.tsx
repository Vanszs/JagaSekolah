"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  activeSection?: string;
  setActiveSection?: (sec: string) => void;
}

const navItems = [
  { id: "beranda", label: "Beranda" },
  { id: "mengapa", label: "Mengapa" },
  { id: "cara-kerja", label: "Cara Kerja" },
  { id: "dashboard", label: "Dashboard" },
  { id: "keamanan", label: "Keamanan" },
  { id: "faq", label: "FAQ" },
];

// Scroll-past-threshold sebagai external store — tanpa render ekstra & SSR-safe.
function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
function useScrolled(threshold = 16) {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > threshold, // client snapshot
    () => false, // server snapshot (transparan saat SSR)
  );
}

export default function Navbar({ activeSection: activeProp, setActiveSection: setActiveProp }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeInternal, setActiveInternal] = useState("beranda");
  const scrolled = useScrolled();
  const activeSection = activeProp ?? activeInternal;
  const setActiveSection = setActiveProp ?? setActiveInternal;

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileMenuOpen
          ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-b border-slate-200/70"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <a href="#beranda" onClick={() => setActiveSection("beranda")} className="flex items-center space-x-3">
              <div className="flex items-center justify-center cursor-pointer">
                <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18C6 24 11 27.5 16 27.5C21 27.5 26 24 26 18C26 13.5 23.5 10.5 21.5 9.5" stroke="#115E59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.5 9.5C8.5 10.5 6 13.5 6 18" stroke="#115E59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11.5" cy="14" r="2" fill="#2563EB" />
                  <path d="M9 19.5C9 17.5 10.2 17 11.5 17C12.8 17 14 17.5 14 19.5" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="16" cy="11.5" r="2" fill="#DC2626" />
                  <path d="M13.5 17C13.5 15 14.7 14.5 16 14.5C17.3 14.5 18.5 15 18.5 17" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="20.5" cy="14" r="2" fill="#0D9488" />
                  <path d="M18 19.5C18 17.5 19.2 17 20.5 17C21.8 17 23 17.5 23 19.5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12.5 23C13.5 24 18.5 24 19.5 23" stroke="#115E59" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="flex items-center space-x-0.5">
                <span className="font-display font-bold text-[22px] text-[#0F172A] tracking-tight">Jaga</span>
                <span className="font-display font-bold text-[22px] text-[#005D4C] tracking-tight">Sekolah</span>
              </div>
            </a>
            <div className="hidden lg:flex items-center h-9 pl-4 border-l border-slate-200">
              <div className="flex flex-col text-left">
                <span className="text-[10px] leading-[14px] text-slate-500 font-bold uppercase tracking-wider font-mono">Sistem Peringatan Dini</span>
                <span className="text-[10px] leading-[14px] text-slate-500 font-bold uppercase tracking-wider font-mono">Putus Sekolah</span>
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`relative font-sans text-sm font-bold transition-colors duration-150 ${isActive ? "text-[#005D4C]" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {item.label}
                  {isActive && <span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#005D4C] rounded-full" />}
                </a>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-3.5">
            <Link href="/login" className="px-5 py-2 hover:bg-slate-50 border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)] bg-white text-slate-800 text-sm font-bold rounded-lg transition-colors duration-150">
              Masuk
            </Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-[#005D4C] hover:bg-[#004D40] text-white font-bold text-sm rounded-lg transition-colors duration-150 shadow-[0_4px_12px_rgba(0,93,76,0.12)] hover:shadow-[0_4px_16px_rgba(0,93,76,0.2)] active:scale-[0.98]">
              Lihat Demo
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center">
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2" aria-label="Menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-2 pt-3 pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block px-4 py-3 rounded-lg text-base font-bold transition-colors ${isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2 px-4 pb-2">
              <Link href="/login" className="w-full py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">Masuk</Link>
              <Link href="/dashboard" className="w-full py-3 text-center bg-teal-900 text-white font-bold text-sm rounded-lg hover:bg-teal-950 rounded-lg transition-colors">Lihat Demo</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
