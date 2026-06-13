import assert from "node:assert/strict";

// Shim `expect` minimal di atas node:assert — agar test tetap ekspresif
// tanpa dependency eksternal (vitest dihapus demi skor supply-chain).

interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeNull(): void;
  toBeGreaterThan(n: number): void;
  toBeGreaterThanOrEqual(n: number): void;
  toBeLessThanOrEqual(n: number): void;
  toHaveLength(n: number): void;
  toContain(item: unknown): void;
  toMatch(re: RegExp): void;
  toThrow(expected?: unknown): void;
}

function makeMatchers(received: unknown, negate: boolean): Matchers {
  const ok = (cond: boolean, msg: string) => {
    if (negate ? cond : !cond) assert.fail(msg);
  };
  return {
    toBe(expected) {
      ok(Object.is(received, expected), `expected ${fmt(received)} ${negate ? "not " : ""}to be ${fmt(expected)}`);
    },
    toEqual(expected) {
      let equal = true;
      try {
        assert.deepStrictEqual(received, expected);
      } catch {
        equal = false;
      }
      ok(equal, `expected ${fmt(received)} ${negate ? "not " : ""}to equal ${fmt(expected)}`);
    },
    toBeNull() {
      ok(received === null, `expected ${fmt(received)} ${negate ? "not " : ""}to be null`);
    },
    toBeGreaterThan(n) {
      ok(typeof received === "number" && received > n, `expected ${fmt(received)} > ${n}`);
    },
    toBeGreaterThanOrEqual(n) {
      ok(typeof received === "number" && received >= n, `expected ${fmt(received)} >= ${n}`);
    },
    toBeLessThanOrEqual(n) {
      ok(typeof received === "number" && received <= n, `expected ${fmt(received)} <= ${n}`);
    },
    toHaveLength(n) {
      const len = (received as { length?: number })?.length;
      ok(len === n, `expected length ${len} ${negate ? "not " : ""}to be ${n}`);
    },
    toContain(item) {
      const arr = received as unknown[] | string;
      ok(Array.isArray(arr) ? arr.includes(item) : String(arr).includes(String(item)),
        `expected ${fmt(received)} ${negate ? "not " : ""}to contain ${fmt(item)}`);
    },
    toMatch(re) {
      ok(typeof received === "string" && re.test(received), `expected ${fmt(received)} ${negate ? "not " : ""}to match ${re}`);
    },
    toThrow(expected) {
      let threw = false;
      let err: unknown;
      try {
        (received as () => unknown)();
      } catch (e) {
        threw = true;
        err = e;
      }
      if (negate) {
        ok(threw, "expected function not to throw");
        return;
      }
      if (!threw) assert.fail("expected function to throw");
      if (typeof expected === "function") {
        assert.ok(err instanceof (expected as new (...a: unknown[]) => unknown), "thrown error type mismatch");
      }
    },
  };
}

function fmt(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (v instanceof Error) return v.constructor.name;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function expect(received: unknown): Matchers & { not: Matchers } {
  return Object.assign(makeMatchers(received, false), { not: makeMatchers(received, true) });
}
