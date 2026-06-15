import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/kelola/kelas memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Kelola Kelas</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Daftar kelas di sekolah Anda.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Informasi kelas placeholder.</p>
        </section>
      </Phantom>

      <div className="mt-6">
        <Phantom loading>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">Nama Kelas</td>
                    <td className="px-4 py-3.5 text-slate-600">Wali Kelas</td>
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
