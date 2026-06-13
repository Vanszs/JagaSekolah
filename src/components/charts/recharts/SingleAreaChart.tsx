"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface SinglePoint {
  label: string;
  value: number;
}

/** Area chart satu seri (mis. tren intervensi bulanan). */
export function SingleAreaChart({ data, name }: { data: SinglePoint[]; name: string }) {
  const reduced = usePrefersReducedMotion();
  const first = data.at(0);
  const last = data.at(-1);
  const aria = first && last ? `${name}: ${first.value} → ${last.value} dalam ${data.length} bulan` : name;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid, strokeWidth: 2 }} />
          <Area type="monotone" dataKey="value" name={name} stroke={CHART.brand} fill={CHART.brand} fillOpacity={0.08} strokeWidth={2} isAnimationActive={!reduced} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
