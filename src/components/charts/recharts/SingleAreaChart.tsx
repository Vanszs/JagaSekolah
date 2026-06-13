"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useId } from "react";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface SinglePoint {
  label: string;
  value: number;
}

/** Area chart satu seri dengan gradient teal lembut (mis. tren intervensi bulanan). */
export function SingleAreaChart({ data, name, color = CHART.brand }: { data: SinglePoint[]; name: string; color?: string }) {
  const reduced = usePrefersReducedMotion();
  const gid = useId().replace(/:/g, "");
  const first = data.at(0);
  const last = data.at(-1);
  const aria = first && last ? `${name}: ${first.value} → ${last.value} dalam ${data.length} periode` : name;
  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={208}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={`area-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} dy={4} minTickGap={16} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#area-${gid})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            isAnimationActive={!reduced}
            animationDuration={ANIM_MS}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
