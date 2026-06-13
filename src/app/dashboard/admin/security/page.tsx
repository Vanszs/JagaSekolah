import { KeyRound, ShieldCheck, Clock, FileCheck2 } from "lucide-react";
import type { ConsentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { requireRole } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { PageHeader, StatTile } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const CONSENT_META: Record<ConsentStatus, { label: string; bar: string; text: string; desc: string }> = {
  granted: { label: "Disetujui", bar: "bg-emerald-500", text: "text-emerald-700", desc: "boleh diproses untuk scoring" },
  pending: { label: "Menunggu", bar: "bg-amber-500", text: "text-amber-700", desc: "belum diproses" },
  revoked: { label: "Dicabut", bar: "bg-red-500", text: "text-red-700", desc: "pemrosesan dihentikan" },
};

function retensiHari(envKey: string, fallback: number): number {
  const v = Number(process.env[envKey]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

// Definisi retensi (statik) — nilai hari dibaca dari env saat render.
const RETENSI_DEFS: { label: string; envKey: string; fallback: number; Icon: typeof FileCheck2 }[] = [
  { label: "Data siswa nonaktif", envKey: "RETENTION_SISWA_HARI", fallback: 730, Icon: FileCheck2 },
  { label: "Audit log", envKey: "RETENTION_AUDIT_HARI", fallback: 1825, Icon: ShieldCheck },
  { label: "Log sinkronisasi", envKey: "RETENTION_SYNC_HARI", fallback: 90, Icon: Clock },
];

/**
 * Security Center (Superadmin) — postur privasi & keamanan platform:
 * status persetujuan PDP (data anak), enkripsi PII (envelope), dan kebijakan
 * retensi data. Menjawab "apakah data terlindungi & patuh?".
 */
export default async function SecurityPage() {
  const ctx = await requireDashboardContext("/dashboard/admin/security");
  requireRole(ctx, "superadmin");

  const [consentGrouped, totalSiswa, encAktif, encTotal] = await Promise.all([
    prisma.siswa.groupBy({ by: ["consentStatus"], _count: true }),
    prisma.siswa.count(),
    prisma.encryptionKey.count({ where: { aktif: true } }),
    prisma.encryptionKey.count(),
  ]);

  await audit(ctx, "view_security", "security:overview");

  const consentCount = (s: ConsentStatus) =>
    consentGrouped.find((c) => c.consentStatus === s)?._count ?? 0;
  const pct = (n: number) => (totalSiswa > 0 ? Math.round((n / totalSiswa) * 100) : 0);

  const retensi = RETENSI_DEFS.map((r) => ({
    label: r.label,
    hari: retensiHari(r.envKey, r.fallback),
    Icon: r.Icon,
  }));

  const masterKeySet = !!(process.env.PII_MASTER_KEY || process.env.PII_ENCRYPTION_KEY);

  return (
    <>
      <PageHeader
        title="Security Center"
        desc="Postur privasi & keamanan platform: persetujuan PDP, enkripsi data, dan kebijakan retensi."
      />

      {/* Enkripsi PII */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <KeyRound className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
          Enkripsi PII (envelope)
        </h2>
        <p className="mt-1 max-w-prose text-sm text-slate-500">
          Data pribadi sensitif disimpan terenkripsi. Data key per-record dibungkus master key —
          rotasi tanpa enkripsi ulang seluruh basis data.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatTile label="Data key aktif" value={encAktif} accent={encAktif > 0 ? "hijau" : "kuning"} sub={`${encTotal} total`} />
          <StatTile
            label="Master key"
            value={masterKeySet ? "Terpasang" : "Belum"}
            accent={masterKeySet ? "hijau" : "merah"}
            sub="dari environment / KMS"
          />
          <StatTile
            label="Status"
            value={encAktif > 0 && masterKeySet ? "Terlindungi" : "Perlu setup"}
            accent={encAktif > 0 && masterKeySet ? "hijau" : "kuning"}
          />
        </div>
      </section>

      {/* Persetujuan PDP */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <ShieldCheck className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
          Persetujuan PDP (data anak)
        </h2>
        <p className="mt-1 max-w-prose text-sm text-slate-500">
          Hanya siswa dengan persetujuan ortu/wali yang boleh diproses untuk scoring. Tanpa
          persetujuan, data tidak dihitung.
        </p>

        {totalSiswa === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada data siswa.</p>
        ) : (
          <>
            <div
              className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100"
              aria-hidden="true"
            >
              {(["granted", "pending", "revoked"] as ConsentStatus[]).map((s) => {
                const p = pct(consentCount(s));
                return p > 0 ? <div key={s} className={CONSENT_META[s].bar} style={{ width: `${p}%` }} /> : null;
              })}
            </div>
            <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(["granted", "pending", "revoked"] as ConsentStatus[]).map((s) => (
                <div key={s}>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${CONSENT_META[s].bar}`} aria-hidden="true" />
                    {CONSENT_META[s].label}
                  </dt>
                  <dd className="mt-1">
                    <span className="text-xl font-semibold tabular-nums text-slate-900">
                      {consentCount(s).toLocaleString("id-ID")}
                    </span>
                    <span className={`ml-1.5 text-sm font-medium ${CONSENT_META[s].text}`}>{pct(consentCount(s))}%</span>
                    <p className="mt-0.5 text-xs text-slate-400">{CONSENT_META[s].desc}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>

      {/* Retensi */}
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <Clock className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
          Kebijakan retensi data
        </h2>
        <p className="mt-1 max-w-prose text-sm text-slate-500">
          Data dihapus otomatis setelah masa simpan berakhir (UU PDP — minimalisasi data).
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {retensi.map(({ label, hari, Icon }) => (
            <li key={label} className="flex items-center gap-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm text-slate-700">{label}</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900">
                {hari} hari
                <span className="ml-1 text-xs font-normal text-slate-400">
                  (~{Math.round((hari / 365) * 10) / 10} thn)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
