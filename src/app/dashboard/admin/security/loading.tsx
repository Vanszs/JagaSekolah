import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/admin/security memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Security Center</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Postur privasi & keamanan platform.</p>
        </Phantom>
      </div>

      <Phantom loading>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <section key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-[#0F172A]">Judul bagian keamanan</h2>
              <p className="mt-1 max-w-prose text-sm text-slate-500">
                Baris penjelasan placeholder untuk bagian ini di security center.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-medium text-slate-500">Label metrik</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">000</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Phantom>
    </>
  );
}
