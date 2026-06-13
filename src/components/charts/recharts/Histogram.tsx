"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface HistogramBin {
  /** Label rentang bucket, mis. "70–80". */
  bin: string;
  count: number;
}

/**
 * Histogram distribusi (mis. sebaran skor risiko, sebaran jarak ke sekolah).
 * Vertical bars, sumbu-x = rentang bucket.
 */
export function Histogram({
  data,
  seriesName,
  color = CHART.brand,
  height = 240,
  xLabel,
}: {
  data: HistogramBin[];
  seriesName: string;
  color?: string;
  height?: number;
  xLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const aria = `Distribusi ${seriesName}: ${data.map((d) => `${d.bin} (${d.count})`).join(", ")}`;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: xLabel ? 20 : 0, left: -12 }} barCategoryGap={2}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis
            dataKey="bin"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={xLabel ? { value: xLabel, position: "insideBottom", offset: -8, fill: CHART.label, fontSize: 11 } : undefined}
          />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,93,76,0.04)" }} formatter={(v) => [`${Number(v)} siswa`, seriesName]} />
          <Bar dataKey="count" name={seriesName} fill={color} radius={[3, 3, 0, 0]} isAnimationActive={!reduced} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
