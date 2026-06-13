import type { KategoriRisiko } from "@prisma/client";

/**
 * Sumber kebenaran tunggal untuk tampilan kategori risiko (label, warna).
 * Casing label konsisten di seluruh app: "Risiko Tinggi" / "Waspada" / "Aman".
 * `bar` untuk stacked-bar; `dot`/`text`/`ring`/`bg` untuk badge & list.
 */
export const RISK_CONFIG: Record<
  KategoriRisiko,
  { label: string; dot: string; bar: string; text: string; ring: string; bg: string }
> = {
  merah: { label: "Risiko Tinggi", dot: "bg-red-500", bar: "bg-red-500", text: "text-red-700", ring: "ring-red-600/20", bg: "bg-red-50" },
  kuning: { label: "Waspada", dot: "bg-amber-500", bar: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-600/20", bg: "bg-amber-50" },
  hijau: { label: "Aman", dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-600/20", bg: "bg-emerald-50" },
};
