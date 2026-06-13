import { describe, it } from "node:test";
import { expect } from "./_expect";
import { applySyncItem, type SyncPort, type SyncItem } from "@/lib/offline/applySync";

function fakePort(initial: {
  claimed?: Set<string>;
  versions?: Record<string, number>;
}): SyncPort & { created: SyncItem[]; marks: Record<string, string> } {
  const claimed = initial.claimed ?? new Set<string>();
  const versions = initial.versions ?? {};
  const created: SyncItem[] = [];
  const marks: Record<string, string> = {};
  return {
    created,
    marks,
    async claimKey(k) {
      if (claimed.has(k)) return false;
      claimed.add(k);
      return true;
    },
    async markKey(k, status) {
      marks[k] = status;
    },
    async exists(id) {
      return id in versions;
    },
    async createIntervensi(item) {
      created.push(item);
      return { id: "new-id", version: 1 };
    },
    async updateIntervensiIfVersion(id, base) {
      if (versions[id] !== base) return null; // versi tak cocok
      versions[id] = base + 1;
      return versions[id]!;
    },
  };
}

const item = (over: Partial<SyncItem> = {}): SyncItem => ({
  idempotencyKey: "key-1",
  siswaId: "s1",
  jenis: "kunjungan_rumah",
  catatan: "tes",
  baseVersion: 1,
  ...over,
});

describe("applySyncItem (atomic)", () => {
  it("membuat intervensi baru", async () => {
    const port = fakePort({});
    const r = await applySyncItem(port, item());
    expect(r.status).toBe("applied");
    expect(port.created).toHaveLength(1);
    expect(port.marks["key-1"]).toBe("applied");
  });

  it("duplicate: key sudah diklaim -> tidak dobel tulis", async () => {
    const port = fakePort({ claimed: new Set(["key-1"]) });
    const r = await applySyncItem(port, item());
    expect(r.status).toBe("duplicate");
    expect(port.created).toHaveLength(0);
  });

  it("conflict: versi server beda (compare-and-set gagal)", async () => {
    const port = fakePort({ versions: { "iv-1": 3 } });
    const r = await applySyncItem(port, item({ intervensiId: "iv-1", baseVersion: 1 }));
    expect(r.status).toBe("conflict");
  });

  it("update sukses ketika versi cocok -> version naik", async () => {
    const port = fakePort({ versions: { "iv-1": 2 } });
    const r = await applySyncItem(port, item({ intervensiId: "iv-1", baseVersion: 2 }));
    expect(r.status).toBe("applied");
    expect(r.serverVersion).toBe(3);
  });

  it("rejected: intervensi tidak ditemukan", async () => {
    const port = fakePort({});
    const r = await applySyncItem(port, item({ intervensiId: "tidak-ada", baseVersion: 1 }));
    expect(r.status).toBe("rejected");
  });
});
