import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/sekolah/[id]/kelas/[kelasId] memuat data. */
export default function Loading() {
  return (
    <Phantom loading>
      <div>
        <p className="mb-4 text-sm text-slate-500">Sekolah → Kelas</p>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Nama Kelas</h1>
        <p className="mt-1 text-sm text-slate-600">Wali Kelas: Nama Guru</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-900">Nama Siswa Placeholder</span>
                    <span className="block text-xs text-slate-400">NISN 0012345678</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">Risiko</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-sm font-semibold text-slate-700">0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Phantom>
  );
}
