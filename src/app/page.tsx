import type { Metadata } from "next";
import { MotionProvider } from "@/components/landing/motion";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import MengapaPenting from "@/components/landing/MengapaPenting";
import FaktorRisiko from "@/components/landing/FaktorRisiko";
import CaraKerja from "@/components/landing/CaraKerja";
import PetaIndonesia from "@/components/landing/PetaIndonesia";
import DashboardPreview from "@/components/landing/DashboardPreview";
import KeamananData from "@/components/landing/KeamananData";
import Dampak from "@/components/landing/Dampak";
import FAQ from "@/components/landing/FAQ";
import CTAPenutup from "@/components/landing/CTAPenutup";

export const metadata: Metadata = {
  title: "JagaSekolah — Setiap Anak Berhak Tetap Sekolah",
  description:
    "Sistem peringatan dini putus sekolah: deteksi risiko lebih awal dari data yang ada, intervensi lebih cepat. Untuk wali kelas, sekolah, dan dinas pendidikan.",
};

export default function LandingPage() {
  return (
    <MotionProvider>
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col text-slate-700 selection:bg-[#005D4C] selection:text-white">
        <Navbar />
        <Hero />
        <MengapaPenting />
        <FaktorRisiko />
        <CaraKerja />
        <PetaIndonesia />
        <DashboardPreview />
        <KeamananData />
        <Dampak />
        <FAQ />
        <CTAPenutup />

        <footer className="bg-[#013A30] text-teal-100/80 py-10 border-t border-teal-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="font-display font-bold text-lg text-white">Jaga</span>
              <span className="font-display font-bold text-lg text-emerald-400">Sekolah</span>
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-teal-300/70">
              Sistem Peringatan Dini Putus Sekolah
            </p>
            <p className="text-xs text-teal-300/60">© 2026 JagaSekolah</p>
          </div>
        </footer>
      </div>
    </MotionProvider>
  );
}
