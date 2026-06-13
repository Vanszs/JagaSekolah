"use client";

import type { Role } from "@prisma/client";
import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface SchoolUserRow {
  id: string;
  nama: string;
  email: string;
  role: Role;
  kelas: string;
  aktif: boolean;
}

const ROLE_LABEL: Record<string, string> = { guru: "Wali Kelas", bk: "Guru BK" };

export function SchoolUsersTable({ rows }: { rows: SchoolUserRow[] }) {
  const columns: Column<SchoolUserRow>[] = [
    { key: "nama", header: "Nama", sortValue: (r) => r.nama },
    { key: "email", header: "Email", cell: (r) => <span className="text-slate-500">{r.email}</span> },
    {
      key: "role",
      header: "Peran",
      sortValue: (r) => r.role,
      cell: (r) => <span className="inline-flex rounded-md bg-[#005D4C]/10 px-2 py-0.5 text-xs font-medium text-[#005D4C]">{ROLE_LABEL[r.role] ?? r.role}</span>,
    },
    { key: "kelas", header: "Kelas", sortValue: (r) => r.kelas },
    {
      key: "aktif",
      header: "Status",
      sortValue: (r) => (r.aktif ? 1 : 0),
      cell: (r) =>
        r.aktif ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />Aktif</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden="true" />Nonaktif</span>
        ),
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: "nama", dir: "asc" }}
      caption="Pengguna sekolah"
      emptyText="Belum ada akun guru/BK. Tambahkan di bawah."
    />
  );
}
