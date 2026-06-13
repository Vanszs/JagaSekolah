import { describe, it } from "node:test";
import { expect } from "./_expect";
import { createDek, unwrapDek, encryptWithDek, decryptWithDek } from "@/lib/envelope";
import { chunk, withSerialLock } from "@/lib/concurrency";

describe("envelope encryption", () => {
  it("DEK wrap/unwrap roundtrip", () => {
    const { dek, wrapped } = createDek();
    const un = unwrapDek(wrapped);
    expect(un).not.toBeNull();
    expect(un!.equals(dek)).toBe(true);
  });

  it("encrypt/decrypt PII dgn DEK", () => {
    const { dek } = createDek();
    const enc = encryptWithDek(dek, "miskin");
    expect(enc).not.toBe("miskin");
    expect(decryptWithDek(dek, enc)).toBe("miskin");
  });

  it("null aman", () => {
    const { dek } = createDek();
    expect(encryptWithDek(dek, null)).toBeNull();
    expect(decryptWithDek(dek, null)).toBeNull();
  });

  it("DEK salah -> null (tidak throw)", () => {
    const a = createDek();
    const b = createDek();
    const enc = encryptWithDek(a.dek, "rahasia");
    expect(decryptWithDek(b.dek, enc)).toBeNull();
  });

  it("wrapped key rusak -> null", () => {
    expect(unwrapDek("v1.x.y.z")).toBeNull();
  });
});

describe("concurrency util", () => {
  it("chunk membagi benar", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it("withSerialLock menjalankan serial (tidak overlap)", async () => {
    const order: string[] = [];
    const slow = (tag: string, ms: number) =>
      withSerialLock("k", async () => {
        order.push(`${tag}-start`);
        await new Promise((r) => setTimeout(r, ms));
        order.push(`${tag}-end`);
      });
    await Promise.all([slow("a", 20), slow("b", 5)]);
    // b tidak boleh mulai sebelum a selesai
    expect(order).toEqual(["a-start", "a-end", "b-start", "b-end"]);
  });
});
