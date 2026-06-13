import * as XLSX from "xlsx";
import Papa from "papaparse";
import { mapHeaders, type InternalField } from "./columnMap";

export interface ParseResult {
  rows: Record<string, unknown>[];
  missing: InternalField[];
  totalRows: number;
}

/** Ubah matrix (array of array) -> rows objek pakai column mapping. */
function matrixToRows(matrix: unknown[][]): ParseResult {
  if (matrix.length === 0) {
    return { rows: [], missing: ["nisn", "nama", "kelas"], totalRows: 0 };
  }
  const headers = (matrix[0] as unknown[]).map((h) => String(h ?? ""));
  const { map, missing } = mapHeaders(headers);

  const rows: Record<string, unknown>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const raw = matrix[r] as unknown[];
    if (!raw || raw.every((c) => c === null || c === undefined || c === "")) continue;
    const obj: Record<string, unknown> = {};
    for (const [idxStr, field] of Object.entries(map)) {
      obj[field] = raw[Number(idxStr)];
    }
    rows.push(obj);
  }
  return { rows, missing, totalRows: rows.length };
}

/** Parse file Excel (xlsx/xls) dari buffer. */
export function parseExcel(buf: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], missing: ["nisn", "nama", "kelas"], totalRows: 0 };
  const ws = wb.Sheets[sheetName]!;
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
  return matrixToRows(matrix);
}

/** Parse file CSV dari string. */
export function parseCsv(text: string): ParseResult {
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return matrixToRows(result.data as unknown[][]);
}
