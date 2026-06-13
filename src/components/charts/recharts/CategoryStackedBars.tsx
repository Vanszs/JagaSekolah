"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface CatStackDatum {
  label: string;
  merah: number;
  kuning: number;
  hijau: number;
}

/** Vertical stacked bars per kategori (perbandingan kelas/wilayah). */
export function CategoryStackedBars({ data }: { data: CatStackDatum[] }) {
  const reduced = usePrefersReducedMotion();
  const aria = `Perbandingan: ${data.map((d) => `${d.label} ${d.merah + d.kuning + d.hijau} siswa`).join(", ")}`;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={264}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }} barCategoryGap="24%">
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} tick={{ fill: CHART.label, fontSize: 11 }} dy={4} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,93,76,0.05)" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar dataKey="merah" name="Risiko tinggi" stackId="r" fill={CHART.merah} isAnimationActive={!reduced} animationDuration={ANIM_MS} maxBarSize={44} />
          <Bar dataKey="kuning" name="Waspada" stackId="r" fill={CHART.kuning} isAnimationActive={!reduced} animationDuration={ANIM_MS} maxBarSize={44} />
          <Bar dataKey="hijau" name="Aman" stackId="r" fill={CHART.hijau} radius={[5, 5, 0, 0]} isAnimationActive={!reduced} animationDuration={ANIM_MS} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
