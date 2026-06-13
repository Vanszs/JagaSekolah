import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard (Ringkasan) memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Ringkasan</h1>
          <p className="mt-1 text-sm text-slate-600">Pantauan risiko putus sekolah untuk siswa di lingkup Anda.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Label metrik</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">000</p>
            </div>
          ))}
        </div>
      </Phantom>

      <div className="mt-8">
        <Phantom loading count={5}>
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Nama Siswa Placeholder</p>
              <p className="text-xs text-slate-400">VIII-A</p>
            </div>
            <span className="text-sm text-slate-600">Risiko Tinggi</span>
            <span className="w-10 text-right text-sm font-semibold text-slate-700">100</span>
          </div>
        </Phantom>
      </div>
    </>
  );
}
