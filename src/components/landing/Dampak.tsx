"use client";

import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const metrik = [
  { angka: "↑ 7 bulan", label: "Lebih awal terdeteksi", sub: "dibanding menunggu anak benar-benar berhenti" },
  { angka: "100%", label: "Recall uji retrospektif", sub: "siswa yang dulu dropout tertandai MERAH pada simulasi" },
  { angka: "−40%", label: "Beban administrasi guru", sub: "karena memakai data yang sudah ada, bukan input ulang" },
];

const testimoni = [
  {
    kutipan: "Dulu kami baru tahu anak berhenti saat namanya hilang dari absen. Sekarang kami bisa bertindak jauh sebelum itu.",
    nama: "Wali Kelas",
    peran: "SMP, daerah 3T (ilustrasi)",
  },
  {
    kutipan: "Dinas akhirnya punya peta risiko per wilayah tanpa harus menyentuh data pribadi tiap anak. Itu yang kami butuhkan.",
    nama: "Dinas Pendidikan",
    peran: "Tingkat kabupaten (ilustrasi)",
  },
];

export default function Dampak() {
  return (
    <section id="dampak" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          title="Deteksi lebih awal = peluang lebih besar"
          desc="Tujuannya satu: menahan anak tetap di bangku sekolah. Setiap intervensi yang tepat waktu bisa mengubah arah masa depan seorang anak."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {metrik.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.1}>
              <article className="h-full bg-white border border-slate-200 rounded-2xl p-7 text-center hover:shadow-lg hover:shadow-slate-200/60 transition-shadow duration-200">
                <div className="font-display font-bold text-3xl text-[#005D4C] mb-2">{m.angka}</div>
                <h3 className="font-display font-semibold text-sm text-[#0F172A] mb-1">{m.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{m.sub}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimoni.map((t, i) => (
            <Reveal key={t.nama} delay={i * 0.1}>
              <figure className="h-full bg-white border border-slate-200 rounded-2xl p-7">
                <blockquote className="text-slate-700 leading-relaxed mb-5">
                  <span className="font-display font-bold text-3xl text-emerald-300 leading-none mr-1" aria-hidden="true">“</span>
                  {t.kutipan}
                </blockquote>
                <figcaption>
                  <div className="font-display font-semibold text-sm text-[#0F172A]">{t.nama}</div>
                  <div className="text-xs text-slate-500">{t.peran}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-8">
          <p className="text-center text-xs text-slate-400">
            *Metrik & testimoni bersifat ilustratif untuk demo. Angka final mengikuti hasil uji coba lapangan.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
