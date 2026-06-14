import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/admin/audit memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Audit Log</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Jejak aktivitas sistem yang tidak dapat diubah.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Label metrik</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">000</p>
            </div>
          ))}
        </div>
      </Phantom>

      <div className="mt-8">
        <Phantom loading>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-xs tabular-nums text-slate-500">00 Jan 00:00</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">Nama Pengguna</span>
                      <span className="block text-xs text-slate-400">Peran</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">Aktivitas placeholder</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">target:000</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Phantom>
      </div>
    </>
  );
}
