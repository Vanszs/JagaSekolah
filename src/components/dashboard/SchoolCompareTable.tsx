"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { RegionRisk } from "@/lib/analytics";

const pctMerah = (r: RegionRisk) => (r.total > 0 ? Math.round((r.merah / r.total) * 100) : 0);

/** Tabel perbandingan sekolah (agregat). Drill ke /dashboard/sekolah/[id]. */
export function SchoolCompareTable({ rows }: { rows: RegionRisk[] }) {
  const columns: Column<RegionRisk>[] = [
    { key: "label", header: "Sekolah", sortValue: (r) => r.label },
    { key: "sub", header: "NPSN", cell: (r) => <span className="text-xs text-slate-400">{r.sub?.replace("NPSN ", "") ?? "—"}</span> },
    { key: "total", header: "Siswa", sortValue: (r) => r.total, align: "right", numeric: true },
    { key: "merah", header: "Tinggi", sortValue: (r) => r.merah, align: "right", numeric: true, cell: (r) => <span className="font-medium text-red-600">{r.merah}</span> },
    { key: "kuning", header: "Waspada", sortValue: (r) => r.kuning, align: "right", numeric: true, cell: (r) => <span className="text-amber-600">{r.kuning}</span> },
    { key: "hijau", header: "Aman", sortValue: (r) => r.hijau, align: "right", numeric: true, cell: (r) => <span className="text-emerald-600">{r.hijau}</span> },
    { key: "pct", header: "% Tinggi", sortValue: pctMerah, align: "right", numeric: true, cell: (r) => `${pctMerah(r)}%` },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/sekolah/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "merah", dir: "desc" }}
      caption="Perbandingan sekolah di wilayah"
      emptyText="Belum ada sekolah di wilayah ini."
    />
  );
}
