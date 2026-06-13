"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import StatsCard from "./StatsCard";

const heroBgImage = "/images/hero-bg.jpg";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="beranda"
      className="relative flex flex-col justify-between bg-[#F8FAFC] overflow-hidden min-h-svh lg:h-svh pt-24 pb-3 lg:pt-20"
    >
      <div className="absolute inset-y-0 right-0 w-full lg:w-[58%] h-full z-0 pointer-events-none select-none bg-[#F3F0EE]">
        <Image
          src={heroBgImage}
          alt="Tiga anak sekolah dasar berseragam berjalan menuju sekolah di pedesaan pegunungan Indonesia"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#F8FAFC] to-transparent hidden lg:block" />
        <div className="absolute inset-0 bg-[#F8FAFC]/55 lg:bg-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#F8FAFC] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-20 w-full flex-1 flex flex-col justify-center py-2 min-h-0">
        <div className="lg:max-w-[46%] flex flex-col items-start text-left">
          <m.div
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 mb-6"
          >
            <span className="h-px w-6 bg-[#005D4C]/40" aria-hidden="true" />
            <span className="text-[11px] font-semibold text-[#005D4C] tracking-wide uppercase font-mono">
              Sistem Peringatan Dini Putus Sekolah
            </span>
          </m.div>

          <m.h1
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-extrabold text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] xl:text-[4.5rem] leading-[1.02] text-[#0F172A] tracking-[-0.02em]"
          >
            Setiap Anak Berhak
            <br />
            <span className="text-[#005D4C]">Tetap Sekolah</span>
          </m.h1>

          <m.div
            initial={reduce ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="origin-left w-12 h-[3px] bg-[#005D4C] rounded-full my-6"
          />

          <m.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-slate-600 text-lg leading-relaxed max-w-lg mb-8"
          >
            Deteksi risiko lebih awal dari data yang ada, intervensi lebih cepat, masa depan mereka masih bisa kita jaga.
          </m.p>

          <m.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-row items-center gap-6"
          >
            <Link
              href="/dashboard"
              className="group flex items-center justify-center gap-2 bg-[#005D4C] hover:bg-[#004D40] text-white font-display font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(0,93,76,0.15)] hover:shadow-[0_4px_20px_rgba(0,93,76,0.25)] active:scale-[0.98] text-sm"
            >
              <span>Lihat Demo</span>
              <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href="#cara-kerja"
              className="group flex items-center justify-center gap-1.5 text-[#005D4C] hover:text-[#004D40] font-display font-semibold transition-colors text-sm py-2"
            >
              <span className="border-b-2 border-[#005D4C] group-hover:border-[#004D40] transition-colors pb-0.5">Pelajari Cara Kerja</span>
              <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </m.div>
        </div>
      </div>

      <div className="relative z-30 w-full shrink-0">
        <StatsCard />
      </div>
    </section>
  );
}
