import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  CircuitBreaker,
  predictRemote,
  type FetchPort,
  type MlClientConfig,
} from "@/lib/ml/client";
import { FEATURE_VERSION, type MlFeaturePayload } from "@/lib/ml/types";

const PAYLOAD: MlFeaturePayload = {
  featureVersion: FEATURE_VERSION,
  features: {
    pctAbsen: 40, alpaBeruntun: 3, trenAbsensiMemburuk: 1, telatKronis: 0,
    catatanDisiplin: 0, partisipasiRendah: 1, pctTugasTidakKumpul: 20,
    nilaiTurun: 10, mapelDiBawahKkm: 2, pernahTinggalKelas: 0,
    nilaiIntiRendah: 1, faktorEkonomi: 1, jarakJauh: 0, keluargaRentan: 0,
  },
};

function cfg(over: Partial<MlClientConfig>): MlClientConfig {
  return {
    baseUrl: "http://ml.test",
    timeoutMs: 800,
    maxRetries: 1,
    retryBackoffMs: 0,
    fetchImpl: (() => Promise.reject(new Error("not set"))) as unknown as FetchPort,
    now: () => 1000,
    sleep: () => Promise.resolve(),
    breaker: new CircuitBreaker(3, 30_000, () => 1000),
    ...over,
  };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: () => Promise.resolve(body) });
}

const okBody = { probabilitas: 0.72, modelVersion: "test-1", kategori: "merah" };

describe("ml client — graceful failure contract", () => {
  it("disabled when no baseUrl", async () => {
    const r = await predictRemote(PAYLOAD, cfg({ baseUrl: undefined }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("disabled");
  });

  it("returns ok + validated prediction on success", async () => {
    const r = await predictRemote(PAYLOAD, cfg({ fetchImpl: (() => jsonResponse(okBody)) as unknown as FetchPort }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prediction.probabilitas).toBe(0.72);
      expect(r.prediction.modelVersion).toBe("test-1");
    }
  });

  it("invalid response (prob out of range) → invalid_response, never throws", async () => {
    const bad = { probabilitas: 1.8, modelVersion: "x" };
    const r = await predictRemote(PAYLOAD, cfg({ fetchImpl: (() => jsonResponse(bad)) as unknown as FetchPort }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_response");
  });

  it("NaN probability rejected by Zod (.finite)", async () => {
    const bad = { probabilitas: Number.NaN, modelVersion: "x" };
    const r = await predictRemote(PAYLOAD, cfg({ fetchImpl: (() => jsonResponse(bad)) as unknown as FetchPort }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invalid_response");
  });

  it("http error is NOT retried", async () => {
    let calls = 0;
    const r = await predictRemote(
      PAYLOAD,
      cfg({
        maxRetries: 3,
        fetchImpl: (() => {
          calls++;
          return jsonResponse({}, false, 500);
        }) as unknown as FetchPort,
      })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("http_error");
    expect(calls).toBe(1); // no retry on non-transient
  });

  it("network error IS retried up to maxRetries", async () => {
    let calls = 0;
    const r = await predictRemote(
      PAYLOAD,
      cfg({
        maxRetries: 2,
        fetchImpl: (() => {
          calls++;
          return Promise.reject(new Error("ECONNREFUSED"));
        }) as unknown as FetchPort,
      })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("network");
    expect(calls).toBe(3); // 1 + 2 retries
  });

  it("timeout (AbortError) → timeout reason", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" });
    const r = await predictRemote(
      PAYLOAD,
      cfg({ maxRetries: 0, fetchImpl: (() => Promise.reject(abortErr)) as unknown as FetchPort })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("timeout");
  });
});

describe("circuit breaker", () => {
  it("opens after threshold failures, short-circuits, then half-opens after cooldown", async () => {
    let clock = 1000;
    const breaker = new CircuitBreaker(2, 5000, () => clock);
    let calls = 0;
    const failing = cfg({
      breaker,
      maxRetries: 0,
      now: () => clock,
      fetchImpl: (() => {
        calls++;
        return Promise.reject(new Error("down"));
      }) as unknown as FetchPort,
    });

    await predictRemote(PAYLOAD, failing); // fail 1
    await predictRemote(PAYLOAD, failing); // fail 2 → opens
    expect(calls).toBe(2);

    // Circuit open → next call short-circuits without hitting fetch.
    const blocked = await predictRemote(PAYLOAD, failing);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("circuit_open");
    expect(calls).toBe(2); // unchanged

    // After cooldown → half-open, fetch attempted again.
    clock += 6000;
    await predictRemote(PAYLOAD, failing);
    expect(calls).toBe(3);
  });

  it("success resets the breaker", async () => {
    let clock = 1000;
    const breaker = new CircuitBreaker(2, 5000, () => clock);
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false); // 1 < 2
    breaker.recordSuccess();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false); // reset → 1 again
  });
});
