"use client";

import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface HBarDatum {
  label: string;
  value: number;
  /** Warna per-bar opsional (mis. merah utk %risiko tinggi). */
  color?: string;
}

/**
 * Horizontal bar ranking (mis. top provinsi, cakupan per wilayah, top pelaku).
 * Mendukung warna per-bar + formatter nilai (angka/persen).
 */
export function HorizontalBarChart({
  data,
  seriesName,
  unit = "",
  height,
  barColor = CHART.brand,
}: {
  data: HBarDatum[];
  seriesName: string;
  /** Akhiran nilai pada aria/tooltip, mis. "%". */
  unit?: string;
  height?: number;
  barColor?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const aria = `${seriesName}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`;
  const h = height ?? Math.max(140, data.length * 38);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: CHART.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            unit={unit}
          />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,93,76,0.04)" }} formatter={(v) => [`${Number(v)}${unit}`, seriesName]} />
          <Bar dataKey="value" name={seriesName} radius={[0, 4, 4, 0]} isAnimationActive={!reduced} barSize={18}>
            {data.map((d, i) => (
              <Cell key={`${d.label}-${i}`} fill={d.color ?? barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
