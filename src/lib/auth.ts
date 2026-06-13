import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const CredsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 15 * 60 }, // 15 menit (short expiry)
  jwt: { maxAge: 15 * 60 },
  pages: { signIn: "/login" },
  // Logger: kegagalan kredensial (password salah / field kosong) adalah hal
  // NORMAL — turunkan jadi 1 baris warning, jangan cetak stack trace yang
  // membuatnya terlihat seperti crash. Error lain tetap dicetak penuh.
  logger: {
    error(error: Error) {
      if (error.name === "CredentialsSignin" || error.name === "CallbackRouteError") {
        console.warn("[auth] Login gagal: kredensial tidak cocok.");
        return;
      }
      console.error("[auth]", error);
    },
    warn() {},
    debug() {},
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = CredsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.aktif) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
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
      },
    }),
    // Google OAuth — hanya aktif bila kredensial diset di env.
    // Keamanan: akun TIDAK dibuat otomatis; hanya email yang sudah
    // di-provisioning admin (User aktif) yang boleh masuk.
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials sudah divalidasi di authorize().
      if (account?.provider !== "google") return true;
      // Google: izinkan hanya bila email cocok dengan User aktif yang sudah ada.
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing || !existing.aktif) {
        // Tolak — arahkan ke halaman login dengan pesan.
        return "/login?error=AccessDenied";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as Partial<{
          id: string;
          role: Role;
          sekolahId: string | null;
          wilayahId: string | null;
          kelasId: string | null;
          tokenVersion: number;
        }>;
        // Credentials membawa field lengkap; OAuth (Google) tidak —
        // ambil dari DB berdasarkan email untuk melengkapi role + tenant.
        if (u.role) {
          token.uid = u.id;
          token.role = u.role;
          token.sekolahId = u.sekolahId ?? null;
          token.wilayahId = u.wilayahId ?? null;
          token.kelasId = u.kelasId ?? null;
          token.tokenVersion = u.tokenVersion;
        } else if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          if (dbUser) {
            token.uid = dbUser.id;
            token.role = dbUser.role;
            token.sekolahId = dbUser.sekolahId ?? null;
            token.wilayahId = dbUser.wilayahId ?? null;
            token.kelasId = dbUser.kelasId ?? null;
            token.tokenVersion = dbUser.tokenVersion;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Revocation: token invalid bila user nonaktif / tokenVersion berubah.
      if (token.uid) {
        const u = await prisma.user.findUnique({
          where: { id: token.uid as string },
          select: { tokenVersion: true, aktif: true },
        });
        if (u && u.aktif && u.tokenVersion === token.tokenVersion && session.user) {
          session.user.id = token.uid as string;
          session.user.role = token.role as Role;
          session.user.sekolahId = (token.sekolahId as string | null) ?? null;
          session.user.wilayahId = (token.wilayahId as string | null) ?? null;
          session.user.kelasId = (token.kelasId as string | null) ?? null;
        } else {
          // sesi dicabut: kosongkan identitas tenant
          if (session.user) {
            session.user.id = "";
            session.user.role = "guru";
            session.user.sekolahId = null;
            session.user.wilayahId = null;
            session.user.kelasId = null;
          }
        }
      }
      return session;
    },
  },
});
