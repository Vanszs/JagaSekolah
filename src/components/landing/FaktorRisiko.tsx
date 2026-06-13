"use client";

import { CalendarX, ClipboardList, GraduationCap, Wallet } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const faktor = [
  {
    kode: "A",
    icon: CalendarX,
    judul: "Attendance — Kehadiran",
    desc: "Ketidakhadiran menanjak, alpa berturut-turut, atau pola bolos di hari tertentu. Prediktor putus sekolah paling kuat.",
    poin: ["% absen 30 hari terakhir", "Alpa beruntun", "Tren kehadiran menurun"],
    tone: "bg-rose-50 ring-rose-100 text-rose-700",
  },
  {
    kode: "B",
    icon: ClipboardList,
    judul: "Behavior — Perilaku",
    desc: "Keterlibatan di kelas menurun: tugas tidak dikumpulkan, partisipasi rendah, catatan pelanggaran bertambah.",
    poin: ["Tugas tidak dikumpulkan", "Partisipasi rendah", "Catatan disiplin"],
    tone: "bg-amber-50 ring-amber-100 text-amber-700",
  },
  {
    kode: "C",
    icon: GraduationCap,
    judul: "Course — Akademik",
    desc: "Nilai menurun antar periode, banyak mata pelajaran di bawah KKM, atau pernah tinggal kelas.",
    poin: ["Nilai turun", "Mapel di bawah KKM", "Riwayat tinggal kelas"],
    tone: "bg-blue-50 ring-blue-100 text-blue-700",
  },
  {
    kode: "+",
    icon: Wallet,
    judul: "Konteks Lokal Indonesia",
    desc: "Faktor khas yang memperberat: ekonomi keluarga, jarak ke sekolah, status keluarga, risiko menikah atau bekerja dini.",
    poin: ["Ekonomi (KIP/PKH)", "Jarak rumah-sekolah", "Status keluarga"],
    tone: "bg-emerald-50 ring-emerald-100 text-[#005D4C]",
  },
];

export default function FaktorRisiko() {
  return (
    <section id="faktor-risiko" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          eyebrow="Faktor Risiko Putus Sekolah"
          title="Kerangka ABC + konteks lokal"
          desc="JagaSekolah memakai kerangka ABC (Attendance, Behavior, Course) — prediktor putus sekolah yang sudah tervalidasi riset internasional — lalu diadaptasi dengan faktor konteks Indonesia."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faktor.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.judul} delay={i * 0.08}>
                <article className="h-full bg-white border border-slate-200 rounded-2xl p-6 transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-200/60">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl ring-1 flex items-center justify-center ${f.tone}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <span className={`font-mono text-sm font-semibold rounded-md px-2 py-0.5 ${f.tone}`}>
                      {f.kode}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-[#0F172A] mb-2 leading-snug">{f.judul}</h3>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-4">{f.desc}</p>
                  <ul className="space-y-1.5 list-disc pl-5 marker:text-slate-300">
                    {f.poin.map((p) => (
                      <li key={p} className="text-sm text-slate-700">
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
