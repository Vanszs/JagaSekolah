import Phantom from "@/components/Phantom";

/**
 * Skeleton saat /dashboard/agregat memuat data (Next route-segment loading UI).
 * Markup di bawah = template skeleton struktur-aware: tata letaknya MENIRU
 * halaman nyata (header + 4 StatTile + tabel per-sekolah) agar tak ada flash
 * layout. Angka & nama hanyalah placeholder yang tertutup shimmer.
 */
export default function Loading() {
  return (
    <>
      {/* PageHeader */}
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Agregat Wilayah</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">
            Statistik risiko anonim per sekolah. Tidak menampilkan identitas siswa.
          </p>
        </Phantom>
      </div>

      {/* 4 StatTile */}
      <Phantom loading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Label metrik</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">000</p>
            </div>
          ))}
        </div>
      </Phantom>

      {/* Tabel per-sekolah — dibungkus utuh agar nesting tabel tetap valid
          (phantom-ui TIDAK boleh menjadi anak langsung <tbody>). */}
      <div className="mt-8">
        <Phantom loading>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Sekolah</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Tinggi</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Waspada</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Aman</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900">Nama Sekolah Placeholder</span>
                        <span className="ml-2 text-xs tabular-nums text-slate-400">NPSN 00000000</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">00</td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">00</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">00</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-500">00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Phantom>
      </div>
    </>
  );
}
