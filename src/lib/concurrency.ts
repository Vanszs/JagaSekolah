/** Bagi array jadi potongan ukuran size. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Mutex in-process (fallback untuk SQLite/single-instance).
const locks = new Map<string, Promise<unknown>>();

/**
 * Jalankan fn secara serial untuk key tertentu (mutex in-process).
 * Mencegah race recompute (invariant isLatest) di single-instance.
 * Multi-instance Postgres: kombinasikan dgn partial unique index (sudah ada)
 * yang menjadi hard-constraint di level DB.
 */
export async function withSerialLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  locks.set(
    key,
    prev.then(() => next)
  );
  await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === next) locks.delete(key);
  }
}

