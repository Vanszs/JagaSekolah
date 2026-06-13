import { getActiveDek, getDekById } from "@/lib/keyStore";
import { encryptWithDek, decryptWithDek } from "@/lib/envelope";

export interface SiswaPII {
  statusEkonomi?: string | null;
  statusKeluarga?: string | null;
  statusOrtu?: string | null;
}

export interface EncodedPII {
  statusEkonomiEnc: string | null;
  statusKeluargaEnc: string | null;
  statusOrtuEnc: string | null;
  dekId: string;
}

/** Enkripsi PII dengan DEK aktif (envelope). Mengembalikan kolom + dekId. */
export async function encodePII(pii: SiswaPII): Promise<EncodedPII> {
  const { id, dek } = await getActiveDek();
  return {
    statusEkonomiEnc: encryptWithDek(dek, pii.statusEkonomi),
    statusKeluargaEnc: encryptWithDek(dek, pii.statusKeluarga),
    statusOrtuEnc: encryptWithDek(dek, pii.statusOrtu),
    dekId: id,
  };
}

/** Dekripsi PII memakai DEK record (dekId). */
export async function decodePII(row: {
  dekId?: string | null;
  statusEkonomiEnc?: string | null;
  statusKeluargaEnc?: string | null;
  statusOrtuEnc?: string | null;
}): Promise<SiswaPII> {
  if (!row.dekId) return { statusEkonomi: null, statusKeluarga: null, statusOrtu: null };
  const dek = await getDekById(row.dekId);
  if (!dek) return { statusEkonomi: null, statusKeluarga: null, statusOrtu: null };
  return {
    statusEkonomi: decryptWithDek(dek, row.statusEkonomiEnc),
    statusKeluarga: decryptWithDek(dek, row.statusKeluargaEnc),
    statusOrtu: decryptWithDek(dek, row.statusOrtuEnc),
  };
}
