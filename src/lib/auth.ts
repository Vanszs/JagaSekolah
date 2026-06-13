import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const CredsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 15 * 60 }, // 15 menit (short expiry)
  jwt: { maxAge: 15 * 60 },
  pages: { signIn: "/login" },
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: Role;
          sekolahId: string | null;
          wilayahId: string | null;
          kelasId: string | null;
          tokenVersion: number;
        };
        token.uid = u.id;
        token.role = u.role;
        token.sekolahId = u.sekolahId;
        token.wilayahId = u.wilayahId;
        token.kelasId = u.kelasId;
        token.tokenVersion = u.tokenVersion;
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
