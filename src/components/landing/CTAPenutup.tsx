"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export default function CTAPenutup() {
  return (
    <section id="cta" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-[#005D4C] px-8 py-14 sm:px-14 text-center">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-display font-bold text-3xl sm:text-[2.5rem] text-white tracking-tight leading-[1.15] mb-4">
                Jangan tunggu sampai mereka berhenti
              </h2>
              <p className="text-teal-100/85 text-base sm:text-lg leading-relaxed mb-8">
                Mulai jaga setiap anak tetap di sekolah hari ini. Lihat bagaimana
                JagaSekolah membantu wali kelas, sekolah, dan dinas bertindak lebih dini.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-[#005D4C] font-display font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-xl active:scale-[0.98] text-sm focus-visible:ring-4 focus-visible:ring-white/40"
                >
                  <span>Lihat Demo Dashboard</span>
                  <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-display font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:bg-white/10 text-sm"
                >
                  Masuk sebagai Sekolah / Dinas
                </Link>
              </div>
              <p className="text-teal-200/70 text-xs mt-6">
                Inisiatif teknologi untuk Indonesia Emas 2045 · Bebas biaya untuk sekolah
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
