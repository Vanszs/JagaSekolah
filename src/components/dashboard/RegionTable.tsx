import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RegionRisk } from "@/lib/analytics";
import { EmptyState } from "@/components/dashboard/ui";

/**
 * Tabel agregat wilayah/sekolah/kelas dgn baris yang bisa di-drill-down.
 * `hrefFor(row)` mengembalikan tujuan navigasi (atau null bila tak bisa).
 * `unit` = label kolom hitung sub (mis. "sekolah", "kelas").
 */
export function RegionTable({
  rows,
  hrefFor,
  firstColLabel,
  unitLabel,
}: {
  rows: RegionRisk[];
  hrefFor: (row: RegionRisk) => string | null;
  firstColLabel: string;
  unitLabel?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title="Belum ada data" desc="Data wilayah akan muncul setelah tersedia di lingkup ini." />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">{firstColLabel}</th>
              {unitLabel && <th scope="col" className="px-4 py-3 text-right font-medium">{unitLabel}</th>}
              <th scope="col" className="px-4 py-3 text-right font-medium">Tinggi</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Waspada</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Aman</th>
              <th scope="col" className="hidden px-4 py-3 text-left font-medium sm:table-cell">Komposisi</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const href = hrefFor(r);
              const total = r.total || 1;
              return (
                <tr key={r.id} className="group transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    {href ? (
                      <Link href={href} className="font-semibold text-slate-900 hover:text-[#005D4C]">
                        {r.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900">{r.label}</span>
                    )}
                    {r.sub && <span className="ml-2 text-xs text-slate-400">{r.sub}</span>}
                  </td>
                  {unitLabel && (
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{r.sekolah.toLocaleString("id-ID")}</td>
                  )}
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-red-600">{r.merah}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-amber-600">{r.kuning}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-emerald-600">{r.hijau}</td>
                  <td className="hidden px-4 py-3.5 sm:table-cell">
                    <span className="sr-only">
                      {r.merah} risiko tinggi, {r.kuning} waspada, {r.hijau} aman
                    </span>
                    <div className="flex h-2 w-32 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <div className="bg-red-500" style={{ width: `${(r.merah / total) * 100}%` }} />
                      <div className="bg-amber-500" style={{ width: `${(r.kuning / total) * 100}%` }} />
                      <div className="bg-emerald-500" style={{ width: `${(r.hijau / total) * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {href && (
                      <Link href={href} className="inline-flex items-center text-slate-300 group-hover:text-[#005D4C]" aria-label={`Buka ${r.label}`}>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
