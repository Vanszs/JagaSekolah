// Pemetaan alias kolom -> field internal.
// Tahan terhadap perbedaan penamaan kolom ekspor Dapodik antar versi/sekolah.

export type InternalField =
  | "nisn"
  | "nama"
  | "kelas"
  | "jenisKelamin"
  | "statusEkonomi"
  | "penerimaKip"
  | "jarakKm"
  | "statusKeluarga";

/** Alias (lowercase, tanpa spasi ganda) -> field internal. */
const COLUMN_ALIASES: Record<string, InternalField> = {
  nisn: "nisn",
  "no induk": "nisn",
  "nomor induk": "nisn",
  nis: "nisn",
  nama: "nama",
  "nama siswa": "nama",
  "nama lengkap": "nama",
  "nama peserta didik": "nama",
  kelas: "kelas",
  rombel: "kelas",
  "rombongan belajar": "kelas",
  "jenis kelamin": "jenisKelamin",
  jk: "jenisKelamin",
  "l/p": "jenisKelamin",
  "status ekonomi": "statusEkonomi",
  "ekonomi": "statusEkonomi",
  kip: "penerimaKip",
  "penerima kip": "penerimaKip",
  "penerima pip": "penerimaKip",
  jarak: "jarakKm",
  "jarak km": "jarakKm",
  "jarak ke sekolah": "jarakKm",
  "status keluarga": "statusKeluarga",
  "status orang tua": "statusKeluarga",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Bangun peta index kolom -> field internal dari baris header.
 * Mengembalikan juga daftar field internal yang tidak ditemukan.
 */
export function mapHeaders(headers: string[]): {
  map: Record<number, InternalField>;
  missing: InternalField[];
} {
  const map: Record<number, InternalField> = {};
  const found = new Set<InternalField>();

  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    const field = COLUMN_ALIASES[key];
    if (field) {
      map[i] = field;
      found.add(field);
    }
  });

  const required: InternalField[] = ["nisn", "nama", "kelas"];
  const missing = required.filter((f) => !found.has(f));
  return { map, missing };
}
