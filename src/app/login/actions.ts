"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

/**
 * Server Action login kredensial (pola resmi NextAuth v5).
 * Mengembalikan pesan error untuk ditampilkan; sukses -> redirect (lempar NEXT_REDIRECT).
 */
export async function loginWithCredentials(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
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

/** Server Action login Google. */
export async function loginWithGoogle(formData: FormData): Promise<void> {
  const callbackUrl = String(formData.get("callbackUrl") || "/dashboard");
  await signIn("google", { redirectTo: callbackUrl });
}
