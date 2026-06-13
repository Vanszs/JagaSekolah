"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";

/**
 * Server Action login kredensial (pola resmi NextAuth v5).
 *
 * Server action = endpoint POST publik. Bila pemanggil SUDAH terautentikasi,
 * tak ada gunanya memproses login lagi — langsung arahkan ke dashboard. Ini
 * sekaligus memenuhi prinsip "verifikasi sesi pemanggil lebih dulu".
 * Untuk pemanggil anonim (kasus normal login), lanjut ke verifikasi kredensial.
 *
 * Mengembalikan pesan error untuk ditampilkan; sukses -> redirect (lempar NEXT_REDIRECT).
 */
export async function loginWithCredentials(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");
  try {
    await signIn("credentials", {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      redirectTo: callbackUrl,
    });
    return null;
  } catch (err) {
    if (err instanceof AuthError) {
      return err.type === "CredentialsSignin"
        ? "Email atau kata sandi salah."
        : "Terjadi kesalahan saat masuk. Coba lagi.";
    }
    // signIn melempar redirect saat sukses -> teruskan agar navigasi terjadi.
    throw err;
  }
}

/** Server Action login Google. Pemanggil yang sudah login langsung diarahkan. */
export async function loginWithGoogle(formData: FormData): Promise<void> {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");
  await signIn("google", { redirectTo: callbackUrl });
}
