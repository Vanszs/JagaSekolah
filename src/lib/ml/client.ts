// Klien HTTP robust ke service ML (FASE 2, opsional).
//
// Robust = TIDAK PERNAH melempar & TIDAK PERNAH menggantung app:
//  - AbortController timeout (default 800ms) — request lambat dibatalkan, bukan menunggu.
//  - Retry terbatas dengan backoff (default 1x) — hanya untuk error transient.
//  - Circuit breaker — bila service berturut gagal, "buka" sirkuit & langsung fallback
//    selama cooldown, supaya recompute massal tidak menunggu service yang sedang sakit.
//  - Validasi Zod ketat — respons tak valid diperlakukan sebagai gagal (fallback ke rule).
//  - Semua jalur mengembalikan MlClientResult (union ok/!ok), bukan throw.
//
// Semua dependency (fetch, clock, env, breaker) di-inject agar bisa diuji tanpa
// network/DB/timer nyata.

import {
  MlPredictionSchema,
  type MlClientResult,
  type MlFeaturePayload,
} from "@/lib/ml/types";

/** Port fetch minimal — cukup untuk testing dengan stub. */
export type FetchPort = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface MlClientConfig {
  baseUrl: string | undefined; // ML_SERVICE_URL; undefined => disabled
  timeoutMs: number;
  maxRetries: number; // jumlah percobaan ULANG (0 = sekali tembak)
  retryBackoffMs: number;
  fetchImpl: FetchPort;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
  breaker: CircuitBreaker;
}

/**
 * Circuit breaker sederhana 3-state (closed → open → half-open).
 * Stateful, tetapi murni (clock di-inject) → mudah diuji.
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(
    private readonly threshold = 3,
    private readonly cooldownMs = 30_000,
    private readonly now: () => number = Date.now
  ) {}

  /** true bila request harus dilewati (sirkuit terbuka & masih cooldown). */
  isOpen(): boolean {
    if (this.failures < this.threshold) return false;
    // Sudah lewat cooldown? → half-open: izinkan 1 percobaan.
    if (this.now() - this.openedAt >= this.cooldownMs) return false;
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
  }

  recordFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) this.openedAt = this.now();
  }
}

function envNumber(key: string, fallback: number): number {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Breaker singleton proses (dibagi antar request di runtime Node). */
const defaultBreaker = new CircuitBreaker(
  envNumber("ML_BREAKER_THRESHOLD", 3),
  envNumber("ML_BREAKER_COOLDOWN_MS", 30_000)
);

/** Konfigurasi default dari env + global fetch. */
export function defaultMlConfig(overrides: Partial<MlClientConfig> = {}): MlClientConfig {
  return {
    baseUrl: process.env.ML_SERVICE_URL?.trim() || undefined,
    timeoutMs: envNumber("ML_TIMEOUT_MS", 800),
    maxRetries: Math.max(0, Math.floor(envNumber("ML_MAX_RETRIES", 1))),
    retryBackoffMs: envNumber("ML_RETRY_BACKOFF_MS", 120),
    fetchImpl: globalThis.fetch as unknown as FetchPort,
    now: Date.now,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    breaker: defaultBreaker,
    ...overrides,
  };
}

/** True bila lapis ML aktif (URL diset). Dipakai pemanggil untuk skip total. */
export function isMlEnabled(cfg: MlClientConfig = defaultMlConfig()): boolean {
  return !!cfg.baseUrl;
}

/**
 * Satu kali tembak ke /predict dengan timeout. Membedakan jenis kegagalan
 * agar pemanggil tahu mana yang layak di-retry (network/timeout) vs tidak.
 */
async function attempt(
  url: string,
  payload: MlFeaturePayload,
  cfg: MlClientConfig
): Promise<MlClientResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const started = cfg.now();
  try {
    const res = await cfg.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, reason: "http_error", detail: `HTTP ${res.status}` };
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return { ok: false, reason: "invalid_response", detail: "JSON parse gagal" };
    }
    const parsed = MlPredictionSchema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, reason: "invalid_response", detail: parsed.error.message };
    }
    return { ok: true, prediction: parsed.data, latencyMs: cfg.now() - started };
  } catch (err) {
    // AbortError => timeout; selain itu => masalah jaringan.
    const aborted = err instanceof Error && err.name === "AbortError";
    return aborted
      ? { ok: false, reason: "timeout" }
      : { ok: false, reason: "network", detail: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

const RETRYABLE = new Set(["timeout", "network"]);

/**
 * Panggil service ML untuk satu siswa. NEVER-THROWS.
 * Urutan: disabled? → circuit open? → attempt (+retry transient) → record breaker.
 */
export async function predictRemote(
  payload: MlFeaturePayload,
  cfg: MlClientConfig = defaultMlConfig()
): Promise<MlClientResult> {
  if (!cfg.baseUrl) return { ok: false, reason: "disabled" };
  if (cfg.breaker.isOpen()) return { ok: false, reason: "circuit_open" };

  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/predict`;
  let last: MlClientResult = { ok: false, reason: "network" };

  for (let i = 0; i <= cfg.maxRetries; i++) {
    last = await attempt(url, payload, cfg);
    if (last.ok) {
      cfg.breaker.recordSuccess();
      return last;
    }
    // Jangan retry untuk error non-transient (http_error/invalid_response).
    if (!RETRYABLE.has(last.reason)) break;
    if (i < cfg.maxRetries) await cfg.sleep(cfg.retryBackoffMs * (i + 1));
  }

  cfg.breaker.recordFailure();
  return last;
}
