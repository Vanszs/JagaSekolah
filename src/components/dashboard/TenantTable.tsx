"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";
import type { SchoolRow } from "@/lib/analytics";

const pctMerah = (r: SchoolRow) => {
  const t = r.merah + r.kuning + r.hijau;
  return t > 0 ? Math.round((r.merah / t) * 100) : 0;
};

/** Tabel tenant/sekolah diperkaya: komposisi risiko + status + drill-down. */
export function TenantTable({ rows }: { rows: SchoolRow[] }) {
  const columns: Column<SchoolRow>[] = [
    {
      key: "nama",
      header: "Sekolah",
      sortValue: (r) => r.nama,
      cell: (r) => (
        <span>
          {r.nama}
          <span className="ml-2 font-mono text-xs text-slate-400">NPSN {r.npsn}</span>
        </span>
      ),
    },
    { key: "wilayah", header: "Wilayah", sortValue: (r) => r.provinsi, cell: (r) => <span className="text-slate-600">{r.kabupaten}, {r.provinsi}</span> },
    { key: "siswa", header: "Siswa", sortValue: (r) => r.siswa, align: "right", numeric: true },
    { key: "pengguna", header: "Pengguna", sortValue: (r) => r.pengguna, align: "right", numeric: true },
    {
      key: "risiko",
      header: "Komposisi risiko",
      cell: (r) => {
        const t = r.merah + r.kuning + r.hijau;
        if (t === 0) return <span className="text-xs text-slate-400">Belum dihitung</span>;
        return (
          <span className="inline-flex items-center gap-2">
            <span className="sr-only">Tinggi {r.merah}, waspada {r.kuning}, aman {r.hijau}</span>
            <span aria-hidden="true" className="flex h-2 w-28 overflow-hidden rounded-full bg-slate-100">
              {r.merah > 0 && <span className="bg-red-500" style={{ width: `${(r.merah / t) * 100}%` }} />}
              {r.kuning > 0 && <span className="bg-amber-500" style={{ width: `${(r.kuning / t) * 100}%` }} />}
              {r.hijau > 0 && <span className="bg-emerald-500" style={{ width: `${(r.hijau / t) * 100}%` }} />}
            </span>
          </span>
        );
      },
    },
    { key: "pct", header: "% Tinggi", sortValue: pctMerah, align: "right", numeric: true, cell: (r) => `${pctMerah(r)}%` },
    {
      key: "status",
      header: "Status",
      sortValue: (r) => (r.aktif ? 1 : 0),
      cell: (r) =>
        r.aktif ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Aktif</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-400/20"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />Belum aktif</span>
        ),
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/sekolah/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "siswa", dir: "desc" }}
      caption="Daftar sekolah/tenant"
      emptyText="Belum ada sekolah."
    />
  );
}
