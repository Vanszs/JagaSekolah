"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { ConsentSchoolRow } from "@/lib/analytics";

/** Tabel kepatuhan consent per sekolah (agregat). */
export function ConsentSchoolTable({ rows }: { rows: ConsentSchoolRow[] }) {
  const columns: Column<ConsentSchoolRow>[] = [
    { key: "nama", header: "Sekolah", sortValue: (r) => r.nama },
    { key: "granted", header: "Disetujui", sortValue: (r) => r.granted, align: "right", numeric: true, cell: (r) => <span className="text-emerald-600">{r.granted}</span> },
    { key: "pending", header: "Menunggu", sortValue: (r) => r.pending, align: "right", numeric: true, cell: (r) => <span className="text-amber-600">{r.pending}</span> },
    { key: "revoked", header: "Dicabut", sortValue: (r) => r.revoked, align: "right", numeric: true, cell: (r) => <span className="text-red-600">{r.revoked}</span> },
    {
      key: "pct",
      header: "Kepatuhan",
      sortValue: (r) => r.pctGranted,
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className="inline-flex items-center justify-end gap-2">
          <span aria-hidden="true" className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:inline-block">
            <span className={`block h-full rounded-full ${r.pctGranted >= 75 ? "bg-emerald-500" : r.pctGranted >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.pctGranted}%` }} />
          </span>
          <span className={r.pctGranted >= 75 ? "text-emerald-600" : r.pctGranted >= 40 ? "text-amber-600" : "font-medium text-red-600"}>{r.pctGranted}%</span>
        </span>
      ),
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/sekolah/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "pct", dir: "asc" }}
      caption="Kepatuhan consent per sekolah"
      emptyText="Belum ada data."
    />
  );
}
