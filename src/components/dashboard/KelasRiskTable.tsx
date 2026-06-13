"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { RegionRisk } from "@/lib/analytics";

/** Tabel risiko per kelas (kepsek). Drill ke roster /dashboard/sekolah/[id]/kelas/[kelasId]. */
export function KelasRiskTable({ rows, sekolahId }: { rows: RegionRisk[]; sekolahId: string }) {
  const columns: Column<RegionRisk>[] = [
    { key: "label", header: "Kelas", sortValue: (r) => r.label },
    { key: "total", header: "Siswa", sortValue: (r) => r.total, align: "right", numeric: true },
    { key: "merah", header: "Tinggi", sortValue: (r) => r.merah, align: "right", numeric: true, cell: (r) => <span className="font-medium text-red-600">{r.merah}</span> },
    { key: "kuning", header: "Waspada", sortValue: (r) => r.kuning, align: "right", numeric: true, cell: (r) => <span className="text-amber-600">{r.kuning}</span> },
    { key: "hijau", header: "Aman", sortValue: (r) => r.hijau, align: "right", numeric: true, cell: (r) => <span className="text-emerald-600">{r.hijau}</span> },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/sekolah/${encodeURIComponent(sekolahId)}/kelas/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "merah", dir: "desc" }}
      caption="Risiko per kelas"
      emptyText="Belum ada kelas."
    />
  );
}
