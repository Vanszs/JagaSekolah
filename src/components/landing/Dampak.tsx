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
      {/* Stats band — full-bleed rhythm break */}
      <div className="bg-[#005D4C] py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          {/* Heading = elemen dominan */}
          <Reveal>
            <h2 className="font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.5rem] lg:whitespace-nowrap">
              Deteksi lebih awal = peluang lebih besar
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-teal-50/80 sm:text-lg">
              Tujuannya satu: menahan anak tetap di bangku sekolah. Setiap intervensi tepat waktu bisa
              mengubah arah masa depan seorang anak.
            </p>
          </Reveal>

          {/* Metrik = subordinat: angka lebih kecil dari heading, dipisah garis halus */}
          <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-3">
            {metrik.map((m, i) => (
              <Reveal key={m.label} delay={i * 0.1}>
                <div className="h-full bg-[#005D4C] p-6">
                  <dt className="sr-only">{m.label}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums text-white sm:text-[1.75rem]">
                    {m.angka}
                  </dd>
                  <p className="mt-2 text-sm font-semibold text-emerald-100">{m.label}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-teal-50/70">{m.sub}</p>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>

      {/* Single big testimonial */}
      <div className="bg-white py-24">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <Reveal>
            <figure>
              <blockquote className="font-display text-2xl font-medium leading-snug tracking-tight text-[#0F172A] sm:text-[1.75rem] text-balance">
                &ldquo;Dulu kami baru tahu seorang anak berhenti saat namanya hilang dari absen. Dengan
                deteksi dini, kami bisa bertindak jauh sebelum itu terjadi.&rdquo;
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 font-display font-bold text-[#005D4C] ring-1 ring-emerald-100"
                  aria-hidden="true"
                >
                  W
                </span>
                <span className="text-left">
                  <span className="block font-display text-sm font-semibold text-[#0F172A]">Wali Kelas</span>
                  <span className="block text-xs text-slate-500">SMP di daerah 3T · skenario ilustratif</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.15} className="mt-10">
            <p className="text-xs text-slate-400">
              *Metrik &amp; kutipan bersifat ilustratif untuk demo. Angka final mengikuti hasil uji coba lapangan.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
