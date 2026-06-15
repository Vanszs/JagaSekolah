"use client";

import type { Role } from "@prisma/client";
import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface UserRow {
  id: string;
  nama: string;
  email: string;
  role: Role;
  roleLabel: string;
  lingkup: string;
  aktif: boolean;
}

const ROLE_RING: Record<Role, string> = {
  superadmin: "bg-[#005D4C]/10 text-[#005D4C] ring-[#005D4C]/20",
  dinas: "bg-sky-50 text-sky-700 ring-sky-600/20",
  kepsek: "bg-violet-50 text-violet-700 ring-violet-600/20",
  guru: "bg-slate-100 text-slate-700 ring-slate-400/30",
  bk: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const columns: Column<UserRow>[] = [
    {
      key: "nama",
      header: "Nama",
      sortValue: (r) => r.nama,
      cell: (r) => (
        <span>
          {r.nama}
          <span className="block text-xs text-slate-400">{r.email}</span>
        </span>
      ),
      truncate: true,
    },
    {
      key: "role",
      header: "Peran",
      sortValue: (r) => r.role,
      cell: (r) => <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_RING[r.role]}`}>{r.roleLabel}</span>,
    },
    { key: "lingkup", header: "Lingkup", sortValue: (r) => r.lingkup, cell: (r) => <span className="text-slate-600">{r.lingkup}</span>, truncate: true },
    {
      key: "aktif",
      header: "Status",
      sortValue: (r) => (r.aktif ? 1 : 0),
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <span className={`h-1.5 w-1.5 rounded-full ${r.aktif ? "bg-emerald-500" : "bg-slate-400"}`} aria-hidden="true" />
          {r.aktif ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      initialSort={{ key: "role", dir: "asc" }}
      caption="Daftar pengguna"
      emptyText="Belum ada pengguna."
    />
  );
}
