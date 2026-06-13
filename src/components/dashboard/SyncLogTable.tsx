"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface SyncLogRow {
  id: string;
  waktu: string; // ISO
  sekolah: string;
  status: string;
  idempotencyKey: string;
  detail: string;
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "success";
  const cls = ok
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    : status === "pending"
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : "bg-red-50 text-red-700 ring-red-600/20";
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>{status}</span>;
}

export function SyncLogTable({ rows }: { rows: SyncLogRow[] }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const columns: Column<SyncLogRow>[] = [
    { key: "waktu", header: "Waktu", sortValue: (r) => r.waktu, cell: (r) => <span className="tabular-nums">{fmt(r.waktu)}</span> },
    { key: "sekolah", header: "Sekolah", sortValue: (r) => r.sekolah },
    { key: "status", header: "Status", sortValue: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    { key: "key", header: "Kunci Idempoten", cell: (r) => <span className="font-mono text-xs text-slate-400">{r.idempotencyKey.slice(0, 16)}…</span> },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: "waktu", dir: "desc" }}
      caption="Riwayat sinkronisasi"
      emptyText="Belum ada transaksi sinkronisasi."
    />
  );
}
