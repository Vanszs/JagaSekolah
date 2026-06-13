"use client";

import { ShieldCheck, Lock, FileCheck2, Eye } from "lucide-react";
import { Reveal } from "./Reveal";

const fitur = [
  {
    icon: Lock,
    judul: "Enkripsi PII (AES-256-GCM)",
    desc: "Data sensitif siswa — status ekonomi, kondisi keluarga — dienkripsi at-rest dengan envelope encryption.",
  },
  {
    icon: FileCheck2,
    judul: "Persetujuan Orang Tua",
    desc: "Sesuai UU PDP, data anak hanya diproses setelah ada consent. Tercatat & dapat dicabut kapan saja.",
  },
  {
    icon: Eye,
    judul: "Akses Berlapis & Audit",
    desc: "Wali kelas hanya lihat kelasnya, dinas hanya agregat anonim. Setiap akses data tercatat di audit log.",
  },
];

export default function KeamananData() {
  return (
    <section id="keamanan" className="py-20 bg-white border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <Reveal className="lg:col-span-5">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide mb-4 text-[#005D4C]">
              <span className="h-px w-6 bg-[#005D4C]/40" aria-hidden="true" />
              Keamanan Data
            </span>
            <h2 className="font-display font-bold text-[2rem] sm:text-[2.5rem] leading-[1.15] tracking-tight text-[#0F172A] mb-4">
              Data anak adalah amanah, bukan komoditas
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
              Seluruh pemantauan tunduk pada{" "}
              <strong className="text-slate-800">UU Perlindungan Data Pribadi (No. 27/2022)</strong>.
              Kami menerapkan prinsip privasi sejak desain — data minimal, terenkripsi, dan akses dibatasi ketat.
            </p>
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <ShieldCheck className="w-7 h-7 text-[#005D4C] shrink-0" aria-hidden="true" />
              <div>
                <div className="font-display font-semibold text-sm text-[#0F172A]">Privacy by Design</div>
                <div className="text-xs text-slate-500 font-mono uppercase tracking-wide">UU PDP · AES-256-GCM</div>
              </div>
            </div>
          </Reveal>

          <ul className="lg:col-span-7 space-y-4">
            {fitur.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.judul} delay={i * 0.1}>
                  <li className="flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60 transition-all duration-200">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Icon className="w-6 h-6 text-[#005D4C]" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base text-[#0F172A] mb-1">{f.judul}</h3>
                      <p className="text-[15px] text-slate-600 leading-relaxed">{f.desc}</p>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
