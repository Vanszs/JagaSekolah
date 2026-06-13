"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface AcademicProvinceRow {
  provinsi: string;
  rataRata: number;
  pctTuntas: number;
}

/** Tabel akademik per provinsi (agregat). Drill ke /dashboard/wilayah/[provinsi]. */
export function AcademicProvinceTable({ rows }: { rows: AcademicProvinceRow[] }) {
  const columns: Column<AcademicProvinceRow>[] = [
    { key: "provinsi", header: "Provinsi", sortValue: (r) => r.provinsi },
    { key: "rata", header: "Rata-rata nilai", sortValue: (r) => r.rataRata, align: "right", numeric: true },
    {
      key: "tuntas",
      header: "% Tuntas KKM",
      sortValue: (r) => r.pctTuntas,
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className={r.pctTuntas >= 75 ? "text-emerald-600" : r.pctTuntas >= 50 ? "text-amber-600" : "font-medium text-red-600"}>
          {r.pctTuntas}%
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
      initialSort={{ key: "rata", dir: "asc" }}
      caption="Capaian akademik antarprovinsi"
      emptyText="Belum ada data nilai."
    />
  );
}
