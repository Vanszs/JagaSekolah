"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CHART, tooltipStyle, usePrefersReducedMotion } from "./theme";

export interface DonutDatum {
  name: string;
  value: number;
  key: "merah" | "kuning" | "hijau";
}

const COLOR: Record<DonutDatum["key"], string> = {
  merah: CHART.merah,
  kuning: CHART.kuning,
  hijau: CHART.hijau,
};

/** Donut sebaran risiko (interaktif: tooltip per segmen) + total di tengah. */
export function RiskDonutChart({ data }: { data: DonutDatum[] }) {
  const reduced = usePrefersReducedMotion();
  const total = data.reduce((a, d) => a + d.value, 0);
  const aria = `Sebaran risiko: ${data
    .map((d) => `${d.name} ${total > 0 ? Math.round((d.value / total) * 100) : 0}%`)
    .join(", ")}`;

  return (
    <div className="relative" role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={!reduced}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={COLOR[d.key]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold tabular-nums text-slate-900">
          {total.toLocaleString("id-ID")}
        </span>
        <span className="text-xs text-slate-500">siswa</span>
      </div>
    </div>
  );
}
