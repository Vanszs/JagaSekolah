"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { useId } from "react";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface HistogramBin {
  bin: string;
  count: number;
}

/** Histogram distribusi (sebaran skor risiko / jarak ke sekolah) — gradient teal. */
export function Histogram({
  data,
  seriesName,
  color = CHART.brand,
  height = 248,
  xLabel,
}: {
  data: HistogramBin[];
  seriesName: string;
  color?: string;
  height?: number;
  xLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const gid = useId().replace(/:/g, "");
  const aria = `Distribusi ${seriesName}: ${data.map((d) => `${d.bin} (${d.count})`).join(", ")}`;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 14, right: 12, bottom: xLabel ? 20 : 0, left: -10 }} barCategoryGap="18%">
          <defs>
            <linearGradient id={`hist-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="bin"
            {...axisProps}
            dy={4}
            label={xLabel ? { value: xLabel, position: "insideBottom", offset: -8, fill: CHART.label, fontSize: 11 } : undefined}
          />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip unit=" siswa" />} cursor={{ fill: "rgba(0,93,76,0.05)" }} />
          <Bar dataKey="count" name={seriesName} fill={`url(#hist-${gid})`} radius={[16, 16, 0, 0]} isAnimationActive={!reduced} animationDuration={ANIM_MS}>
            <LabelList dataKey="count" position="top" className="fill-slate-500" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
