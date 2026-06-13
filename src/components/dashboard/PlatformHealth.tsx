import { Suspense } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Building2, Database, KeyRound, ScrollText, ShieldCheck, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { StatTile } from "@/components/dashboard/ui";
import { aksiLabel } from "@/lib/auditLabels";
import { timeAgo } from "@/lib/format";

/**
 * Kesehatan platform (khusus Superadmin) — pelengkap di bawah analitik nasional.
 * Menjawab "apakah sistem berjalan?": status operasional, skala, aktivitas,
 * pintasan pengelolaan. Tiap bagian Suspense-streamed (non-blocking).
 */
export default function PlatformHealth() {
  return (
    <div className="space-y-8 border-t border-slate-200 pt-10">
      <div>
        <h2 className="font-display text-lg font-bold text-[#0F172A]">Kesehatan platform</h2>
        <p className="mt-0.5 text-sm text-slate-500">Status operasional & pengelolaan sistem.</p>
      </div>

      <Suspense fallback={<StatusStripSkeleton />}>
        <StatusStrip />
      </Suspense>

      <Suspense fallback={<StatGridSkeleton count={4} />}>
        <ScaleStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Suspense fallback={<CardSkeleton title="Aktivitas sistem" lines={5} />}>
          <SystemActivity />
        </Suspense>
        <ManagementShortcuts />
      </div>
    </div>
  );
}

async function StatusStrip() {
  const [encAktif, consentGrouped, totalSiswa] = await Promise.all([
    prisma.encryptionKey.count({ where: { aktif: true } }),
    prisma.siswa.groupBy({ by: ["consentStatus"], _count: true }),
    prisma.siswa.count(),
  ]);
  const granted = consentGrouped.find((c) => c.consentStatus === "granted")?._count ?? 0;
  const consentPct = totalSiswa > 0 ? Math.round((granted / totalSiswa) * 100) : 0;
  const items = [
    { icon: Database, label: "Basis data", value: "Terhubung", ok: true },
    { icon: KeyRound, label: "Enkripsi PII", value: encAktif > 0 ? `${encAktif} kunci aktif` : "Belum disiapkan", ok: encAktif > 0 },
    { icon: ShieldCheck, label: "Persetujuan PDP", value: `${consentPct}% siswa`, ok: consentPct >= 50 },
  ];
  return (
    <section aria-label="Status sistem" className="rounded-xl border border-slate-200 bg-white">
      <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 px-5 py-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
                  {s.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

async function ScaleStats() {
  const [totalSekolah, totalWilayah, totalUser, userNonaktif, auditHariIni] = await Promise.all([
    prisma.sekolah.count(),
    prisma.wilayah.count(),
    prisma.user.count(),
    prisma.user.count({ where: { aktif: false } }),
    prisma.auditLog.count({ where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Sekolah terdaftar" value={totalSekolah} accent="brand" sub={`di ${totalWilayah} wilayah`} />
      <StatTile label="Pengguna sistem" value={totalUser} accent="brand" sub={userNonaktif > 0 ? `${userNonaktif} nonaktif` : "semua aktif"} />
      <StatTile label="Aktivitas 24 jam" value={auditHariIni} accent="brand" sub="entri audit" />
      <StatTile label="Wilayah" value={totalWilayah} accent="brand" />
    </div>
  );
}

async function SystemActivity() {
  const recent = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 8,
    select: { id: true, aksi: true, timestamp: true, user: { select: { nama: true } } },
  });
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <Activity className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
          Aktivitas sistem
        </h3>
        <Link href="/dashboard/admin/audit" className="inline-flex items-center gap-1 text-xs font-medium text-[#005D4C] hover:underline underline-offset-2">
          Audit log <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {recent.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm text-slate-800">{aksiLabel(a.aksi)}</p>
                <p className="truncate text-xs text-slate-400">
                  {a.user.nama} · <time dateTime={a.timestamp.toISOString()}>{timeAgo(a.timestamp)}</time>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const SHORTCUT_CARDS = [
  { href: "/dashboard/admin/tenant", icon: Building2, label: "Manajemen Tenant", desc: "Sekolah & status aktivasi" },
  { href: "/dashboard/admin/users", icon: Users, label: "Manajemen User", desc: "Akun, peran, akses" },
  { href: "/dashboard/admin/audit", icon: ScrollText, label: "Audit Log", desc: "Jejak aktivitas & login" },
  { href: "/dashboard/admin/security", icon: ShieldCheck, label: "Security Center", desc: "PDP, enkripsi, retensi" },
] as const;

function ManagementShortcuts() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {SHORTCUT_CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#005D4C]/40 focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#005D4C]/10 text-[#005D4C]">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{c.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{c.desc}</p>
          </Link>
        );
      })}
    </section>
  );
}

function StatusStripSkeleton() {
  return <div className="h-20 w-full animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />;
}
function StatGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
function CardSkeleton({ title, lines }: { title: string; lines: number }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-display text-base font-semibold text-slate-300">{title}</h3>
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        ))}
      </div>
    </section>
  );
}
