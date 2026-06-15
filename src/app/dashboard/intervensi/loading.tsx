import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/intervensi memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Intervensi</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Upaya pencegahan dan penanganan siswa berisiko.</p>
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Distribusi Jenis</h2>
            <div className="mt-4 h-56 rounded-lg bg-slate-100" />
          </section>
        </Phantom>
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Tren Intervensi</h2>
            <div className="mt-4 h-56 rounded-lg bg-slate-100" />
          </section>
        </Phantom>
      </div>
    </>
  );
}
