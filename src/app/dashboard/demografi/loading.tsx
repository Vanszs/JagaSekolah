import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/demografi memuat data. */
export default function Loading() {
  return (
    <>
      <div className="mb-6">
        <Phantom loading>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Demografi & Pemerataan</h1>
          <p className="mt-1 max-w-prose text-sm text-slate-600">Profil demografis dan pemerataan akses pendidikan.</p>
        </Phantom>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Risiko berdasarkan Jenis Kelamin</h2>
            <div className="mt-4 h-56 rounded-lg bg-slate-100" />
          </section>
        </Phantom>
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Risiko berdasarkan KIP</h2>
            <div className="mt-4 h-56 rounded-lg bg-slate-100" />
          </section>
        </Phantom>
      </div>

      <div className="mt-6">
        <Phantom loading>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="font-display text-base font-semibold text-[#0F172A]">Distribusi Jarak Tempuh</h2>
            <div className="mt-4 h-56 rounded-lg bg-slate-100" />
          </section>
        </Phantom>
      </div>
    </>
  );
}
