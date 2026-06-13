import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";
import {
  authorizeCredentials,
  signInGuard,
  enrichJwt,
  buildSessionUser,
  type AuthPorts,
  type JwtToken,
} from "@/lib/authCore";

// Port nyata: Prisma + bcrypt. Logika di authCore.ts (diuji unit).
const ports: AuthPorts = {
  findUserByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }) as Promise<
      Awaited<ReturnType<AuthPorts["findUserByEmail"]>>
    >,
  findUserById: (id) =>
    prisma.user.findUnique({ where: { id }, select: { tokenVersion: true, aktif: true } }),
  comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
};

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
      authorize: (raw) => authorizeCredentials(raw, ports),
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
    signIn: ({ user, account, profile }) =>
      signInGuard(
        {
          provider: account?.provider,
          email: user.email ?? (profile?.email as string | undefined),
          // Google mengirim email_verified di profile OIDC.
          emailVerified: (profile?.email_verified as boolean | undefined) ?? null,
        },
        ports,
      ),
    jwt: ({ token, user }) =>
      enrichJwt(token as JwtToken, user as Parameters<typeof enrichJwt>[1], ports),
    async session({ session, token }) {
      const built = await buildSessionUser(token as JwtToken, ports);
      if (built && session.user) {
        session.user.id = built.id;
        session.user.role = built.role as Role;
        session.user.sekolahId = built.sekolahId;
        session.user.wilayahId = built.wilayahId;
        session.user.provinsi = built.provinsi;
        session.user.kelasId = built.kelasId;
      }
      return session;
    },
  },
});
