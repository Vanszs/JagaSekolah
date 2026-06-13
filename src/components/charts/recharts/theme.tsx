"use client";

import { useSyncExternalStore } from "react";

/** Palet warna chart — selaras brand teal + RISK_CONFIG. Anti-slop: tanpa gradient ungu. */
export const CHART = {
  brand: "#005D4C",
  brandDark: "#004D40",
  merah: "#ef4444",
  kuning: "#f59e0b",
  hijau: "#10b981",
  grid: "#eef2f6", // slate-100/200 — tipis
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
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/** Durasi animasi standar (entrance halus, bukan bouncy). */
export const ANIM_MS = 600;

/** Preset sumbu & grid — minimal chrome, tick rapi, tanpa garis sumbu. */
export const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};
export const yAxisProps = {
  ...axisProps,
  width: 30,
  allowDecimals: false as const,
};
/** Grid horizontal putus-putus halus (tanpa garis vertikal). */
export const gridProps = {
  stroke: CHART.grid,
  strokeDasharray: "4 4",
  vertical: false as const,
} as const;

interface TipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}
/**
 * Tooltip kustom modern: kartu putih radius lembut, label tebal, tiap seri
 * dengan titik berwarna + nilai tabular-nums. Dipakai lintas chart.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  unit = "",
  valueFormatter,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
  unit?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = (v: number | string | undefined) => {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return String(v ?? "");
    return valueFormatter ? valueFormatter(n) : `${n.toLocaleString("id-ID")}${unit}`;
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-[0_4px_16px_rgb(15_23_42_/0.08)] backdrop-blur-sm">
      {label != null && <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={`${p.dataKey}-${i}`} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden="true" />
            <span className="text-slate-500">{p.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-slate-900">{fmt(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
