"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CHART, ChartTooltip, usePrefersReducedMotion, axisProps, yAxisProps, gridProps, ANIM_MS } from "./theme";

export interface TrendPoint {
  label: string;
  merah: number;
  kuning: number;
  hijau: number;
}

const SERIES = [
  { key: "merah", name: "Risiko tinggi", color: CHART.merah },
  { key: "kuning", name: "Waspada", color: CHART.kuning },
  { key: "hijau", name: "Aman", color: CHART.hijau },
] as const;

/** Tren risiko 12 bulan (3 garis halus). Tooltip kustom, dot hanya saat hover. */
export function RiskTrendLine({ data }: { data: TrendPoint[] }) {
  const reduced = usePrefersReducedMotion();
  const first = data.at(0);
  const last = data.at(-1);
  const aria =
    first && last
      ? `Tren risiko 12 bulan. Risiko tinggi ${first.merah} → ${last.merah}, waspada ${first.kuning} → ${last.kuning}, aman ${first.hijau} → ${last.hijau}.`
      : "Tren risiko 12 bulan";

  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={264}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} dy={4} minTickGap={16} />
          <YAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.axis, strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
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
