import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { audit } from "@/lib/audit";
import { aksiLabel } from "@/lib/auditLabels";
import { fmtDateTime } from "@/lib/format";
import { auditActivityTrend, auditByAksi } from "@/lib/analytics";
import { PageHeader, StatTile, Panel, ChartSkeleton } from "@/components/dashboard/ui";
import { Pagination } from "@/components/dashboard/Pagination";
import { SingleAreaChart } from "@/components/charts/recharts/SingleAreaChart";
import { HorizontalBarChart } from "@/components/charts/recharts/HorizontalBarChart";
import { AuditTable } from "@/components/dashboard/AuditTable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * Audit Log (Superadmin) — jejak aktivitas append-only (UU PDP): tren aktivitas,
 * komposisi jenis aksi, dan tabel rinci siapa-apa-kapan-dari mana.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireDashboardContext("/dashboard/admin/audit");
  requireRole(ctx, "superadmin");
  await audit(ctx, "view_audit", "audit:list");
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageStr, 10) || 1);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Log"
        desc="Jejak aktivitas sistem yang tidak dapat diubah — dasar akuntabilitas dan kepatuhan UU PDP."
      />

      <Suspense fallback={<KpiSkeleton />}>
        <AuditKpis />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel title="Tren aktivitas (14 hari)" desc="Volume aktivitas tercatat per hari.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <TrendSection />
          </Suspense>
        </Panel>
        <Panel title="Jenis aktivitas terbanyak" desc="Komposisi aksi tercatat.">
          <Suspense fallback={<ChartSkeleton h={220} />}>
            <AksiSection />
          </Suspense>
        </Panel>
      </div>

      <Panel title="Jejak aktivitas terbaru" desc="Diurutkan dari yang paling baru. Log bersifat append-only.">
        <Suspense fallback={<ChartSkeleton h={240} />}>
          <AuditTableSection page={page} />
        </Suspense>
      </Panel>
    </div>
  );
}

async function AuditKpis() {
  const sejak24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sejak7h = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [total, count24, count7h, penggunaAktif] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: sejak24 } } }),
    prisma.auditLog.count({ where: { timestamp: { gte: sejak7h } } }),
    prisma.auditLog.findMany({ where: { timestamp: { gte: sejak7h } }, select: { userId: true }, distinct: ["userId"] }),
  ]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Total entri" value={total.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="24 jam terakhir" value={count24.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="7 hari terakhir" value={count7h.toLocaleString("id-ID")} accent="brand" />
      <StatTile label="Pengguna aktif (7h)" value={penggunaAktif.length.toLocaleString("id-ID")} accent="hijau" sub="punya aktivitas" />
    </div>
  );
}

async function TrendSection() {
  const rows = await auditActivityTrend(14);
  if (rows.every((r) => r.value === 0)) return <p className="text-sm text-slate-500">Belum ada aktivitas dalam 14 hari.</p>;
  return <SingleAreaChart name="Aktivitas" data={rows} />;
}

async function AksiSection() {
  const rows = await auditByAksi(8);
  if (rows.length === 0) return <p className="text-sm text-slate-500">Belum ada aktivitas.</p>;
  return <HorizontalBarChart seriesName="Entri" data={rows.map((r) => ({ label: aksiLabel(r.aksi), value: r.count }))} />;
}

async function AuditTableSection({ page }: { page: number }) {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: { id: true, aksi: true, target: true, ip: true, timestamp: true, user: { select: { nama: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  const rows = logs.map((l) => ({
    id: l.id,
    waktu: l.timestamp.toISOString(),
    waktuLabel: fmtDateTime(l.timestamp),
    pengguna: l.user.nama,
    peran: roleLabel(l.user.role),
    aksi: aksiLabel(l.aksi),
    target: l.target,
    ip: l.ip ?? "—",
  }));
  return (
    <>
      <AuditTable rows={rows} />
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        basePath="/dashboard/admin/audit"
      />
    </>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />
      ))}
    </div>
  );
}
