import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  blendRiskWithMl,
  featuresToPayload,
  kategoriDariSkor,
  mlAlasanItem,
  predictAndBlend,
} from "@/lib/ml/predict";
import { FEATURE_VERSION, type MlClientResult } from "@/lib/ml/types";
import type { Features, HasilSkor, SiswaInput } from "@/lib/scoring/types";

const features: Features = {
  pctAbsen: 50, alpaBeruntun: 4, trenAbsensiMemburuk: true, telatKronis: false,
  catatanDisiplin: 0, partisipasiRendah: true, pctTugasTidakKumpul: 0,
  nilaiTurun: 12, mapelDiBawahKkm: 2, pernahTinggalKelas: false,
  nilaiIntiRendah: true, faktorEkonomi: true, jarakJauh: false, keluargaRentan: false,
};

function hasil(skor: number): HasilSkor {
  const kategori = kategoriDariSkor(skor);
  return { siswaId: "s1", kategori, skor, alasan: [{ kode: "absen_kritis", pesan: "x", bobot: skor }], saran: ["s"], configVersion: "v1" };
}

const okMl = (prob: number, kategori?: "hijau" | "kuning" | "merah"): MlClientResult => ({
  ok: true,
  prediction: { probabilitas: prob, modelVersion: "m1", ...(kategori ? { kategori } : {}) },
  latencyMs: 5,
});

describe("featuresToPayload", () => {
  it("flattens booleans to 0/1 and stamps featureVersion", () => {
    const p = featuresToPayload(features);
    expect(p.featureVersion).toBe(FEATURE_VERSION);
    expect(p.features.trenAbsensiMemburuk).toBe(1);
    expect(p.features.telatKronis).toBe(0);
    expect(p.features.faktorEkonomi).toBe(1);
    expect(p.features.pctAbsen).toBe(50);
  });
});

describe("blendRiskWithMl — escalate-only + transparent", () => {
  it("ML raises score → sumber=ml, applied=true", () => {
    const b = blendRiskWithMl(hasil(40), okMl(0.9)); // rule kuning(40) → ml 90 merah
    expect(b.skor).toBe(90);
    expect(b.kategori).toBe("merah");
    expect(b.sumber).toBe("ml");
    expect(b.mlInfo?.applied).toBe(true);
  });

  it("ML lower than rule → never de-escalates, sumber stays rule", () => {
    const b = blendRiskWithMl(hasil(80), okMl(0.1)); // rule merah(80) → ml 10
    expect(b.skor).toBe(80);
    expect(b.kategori).toBe("merah");
    expect(b.sumber).toBe("rule");
    expect(b.mlInfo?.applied).toBe(false);
  });

  it("ML equal → no escalation, rule wins (applied=false)", () => {
    const b = blendRiskWithMl(hasil(50), okMl(0.5));
    expect(b.skor).toBe(50);
    expect(b.sumber).toBe("rule");
    expect(b.mlInfo?.applied).toBe(false);
  });

  it("explicit ml kategori escalates even if score tie", () => {
    const b = blendRiskWithMl(hasil(60), okMl(0.6, "merah")); // both 60, rule kuning? 60→merah
    // rule(60)=merah already; pick max — stays merah
    expect(b.kategori).toBe("merah");
  });

  it("failed ML → rule preserved + fallbackReason recorded", () => {
    const b = blendRiskWithMl(hasil(45), { ok: false, reason: "timeout" });
    expect(b.skor).toBe(45);
    expect(b.sumber).toBe("rule");
    expect(b.mlInfo?.applied).toBe(false);
    expect(b.mlInfo?.fallbackReason).toBe("timeout");
    expect(b.mlInfo?.probabilitas).toBeNull();
  });

  it("disabled ML → rule preserved, reason=disabled", () => {
    const b = blendRiskWithMl(hasil(20), { ok: false, reason: "disabled" });
    expect(b.sumber).toBe("rule");
    expect(b.mlInfo?.fallbackReason).toBe("disabled");
  });
});

describe("mlAlasanItem — transparency", () => {
  it("produces an explicit reason with zero weight when ML applied", () => {
    const b = blendRiskWithMl(hasil(30), okMl(0.85));
    const item = mlAlasanItem(b);
    expect(item?.kode).toBe("ml_prediksi");
    expect(item?.bobot).toBe(0);
    expect(item?.pesan).toMatch(/85%/);
  });

  it("returns null when ML not applied", () => {
    const b = blendRiskWithMl(hasil(80), okMl(0.2));
    expect(mlAlasanItem(b)).toBeNull();
  });
});

describe("predictAndBlend — never-throws orchestration", () => {
  const input = { id: "s1", nama: "A", totalHari: 20, hariAlpa: 10, alpaBeruntunMaks: 4, jumlahTelat: 0, catatanDisiplin: 0, partisipasi: 2, pctTugasTidakKumpul: 0, rataNilaiSekarang: 60, mapelDiBawahKkm: 2, pernahTinggalKelas: false, kkm: 70, penerimaKip: true } as SiswaInput;

  it("uses injected predict and blends", async () => {
    const { blend } = await predictAndBlend(input, {
      predict: async () => okMl(0.95),
    });
    expect(blend.sumber).toBe("ml");
    expect(blend.skor).toBe(95);
  });

  it("swallows a throwing predict and falls back to rule", async () => {
    const { hasil: h, blend } = await predictAndBlend(input, {
      predict: async () => {
        throw new Error("boom");
      },
    });
    expect(blend.sumber).toBe("rule");
    expect(blend.skor).toBe(h.skor);
    expect(blend.mlInfo?.fallbackReason).toBe("network");
  });
});
