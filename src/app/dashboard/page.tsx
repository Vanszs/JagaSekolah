import Link from "next/link";

export const metadata = { title: "Dashboard — JagaSekolah" };

const demo = [
  { nama: "Ahmad Fauzi", kelas: "VIII-A", kategori: "merah", skor: 78 },
  { nama: "Siti Nurhaliza", kelas: "VIII-A", kategori: "kuning", skor: 45 },
  { nama: "Budi Santoso", kelas: "VIII-B", kategori: "hijau", skor: 12 },
];

const warna: Record<string, string> = {
  merah: "bg-red-100 text-red-700 border-red-200",
  kuning: "bg-amber-100 text-amber-700 border-amber-200",
  hijau: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="font-display font-extrabold text-lg text-[#0F172A]">Jaga</span>
            <span className="font-display font-extrabold text-lg text-[#005D4C]">Sekolah</span>
            <span className="ml-3 text-xs font-mono uppercase tracking-wider text-zinc-400">Dashboard Demo</span>
          </div>
          <Link href="/" className="text-sm font-bold text-[#005D4C]">Keluar</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Risiko Merah", val: 1, c: "text-red-600" },
            { label: "Risiko Kuning", val: 1, c: "text-amber-600" },
            { label: "Aman (Hijau)", val: 1, c: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-zinc-200/60 p-5">
              <div className={`font-display font-extrabold text-3xl ${s.c}`}>{s.val}</div>
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-display font-bold text-zinc-900">Daftar Siswa Berisiko</h2>
            <p className="text-xs text-zinc-500">Data demo — terhubung ke API /api/siswa saat integrasi.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3 font-bold">Nama</th>
                <th className="text-left px-5 py-3 font-bold">Kelas</th>
                <th className="text-left px-5 py-3 font-bold">Risiko</th>
                <th className="text-right px-5 py-3 font-bold">Skor</th>
              </tr>
            </thead>
            <tbody>
              {demo.map((s) => (
                <tr key={s.nama} className="border-t border-zinc-100">
                  <td className="px-5 py-3 font-semibold text-zinc-800">{s.nama}</td>
                  <td className="px-5 py-3 text-zinc-600">{s.kelas}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${warna[s.kategori]}`}>{s.kategori}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-800">{s.skor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-400 mt-6">
          Placeholder UI — backend (16 API routes) sudah siap dihubungkan.
        </p>
      </div>
    </main>
  );
}
