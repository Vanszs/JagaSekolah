import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="id">
      <body className="font-sans antialiased bg-[#F8FAFC] text-zinc-800">
        {children}
      </body>
    </html>
  );
}
