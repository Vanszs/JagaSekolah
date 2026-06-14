// Kontrak domain untuk lapis ML prediksi (FASE 2, opsional).
//
// Prinsip non-negotiable JagaSekolah yang dipegang lapis ini:
//  1. Rule-based WAJIB selalu jalan. ML hanya nilai tambah → bila ragu, pakai rule.
//  2. Transparan: hasil ML selalu disertai alasan eksplisit ("model memprediksi…"),
//     tidak pernah jadi kotak hitam tanpa penjelasan.
//  3. ML hanya boleh MENAIKKAN kewaspadaan (escalate-only). Anak yang sudah ditandai
//     rule TIDAK boleh "diturunkan" oleh model — child-safety: lebih baik intervensi
//     yang tak perlu daripada melewatkan anak berisiko.
//  4. Tidak mengarang angka: probabilitas wajib finite ∈ [0,1], kalau tidak → tolak.

import { z } from "zod";
import type { Kategori } from "@/lib/scoring/types";

/**
 * Payload fitur yang dikirim ke service ML. Sengaja berupa angka datar
 * (sudah ternormalisasi dari `Features`) agar kontrak stabil & versi-able.
 * `featureVersion` memungkinkan service menolak skema fitur yang tak cocok.
 */
export interface MlFeaturePayload {
  featureVersion: string;
  features: {
    pctAbsen: number;
    alpaBeruntun: number;
    trenAbsensiMemburuk: number; // 0|1
    telatKronis: number; // 0|1
    catatanDisiplin: number;
    partisipasiRendah: number; // 0|1
    pctTugasTidakKumpul: number;
    nilaiTurun: number;
    mapelDiBawahKkm: number;
    pernahTinggalKelas: number; // 0|1
    nilaiIntiRendah: number; // 0|1
    faktorEkonomi: number; // 0|1
    jarakJauh: number; // 0|1
    keluargaRentan: number; // 0|1
  };
}

/** Versi kontrak fitur. Naikkan bila bentuk `features` berubah. */
export const FEATURE_VERSION = "1.0.0";

/**
 * Skema respons service ML — divalidasi ketat di klien.
 * - `probabilitas`: peluang putus sekolah 0..1 (wajib finite).
 * - `modelVersion`: untuk audit/kalibrasi retrospektif.
 * - `kategori` (opsional): saran kategori dari model; klien tetap berhak menimpa
 *   demi aturan escalate-only.
 */
export const MlPredictionSchema = z.object({
  probabilitas: z
    .number()
    .finite()
    .min(0)
    .max(1),
  modelVersion: z.string().min(1).max(64),
  kategori: z.enum(["hijau", "kuning", "merah"]).optional(),
});

export type MlPrediction = z.infer<typeof MlPredictionSchema>;

/**
 * Hasil pemanggilan klien ML — kontrak NEVER-THROWS.
 * `ok:false` selalu membawa `reason` agar pemanggil bisa fallback + audit.
 */
export type MlClientResult =
  | { ok: true; prediction: MlPrediction; latencyMs: number }
  | { ok: false; reason: MlFailureReason; detail?: string };

export type MlFailureReason =
  | "disabled" // ML_SERVICE_URL tidak diset → fitur mati (bukan error)
  | "circuit_open" // circuit breaker membuka → jangan ganggu service yang sedang sakit
  | "timeout"
  | "network"
  | "http_error"
  | "invalid_response"; // gagal validasi Zod

/** Sumber keputusan akhir (selaras enum Prisma `SumberRisiko`). */
export type Sumber = "rule" | "ml";

/**
 * Hasil gabungan rule + ML yang siap ditulis ke tabel Risiko.
 * Selalu menyertakan jejak transparan (`mlInfo`) untuk audit & UI.
 */
export interface BlendedRisiko {
  kategori: Kategori;
  skor: number; // 0..100
  sumber: Sumber;
  mlInfo: MlInfo | null;
}

export interface MlInfo {
  applied: boolean; // true bila ML benar-benar memengaruhi hasil
  probabilitas: number | null;
  modelVersion: string | null;
  /** Alasan teknis bila ML tidak dipakai (untuk audit, bukan untuk siswa). */
  fallbackReason: MlFailureReason | null;
}
