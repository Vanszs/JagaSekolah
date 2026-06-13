// Logika sync server-side - atomic (anti TOCTOU). Pure terhadap port DB.

export interface SyncItem {
  idempotencyKey: string;
  intervensiId?: string;
  siswaId: string;
  jenis: string;
  catatan: string;
  baseVersion: number;
}

export interface SyncItemResult {
  localId: string;
  status: "applied" | "conflict" | "rejected" | "duplicate";
  serverVersion?: number;
  message?: string;
}

/**
 * Port DB. Implementasi WAJIB atomic untuk mencegah TOCTOU:
 * - claimKey: INSERT idempotencyKey; return false jika sudah ada (unique violation).
 * - updateIntervensiIfVersion: UPDATE ... WHERE id AND version=base; return affected count.
 */
export interface SyncPort {
  /** Klaim key secara atomik. false = sudah pernah diproses (duplicate). */
  claimKey(key: string): Promise<boolean>;
  markKey(key: string, status: string, detail?: string): Promise<void>;
  exists(intervensiId: string): Promise<boolean>;
  createIntervensi(item: SyncItem): Promise<{ id: string; version: number }>;
  /** Atomic compare-and-set. Return version baru jika sukses, null jika versi tak cocok. */
  updateIntervensiIfVersion(
    id: string,
    base: number,
    item: SyncItem
  ): Promise<number | null>;
}

export async function applySyncItem(
  port: SyncPort,
  item: SyncItem
): Promise<SyncItemResult> {
  // Idempotency atomik: klaim dulu. Jika gagal -> sudah pernah diproses.
  const claimed = await port.claimKey(item.idempotencyKey);
  if (!claimed) {
    return { localId: item.idempotencyKey, status: "duplicate", message: "Sudah diproses." };
  }

  try {
    if (item.intervensiId) {
      if (!(await port.exists(item.intervensiId))) {
        await port.markKey(item.idempotencyKey, "rejected", "tidak ditemukan");
        return { localId: item.idempotencyKey, status: "rejected", message: "Tidak ditemukan." };
      }
      const newVersion = await port.updateIntervensiIfVersion(
        item.intervensiId,
        item.baseVersion,
        item
      );
      if (newVersion === null) {
        await port.markKey(item.idempotencyKey, "conflict", `base v${item.baseVersion}`);
        return {
          localId: item.idempotencyKey,
          status: "conflict",
          message: "Data telah diubah pengguna lain.",
        };
      }
      await port.markKey(item.idempotencyKey, "applied");
      return { localId: item.idempotencyKey, status: "applied", serverVersion: newVersion };
    }

    const created = await port.createIntervensi(item);
    await port.markKey(item.idempotencyKey, "applied");
    return { localId: item.idempotencyKey, status: "applied", serverVersion: created.version };
  } catch (e) {
    await port.markKey(item.idempotencyKey, "error", String(e).slice(0, 200));
    return { localId: item.idempotencyKey, status: "rejected", message: "Gagal diproses." };
  }
}

export async function applySyncBatch(
  port: SyncPort,
  items: SyncItem[]
): Promise<SyncItemResult[]> {
  // Item independen & claimKey atomik (unique constraint) -> aman diproses paralel.
  return Promise.all(items.map((item) => applySyncItem(port, item)));
}
