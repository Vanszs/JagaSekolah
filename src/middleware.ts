import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Proteksi semua route kecuali publik. Auth.js v5 middleware.
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Route publik (landing, login, auth & health API).
  // Catatan: halaman /dashboard/* di-gate oleh layout (Node runtime, auth()+redirect)
  // karena session callback memakai Prisma yang tidak andal di Edge middleware.
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health";

  if (isPublic) return NextResponse.next();

  // Belum login -> redirect ke /login (untuk halaman) atau 401 (untuk API)
  if (!req.auth?.user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Kecualikan aset statis Next + file publik (gambar/font) agar tidak kena proteksi.
  matcher: [
    "/((?!_next/static|_next/image|images/|geo/|favicon.ico|manifest.json|icons|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?|json|geojson)$).*)",
  ],
};
