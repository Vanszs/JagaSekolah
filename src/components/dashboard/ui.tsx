import type { KategoriRisiko } from "@prisma/client";
import { RISK_CONFIG } from "@/lib/risk";

/** Alias internal singkat. */
const RISK = RISK_CONFIG;

export function RiskBadge({ kategori }: { kategori: KategoriRisiko }) {
  const r = RISK[kategori];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${r.bg} ${r.text} ${r.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} aria-hidden="true" />
      {r.label}
    </span>
  );
}

/** Inline status dot + label (for tables, lighter than the badge). */
export function RiskDot({ kategori }: { kategori: KategoriRisiko }) {
  const r = RISK[kategori];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${r.text}`}>
      <span className={`h-2 w-2 rounded-full ${r.dot}`} aria-hidden="true" />
      {r.label}
    </span>
  );
}

export function StatTile({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  accent?: "merah" | "kuning" | "hijau" | "brand";
  sub?: string;
}) {
  const dot =
    accent === "merah"
      ? "bg-red-500"
      : accent === "kuning"
        ? "bg-amber-500"
        : accent === "hijau"
          ? "bg-emerald-500"
          : "bg-[#005D4C]";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function PageHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] sm:text-2xl">{title}</h1>
      {desc && <p className="mt-1 max-w-prose text-sm text-slate-600">{desc}</p>}
    </div>
  );
}

/** Panel chart/section konsisten (border tipis, judul + deskripsi opsional). */
export function Panel({
  title,
  desc,
  children,
  className = "",
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-6 ${className}`}>
      <div className="mb-5">
        <h2 className="font-display text-base font-semibold text-[#0F172A]">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

/** Skeleton chart (tinggi disesuaikan), hormati reduced-motion. */
export function ChartSkeleton({ h = 240 }: { h?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" style={{ height: h }} />;
}

export function EmptyState({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{desc}</p>
    </div>
  );
}
