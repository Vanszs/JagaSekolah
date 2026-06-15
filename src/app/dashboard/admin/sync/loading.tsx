import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/admin/sync memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Sinkronisasi & Impor</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Impor data dan log sinkronisasi.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Label metrik</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">000</p>
            </div>
          ))}
        </div>
      </Phantom>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Impor Data</h2>
            <p className="mt-3 text-sm text-slate-500">Placeholder penjelasan impor data.</p>
          </section>
        </Phantom>
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Informasi</h2>
            <p className="mt-3 text-sm text-slate-500">Placeholder informasi sinkronisasi.</p>
          </section>
        </Phantom>
      </div>

      <div className="mt-6">
        <Phantom loading>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5 text-xs tabular-nums text-slate-500">00 Jan 00:00</td>
                    <td className="px-4 py-3.5 text-slate-700">Jenis aksi</td>
                    <td className="px-4 py-3.5 text-slate-600">Status</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700">0</td>
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
