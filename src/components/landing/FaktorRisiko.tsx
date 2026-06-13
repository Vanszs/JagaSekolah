"use client";

import { CalendarX, ClipboardList, GraduationCap, Wallet } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const dominan = {
  kode: "A",
  icon: CalendarX,
  judul: "Attendance — Kehadiran",
  desc: "Ketidakhadiran yang menanjak adalah prediktor putus sekolah paling kuat. Alpa berturut-turut atau pola bolos di hari tertentu sering muncul berbulan-bulan sebelum seorang anak benar-benar berhenti.",
  poin: ["% absen 30 hari terakhir", "Alpa beruntun", "Tren kehadiran menurun", "Pola bolos hari tertentu"],
};

const lain = [
  {
    kode: "B",
    icon: ClipboardList,
    judul: "Behavior — Perilaku",
    desc: "Keterlibatan menurun: tugas tidak dikumpulkan, partisipasi rendah, catatan pelanggaran bertambah.",
    tone: "bg-amber-50 ring-amber-100 text-amber-700",
  },
  {
    kode: "C",
    icon: GraduationCap,
    judul: "Course — Akademik",
    desc: "Nilai menurun antar periode, banyak mapel di bawah KKM, atau pernah tinggal kelas.",
    tone: "bg-blue-50 ring-blue-100 text-blue-700",
  },
  {
    kode: "+",
    icon: Wallet,
    judul: "Konteks Lokal Indonesia",
    desc: "Faktor khas yang memperberat: ekonomi keluarga, jarak ke sekolah, status keluarga, risiko menikah atau bekerja dini.",
    tone: "bg-emerald-50 ring-emerald-100 text-[#005D4C]",
  },
];

export default function FaktorRisiko() {
  return (
    <section id="faktor-risiko" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Faktor Risiko Putus Sekolah"
          title="Kerangka ABC + konteks lokal"
          desc="Prediktor putus sekolah yang sudah tervalidasi riset internasional — Attendance, Behavior, Course — diadaptasi dengan faktor konteks Indonesia."
        />

        {/* Bento: cell A dominan 2x2 + tiga cell kecil */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-fr">
          <Reveal className="md:col-span-2 md:row-span-2">
            <article className="h-full bg-[#005D4C] rounded-2xl p-8 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                  <dominan.icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <span className="font-mono text-base font-semibold text-emerald-200 bg-white/10 rounded-md px-2.5 py-1">
                  {dominan.kode}
                </span>
              </div>
              <div className="mt-8">
                <h3 className="font-display font-bold text-2xl text-white mb-3">{dominan.judul}</h3>
                <p className="text-[15px] text-teal-50/90 leading-relaxed mb-6 max-w-md">{dominan.desc}</p>
                <ul className="grid grid-cols-2 gap-2">
                  {dominan.poin.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-teal-50/85">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>

          {lain.map((f, i) => {
            const Icon = f.icon;
            const wide = f.kode === "+";
            return (
              <Reveal key={f.judul} delay={(i + 1) * 0.08} className={wide ? "md:col-span-3" : ""}>
                <article className={`h-full bg-white border border-slate-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-md ${wide ? "flex flex-col sm:flex-row sm:items-center gap-4" : ""}`}>
                  <div className={wide ? "shrink-0" : ""}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl ring-1 flex items-center justify-center ${f.tone}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className={`font-mono text-sm font-semibold rounded-md px-2 py-0.5 ${f.tone}`}>{f.kode}</span>
                    </div>
                    <h3 className="font-display font-semibold text-base text-[#0F172A] mb-1.5 leading-snug">{f.judul}</h3>
                  </div>
                  <p className={`text-sm text-slate-600 leading-relaxed ${wide ? "sm:max-w-xl" : ""}`}>{f.desc}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
