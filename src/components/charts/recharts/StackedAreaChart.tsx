"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface StackSeries {
  /** Key di tiap baris data. */
  key: string;
  name: string;
  color: string;
}

export interface StackedAreaPoint {
  label: string;
  [key: string]: string | number;
}

/**
 * Stacked area multi-seri untuk tren komposisi sepanjang waktu
 * (mis. risiko merah/kuning/hijau, atau status absensi per bulan).
 */
export function StackedAreaChart({
  data,
  series,
  height = 260,
  ariaLabel,
}: {
  data: StackedAreaPoint[];
  series: StackSeries[];
  height?: number;
  ariaLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const first = data.at(0);
  const last = data.at(-1);
  const sum = (p?: StackedAreaPoint) =>
    p ? series.reduce((a, s) => a + (Number(p[s.key]) || 0), 0) : 0;
  const aria =
    ariaLabel ??
    (first && last
      ? `Tren ${series.map((s) => s.name).join(", ")}. Total ${sum(first)} → ${sum(last)} dalam ${data.length} periode.`
      : "Tren komposisi");

  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid, strokeWidth: 2 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId="stack"
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.16}
              strokeWidth={2}
              isAnimationActive={!reduced}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
