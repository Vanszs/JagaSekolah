"use client";

import { Reveal } from "./Reveal";

type Kat = "merah" | "kuning" | "hijau";

const rows: { nama: string; kelas: string; kat: Kat; skor: number; alasan: string }[] = [
  { nama: "Ahmad Fauzi", kelas: "VIII-A", kat: "merah", skor: 78, alasan: "Alpa 4 hari beruntun · 3 mapel < KKM" },
  { nama: "Rizki Pratama", kelas: "VIII-B", kat: "merah", skor: 71, alasan: "Nilai turun 18 poin · jarak jauh" },
  { nama: "Siti Nurhaliza", kelas: "VIII-A", kat: "kuning", skor: 45, alasan: "Kehadiran menurun · penerima KIP" },
  { nama: "Budi Santoso", kelas: "IX-A", kat: "kuning", skor: 38, alasan: "Tugas tidak dikumpulkan" },
  { nama: "Dewi Lestari", kelas: "VIII-B", kat: "hijau", skor: 12, alasan: "Stabil — pemantauan rutin" },
];

const status: Record<Kat, { dot: string; label: string; bar: string }> = {
  merah: { dot: "bg-red-500", label: "Merah", bar: "bg-red-500" },
  kuning: { dot: "bg-amber-500", label: "Kuning", bar: "bg-amber-500" },
  hijau: { dot: "bg-emerald-500", label: "Hijau", bar: "bg-emerald-500" },
};

const ringkasan = [
  { n: 2, l: "Merah", dot: "bg-red-500" },
  { n: 2, l: "Kuning", dot: "bg-amber-500" },
  { n: 1, l: "Hijau", dot: "bg-emerald-500" },
];

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="border-t border-slate-200/70 bg-white py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:items-center">
          {/* Penjelasan kiri */}
          <Reveal>
            <span className="mb-4 inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-[#005D4C]">
              <span className="h-px w-6 bg-[#005D4C]/40" aria-hidden="true" />
              Dashboard
            </span>
            <h2 className="font-display text-[2rem] font-bold leading-[1.15] tracking-tight text-[#0F172A] sm:text-[2.5rem]">
              Daftar siswa berisiko, lengkap dengan alasannya
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-slate-600 sm:text-lg">
              Bukan sekadar label. Setiap skor disertai alasan yang transparan — alpa beruntun, nilai
              turun, jarak jauh — supaya wali kelas tahu harus bertindak apa, bukan sekadar tahu siapa.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Label Hijau / Kuning / Merah dengan skor 0–100",
                "Alasan eksplisit per siswa — bukan kotak hitam",
                "Urut otomatis dari risiko tertinggi",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#005D4C]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Tabel kanan — elemen dominan */}
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Header aplikasi — bersih, tanpa chrome mac */}
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-sm font-semibold text-[#0F172A]">Wali Kelas — VIII-A</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Demo
                  </span>
                </div>
                {/* Ringkasan inline: dot + angka */}
                <dl className="flex items-center gap-4">
                  {ringkasan.map((s) => (
                    <div key={s.l} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden="true" />
                      <dt className="sr-only">{s.l}</dt>
                      <dd className="text-xs font-semibold tabular-nums text-slate-600">{s.n}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th scope="col" className="px-5 py-3 text-left font-medium">Nama</th>
                      <th scope="col" className="px-5 py-3 text-left font-medium">Risiko</th>
                      <th scope="col" className="w-36 px-5 py-3 text-left font-medium">Skor</th>
                      <th scope="col" className="px-5 py-3 text-left font-medium">Alasan utama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => {
                      const st = status[r.kat];
                      return (
                        <tr key={r.nama} className="transition-colors hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <span className="font-semibold text-[#0F172A]">{r.nama}</span>
                            <span className="ml-2 text-xs text-slate-400">{r.kelas}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                              <span className={`h-2 w-2 rounded-full ${st.dot}`} aria-hidden="true" />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 max-w-[60px] flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${r.skor}%` }} />
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-slate-700">{r.skor}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">{r.alasan}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">*Data contoh untuk demo — bukan siswa sungguhan.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
