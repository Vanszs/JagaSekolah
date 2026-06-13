import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Enkripsi field-level AES-256-GCM untuk PII (UU PDP).
// Format tersimpan: base64(iv).base64(tag).base64(ciphertext)

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PII_ENCRYPTION_KEY wajib di produksi.");
    }
    // dev fallback (deterministik) - JANGAN dipakai di produksi
    return scryptSync("dev-insecure-key", "jagasekolah-salt", 32);
  }
  // dukung hex 64-char atau passphrase
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return scryptSync(raw, "jagasekolah-salt", 32);
}

/** Enkripsi string PII. Mengembalikan null jika input null/undefined. */
export function encryptPII(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === "") return null;
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

/** Dekripsi string PII. Mengembalikan null bila gagal/null. */
export function decryptPII(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    const [ivB64, tagB64, dataB64] = stored.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const key = getKey();
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"), {
      authTagLength: 16,
    });
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}
