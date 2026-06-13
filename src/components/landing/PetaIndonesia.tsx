"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { PETA_W, PETA_H, PROVINSI_PATHS } from "./peta-paths";

type Risiko = "rendah" | "sedang" | "tinggi";

const WARNA: Record<Risiko, string> = {
  rendah: "#10b981",
  sedang: "#eab308",
  tinggi: "#ef4444",
};

const RISIKO_PROVINSI: Record<string, Risiko> = {
  Papua: "tinggi",
  "Papua Barat": "tinggi",
  "Nusa Tenggara Timur": "tinggi",
  Maluku: "sedang",
  "Maluku Utara": "sedang",
  "Kalimantan Barat": "sedang",
  "Sulawesi Barat": "sedang",
  "Nusa Tenggara Barat": "sedang",
  Aceh: "sedang",
  "Sulawesi Tengah": "sedang",
  "Kalimantan Tengah": "sedang",
  Banten: "rendah",
  Yogyakarta: "rendah",
  "Jawa Tengah": "rendah",
  "Jawa Timur": "rendah",
  "Jawa Barat": "rendah",
  Bali: "rendah",
};

const legenda: { r: Risiko; label: string; ket: string }[] = [
  { r: "rendah", label: "Hijau — Aman", ket: "Tidak ada sinyal risiko menonjol" },
  { r: "sedang", label: "Kuning — Waspada", ket: "Mulai muncul sinyal, perlu dipantau" },
  { r: "tinggi", label: "Merah — Berisiko", ket: "Perlu intervensi dini segera" },
];

const risikoOf = (nama: string): Risiko => RISIKO_PROVINSI[nama] ?? "rendah";

export default function PetaIndonesia() {
  const [hover, setHover] = useState<{ nama: string; risiko: Risiko; x: number; y: number } | null>(null);

  return (
    <section
      id="peta"
      className="py-32 bg-teal-950 text-white border-t border-teal-900 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          tone="dark"
          eyebrow="Jangkauan Nasional"
          title="Peta risiko per provinsi, satu pandangan"
          desc="Dinas pendidikan memantau peta risiko per wilayah secara anonim; sekolah menindaklanjuti per siswa. Arahkan kursor ke provinsi untuk melihat statusnya."
        />

        <Reveal delay={0.1}>
          <div className="relative w-full max-w-5xl mx-auto">
            <svg
              viewBox={`0 0 ${PETA_W} ${PETA_H}`}
              className="w-full h-auto"
              role="img"
              aria-label="Peta risiko putus sekolah per provinsi di Indonesia"
              onMouseLeave={() => setHover(null)}
            >
              {PROVINSI_PATHS.map((p) => {
                const risiko = risikoOf(p.nama);
                const aktif = hover?.nama === p.nama;
                return (
                  <path
                    key={p.nama}
                    d={p.d}
                    fill={WARNA[risiko]}
                    fillOpacity={aktif ? 1 : 0.82}
                    stroke="#0f3d33"
                    strokeWidth={0.5}
                    tabIndex={0}
                    role="img"
                    aria-label={`${p.nama}: risiko ${risiko}`}
                    className="cursor-pointer transition-[fill-opacity] duration-150 focus:outline-none focus-visible:stroke-white focus-visible:[stroke-width:1.5]"
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({
                        nama: p.nama,
                        risiko,
                        x: (p.cx / PETA_W) * rect.width,
                        y: (p.cy / PETA_H) * rect.height,
                      });
                    }}
                    onFocus={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({
                        nama: p.nama,
                        risiko,
                        x: (p.cx / PETA_W) * rect.width,
                        y: (p.cy / PETA_H) * rect.height,
                      });
                    }}
                    onBlur={() => setHover(null)}
                  >
                    <title>{`${p.nama}: risiko ${risiko}`}</title>
                  </path>
                );
              })}
            </svg>

            {hover && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-white text-slate-900 rounded-lg shadow-xl px-3 py-2 text-xs font-semibold whitespace-nowrap z-10"
                style={{ left: hover.x, top: hover.y - 6 }}
              >
                <div className="font-display font-bold">{hover.nama}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: WARNA[hover.risiko] }} />
                  <span className="capitalize text-slate-500">Risiko {hover.risiko}</span>
                </div>
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            {legenda.map((l) => (
              <div key={l.label} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="w-3.5 h-3.5 rounded-full mt-0.5 shrink-0" style={{ background: WARNA[l.r] }} />
                <div>
                  <div className="font-display font-bold text-sm text-white">{l.label}</div>
                  <div className="text-xs text-teal-100/90">{l.ket}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.25} className="mt-6">
          <p className="text-center text-[11px] text-teal-200/80">
            *Status risiko per provinsi bersifat ilustratif untuk demo. Data final mengikuti hasil agregasi sistem.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
