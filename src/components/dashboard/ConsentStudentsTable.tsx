"use client";

import type { ConsentStatus } from "@prisma/client";
import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface ConsentStudentRow {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  status: ConsentStatus;
}

const STATUS_META: Record<ConsentStatus, { label: string; cls: string; dot: string }> = {
  granted: { label: "Disetujui", cls: "text-emerald-600", dot: "bg-emerald-500" },
  pending: { label: "Menunggu", cls: "text-amber-600", dot: "bg-amber-500" },
  revoked: { label: "Dicabut", cls: "text-red-600", dot: "bg-red-500" },
};

const RANK: Record<ConsentStatus, number> = { pending: 0, revoked: 1, granted: 2 };

export function ConsentStudentsTable({ rows }: { rows: ConsentStudentRow[] }) {
  const columns: Column<ConsentStudentRow>[] = [
    { key: "nama", header: "Nama", sortValue: (r) => r.nama, truncate: true },
    { key: "nisn", header: "NISN", cell: (r) => <span className="tabular-nums text-slate-500">{r.nisn}</span> },
    { key: "kelas", header: "Kelas", sortValue: (r) => r.kelas },
    {
      key: "status",
      header: "Status persetujuan",
      sortValue: (r) => RANK[r.status],
      cell: (r) => {
        const m = STATUS_META[r.status];
        return (
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${m.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
            {m.label}
          </span>
        );
      },
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/siswa/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "status", dir: "asc" }}
      caption="Status persetujuan siswa"
      emptyText="Belum ada data siswa."
    />
  );
}
