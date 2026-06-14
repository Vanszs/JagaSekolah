// Orkestrator rule + ML (FASE 2, opsional).
//
// Menggabungkan hasil rule-based (selalu ada) dengan prediksi ML (opsional) secara
// TRANSPARAN dan ESCALATE-ONLY:
//  - Rule tetap sumber kebenaran dasar. Alasan rule selalu dipertahankan.
//  - ML hanya boleh MENAIKKAN kategori/skor, tidak pernah menurunkan (child-safety:
//    jangan pernah "menenangkan" anak yang sudah ditandai rule).
//  - Bila ML dipakai, ditambahkan SATU alasan eksplisit ("Model memprediksi …%")
//    sehingga keputusan tetap bisa dijelaskan ke guru/orang tua.
//  - Bila ML mati/lambat/tak valid → hasil = rule murni (degradasi anggun).

import type { Features, HasilSkor, Kategori } from "@/lib/scoring/types";
import { computeFeatures } from "@/lib/scoring/features";
import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/scoring/thresholds";
import type { SiswaInput } from "@/lib/scoring/types";
import {
  FEATURE_VERSION,
  type BlendedRisiko,
  type MlClientResult,
  type MlFeaturePayload,
} from "@/lib/ml/types";
import { predictRemote, type MlClientConfig, defaultMlConfig } from "@/lib/ml/client";
import { scoreSiswa } from "@/lib/scoring/rules";

const RANK: Record<Kategori, number> = { hijau: 0, kuning: 1, merah: 2 };
const b01 = (v: boolean): number => (v ? 1 : 0);

/** Petakan Features (ABC+konteks) → payload datar untuk service ML. PURE. */
export function featuresToPayload(f: Features): MlFeaturePayload {
  return {
    featureVersion: FEATURE_VERSION,
    features: {
      pctAbsen: f.pctAbsen,
      alpaBeruntun: f.alpaBeruntun,
      trenAbsensiMemburuk: b01(f.trenAbsensiMemburuk),
      telatKronis: b01(f.telatKronis),
      catatanDisiplin: f.catatanDisiplin,
      partisipasiRendah: b01(f.partisipasiRendah),
      pctTugasTidakKumpul: f.pctTugasTidakKumpul,
      nilaiTurun: f.nilaiTurun,
      mapelDiBawahKkm: f.mapelDiBawahKkm,
      pernahTinggalKelas: b01(f.pernahTinggalKelas),
      nilaiIntiRendah: b01(f.nilaiIntiRendah),
      faktorEkonomi: b01(f.faktorEkonomi),
      jarakJauh: b01(f.jarakJauh),
      keluargaRentan: b01(f.keluargaRentan),
    },
  };
}

/** Kategori dari skor 0..100 memakai ambang yang sama dengan rule. PURE. */
export function kategoriDariSkor(skor: number, t: Thresholds = DEFAULT_THRESHOLDS): Kategori {
  if (skor >= t.skorMerah) return "merah";
  if (skor >= t.skorKuning) return "kuning";
  return "hijau";
}

/**
 * Gabungkan hasil rule dengan hasil klien ML. PURE & NEVER-THROWS.
 * Escalate-only: hasil akhir = MAX(rule, ml) untuk skor & kategori.
 */
export function blendRiskWithMl(
  hasil: HasilSkor,
  ml: MlClientResult,
  t: Thresholds = DEFAULT_THRESHOLDS
): BlendedRisiko {
  // ML tidak tersedia → rule murni, jejak alasan teknis disimpan utk audit.
  if (!ml.ok) {
    return {
      kategori: hasil.kategori,
      skor: hasil.skor,
      sumber: "rule",
      mlInfo: {
        applied: false,
        probabilitas: null,
        modelVersion: null,
        fallbackReason: ml.reason,
      },
    };
  }

  const mlSkor = Math.round(ml.prediction.probabilitas * 100);
  const mlKategori = ml.prediction.kategori ?? kategoriDariSkor(mlSkor, t);

  // Escalate-only.
  const skorAkhir = Math.max(hasil.skor, mlSkor);
  const kategoriAkhir: Kategori =
    RANK[mlKategori] > RANK[hasil.kategori] ? mlKategori : hasil.kategori;

  // ML "dipakai" hanya bila benar-benar menaikkan skor atau kategori.
  const applied = skorAkhir > hasil.skor || RANK[kategoriAkhir] > RANK[hasil.kategori];

  return {
    kategori: kategoriAkhir,
    skor: skorAkhir,
    sumber: applied ? "ml" : "rule",
    mlInfo: {
      applied,
      probabilitas: ml.prediction.probabilitas,
      modelVersion: ml.prediction.modelVersion,
      fallbackReason: null,
    },
  };
}

/**
 * Bangun satu alasan transparan untuk hasil ML (ditambahkan ke daftar alasan rule
 * agar UI/audit tetap bisa menjelaskan keputusan). Mengembalikan null bila ML tak dipakai.
 */
export function mlAlasanItem(blend: BlendedRisiko): { kode: string; pesan: string; bobot: number } | null {
  if (!blend.mlInfo?.applied || blend.mlInfo.probabilitas == null) return null;
  const pct = Math.round(blend.mlInfo.probabilitas * 100);
  return {
    kode: "ml_prediksi",
    pesan: `Model memprediksi peluang putus sekolah ${pct}% (model ${blend.mlInfo.modelVersion ?? "?"}).`,
    bobot: 0, // bobot 0: tidak menambah skor (skor sudah di-blend), murni penjelasan
  };
}

export interface PredictAndBlendDeps {
  config?: MlClientConfig;
  thresholds?: Thresholds;
  /** Memungkinkan test menyuntik klien tiruan. Default = predictRemote nyata. */
  predict?: (payload: MlFeaturePayload, cfg: MlClientConfig) => Promise<MlClientResult>;
}

/**
 * Jalur lengkap untuk satu siswa: rule → (opsional) ML → blend.
 * NEVER-THROWS — error apa pun dari ML diterjemahkan jadi fallback rule.
 */
export async function predictAndBlend(
  input: SiswaInput,
  deps: PredictAndBlendDeps = {}
): Promise<{ hasil: HasilSkor; blend: BlendedRisiko }> {
  const t = deps.thresholds ?? DEFAULT_THRESHOLDS;
  const cfg = deps.config ?? defaultMlConfig();
  const predict = deps.predict ?? predictRemote;

  const hasil = scoreSiswa(input, t);

  let ml: MlClientResult;
  try {
    const payload = featuresToPayload(computeFeatures(input, t));
    ml = await predict(payload, cfg);
  } catch (err) {
    // Pertahanan terakhir: klien seharusnya never-throw, tetapi kalau toh terjadi,
    // jangan biarkan recompute gagal.
    ml = { ok: false, reason: "network", detail: err instanceof Error ? err.message : String(err) };
  }

  return { hasil, blend: blendRiskWithMl(hasil, ml, t) };
}
