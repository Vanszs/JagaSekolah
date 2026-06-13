"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

export interface MultiLinePoint {
  label: string;
  [key: string]: string | number;
}

const PALETTE = ["#005D4C", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#0ea5e9", "#64748b"];

/** Multi-line untuk tren beberapa seri (mis. faktor risiko per bulan). */
export function MultiLineChart({
  data,
  series,
  height = 280,
  ariaLabel,
}: {
  data: MultiLinePoint[];
  series: LineSeries[];
  height?: number;
  ariaLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const aria = ariaLabel ?? `Tren ${series.map((s) => s.name).join(", ")} selama ${data.length} periode`;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid, strokeWidth: 2 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="plainline" />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              isAnimationActive={!reduced}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PALETTE as LINE_PALETTE };
