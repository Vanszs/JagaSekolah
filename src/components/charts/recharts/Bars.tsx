"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface CatBarDatum {
  label: string;
  value: number;
}

/** Horizontal single-series bar (mis. intervensi per jenis). */
export function CategoryBars({ data, seriesName }: { data: CatBarDatum[]; seriesName: string }) {
  const reduced = usePrefersReducedMotion();
  const aria = `${seriesName}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  const h = Math.max(140, data.length * 40);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,93,76,0.04)" }} />
          <Bar dataKey="value" name={seriesName} fill={CHART.brand} radius={[0, 4, 4, 0]} isAnimationActive={!reduced} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
