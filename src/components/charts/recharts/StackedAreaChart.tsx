"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useId } from "react";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface StackSeries {
  key: string;
  name: string;
  color: string;
}

export interface StackedAreaPoint {
  label: string;
  [key: string]: string | number;
}

/** Stacked area multi-seri dengan gradient halus per seri (tren komposisi). */
export function StackedAreaChart({
  data,
  series,
  height = 264,
  ariaLabel,
}: {
  data: StackedAreaPoint[];
  series: StackSeries[];
  height?: number;
  ariaLabel?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const gid = useId().replace(/:/g, "");
  const first = data.at(0);
  const last = data.at(-1);
  const sum = (p?: StackedAreaPoint) => (p ? series.reduce((a, s) => a + (Number(p[s.key]) || 0), 0) : 0);
  const aria =
    ariaLabel ??
    (first && last
      ? `Tren ${series.map((s) => s.name).join(", ")}. Total ${sum(first)} → ${sum(last)} dalam ${data.length} periode.`
      : "Tren komposisi");

  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`sa-${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.04} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} dy={4} minTickGap={16} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId="stack"
              stroke={s.color}
              fill={`url(#sa-${gid}-${s.key})`}
              strokeWidth={2}
              isAnimationActive={!reduced}
              animationDuration={ANIM_MS}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
