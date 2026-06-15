import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/kelola/users memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Kelola Guru & BK</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Daftar guru dan konselor di sekolah Anda.</p>
        </Phantom>
      </div>

      <div className="mt-8">
        <Phantom loading>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[0, 1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">Nama Pengguna Placeholder</span>
                      <span className="block text-xs text-slate-400">email@sekolah.sch.id</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">Peran</td>
                    <td className="px-4 py-3.5 text-slate-600">Kelas</td>
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
