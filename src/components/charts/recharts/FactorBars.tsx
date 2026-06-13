"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface FactorDatum {
  label: string;
  value: number;
}

/** Horizontal bar — analisis faktor risiko (menjawab "kenapa"). */
export function FactorBars({ data }: { data: FactorDatum[] }) {
  const reduced = usePrefersReducedMotion();
  const aria = `Faktor risiko: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  const h = Math.max(160, data.length * 38);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={CHART.grid} horizontal={false} />
          <XAxis type="number" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,93,76,0.04)" }} />
          <Bar dataKey="value" name="Siswa berisiko" fill={CHART.brand} radius={[0, 4, 4, 0]} isAnimationActive={!reduced} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
