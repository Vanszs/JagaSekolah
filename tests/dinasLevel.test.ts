import { describe, it } from "node:test";
import { expect } from "./_expect";
import { dinasLevel, type TenantContext } from "@/lib/rbac";
import { dinasSekolahWhere } from "@/lib/analytics";

const ctx = (over: Partial<TenantContext>): TenantContext => ({
  userId: "u", role: "dinas", sekolahId: null, wilayahId: null, kelasId: null, provinsi: null, ...over,
});

describe("dinasLevel — 3 jenjang", () => {
  it("pusat: wilayahId & provinsi null", () => expect(dinasLevel(ctx({}))).toBe("pusat"));
  it("provinsi: provinsi diisi, wilayahId null", () => expect(dinasLevel(ctx({ provinsi: "Bali" }))).toBe("provinsi"));
  it("kabupaten: wilayahId diisi", () => expect(dinasLevel(ctx({ wilayahId: "w1" }))).toBe("kabupaten"));
  it("kabupaten menang atas provinsi bila keduanya diisi", () => expect(dinasLevel(ctx({ wilayahId: "w1", provinsi: "Bali" }))).toBe("kabupaten"));
});

describe("dinasSekolahWhere — filter sekolah per jenjang", () => {
  it("pusat → {} (semua sekolah)", () => expect(dinasSekolahWhere({ wilayahId: null, provinsi: null })).toEqual({}));
  it("provinsi → {wilayah:{provinsi}}", () => expect(dinasSekolahWhere({ wilayahId: null, provinsi: "Jawa Timur" })).toEqual({ wilayah: { provinsi: "Jawa Timur" } }));
  it("kabupaten → {wilayahId}", () => expect(dinasSekolahWhere({ wilayahId: "w1", provinsi: "Jawa Timur" })).toEqual({ wilayahId: "w1" }));
});
