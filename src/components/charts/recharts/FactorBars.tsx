"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, ANIM_MS } from "./theme";

export interface FactorDatum {
  label: string;
  value: number;
}

/** Horizontal bar — analisis faktor risiko (menjawab "kenapa"). */
export function FactorBars({ data }: { data: FactorDatum[] }) {
  const reduced = usePrefersReducedMotion();
  const aria = `Faktor risiko: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`;
  const h = Math.max(170, data.length * 42);
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }} barCategoryGap="28%">
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" horizontal={false} />
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis type="category" dataKey="label" tick={{ fill: CHART.label, fontSize: 12 }} axisLine={false} tickLine={false} width={150} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,93,76,0.05)" }} />
          <Bar dataKey="value" name="Siswa berisiko" fill={CHART.brand} radius={[0, 6, 6, 0]} isAnimationActive={!reduced} animationDuration={ANIM_MS} barSize={18}>
            <LabelList dataKey="value" position="right" className="fill-slate-500" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
