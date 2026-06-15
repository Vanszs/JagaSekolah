"use client";

import { Suspense, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginWithCredentials, loginWithGoogle } from "./actions";

const ERRORS: Record<string, string> = {
  CredentialsSignin: "Email atau kata sandi salah.",
  AccessDenied: "Email ini belum terdaftar di JagaSekolah. Hubungi admin sekolah Anda — pendaftaran tidak dilakukan lewat Google.",
  EmailNotVerified: "Email Google Anda belum terverifikasi. Verifikasi dulu di akun Google Anda.",
  default: "Terjadi kesalahan saat masuk. Coba lagi.",
};

function errMsg(code: string | null | undefined): string {
  if (!code) return ERRORS.default!;
  return ERRORS[code] ?? ERRORS.default!;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-md bg-[#005D4C] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,93,76,0.15)] transition-all hover:bg-[#004D40] hover:shadow-[0_4px_16px_rgba(0,93,76,0.22)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span aria-live="polite">Memproses…</span>
        </>
      ) : (
        <>
          Masuk
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-hidden="true" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
      )}
      Lanjutkan dengan Google
    </button>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("next") || params.get("callbackUrl") || "/dashboard";
  const urlError = params.get("error");

  const [showPw, setShowPw] = useState(false);
  const [error, formAction] = useActionState(loginWithCredentials, urlError ? errMsg(urlError) : null);

  return (
    <div className="w-full max-w-sm">
      {/* Brand (mobile only — desktop shows it on the left panel) */}
      <Link href="/" className="mb-8 inline-flex items-center gap-0.5 lg:hidden">
        <span className="font-display text-xl font-bold text-[#0F172A]">Jaga</span>
        <span className="font-display text-xl font-bold text-[#005D4C]">Sekolah</span>
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">Masuk ke akun Anda</h1>
      <p className="mt-1.5 text-sm text-slate-600">Untuk wali kelas, sekolah, dan dinas pendidikan.</p>

      {/* Google OAuth */}
      <form action={loginWithGoogle} className="mt-8">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <GoogleButton />
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
        <span className="text-xs text-slate-400">atau dengan email</span>
        <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      </div>

      {error && (
        <p
          id="login-error"
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-900">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@sekolah.sch.id"
            aria-describedby={error ? "login-error" : undefined}
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-900">Kata sandi</label>
            <Link href="/lupa-sandi" className="text-xs font-medium text-[#005D4C] hover:underline underline-offset-2">
              Lupa sandi?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              aria-describedby={error ? "login-error" : undefined}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-1 rounded-r-md"
              aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <SubmitButton />
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Belum punya akses?{" "}
        <Link href="/#cta" className="font-medium text-[#005D4C] hover:underline underline-offset-2">
          Ajukan untuk sekolah Anda
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#005D4C] p-12 lg:flex">
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:28px_28px]"
          aria-hidden="true"
        />
        <Link href="/" className="relative inline-flex items-center gap-0.5">
          <span className="font-display text-xl font-bold text-white">Jaga</span>
          <span className="font-display text-xl font-bold text-emerald-300">Sekolah</span>
        </Link>

        <blockquote className="relative max-w-md">
          <p className="font-display text-2xl font-medium leading-snug text-white text-balance">
            &ldquo;Dengan deteksi dini, kami bisa bertindak jauh sebelum seorang anak benar-benar
            berhenti sekolah.&rdquo;
          </p>
          <footer className="mt-5 flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-display font-bold text-emerald-200 ring-1 ring-white/20"
              aria-hidden="true"
            >
              W
            </span>
            <span className="text-sm">
              <span className="block font-semibold text-white">Wali Kelas</span>
              <span className="block text-emerald-200/80">SMP di daerah 3T · skenario ilustratif</span>
            </span>
          </footer>
        </blockquote>

        <p className="relative font-mono text-[11px] uppercase tracking-wide text-emerald-200/70">
          Sistem Peringatan Dini Putus Sekolah
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-white px-6 py-8 sm:px-12">
        <div className="flex-1" />
        <div className="flex justify-center">
          <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-slate-100" />}>
            <LoginForm />
          </Suspense>
        </div>
        <div className="flex-1" />
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 self-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
