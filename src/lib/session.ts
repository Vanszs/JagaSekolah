import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthError, type TenantContext } from "@/lib/rbac";

/** Ambil konteks tenant dari session, atau lempar 401. */
export async function requireContext(): Promise<TenantContext> {
  const session: Session | null = await auth();
  if (!session?.user?.id) throw new AuthError(401, "Tidak terautentikasi atau sesi dicabut.");
  return {
    userId: session.user.id,
    role: session.user.role,
    sekolahId: session.user.sekolahId,
    wilayahId: session.user.wilayahId,
    kelasId: session.user.kelasId,
  };
}

/**
 * Versi untuk halaman dashboard (Server Component): bila sesi tidak ada /
 * kedaluwarsa / dicabut, ALIHKAN ke /login secara mulus alih-alih melempar
 * error 401 yang memunculkan error page. Robust terhadap race expiry antara
 * render layout dan render page.
 *
 * Catatan: redirect() melempar error kontrol-alur Next, jadi TIDAK boleh
 * dipanggil di dalam try/catch (akan tertelan). Kita tangkap 401 jadi sentinel
 * null dulu, lalu redirect() di luar blok try.
 */
export async function requireDashboardContext(next = "/dashboard"): Promise<TenantContext> {
  let ctx: TenantContext | null = null;
  try {
    ctx = await requireContext();
  } catch (e) {
    if (!(e instanceof AuthError && e.code === 401)) throw e;
    // ctx tetap null -> redirect di luar try.
  }
  if (!ctx) redirect(`/login?next=${encodeURIComponent(next)}`);
  return ctx;
}
