import NextAuth from "next-auth";

/**
 * Instance Auth.js KHUSUS MIDDLEWARE (Edge runtime).
 *
 * Middleware tidak boleh menyentuh Prisma (PrismaClientValidationError di Edge ->
 * JWTSessionError -> sesi terbaca null -> redirect login tiap pindah halaman).
 * Instance ini hanya MEN-DEKODE cookie JWT (pakai AUTH_SECRET yang sama dengan
 * instance penuh di auth.ts), tanpa lookup DB. Cukup untuk middleware menentukan
 * "ada sesi atau tidak". Pengecekan revocation/tokenVersion yang otoritatif tetap
 * dilakukan instance penuh (Node runtime) di layout & route handler.
 */
export const { auth: authEdge } = NextAuth({
  session: { strategy: "jwt", maxAge: 15 * 60 },
  jwt: { maxAge: 15 * 60 },
  providers: [],
  callbacks: {
    // Token-only (tanpa DB): cukup hidrasi id agar req.auth.user terisi saat
    // cookie JWT valid.
    session({ session, token }) {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
      }
      return session;
    },
  },
});
