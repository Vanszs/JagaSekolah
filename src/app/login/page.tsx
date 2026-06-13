import Link from "next/link";

export const metadata = { title: "Masuk — JagaSekolah" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200/60 shadow-xl p-8">
        <div className="flex items-center space-x-1 mb-6">
          <span className="font-display font-extrabold text-xl text-[#0F172A]">Jaga</span>
          <span className="font-display font-extrabold text-xl text-[#005D4C]">Sekolah</span>
        </div>
        <h1 className="font-display font-bold text-lg text-zinc-900 mb-1">Masuk</h1>
        <p className="text-sm text-zinc-500 mb-6">Untuk wali kelas, sekolah, dan dinas pendidikan.</p>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-zinc-600 mb-1">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" placeholder="nama@demo.test" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-zinc-600 mb-1">Kata Sandi</label>
            <input id="password" name="password" type="password" autoComplete="current-password" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-[#005D4C] hover:bg-[#004D40] text-white font-extrabold py-2.5 rounded-lg text-sm transition-all">
            Masuk
          </button>
        </form>

        <p className="text-xs text-zinc-400 mt-6 text-center">
          Halaman ini placeholder UI — integrasi Auth.js menyusul.{" "}
          <Link href="/" className="text-[#005D4C] font-bold">Kembali</Link>
        </p>
      </div>
    </main>
  );
}
