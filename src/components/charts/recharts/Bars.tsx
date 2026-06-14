"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, ANIM_MS } from "./theme";

export interface CatBarDatum {
  label: string;
  value: number;
}

/** Horizontal single-series bar (mis. intervensi per jenis). */
export function CategoryBars({ data, seriesName }: { data: CatBarDatum[]; seriesName: string }) {
  const reduced = usePrefersReducedMotion();
  const aria = `${seriesName}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  const h = Math.max(150, data.length * 44);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" allowDecimals={false} domain={[0, "dataMax"]} hide />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={140} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,93,76,0.05)" }} />
          <Bar dataKey="value" name={seriesName} fill={CHART.brand} radius={[0, 6, 6, 0]} isAnimationActive={!reduced} animationDuration={ANIM_MS} barSize={20}>
            <LabelList dataKey="value" position="right" className="fill-slate-500" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
