import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/kabupaten/[wilayahId] memuat data. */
export default function Loading() {
  return (
    <Phantom loading>
      <div>
        <p className="mb-4 text-sm text-slate-500">Provinsi → Kabupaten</p>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Nama Kabupaten</h1>
        <p className="mt-1 text-sm text-slate-600">Daftar sekolah di kabupaten ini.</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {[0, 1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">Nama Sekolah Placeholder</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-700">000</td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-700">00</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Phantom>
  );
}
