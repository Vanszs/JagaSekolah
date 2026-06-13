"use client";

import { Reveal } from "./Reveal";

const metrik = [
  { angka: "↑ 7 bulan", label: "Lebih awal terdeteksi", sub: "dibanding menunggu anak benar-benar berhenti" },
  { angka: "100%", label: "Recall uji retrospektif", sub: "siswa yang dulu dropout tertandai MERAH pada simulasi" },
  { angka: "−40%", label: "Beban administrasi guru", sub: "karena memakai data yang sudah ada, bukan input ulang" },
];

export default function Dampak() {
  return (
    <section id="dampak" className="border-t border-slate-200/70">
      {/* Stats band — full-bleed rhythm break (reference flow #4) */}
      <div className="bg-[#005D4C] py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-10">
            <h2 className="font-display font-bold text-[1.75rem] sm:text-[2.25rem] leading-tight tracking-tight text-white">
              Deteksi lebih awal = peluang lebih besar
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-teal-50/90">
              Tujuannya satu: menahan anak tetap di bangku sekolah. Setiap intervensi tepat waktu bisa mengubah arah masa depan seorang anak.
            </p>
          </Reveal>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {metrik.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.1}>
                <div className="border-l-2 border-emerald-300/40 pl-5">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display font-bold text-4xl text-white mb-1.5 tabular-nums">{m.angka}</dd>
                  <p className="font-display font-semibold text-sm text-emerald-100 mb-1">{m.label}</p>
                  <p className="text-[13px] text-teal-50/70 leading-relaxed">{m.sub}</p>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>

      {/* Single big testimonial — reference flow #6 */}
      <div className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Reveal>
            <figure>
              <blockquote className="font-display font-medium text-2xl sm:text-[1.75rem] leading-snug text-[#0F172A] tracking-tight">
                “Dulu kami baru tahu seorang anak berhenti saat namanya hilang dari absen. Dengan deteksi dini, kami bisa bertindak jauh sebelum itu terjadi.”
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center font-display font-bold text-[#005D4C]" aria-hidden="true">W</span>
                <span className="text-left">
                  <span className="block font-display font-semibold text-sm text-[#0F172A]">Wali Kelas</span>
                  <span className="block text-xs text-slate-500">SMP di daerah 3T · skenario ilustratif</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.15} className="mt-10">
            <p className="text-xs text-slate-400">
              *Metrik & kutipan bersifat ilustratif untuk demo. Angka final mengikuti hasil uji coba lapangan.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
