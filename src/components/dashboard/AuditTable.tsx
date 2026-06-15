"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface AuditRow {
  id: string;
  waktu: string; // ISO
  waktuLabel: string;
  pengguna: string;
  peran: string;
  aksi: string;
  target: string;
  ip: string;
}

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  const columns: Column<AuditRow>[] = [
    { key: "waktu", header: "Waktu", sortValue: (r) => r.waktu, cell: (r) => <span className="whitespace-nowrap tabular-nums text-slate-500">{r.waktuLabel}</span> },
    {
      key: "pengguna",
      header: "Pengguna",
      sortValue: (r) => r.pengguna,
      cell: (r) => (
        <span>
          {r.pengguna}
          <span className="block text-xs text-slate-400">{r.peran}</span>
        </span>
      ),
    },
    { key: "aksi", header: "Aktivitas", sortValue: (r) => r.aksi, cell: (r) => <span className="text-slate-700">{r.aksi}</span> },
    { key: "target", header: "Target", cell: (r) => <span className="font-mono text-xs text-slate-500">{r.target}</span>, truncate: true },
    { key: "ip", header: "IP", cell: (r) => <span className="font-mono text-xs text-slate-400">{r.ip}</span>, truncate: true },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: "waktu", dir: "desc" }}
      caption="Jejak audit"
      emptyText="Belum ada aktivitas."
    />
  );
}
