"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { ProvinceAttendance } from "@/lib/analytics";

/** Tabel kehadiran per provinsi (agregat). Drill ke /dashboard/wilayah/[provinsi]. */
export function AttendanceProvinceTable({ rows }: { rows: ProvinceAttendance[] }) {
  const columns: Column<ProvinceAttendance>[] = [
    { key: "provinsi", header: "Provinsi", sortValue: (r) => r.provinsi },
    {
      key: "hadir",
      header: "% Hadir",
      sortValue: (r) => r.pctHadir,
      align: "right",
      numeric: true,
      cell: (r) => <span className={r.pctHadir >= 90 ? "text-emerald-600" : r.pctHadir >= 80 ? "text-amber-600" : "font-medium text-red-600"}>{r.pctHadir}%</span>,
    },
    {
      key: "alpa",
      header: "% Alpa",
      sortValue: (r) => r.pctAlpa,
      align: "right",
      numeric: true,
      cell: (r) => <span className={r.pctAlpa <= 5 ? "text-emerald-600" : r.pctAlpa <= 10 ? "text-amber-600" : "font-medium text-red-600"}>{r.pctAlpa}%</span>,
    },
    { key: "total", header: "Rekap", sortValue: (r) => r.total, align: "right", numeric: true },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.provinsi}
      hrefFor={(r) => `/dashboard/wilayah/${encodeURIComponent(r.provinsi)}`}
      initialSort={{ key: "alpa", dir: "desc" }}
      caption="Kehadiran antarprovinsi"
      emptyText="Belum ada data kehadiran."
    />
  );
}
