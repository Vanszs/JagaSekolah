import Phantom from "@/components/Phantom";

/** Skeleton saat /dashboard/admin/users/baru memuat data. */
export default function Loading() {
  return (
    <>
      <p className="mb-5 text-sm font-medium text-slate-500">← Manajemen User</p>
      <Phantom loading>
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A]">Tambah Pengguna</h1>
          <div className="mt-6 max-w-2xl space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-sm font-medium text-slate-700">Label</p>
                <div className="h-10 rounded-md border border-slate-200 bg-slate-50" />
              </div>
            ))}
          </div>
        </div>
      </Phantom>
    </>
  );
}
