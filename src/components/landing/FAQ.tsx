"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const faqs = [
  {
    q: "Apakah JagaSekolah menambah pekerjaan guru?",
    a: "Tidak. Sistem memakai data yang sudah ada (absensi, nilai, Dapodik). Tidak ada input ganda — guru hanya menindaklanjuti siswa yang ditandai berisiko.",
  },
  {
    q: "Bagaimana data pribadi siswa dilindungi?",
    a: "Data sensitif dienkripsi (AES-256-GCM), akses dibatasi per peran, dan setiap akses tercatat di audit log. Semua mengikuti UU PDP No. 27/2022. Pemrosesan data anak memerlukan persetujuan orang tua.",
  },
  {
    q: "Apakah skornya 'kotak hitam'?",
    a: "Tidak. Setiap label risiko (Hijau/Kuning/Merah) selalu disertai alasan eksplisit — misalnya 'alpa 4 hari beruntun' atau 'nilai turun 18 poin' — sehingga guru paham dasar penilaiannya.",
  },
  {
    q: "Apa yang dilihat dinas pendidikan?",
    a: "Dinas hanya melihat statistik agregat anonim per sekolah/wilayah — tanpa identitas siswa. Data per-anak tetap di tangan sekolah yang bersangkutan.",
  },
  {
    q: "Apakah bisa dipakai di sekolah dengan internet terbatas?",
    a: "Bisa. Aplikasi dirancang offline-friendly (PWA) — guru tetap dapat melihat data & mencatat tindak lanjut, lalu tersinkron otomatis saat ada koneksi.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btnId = `${id}-btn`;
  const panelId = `${id}-panel`;
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <h3>
        <button
          type="button"
          id={btnId}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span className="font-display font-semibold text-[15px] text-[#0F172A]">{q}</span>
          <ChevronDown
            className={`w-5 h-5 text-[#005D4C] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-[15px] text-slate-600 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <section id="faq" className="py-20 bg-white border-t border-slate-200/70">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <SectionHeading title="Pertanyaan yang sering muncul" />
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.06}>
              <Item q={f.q} a={f.a} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
