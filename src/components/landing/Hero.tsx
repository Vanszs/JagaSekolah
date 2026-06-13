"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import StatsCard from "./StatsCard";

const heroBgImage = "/images/hero-bg-2.png";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="beranda"
      className="relative flex min-h-svh flex-col overflow-hidden bg-[#F3F0EE]"
    >
      {/* Full-bleed artwork — spans edge to edge, behind navbar */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src={heroBgImage}
          alt="Tiga anak sekolah dasar berseragam berjalan menuju sekolah di pedesaan pegunungan Indonesia, dengan peta Nusantara di langit"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] lg:object-center"
        />
        {/* Atmospheric readability washes — subtle, no hard vertical split */}
        {/* Top: lifts navbar + headline legibility (sky is already light) */}
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#F8FAFC]/85 via-[#F8FAFC]/35 to-transparent" />
        {/* Left: gentle wash behind the headline — landscape stays visible through it */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC]/75 via-[#F8FAFC]/15 to-transparent lg:via-[#F8FAFC]/5 lg:to-transparent" />
        {/* Bottom: calm ground for the floating stats panel */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/55 to-transparent" />
      </div>

      {/* Headline overlaid on the artwork (upper-left sky) */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pt-32 sm:pt-36 lg:px-12 lg:pt-44">
        <div className="max-w-xl lg:max-w-2xl">
          <m.div
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2.5"
          >
            <span className="h-px w-6 bg-[#005D4C]/50" aria-hidden="true" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[#005D4C]">
              Sistem Peringatan Dini Putus Sekolah
            </span>
          </m.div>

          <m.h1
            initial={reduce ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.02em] text-[#0F172A] sm:text-[3.5rem] lg:text-[4.25rem] xl:text-[4.75rem]"
          >
            Setiap Anak Berhak
            <br />
            <span className="text-[#005D4C]">Tetap Sekolah</span>
          </m.h1>

          <m.div
            initial={reduce ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="my-6 h-[3px] w-12 origin-left rounded-full bg-[#005D4C]"
          />

          <m.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-8 max-w-lg text-lg leading-relaxed text-slate-700"
          >
            Deteksi risiko lebih awal dari data yang ada, intervensi lebih cepat, masa depan mereka
            masih bisa kita jaga.
          </m.p>

          <m.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-row items-center gap-6"
          >
            <Link
              href="/dashboard"
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#005D4C] px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,93,76,0.22)] transition-all duration-200 hover:bg-[#004D40] hover:shadow-[0_6px_24px_rgba(0,93,76,0.3)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
            >
              <span>Lihat Demo</span>
              <ArrowRight size={16} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <a
              href="#cara-kerja"
              className="group flex items-center justify-center gap-1.5 py-2 font-display text-sm font-semibold text-[#005D4C] transition-colors hover:text-[#004D40] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 rounded"
            >
              <span className="border-b-2 border-[#005D4C] pb-0.5 transition-colors group-hover:border-[#004D40]">
                Pelajari Cara Kerja
              </span>
              <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </m.div>
        </div>
      </div>

      {/* Floating stats panel over the bottom of the artwork */}
      <div className="relative z-10 w-full shrink-0 pb-6 pt-10">
        <StatsCard />
      </div>
    </section>
  );
}
