"use client";

import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const rows = [
  { nama: "Ahmad Fauzi", kelas: "VIII-A", kat: "merah", skor: 78, alasan: "Alpa 4 hari beruntun · 3 mapel < KKM" },
  { nama: "Siti Nurhaliza", kelas: "VIII-A", kat: "kuning", skor: 45, alasan: "Kehadiran menurun · penerima KIP" },
  { nama: "Rizki Pratama", kelas: "VIII-B", kat: "merah", skor: 71, alasan: "Nilai turun 18 poin · jarak jauh" },
  { nama: "Dewi Lestari", kelas: "VIII-B", kat: "hijau", skor: 12, alasan: "Stabil — pemantauan rutin" },
  { nama: "Budi Santoso", kelas: "IX-A", kat: "kuning", skor: 38, alasan: "Tugas tidak dikumpulkan" },
];

const badge: Record<string, string> = {
  merah: "bg-red-100 text-red-700 border-red-200",
  kuning: "bg-amber-100 text-amber-800 border-amber-200",
  hijau: "bg-emerald-100 text-emerald-800 border-emerald-200",
};
const bar: Record<string, string> = { merah: "bg-red-500", kuning: "bg-amber-400", hijau: "bg-emerald-500" };

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="py-24 bg-slate-50 border-t border-slate-200/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          title="Daftar siswa berisiko, lengkap dengan alasannya"
          desc="Bukan sekadar label. Setiap skor disertai alasan yang transparan, supaya wali kelas tahu harus bertindak apa."
        />

        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden max-w-5xl mx-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="ml-3 font-display font-semibold text-sm text-slate-700">Dashboard Wali Kelas — VIII-A</span>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Demo</span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              {[
                { n: 2, l: "Merah", c: "text-red-600" },
                { n: 2, l: "Kuning", c: "text-amber-600" },
                { n: 1, l: "Hijau", c: "text-emerald-600" },
              ].map((s) => (
                <div key={s.l} className="px-5 py-4 text-center">
                  <div className={`font-display font-bold text-2xl ${s.c}`}>{s.n}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-slate-50/70 text-slate-500 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th scope="col" className="text-left px-5 py-3 font-semibold">Nama</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold">Kelas</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold">Risiko</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold w-40">Skor</th>
                    <th scope="col" className="text-left px-5 py-3 font-semibold">Alasan utama</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.nama} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">{r.nama}</td>
                      <td className="px-5 py-3 text-slate-500">{r.kelas}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${badge[r.kat]}`}>{r.kat}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-[80px]">
                            <div className={`h-full rounded-full ${bar[r.kat]}`} style={{ width: `${r.skor}%` }} />
                          </div>
                          <span className="font-semibold text-slate-700 text-xs tabular-nums">{r.skor}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{r.alasan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="mt-8">
          <p className="text-center text-xs text-slate-400">*Data contoh untuk demo — bukan siswa sungguhan.</p>
        </Reveal>
      </div>
    </section>
  );
}
