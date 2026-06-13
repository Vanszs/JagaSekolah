"use client";

import { SortableTable, type Column } from "@/components/dashboard/SortableTable";

export interface KelolaKelasRow {
  id: string;
  nama: string;
  jumlahSiswa: number;
  wali: string;
  adaWali: boolean;
}

export function KelolaKelasTable({ rows, sekolahId }: { rows: KelolaKelasRow[]; sekolahId: string }) {
  const columns: Column<KelolaKelasRow>[] = [
    { key: "nama", header: "Kelas", sortValue: (r) => r.nama },
    { key: "jumlah", header: "Jumlah siswa", sortValue: (r) => r.jumlahSiswa, align: "right", numeric: true },
    {
      key: "wali",
      header: "Wali kelas",
      sortValue: (r) => r.wali,
      cell: (r) => <span className={r.adaWali ? "text-slate-600" : "text-amber-600"}>{r.wali}</span>,
    },
  ];
  return (
    <SortableTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      hrefFor={(r) => `/dashboard/sekolah/${encodeURIComponent(sekolahId)}/kelas/${encodeURIComponent(r.id)}`}
      initialSort={{ key: "nama", dir: "asc" }}
      caption="Daftar kelas"
      emptyText="Belum ada kelas."
    />
  );
}
