import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/siswa/[id] memuat detail. */
export default function Loading() {
  return (
    <Phantom loading>
      <div>
        <p className="mb-5 text-sm font-medium text-slate-500">← Daftar Siswa</p>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Nama Siswa Placeholder</h1>
        <p className="mt-1 text-sm text-slate-500">VIII-A · NISN 0012345678</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <section key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-base font-semibold text-[#0F172A]">Judul bagian</h2>
              <p className="mt-3 text-sm text-slate-700">Baris penjelasan placeholder pertama di sini.</p>
              <p className="mt-2 text-sm text-slate-700">Baris penjelasan placeholder kedua di sini.</p>
              <p className="mt-2 text-sm text-slate-700">Baris penjelasan ketiga.</p>
            </section>
          ))}
        </div>
      </div>
    </Phantom>
  );
}
