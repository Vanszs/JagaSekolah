import { z } from "zod";
import type { Role } from "@prisma/client";

/**
 * Logika inti Auth.js yang MURNI & dapat diuji unit — tanpa Prisma/bcrypt langsung.
 * Dependensi (lookup user, compare hash) di-inject lewat "port" agar deterministik
 * dan tidak butuh DB. auth.ts membungkus ini dengan implementasi nyata.
 */

export const CredsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Bentuk minimal User yang dibutuhkan logika auth. */
export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: Role;
  sekolahId: string | null;
  wilayahId: string | null;
  kelasId: string | null;
  tokenVersion: number;
  aktif: boolean;
  passwordHash: string;
}

/** Hasil authorize yang dipakai NextAuth (subset + tokenVersion). */
export interface AuthorizedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  sekolahId: string | null;
  wilayahId: string | null;
  kelasId: string | null;
  tokenVersion: number;
}

export interface AuthPorts {
  findUserByEmail: (email: string) => Promise<AuthUser | null>;
  findUserById: (id: string) => Promise<Pick<AuthUser, "tokenVersion" | "aktif"> | null>;
  comparePassword: (plain: string, hash: string) => Promise<boolean>;
}

/** Validasi kredensial + verifikasi hash. Return null bila gagal (uniform). */
export async function authorizeCredentials(
  raw: unknown,
  ports: Pick<AuthPorts, "findUserByEmail" | "comparePassword">,
): Promise<AuthorizedUser | null> {
  const parsed = CredsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await ports.findUserByEmail(email);
  if (!user || !user.aktif) return null;

  const ok = await ports.comparePassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.nama,
    email: user.email,
    role: user.role,
    sekolahId: user.sekolahId ?? null,
    wilayahId: user.wilayahId ?? null,
    kelasId: user.kelasId ?? null,
    tokenVersion: user.tokenVersion,
  };
}

/**
 * Guard signIn untuk OAuth Google: hanya email yang sudah di-provisioning
 * (User aktif) yang boleh masuk. Credentials selalu lolos (sudah divalidasi
 * di authorizeCredentials). Return true | false | redirect-url.
 */
export async function signInGuard(
  args: { provider: string | undefined; email: string | null | undefined },
  ports: Pick<AuthPorts, "findUserByEmail">,
): Promise<boolean | string> {
  if (args.provider !== "google") return true;
  const email = args.email?.toLowerCase();
  if (!email) return false;
  const existing = await ports.findUserByEmail(email);
  if (!existing || !existing.aktif) return "/login?error=AccessDenied";
  return true;
}

export interface JwtToken {
  uid?: string;
  role?: Role;
  sekolahId?: string | null;
  wilayahId?: string | null;
  kelasId?: string | null;
  tokenVersion?: number;
  [k: string]: unknown;
}

/** Field user yang mungkin dibawa NextAuth ke jwt callback. */
export type JwtUserInput = Partial<AuthorizedUser> & { email?: string | null };

/**
 * Isi token JWT dari user. Credentials membawa role lengkap; OAuth tidak ->
 * lengkapi dari DB via email. Bila user undefined -> token tidak berubah.
 */
export async function enrichJwt(
  token: JwtToken,
  user: JwtUserInput | undefined,
  ports: Pick<AuthPorts, "findUserByEmail">,
): Promise<JwtToken> {
  if (!user) return token;
  if (user.role) {
    token.uid = user.id;
    token.role = user.role;
    token.sekolahId = user.sekolahId ?? null;
    token.wilayahId = user.wilayahId ?? null;
    token.kelasId = user.kelasId ?? null;
    token.tokenVersion = user.tokenVersion;
    return token;
  }
  if (user.email) {
    const dbUser = await ports.findUserByEmail(user.email.toLowerCase());
    if (dbUser) {
      token.uid = dbUser.id;
      token.role = dbUser.role;
      token.sekolahId = dbUser.sekolahId ?? null;
      token.wilayahId = dbUser.wilayahId ?? null;
      token.kelasId = dbUser.kelasId ?? null;
      token.tokenVersion = dbUser.tokenVersion;
    }
  }
  return token;
}

export interface SessionUserShape {
  id: string;
  role: Role;
  sekolahId: string | null;
  wilayahId: string | null;
  kelasId: string | null;
}

/**
 * Bangun identitas session.user dari token, DENGAN revocation check:
 * token valid hanya bila user masih aktif & tokenVersion cocok.
 * Bila dicabut -> identitas dikosongkan (id="", role="guru", tenant null).
 * Return null bila token tanpa uid (tak perlu ubah).
 */
export async function buildSessionUser(
  token: JwtToken,
  ports: Pick<AuthPorts, "findUserById">,
): Promise<SessionUserShape | null> {
  if (!token.uid) return null;
  const u = await ports.findUserById(token.uid);
  const valid = !!u && u.aktif && u.tokenVersion === token.tokenVersion;
  if (valid) {
    return {
      id: token.uid,
      role: (token.role as Role) ?? "guru",
      sekolahId: token.sekolahId ?? null,
      wilayahId: token.wilayahId ?? null,
      kelasId: token.kelasId ?? null,
    };
  }
  // Dicabut / nonaktif / versi berubah -> kosongkan identitas tenant.
  return { id: "", role: "guru", sekolahId: null, wilayahId: null, kelasId: null };
}
