import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/admin/tenant memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Manajemen Tenant</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Sekolah yang terdaftar di platform.</p>
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
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">Nama Sekolah Placeholder</span>
                      <span className="ml-2 font-mono text-xs text-slate-400">NPSN 00000000</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">Kabupaten, Provinsi</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">000</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">00</td>
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
