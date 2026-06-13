"use client";

import Link from "next/link";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-[#F8FAFC] px-6 text-center">
      <p className="text-sm font-medium text-slate-400">Terjadi kesalahan</p>
      <h1 className="mt-2 font-display text-xl font-bold text-[#0F172A]">
        Halaman tidak dapat dimuat
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-600">
        Sesi Anda mungkin telah berakhir, atau terjadi gangguan sesaat. Coba muat ulang atau masuk kembali.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[#005D4C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#004D40] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
        >
          Coba lagi
        </button>
        <Link
          href="/login?next=/dashboard"
          className="text-sm font-medium text-[#005D4C] hover:underline underline-offset-2"
        >
          Masuk kembali
        </Link>
      </div>
    </main>
  );
}
