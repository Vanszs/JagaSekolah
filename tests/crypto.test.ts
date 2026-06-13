import { describe, it } from "node:test";
import { expect } from "./_expect";
import { encryptPII, decryptPII } from "@/lib/crypto";

describe("crypto PII", () => {
  it("roundtrip enkripsi-dekripsi", () => {
    const plain = "miskin";
    const enc = encryptPII(plain);
    expect(enc).not.toBeNull();
    expect(enc).not.toBe(plain);
    expect(decryptPII(enc)).toBe(plain);
  });

  it("null/empty -> null", () => {
    expect(encryptPII(null)).toBeNull();
    expect(encryptPII(undefined)).toBeNull();
    expect(encryptPII("")).toBeNull();
    expect(decryptPII(null)).toBeNull();
  });

  it("ciphertext berbeda tiap enkripsi (IV acak)", () => {
    expect(encryptPII("yatim")).not.toBe(encryptPII("yatim"));
  });

  it("data rusak -> null (tidak throw)", () => {
    expect(decryptPII("bukan.format.valid")).toBeNull();
    expect(decryptPII("xxx")).toBeNull();
  });
});
