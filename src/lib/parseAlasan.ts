/**
 * Parser tunggal untuk `Risiko.alasanJson`.
 *
 * Bentuk tersimpan: `{ alasan: AlasanItem[], saran: string[] }` di mana
 * AlasanItem = { kode, pesan, bobot } (lihat src/lib/scoring/types.ts).
 *
 * UI hanya butuh teks: kita ekstrak `pesan` dari tiap alasan. Tetap toleran
 * bila alasan tersimpan sebagai string biasa (kompatibilitas data lama).
 */
export interface ParsedAlasan {
  alasan: string[];
  saran: string[];
}

function toMessage(x: unknown): string | null {
  if (typeof x === "string") return x;
  if (x && typeof x === "object" && "pesan" in x) {
    const pesan = (x as { pesan?: unknown }).pesan;
    if (typeof pesan === "string") return pesan;
  }
  return null;
}

export function parseAlasan(json: string): ParsedAlasan {
  try {
    const p = JSON.parse(json) as { alasan?: unknown; saran?: unknown };
    const alasan = Array.isArray(p.alasan)
      ? p.alasan.map(toMessage).filter((s): s is string => s !== null)
      : [];
    const saran = Array.isArray(p.saran)
      ? p.saran.filter((s): s is string => typeof s === "string")
      : [];
    return { alasan, saran };
  } catch {
    return { alasan: [], saran: [] };
  }
}
