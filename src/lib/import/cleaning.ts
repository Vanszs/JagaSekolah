import { z } from "zod";

/** Skema 1 baris siswa hasil import (setelah column mapping). */
const SiswaRowSchema = z.object({
  nisn: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "NISN harus 6-12 digit angka"),
  nama: z.string().trim().min(1, "Nama kosong"),
  kelas: z.string().trim().min(1, "Kelas kosong"),
  jenisKelamin: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || v === "L" || v === "P", "Jenis kelamin harus L/P")
    .optional(),
  statusEkonomi: z.string().trim().optional(),
  penerimaKip: z
    .union([z.boolean(), z.string()])
    .transform((v) => {
      if (typeof v === "boolean") return v;
      const s = v.trim().toLowerCase();
      return s === "1" || s === "ya" || s === "true" || s === "y";
    })
    .optional(),
  jarakKm: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "number" ? v : parseFloat(v.replace(",", "."))))
    .refine((v) => !Number.isNaN(v) && v >= 0, "Jarak tidak valid")
    .optional(),
  statusKeluarga: z.string().trim().optional(),
});

export type SiswaRow = z.infer<typeof SiswaRowSchema>;

export interface CleaningResult {
  valid: SiswaRow[];
  errors: { row: number; issues: string[] }[];
  duplikatNisn: string[];
}

/**
 * Validasi & bersihkan baris. Baris invalid TIDAK menggagalkan seluruh import,
 * tapi dikumpulkan ke `errors` (laporan ke pengguna).
 */
export function cleanRows(rows: Record<string, unknown>[]): CleaningResult {
  const valid: SiswaRow[] = [];
  const errors: CleaningResult["errors"] = [];
  const seen = new Set<string>();
  const duplikatNisn: string[] = [];

  rows.forEach((raw, idx) => {
    const parsed = SiswaRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        row: idx + 2, // +2: header + 1-index
        issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      return;
    }
    const r = parsed.data;
    if (seen.has(r.nisn)) {
      duplikatNisn.push(r.nisn);
      errors.push({ row: idx + 2, issues: [`NISN duplikat: ${r.nisn}`] });
      return;
    }
    seen.add(r.nisn);
    valid.push(r);
  });

  return { valid, errors, duplikatNisn };
}
