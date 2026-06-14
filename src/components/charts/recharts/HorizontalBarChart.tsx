"use client";

import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, ANIM_MS } from "./theme";

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
}

/** Horizontal bar ranking (top provinsi, cakupan, top pelaku). Bar membulat + label nilai. */
export function HorizontalBarChart({
  data,
  seriesName,
  unit = "",
  height,
  barColor = CHART.brand,
}: {
  data: HBarDatum[];
  seriesName: string;
  unit?: string;
  height?: number;
  barColor?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const aria = `${seriesName}: ${data.map((d) => `${d.label} ${d.value}${unit}`).join(", ")}`;
  const h = height ?? Math.max(150, data.length * 42);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" {...axisProps} allowDecimals={false} unit={unit} domain={[0, "dataMax"]} hide />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
          <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "rgba(0,93,76,0.05)" }} />
          <Bar dataKey="value" name={seriesName} radius={[0, 6, 6, 0]} isAnimationActive={!reduced} animationDuration={ANIM_MS} barSize={20}>
            {data.map((d, i) => (
              <Cell key={`${d.label}-${i}`} fill={d.color ?? barColor} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: React.ReactNode) => `${Number(v)}${unit}`} className="fill-slate-500" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
