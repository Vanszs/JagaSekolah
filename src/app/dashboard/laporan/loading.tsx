import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/laporan memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Laporan & Ekspor</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Unduh laporan agregat tanpa data identitas siswa.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Label metrik</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">000</p>
            </div>
          ))}
        </div>
      </Phantom>

      <Phantom loading>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <section key={i} className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-[#0F172A]">Kategori Risiko</h2>
              <dl className="mt-4 space-y-3">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <dt className="text-sm text-slate-600">Label</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-900">0</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </Phantom>
    </>
  );
}
