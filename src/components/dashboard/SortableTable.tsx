"use client";

import { useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  /** Kunci unik kolom. */
  key: string;
  header: string;
  /** Nilai untuk sorting (number/string). Jika tak diberi, kolom tak bisa di-sort. */
  sortValue?: (row: T) => number | string;
  /** Render sel; default tampilkan sortValue. */
  cell?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Angka → pakai tabular-nums. */
  numeric?: boolean;
}

interface SortableTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Jika diberi, kolom pertama tiap baris jadi tautan drill-down. */
  hrefFor?: (row: T) => string;
  /** Sort awal: key kolom + arah. */
  initialSort?: { key: string; dir: "asc" | "desc" };
  caption?: string;
  emptyText?: string;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

/** Tabel data sortable & aksesibel (aria-sort, keyboard, zebra). */
export function SortableTable<T>({
  rows,
  columns,
  rowKey,
  hrefFor,
  initialSort,
  caption,
  emptyText = "Belum ada data.",
}: SortableTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return rows.toSorted((a, b) => {
      const av = sv(a);
      const bv = sv(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "id-ID");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const ariaSort = !col.sortValue
                ? undefined
                : active
                  ? sort?.dir === "asc"
                    ? "ascending"
                    : "descending"
                  : "none";
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={ariaSort}
                  className={`px-4 py-3 font-medium text-slate-600 ${alignClass[col.align ?? "left"]}`}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 rounded transition-colors hover:text-[#005D4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] ${col.align === "right" ? "flex-row-reverse" : ""}`}
                    >
                      {col.header}
                      {active ? (
                        sort?.dir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((row) => {
            const href = hrefFor?.(row);
            return (
              <tr key={rowKey(row)} className="bg-white transition-colors hover:bg-[#005D4C]/[0.03]">
                {columns.map((col, ci) => {
                  const content = col.cell ? col.cell(row) : col.sortValue ? String(col.sortValue(row)) : null;
                  const base = `px-4 py-3 ${alignClass[col.align ?? "left"]} ${col.numeric ? "tabular-nums" : ""}`;
                  if (href && ci === 0) {
                    return (
                      <td key={col.key} className={`${base} font-medium`}>
                        <Link
                          href={href}
                          className="text-[#0F172A] hover:text-[#005D4C] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C]"
                        >
                          {content}
                        </Link>
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className={`${base} ${ci === 0 ? "font-medium text-slate-900" : "text-slate-600"}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
