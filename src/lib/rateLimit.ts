// Rate-limit in-memory untuk single-instance.
// Multi-instance (REDIS_URL) belum didukung — lihat getRateLimiter().

export interface RateLimiter {
  /** true jika DIBLOKIR (melebihi limit). */
  hit(key: string): Promise<boolean>;
}

class InMemoryLimiter implements RateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  constructor(private max: number, private windowMs: number) {}
  async hit(key: string): Promise<boolean> {
    const now = Date.now();
    const b = this.buckets.get(key);
    if (!b || now > b.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }
    b.count++;
    return b.count > this.max;
  }
}

let singleton: RateLimiter | null = null;

function getRateLimiter(): RateLimiter {
  if (singleton) return singleton;
  const max = Number(process.env.RATE_LIMIT_MAX ?? 30);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  // Multi-instance butuh limiter bersama (Redis). Belum diimplementasi:
  // gagal cepat alih-alih diam-diam pakai in-memory (yang bocor antar instance).
  if (process.env.REDIS_URL) {
    throw new Error(
      "RATE_LIMIT: REDIS_URL di-set tetapi RedisLimiter belum diimplementasi. " +
        "Hapus REDIS_URL untuk mode single-instance (in-memory)."
    );
  }
  singleton = new InMemoryLimiter(max, windowMs);
  return singleton;
}

/** Helper: lempar AuthError-like via boolean. Pemanggil tangani 429. */
export async function checkRateLimit(key: string): Promise<boolean> {
  return getRateLimiter().hit(key);
}
