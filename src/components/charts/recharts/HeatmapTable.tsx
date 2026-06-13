"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface HeatmapRow {
  /** Label baris (mis. nama provinsi). */
  label: string;
  /** Nilai per kolom, urut sesuai `columns`. */
  values: number[];
}

/**
 * Tabel heatmap: sel diwarnai berdasarkan intensitas nilai. Aksesibel —
 * setiap sel menampilkan ANGKA (warna hanya penegas, bukan satu-satunya sinyal).
 * Dipakai mis. untuk Δ merah bulan-ke-bulan per provinsi, atau matriks faktor.
 *
 * Mode "delta": nilai positif = memburuk (merah), negatif = membaik (hijau).
 * Mode "intensity": makin besar makin pekat (teal).
 */
export function HeatmapTable({
  columns,
  rows,
  mode = "intensity",
  rowHeader = "Wilayah",
  caption,
}: {
  columns: string[];
  rows: HeatmapRow[];
  mode?: "intensity" | "delta";
  rowHeader?: string;
  caption?: string;
}) {
  const allVals = rows.flatMap((r) => r.values);
  const maxAbs = Math.max(1, ...allVals.map((v) => Math.abs(v)));

  function cellStyle(v: number): { bg: string; fg: string } {
    const t = Math.min(1, Math.abs(v) / maxAbs); // 0..1 intensitas
    const alpha = (0.08 + t * 0.5).toFixed(3);
    if (mode === "delta") {
      if (v > 0) return { bg: `rgba(239,68,68,${alpha})`, fg: "#7f1d1d" }; // memburuk
      if (v < 0) return { bg: `rgba(16,185,129,${alpha})`, fg: "#064e3b" }; // membaik
      return { bg: "transparent", fg: "#475569" };
    }
    return { bg: `rgba(0,93,76,${alpha})`, fg: t > 0.6 ? "#ffffff" : "#0F172A" };
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-medium text-slate-600">{rowHeader}</th>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-3 text-right font-medium text-slate-600">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-slate-100">
              <th scope="row" className="px-4 py-2.5 text-left font-medium text-slate-900">{r.label}</th>
              {r.values.map((v, i) => {
                const { bg, fg } = cellStyle(v);
                return (
                  <td key={`${r.label}-${columns[i] ?? i}`} className="px-3 py-2.5 text-right tabular-nums" style={{ backgroundColor: bg, color: fg }}>
                    <span className="inline-flex items-center justify-end gap-1">
                      {mode === "delta" && v !== 0 && (
                        v > 0 ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      )}
                      {mode === "delta" && v === 0 && <Minus className="h-3 w-3 text-slate-400" aria-hidden="true" />}
                      {mode === "delta" && v > 0 ? `+${v}` : v}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
