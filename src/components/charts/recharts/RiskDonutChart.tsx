"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { CHART, usePrefersReducedMotion, ANIM_MS } from "./theme";

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

interface TipP { name?: string; value?: number; payload?: { _total?: number } }
function DonutTip({ active, payload }: { active?: boolean; payload?: TipP[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!;
  const total = p.payload?._total ?? 0;
  const v = Number(p.value) || 0;
  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-[0_4px_16px_rgb(15_23_42_/0.08)] backdrop-blur-sm">
      <p className="text-sm font-medium text-slate-700">{p.name}</p>
      <p className="text-sm tabular-nums text-slate-900">
        <span className="font-semibold">{v.toLocaleString("id-ID")}</span>
        <span className="ml-1.5 text-slate-400">· {pct}%</span>
      </p>
    </div>
  );
}

/** Donut sebaran risiko (segmen membulat, tooltip %, total di tengah). */
export function RiskDonutChart({ data }: { data: DonutDatum[] }) {
  const reduced = usePrefersReducedMotion();
  const total = data.reduce((a, d) => a + d.value, 0);
  const withTotal = data.map((d) => ({ ...d, _total: total }));
  const aria = `Sebaran: ${data.map((d) => `${d.name} ${total > 0 ? Math.round((d.value / total) * 100) : 0}%`).join(", ")}`;

  return (
    <div className="relative" role="img" aria-label={aria}>
      <ResponsiveContainer width="100%" height={224}>
        <PieChart>
          <Pie
            data={withTotal}
            dataKey="value"
            nameKey="name"
            innerRadius={66}
            outerRadius={92}
            paddingAngle={3}
            cornerRadius={6}
            stroke="none"
            isAnimationActive={!reduced}
            animationDuration={ANIM_MS}
          >
            {withTotal.map((d, i) => (
              <Cell key={`${d.key}-${i}`} fill={COLOR[d.key]} />
            ))}
          </Pie>
          <Tooltip content={<DonutTip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[1.7rem] font-bold tabular-nums leading-none text-slate-900">
          {total.toLocaleString("id-ID")}
        </span>
        <span className="mt-1 text-xs text-slate-500">siswa</span>
      </div>
    </div>
  );
}
