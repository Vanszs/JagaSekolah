import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb, TriangleAlert } from "lucide-react";
import type { AbsensiStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { resolveSiswa } from "@/lib/resolveSiswa";
import { AuthError } from "@/lib/rbac";
import { RiskBadge, EmptyState, Panel } from "@/components/dashboard/ui";
import { IntervensiManager } from "@/components/dashboard/IntervensiManager";
import { ConsentManager } from "@/components/dashboard/ConsentManager";
import { parseAlasan } from "@/lib/parseAlasan";

export const dynamic = "force-dynamic";

export default async function SiswaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireDashboardContext(`/dashboard/siswa/${id}`);

  // IDOR-safe: notFound() melempar kontrol-alur Next, jadi panggil DI LUAR
  // try/catch. Tangkap AuthError jadi sentinel, lalu notFound() setelahnya.
  let allowed = true;
  try {
    await resolveSiswa(ctx, id);
  } catch (e) {
    if (e instanceof AuthError) allowed = false;
    else throw e;
  }
  if (!allowed) notFound();

  const siswa = await prisma.siswa.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      nisn: true,
      jenisKelamin: true,
      penerimaKip: true,
      consentStatus: true,
      kelas: { select: { nama: true } },
      risiko: {
        where: { isLatest: true },
        select: { kategori: true, skor: true, alasanJson: true, tanggalHitung: true, configVersion: true },
        take: 1,
      },
      nilai: { orderBy: { periode: "desc" }, take: 6, select: { mapel: true, periode: true, nilai: true, kkm: true } },
      intervensi: {
        where: { deletedAt: null },
        orderBy: { tanggal: "desc" },
        select: { id: true, tanggal: true, jenis: true, catatan: true, version: true, olehUserId: true, oleh: { select: { nama: true } } },
      },
    },
  });
  if (!siswa) notFound();

  // Ringkasan absensi 30 hari terakhir
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const absensi = await prisma.absensi.groupBy({
    by: ["status"],
    where: { siswaId: id, tanggal: { gte: since } },
    _count: true,
  });
  const absCount = (s: AbsensiStatus) => absensi.find((a) => a.status === s)?._count ?? 0;
  const totalAbs = absensi.reduce((acc, a) => acc + a._count, 0);
  const alpa = absCount("alpa");
  const pctAlpa = totalAbs > 0 ? Math.round((alpa / totalAbs) * 100) : 0;

  const risiko = siswa.risiko[0] ?? null;
  const { alasan, saran } = risiko ? parseAlasan(risiko.alasanJson) : { alasan: [], saran: [] };

  return (
    <>
      <Link
        href="/dashboard/siswa"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Daftar Siswa
      </Link>

      {/* Header siswa */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">{siswa.nama}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {siswa.kelas.nama} · NISN <span className="tabular-nums">{siswa.nisn}</span>
            {siswa.jenisKelamin && (
              <> · {siswa.jenisKelamin === "L" ? "Laki-laki" : siswa.jenisKelamin === "P" ? "Perempuan" : siswa.jenisKelamin}</>
            )}
            {siswa.penerimaKip && (
              <span className="ml-2 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                Penerima KIP
              </span>
            )}
          </p>
        </div>
        {risiko && (
          <div className="text-right">
            <RiskBadge kategori={risiko.kategori} />
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{Math.round(risiko.skor)}<span className="text-sm font-normal text-slate-400">/100</span></p>
          </div>
        )}
      </div>

      {!risiko ? (
        <div className="mt-6">
          <EmptyState
            icon={<TriangleAlert className="h-6 w-6" aria-hidden="true" />}
            title="Skor risiko belum dihitung"
            desc="Data risiko siswa ini belum tersedia. Jalankan perhitungan skor terlebih dulu."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Panel title="Mengapa ditandai begini" className="[&>div:first-child]:flex [&>div:first-child]:items-center [&>div:first-child]:gap-2">
            {alasan.length > 0 ? (
              <ul className="space-y-2">
                {alasan.map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Tidak ada alasan spesifik tercatat.</p>
            )}
          </Panel>

          <div className="rounded-lg border border-[#005D4C]/20 bg-[#005D4C]/[0.03] p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
              <Lightbulb className="h-4 w-4 text-[#005D4C]" aria-hidden="true" />
              Saran tindakan
            </h2>
            {saran.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {saran.map((s) => (
                  <li key={s} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#005D4C]" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Belum ada saran tindakan.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Panel title="Kehadiran 30 hari">
          {totalAbs === 0 ? (
            <p className="text-sm text-slate-500">Belum ada catatan kehadiran.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                <span className="font-semibold tabular-nums text-slate-900">{pctAlpa}%</span> alpa
                <span className="text-slate-400"> ({alpa} dari {totalAbs} hari tercatat)</span>
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
                {(["hadir", "izin", "sakit"] as AbsensiStatus[]).map((s) => (
                  <div key={s} className="rounded-lg bg-slate-50 py-2">
                    <dt className="text-xs capitalize text-slate-500">{s}</dt>
                    <dd className="text-base font-semibold tabular-nums text-slate-900">{absCount(s)}</dd>
                  </div>
                ))}
                {(["alpa", "telat"] as AbsensiStatus[]).map((s) => (
                  <div key={s} className="rounded-lg bg-red-50 py-2">
                    <dt className="text-xs capitalize text-red-600">{s}</dt>
                    <dd className="text-base font-semibold tabular-nums text-red-700">{absCount(s)}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Panel>

        <Panel title="Nilai terbaru">
          {siswa.nilai.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada nilai tercatat.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {siswa.nilai.map((n) => {
                const below = n.nilai < n.kkm;
                return (
                  <li key={`${n.mapel}-${n.periode}`} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">
                      {n.mapel} <span className="text-xs text-slate-400">· {n.periode}</span>
                    </span>
                    <span className={`font-semibold tabular-nums ${below ? "text-red-600" : "text-slate-900"}`}>
                      {n.nilai}
                      {below && <span className="ml-1 text-xs font-normal text-red-400">&lt; KKM {n.kkm}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Riwayat & tindak lanjut (CRUD) */}
      <IntervensiManager
        siswaId={siswa.id}
        currentUserId={ctx.userId}
        canEditAll={ctx.role === "kepsek" || ctx.role === "superadmin"}
        items={siswa.intervensi.map((it) => ({
          id: it.id,
          tanggal: it.tanggal.toISOString(),
          jenis: it.jenis,
          catatan: it.catatan,
          version: it.version,
          olehUserId: it.olehUserId,
          olehNama: it.oleh.nama,
        }))}
      />

      <ConsentManager siswaId={siswa.id} status={siswa.consentStatus} />

      {risiko && (
        <p className="mt-5 text-xs text-slate-400">
          Skor dihitung otomatis (rule-based, transparan) · versi konfigurasi{" "}
          <span className="font-mono">{risiko.configVersion.slice(0, 8)}</span> ·{" "}
          {risiko.tanggalHitung.toLocaleDateString("id-ID")}
        </p>
      )}
    </>
  );
}
