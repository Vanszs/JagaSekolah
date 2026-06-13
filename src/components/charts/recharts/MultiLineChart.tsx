"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

export interface MultiLinePoint {
  label: string;
  [key: string]: string | number;
}

// Palet kategorikal — teal brand dulu, lalu warna fungsional. TANPA ungu (anti-slop).
const PALETTE = ["#005D4C", "#ef4444", "#f59e0b", "#0ea5e9", "#0d9488", "#64748b", "#b45309"];

/** Multi-line untuk tren beberapa seri (mis. faktor risiko per bulan). */
export function MultiLineChart({
  data,
  series,
  height = 284,
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
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} dy={4} minTickGap={16} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || PALETTE[i % PALETTE.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={!reduced}
              animationDuration={ANIM_MS}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PALETTE as LINE_PALETTE };
