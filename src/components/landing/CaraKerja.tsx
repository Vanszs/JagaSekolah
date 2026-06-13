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

        <ol className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px bg-emerald-200/70" aria-hidden="true" />
          {langkah.map((l, i) => {
            const Icon = l.icon;
            return (
              <Reveal key={l.num} delay={i * 0.1}>
                <li className="relative text-left list-none">
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-[#005D4C]" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#005D4C] text-white text-xs font-bold flex items-center justify-center font-display">
                      {l.num}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-[#0F172A] mb-2">{l.judul}</h3>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{l.desc}</p>
                </li>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
