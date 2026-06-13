import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/siswa memuat data (Next route-segment loading UI). */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Daftar Siswa</h1>
        </Phantom>
      </div>
      <Phantom loading count={8}>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Nama Siswa Placeholder</p>
            <p className="text-xs text-slate-400">VIII-A · 0012345678</p>
          </div>
          <span className="text-sm text-slate-600">Risiko Tinggi</span>
          <span className="w-10 text-right text-sm font-semibold text-slate-700">100</span>
        </div>
      </Phantom>
    </>
  );
}
