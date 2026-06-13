"use client";

import { useSyncExternalStore } from "react";

/** Palet warna chart — selaras brand teal + RISK_CONFIG. Anti-slop: tanpa gradient ungu. */
export const CHART = {
  brand: "#005D4C",
  brandDark: "#004D40",
  merah: "#ef4444",
  kuning: "#f59e0b",
  hijau: "#10b981",
  grid: "#f1f5f9", // slate-100
  axis: "#94a3b8", // slate-400
  label: "#475569", // slate-600
  tooltipBorder: "#e2e8f0", // slate-200
} as const;

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Hormati prefers-reduced-motion (matikan animasi chart). SSR-safe via useSyncExternalStore. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches, // client snapshot
    () => false, // server snapshot
  );
}

/** Style tooltip Recharts konsisten (putih, border tipis, tanpa shadow). */
export const tooltipStyle = {
  borderRadius: 8,
  border: `1px solid ${CHART.tooltipBorder}`,
  fontSize: 13,
  boxShadow: "none",
  padding: "8px 12px",
} as const;
