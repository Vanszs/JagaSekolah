// Set env BEFORE import so singleton picks them up
process.env.RATE_LIMIT_MAX = "3";
process.env.RATE_LIMIT_WINDOW_MS = "200";
delete process.env.REDIS_URL;

import { describe, it } from "node:test";
import { expect } from "./_expect";
import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  it("returns false (not limited) for first N calls within max", async () => {
    const key = "test-under-limit-" + Date.now();
    // max=3, so calls 1,2,3 should NOT be blocked
    expect(await checkRateLimit(key)).toBe(false);
    expect(await checkRateLimit(key)).toBe(false);
    expect(await checkRateLimit(key)).toBe(false);
  });

  it("returns true (limited) once max is exceeded for same key", async () => {
    const key = "test-over-limit-" + Date.now();
    // exhaust 3 allowed
    await checkRateLimit(key);
    await checkRateLimit(key);
    await checkRateLimit(key);
    // 4th call should be blocked
    expect(await checkRateLimit(key)).toBe(true);
    // 5th also blocked
    expect(await checkRateLimit(key)).toBe(true);
  });

  it("different keys are independent", async () => {
    const keyA = "test-indep-A-" + Date.now();
    const keyB = "test-indep-B-" + Date.now();
    // exhaust keyA
    await checkRateLimit(keyA);
    await checkRateLimit(keyA);
    await checkRateLimit(keyA);
    expect(await checkRateLimit(keyA)).toBe(true); // blocked

    // keyB still has full budget
    expect(await checkRateLimit(keyB)).toBe(false);
    expect(await checkRateLimit(keyB)).toBe(false);
    expect(await checkRateLimit(keyB)).toBe(false);
    expect(await checkRateLimit(keyB)).toBe(true); // now blocked
  });

  it("resets after window expires", async () => {
    const key = "test-reset-" + Date.now();
    // exhaust
    await checkRateLimit(key);
    await checkRateLimit(key);
    await checkRateLimit(key);
    expect(await checkRateLimit(key)).toBe(true);

    // wait for window to expire (200ms + buffer)
    await new Promise((r) => setTimeout(r, 250));

    // should be reset — first call in new window
    expect(await checkRateLimit(key)).toBe(false);
  });

  it("boundary: exactly at max is not blocked, max+1 is blocked", async () => {
    const key = "test-boundary-" + Date.now();
    // 1st, 2nd, 3rd → count=1,2,3 → all ≤ max(3) → false
    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimit(key)).toBe(false);
    }
    // 4th → count=4 > 3 → true
    expect(await checkRateLimit(key)).toBe(true);
  });
});
