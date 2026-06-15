import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/kelas memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Risiko per Kelas</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Distribusi risiko di setiap kelas.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-[#0F172A]">Distribusi per Kelas</h2>
          <div className="mt-4 h-56 rounded-lg bg-slate-100" />
        </section>
      </Phantom>

      <div className="mt-6">
        <Phantom loading>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">VIII-A</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700">00</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700">00</td>
                    <td className="px-4 py-3.5 tabular-nums text-slate-700">00</td>
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
