import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { roleLabel } from "@/lib/nav";
import { audit } from "@/lib/audit";
import { aksiLabel } from "@/lib/auditLabels";
import { fmtDateTime } from "@/lib/format";
import { PageHeader, StatTile, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

/**
 * Audit Log (Superadmin) — jejak aktivitas append-only (UU PDP): siapa,
 * melakukan apa, terhadap apa, kapan, dari IP mana.
 */
export default async function AuditPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/audit");
  requireRole(ctx, "superadmin");

  const sejak24 = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sejak7h = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [logs, total, count24, count7h] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
      select: {
        id: true,
        aksi: true,
        target: true,
        ip: true,
        timestamp: true,
        user: { select: { nama: true, role: true } },
      },
    }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: sejak24 } } }),
    prisma.auditLog.count({ where: { timestamp: { gte: sejak7h } } }),
  ]);

  await audit(ctx, "view_audit", "audit:list");

  return (
    <>
      <PageHeader
        title="Audit Log"
        desc="Jejak aktivitas sistem yang tidak dapat diubah — dasar akuntabilitas dan kepatuhan UU PDP."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total entri" value={total.toLocaleString("id-ID")} accent="brand" />
        <StatTile label="24 jam terakhir" value={count24} accent="brand" />
        <StatTile label="7 hari terakhir" value={count7h} accent="brand" />
      </div>

      {logs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<ScrollText className="h-6 w-6" aria-hidden="true" />}
            title="Belum ada aktivitas"
            desc="Audit log akan terisi saat pengguna mengakses atau mengubah data."
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Waktu</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Pengguna</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Aktivitas</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Target</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-slate-500">
                      <time dateTime={l.timestamp.toISOString()}>{fmtDateTime(l.timestamp)}</time>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{l.user.nama}</span>
                      <span className="block text-xs text-slate-400">{roleLabel(l.user.role)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{aksiLabel(l.aksi)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-500">{l.target}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Menampilkan {logs.length} entri terbaru. Log bersifat append-only dan disimpan sesuai
        kebijakan retensi.
      </p>
    </>
  );
}
