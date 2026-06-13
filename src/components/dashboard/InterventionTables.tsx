"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { ProvinceCoverage } from "@/lib/analytics";

/** Tabel cakupan intervensi per provinsi (agregat). Drill ke /dashboard/wilayah/[provinsi]. */
export function CoverageProvinceTable({ rows }: { rows: ProvinceCoverage[] }) {
  const columns: Column<ProvinceCoverage>[] = [
    { key: "provinsi", header: "Provinsi", sortValue: (r) => r.provinsi },
    { key: "berisiko", header: "Berisiko", sortValue: (r) => r.berisiko, align: "right", numeric: true },
    { key: "diintervensi", header: "Diintervensi", sortValue: (r) => r.diintervensi, align: "right", numeric: true },
    {
      key: "pct",
      header: "Cakupan",
      sortValue: (r) => r.pct,
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className="inline-flex items-center justify-end gap-2">
          <span aria-hidden="true" className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:inline-block">
            <span
              className={`block h-full rounded-full ${r.pct >= 75 ? "bg-emerald-500" : r.pct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${r.pct}%` }}
            />
          </span>
          <span className={r.pct >= 75 ? "text-emerald-600" : r.pct >= 40 ? "text-amber-600" : "font-medium text-red-600"}>{r.pct}%</span>
        </span>
      ),
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.provinsi}
      hrefFor={(r) => `/dashboard/wilayah/${encodeURIComponent(r.provinsi)}`}
      initialSort={{ key: "pct", dir: "asc" }}
      caption="Cakupan intervensi antarprovinsi"
      emptyText="Belum ada data intervensi."
    />
  );
}
