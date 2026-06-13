"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export type ExportRow = Record<string, string | number>;

function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h] ?? "")).join(","));
  return lines.join("\n");
}

/** Tombol ekspor CSV sisi-klien (data agregat anonim sudah di-pass dari server). */
export function ExportButton({ rows, filename }: { rows: ExportRow[]; filename: string }) {
  const [done, setDone] = useState(false);

  function download() {
    const csv = toCsv(rows);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={download}
        disabled={rows.length === 0}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-[#005D4C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#004D40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Unduh CSV ({rows.length} baris)
      </button>
      <p role="status" aria-live="polite" className="text-sm text-slate-500">
        {done ? "Berkas diunduh." : "\u00A0"}
      </p>
    </div>
  );
}
