"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface TrendPoint {
  label: string;
  merah: number;
  kuning: number;
  hijau: number;
}

/** Tren risiko 12 bulan (3 garis). Interaktif: tooltip per bulan. */
export function RiskTrendLine({ data }: { data: TrendPoint[] }) {
  const reduced = usePrefersReducedMotion();
  const last = data.at(-1);
  const first = data.at(0);
  const aria =
    first && last
      ? `Tren risiko 12 bulan. Risiko tinggi ${first.merah} → ${last.merah}, waspada ${first.kuning} → ${last.kuning}, aman ${first.hijau} → ${last.hijau}.`
      : "Tren risiko 12 bulan";

  return (
    <div role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid, strokeWidth: 2 }} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line type="monotone" dataKey="merah" name="Risiko tinggi" stroke={CHART.merah} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={!reduced} />
          <Line type="monotone" dataKey="kuning" name="Waspada" stroke={CHART.kuning} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={!reduced} />
          <Line type="monotone" dataKey="hijau" name="Aman" stroke={CHART.hijau} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={!reduced} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
