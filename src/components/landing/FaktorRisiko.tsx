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
  },
  {
    kode: "B",
    icon: ClipboardList,
    judul: "Behavior — Perilaku",
    desc: "Keterlibatan di kelas menurun sebelum nilai ikut turun: tugas tak dikumpulkan, partisipasi rendah, catatan pelanggaran bertambah.",
    poin: ["Tugas tak dikumpulkan", "Partisipasi rendah", "Catatan disiplin"],
  },
  {
    kode: "C",
    icon: GraduationCap,
    judul: "Course — Akademik",
    desc: "Performa akademik melemah antar periode: banyak mapel di bawah KKM, atau pernah tinggal kelas.",
    poin: ["Nilai turun", "Mapel < KKM", "Tinggal kelas"],
  },
];

const konteks = {
  kode: "+",
  icon: Wallet,
  judul: "Konteks Lokal Indonesia",
  desc: "Faktor khas yang memperberat risiko: ekonomi keluarga, jarak ke sekolah, status keluarga, hingga risiko menikah atau bekerja dini.",
  poin: ["Ekonomi (KIP/PKH)", "Jarak rumah–sekolah", "Status keluarga"],
};

type Faktor = (typeof faktor)[number] & { icon: typeof CalendarX };

function FaktorRow({ f, accent = false }: { f: Faktor; accent?: boolean }) {
  const Icon = f.icon;
  return (
    <li
      className={`group flex gap-5 rounded-xl border p-6 transition-colors duration-150 ${
        accent
          ? "border-[#005D4C]/25 bg-[#005D4C]/[0.03] hover:border-[#005D4C]/40"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {/* Letter code is the visual system — one neutral treatment, no rainbow */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-lg font-bold ${
            accent ? "bg-[#005D4C] text-white" : "bg-slate-900 text-white"
          }`}
        >
          {f.kode}
        </span>
        <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold text-[#0F172A]">{f.judul}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{f.desc}</p>
        {/* Signals: plain dot-separated list, not decorative pills */}
        <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          {f.poin.map((p, idx) => (
            <li key={p} className="flex items-center gap-2">
              {idx > 0 && <span className="text-slate-300" aria-hidden="true">·</span>}
              {p}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function FaktorRisiko() {
  return (
    <section id="faktor-risiko" className="border-t border-slate-200/70 bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-start">
          {/* Intro kiri — sticky */}
          <Reveal className="lg:sticky lg:top-28">
            <span className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-[#005D4C]">
              <span className="h-px w-6 bg-[#005D4C]/40" aria-hidden="true" />
              Faktor Risiko Putus Sekolah
            </span>
            <h2 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight text-[#0F172A] sm:text-[2.5rem]">
              Kerangka ABC<br className="hidden sm:block" /> + konteks lokal
            </h2>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-slate-600 sm:text-lg">
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
                  <dt className="font-display text-xl font-bold tabular-nums text-[#005D4C]">{s.n}</dt>
                  <dd className="mt-0.5 text-xs text-slate-500">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Daftar faktor kanan */}
          <div>
            <ol className="space-y-3">
              {faktor.map((f, i) => (
                <Reveal key={f.judul} delay={i * 0.08}>
                  <FaktorRow f={f} />
                </Reveal>
              ))}
            </ol>

            {/* Pemisah semantik: konteks lokal = tambahan di luar kerangka ABC */}
            <Reveal delay={faktor.length * 0.08}>
              <div className="my-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">
                  Adaptasi Indonesia
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <ol className="space-y-3">
                <FaktorRow f={konteks} accent />
              </ol>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
