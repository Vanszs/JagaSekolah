import type { Metadata } from "next";
import { Lexend, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@aejkatappaja/phantom-ui/ssr.css";

// Font di-self-host oleh Next (next/font) — tanpa FOUT, tanpa @import jaringan.
// Display: Lexend · Body: Source Sans 3 · Mono: JetBrains Mono.
const fontDisplay = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JagaSekolah — Sistem Peringatan Dini Putus Sekolah",
  description:
    "Deteksi risiko putus sekolah lebih awal dari data yang ada, intervensi lebih cepat. Untuk wali kelas, sekolah, dan dinas pendidikan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="font-sans antialiased bg-[#F8FAFC] text-zinc-800">
        {children}
      </body>
    </html>
  );
}
