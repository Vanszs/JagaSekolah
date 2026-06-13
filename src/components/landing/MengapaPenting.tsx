"use client";

import { TrendingDown, Users, AlertTriangle } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const utama = {
  icon: Users,
  angka: "3,9 Juta",
  label: "Anak usia sekolah tidak bersekolah",
  sub: "Sebagian putus di tengah jalan karena ekonomi, jarak, dan motivasi.",
};

const lainnya = [
  {
    icon: TrendingDown,
    angka: "76 Ribu+",
    label: "Siswa putus sekolah tiap tahun",
    sub: "Terbanyak pada transisi SD ke SMP dan SMP ke SMA.",
    accent: "text-amber-700",
    ring: "bg-amber-50 ring-amber-100",
  },
  {
    icon: AlertTriangle,
    angka: "Terlambat",
    label: "Sekolah sering baru sadar setelah anak berhenti",
    sub: "Sinyalnya sebenarnya sudah ada jauh sebelum itu.",
    accent: "text-[#005D4C]",
    ring: "bg-emerald-50 ring-emerald-100",
  },
];

export default function MengapaPenting() {
  return (
    <section id="mengapa" className="py-28 bg-white border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="Mengapa Ini Penting"
          title="Setiap angka adalah satu anak yang kehilangan masa depannya"
          desc="Putus sekolah jarang terjadi tiba-tiba. Ada pola — kehadiran menurun, nilai melemah, beban ekonomi — yang muncul lebih dulu. Masalahnya, data itu tercecer dan tidak terbaca tepat waktu."
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Reveal className="lg:col-span-2">
            <article className="h-full bg-slate-900 rounded-2xl p-8 flex flex-col justify-between min-h-[16rem]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center ring-1 bg-rose-500/15 ring-rose-400/20">
                <Users className="w-6 h-6 text-rose-300" aria-hidden="true" />
              </div>
              <div>
                <div className="font-display font-bold text-5xl text-white mb-2">{utama.angka}</div>
                <h3 className="font-display font-semibold text-lg text-white mb-2 leading-snug">{utama.label}</h3>
                <p className="text-[15px] text-slate-300 leading-relaxed">{utama.sub}</p>
              </div>
            </article>
          </Reveal>

          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {lainnya.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.label} delay={(i + 1) * 0.1}>
                  <article className="h-full bg-white border border-slate-200 rounded-xl p-7 transition-shadow duration-200 hover:shadow-md">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ring-1 ${m.ring}`}>
                      <Icon className={`w-6 h-6 ${m.accent}`} aria-hidden="true" />
                    </div>
                    <div className={`font-display font-bold text-3xl mb-1.5 ${m.accent}`}>{m.angka}</div>
                    <h3 className="font-display font-semibold text-base text-[#0F172A] mb-2 leading-snug">{m.label}</h3>
                    <p className="text-[15px] text-slate-600 leading-relaxed">{m.sub}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={0.2} className="mt-10">
          <p className="text-center text-xs text-slate-500">
            *Ilustrasi besaran masalah untuk demo. Angka final mengikuti data resmi Dapodik/BPS.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
