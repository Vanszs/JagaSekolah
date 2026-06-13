"use client";

import { CalendarX, ClipboardList, GraduationCap, Wallet } from "lucide-react";
import { Reveal } from "./Reveal";

const faktor = [
  {
    kode: "A",
    icon: CalendarX,
    judul: "Attendance — Kehadiran",
    desc: "Ketidakhadiran yang menanjak adalah prediktor putus sekolah paling kuat — sering muncul berbulan-bulan sebelum anak benar-benar berhenti.",
    poin: ["% absen 30 hari", "Alpa beruntun", "Tren menurun"],
    rail: "bg-rose-400",
    chip: "bg-rose-50 text-rose-700 ring-rose-100",
  },
  {
    kode: "B",
    icon: ClipboardList,
    judul: "Behavior — Perilaku",
    desc: "Keterlibatan di kelas menurun sebelum nilai ikut turun: tugas tak dikumpulkan, partisipasi rendah, catatan pelanggaran bertambah.",
    poin: ["Tugas tak dikumpulkan", "Partisipasi rendah", "Catatan disiplin"],
    rail: "bg-amber-400",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    kode: "C",
    icon: GraduationCap,
    judul: "Course — Akademik",
    desc: "Performa akademik melemah antar periode: banyak mapel di bawah KKM, atau pernah tinggal kelas.",
    poin: ["Nilai turun", "Mapel < KKM", "Tinggal kelas"],
    rail: "bg-blue-400",
    chip: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    kode: "+",
    icon: Wallet,
    judul: "Konteks Lokal Indonesia",
    desc: "Faktor khas yang memperberat risiko: ekonomi keluarga, jarak ke sekolah, status keluarga, hingga risiko menikah atau bekerja dini.",
    poin: ["Ekonomi (KIP/PKH)", "Jarak rumah–sekolah", "Status keluarga"],
    rail: "bg-[#005D4C]",
    chip: "bg-emerald-50 text-[#005D4C] ring-emerald-100",
  },
];

export default function FaktorRisiko() {
  return (
    <section id="faktor-risiko" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-start">
          {/* Intro kiri */}
          <Reveal className="lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide mb-4 text-[#005D4C]">
              <span className="h-px w-6 bg-[#005D4C]/40" aria-hidden="true" />
              Faktor Risiko Putus Sekolah
            </span>
            <h2 className="font-display font-bold text-[2rem] sm:text-[2.5rem] leading-[1.12] tracking-tight text-[#0F172A]">
              Kerangka ABC<br className="hidden sm:block" /> + konteks lokal
            </h2>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-prose">
              JagaSekolah memakai kerangka <strong className="text-slate-800">ABC</strong> — Attendance,
              Behavior, Course — prediktor putus sekolah yang sudah tervalidasi riset internasional, lalu
              diadaptasi dengan faktor konteks Indonesia.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              {[
                { n: "3", l: "Sinyal inti" },
                { n: "A·B·C", l: "Kerangka" },
                { n: "+1", l: "Konteks lokal" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-display font-bold text-xl text-[#005D4C] tabular-nums">{s.n}</dt>
                  <dd className="text-xs text-slate-500 mt-0.5">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Daftar faktor kanan — baris seragam dengan accent rail */}
          <ol className="space-y-4">
            {faktor.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.judul} delay={i * 0.08}>
                  <li className="group relative flex gap-5 overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 transition-shadow duration-200 hover:shadow-md">
                    <span className={`absolute left-0 top-0 h-full w-1 ${f.rail}`} aria-hidden="true" />
                    <div className="shrink-0">
                      <div className="relative w-12 h-12 rounded-xl bg-slate-50 ring-1 ring-slate-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-slate-700" aria-hidden="true" />
                        <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center font-mono text-[11px] font-bold ${f.chip}`}>
                          {f.kode}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-base text-[#0F172A] mb-1.5">{f.judul}</h3>
                      <p className="text-[15px] text-slate-600 leading-relaxed mb-3">{f.desc}</p>
                      <ul className="flex flex-wrap gap-2">
                        {f.poin.map((p) => (
                          <li key={p} className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 ${f.chip}`}>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
