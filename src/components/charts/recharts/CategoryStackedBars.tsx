"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

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
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.label, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,93,76,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="merah" name="Risiko tinggi" stackId="r" fill={CHART.merah} isAnimationActive={!reduced} maxBarSize={48} />
          <Bar dataKey="kuning" name="Waspada" stackId="r" fill={CHART.kuning} isAnimationActive={!reduced} maxBarSize={48} />
          <Bar dataKey="hijau" name="Aman" stackId="r" fill={CHART.hijau} radius={[4, 4, 0, 0]} isAnimationActive={!reduced} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
