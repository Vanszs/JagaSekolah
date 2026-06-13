import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Envelope encryption:
// - Master Key (MK) dari env, hanya untuk membungkus (wrap) Data Encryption Key (DEK).
// - DEK acak per-record (atau per-batch), mengenkripsi PII.
// - DEK disimpan dalam bentuk terbungkus (wrappedKey) -> rotasi MK tanpa re-encrypt PII.
// Format ciphertext: v1.base64(iv).base64(tag).base64(data)

const ALGO = "aes-256-gcm";
const VERSION = "v1";

function masterKey(): Buffer {
  const raw = process.env.PII_MASTER_KEY ?? process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production")
      throw new Error("PII_MASTER_KEY wajib di produksi.");
    return scryptSync("dev-insecure-master", "jagasekolah-mk", 32);
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return scryptSync(raw, "jagasekolah-mk", 32);
}

function aesEncrypt(key: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

function aesDecrypt(key: Buffer, stored: string): string | null {
  try {
    const [ver, ivB64, tagB64, dataB64] = stored.split(".");
    if (ver !== VERSION || !ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"), {
      authTagLength: 16,
    });
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** Buat DEK baru (acak) + wrap dengan master key. */
export function createDek(): { dek: Buffer; wrapped: string } {
  const dek = randomBytes(32);
  const wrapped = aesEncrypt(masterKey(), dek.toString("base64"));
  return { dek, wrapped };
}

/** Buka DEK terbungkus memakai master key. */
export function unwrapDek(wrapped: string): Buffer | null {
  const b64 = aesDecrypt(masterKey(), wrapped);
  return b64 ? Buffer.from(b64, "base64") : null;
}

/** Enkripsi PII dgn DEK. */
export function encryptWithDek(dek: Buffer, plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === "") return null;
  return aesEncrypt(dek, plain);
}

/** Dekripsi PII dgn DEK. */
export function decryptWithDek(dek: Buffer, stored: string | null | undefined): string | null {
  if (!stored) return null;
  return aesDecrypt(dek, stored);
}
