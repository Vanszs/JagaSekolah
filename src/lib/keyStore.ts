import { prisma } from "@/lib/db";
import { createDek, unwrapDek } from "@/lib/envelope";

// Cache DEK terbuka (id -> Buffer) agar tidak unwrap berulang.
const cache = new Map<string, Buffer>();

/** Ambil/seed DEK aktif. Mengembalikan {id, dek}. */
export async function getActiveDek(): Promise<{ id: string; dek: Buffer }> {
  let row = await prisma.encryptionKey.findFirst({ where: { aktif: true }, orderBy: { createdAt: "desc" } });
  if (!row) {
    const { dek, wrapped } = createDek();
    row = await prisma.encryptionKey.create({
      data: { wrappedKey: wrapped, masterKeyId: "mk-1", aktif: true },
    });
    cache.set(row.id, dek);
    return { id: row.id, dek };
  }
  let dek = cache.get(row.id);
  if (!dek) {
    const unwrapped = unwrapDek(row.wrappedKey);
    if (!unwrapped) throw new Error(`Gagal unwrap DEK ${row.id} (master key salah/rotasi).`);
    dek = unwrapped;
    cache.set(row.id, dek);
  }
  return { id: row.id, dek };
}

/** Ambil DEK berdasarkan id (untuk dekripsi record lama). */
export async function getDekById(id: string): Promise<Buffer | null> {
  const cached = cache.get(id);
  if (cached) return cached;
  const row = await prisma.encryptionKey.findUnique({ where: { id } });
  if (!row) return null;
  const dek = unwrapDek(row.wrappedKey);
  if (dek) cache.set(id, dek);
  return dek;
}
