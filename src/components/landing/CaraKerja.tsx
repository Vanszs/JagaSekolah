"use client";

import { FolderSync, BrainCircuit, BellRing, HeartHandshake } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const langkah = [
  { num: "01", icon: FolderSync, judul: "Sinkronisasi Data", desc: "Tarik data yang sudah ada — absensi, nilai, profil Dapodik — tanpa input ganda yang membebani guru." },
  { num: "02", icon: BrainCircuit, judul: "Hitung Skor Risiko", desc: "Mesin menilai sinyal ABC + konteks lokal, lalu memberi label Hijau / Kuning / Merah beserta alasannya." },
  { num: "03", icon: BellRing, judul: "Peringatan Dini", desc: "Wali kelas menerima daftar siswa berisiko lebih awal — bukan setelah anak sudah berhenti." },
  { num: "04", icon: HeartHandshake, judul: "Intervensi & Tindak Lanjut", desc: "Saran tindakan konkret: kunjungan rumah, koordinasi BK, usul KIP. Semua tercatat dan terpantau." },
];

export default function CaraKerja() {
  return (
    <section id="cara-kerja" className="py-20 bg-white border-t border-slate-200/70">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Cara Kerja"
          title="Empat langkah, dari data jadi tindakan"
          desc="Alur yang ramah guru — fokus pada deteksi dini dan intervensi, bukan menambah pekerjaan administratif."
        />

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {langkah.map((l, i) => {
            const Icon = l.icon;
            const isLast = i === langkah.length - 1;
            return (
              <Reveal key={l.num} delay={i * 0.1}>
                <li className="relative list-none text-left">
                  {/* Konektor ke langkah berikutnya — relatif terhadap ikon, robust di segala lebar */}
                  {!isLast && (
                    <span
                      className="absolute top-8 left-8 hidden h-px w-[calc(100%+2rem)] bg-emerald-200/70 lg:block"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Icon className="h-6 w-6 text-[#005D4C]" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#005D4C] font-display text-xs font-bold text-white">
                      {l.num}
                    </span>
                  </div>
                  <h3 className="mb-2 font-display text-base font-semibold text-[#0F172A]">{l.judul}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-600">{l.desc}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
