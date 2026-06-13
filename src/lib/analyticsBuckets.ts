/**
 * Kernel murni (tanpa DB) untuk bucketing analitik — agar bisa diuji unit.
 * Dipakai oleh src/lib/analytics.ts (riskScoreDistribution, distanceDistribution).
 */

/** Index bucket skor risiko 0..9 untuk histogram 10-poin (0–10 … 90–100). */
export function scoreBinIndex(skor: number): number {
  return Math.min(9, Math.max(0, Math.floor(skor / 10)));
}

/** Label bucket skor untuk histogram. */
export const SCORE_BIN_LABELS: string[] = Array.from({ length: 10 }, (_, i) => `${i * 10}–${i * 10 + 10}`);

const DISTANCE_EDGES = [0, 1, 3, 5, 10] as const;
export const DISTANCE_LABELS = ["<1 km", "1–3 km", "3–5 km", "5–10 km", ">10 km"] as const;

/** Index bucket jarak (km) ke sekolah. >10 km → bucket terakhir. */
export function distanceBinIndex(km: number): number {
  for (let i = 0; i < DISTANCE_EDGES.length; i++) {
    const lo = DISTANCE_EDGES[i]!;
    const hi = DISTANCE_EDGES[i + 1];
    if (km >= lo && (hi == null || km < hi)) return i;
  }
  return DISTANCE_LABELS.length - 1;
}
